module.exports = {
    apiKey: process.env.VCR_API_ACCOUNT_ID || '',
    apiSecret: process.env.VCR_API_ACCOUNT_SECRET || '',
    PORT: process.env.VCR_PORT || 3003,
    SERVER_URL: process.env.VCR_INSTANCE_PUBLIC_URL || 'https://bce81466a101.ngrok-free.app',
    SECRET: 'Lrba8GyBhL5hsm5gkgu1', //  You can change this.
    ADMIN: 'admin@vonage.com',      //  You can change this. But this is the first Email that can create other emails.
}