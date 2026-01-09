const { askForReport } = require('./ask-for-report');
const { addReport } = require('./reportStore');

async function run(req, res, apiKey, apiSecret) {
    const {
        accountId,
        dateFrom,
        dateTo,
        includeSubaccounts,
        groupBy,
        internalGroupBy,
        showTotalBy,
        priceColumns
    } = req.body;

    if (!dateFrom || !dateTo) {
        return res.status(400).render('error', {
            error: 'Date range is required',
            title: 'Error'
        });
    }

    const response = await askForReport(
        apiKey,
        apiSecret,
        accountId,
        dateFrom,
        dateTo,
        includeSubaccounts,
        groupBy,
        internalGroupBy,
        showTotalBy,
        priceColumns
    );

    if (response) {

        const requestId = response.request_id;

        //  Store for later
        addReport({
            requestId,
            payload: req.body,
            ready: false,
            csvPath: null,
            createdAt: Date.now()
        });

        return res.status(200).json({
            success: true,
            request_id: requestId
        })

    } else {
        return res.status(200).json({
            success: false
        })
    }
}

module.exports = {
    run
}