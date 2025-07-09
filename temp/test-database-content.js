const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Listen for console messages to debug
  page.on('console', msg => {
    if (msg.type() === 'log' || msg.type() === 'error') {
      console.log(`Console ${msg.type()}: ${msg.text()}`);
    }
  });
  
  console.log('=== Testing Database Content ===\n');
  
  try {
    await page.goto('http://localhost:3001/archi-site/', { 
      waitUntil: 'networkidle',
      timeout: 60000 
    });
    
    // Wait for database to fully load
    console.log('Waiting for database to load...');
    await page.waitForTimeout(10000);
    
    // Check the content of architecture cards
    const cards = await page.locator('.MuiCard-root').all();
    console.log(`\nFound ${cards.length} architecture cards\n`);
    
    for (let i = 0; i < Math.min(3, cards.length); i++) {
      console.log(`Card ${i + 1}:`);
      
      // Get all text content from the card
      const cardText = await cards[i].textContent();
      console.log(`Full text: ${cardText}`);
      
      // Try to get specific elements
      const titleElement = await cards[i].locator('h6, .MuiTypography-h6').first();
      const title = await titleElement.textContent().catch(() => 'No title found');
      console.log(`Title: ${title}`);
      
      // Check for architect, location, year
      const subtitleElements = await cards[i].locator('.MuiTypography-body2, .MuiCardContent-root p').all();
      for (const elem of subtitleElements) {
        const text = await elem.textContent();
        console.log(`Subtitle: ${text}`);
      }
      
      console.log('---\n');
    }
    
    // Try to click on a card to see the detail page
    if (cards.length > 0) {
      console.log('Clicking on first card to check detail page...');
      await cards[0].click();
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      console.log(`Current URL: ${currentUrl}`);
      
      // Check detail page content
      const detailContent = await page.locator('main').textContent();
      console.log(`Detail page content preview: ${detailContent.substring(0, 200)}...`);
    }
    
    // Take screenshots
    await page.goto('http://localhost:3001/archi-site/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'temp/database-content-check.png', fullPage: true });
    
    // Also check the actual database query directly
    console.log('\nChecking database query results...');
    await page.evaluate(() => {
      console.log('Attempting to query database directly from browser console...');
    });
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await browser.close();
  }
})();