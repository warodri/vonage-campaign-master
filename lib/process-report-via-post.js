const axios = require('axios');
const { analyseReportWithTotals } = require('./reportAnalyserWithTotals');
const config = require('../config');

/**
 * This process is the same functionality as the one from the UI.
 * The only difference is that this comes from a POSTMAN (or similar) request.
 * 
 * 1) Receives the information (credentials included).
 * 2) Calls Vonage for the Vonage Report.
 * 3) Waits until the report is ready.
 * 4) Opens the ZIP file and processes the CSV.
 * 5) Returns the result of the process to POSTMAN.
 * 
 */
async function run(req, res, payload) {
    let pollInterval = null;
    
    try {
        // Get the base URL from the request or use environment variable
        const baseURL = config.SERVER_URL || `${req.protocol}://${req.get('host')}`;
        
        // 1. Send the POST internally...
        const askResponse = await axios.post(`${baseURL}/ask-report-with-credentials`, payload, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 30000
        });    
        
        const askData = askResponse.data;
        
        if (!askData.success || !askData.request_id) {
            return res.status(400).json({
                success: false,
                message: 'Failed to request report',
            });
        }
    
        const requestId = askData.request_id;

        // 2. Poll readiness with timeout protection
        const maxPollingTime = 5 * 60 * 1000; // 5 minutes max
        const pollStartTime = Date.now();
        
        pollInterval = setInterval(async () => {
            try {
                // Check if we've exceeded max polling time
                if (Date.now() - pollStartTime > maxPollingTime) {
                    clearInterval(pollInterval);
                    return res.status(408).json({
                        success: false,
                        message: 'Report generation timed out'
                    });
                }

                const readyRes = await axios.get(`${baseURL}/reports/ready/${requestId}`, {
                    timeout: 10000 // 10 second timeout for each poll
                });
                const readyData = readyRes.data;
        
                if (readyData.success && readyData.ready) {
                    clearInterval(pollInterval);

                    const csvPath = readyData.csvPath;
                    const payload = readyData.payload.payload;

                    const dateFrom = payload.dateFrom;
                    const dateTo = payload.dateTo;
                    const accountId = payload.accountId;
                    const groupBy = payload.groupBy;
                    const internalGroupBy = payload.internalGroupBy;
                    const showTotalBy = payload.showTotalBy;
                    const priceColumns = payload.priceColumns;

                    const accountIdArray = accountId ? [accountId] : [];
                    const internalGroupByArray = ensureArray(internalGroupBy);
                    const showTotalByArray = ensureArray(showTotalBy);
                    const priceColumnsArray = ensureArray(priceColumns);                

                    // 3. Generate the report
                    const reportData = await analyseReportWithTotals(
                        csvPath,
                        accountIdArray,
                        groupBy,
                        internalGroupByArray,
                        showTotalByArray,
                        priceColumnsArray
                    );

                    // 4. Return result
                    return res.status(200).json({
                        success: true,
                        csvPath,
                        report: {
                            title: 'Pivot Report',
                            data: reportData,
                            dateFrom,
                            dateTo,
                            accountId,
                            groupBy,
                            internalGroupBy: internalGroupBy,
                            showTotalBy: showTotalBy,
                            priceColumns: priceColumns,
                        }
                    });
                    
                }
            } catch (pollError) {
                console.error('Polling error:', pollError.message);
                // Don't stop polling on individual poll failures
                // unless it's a 404 or other fatal error
                if (pollError.response && pollError.response.status === 404) {
                    clearInterval(pollInterval);
                    return res.status(404).json({
                        success: false,
                        message: 'Report request not found'
                    });
                }
            }
        }, 4000);

    } catch(ex) {

        if (pollInterval) {
            clearInterval(pollInterval);
        }
        
        console.error('Error in processReportViaPost:', ex.message);
        
        // Use appropriate status code based on error type
        const statusCode = ex.response?.status || 500;
        
        res.status(statusCode).json({
            success: false,
            message: ex.response?.data?.message || ex.message
        })
        
    }
}

function ensureArray(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
        return value.split(',').map(v => v.trim()).filter(Boolean);
    }
    return [];
}

module.exports = {
    run
};