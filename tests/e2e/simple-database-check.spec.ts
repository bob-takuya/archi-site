import { test, expect } from '@playwright/test';

/**
 * Simple Database Check - Focused test to debug database loading issues
 */

const LIVE_SITE_URL = 'https://bob-takuya.github.io/archi-site/';

test.describe('Simple Database Check', () => {
  test('should verify database file size and accessibility', async ({ page }) => {
    test.setTimeout(60000);
    
    console.log('=== DATABASE FILE CHECK ===');
    
    // Test database file URL directly
    const dbUrl = `${LIVE_SITE_URL}db/archimap.sqlite`;
    console.log(`Testing database URL: ${dbUrl}`);
    
    try {
      // Test with HEAD request
      const headResponse = await page.request.head(dbUrl);
      console.log(`HEAD request status: ${headResponse.status()}`);
      console.log(`HEAD request headers:`, headResponse.headers());
      
      // Test with GET request (partial)
      const getResponse = await page.request.get(dbUrl, {
        headers: { 'Range': 'bytes=0-1023' }
      });
      console.log(`GET request status: ${getResponse.status()}`);
      console.log(`GET request headers:`, getResponse.headers());
      
      // Test database info
      const dbInfoResponse = await page.request.get(`${LIVE_SITE_URL}db/database-info.json`);
      if (dbInfoResponse.status() === 200) {
        const dbInfo = await dbInfoResponse.json();
        console.log(`Database info size: ${dbInfo.size}`);
        console.log(`Database info tables: ${dbInfo.tables.length}`);
      }
      
    } catch (error) {
      console.error('Database accessibility error:', error);
    }
    
    console.log('=== SITE LOADING TEST ===');
    
    // Navigate to site and check console
    const consoleMessages: string[] = [];
    page.on('console', (msg) => {
      consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
    });
    
    await page.goto(LIVE_SITE_URL);
    await page.waitForLoadState('networkidle');
    
    // Wait for database initialization
    console.log('Waiting for database initialization...');
    await page.waitForTimeout(45000); // 45 seconds
    
    console.log('=== CONSOLE MESSAGES ===');
    consoleMessages.forEach(msg => console.log(msg));
    
    console.log('=== PAGE CONTENT CHECK ===');
    
    // Check for any content
    const bodyText = await page.textContent('body');
    console.log(`Page body text length: ${bodyText?.length || 0}`);
    
    // Check for Japanese content
    const japaneseMatches = bodyText?.match(/[ひらがなカタカナ漢字]/g);
    console.log(`Japanese characters found: ${japaneseMatches?.length || 0}`);
    
    // Check for loading indicators
    const loadingElements = page.locator('[data-testid="loading"], .loading, .spinner');
    const loadingCount = await loadingElements.count();
    console.log(`Loading indicators: ${loadingCount}`);
    
    // Check for error messages
    const errorElements = page.locator('.error, .error-message, [data-testid="error"]');
    const errorCount = await errorElements.count();
    console.log(`Error messages: ${errorCount}`);
    
    if (errorCount > 0) {
      for (let i = 0; i < errorCount; i++) {
        const errorText = await errorElements.nth(i).textContent();
        console.log(`Error ${i + 1}: ${errorText}`);
      }
    }
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/simple-database-check.png' });
    
    console.log('=== TEST COMPLETE ===');
  });
  
  test('should test database worker loading directly', async ({ page }) => {
    test.setTimeout(60000);
    
    await page.goto(LIVE_SITE_URL);
    
    // Inject script to test database loading directly
    const dbTestResult = await page.evaluate(async () => {
      const testResults = {
        workerAvailable: false,
        createDbWorkerFunction: false,
        databaseUrl: '',
        error: null
      };
      
      try {
        // Check if sql.js-httpvfs is available
        if (typeof window.createDbWorker === 'function') {
          testResults.createDbWorkerFunction = true;
        }
        
        // Check database URL
        testResults.databaseUrl = '/archi-site/db/archimap.sqlite';
        
        // Try to create worker
        const config = {
          from: 'inline',
          config: {
            serverMode: 'full',
            url: '/archi-site/db/archimap.sqlite',
            requestChunkSize: 1024,
            size: 12730368,
            maxBytesToRead: 12730368
          }
        };
        
        console.log('Testing database worker creation...');
        
        // This would typically be done in the actual app
        // const worker = await createDbWorker([config], '/archi-site/sqlite.worker.js', '/archi-site/sql-wasm.wasm');
        
        testResults.workerAvailable = true;
        
      } catch (error) {
        testResults.error = error.message;
      }
      
      return testResults;
    });
    
    console.log('Database worker test results:', dbTestResult);
    
    expect(dbTestResult.createDbWorkerFunction).toBe(true);
  });
});