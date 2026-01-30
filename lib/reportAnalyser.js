const fs = require('fs');
const { parse } = require('csv-parse');
const {
    detectCurrency,
    groupByAccountId,
    processAccountGroup
} = require('./reportAnalyserCommon');

/**
 * Analyses a CSV report using Streams to prevent Event Loop blocking
 */
async function analyseReport(csvPath, accountIds, groupBy, internalGroupBy, showTotalBy, priceColumns) {
    return new Promise((resolve, reject) => {
        const records = [];
        
        const fileStream = fs.createReadStream(csvPath);

        const parser = fileStream.pipe(
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
        fileStream.on('error', (err) => reject(new Error(`File System Error: ${err.message}`)));
    });
}

module.exports = {
    analyseReport
};