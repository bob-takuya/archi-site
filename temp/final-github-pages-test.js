const { chromium } = require('playwright');

async function testFinalGitHubPagesFix() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  console.log('🏁 FINAL GitHub Pages Test');
  console.log('=========================');
  console.log('Testing chunked loading fix and 7-minute timeout...');
  
  // Capture console logs
  const consoleLogs = [];
  page.on('console', msg => {
    consoleLogs.push(`${msg.type()}: ${msg.text()}`);
    if (msg.type() === 'error') {
      console.log(`❌ Console error: ${msg.text()}`);
    } else if (msg.type() === 'warning') {
      console.log(`⚠️  Console warning: ${msg.text()}`);
    }
  });
  
  try {
    console.log('📍 Loading GitHub Pages site...');
    await page.goto('https://bob-takuya.github.io/archi-site/', { 
      waitUntil: 'networkidle', 
      timeout: 60000 
    });
    
    console.log('⏳ Waiting for database to load...');
    const startTime = Date.now();
    
    let success = false;
    let timeoutOccurred = false;
    let chunkedLoadingWorking = false;
    
    // Monitor for first 2 minutes very closely
    for (let i = 0; i < 8; i++) {
      await page.waitForTimeout(15000); // 15 second intervals
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      
      // Check if chunked loading is working (no "serverMode" error)
      const hasServerModeError = consoleLogs.some(log => log.includes('serverMode'));
      const hasChunkedSuccess = consoleLogs.some(log => log.includes('sql.js-httpvfs worker initialized successfully'));
      
      if (hasChunkedSuccess && !hasServerModeError) {
        chunkedLoadingWorking = true;
        console.log(`   ✅ ${elapsed}s - Chunked loading is working! This should be faster.`);
      } else if (hasServerModeError) {
        console.log(`   ❌ ${elapsed}s - Chunked loading failed with serverMode error`);
      } else {
        console.log(`   ⏳ ${elapsed}s - Still initializing...`);
      }
      
      // Check for timeout error
      const timeoutErrorExists = await page.locator('text=/タイムアウト/').count() > 0;
      if (timeoutErrorExists) {
        const errorText = await page.locator('text=/タイムアウト/').first().textContent();
        console.log(`   ❌ Timeout error detected: ${errorText}`);
        timeoutOccurred = true;
        break;
      }
      
      // Check for success
      const cards = await page.locator('.MuiCard-root').all();
      if (cards.length > 0) {
        for (const card of cards.slice(0, 3)) {
          const cardText = await card.textContent();
          if (cardText && cardText.includes('建築作品日本全国から14,000件以上')) {
            success = true;
            console.log(`   🎉 SUCCESS at ${elapsed}s! Database loaded with real content.`);
            break;
          }
        }
        if (success) break;
      }
    }
    
    // If not successful yet, wait longer (up to 7 minutes total)
    if (!success && !timeoutOccurred) {
      console.log('   ⏳ Still loading... checking every 30 seconds until 7 minutes...');
      
      while (!success && !timeoutOccurred && (Date.now() - startTime) < 420000) { // 7 minutes
        await page.waitForTimeout(30000); // 30 second intervals
        const elapsed = Math.round((Date.now() - startTime) / 1000);
        console.log(`   ⏱️ ${elapsed}s - Still waiting...`);
        
        // Check for timeout
        const timeoutErrorExists = await page.locator('text=/タイムアウト/').count() > 0;
        if (timeoutErrorExists) {
          const errorText = await page.locator('text=/タイムアウト/').first().textContent();
          console.log(`   ❌ Timeout error detected: ${errorText}`);
          timeoutOccurred = true;
          break;
        }
        
        // Check for success
        const cards = await page.locator('.MuiCard-root').all();
        if (cards.length > 0) {
          for (const card of cards.slice(0, 3)) {
            const cardText = await card.textContent();
            if (cardText && cardText.includes('建築作品日本全国から14,000件以上')) {
              success = true;
              console.log(`   🎉 SUCCESS at ${elapsed}s! Database loaded with real content.`);
              break;
            }
          }
          if (success) break;
        }
      }
    }
    
    const totalTime = Math.round((Date.now() - startTime) / 1000);
    
    console.log('\n📊 FINAL TEST RESULTS:');
    console.log('=====================');
    console.log(`Total Loading Time: ${totalTime}s`);
    console.log(`Chunked Loading Working: ${chunkedLoadingWorking ? '✅ YES' : '❌ NO'}`);
    console.log(`Database Loaded Successfully: ${success ? '✅ YES' : '❌ NO'}`);
    console.log(`Timeout Error Occurred: ${timeoutOccurred ? '❌ YES' : '✅ NO'}`);
    
    // Analyze timeout messages
    const hasOld3MinMessage = consoleLogs.some(log => log.includes('3分'));
    const hasOld5MinMessage = consoleLogs.some(log => log.includes('5分'));
    const hasNew7MinMessage = consoleLogs.some(log => log.includes('7分'));
    const hasServerModeError = consoleLogs.some(log => log.includes('serverMode'));
    
    console.log('\n🔍 Technical Analysis:');
    console.log(`ServerMode Error (should be NO): ${hasServerModeError ? '❌ YES' : '✅ NO'}`);
    console.log(`Old 3min timeout message: ${hasOld3MinMessage ? '❌ Found' : '✅ Not found'}`);
    console.log(`Old 5min timeout message: ${hasOld5MinMessage ? '❌ Found' : '✅ Not found'}`);
    console.log(`New 7min timeout message: ${hasNew7MinMessage ? '✅ Found' : '❌ Not found'}`);
    
    await page.screenshot({ 
      path: 'temp/final-github-pages-test.png', 
      fullPage: true 
    });
    
    console.log('\n🎯 CONCLUSION:');
    if (success && !timeoutOccurred) {
      console.log('🎉 EXCELLENT! All fixes are working perfectly.');
      console.log('✅ Database loads successfully');
      console.log('✅ No timeout errors');
      console.log(`✅ Loading time: ${totalTime}s`);
      if (chunkedLoadingWorking) {
        console.log('✅ Chunked loading is working (faster)');
      } else {
        console.log('⚠️  Chunked loading not working, but direct loading succeeds');
      }
    } else if (!success && timeoutOccurred) {
      console.log('❌ FAILURE: Timeout still occurs. Database loading issues persist.');
      console.log('🔧 Recommendations:');
      console.log('   - Check if chunked loading configuration is correct');
      console.log('   - Consider increasing timeout further');
      console.log('   - Investigate database optimization options');
    } else {
      console.log('⚠️  PARTIAL SUCCESS: Database loads but took too long or other issues detected.');
    }
    
    return success && !timeoutOccurred;
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    return false;
  } finally {
    await browser.close();
  }
}

testFinalGitHubPagesFix().then(success => {
  console.log('\n' + '='.repeat(50));
  console.log('🏁 FINAL RESULT:', success ? 'GitHub Pages is WORKING!' : 'GitHub Pages needs more work');
  console.log('Live site: https://bob-takuya.github.io/archi-site/');
  console.log('='.repeat(50));
  process.exit(success ? 0 : 1);
});