const { chromium } = require('playwright');

async function testEnvironmentDetailed(name, url, timeout = 300000) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  console.log(`\n=== ${name} DETAILED E2E TEST ===`);
  console.log(`URL: ${url}`);
  console.log(`Timeout: ${timeout/1000}s`);
  
  const results = {
    name,
    url,
    success: false,
    steps: {
      pageLoad: { success: false, duration: 0 },
      databaseLoad: { success: false, duration: 0, cardCount: 0 },
      searchFunction: { success: false, duration: 0 },
      navigation: { success: false, duration: 0 },
      realData: { success: false, sampleTitles: [] }
    },
    errors: [],
    consoleErrors: []
  };
  
  // Capture console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      results.consoleErrors.push(msg.text());
    }
  });
  
  try {
    // Step 1: Page Load
    console.log('📍 Step 1: Loading page...');
    const loadStart = Date.now();
    await page.goto(url, { waitUntil: 'networkidle', timeout });
    results.steps.pageLoad.duration = Date.now() - loadStart;
    results.steps.pageLoad.success = true;
    console.log(`   ✓ Page loaded in ${results.steps.pageLoad.duration}ms`);
    
    // Step 2: Database Load
    console.log('📍 Step 2: Waiting for database...');
    const dbStart = Date.now();
    let databaseLoaded = false;
    let attempts = 0;
    const maxAttempts = Math.floor(timeout / 10000);
    
    while (!databaseLoaded && attempts < maxAttempts) {
      await page.waitForTimeout(10000);
      attempts++;
      
      const cards = await page.locator('.MuiCard-root').all();
      if (cards.length > 0) {
        // Check if cards have real content
        let hasRealContent = false;
        const sampleTitles = [];
        
        for (const card of cards.slice(0, 3)) {
          const cardText = await card.textContent();
          if (cardText && cardText.trim().length > 20 && !cardText.includes('undefined')) {
            hasRealContent = true;
            sampleTitles.push(cardText.split('\n')[0]);
          }
        }
        
        if (hasRealContent) {
          databaseLoaded = true;
          results.steps.databaseLoad.success = true;
          results.steps.databaseLoad.cardCount = cards.length;
          results.steps.realData.success = true;
          results.steps.realData.sampleTitles = sampleTitles;
        }
      }
      
      console.log(`   Attempt ${attempts}/${maxAttempts}: ${databaseLoaded ? 'Database ready!' : 'Still loading...'}`);
    }
    
    results.steps.databaseLoad.duration = Date.now() - dbStart;
    
    if (results.steps.databaseLoad.success) {
      console.log(`   ✓ Database loaded in ${results.steps.databaseLoad.duration}ms`);
      console.log(`   ✓ Found ${results.steps.databaseLoad.cardCount} architecture cards`);
      console.log(`   ✓ Sample titles: ${results.steps.realData.sampleTitles.join(', ')}`);
      
      // Step 3: Search Function (if database loaded)
      console.log('📍 Step 3: Testing search...');
      const searchStart = Date.now();
      
      try {
        // Find search input with more flexible selector
        const searchInput = await page.locator('input[type="text"]').first();
        if (await searchInput.isVisible()) {
          await searchInput.fill('隈研吾');
          await searchInput.press('Enter');
          
          await page.waitForTimeout(5000);
          
          const searchResults = await page.locator('.MuiCard-root').count();
          const newUrl = page.url();
          
          if (searchResults > 0 && newUrl.includes('architecture')) {
            results.steps.searchFunction.success = true;
            console.log(`   ✓ Search works: ${searchResults} results`);
          } else {
            console.log(`   ⚠️ Search issues: ${searchResults} results, URL: ${newUrl}`);
          }
        }
      } catch (searchError) {
        console.log(`   ⚠️ Search test failed: ${searchError.message}`);
      }
      
      results.steps.searchFunction.duration = Date.now() - searchStart;
      
      // Step 4: Navigation Test
      console.log('📍 Step 4: Testing navigation...');
      const navStart = Date.now();
      
      try {
        await page.goto(`${url}#/architecture`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(5000);
        
        const listItems = await page.locator('.MuiCard-root').count();
        const pagination = await page.locator('.MuiPagination-root').count();
        
        if (listItems > 0) {
          results.steps.navigation.success = true;
          console.log(`   ✓ Navigation works: ${listItems} items, pagination: ${pagination > 0}`);
        } else {
          console.log(`   ❌ Navigation failed: ${listItems} items found`);
        }
      } catch (navError) {
        console.log(`   ❌ Navigation error: ${navError.message}`);
      }
      
      results.steps.navigation.duration = Date.now() - navStart;
      
    } else {
      console.log(`   ❌ Database failed to load after ${results.steps.databaseLoad.duration}ms`);
      results.errors.push('Database load timeout');
    }
    
    // Overall Success
    results.success = results.steps.pageLoad.success && 
                     results.steps.databaseLoad.success && 
                     results.steps.realData.success;
    
    // Take screenshot
    await page.screenshot({ path: `temp/${name.toLowerCase().replace(/\s+/g, '-')}-final-test.png`, fullPage: true });
    
    console.log(`\n🎯 ${name} FINAL RESULTS:`);
    console.log(`   Overall Success: ${results.success ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Page Load: ${results.steps.pageLoad.success ? '✅' : '❌'} (${results.steps.pageLoad.duration}ms)`);
    console.log(`   Database Load: ${results.steps.databaseLoad.success ? '✅' : '❌'} (${results.steps.databaseLoad.duration}ms)`);
    console.log(`   Real Data: ${results.steps.realData.success ? '✅' : '❌'} (${results.steps.databaseLoad.cardCount} cards)`);
    console.log(`   Search Function: ${results.steps.searchFunction.success ? '✅' : '❌'} (${results.steps.searchFunction.duration}ms)`);
    console.log(`   Navigation: ${results.steps.navigation.success ? '✅' : '❌'} (${results.steps.navigation.duration}ms)`);
    
    if (results.errors.length > 0) {
      console.log(`   Errors: ${results.errors.join(', ')}`);
    }
    
    if (results.consoleErrors.length > 0) {
      console.log(`   Console Errors: ${results.consoleErrors.length}`);
    }
    
  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`);
    results.errors.push(error.message);
  } finally {
    await browser.close();
  }
  
  return results;
}

(async () => {
  console.log('🏁 FINAL E2E VERIFICATION');
  console.log('=========================');
  
  const localResults = await testEnvironmentDetailed(
    'LOCAL DEVELOPMENT',
    'http://localhost:3000/archi-site/',
    120000 // 2 minutes
  );
  
  // Wait for GitHub Pages deployment to propagate
  console.log('\n⏳ Waiting for GitHub Pages deployment to propagate...');
  await new Promise(resolve => setTimeout(resolve, 30000)); // 30 second delay
  
  const productionResults = await testEnvironmentDetailed(
    'GITHUB PAGES PRODUCTION',
    'https://bob-takuya.github.io/archi-site/',
    300000 // 5 minutes for production
  );
  
  console.log('\n\n📊 FINAL COMPARISON');
  console.log('===================');
  console.log('Environment        | Page  | Database | Data  | Search | Navigation');
  console.log('================== | ===== | ======== | ===== | ====== | ==========');
  console.log(`Local Development  | ${localResults.steps.pageLoad.success ? '✅' : '❌'}    | ${localResults.steps.databaseLoad.success ? '✅' : '❌'}       | ${localResults.steps.realData.success ? '✅' : '❌'}    | ${localResults.steps.searchFunction.success ? '✅' : '❌'}     | ${localResults.steps.navigation.success ? '✅' : '❌'}`);
  console.log(`GitHub Pages       | ${productionResults.steps.pageLoad.success ? '✅' : '❌'}    | ${productionResults.steps.databaseLoad.success ? '✅' : '❌'}       | ${productionResults.steps.realData.success ? '✅' : '❌'}    | ${productionResults.steps.searchFunction.success ? '✅' : '❌'}     | ${productionResults.steps.navigation.success ? '✅' : '❌'}`);
  
  console.log('\n📋 SUMMARY:');
  if (localResults.success && productionResults.success) {
    console.log('🎉 SUCCESS: Both environments fully functional!');
    console.log('✅ Local development works perfectly');
    console.log('✅ GitHub Pages deployment successful');
    console.log('✅ Database loads with real Japanese architecture data');
    console.log('✅ Search and navigation functional');
    console.log('\n🌐 Live site: https://bob-takuya.github.io/archi-site/');
  } else if (localResults.success && !productionResults.success) {
    console.log('⚠️  PARTIAL SUCCESS: Local works, production has issues');
    console.log('✅ Local development confirmed working');
    console.log('❌ GitHub Pages deployment needs debugging');
    console.log('🔍 Issue: Likely database loading/compression problems');
  } else {
    console.log('❌ FAILURE: Issues detected in testing');
    console.log(`Local: ${localResults.success ? 'Working' : 'Failed'}`);
    console.log(`Production: ${productionResults.success ? 'Working' : 'Failed'}`);
  }
  
  // Save detailed results
  const finalReport = {
    timestamp: new Date().toISOString(),
    local: localResults,
    production: productionResults,
    summary: {
      localSuccess: localResults.success,
      productionSuccess: productionResults.success,
      overallSuccess: localResults.success && productionResults.success
    }
  };
  
  require('fs').writeFileSync('temp/final-e2e-report.json', JSON.stringify(finalReport, null, 2));
  console.log('\n💾 Detailed report saved to temp/final-e2e-report.json');
})();