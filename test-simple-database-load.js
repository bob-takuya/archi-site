// Simple test to check if our database can be queried manually
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

const dbPath = './public/db/archimap.sqlite';

if (!fs.existsSync(dbPath)) {
    console.error('Database file not found:', dbPath);
    process.exit(1);
}

const db = new sqlite3.Database(dbPath);

console.log('Testing simplified query that matches ArchitectureService...');

// Test the exact query that the service uses
const query = `
    SELECT *
    FROM ZCDARCHITECTURE
    WHERE 1=1
    ORDER BY ZAR_TITLE ASC
    LIMIT ? OFFSET ?
`;

const params = [6, 0]; // Same as homepage: limit 6, offset 0

db.all(query, params, (err, rows) => {
    if (err) {
        console.error('Error executing query:', err);
        db.close();
        return;
    }
    
    console.log(`\n=== QUERY RESULTS (${rows.length} rows) ===`);
    
    rows.forEach((row, i) => {
        console.log(`\n--- Architecture ${i + 1} ---`);
        console.log(`Title: ${row.ZAR_TITLE}`);
        console.log(`Architect: ${row.ZAR_ARCHITECT}`);
        console.log(`Year: ${row.ZAR_YEAR}`);
        console.log(`Address: ${row.ZAR_ADDRESS}`);
        console.log(`Prefecture: ${row.ZAR_PREFECTURE}`);
        console.log(`Category: ${row.ZAR_CATEGORY}`);
    });
    
    console.log('\n=== ANALYSIS ===');
    console.log(`Total records: ${rows.length}`);
    console.log(`Famous architects found: ${rows.filter(r => r.ZAR_ARCHITECT && ['安藤忠雄', '丹下健三', '隈研吾'].includes(r.ZAR_ARCHITECT)).length}`);
    console.log(`With years: ${rows.filter(r => r.ZAR_YEAR).length}`);
    console.log(`With addresses: ${rows.filter(r => r.ZAR_ADDRESS).length}`);
    
    // Show a sample that should trigger the test
    const sampleWithData = rows.find(r => r.ZAR_ARCHITECT && r.ZAR_YEAR && r.ZAR_ADDRESS);
    if (sampleWithData) {
        console.log('\n=== SAMPLE RICH DATA ===');
        console.log(`${sampleWithData.ZAR_TITLE} by ${sampleWithData.ZAR_ARCHITECT} (${sampleWithData.ZAR_YEAR}) in ${sampleWithData.ZAR_ADDRESS}`);
    }
    
    db.close();
});