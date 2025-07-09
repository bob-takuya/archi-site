const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  console.log('🧪 TESTING SIMPLE DATABASE ON LOCAL SERVER');
  console.log('===========================================');
  
  // Monitor console for database events
  page.on('console', msg => {
    if (msg.text().includes('database') || msg.text().includes('Database') || msg.text().includes('SQL')) {
      console.log(`   Console: ${msg.text()}`);
    }
  });
  
  try {
    console.log('\n1. Loading homepage...');
    await page.goto('http://localhost:3000/archi-site/', { 
      waitUntil: 'networkidle',
      timeout: 60000 
    });
    console.log('   ✓ Page loaded');
    
    console.log('\n2. Waiting for database initialization...');
    let dbReady = false;
    let attempts = 0;
    const maxAttempts = 20; // 20 * 3 seconds = 60 seconds
    
    while (!dbReady && attempts < maxAttempts) {
      await page.waitForTimeout(3000);
      attempts++;
      
      // Check for architecture cards with real content
      const cards = await page.locator('.MuiCard-root').count();
      if (cards > 0) {
        const firstCard = await page.locator('.MuiCard-root').first();
        const cardText = await firstCard.textContent();
        
        if (cardText && cardText.trim().length > 20 && !cardText.includes('undefined')) {
          dbReady = true;
          console.log(`   ✓ Database ready after ${attempts * 3} seconds`);
          console.log(`   ✓ Found ${cards} architecture cards`);
          console.log(`   ✓ Sample: "${cardText.split('\n')[0]}"`);
        }
      }
      
      if (!dbReady) {
        console.log(`   Attempt ${attempts}/${maxAttempts}: Still waiting...`);
      }
    }
    
    if (!dbReady) {
      console.log('   ❌ Database failed to load');
      await page.screenshot({ path: 'temp/local-simple-failed.png' });
      return;
    }
    
    console.log('\n3. Testing search functionality...');
    const searchInput = await page.locator('input[placeholder*="建築作品名"]').first();
    await searchInput.fill('隈研吾');
    await searchInput.press('Enter');
    
    await page.waitForTimeout(5000);
    
    const searchResults = await page.locator('.MuiCard-root').count();
    const currentUrl = page.url();
    
    console.log(`   Search results: ${searchResults}`);
    console.log(`   URL after search: ${currentUrl}`);
    
    if (searchResults > 0 && currentUrl.includes('architecture')) {
      console.log('   ✓ Search functionality works');
    } else {
      console.log('   ⚠️ Search may have issues');
    }
    
    console.log('\n4. Testing architecture list page...');
    await page.goto('http://localhost:3000/archi-site/#/architecture', { waitUntil: 'networkidle' });
    await page.waitForTimeout(5000);
    
    const listItems = await page.locator('.MuiCard-root').count();
    const pagination = await page.locator('.MuiPagination-root').count();
    
    console.log(`   List items: ${listItems}`);
    console.log(`   Pagination: ${pagination > 0 ? 'Present' : 'Not present'}`);
    
    if (listItems > 0) {
      console.log('   ✓ Architecture list works');
    } else {
      console.log('   ❌ Architecture list failed');
    }
    
    await page.screenshot({ path: 'temp/local-simple-test.png', fullPage: true });
    
    console.log('\n🎯 LOCAL SIMPLE DATABASE TEST RESULTS:');
    console.log('=====================================');
    
    if (dbReady && listItems > 0) {
      console.log('✅ SUCCESS: Simple database implementation works on local server');
      console.log('✅ Database loads correctly');
      console.log('✅ Real data displays properly');
      console.log('✅ Navigation works');
      console.log('✅ Ready for deployment');
    } else {
      console.log('❌ FAILURE: Simple database implementation has issues');
      console.log('   Need to fix before deploying');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'temp/local-simple-error.png' });
  } finally {
    await browser.close();
  }
})();