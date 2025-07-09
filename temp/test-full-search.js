const { chromium } = require('playwright');

async function testFullSearch() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  console.log('🔍 Testing Full Search Compatibility');
  console.log('=====================================');
  
  // Enable console logging
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('📋') || text.includes('⚠️') || text.includes('🔍')) {
      console.log(`   [Console] ${text}`);
    }
  });
  
  try {
    // Test 1: Check total items on main page
    console.log('\n1️⃣ Testing main architecture page...');
    await page.goto('http://localhost:3000/archi-site/#/architecture', { 
      waitUntil: 'networkidle' 
    });
    
    await page.waitForTimeout(2000);
    
    const totalItems = await page.evaluate(() => {
      const text = document.querySelector('.MuiTypography-body2')?.textContent || '';
      const match = text.match(/(\d+)\s*件の建築作品/);
      return match ? parseInt(match[1]) : 0;
    });
    
    console.log(`   ✅ Total items displayed: ${totalItems.toLocaleString()}`);
    console.log(`   ${totalItems === 14467 ? '✅ CORRECT!' : '❌ INCORRECT - should be 14,467'}`);
    
    // Test 2: Search for 隈研吾
    console.log('\n2️⃣ Testing 隈研吾 search...');
    await page.goto('http://localhost:3000/archi-site/#/architecture?search=隈研吾', {
      waitUntil: 'networkidle'
    });
    
    await page.waitForTimeout(3000);
    
    const kumaTotal = await page.evaluate(() => {
      const text = document.querySelector('.MuiTypography-body2')?.textContent || '';
      const match = text.match(/(\d+)\s*件の建築作品/);
      return match ? parseInt(match[1]) : 0;
    });
    
    const kumaCards = await page.locator('.MuiGrid-container .MuiCard-root').count();
    
    console.log(`   ✅ 隈研吾 total results: ${kumaTotal}`);
    console.log(`   ✅ Cards displayed on page: ${kumaCards}`);
    console.log(`   ${kumaTotal > 50 ? '✅ GOOD - showing many results!' : '⚠️  Limited results'}`);
    
    // Test 3: Search for architect:安藤忠雄
    console.log('\n3️⃣ Testing architect:安藤忠雄...');
    await page.goto('http://localhost:3000/archi-site/#/architecture?search=architect:安藤忠雄', {
      waitUntil: 'networkidle'
    });
    
    await page.waitForTimeout(3000);
    
    const andoTotal = await page.evaluate(() => {
      const text = document.querySelector('.MuiTypography-body2')?.textContent || '';
      const match = text.match(/(\d+)\s*件の建築作品/);
      return match ? parseInt(match[1]) : 0;
    });
    
    console.log(`   ✅ 安藤忠雄 total results: ${andoTotal}`);
    console.log(`   ${andoTotal > 50 ? '✅ GOOD - showing many results!' : '⚠️  Limited results'}`);
    
    // Test 4: Test pagination with many results
    console.log('\n4️⃣ Testing pagination...');
    const totalPages = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('.MuiPagination-root button'));
      const pageNumbers = buttons
        .map(b => parseInt(b.textContent || '0'))
        .filter(n => !isNaN(n) && n > 0);
      return Math.max(...pageNumbers, 0);
    });
    
    console.log(`   ✅ Total pages available: ${totalPages}`);
    console.log(`   ${totalPages > 1 ? '✅ Multiple pages available' : '❌ No pagination'}`);
    
    // Test 5: Year search
    console.log('\n5️⃣ Testing year:1997...');
    await page.goto('http://localhost:3000/archi-site/#/architecture?search=year:1997', {
      waitUntil: 'networkidle'
    });
    
    await page.waitForTimeout(3000);
    
    const year1997Total = await page.evaluate(() => {
      const text = document.querySelector('.MuiTypography-body2')?.textContent || '';
      const match = text.match(/(\d+)\s*件の建築作品/);
      return match ? parseInt(match[1]) : 0;
    });
    
    console.log(`   ✅ 1997年 total results: ${year1997Total}`);
    
    // Summary
    console.log('\n📊 SEARCH COMPATIBILITY RESULTS:');
    console.log('================================');
    console.log(`Total Items: ${totalItems === 14467 ? '✅' : '❌'} ${totalItems.toLocaleString()} / 14,467`);
    console.log(`隈研吾 Search: ${kumaTotal > 50 ? '✅' : '⚠️'} ${kumaTotal} results`);
    console.log(`安藤忠雄 Search: ${andoTotal > 50 ? '✅' : '⚠️'} ${andoTotal} results`);
    console.log(`Year Search: ✅ ${year1997Total} results`);
    console.log(`Pagination: ${totalPages > 1 ? '✅' : '❌'} ${totalPages} pages`);
    
    return totalItems === 14467 && kumaTotal > 50;
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
    return false;
  } finally {
    await browser.close();
  }
}

testFullSearch().then(success => {
  console.log('\n' + '='.repeat(50));
  if (success) {
    console.log('🎉 Full search compatibility achieved!');
    console.log('All 14,467 architecture records are searchable.');
  } else {
    console.log('⚠️  Search compatibility needs improvement');
  }
  console.log('='.repeat(50));
  process.exit(success ? 0 : 1);
});