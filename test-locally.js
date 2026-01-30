const fs = require('fs');
const { parse } = require('csv-parse');

// Test parseValue function
function parseValue(value) {
    console.log('parseValue INPUT:', typeof value, value);
    
    if (!value) return { key: 'N/A', display: 'N/A' };

    if (typeof value === 'string' && (value.startsWith('{') || value.startsWith('['))) {
        try {
            // Unescape the JSON string first
            const unescaped = value.replace(/\\"/g, '"');
            console.log('parseValue UNESCAPED:', unescaped);
            const parsed = JSON.parse(unescaped);
            console.log('parseValue PARSED:', parsed);
            return { key: value, display: parsed };
        } catch (e) {
            console.log('parseValue PARSE FAILED:', e.message);
            return { key: value, display: value };
        }
    }
    const result = { key: String(value), display: value };
    console.log('parseValue OUTPUT:', result);
    return result;
}

// Read a sample CSV file
async function testParsing(csvPath) {
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
            records.push(record);
        });

        parser.on('end', () => {
            console.log('\n=== TESTING PARSE VALUE ===\n');
            
            // Test with message_body column
            records.forEach((record, idx) => {
                console.log(`\n--- Record ${idx + 1} ---`);
                console.log('Raw message_body:', record.message_body);
                const parsed = parseValue(record.message_body);
                console.log('Parsed result:', JSON.stringify(parsed, null, 2));
            });

            resolve(records);
        });

        parser.on('error', (err) => reject(err));
        fileStream.on('error', (err) => reject(err));
    });
}

// Run the test
const csvPath = process.argv[2] || './downloads/sample.csv';

console.log(`Testing with CSV file: ${csvPath}\n`);

testParsing(csvPath)
    .then(() => {
        console.log('\n=== TEST COMPLETE ===');
        process.exit(0);
    })
    .catch(err => {
        console.error('Error:', err.message);
        process.exit(1);
    });