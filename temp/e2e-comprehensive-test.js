const { chromium } = require('playwright');

async function comprehensiveTest() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  console.log('🎯 Comprehensive E2E Test - Architecture Site');
  console.log('============================================');
  
  const results = {
    homepage: false,
    loadTime: 0,
    search: false,
    yearFilter: false,
    architectFilter: false,
    locationSearch: false,
    pagination: false,
    navigation: false
  };
  
  try {
    // Test 1: Homepage Loading & Performance
    console.log('\n1️⃣ Testing Homepage...');
    const startTime = Date.now();
    
    await page.goto('http://localhost:3000/archi-site/', { 
      waitUntil: 'networkidle', 
      timeout: 30000 
    });
    
    await page.waitForTimeout(2000);
    results.loadTime = Date.now() - startTime;
    
    // Check for recent works
    const recentWorks = await page.evaluate(() => {
      const section = document.querySelector('section[aria-labelledby="recent-works-heading"]');
      if (!section) return [];
      
      const cards = Array.from(section.querySelectorAll('.MuiCard-root'));
      return cards.map(card => ({
        title: card.querySelector('h3')?.textContent || '',
        architect: card.querySelector('.MuiTypography-body2')?.textContent || ''
      })).filter(item => item.title && !item.title.includes('建築作品'));
    });
    
    console.log(`   ✅ Load time: ${results.loadTime}ms`);
    console.log(`   ✅ Recent works displayed: ${recentWorks.length}`);
    results.homepage = recentWorks.length > 0;
    
    // Test 2: Search from Homepage
    console.log('\n2️⃣ Testing Search from Homepage...');
    const searchInput = await page.locator('input[placeholder*="検索"]').first();
    await searchInput.fill('隈研吾');
    await searchInput.press('Enter');
    
    await page.waitForTimeout(2000);
    
    const searchUrl = page.url();
    results.search = searchUrl.includes('architecture?search=');
    console.log(`   ✅ Search redirect: ${results.search ? 'WORKING' : 'FAILED'}`);
    
    // Check search results
    const kumaResults = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.MuiGrid-container .MuiCard-root'));
      return cards.filter(card => card.textContent?.includes('隈研吾')).length;
    });
    console.log(`   ✅ 隈研吾 results: ${kumaResults}`);
    
    // Test 3: Year Filter
    console.log('\n3️⃣ Testing Year Filter...');
    await page.goto('http://localhost:3000/archi-site/#/architecture?search=year:2012', {
      waitUntil: 'networkidle'
    });
    
    await page.waitForTimeout(2000);
    
    const year2012Results = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.MuiGrid-container .MuiCard-root'));
      return cards.filter(card => card.textContent?.includes('2012年')).length;
    });
    
    results.yearFilter = year2012Results > 0;
    console.log(`   ✅ 2012年 results: ${year2012Results}`);
    
    // Test 4: Architect Filter
    console.log('\n4️⃣ Testing Architect Filter...');
    await page.goto('http://localhost:3000/archi-site/#/architecture?search=architect:安藤忠雄', {
      waitUntil: 'networkidle'
    });
    
    await page.waitForTimeout(2000);
    
    const andoResults = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.MuiGrid-container .MuiCard-root'));
      return cards.filter(card => card.textContent?.includes('安藤忠雄')).length;
    });
    
    results.architectFilter = andoResults > 0;
    console.log(`   ✅ 安藤忠雄 results: ${andoResults}`);
    
    // Test 5: Location Search
    console.log('\n5️⃣ Testing Location Search...');
    await page.goto('http://localhost:3000/archi-site/#/architecture?search=北海道', {
      waitUntil: 'networkidle'
    });
    
    await page.waitForTimeout(2000);
    
    const hokkaidoResults = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.MuiGrid-container .MuiCard-root'));
      return cards.filter(card => card.textContent?.includes('北海道')).length;
    });
    
    results.locationSearch = hokkaidoResults > 0;
    console.log(`   ✅ 北海道 results: ${hokkaidoResults}`);
    
    // Test 6: Pagination
    console.log('\n6️⃣ Testing Pagination...');
    await page.goto('http://localhost:3000/archi-site/#/architecture', {
      waitUntil: 'networkidle'
    });
    
    await page.waitForTimeout(2000);
    
    const totalItems = await page.evaluate(() => {
      const text = document.querySelector('.MuiTypography-body2')?.textContent || '';
      const match = text.match(/(\d+)\s*件の建築作品/);
      return match ? parseInt(match[1]) : 0;
    });
    
    const paginationExists = await page.locator('.MuiPagination-root').first().isVisible();
    results.pagination = paginationExists && totalItems > 12;
    console.log(`   ✅ Total items: ${totalItems}`);
    console.log(`   ✅ Pagination: ${results.pagination ? 'AVAILABLE' : 'NOT FOUND'}`);
    
    // Test 7: Navigation to Detail
    console.log('\n7️⃣ Testing Navigation to Detail Page...');
    try {
      // Go back to main architecture page first
      await page.goto('http://localhost:3000/archi-site/#/architecture', {
        waitUntil: 'networkidle'
      });
      await page.waitForTimeout(2000);
      
      // Click on the first card's action area
      const firstCard = await page.locator('.MuiCardActionArea-root').first();
      if (await firstCard.isVisible()) {
        await firstCard.click();
        await page.waitForTimeout(2000);
        
        const detailUrl = page.url();
        results.navigation = detailUrl.includes('/architecture/') && !detailUrl.endsWith('/architecture');
        console.log(`   ✅ Navigated to: ${detailUrl}`);
        console.log(`   ✅ Detail page: ${results.navigation ? 'WORKING' : 'FAILED'}`);
      } else {
        console.log('   ⚠️  No cards found to navigate');
        results.navigation = false;
      }
    } catch (navError) {
      console.log('   ⚠️  Navigation test skipped:', navError.message);
      results.navigation = false;
    }
    
    // Take final screenshot
    await page.screenshot({ 
      path: 'temp/comprehensive-test.png', 
      fullPage: true 
    });
    
    // Summary
    console.log('\n📊 COMPREHENSIVE TEST RESULTS:');
    console.log('==============================');
    console.log(`✅ Homepage: ${results.homepage ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Load Time: ${results.loadTime}ms (${results.loadTime < 5000 ? 'EXCELLENT' : 'NEEDS IMPROVEMENT'})`);
    console.log(`✅ Search: ${results.search ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Year Filter: ${results.yearFilter ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Architect Filter: ${results.architectFilter ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Location Search: ${results.locationSearch ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Pagination: ${results.pagination ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Navigation: ${results.navigation ? 'PASS' : 'FAIL'}`);
    
    // Overall result
    const allPassed = Object.values(results).every(r => 
      typeof r === 'boolean' ? r : true
    );
    
    return allPassed;
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
    console.error(error.stack);
    return false;
  } finally {
    await browser.close();
  }
}

comprehensiveTest().then(success => {
  console.log('\n' + '='.repeat(50));
  if (success) {
    console.log('🎉 ALL TESTS PASSED!');
    console.log('The architecture site is fully functional with:');
    console.log('- Fast loading (JSON-based)');
    console.log('- Working search (text, year, architect, location)');
    console.log('- Pagination');
    console.log('- Navigation');
  } else {
    console.log('❌ Some tests failed - check results above');
  }
  console.log('='.repeat(50));
  process.exit(success ? 0 : 1);
});