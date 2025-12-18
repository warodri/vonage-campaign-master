module.exports = {
    apiKey: process.env.VCR_API_ACCOUNT_ID || '',
    apiSecret: process.env.VCR_API_ACCOUNT_SECRET || '',
    PORT: process.env.VCR_PORT || 3003,
    SERVER_URL: process.env.VCR_INSTANCE_PUBLIC_URL || 'http://localhost:3003',
    SECRET: 'Lrba8GyBhL5hsm5gkgu1',
    ADMIN: 'admin@vonage.com',
}