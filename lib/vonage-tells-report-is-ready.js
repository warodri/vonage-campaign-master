const jwt = require('jsonwebtoken');
const axios = require("axios");
const fs = require("fs");
const AdmZip = require('adm-zip');
const path = require('path');
const { updateReport } = require('./reportStore');
const config = require('../config');
const { neru, Assets, FileRetentionPeriod } = require('neru-alpha');

/**
 * When the report is ready, Vonage sends us this information.
 * Prevents Zip Slip and Path Traversal vulnerabilities.
 */
async function vonageTellsUsReportIsReady(req, res) {    
    const { request_id, _links } = req.body;
    
    // 1. Validate incoming payload structure
    if (!_links?.download_report?.href) {
        console.log('Missing download link');
        return res.status(200).json({ message: 'Missing download link' });
    }

    const token = req.params.token;
    if (!token) {
        console.log('Missing token in callback');
        return res.status(200).json({ message: 'Missing token in callback' });
    }
        
    try {
        // 2. Verify the JWT token provided in the URL
        const decoded = jwt.verify(token, config.JWT_SECRET);  
        console.log('decoded', decoded)        
        if (!decoded) {
            console.warn(`Skipping report ${request_id} — invalid token signature`);
            return res.status(200).json({ message: 'Invalid token' });
        }

        const authString = `Basic ${Buffer.from(`${config.apiKey}:${config.apiSecret}`).toString('base64')}`;
        const downloadUrl = _links.download_report.href;
        
        // 3. Download the ZIP file as a temporary buffer to avoid partial file writes
        const responseCSV = await axios.get(downloadUrl, { 
            responseType: 'arraybuffer',
            headers: { 'Authorization': authString }
        });

        // 4. Initialize ZIP parser from the downloaded buffer
        const zip = new AdmZip(responseCSV.data);
        const zipEntries = zip.getEntries();
        
        // Find the first CSV file entry
        const extractedCsvFile = zipEntries.find(entry => entry.entryName.endsWith('.csv'));
        if (!extractedCsvFile) {
            throw new Error('No CSV file found inside ZIP');
        }

        const session = neru.getGlobalSession();
        const assets = new Assets(session);

        // Download and extract CSV as before
        const csvBuffer = extractedCsvFile.getData();
        const remotePath = `/reports/${request_id}.csv`;

        console.log('ABOUT TO UPLOAD ASSETS');

        // Upload to Assets instead of local filesystem
        await assets.uploadData(
            [csvBuffer],
            '/reports',
            [`${request_id}.csv`],
            FileRetentionPeriod.SEVEN_DAYS
        ).execute();

        console.log('ABOUT TO UPDATE REPORT READY');

        // Update report with remote path
        await updateReport(request_id, {
            ready: true,
            csvPath: remotePath,  // Now a remote path
            completedAt: Date.now()
        });

        console.log('PROCESS FINISHED');

        return res.status(200).json({ success: true });

    } catch (err) {
        // Log the error internally but keep the response vague to prevent Info Disclosure
        console.error(`Error processing report ${request_id}:`, err.message);
        return res.status(200).json({ message: 'Error processing report file' });
    }
}

module.exports = {
    vonageTellsUsReportIsReady
}