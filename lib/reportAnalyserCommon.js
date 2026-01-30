/**
 * Common utilities for report analysis
 */

/**
 * Detects currency from the CSV data
 */
function detectCurrency(records) {
    for (const record of records) {
        if (record.currency) {
            return record.currency;
        }
    }
    return 'USD';
}

/**
 * Groups records by account_id
 */
function groupByAccountId(records, accountIds) {
    if (!accountIds || accountIds.length === 0) {
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
        return accountIds.map(accountId => ({
            accountId,
            records: records.filter(r => r.account_id === accountId)
        }));
    }
}

/**
 * Process a single account group
 */
function processAccountGroup(accountGroup, groupBy, internalGroupBy, showTotalBy, priceColumns, currency, debug = false) {
    const { accountId, records } = accountGroup;

    const mainGroups = {};
    records.forEach(record => {
        const parsed = parseValue(record[groupBy]);
        if (!mainGroups[parsed.key]) {
            mainGroups[parsed.key] = { display: parsed.display, records: [] };
        }
        mainGroups[parsed.key].records.push(record);
    });

    const processedGroups = Object.entries(mainGroups)
        .sort(([a], [b]) => {
            if (a === 'N/A') return 1;
            if (b === 'N/A') return -1;
            return a.localeCompare(b);
        })
        .map(([groupKey, groupData]) => {
            const nestedGroups = createNestedGroups(groupData.records, internalGroupBy, showTotalBy, priceColumns);
            const totals = calculateTotals(groupData.records, priceColumns);

            if (debug) {
                const totalStr = priceColumns.map(col => `${col}: ${totals[col]?.toFixed(2) || 0}`).join(', ');
                console.log(`  - "${groupKey}": ${groupData.records.length} records (${totalStr})`);
            }

            return {
                groupValue: groupData.display,
                groupColumn: groupBy,
                nestedGroups,
                totals,
                count: groupData.records.length
            };
        });

    const grandTotals = calculateTotals(records, priceColumns);

    if (debug) {
        console.log(`\nDEBUG: Processing account ${accountId} with ${records.length} records`);
    }

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
        return createShowTotalByGroups(records, showTotalBy, priceColumns);
    }
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
        const parsed = parseValue(record[currentGroupColumn]);
        if (!grouped[parsed.key]) {
            grouped[parsed.key] = { display: parsed.display, records: [] };
        }
        grouped[parsed.key].records.push(record);
    });

    return Object.entries(grouped)
        .sort(([a], [b]) => {
            if (a === 'N/A') return 1;
            if (b === 'N/A') return -1;
            return a.localeCompare(b);
        })
        .map(([groupKey, groupData]) => {
            const children = buildNestedStructure(groupData.records, internalGroupBy, showTotalBy, priceColumns, level + 1);
            const totals = calculateTotals(groupData.records, priceColumns);

            return {
                column: currentGroupColumn,
                value: groupData.display,
                children,
                totals,
                count: groupData.records.length,
                level
            };
        });
}

/**
 * Creates groups based on showTotalBy columns
 */
function createShowTotalByGroups(records, showTotalBy, priceColumns) {
    if (!showTotalBy || showTotalBy.length === 0) {
        return [{
            breakdown: null,
            count: records.length,
            totals: calculateTotals(records, priceColumns)
        }];
    }

    const breakdownColumn = showTotalBy[0];
    const grouped = {};

    records.forEach(record => {
        const parsed = parseValue(record[breakdownColumn]);
        if (!grouped[parsed.key]) {
            grouped[parsed.key] = { display: parsed.display, records: [] };
        }
        grouped[parsed.key].records.push(record);
    });

    return Object.entries(grouped)
        .sort(([a], [b]) => {
            if (a === 'N/A') return 1;
            if (b === 'N/A') return -1;
            return a.localeCompare(b);
        })
        .map(([groupKey, groupData]) => ({
            breakdownColumn,
            breakdownValue: groupData.display,
            count: groupData.records.length,
            totals: calculateTotals(groupData.records, priceColumns)
        }));
}

/**
 * Calculates totals for price columns
 */
function calculateTotals(records, priceColumns) {
    const totals = {};

    priceColumns.forEach(column => {
        totals[column] = records.reduce((sum, record) => {
            const value = parseFloat(record[column]) || 0;
            return sum + value;
        }, 0);
        
        totals[column] = Math.round(totals[column] * 100) / 100;
    });

    return totals;
}

/**
 * Parses a value, handling JSON objects if needed
 * Returns an object with both the parsed value and a string key for grouping
 */
function parseValue(value) {
    if (!value) return { key: 'N/A', display: 'N/A' };

    if (typeof value === 'string' && (value.startsWith('{') || value.startsWith('['))) {
        try {
            const unescaped = value.replace(/\\"/g, '"');
            const parsed = JSON.parse(unescaped);
            return { key: value, display: parsed };
        } catch (e) {
            return { key: value, display: value };
        }
    }
    return { key: String(value), display: value };
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

    // Sanitize column names
    requiredColumns.forEach(col => {
        if (typeof col !== 'string' || col.includes('__proto__') || col.includes('constructor') || col.includes('prototype')) {
            throw new Error(`Invalid column name: ${col}`);
        }
    });

    const missingColumns = requiredColumns.filter(col => !availableColumns.includes(col));

    if (missingColumns.length > 0) {
        throw new Error(`Missing columns in CSV: ${missingColumns.join(', ')}`);
    }
}

module.exports = {
    detectCurrency,
    groupByAccountId,
    processAccountGroup,
    createNestedGroups,
    buildNestedStructure,
    createShowTotalByGroups,
    calculateTotals,
    parseValue,
    autoDetectPriceColumns,
    validateColumns
};