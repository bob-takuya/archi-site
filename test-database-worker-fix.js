/**
 * Test script to verify database worker loading fix
 */

import { createDbWorker } from 'sql.js-httpvfs';

async function testDatabaseWorkerFix() {
    console.log('🧪 Testing database worker loading fix...');
    
    try {
        // Test with the corrected worker URLs
        const workerUrl = '/archi-site/sqlite.worker.js';
        const wasmUrl = '/archi-site/sql-wasm.wasm';
        const databaseUrl = '/archi-site/db/archimap.sqlite';
        
        console.log('📍 Worker URL:', workerUrl);
        console.log('📍 WASM URL:', wasmUrl);
        console.log('📍 Database URL:', databaseUrl);
        
        // Check if files exist
        console.log('🔍 Checking if files are accessible...');
        
        const workerResponse = await fetch(workerUrl);
        console.log('Worker accessible:', workerResponse.ok, workerResponse.status);
        
        const wasmResponse = await fetch(wasmUrl);
        console.log('WASM accessible:', wasmResponse.ok, wasmResponse.status);
        
        const dbResponse = await fetch(databaseUrl, { method: 'HEAD' });
        console.log('Database accessible:', dbResponse.ok, dbResponse.status);
        
        if (!workerResponse.ok || !wasmResponse.ok || !dbResponse.ok) {
            console.error('❌ One or more files are not accessible');
            return false;
        }
        
        // Create worker
        console.log('🔧 Creating worker...');
        const config = {
            from: 'inline',
            config: {
                serverMode: 'full',
                url: databaseUrl,
                requestChunkSize: 4096,
                cacheSizeKiB: 2048,
                filename: 'archimap.sqlite',
                debug: true
            }
        };
        
        const worker = await createDbWorker(
            [config],
            workerUrl,
            wasmUrl,
            50 * 1024 * 1024 // 50MB max
        );
        
        console.log('✅ Worker created successfully!');
        
        // Test basic query
        console.log('🔍 Testing basic query...');
        const versionResult = await worker.db.exec('SELECT sqlite_version()');
        console.log('SQLite version:', versionResult[0]?.values[0][0]);
        
        // Test table existence
        console.log('🔍 Testing table existence...');
        const tablesResult = await worker.db.exec("SELECT name FROM sqlite_master WHERE type='table'");
        console.log('Tables found:', tablesResult[0]?.values.length || 0);
        
        // Test architecture count
        console.log('🔍 Testing architecture count...');
        const countResult = await worker.db.exec("SELECT COUNT(*) FROM ZCDARCHITECTURE");
        const architectureCount = countResult[0]?.values[0][0] || 0;
        console.log('Architecture records:', architectureCount);
        
        // Test sample data
        console.log('🔍 Testing sample data...');
        const sampleResult = await worker.db.exec("SELECT ZNAME, ZARCHITECT FROM ZCDARCHITECTURE LIMIT 5");
        if (sampleResult[0]?.values) {
            console.log('Sample architecture data:');
            sampleResult[0].values.forEach((row, i) => {
                console.log(`  ${i+1}. ${row[0]} by ${row[1]}`);
            });
        }
        
        console.log('✅ All tests passed! Database worker is working correctly.');
        return true;
        
    } catch (error) {
        console.error('❌ Database worker test failed:', error);
        return false;
    }
}

export { testDatabaseWorkerFix };

// If running directly
if (typeof window !== 'undefined') {
    testDatabaseWorkerFix().then(success => {
        console.log(success ? '✅ Test completed successfully' : '❌ Test failed');
    });
}