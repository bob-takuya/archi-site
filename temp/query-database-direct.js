const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  console.log('=== Direct Database Query Test ===\n');
  
  try {
    await page.goto('http://localhost:3001/archi-site/', { 
      waitUntil: 'networkidle',
      timeout: 60000 
    });
    
    // Wait for database to load
    await page.waitForTimeout(10000);
    
    // Query database directly from browser context
    const queryResults = await page.evaluate(async () => {
      try {
        // Import the database service
        const { executeQuery } = await import('./src/services/db/ClientDatabaseService.ts');
        
        // Check table schema first
        console.log('Checking table schema...');
        const schema = await executeQuery("PRAGMA table_info(ZCDARCHITECTURE)");
        console.log('ZCDARCHITECTURE schema:', schema);
        
        // Query sample records
        console.log('Querying sample records...');
        const sampleData = await executeQuery('SELECT * FROM ZCDARCHITECTURE LIMIT 3');
        console.log('Sample data:', sampleData);
        
        // Check if data exists
        const count = await executeQuery('SELECT COUNT(*) as count FROM ZCDARCHITECTURE');
        console.log('Total records:', count);
        
        // Try different column names that might exist
        const testQueries = [
          'SELECT ZAW_ID, ZAW_NAME, ZAW_ARCHITECT FROM ZCDARCHITECTURE LIMIT 3',
          'SELECT Z_PK, ZNAME, ZARCHITECT FROM ZCDARCHITECTURE LIMIT 3',
          'SELECT * FROM ZCDARCHITECTURE WHERE ZAW_NAME IS NOT NULL LIMIT 3',
          'SELECT * FROM ZCDARCHITECTURE WHERE ZNAME IS NOT NULL LIMIT 3'
        ];
        
        const results = {};
        for (let i = 0; i < testQueries.length; i++) {
          try {
            const result = await executeQuery(testQueries[i]);
            results[`query_${i}`] = {
              sql: testQueries[i],
              result: result
            };
            console.log(`Query ${i} result:`, result);
          } catch (error) {
            results[`query_${i}`] = {
              sql: testQueries[i],
              error: error.message
            };
            console.log(`Query ${i} failed:`, error.message);
          }
        }
        
        return {
          schema,
          sampleData,
          count,
          testResults: results
        };
        
      } catch (error) {
        console.error('Database query error:', error);
        return { error: error.message };
      }
    });
    
    console.log('\n=== Query Results ===');
    console.log(JSON.stringify(queryResults, null, 2));
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await browser.close();
  }
})();