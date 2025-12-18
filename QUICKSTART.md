# Quick Start Guide

## Setup Instructions

1. **Extract the project** (if you downloaded the tar.gz file):
   ```bash
   tar -xzf csv-pivot-report.tar.gz
   cd csv-pivot-report
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```
   
   This will install:
   - express (web server)
   - ejs (templating engine)
   - csv-parse (CSV parsing)

3. **Start the server**:
   ```bash
   npm start
   ```

4. **Open your browser**:
   Go to `http://localhost:3000`

## Quick Test

To see a working example immediately:
- Go to `http://localhost:3000/example`
- This uses the sample CSV data included in `downloads/sample.csv`

## Using Your Own CSV

### Option 1: Web Form
1. Go to `http://localhost:3000`
2. Fill in the form:
   - **CSV File Path**: `./downloads/your-file.csv`
   - **Account IDs**: `76ea2717` (or leave empty for all)
   - **Group By Column**: `country_name`
   - **Internal Group By**: `provider, session_type`
   - **Show Total By**: `status`
   - **Price Columns**: `estimated_price, total_price`
3. Click "Generate Report"

### Option 2: Direct URL
Create a custom route in `server.js`:

```javascript
app.get('/my-report', async (req, res) => {
  try {
    const reportData = await analyseReport(
      './downloads/my-data.csv',
      ['account1', 'account2'],
      'country_name',
      ['provider', 'session_type'],
      ['status'],
      ['estimated_price', 'total_price']
    );

    res.render('report', {
      title: 'My Custom Report',
      data: reportData,
      groupBy: 'country_name',
      internalGroupBy: ['provider', 'session_type'],
      showTotalBy: ['status'],
      priceColumns: ['estimated_price', 'total_price']
    });
  } catch (error) {
    res.status(500).render('error', {
      error: error.message,
      title: 'Error'
    });
  }
});
```

## Understanding the Parameters

### accountIds (array)
- Filter specific accounts: `['76ea2717', '12345678']`
- Process all accounts: `[]` (empty array)

### groupBy (string)
Main grouping - creates major sections in the report
- Example: `'country_name'` groups by Sweden, Germany, France, etc.

### internalGroupBy (array)
Nested grouping within each main group
- Example: `['provider', 'session_type']` creates:
  - provider: whatsapp
    - session_type: marketing
    - session_type: utility
  - provider: sms
    - session_type: utility

### showTotalBy (array)
Final breakdown level showing counts and prices
- Example: `['status']` shows delivered, rejected, submitted counts

### priceColumns (array)
Columns to sum and display as monetary totals
- Example: `['estimated_price', 'total_price']`

## Example Report Structure

```
Account ID: 76ea2717
├── Sweden
│   ├── whatsapp → marketing
│   │   ├── status: delivered (2 records, €0.13)
│   │   └── status: submitted (1 record, €0.07)
│   └── whatsapp → utility
│       ├── status: delivered (1 record, €0.04)
│       └── status: submitted (1 record, €0.04)
├── Germany
│   └── ...
└── GRAND TOTAL (20 records, €2.50)
```

## Troubleshooting

**Port already in use:**
```bash
# Use a different port
PORT=3001 npm start
```

**Cannot find CSV file:**
- Use absolute paths: `/Users/yourname/downloads/data.csv`
- Or relative from project root: `./downloads/data.csv`

**Missing columns error:**
- Check your CSV headers match exactly (case-sensitive)
- Verify column names in your parameters

## Next Steps

- Read the full README.md for detailed documentation
- Customize the CSS in `public/css/style.css`
- Modify templates in `views/` folder
- Add custom logic in `lib/reportAnalyser.js`

## Example API Call

If you want to integrate this programmatically:

```javascript
const { analyseReport } = require('./lib/reportAnalyser');

async function generateReport() {
  const data = await analyseReport(
    './downloads/sample.csv',
    ['76ea2717'],
    'country_name',
    ['provider', 'session_type'],
    ['status'],
    ['estimated_price', 'total_price']
  );
  
  console.log(data);
}
```

Enjoy your pivot reports! 🎉
