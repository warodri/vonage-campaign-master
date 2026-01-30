const fs = require('fs');
const { parse } = require('csv-parse');
const {
    detectCurrency,
    groupByAccountId,
    processAccountGroup,
    autoDetectPriceColumns,
    validateColumns
} = require('./reportAnalyserCommon');

/**
 * Analyses a CSV report and generates pivot table data
 */
async function analyseReportWithTotals(csvPath, accountIds, groupBy, internalGroupBy, showTotalBy, priceColumns, debug = false) {
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
                const columns = Object.keys(records[0]);
                
                if (debug && groupBy) {
                    const uniqueValues = [...new Set(records.map(r => r[groupBy] || 'N/A'))];
                    console.log(`DEBUG: Unique values in '${groupBy}' column:`, uniqueValues);
                    console.log(`DEBUG: Total unique groups: ${uniqueValues.length}`);
                }
                
                if (!priceColumns || priceColumns.length === 0) {
                    priceColumns = autoDetectPriceColumns(records, columns);
                }

                validateColumns(columns, groupBy, internalGroupBy, showTotalBy, priceColumns);

                if (accountIds && accountIds.length > 0 && debug) {
                    const allAccountIds = [...new Set(records.map(r => r.account_id))];
                    if (records.length === 0) {
                        console.warn(`⚠️  WARNING: No records found for account IDs: ${accountIds.join(', ')}`);
                        console.warn(`⚠️  Available accounts: ${allAccountIds.join(', ')}`);
                    }
                }

                const currency = detectCurrency(records);
                const accountGroups = groupByAccountId(records, accountIds);

                const processedData = accountGroups.map(accountGroup => {
                    return processAccountGroup(
                        accountGroup,
                        groupBy,
                        internalGroupBy,
                        showTotalBy,
                        priceColumns,
                        currency,
                        debug
                    );
                });

                resolve({
                    accounts: processedData,
                    currency,
                    priceColumns, 
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

/**
 * Converts column names to readable labels
 * Example: "total_price" -> "Total Price"
 */
function getLabel(columnName) {
    if (!columnName) return '';
    
    return columnName
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

module.exports = {
    analyseReportWithTotals,
    getLabel
};