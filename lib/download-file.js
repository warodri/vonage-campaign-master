const axios = require("axios");
const fs = require("fs");

async function downloadFile(url, outputPath) {
    const response = await axios({
        method: "GET",
        url,
        responseType: "stream"   // Important!
    });

    return new Promise((resolve, reject) => {
        const stream = response.data.pipe(fs.createWriteStream(outputPath));
        stream.on("finish", resolve);
        stream.on("error", reject);
    });
}

module.exports = {
    downloadFile
}