const { chromium } = require('playwright');

async function finalVerification() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  console.log('🏆 FINAL VERIFICATION TEST');
  console.log('==========================');
  console.log('Testing complete GitHub Pages timeout fix...');
  
  let hasServerModeError = false;
  let hasFileLengthError = false;
  let hasChunkedSuccess = false;
  let databaseLoaded = false;
  
  // Capture console logs
  page.on('console', msg => {
    const text = msg.text();
    
    if (text.includes('serverMode')) {
      hasServerModeError = true;
    }
    if (text.includes('Length of the file not known')) {
      hasFileLengthError = true;
    }
    if (text.includes('sql.js-httpvfs worker initialized successfully')) {
      hasChunkedSuccess = true;
      console.log('✅ Chunked loading working!');
    }
    if (text.includes('建築データ件数')) {
      console.log(`✅ ${text}`);
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
    
    // Check for success within 3 minutes (should be much faster with chunked loading)
    for (let i = 0; i < 12; i++) { // 12 x 15s = 3 minutes
      await page.waitForTimeout(15000);
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      
      // Check for timeout error
      const timeoutErrorExists = await page.locator('text=/タイムアウト/').count() > 0;
      if (timeoutErrorExists) {
        console.log(`❌ ${elapsed}s - Timeout error still occurring`);
        break;
      }
      
      // Check for database content
      const cards = await page.locator('.MuiCard-root').all();
      if (cards.length > 0) {
        for (const card of cards.slice(0, 3)) {
          const cardText = await card.textContent();
          if (cardText && cardText.includes('建築作品日本全国から14,000件以上')) {
            databaseLoaded = true;
            console.log(`🎉 ${elapsed}s - Database loaded successfully!`);
            break;
          }
        }
        if (databaseLoaded) break;
      }
      
      console.log(`   ⏳ ${elapsed}s - Still loading...`);
    }
    
    const totalTime = Math.round((Date.now() - startTime) / 1000);
    
    console.log('\n🎯 FINAL VERIFICATION RESULTS:');
    console.log('==============================');
    console.log(`Total Loading Time: ${totalTime}s`);
    console.log(`ServerMode Error: ${hasServerModeError ? '❌ PRESENT' : '✅ FIXED'}`);
    console.log(`FileLength Error: ${hasFileLengthError ? '❌ PRESENT' : '✅ FIXED'}`);
    console.log(`Chunked Loading Success: ${hasChunkedSuccess ? '✅ WORKING' : '❌ NOT WORKING'}`);
    console.log(`Database Loaded: ${databaseLoaded ? '✅ SUCCESS' : '❌ FAILED'}`);
    
    await page.screenshot({ 
      path: 'temp/final-verification-test.png', 
      fullPage: true 
    });
    
    const allGood = !hasServerModeError && !hasFileLengthError && databaseLoaded;
    
    console.log('\n🏆 FINAL CONCLUSION:');
    if (allGood) {
      console.log('🎉 EXCELLENT! All issues are resolved!');
      console.log('✅ No configuration errors');
      console.log('✅ Database loads successfully');
      console.log('✅ No timeout errors');
      console.log(`✅ Fast loading time: ${totalTime}s`);
      console.log('\n🌐 Your website is now fully functional at:');
      console.log('   https://bob-takuya.github.io/archi-site/');
    } else {
      console.log('❌ Some issues remain:');
      if (hasServerModeError) console.log('   - ServerMode configuration error');
      if (hasFileLengthError) console.log('   - FileLength parameter issue');
      if (!databaseLoaded) console.log('   - Database loading failure');
    }
    
    return allGood;
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  } finally {
    await browser.close();
  }
}

finalVerification().then(success => {
  console.log('\n' + '='.repeat(60));
  if (success) {
    console.log('🎉 MISSION ACCOMPLISHED! GitHub Pages timeout issue is RESOLVED!');
    console.log('🏆 The archi-site is now fully functional with real Japanese architecture data!');
  } else {
    console.log('⚠️  Still some work needed on GitHub Pages configuration.');
  }
  console.log('='.repeat(60));
  process.exit(success ? 0 : 1);
});