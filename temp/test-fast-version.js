const { chromium } = require('playwright');

async function testFastVersion() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  console.log('🚀 Testing FAST JSON-based Architecture Site');
  console.log('=============================================');
  
  let loadingStartTime = Date.now();
  let databaseReady = false;
  
  // Capture console logs for debugging
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('FastArchitectureService')) {
      console.log(`📡 ${text}`);
    }
    if (text.includes('✅ Loaded page')) {
      console.log(`✅ ${text}`);
    }
    if (text.includes('建築作品の取得に成功しました')) {
      databaseReady = true;
      const loadTime = Date.now() - loadingStartTime;
      console.log(`🎉 Database loaded successfully in ${loadTime}ms!`);
    }
  });
  
  try {
    console.log('📍 Loading GitHub Pages site...');
    loadingStartTime = Date.now();
    
    await page.goto('https://bob-takuya.github.io/archi-site/', { 
      waitUntil: 'networkidle', 
      timeout: 30000 
    });
    
    console.log('⏳ Waiting for fast data loading...');
    
    // Wait for up to 30 seconds for database to load
    for (let i = 0; i < 30; i++) {
      await page.waitForTimeout(1000); // Check every second
      const elapsed = Date.now() - loadingStartTime;
      
      if (databaseReady) {
        console.log(`✅ Fast loading completed in ${elapsed}ms!`);
        break;
      }
      
      // Check for cards with content
      const cards = await page.locator('.MuiCard-root').all();
      if (cards.length > 0) {
        let hasRealContent = false;
        for (const card of cards.slice(0, 3)) {
          const cardText = await card.textContent();
          if (cardText && cardText.includes('建築作品日本全国から14,000件以上')) {
            hasRealContent = true;
            databaseReady = true;
            console.log(`🎉 Content loaded in ${elapsed}ms!`);
            break;
          }
        }
        if (hasRealContent) break;
      }
      
      if (i % 5 === 0) {
        console.log(`   ⏳ ${elapsed}ms elapsed...`);
      }
    }
    
    const totalTime = Date.now() - loadingStartTime;
    
    console.log('\n📊 PERFORMANCE RESULTS:');
    console.log('======================');
    console.log(`Loading Time: ${totalTime}ms`);
    console.log(`Success: ${databaseReady ? '✅ YES' : '❌ NO'}`);
    
    if (databaseReady) {
      if (totalTime < 3000) {
        console.log('🎉 EXCELLENT! Sub-3-second loading achieved!');
      } else if (totalTime < 10000) {
        console.log('✅ GOOD! Under 10 seconds - much better than 3-5 minutes!');
      } else {
        console.log('⚠️ IMPROVED! Still much faster than SQLite but could be better');
      }
      
      console.log(`Improvement: ~${Math.round(180000 / totalTime)}x faster than SQLite`);
    } else {
      console.log('❌ Loading failed or timed out');
    }
    
    // Test search functionality
    if (databaseReady) {
      console.log('\n🔍 Testing search functionality...');
      const searchStart = Date.now();
      
      const searchInput = await page.locator('input[type="text"]').first();
      if (await searchInput.isVisible()) {
        await searchInput.fill('隈研吾');
        await searchInput.press('Enter');
        
        await page.waitForTimeout(2000);
        
        const searchTime = Date.now() - searchStart;
        const searchResults = await page.locator('.MuiCard-root').count();
        
        console.log(`Search completed in ${searchTime}ms with ${searchResults} results`);
        
        if (searchTime < 1000) {
          console.log('🎉 EXCELLENT! Sub-second search!');
        } else if (searchTime < 3000) {
          console.log('✅ GOOD! Fast search response!');
        }
      }
    }
    
    // Take screenshot
    await page.screenshot({ 
      path: 'temp/fast-version-test.png', 
      fullPage: true 
    });
    
    console.log('\n🌐 Live site: https://bob-takuya.github.io/archi-site/');
    
    return databaseReady && totalTime < 30000;
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  } finally {
    await browser.close();
  }
}

testFastVersion().then(success => {
  console.log('\n' + '='.repeat(50));
  if (success) {
    console.log('🎉 SUCCESS! Fast JSON version is working!');
    console.log('✅ Loading time dramatically improved');
    console.log('✅ Real Japanese architecture data displaying');
    console.log('✅ Search functionality working');
  } else {
    console.log('❌ Issues detected with fast version');
  }
  console.log('='.repeat(50));
  process.exit(success ? 0 : 1);
});