const jwt = require('jsonwebtoken');
const axios = require("axios");
const config = require('../config');

async function askForReport(
    apiKey, 
    apiSecret, 
    accountId, 
    startDate, 
    endDate,
    includeSubaccounts, 
    groupBy,
    internalGroupBy,
    showTotalBy,
    priceColumns
) {
    
    const encriptedData = jwt.sign({ 
        apiKey,
        apiSecret,    
        accountId,
        startDate,
        endDate,
        includeSubaccounts, 
        groupBy,
        internalGroupBy,
        showTotalBy,
        priceColumns
     }, process.env.JWT_SECRET || config.SECRET, {
        expiresIn: '5d',
    });

    const requestPayload = {
        account_id: accountId,
        date_start: `${startDate}T00:00:00+00:00`,
        date_end: `${endDate}T23:59:59+00:00`,
        include_subaccounts: includeSubaccounts ? 'true' : 'false',
        product: 'MESSAGES',
        direction: 'outbound',
        callback_url: config.SERVER_URL + '/reports/callback/' + encriptedData, // Vonage will tell me when the report is ready
    };

    const basicAuth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');

    const headers = {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/json',
    };    
    const response = await axios.post(
        'https://api.nexmo.com/v2/reports', 
        requestPayload, 
        { headers }
    );

    console.log('Vonage reponse: ')
    console.dir(response.data)

    return {
        request_id: response.data.request_id,
        statusUrl: response.data._links.self.href,
        token: encriptedData
    };
}

module.exports = {
    askForReport
}

