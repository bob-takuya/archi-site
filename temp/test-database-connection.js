const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Listen for console messages
  page.on('console', msg => {
    console.log(`Console ${msg.type()}: ${msg.text()}`);
  });
  
  // Listen for errors
  page.on('pageerror', error => {
    console.error('Page error:', error.message);
  });
  
  console.log('Testing database connection...');
  
  try {
    await page.goto('http://localhost:3001/archi-site/', { 
      waitUntil: 'networkidle',
      timeout: 60000 
    });
    
    // Wait for database to load
    console.log('Waiting for database initialization...');
    await page.waitForTimeout(10000);
    
    // Check if architecture items loaded
    const architectureCount = await page.locator('[data-testid="architecture-item"], .architecture-item, .MuiCard-root').count();
    console.log(`Architecture items loaded: ${architectureCount}`);
    
    // Check for error messages
    const errorElement = await page.locator('text=/sql.*import.*failed/i').first();
    const hasError = await errorElement.isVisible().catch(() => false);
    console.log(`Has SQL import error: ${hasError}`);
    
    // Try searching
    const searchInput = await page.locator('input[type="text"], input[type="search"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('東京');
      await searchInput.press('Enter');
      await page.waitForTimeout(2000);
      
      const searchResults = await page.locator('[data-testid="architecture-item"], .architecture-item, .MuiCard-root').count();
      console.log(`Search results for '東京': ${searchResults}`);
    }
    
    // Take screenshot
    await page.screenshot({ path: 'temp/database-test-result.png', fullPage: true });
    console.log('Screenshot saved to temp/database-test-result.png');
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await browser.close();
  }
})();