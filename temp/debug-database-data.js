const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  console.log('=== Debugging Database Data Structure ===\n');
  
  try {
    await page.goto('http://localhost:3001/archi-site/', { 
      waitUntil: 'networkidle',
      timeout: 60000 
    });
    
    // Wait for database to load
    await page.waitForTimeout(10000);
    
    // Execute code in browser context to inspect the actual data
    const dataStructure = await page.evaluate(async () => {
      // Wait for the recentWorks to be populated
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Try to access the ClientDatabaseService directly
      let dbData = null;
      
      try {
        const { executeQuery } = await import('./src/services/db/ClientDatabaseService.ts');
        
        // Query the first few records to see the actual column structure
        const sampleData = await executeQuery('SELECT * FROM ZCDARCHITECTURE LIMIT 3');
        dbData = sampleData;
        
        console.log('Sample database records:', sampleData);
        
        // Also check the table schema
        const schema = await executeQuery("PRAGMA table_info(ZCDARCHITECTURE)");
        console.log('Table schema:', schema);
        
        return {
          sampleData,
          schema
        };
        
      } catch (error) {
        console.error('Error querying database:', error);
        return { error: error.message };
      }
    });
    
    console.log('Database data structure:', JSON.stringify(dataStructure, null, 2));
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await browser.close();
  }
})();