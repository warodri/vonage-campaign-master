const fs = require("fs");
const path = require("path");
const unzipper = require("unzipper");

/**
 * This is the reports API ZIP file
 */
async function unzipAndDelete(zipPath) {
    try {
        if (!fs.existsSync(zipPath)) {
            throw new Error(`File not found: ${zipPath}`);
        }

        const extractDir = zipPath.replace(/\.zip$/i, "");

        // Ensure output folder exists
        if (!fs.existsSync(extractDir)) {
            fs.mkdirSync(extractDir, { recursive: true });
        }

        // Perform extraction
        await fs.createReadStream(zipPath)
            .pipe(unzipper.Extract({ path: extractDir }))
            .promise();

        console.log(`✔ Unzipped into: ${extractDir}`);

        // Delete the ZIP file
        fs.unlinkSync(zipPath);
        console.log(`✔ Deleted ZIP file: ${zipPath}`);

        // Find CSV file inside extracted directory
        const files = fs.readdirSync(extractDir);
        const csvFile = files.find(f => f.toLowerCase().endsWith(".csv"));

        if (!csvFile) {
            throw new Error("No CSV file found in extracted ZIP.");
        }

        const csvFullPath = path.join(extractDir, csvFile);
        console.log(`✔ CSV found: ${csvFullPath}`);

        return csvFullPath;

    } catch (err) {
        console.error("❌ unzipAndDelete error:", err);
        throw err;
    }
}

module.exports = {
    unzipAndDelete
}