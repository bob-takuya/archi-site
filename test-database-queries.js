// Test database queries to debug the issue
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

const dbPath = './public/db/archimap.sqlite';

if (!fs.existsSync(dbPath)) {
    console.error('Database file not found:', dbPath);
    process.exit(1);
}

const db = new sqlite3.Database(dbPath);

console.log('Testing database queries...');

// Test 1: List all tables
db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
    if (err) {
        console.error('Error listing tables:', err);
        return;
    }
    console.log('\n=== TABLES ===');
    tables.forEach(table => console.log(table.name));
});

// Test 2: Check architecture table structure
db.all("PRAGMA table_info(ZCDARCHITECTURE)", (err, columns) => {
    if (err) {
        console.error('Error getting ZCDARCHITECTURE structure:', err);
        return;
    }
    console.log('\n=== ZCDARCHITECTURE COLUMNS ===');
    columns.forEach(col => console.log(`${col.name} (${col.type})`));
});

// Test 3: Count architecture records
db.get("SELECT COUNT(*) as count FROM ZCDARCHITECTURE", (err, result) => {
    if (err) {
        console.error('Error counting records:', err);
        return;
    }
    console.log('\n=== RECORD COUNT ===');
    console.log('ZCDARCHITECTURE records:', result.count);
});

// Test 4: Get sample architecture data
db.all("SELECT * FROM ZCDARCHITECTURE LIMIT 3", (err, rows) => {
    if (err) {
        console.error('Error getting sample data:', err);
        return;
    }
    console.log('\n=== SAMPLE DATA ===');
    rows.forEach((row, i) => {
        console.log(`\nRecord ${i + 1}:`);
        Object.keys(row).forEach(key => {
            console.log(`  ${key}: ${row[key]}`);
        });
    });
    
    // Close database
    db.close();
});