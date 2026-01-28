# CSV Pivot Report Generator

A Node.js web application that generates beautiful pivot table reports from CSV files using Express, EJS, and Bootstrap.

## Features

- **Dynamic Pivot Tables**: Generate multi-level pivot tables from CSV data
- **Bootstrap UI**: Clean, responsive interface with Bootstrap 5
- **Currency Support**: Automatic currency detection and locale-based formatting
- **Flexible Filtering**: Filter by account IDs or process all data
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Print Support**: Print-optimized reports
- **Nested Grouping**: Support for multiple levels of data grouping

## Usage

### Web Interface

1. **Home Page Login** (`/`): 
   - The first user in the system is the Admin user. Sets the Email and password.
   - Once that's done, the Admin user can create other users.

2. **Home Page** (`/`): 
   - Once loggged in, you can: 
      - Fill in the form with your CSV path and grouping parameters
      - Click "Generate Report" to create your pivot table

## API Routes

### GET `/`
Home page. Everything is resolved there. You must login to use the app.

### POST `/ask-report-with-credentials`
If you don't want to use the UI, then you can use POSTMAN or similar to generate the report and get the same information.

### Payload
```
{
    "apiKey": "API KEY YOU WANT TO GET THE REPORT",
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
```

### Response
Based on that, the process will generate a report and respond like this:
```
{
    "success": true,
    "csvPath": "/Users/.../downloads/report_MESSAGES_XXXXXXXX_20260109.csv",
    "report": {
        "title": "Pivot Report",
        "data": {
            "accounts": [
                {
                    "accountId": "XXXXXXXX",
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
                                    "value": "15557699999",
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
        "accountId": "74c96a99",
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
```

## Currency Support

The app automatically:
- Detects currency from the CSV's `currency` column
- Formats numbers according to the currency's locale
- Supported currencies include: USD, EUR, GBP, JPY, SEK, NOK, DKK, CHF, CAD, AUD

**Examples:**
- EUR: €1.234,56 (German format)
- USD: $1,234.56 (US format)
- SEK: 1 234,56 kr (Swedish format)

## Features Explained

### Multi-Level Grouping

The report supports sophisticated multi-level grouping:

1. **Account Level**: Each account gets its own section
2. **Main Group** (groupBy): Primary categorization (e.g., by country)
3. **Internal Groups** (internalGroupBy): Nested subcategories (e.g., provider → session_type)
4. **Breakdown** (showTotalBy): Final level of detail (e.g., by status)

### Totals and Subtotals

- Each nested group shows relevant data
- Subtotals for each main group
- Grand total for each account
- All monetary values properly formatted

### Print Functionality

Click the "Print" button to generate a print-friendly version of the report with:
- Removed navigation and buttons
- Optimized table sizing
- Clean layout for professional documents

## Troubleshooting

**Problem: "Missing columns in CSV"**
- Ensure column names in parameters exactly match CSV headers
- Check for typos in column names

**Problem: "CSV file is empty"**
- Verify the CSV path is correct
- Ensure the CSV has data rows (not just headers)

**Problem: Currency not displaying correctly**
- Check that the CSV has a `currency` column
- Verify currency codes are valid (e.g., EUR, USD, GBP)

**Problem: Numbers not formatting**
- Ensure price columns contain numeric values
- Remove any currency symbols from the CSV data

## License

MIT License - Feel free to use and modify as needed.

## Support

For questions or issues, please review the code comments or modify as needed for your use case.
