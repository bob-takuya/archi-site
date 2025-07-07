// Simple test to debug worker loading in development mode
import { createDbWorker } from 'sql.js-httpvfs';

console.log('🧪 Testing simple worker loading...');

async function testSimpleWorkerLoading() {
    try {
        console.log('1. Creating worker with corrected URLs...');
        
        // Use the corrected URLs that should be accessible
        const workerUrl = `/archi-site/sqlite.worker.js`;
        const wasmUrl = `/archi-site/sql-wasm.wasm`;
        const databaseUrl = `/archi-site/db/archimap.sqlite`;
        
        console.log('Worker URL:', workerUrl);
        console.log('WASM URL:', wasmUrl);
        console.log('Database URL:', databaseUrl);
        
        // First test if files are accessible
        console.log('2. Testing file accessibility...');
        
        try {
            const workerResponse = await fetch(workerUrl);
            console.log('Worker file status:', workerResponse.status, workerResponse.statusText);
            
            const wasmResponse = await fetch(wasmUrl);
            console.log('WASM file status:', wasmResponse.status, wasmResponse.statusText);
            
            const dbResponse = await fetch(databaseUrl, { method: 'HEAD' });
            console.log('Database file status:', dbResponse.status, dbResponse.statusText);
            
            if (!workerResponse.ok || !wasmResponse.ok || !dbResponse.ok) {
                throw new Error('One or more files are not accessible');
            }
        } catch (fetchError) {
            console.error('File accessibility test failed:', fetchError);
            throw fetchError;
        }
        
        console.log('3. All files accessible, creating worker...');
        
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
        
        console.log('Config:', config);
        
        // Create worker with timeout
        const workerPromise = createDbWorker(
            [config],
            workerUrl,
            wasmUrl,
            50 * 1024 * 1024 // 50MB max
        );
        
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Worker creation timeout after 30 seconds')), 30000);
        });
        
        const worker = await Promise.race([workerPromise, timeoutPromise]);
        
        console.log('4. Worker created successfully:', worker);
        
        // Test basic query
        console.log('5. Testing basic query...');
        const result = await worker.db.exec('SELECT sqlite_version()');
        console.log('SQLite version:', result[0]?.values[0][0]);
        
        // Test architecture count
        console.log('6. Testing architecture count...');
        const countResult = await worker.db.exec('SELECT COUNT(*) FROM ZCDARCHITECTURE');
        console.log('Architecture count:', countResult[0]?.values[0][0]);
        
        // Test sample data
        console.log('7. Testing sample data...');
        const sampleResult = await worker.db.exec(`
            SELECT Z_PK, ZAR_TITLE, ZAR_ARCHITECT 
            FROM ZCDARCHITECTURE 
            WHERE ZAR_TITLE IS NOT NULL 
            LIMIT 3
        `);
        
        if (sampleResult[0]?.values) {
            console.log('Sample architecture data:');
            sampleResult[0].values.forEach((row, i) => {
                console.log(`  ${i+1}. ${row[1]} by ${row[2] || 'Unknown'} (ID: ${row[0]})`);
            });
        }
        
        console.log('✅ All tests passed!');
        return true;
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        console.error('Error details:', error.message);
        console.error('Stack trace:', error.stack);
        return false;
    }
}

// Run test if in browser environment
if (typeof window !== 'undefined') {
    testSimpleWorkerLoading().then(success => {
        console.log(success ? '✅ Worker loading test completed successfully' : '❌ Worker loading test failed');
    });
}

export { testSimpleWorkerLoading };