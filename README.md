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

## Installation

1. **Clone or download the project**

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Check config.js**:
The file **config.js** must hold your Vonage's ApiKey and ApiSecret. 
It is recommended to host in VCR so credentials are not hardcoded.

4. **Start the server**:
   ```bash
   npm start
   ```

   For development with auto-reload:
   ```bash
   npm run dev
   ```

5. **Open your browser**:
   Navigate to `http://localhost:3003`

## Usage

### Web Interface

1. **Home Page Login** (`/`): 
   - The first user in the system is the Admin user. Sets the Email and password.
   - Once that's done, the Admin user can create other users.

2. **Home Page** (`/`): 
   - Once loggged in, you can: 
      - Fill in the form with your CSV path and grouping parameters
      - Click "Generate Report" to create your pivot table

### Function Parameters

The core function is `analyseReport()` with the following parameters:

```javascript
analyseReport(csvPath, accountIds, groupBy, internalGroupBy, showTotalBy, priceColumns)
```

**Parameters:**

- **csvPath** (string, required): Full path to the CSV file
  - Example: `'./downloads/sample.csv'`

- **accountIds** (array of strings, optional): Account IDs to filter
  - Example: `['76ea2717', '12345678']`
  - Empty array processes all accounts

- **groupBy** (string, required): Column name for main grouping
  - Example: `'country_name'`

- **internalGroupBy** (array of strings, optional): Columns for nested grouping
  - Example: `['provider', 'session_type']`
  - Creates hierarchical groups within each main group

- **showTotalBy** (array of strings, optional): Columns to break down totals
  - Example: `['status']`
  - Shows detailed breakdowns at the lowest level

- **priceColumns** (array of strings, optional): Columns containing monetary values
  - Example: `['estimated_price', 'total_price']`
  - These columns will be summed and formatted as currency

### Example Usage

```javascript
const reportData = await analyseReport(
  './downloads/sample.csv',
  ['76ea2717'],
  'country_name',
  ['provider', 'session_type'],
  ['status'],
  ['estimated_price', 'total_price']
);
```

This will generate a report that:
1. Filters data for account ID `76ea2755`
2. Groups by `country_name` (e.g., Sweden, Germany, France)
3. Within each country, groups by `provider` (e.g., whatsapp, sms)
4. Within each provider, groups by `session_type` (e.g., marketing, utility)
5. Shows breakdowns by `status` (e.g., delivered, rejected, submitted)
6. Calculates totals for `estimated_price` and `total_price`

## CSV Format

Your CSV file should have headers in the first row. The sample CSV includes these columns:

```
account_id, message_id, client_ref, direction, from, to, country, 
country_name, provider, session_type, status, currency, 
estimated_price, total_price, ...
```

**Important Notes:**
- Column names can vary - the app is flexible
- The app will auto-detect currency from the `currency` column
- JSON objects in columns are automatically parsed and displayed nicely
- Price columns should contain numeric values

## Project Structure

```
csv-pivot-report/
├── server.js                 # Express server and routes
├── lib/
│   └── reportAnalyser.js    # Core CSV processing logic
├── views/
│   ├── index.ejs            # Home page form
│   ├── report.ejs           # Pivot table report
│   └── error.ejs            # Error page
├── public/
│   └── css/
│       └── style.css        # Custom styles
├── downloads/
│   └── sample.csv           # Sample CSV data
├── package.json
└── README.md
```

## API Routes

### GET `/`
Home page with the report generation form

### POST `/generate-report`
Generates a report based on form data

**Form Data:**
- `csvPath`: Path to CSV file
- `accountId`: One account ID (Vonage ApiKey)
- `groupBy`: Main grouping column
- `internalGroupBy`: Comma-separated nested grouping columns
- `showTotalBy`: Comma-separated breakdown columns
- `priceColumns`: Comma-separated price columns

### GET `/example`
Displays a pre-configured example report using sample data

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

## Customization

### Styling

Edit `/public/css/style.css` to customize:
- Colors and themes
- Table styling
- Spacing and layout
- Print styles

### Templates

Edit EJS templates in `/views/`:
- `index.ejs`: Modify the input form
- `report.ejs`: Change report layout and formatting
- `error.ejs`: Customize error messages

### Processing Logic

Edit `/lib/reportAnalyser.js` to:
- Add custom aggregations
- Implement additional grouping strategies
- Add data validation rules
- Support new data types

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
