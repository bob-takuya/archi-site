const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  console.log('🔍 DEBUGGING SIMPLE DATABASE ON LOCAL SERVER');
  console.log('===========================================');
  
  // Capture ALL console messages
  page.on('console', msg => {
    console.log(`   Console ${msg.type()}: ${msg.text()}`);
  });
  
  // Capture page errors
  page.on('pageerror', error => {
    console.log(`   Page Error: ${error.message}`);
  });
  
  try {
    console.log('\n1. Loading homepage...');
    await page.goto('http://localhost:3000/archi-site/', { 
      waitUntil: 'networkidle',
      timeout: 60000 
    });
    console.log('   ✓ Page loaded');
    
    console.log('\n2. Checking page structure...');
    const title = await page.title();
    console.log(`   Page title: ${title}`);
    
    const h1 = await page.locator('h1').first().textContent().catch(() => 'No H1');
    console.log(`   H1: ${h1}`);
    
    const cards = await page.locator('.MuiCard-root').count();
    console.log(`   Cards found: ${cards}`);
    
    if (cards > 0) {
      const firstCard = await page.locator('.MuiCard-root').first();
      const cardText = await firstCard.textContent();
      console.log(`   First card text: "${cardText}"`);
    }
    
    // Check for loading indicators
    const loadingSpinner = await page.locator('.MuiCircularProgress-root').isVisible().catch(() => false);
    console.log(`   Loading spinner visible: ${loadingSpinner}`);
    
    const loadingText = await page.locator('text=データベースを初期化中').isVisible().catch(() => false);
    console.log(`   Loading text visible: ${loadingText}`);
    
    // Check for error messages
    const errorAlerts = await page.locator('.MuiAlert-root').count();
    console.log(`   Error alerts: ${errorAlerts}`);
    
    if (errorAlerts > 0) {
      const errorText = await page.locator('.MuiAlert-root').first().textContent();
      console.log(`   Error message: "${errorText}"`);
    }
    
    console.log('\n3. Waiting and checking database status...');
    await page.waitForTimeout(15000);
    
    const finalCards = await page.locator('.MuiCard-root').count();
    console.log(`   Final cards count: ${finalCards}`);
    
    if (finalCards > 0) {
      const finalCardText = await page.locator('.MuiCard-root').first().textContent();
      console.log(`   Final card text: "${finalCardText}"`);
    }
    
    await page.screenshot({ path: 'temp/debug-simple-local.png', fullPage: true });
    console.log('\n📸 Screenshot saved to temp/debug-simple-local.png');
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  } finally {
    await browser.close();
  }
})();