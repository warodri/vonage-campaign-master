const { analyseReport } = require('./reportAnalyser');
const path = require('path');
const fs = require('fs');
const config = require('../config');

async function renderReport(req, res, getLabel) {
    const {
        csvPath,
        dateFrom,
        dateTo,
        accountId,
        groupBy,
        internalGroupBy,
        showTotalBy,
        priceColumns
    } = req.body;

    if (!csvPath || !groupBy || !dateFrom || !dateTo) {
        return res.status(200).render('error', {
            title: 'Error',
            error: 'Missing required report data'
        });
    }

    if (!isSafeCsvPath(csvPath)) {
        return res.status(200).render('error', {
            title: 'Error',
            error: 'Invalid CSV path'
        });
    }

    const accountIdArray = accountId ? [accountId] : [];

    const internalGroupByArray = ensureArray(internalGroupBy);
    const showTotalByArray = ensureArray(showTotalBy);
    const priceColumnsArray = ensureArray(priceColumns);
    
    try {

        const reportData = await analyseReport(
            csvPath,
            accountIdArray,
            groupBy,
            internalGroupByArray,
            showTotalByArray,
            priceColumnsArray
        );
    
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

function isSafeCsvPath(csvPath) {
    const ALLOWED_BASE_DIR = config.DOWNLOAD_FOLDER;

    if (typeof csvPath !== 'string') return false;

    // Block null bytes
    if (csvPath.includes('\0')) return false;

    // Must be absolute (since that's your design)
    if (!path.isAbsolute(csvPath)) return false;

    const resolvedPath = path.resolve(csvPath);

    // Enforce directory sandbox
    if (!resolvedPath.startsWith(ALLOWED_BASE_DIR + path.sep)) {
        return false;
    }

    // Only CSV files
    if (path.extname(resolvedPath).toLowerCase() !== '.csv') {
        return false;
    }

    // Optional but recommended: must exist and be a file
    try {
        const stat = fs.statSync(resolvedPath);
        if (!stat.isFile()) return false;
    } catch {
        return false;
    }

    return true;
}


module.exports = { renderReport };
