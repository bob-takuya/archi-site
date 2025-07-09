const { chromium } = require('playwright');

async function testTimeoutFix() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  console.log('🧪 Testing Timeout Fix on GitHub Pages');
  console.log('====================================');
  
  // Capture console logs
  const consoleLogs = [];
  page.on('console', msg => {
    consoleLogs.push(`${msg.type()}: ${msg.text()}`);
    if (msg.type() === 'error' || msg.type() === 'warning') {
      console.log(`Console ${msg.type()}: ${msg.text()}`);
    }
  });
  
  try {
    console.log('📍 Loading GitHub Pages site...');
    await page.goto('https://bob-takuya.github.io/archi-site/', { 
      waitUntil: 'networkidle', 
      timeout: 60000 
    });
    
    console.log('⏳ Waiting for database to load (with 5-minute timeout)...');
    
    // Wait up to 6 minutes for database to load
    let success = false;
    let timeoutOccurred = false;
    const startTime = Date.now();
    const maxWaitTime = 6 * 60 * 1000; // 6 minutes
    
    while (!success && !timeoutOccurred && (Date.now() - startTime) < maxWaitTime) {
      await page.waitForTimeout(15000); // Check every 15 seconds
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      console.log(`   ⏱️ Elapsed: ${elapsed}s - Checking for content...`);
      
      // Check for timeout error message
      const timeoutErrorExists = await page.locator('text=/タイムアウト/').count() > 0;
      if (timeoutErrorExists) {
        const errorText = await page.locator('text=/タイムアウト/').first().textContent();
        console.log(`   ❌ Timeout error detected: ${errorText}`);
        timeoutOccurred = true;
        break;
      }
      
      // Check for successful database loading
      const cards = await page.locator('.MuiCard-root').all();
      if (cards.length > 0) {
        console.log(`   📊 Found ${cards.length} cards, checking content...`);
        
        for (const card of cards.slice(0, 3)) {
          const cardText = await card.textContent();
          if (cardText && cardText.includes('建築作品日本全国から14,000件以上')) {
            success = true;
            console.log(`   ✅ Database loaded successfully! Content: ${cardText.substring(0, 100)}...`);
            break;
          }
        }
      }
    }
    
    const totalTime = Math.round((Date.now() - startTime) / 1000);
    
    console.log('\n📊 Test Results:');
    console.log(`Total Time: ${totalTime}s`);
    console.log(`Success: ${success ? '✅ YES' : '❌ NO'}`);
    console.log(`Timeout Error: ${timeoutOccurred ? '❌ YES' : '✅ NO'}`);
    
    if (success && !timeoutOccurred) {
      console.log('🎉 SUCCESS: Timeout fix is working! Database loads without timeout errors.');
    } else if (timeoutOccurred) {
      console.log('❌ FAILURE: Timeout error still occurs. Need to investigate further.');
    } else {
      console.log('⏳ TIMEOUT: Database still not loading within 6 minutes. Infrastructure issue.');
    }
    
    // Take screenshot
    await page.screenshot({ 
      path: 'temp/timeout-fix-test.png', 
      fullPage: true 
    });
    
    // Check for specific timeout message patterns
    const hasOldTimeoutMessage = consoleLogs.some(log => log.includes('3分'));
    const hasNewTimeoutMessage = consoleLogs.some(log => log.includes('5分'));
    
    console.log('\n🔍 Timeout Message Analysis:');
    console.log(`Old timeout message (3分): ${hasOldTimeoutMessage ? '❌ Found' : '✅ Not found'}`);
    console.log(`New timeout message (5分): ${hasNewTimeoutMessage ? '✅ Found' : '❌ Not found'}`);
    
    return success && !timeoutOccurred;
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    return false;
  } finally {
    await browser.close();
  }
}

testTimeoutFix().then(success => {
  console.log('\n🏁 FINAL RESULT:', success ? 'Timeout fix SUCCESSFUL!' : 'Timeout fix needs more work');
  process.exit(success ? 0 : 1);
});