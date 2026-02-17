const { analyseReport } = require('./reportAnalyser');

async function renderReport(req, res, getLabel) {
    const {
        requestId,
        dateFrom,
        dateTo,
        accountId,
        groupBy,
        internalGroupBy,
        showTotalBy,
        priceColumns
    } = req.body;

    if (!requestId || !groupBy || !dateFrom || !dateTo) {
        return res.status(200).render('error', {
            title: 'Error',
            error: 'Missing required report data (requestId, groupBy, dateFrom, dateTo)'
        });
    }

    const accountIdArray = accountId ? [accountId] : [];

    const internalGroupByArray = ensureArray(internalGroupBy);
    const showTotalByArray = ensureArray(showTotalBy);
    const priceColumnsArray = ensureArray(priceColumns);
    
    try {
        const reportData = await analyseReport(
            requestId,
            accountIdArray,
            groupBy,
            internalGroupByArray,
            showTotalByArray,
            priceColumnsArray
        );

        console.log('============================================')
        console.log('reportData', JSON.stringify(reportData.accounts[0].groups, null, 2));
        console.log('============================================')

        return res.render('report', {
            title: 'Pivot Report',
            data: reportData,
            dateFrom,
            dateTo,
            accountId,
            groupBy,
            internalGroupBy: internalGroupByArray,
            showTotalBy: showTotalByArray,
            priceColumns: priceColumnsArray,
            getLabel
        })
    } catch(ex) {        
        console.log(ex.message);
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

module.exports = { renderReport };
