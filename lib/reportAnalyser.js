const fs = require('fs');
const { parse } = require('csv-parse/sync');

/**
 * Analyses a CSV report and generates pivot table data
 * @param {string} csvPath - Path to where the CSV is located
 * @param {string[]} accountIds - Array of account IDs to filter (empty = all)
 * @param {string} groupBy - Column name to group by (main grouping)
 * @param {string[]} internalGroupBy - Array of column names for nested grouping
 * @param {string[]} showTotalBy - Array of column names to show totals for
 * @param {string[]} priceColumns - Array of column names containing prices
 * @returns {Object} Structured data for EJS template
 */
async function analyseReport(csvPath, accountIds, groupBy, internalGroupBy, showTotalBy, priceColumns) {
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

        // Validate columns exist
        const columns = Object.keys(records[0]);
        validateColumns(columns, groupBy, internalGroupBy, showTotalBy, priceColumns);

        // Filter by account IDs if specified
        let filteredRecords = records;
        if (accountIds && accountIds.length > 0) {
            filteredRecords = records.filter(record =>
                accountIds.includes(record.account_id)
            );
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

    // Group by the main groupBy column
    const mainGroups = {};
    records.forEach(record => {
        const groupValue = parseValue(record[groupBy]);
        if (!mainGroups[groupValue]) {
            mainGroups[groupValue] = [];
        }
        mainGroups[groupValue].push(record);
    });

    // Process each main group
    const processedGroups = Object.entries(mainGroups).map(([groupValue, groupRecords]) => {
        // Create nested groups based on internalGroupBy
        const nestedGroups = createNestedGroups(groupRecords, internalGroupBy, showTotalBy, priceColumns);

        // Calculate totals for this main group
        const totals = calculateTotals(groupRecords, priceColumns);

        return {
            groupValue,
            groupColumn: groupBy,
            nestedGroups,
            totals,
            count: groupRecords.length
        };
    });

    // Calculate grand totals for the account
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
    // Nesting order: from left to right in the array for better readability
    return buildNestedStructure(records, internalGroupBy, showTotalBy, priceColumns, 0);
}

/**
 * Recursively builds nested group structure
 */
function buildNestedStructure(records, internalGroupBy, showTotalBy, priceColumns, level) {
    if (level >= internalGroupBy.length) {
        // Base case: create showTotalBy groups
        return createShowTotalByGroups(records, showTotalBy, priceColumns);
    }

    const currentGroupColumn = internalGroupBy[level];
    const grouped = {};

    records.forEach(record => {
        const key = parseValue(record[currentGroupColumn]);
        if (!grouped[key]) {
            grouped[key] = [];
        }
        grouped[key].push(record);
    });

    return Object.entries(grouped).map(([value, groupRecords]) => {
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
        const key = parseValue(record[breakdownColumn]);
        if (!grouped[key]) {
            grouped[key] = [];
        }
        grouped[key].push(record);
    });

    return Object.entries(grouped).map(([value, groupRecords]) => ({
        breakdownColumn,
        breakdownValue: value,
        count: groupRecords.length,
        totals: calculateTotals(groupRecords, priceColumns)
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

module.exports = {
    analyseReport
};
