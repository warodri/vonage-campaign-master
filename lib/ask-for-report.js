const jwt = require('jsonwebtoken');
const axios = require("axios");
const config = require('../config');

/**
 * This process will ask Vonage for a report.
 * Credentials are needed.
 */
async function askForReport(
    accountId, 
    startDate, 
    endDate,
    includeSubaccounts, 
    groupBy,
    internalGroupBy,
    showTotalBy,
    priceColumns
) {
    /**
     * This is the payload ewncrypted
     * to send and then receive.
     */
    const encriptedData = jwt.sign({ 
        accountId,
        startDate,
        endDate,
        includeSubaccounts, 
        groupBy,
        internalGroupBy,
        showTotalBy,
        priceColumns
     }, config.JWT_SECRET, {
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

    const basicAuth = Buffer.from(`${config.apiKey}:${config.apiSecret}`).toString('base64');

    const headers = {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/json',
    };    

    try {
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
    
    } catch(ex) {
        console.log(ex.message);
        return {
            request_id: null,
            statusUrl: null,
            token: null
        };
    }
}

module.exports = {
    askForReport
}

