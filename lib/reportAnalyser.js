const { parse } = require('csv-parse');
const { detectCurrency, groupByAccountId, processAccountGroup } = require('./reportAnalyserCommon');
const { getReport } = require('./reportStore');
const { neru, Assets } = require('neru-alpha');

/**
 * Analyses a CSV report using Streams to prevent Event Loop blocking
 */
async function analyseReport(requestId, accountIds, groupBy, internalGroupBy, showTotalBy, priceColumns) {
    return new Promise( async (resolve, reject) => {
        
        //  This is my repot filename 
        const filename = await getReport(requestId);

        //  The csvPath is /reports/XXXX.csv
        const session = neru.getGlobalSession();
        const assets = new Assets(session);
        console.log('filename.csvPath', filename.csvPath)

        //  Get the file from VCR Assets
        const asset = await assets.getRemoteFile(filename.csvPath).execute();
        console.log('Type:', typeof asset);
        console.log('Has pipe?', typeof asset.pipe);
        console.log('Constructor:', asset.constructor.name);

        //  Parse the content
        const records = [];        
        const parser = asset.pipe(
            parse({
                columns: true,
                skip_empty_lines: true,
                trim: true
            })
        );
        parser.on('data', (record) => {
            if (!accountIds || accountIds.length === 0 || accountIds.includes(record.account_id)) {
                records.push(record);
            }
        });
        parser.on('end', () => {
            if (records.length === 0) {
                return reject(new Error('No matching records found in CSV'));
            }
            try {
                const currency = detectCurrency(records);
                const accountGroups = groupByAccountId(records, accountIds);

                const processedData = accountGroups.map(accountGroup => {
                    return processAccountGroup(
                        accountGroup,
                        groupBy,
                        internalGroupBy,
                        showTotalBy,
                        priceColumns,
                        currency
                    );
                });

                resolve({
                    accounts: processedData,
                    currency,
                    metadata: {
                        totalRecords: records.length,
                        groupBy,
                        internalGroupBy,
                        showTotalBy,
                        priceColumns,
                        generatedAt: new Date().toISOString()
                    }
                });
            } catch (err) {
                reject(err);
            }
        });
        parser.on('error', (err) => reject(new Error(`CSV Parsing Error: ${err.message}`)));
    });
}

module.exports = {
    analyseReport
};