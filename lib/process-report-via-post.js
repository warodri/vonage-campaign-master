const axios = require('axios');
const { analyseReportWithTotals } = require('./reportAnalyserWithTotals');
const config = require('../config');

/*
- Send POST to: https://neru-74c96a88-campaign-master-dev.euw1.runtime.vonage.cloud/ask-report-api

Expected payload: {
    "apiKey": "74c96a88",
    "apiSecret": "xxxxxx",
    "accountId": "74c96a88",
    "dateFrom": "2025-08-01",
    "dateTo": "2026-01-09",
    "includeSubaccounts": false,
    "groupBy": "country_name",
    "internalGroupBy": [
        "from"
    ],
    "showTotalBy": [
        "status"
    ],
    "priceColumns": [
        "estimated_price",
        "total_price"
    ]
}

Successful response: {
    success: true,
    csvPath: "...",
    report: {
        ...
    }
}

Failed response: {
    success: false,
    message: "The error message shows here"
}


{
    "success": true,
    "csvPath": "/Users/warodriguez/Documents/VONAGE/CODING/CAMPAIGN-MASTER/downloads/report_MESSAGES_74c96a88_20260109.csv",
    "report": {
        "title": "Pivot Report",
        "data": {
            "accounts": [
                {
                    "accountId": "74c96a88",
                    "groups": [
                        {
                            "groupValue": "France",
                            "groupColumn": "country_name",
                            "nestedGroups": [
                                {
                                    "column": "from",
                                    "value": "VonageDemos",
                                    "children": [
                                        {
                                            "breakdownColumn": "status",
                                            "breakdownValue": "read",
                                            "count": 13,
                                            "totals": {
                                                "estimated_price": 0,
                                                "total_price": 0.68
                                            }
                                        },
                                        {
                                            "breakdownColumn": "status",
                                            "breakdownValue": "submitted",
                                            "count": 1,
                                            "totals": {
                                                "estimated_price": 0,
                                                "total_price": 0
                                            }
                                        }
                                    ],
                                    "totals": {
                                        "estimated_price": 0,
                                        "total_price": 0.68
                                    },
                                    "count": 14,
                                    "level": 0
                                }
                            ],
                            "totals": {
                                "estimated_price": 0,
                                "total_price": 0.68
                            },
                            "count": 14
                        },
                        {
                            "groupValue": "United Kingdom",
                            "groupColumn": "country_name",
                            "nestedGroups": [
                                {
                                    "column": "from",
                                    "value": "15557618945",
                                    "children": [
                                        {
                                            "breakdownColumn": "status",
                                            "breakdownValue": "read",
                                            "count": 4,
                                            "totals": {
                                                "estimated_price": 0,
                                                "total_price": 0.04
                                            }
                                        },
                                        {
                                            "breakdownColumn": "status",
                                            "breakdownValue": "rejected",
                                            "count": 11,
                                            "totals": {
                                                "estimated_price": 0,
                                                "total_price": 0
                                            }
                                        }
                                    ],
                                    "totals": {
                                        "estimated_price": 0,
                                        "total_price": 0.04
                                    },
                                    "count": 15,
                                    "level": 0
                                },
                                {
                                    "column": "from",
                                    "value": "NCSHealthcare",
                                    "children": [
                                        {
                                            "breakdownColumn": "status",
                                            "breakdownValue": "read",
                                            "count": 94,
                                            "totals": {
                                                "estimated_price": 0,
                                                "total_price": 5.29
                                            }
                                        },
                                        {
                                            "breakdownColumn": "status",
                                            "breakdownValue": "rejected",
                                            "count": 2,
                                            "totals": {
                                                "estimated_price": 0,
                                                "total_price": 0
                                            }
                                        }
                                    ],
                                    "totals": {
                                        "estimated_price": 0,
                                        "total_price": 5.29
                                    },
                                    "count": 96,
                                    "level": 0
                                },
                                {
                                    "column": "from",
                                    "value": "VonageDemos",
                                    "children": [
                                        {
                                            "breakdownColumn": "status",
                                            "breakdownValue": "delivered",
                                            "count": 4,
                                            "totals": {
                                                "estimated_price": 0,
                                                "total_price": 0.21
                                            }
                                        },
                                        {
                                            "breakdownColumn": "status",
                                            "breakdownValue": "read",
                                            "count": 943,
                                            "totals": {
                                                "estimated_price": 0,
                                                "total_price": 51.38
                                            }
                                        },
                                        {
                                            "breakdownColumn": "status",
                                            "breakdownValue": "rejected",
                                            "count": 13,
                                            "totals": {
                                                "estimated_price": 0,
                                                "total_price": 0
                                            }
                                        },
                                        {
                                            "breakdownColumn": "status",
                                            "breakdownValue": "submitted",
                                            "count": 5,
                                            "totals": {
                                                "estimated_price": 0,
                                                "total_price": 0
                                            }
                                        }
                                    ],
                                    "totals": {
                                        "estimated_price": 0,
                                        "total_price": 51.59
                                    },
                                    "count": 965,
                                    "level": 0
                                },
                                {
                                    "column": "from",
                                    "value": "VonagePolice",
                                    "children": [
                                        {
                                            "breakdownColumn": "status",
                                            "breakdownValue": "delivered",
                                            "count": 2,
                                            "totals": {
                                                "estimated_price": 0,
                                                "total_price": 0.14
                                            }
                                        },
                                        {
                                            "breakdownColumn": "status",
                                            "breakdownValue": "read",
                                            "count": 214,
                                            "totals": {
                                                "estimated_price": 0,
                                                "total_price": 10.52
                                            }
                                        }
                                    ],
                                    "totals": {
                                        "estimated_price": 0,
                                        "total_price": 10.66
                                    },
                                    "count": 216,
                                    "level": 0
                                },
                                {
                                    "column": "from",
                                    "value": "Walter",
                                    "children": [
                                        {
                                            "breakdownColumn": "status",
                                            "breakdownValue": "delivered",
                                            "count": 3,
                                            "totals": {
                                                "estimated_price": 0.15,
                                                "total_price": 0.15
                                            }
                                        }
                                    ],
                                    "totals": {
                                        "estimated_price": 0.15,
                                        "total_price": 0.15
                                    },
                                    "count": 3,
                                    "level": 0
                                },
                                {
                                    "column": "from",
                                    "value": "walterrodriguez",
                                    "children": [
                                        {
                                            "breakdownColumn": "status",
                                            "breakdownValue": "read",
                                            "count": 3,
                                            "totals": {
                                                "estimated_price": 0,
                                                "total_price": 0.04
                                            }
                                        },
                                        {
                                            "breakdownColumn": "status",
                                            "breakdownValue": "rejected",
                                            "count": 4,
                                            "totals": {
                                                "estimated_price": 0,
                                                "total_price": 0
                                            }
                                        }
                                    ],
                                    "totals": {
                                        "estimated_price": 0,
                                        "total_price": 0.04
                                    },
                                    "count": 7,
                                    "level": 0
                                },
                                {
                                    "column": "from",
                                    "value": "WalterRodriguez",
                                    "children": [
                                        {
                                            "breakdownColumn": "status",
                                            "breakdownValue": "read",
                                            "count": 113,
                                            "totals": {
                                                "estimated_price": 0,
                                                "total_price": 5.84
                                            }
                                        },
                                        {
                                            "breakdownColumn": "status",
                                            "breakdownValue": "rejected",
                                            "count": 18,
                                            "totals": {
                                                "estimated_price": 0,
                                                "total_price": 0
                                            }
                                        }
                                    ],
                                    "totals": {
                                        "estimated_price": 0,
                                        "total_price": 5.84
                                    },
                                    "count": 131,
                                    "level": 0
                                },
                                {
                                    "column": "from",
                                    "value": "warodri",
                                    "children": [
                                        {
                                            "breakdownColumn": "status",
                                            "breakdownValue": "delivered",
                                            "count": 1,
                                            "totals": {
                                                "estimated_price": 0.05,
                                                "total_price": 0.05
                                            }
                                        }
                                    ],
                                    "totals": {
                                        "estimated_price": 0.05,
                                        "total_price": 0.05
                                    },
                                    "count": 1,
                                    "level": 0
                                }
                            ],
                            "totals": {
                                "estimated_price": 0.19,
                                "total_price": 73.66
                            },
                            "count": 1434
                        },
                        {
                            "groupValue": "UNKNOWN",
                            "groupColumn": "country_name",
                            "nestedGroups": [
                                {
                                    "column": "from",
                                    "value": "walterrodriguez",
                                    "children": [
                                        {
                                            "breakdownColumn": "status",
                                            "breakdownValue": "rejected",
                                            "count": 1,
                                            "totals": {
                                                "estimated_price": 0,
                                                "total_price": 0
                                            }
                                        }
                                    ],
                                    "totals": {
                                        "estimated_price": 0,
                                        "total_price": 0
                                    },
                                    "count": 1,
                                    "level": 0
                                }
                            ],
                            "totals": {
                                "estimated_price": 0,
                                "total_price": 0
                            },
                            "count": 1
                        },
                        {
                            "groupValue": "N/A",
                            "groupColumn": "country_name",
                            "nestedGroups": [
                                {
                                    "column": "from",
                                    "value": "VonageDemos",
                                    "children": [
                                        {
                                            "breakdownColumn": "status",
                                            "breakdownValue": "N/A",
                                            "count": 2,
                                            "totals": {
                                                "estimated_price": 0,
                                                "total_price": 0
                                            }
                                        }
                                    ],
                                    "totals": {
                                        "estimated_price": 0,
                                        "total_price": 0
                                    },
                                    "count": 2,
                                    "level": 0
                                }
                            ],
                            "totals": {
                                "estimated_price": 0,
                                "total_price": 0
                            },
                            "count": 2
                        }
                    ],
                    "grandTotals": {
                        "estimated_price": 0.19,
                        "total_price": 74.35
                    },
                    "totalCount": 1451,
                    "currency": "EUR"
                }
            ],
            "currency": "EUR",
            "priceColumns": [
                "estimated_price",
                "total_price"
            ],
            "metadata": {
                "totalRecords": 1451,
                "groupBy": "country_name",
                "internalGroupBy": [
                    "from"
                ],
                "showTotalBy": [
                    "status"
                ],
                "priceColumns": [
                    "estimated_price",
                    "total_price"
                ],
                "generatedAt": "2026-01-09T14:06:25.960Z"
            }
        },
        "dateFrom": "2025-08-01",
        "dateTo": "2026-01-09",
        "accountId": "74c96a88",
        "groupBy": "country_name",
        "internalGroupBy": [
            "from"
        ],
        "showTotalBy": [
            "status"
        ],
        "priceColumns": [
            "estimated_price",
            "total_price"
        ]
    }
}

*/

async function run(req, res, payload) {
    let pollInterval = null;
    
    try {
        // Get the base URL from the request or use environment variable
        const baseURL = config.SERVER_URL || `${req.protocol}://${req.get('host')}`;
        
        // 1. Send the POST internally...
        const askResponse = await axios.post(`${baseURL}/ask-report-with-credentials`, payload, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 30000 // 30 second timeout
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
        }, 4000); // every 4 seconds

    } catch(ex) {
        // Clear interval if it exists
        if (pollInterval) {
            clearInterval(pollInterval);
        }
        
        console.error('Error in processReportViaPost:', ex.message);
        
        // Use appropriate status code based on error type
        const statusCode = ex.response?.status || 500;
        
        res.status(statusCode).json({
            success: false,
            message: ex.response?.data?.message || ex.message
        });
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