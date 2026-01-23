const fs = require('fs');
const { parse } = require('csv-parse/sync');

/**
 * Analyses a CSV report and generates pivot table data
 * 
 * @param {string} csvPath - Path to where the CSV is located
 * @param {string[]} accountIds - Array of account IDs to filter (empty = all)
 * @param {string} groupBy - Column name to group by (main grouping)
 * @param {string[]} internalGroupBy - Array of column names for nested grouping
 * @param {string[]} showTotalBy - Array of column names to show totals for
 * @param {string[]} priceColumns - Array of column names containing prices
 * @returns {Object} Structured data for EJS template
 */
async function analyseReportWithTotals(csvPath, accountIds, groupBy, internalGroupBy, showTotalBy, priceColumns) {
    try {
        // Read and parse CSV
        const fileContent = fs.readFileSync(csvPath, 'utf-8');
        const records = parse(fileContent, {
            columns: true,
            skip_empty_lines: true,
            trim: true
        });

        if (records.length === 0) {
            throw new Error('CSV file is empty');
        }

        // Get available columns
        const columns = Object.keys(records[0]);
        
        // Debug: Check what values exist in the groupBy column
        if (groupBy) {
            const uniqueValues = [...new Set(records.map(r => r[groupBy] || 'N/A'))];
            console.log(`DEBUG: Unique values in '${groupBy}' column:`, uniqueValues);
            console.log(`DEBUG: Total unique groups: ${uniqueValues.length}`);
        }
        
        // If no priceColumns specified, auto-detect numeric columns that might be prices
        if (!priceColumns || priceColumns.length === 0) {
            priceColumns = autoDetectPriceColumns(records, columns);
        }

        // Validate columns exist
        validateColumns(columns, groupBy, internalGroupBy, showTotalBy, priceColumns);

        // Filter by account IDs if specified
        let filteredRecords = records;
        if (accountIds && accountIds.length > 0) {
            const allAccountIds = [...new Set(records.map(r => r.account_id))];
            
            filteredRecords = records.filter(record =>
                accountIds.includes(record.account_id)
            );
                        
            if (filteredRecords.length === 0) {
                console.warn(`⚠️  WARNING: No records found for account IDs: ${accountIds.join(', ')}`);
                console.warn(`⚠️  Available accounts: ${allAccountIds.join(', ')}`);
            }
        }

        // Detect currency from the first record with a currency value
        const currency = detectCurrency(filteredRecords);

        // Group data by account_id first (if filtering by specific accounts)
        const accountGroups = groupByAccountId(filteredRecords, accountIds);

        // Process each account group
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

        return {
            accounts: processedData,
            currency,
            priceColumns, 
            metadata: {
                totalRecords: filteredRecords.length,
                groupBy,
                internalGroupBy,
                showTotalBy,
                priceColumns,
                generatedAt: new Date().toISOString()
            }
        };

    } catch (error) {
        throw new Error(`Error analysing report: ${error.message}`);
    }
}

/**
 * Auto-detect price/numeric columns from the data
 */
function autoDetectPriceColumns(records, columns) {
    const priceKeywords = ['price', 'cost', 'amount', 'total', 'spend', 'revenue', 'charge', 'fee'];
    const detectedColumns = [];

    columns.forEach(col => {
        const lowerCol = col.toLowerCase();
        const isPriceColumn = priceKeywords.some(keyword => lowerCol.includes(keyword));
        
        if (isPriceColumn) {
            // Verify it contains numeric values
            const sampleValues = records.slice(0, 10);
            const isNumeric = sampleValues.some(record => {
                const value = record[col];
                return value && !isNaN(parseFloat(value));
            });
            
            if (isNumeric) {
                detectedColumns.push(col);
            }
        }
    });

    return detectedColumns;
}

/**
 * Validates that all specified columns exist in the CSV
 */
function validateColumns(availableColumns, groupBy, internalGroupBy, showTotalBy, priceColumns) {
    const requiredColumns = [
        groupBy,
        ...internalGroupBy,
        ...showTotalBy,
        ...priceColumns
    ].filter(Boolean);

    const missingColumns = requiredColumns.filter(col => !availableColumns.includes(col));

    if (missingColumns.length > 0) {
        throw new Error(`Missing columns in CSV: ${missingColumns.join(', ')}`);
    }
}

/**
 * Detects currency from the CSV data
 */
function detectCurrency(records) {
    for (const record of records) {
        if (record.currency) {
            return record.currency;
        }
    }
    return 'USD'; // Default
}

/**
 * Groups records by account_id
 */
function groupByAccountId(records, accountIds) {
    if (!accountIds || accountIds.length === 0) {
        // If no specific accounts, group all records by their account_id
        const grouped = {};
        records.forEach(record => {
            const accountId = record.account_id || 'unknown';
            if (!grouped[accountId]) {
                grouped[accountId] = [];
            }
            grouped[accountId].push(record);
        });
        return Object.entries(grouped).map(([accountId, records]) => ({
            accountId,
            records
        }));
    } else {
        // Group by specified account IDs
        return accountIds.map(accountId => ({
            accountId,
            records: records.filter(r => r.account_id === accountId)
        }));
    }
}

/**
 * Process a single account group
 */
function processAccountGroup(accountGroup, groupBy, internalGroupBy, showTotalBy, priceColumns, currency) {
    const { accountId, records } = accountGroup;

    console.log(`\nDEBUG: Processing account ${accountId} with ${records.length} records`);

    // Group by the main groupBy column
    const mainGroups = {};
    records.forEach(record => {
        // Use the raw value for grouping, handling empty/null values
        const groupValue = record[groupBy] || 'N/A';
        if (!mainGroups[groupValue]) {
            mainGroups[groupValue] = [];
        }
        mainGroups[groupValue].push(record);
    });

    Object.entries(mainGroups).forEach(([key, recs]) => {
        const total = calculateTotals(recs, priceColumns);
        const totalStr = priceColumns.map(col => `${col}: ${total[col]?.toFixed(2) || 0}`).join(', ');
        console.log(`  - "${key}": ${recs.length} records (${totalStr})`);
    });

    // Process each main group and sort by group value
    const processedGroups = Object.entries(mainGroups)
        .sort(([a], [b]) => {
            // Sort N/A to the end
            if (a === 'N/A') return 1;
            if (b === 'N/A') return -1;
            return a.localeCompare(b);
        })
        .map(([groupValue, groupRecords]) => {
            // Create nested groups based on internalGroupBy
            const nestedGroups = createNestedGroups(groupRecords, internalGroupBy, showTotalBy, priceColumns);
            // Calculate totals for this main group (both count and money)
            const totals = calculateTotals(groupRecords, priceColumns);
            return {
                groupValue,
                groupColumn: groupBy,
                nestedGroups,
                totals,
                count: groupRecords.length
            };
        });

    // Calculate grand totals for the account (both count and money)
    const grandTotals = calculateTotals(records, priceColumns);

    return {
        accountId,
        groups: processedGroups,
        grandTotals,
        totalCount: records.length,
        currency
    };
}

/**
 * Creates nested group structure based on internalGroupBy array
 */
function createNestedGroups(records, internalGroupBy, showTotalBy, priceColumns) {
    if (!internalGroupBy || internalGroupBy.length === 0) {
        // No internal grouping, just show totals by showTotalBy
        return createShowTotalByGroups(records, showTotalBy, priceColumns);
    }
    // Recursively create nested structure
    return buildNestedStructure(records, internalGroupBy, showTotalBy, priceColumns, 0);
}

/**
 * Recursively builds nested group structure
 */
function buildNestedStructure(records, internalGroupBy, showTotalBy, priceColumns, level) {
    if (level >= internalGroupBy.length) {
        return createShowTotalByGroups(records, showTotalBy, priceColumns);
    }

    const currentGroupColumn = internalGroupBy[level];
    const grouped = {};

    records.forEach(record => {
        const key = record[currentGroupColumn] || 'N/A';
        if (!grouped[key]) {
            grouped[key] = [];
        }
        grouped[key].push(record);
    });

    // Sort groups
    return Object.entries(grouped)
        .sort(([a], [b]) => {
            if (a === 'N/A') return 1;
            if (b === 'N/A') return -1;
            return a.localeCompare(b);
        })
        .map(([value, groupRecords]) => {
            const children = buildNestedStructure(groupRecords, internalGroupBy, showTotalBy, priceColumns, level + 1);
            const totals = calculateTotals(groupRecords, priceColumns);

            return {
                column: currentGroupColumn,
                value,
                children,
                totals,
                count: groupRecords.length,
                level
            };
        });
}

/**
 * Creates groups based on showTotalBy columns
 */
function createShowTotalByGroups(records, showTotalBy, priceColumns) {
    if (!showTotalBy || showTotalBy.length === 0) {
        // No breakdown, just return totals
        return [{
            breakdown: null,
            count: records.length,
            totals: calculateTotals(records, priceColumns)
        }];
    }

    // Group by the first showTotalBy column (can be extended for multiple)
    const breakdownColumn = showTotalBy[0];
    const grouped = {};

    records.forEach(record => {
        const key = record[breakdownColumn] || 'N/A';
        if (!grouped[key]) {
            grouped[key] = [];
        }
        grouped[key].push(record);
    });

    // Sort groups
    return Object.entries(grouped)
        .sort(([a], [b]) => {
            if (a === 'N/A') return 1;
            if (b === 'N/A') return -1;
            return a.localeCompare(b);
        })
        .map(([value, groupRecords]) => ({
            breakdownColumn,
            breakdownValue: value,
            count: groupRecords.length,
            totals: calculateTotals(groupRecords, priceColumns)
        }));
}

/**
 * Calculates totals for price columns
 * Returns an object with each priceColumn as key and its sum as value
 */
function calculateTotals(records, priceColumns) {
    const totals = {};

    priceColumns.forEach(column => {
        totals[column] = records.reduce((sum, record) => {
            const value = parseFloat(record[column]) || 0;
            return sum + value;
        }, 0);
        
        // Round to 2 decimal places to avoid floating point issues
        totals[column] = Math.round(totals[column] * 100) / 100;
    });

    return totals;
}

/**
 * Parses a value, handling JSON objects if needed
 */
function parseValue(value) {
    if (!value) return 'N/A';

    // Try to parse as JSON
    if (typeof value === 'string' && (value.startsWith('{') || value.startsWith('['))) {
        try {
            const parsed = JSON.parse(value);
            return JSON.stringify(parsed, null, 2);
        } catch (e) {
            return value;
        }
    }

    return value;
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