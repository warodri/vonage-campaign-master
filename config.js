const path = require('path');
const crypto = require('crypto');

module.exports = {
    apiKey: process.env.VCR_API_ACCOUNT_ID || '',
    apiSecret: process.env.VCR_API_ACCOUNT_SECRET || '',
    PORT: process.env.VCR_PORT || 3003,
    SERVER_URL: process.env.VCR_INSTANCE_PUBLIC_URL,
    JWT_SECRET: process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex'),
    ADMIN: 'admin@vonage.com',      //  You can change this. But this is the first Email that can create other emails.
    DOWNLOAD_FOLDER: path.resolve(__dirname, './downloads'),  

}