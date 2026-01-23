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
async function vonageTellsUsReportIsReady(req, res) {    

    const { request_id, _links } = req.body;
    
    if (!_links?.download_report?.href) {
        console.log('Missing download link');
        return res.status(200).json({ message: 'Missing download link' });
    }

    const token = req.params.token;
    if (!token) {
        console.log('Missing token in callback');
        return res.status(200).json({ message: 'Missing token in callback' });
    }
        
    // All the information we need is inside this encoded token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || config.SECRET);
    if (!decoded) {
        console.warn(`Skipping report ${request_id} — invalid data`);
    }

    try {
        const authString = `Basic ${Buffer.from(`${decoded.apiKey}:${decoded.apiSecret}`).toString('base64')}`;
        const downloadUrl = _links.download_report.href;
        const DOWNLOAD_FOLDER = path.resolve(__dirname, '../downloads');
        const filename = `report_${Date.now()}.zip`;
        const filePath = path.join(DOWNLOAD_FOLDER, filename);

        if (!fs.existsSync(DOWNLOAD_FOLDER)) {
            fs.mkdirSync(DOWNLOAD_FOLDER, { recursive: true });
        }
        
        // Download CSV file
        const responseCSV = await axios.get(downloadUrl, { 
            responseType: 'stream',
            headers: {
                'Authorization': authString, 
            }
        });
        const writer = fs.createWriteStream(filePath);
        responseCSV.data.pipe(writer);

        await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });

        // Unzip the file
        const zip = new AdmZip(filePath);
        const zipEntries = zip.getEntries();
        if (zipEntries.length === 0) {
            throw new Error('ZIP file is empty');
        }

        // Assume the first CSV inside is the one we want
        const extractedCsvFile = zipEntries.find(entry => entry.entryName.endsWith('.csv'));
        if (!extractedCsvFile) {
            throw new Error('No CSV file found inside ZIP');
        }

        const extractedPath = path.join(DOWNLOAD_FOLDER, extractedCsvFile.entryName);
        zip.extractEntryTo(extractedCsvFile.entryName, DOWNLOAD_FOLDER, false, true);

        // Inform
        console.log(`Report downloaded an unzipped ${request_id}`);
        res.status(200).json({ success: true });

        updateReport(request_id, {
            ready: true,
            csvPath: extractedPath,
            completedAt: Date.now()
        });

        return extractedPath;

    } catch (err) {
        console.error(`Error checking report ${request_id}:`, err.stack || err.message || err);
        return res.status(200).json({ message: 'Error checking report: ' + err.message });
    }

}

module.exports = {
    vonageTellsUsReportIsReady
}