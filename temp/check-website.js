const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  console.log('Checking local development server at http://localhost:3001/archi-site/');
  
  try {
    await page.goto('http://localhost:3001/archi-site/', { waitUntil: 'networkidle' });
    
    // Take a screenshot
    await page.screenshot({ path: 'temp/homepage-check.png', fullPage: true });
    console.log('Screenshot saved to temp/homepage-check.png');
    
    // Check if the page loaded properly
    const title = await page.title();
    console.log('Page title:', title);
    
    // Check for main elements
    const hasHeader = await page.locator('header').isVisible();
    const hasMainContent = await page.locator('main').isVisible();
    console.log('Header visible:', hasHeader);
    console.log('Main content visible:', hasMainContent);
    
    // Check for database loading
    await page.waitForTimeout(3000); // Give database time to load
    
    // Check if architecture items are visible
    const architectureItems = await page.locator('[data-testid="architecture-item"], .architecture-item, .MuiCard-root').count();
    console.log('Architecture items found:', architectureItems);
    
  } catch (error) {
    console.error('Error checking website:', error);
  } finally {
    await browser.close();
  }
})();