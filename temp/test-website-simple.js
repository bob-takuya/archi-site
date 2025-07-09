const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  console.log('Testing website after database fix...');
  
  try {
    // Navigate to the homepage
    await page.goto('http://localhost:3001/archi-site/', { 
      waitUntil: 'networkidle',
      timeout: 60000 
    });
    
    // Wait a bit for everything to load
    await page.waitForTimeout(5000);
    
    // Take a screenshot
    await page.screenshot({ path: 'temp/website-after-fix.png', fullPage: true });
    console.log('Screenshot saved to temp/website-after-fix.png');
    
    // Check page title
    const title = await page.title();
    console.log('Page title:', title);
    
    // Check if there are any errors visible
    const errorElements = await page.locator('text=/error/i, text=/エラー/i').count();
    console.log('Error elements found:', errorElements);
    
    // Check for main content
    const hasMainContent = await page.locator('main').isVisible();
    console.log('Main content visible:', hasMainContent);
    
    // Check for architecture cards/items
    const architectureItems = await page.locator('.MuiCard-root').count();
    console.log('Architecture cards found:', architectureItems);
    
    // Try navigation
    console.log('\nTesting navigation to architecture list...');
    await page.click('text=建築作品');
    await page.waitForTimeout(3000);
    
    const currentUrl = page.url();
    console.log('Current URL after navigation:', currentUrl);
    
    // Take another screenshot
    await page.screenshot({ path: 'temp/architecture-list-page.png', fullPage: true });
    console.log('Architecture list screenshot saved');
    
  } catch (error) {
    console.error('Error during test:', error);
    await page.screenshot({ path: 'temp/error-state.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();