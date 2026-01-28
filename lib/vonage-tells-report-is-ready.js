const jwt = require('jsonwebtoken');
const axios = require("axios");
const fs = require("fs");
const AdmZip = require('adm-zip');
const path = require('path');
const { updateReport } = require('./reportStore');
const config = require('../config');

/**
 * When the report is ready, Vonage sends us this information
 */
/**
 * When the report is ready, Vonage sends us this information.
 * Refactored to prevent Zip Slip and Path Traversal vulnerabilities.
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
        const DOWNLOAD_FOLDER = config.DOWNLOAD_FOLDER;
        
        // Ensure the download directory exists
        if (!fs.existsSync(DOWNLOAD_FOLDER)) {
            fs.mkdirSync(DOWNLOAD_FOLDER, { recursive: true });
        }

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

        /**
         * SECURITY FIX: ZIP SLIP PROTECTION
         * path.basename() strips any directory paths (like ../../etc/) 
         * provided by the attacker in the ZIP entry name.
         */
        const safeFileName = path.basename(extractedCsvFile.entryName);
        const finalCsvPath = path.join(DOWNLOAD_FOLDER, safeFileName);

        // Double-check the path is still inside the sandbox
        if (!finalCsvPath.startsWith(DOWNLOAD_FOLDER + path.sep)) {
            throw new Error('Security Error: Malicious path detected in ZIP entry');
        }

        // Write the data manually to the safe path
        fs.writeFileSync(finalCsvPath, extractedCsvFile.getData());

        // 5. Update the internal store so the UI knows the file is ready
        updateReport(request_id, {
            ready: true,
            csvPath: finalCsvPath,
            completedAt: Date.now()
        });

        console.log(`[SECURITY] Report ${request_id} safely extracted to ${finalCsvPath}`);
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