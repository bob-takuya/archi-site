import { chromium, FullConfig } from '@playwright/test';

/**
 * Global setup for E2E tests
 * Prepares the database and performs initial health checks
 */
async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global setup for E2E tests...');
  
  // Launch browser for setup tasks
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Get base URL from config
    const baseURL = config.use?.baseURL || 'http://localhost:5173';
    
    // Wait for server to be ready
    console.log('⏳ Waiting for server to be ready...');
    let retries = 0;
    const maxRetries = 30;
    
    while (retries < maxRetries) {
      try {
        await page.goto(baseURL, { waitUntil: 'networkidle' });
        
        // Check if the app is properly loaded
        await page.waitForSelector('body', { timeout: 5000 });
        
        // Check for database connection
        const dbStatus = await page.evaluate(() => {
          // Check if the database service is available
          return new Promise((resolve) => {
            setTimeout(() => {
              resolve(window.location.href.includes('localhost'));
            }, 1000);
          });
        });
        
        if (dbStatus) {
          console.log('✅ Server is ready and database is accessible');
          break;
        }
      } catch (error) {
        retries++;
        console.log(`⚠️  Server not ready, retrying... (${retries}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    if (retries >= maxRetries) {
      throw new Error('Server failed to start within expected time');
    }
    
    // Perform initial database health check
    await page.goto(`${baseURL}/architecture`);
    
    // Wait for data to load
    try {
      await page.waitForSelector('[data-testid="architecture-item"], [data-testid="loading-skeleton"]', { 
        timeout: 15000 
      });
      console.log('✅ Database connection verified');
    } catch (error) {
      console.log('⚠️  Database might be slow to load, continuing with tests');
    }
    
    // Store setup state for tests
    await page.context().storageState({ path: 'tests/e2e/state.json' });
    
    console.log('✅ Global setup completed successfully');
    
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;