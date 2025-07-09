const { chromium } = require('playwright');

async function testEnvironment(name, baseUrl, timeout = 120000) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  console.log(`\n=== ${name} E2E TEST ===`);
  console.log(`Testing: ${baseUrl}\n`);
  
  const results = {
    environment: name,
    url: baseUrl,
    success: false,
    databaseLoaded: false,
    searchWorks: false,
    navigationWorks: false,
    architectureCount: 0,
    errors: [],
    consoleErrors: [],
    timing: {}
  };
  
  // Capture console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      results.consoleErrors.push(msg.text());
    }
  });
  
  try {
    const startTime = Date.now();
    
    // 1. Load homepage
    console.log('📍 Step 1: Loading homepage...');
    await page.goto(baseUrl, { waitUntil: 'networkidle', timeout });
    results.timing.pageLoad = Date.now() - startTime;
    console.log(`   ✓ Page loaded in ${results.timing.pageLoad}ms`);
    
    // 2. Wait for database initialization
    console.log('📍 Step 2: Waiting for database initialization...');
    const dbStartTime = Date.now();
    
    // Wait for loading message to disappear or timeout
    let databaseInitialized = false;
    let attempts = 0;
    const maxAttempts = Math.floor(timeout / 10000); // 10 second intervals
    
    while (!databaseInitialized && attempts < maxAttempts) {
      await page.waitForTimeout(10000);
      attempts++;
      
      console.log(`   Attempt ${attempts}/${maxAttempts}: Checking database status...`);
      
      // Check if loading message is gone
      const loadingVisible = await page.locator('text=データベースを初期化中').isVisible().catch(() => false);
      
      // Check if cards have content
      const cards = await page.locator('.MuiCard-root').all();
      if (cards.length > 0) {
        const firstCardText = await cards[0].textContent();
        if (firstCardText && !firstCardText.includes('undefined') && firstCardText.trim().length > 10) {
          databaseInitialized = true;
          results.databaseLoaded = true;
          results.architectureCount = cards.length;
        }
      }
      
      if (!loadingVisible && cards.length > 0) {
        // Double check for real content
        const hasRealContent = await page.evaluate(() => {
          const cards = document.querySelectorAll('.MuiCard-root');
          if (cards.length === 0) return false;
          const firstCard = cards[0];
          const text = firstCard.textContent || '';
          return text.length > 20 && !text.includes('undefined');
        });
        
        if (hasRealContent) {
          databaseInitialized = true;
          results.databaseLoaded = true;
          results.architectureCount = cards.length;
        }
      }
    }
    
    results.timing.databaseInit = Date.now() - dbStartTime;
    
    if (results.databaseLoaded) {
      console.log(`   ✓ Database loaded in ${results.timing.databaseInit}ms`);
      console.log(`   ✓ Found ${results.architectureCount} architecture cards`);
      
      // Get sample content
      const sampleCards = await page.locator('.MuiCard-root').all();
      if (sampleCards.length > 0) {
        console.log('   📋 Sample architecture projects:');
        for (let i = 0; i < Math.min(3, sampleCards.length); i++) {
          const cardText = await sampleCards[i].textContent();
          const title = cardText.split('\n')[0] || 'No title';
          console.log(`      ${i + 1}. ${title}`);
        }
      }
    } else {
      console.log(`   ❌ Database failed to load after ${results.timing.databaseInit}ms`);
      results.errors.push('Database initialization timeout');
    }
    
    if (results.databaseLoaded) {
      // 3. Test search functionality
      console.log('📍 Step 3: Testing search functionality...');
      const searchStartTime = Date.now();
      
      try {
        const searchInput = await page.locator('input[placeholder*="建築作品名"]').first();
        await searchInput.fill('隈研吾');
        await searchInput.press('Enter');
        
        // Wait for navigation to search results
        await page.waitForTimeout(5000);
        
        const searchResults = await page.locator('.MuiCard-root').count();
        const currentUrl = page.url();
        
        if (searchResults > 0 && currentUrl.includes('architecture')) {
          results.searchWorks = true;
          console.log(`   ✓ Search works: Found ${searchResults} results for "隈研吾"`);
        } else {
          console.log(`   ❌ Search failed: ${searchResults} results, URL: ${currentUrl}`);
          results.errors.push('Search functionality failed');
        }
        
        results.timing.search = Date.now() - searchStartTime;
      } catch (searchError) {
        console.log(`   ❌ Search test failed: ${searchError.message}`);
        results.errors.push(`Search error: ${searchError.message}`);
      }
      
      // 4. Test navigation to architecture list
      console.log('📍 Step 4: Testing navigation to architecture list...');
      const navStartTime = Date.now();
      
      try {
        await page.goto(`${baseUrl}#/architecture`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(5000);
        
        const listItems = await page.locator('.MuiCard-root').count();
        const pagination = await page.locator('.MuiPagination-root').count();
        
        if (listItems > 0) {
          results.navigationWorks = true;
          console.log(`   ✓ Navigation works: ${listItems} items in architecture list`);
          console.log(`   ✓ Pagination present: ${pagination > 0 ? 'Yes' : 'No'}`);
        } else {
          console.log(`   ❌ Navigation failed: ${listItems} items found`);
          results.errors.push('Architecture list navigation failed');
        }
        
        results.timing.navigation = Date.now() - navStartTime;
      } catch (navError) {
        console.log(`   ❌ Navigation test failed: ${navError.message}`);
        results.errors.push(`Navigation error: ${navError.message}`);
      }
    }
    
    // Take screenshot
    await page.screenshot({ path: `temp/${name.toLowerCase().replace(/\s+/g, '-')}-test.png`, fullPage: true });
    
    // Determine overall success
    results.success = results.databaseLoaded && (results.searchWorks || results.navigationWorks);
    results.timing.total = Date.now() - startTime;
    
    console.log(`\n🎯 ${name} TEST RESULTS:`);
    console.log(`   Overall Success: ${results.success ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Database Loaded: ${results.databaseLoaded ? '✅' : '❌'}`);
    console.log(`   Search Works: ${results.searchWorks ? '✅' : '❌'}`);
    console.log(`   Navigation Works: ${results.navigationWorks ? '✅' : '❌'}`);
    console.log(`   Architecture Count: ${results.architectureCount}`);
    console.log(`   Total Time: ${results.timing.total}ms`);
    
    if (results.errors.length > 0) {
      console.log(`   Errors: ${results.errors.join(', ')}`);
    }
    
    if (results.consoleErrors.length > 0) {
      console.log(`   Console Errors: ${results.consoleErrors.length}`);
    }
    
  } catch (error) {
    console.log(`❌ Test failed with error: ${error.message}`);
    results.errors.push(error.message);
  } finally {
    await browser.close();
  }
  
  return results;
}

(async () => {
  console.log('🧪 COMPREHENSIVE E2E TESTING');
  console.log('==============================');
  
  // Test both environments
  const localResults = await testEnvironment(
    'LOCAL DEVELOPMENT',
    'http://localhost:3000/archi-site/',
    120000 // 2 minutes
  );
  
  const productionResults = await testEnvironment(
    'GITHUB PAGES PRODUCTION',
    'https://bob-takuya.github.io/archi-site/',
    180000 // 3 minutes for slower CDN
  );
  
  console.log('\n\n📊 FINAL COMPARISON');
  console.log('====================');
  
  const comparison = {
    local: localResults,
    production: productionResults
  };
  
  console.log('Environment        | Database | Search | Navigation | Cards | Time');
  console.log('------------------|----------|--------|------------|-------|-------');
  console.log(`Local Development | ${localResults.databaseLoaded ? '✅' : '❌'}       | ${localResults.searchWorks ? '✅' : '❌'}     | ${localResults.navigationWorks ? '✅' : '❌'}         | ${localResults.architectureCount.toString().padEnd(5)} | ${Math.round(localResults.timing.total/1000)}s`);
  console.log(`GitHub Pages      | ${productionResults.databaseLoaded ? '✅' : '❌'}       | ${productionResults.searchWorks ? '✅' : '❌'}     | ${productionResults.navigationWorks ? '✅' : '❌'}         | ${productionResults.architectureCount.toString().padEnd(5)} | ${Math.round(productionResults.timing.total/1000)}s`);
  
  console.log('\n🔍 ISSUE ANALYSIS:');
  if (localResults.success && !productionResults.success) {
    console.log('❌ PRODUCTION DEPLOYMENT ISSUE DETECTED');
    console.log('   Local works but production fails');
    console.log('   Likely causes:');
    console.log('   - Database file serving issues on GitHub Pages');
    console.log('   - WASM file loading problems');
    console.log('   - Content-Encoding/compression conflicts');
    console.log('   - CDN caching issues');
    
    if (productionResults.consoleErrors.length > 0) {
      console.log('\n   Production Console Errors:');
      productionResults.consoleErrors.forEach(error => {
        console.log(`   - ${error}`);
      });
    }
  } else if (!localResults.success && !productionResults.success) {
    console.log('❌ FUNDAMENTAL CODE ISSUE');
    console.log('   Both environments fail - code needs fixing');
  } else if (localResults.success && productionResults.success) {
    console.log('✅ ALL SYSTEMS WORKING');
    console.log('   Both environments operational');
  }
  
  // Save results
  require('fs').writeFileSync('temp/e2e-test-results.json', JSON.stringify(comparison, null, 2));
  console.log('\n💾 Results saved to temp/e2e-test-results.json');
})();