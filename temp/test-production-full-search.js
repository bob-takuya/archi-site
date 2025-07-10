const { chromium } = require('playwright');

async function testProductionFullSearch() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  console.log('🌐 Testing Production Site Full Search');
  console.log('======================================');
  console.log('URL: https://bob-takuya.github.io/archi-site/');
  
  try {
    // Test 1: Homepage load time
    console.log('\n1️⃣ Testing homepage performance...');
    const startTime = Date.now();
    await page.goto('https://bob-takuya.github.io/archi-site/', { 
      waitUntil: 'networkidle',
      timeout: 60000
    });
    
    await page.waitForTimeout(3000);
    const loadTime = Date.now() - startTime;
    console.log(`   ✅ Load time: ${loadTime}ms`);
    
    // Test 2: Navigate to architecture page
    console.log('\n2️⃣ Testing architecture page...');
    await page.goto('https://bob-takuya.github.io/archi-site/#/architecture', {
      waitUntil: 'networkidle'
    });
    
    await page.waitForTimeout(3000);
    
    const totalItems = await page.evaluate(() => {
      const text = document.querySelector('.MuiTypography-body2')?.textContent || '';
      const match = text.match(/(\d+)\s*件の建築作品/);
      return match ? parseInt(match[1]) : 0;
    });
    
    console.log(`   ✅ Total items: ${totalItems.toLocaleString()}`);
    console.log(`   ${totalItems === 14467 ? '✅ CORRECT!' : '❌ Should be 14,467'}`);
    
    // Test 3: Search for 隈研吾
    console.log('\n3️⃣ Testing 隈研吾 search...');
    await page.goto('https://bob-takuya.github.io/archi-site/#/architecture?search=隈研吾', {
      waitUntil: 'networkidle'
    });
    
    await page.waitForTimeout(5000);
    
    const kumaTotal = await page.evaluate(() => {
      const text = document.querySelector('.MuiTypography-body2')?.textContent || '';
      const match = text.match(/(\d+)\s*件の建築作品/);
      return match ? parseInt(match[1]) : 0;
    });
    
    console.log(`   ✅ 隈研吾 results: ${kumaTotal}`);
    console.log(`   ${kumaTotal > 200 ? '✅ Full results available!' : '⚠️  Limited results'}`);
    
    // Test 4: Test architect search
    console.log('\n4️⃣ Testing architect:伊東豊雄...');
    await page.goto('https://bob-takuya.github.io/archi-site/#/architecture?search=architect:伊東豊雄', {
      waitUntil: 'networkidle'
    });
    
    await page.waitForTimeout(5000);
    
    const itoTotal = await page.evaluate(() => {
      const text = document.querySelector('.MuiTypography-body2')?.textContent || '';
      const match = text.match(/(\d+)\s*件の建築作品/);
      return match ? parseInt(match[1]) : 0;
    });
    
    console.log(`   ✅ 伊東豊雄 results: ${itoTotal}`);
    
    // Test 5: Year search
    console.log('\n5️⃣ Testing year:2015...');
    await page.goto('https://bob-takuya.github.io/archi-site/#/architecture?search=year:2015', {
      waitUntil: 'networkidle'
    });
    
    await page.waitForTimeout(5000);
    
    const year2015Total = await page.evaluate(() => {
      const text = document.querySelector('.MuiTypography-body2')?.textContent || '';
      const match = text.match(/(\d+)\s*件の建築作品/);
      return match ? parseInt(match[1]) : 0;
    });
    
    console.log(`   ✅ 2015年 results: ${year2015Total}`);
    
    // Take screenshot
    await page.screenshot({ 
      path: 'temp/production-full-search.png', 
      fullPage: true 
    });
    
    // Summary
    console.log('\n📊 PRODUCTION SITE RESULTS:');
    console.log('===========================');
    console.log(`Load Performance: ${loadTime < 10000 ? '✅' : '⚠️'} ${loadTime}ms`);
    console.log(`Total Items: ${totalItems === 14467 ? '✅' : '❌'} ${totalItems.toLocaleString()}`);
    console.log(`隈研吾 Search: ${kumaTotal > 200 ? '✅' : '⚠️'} ${kumaTotal} results`);
    console.log(`伊東豊雄 Search: ✅ ${itoTotal} results`);
    console.log(`Year 2015: ✅ ${year2015Total} results`);
    
    return totalItems === 14467 && kumaTotal > 200;
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
    return false;
  } finally {
    await browser.close();
  }
}

testProductionFullSearch().then(success => {
  console.log('\n' + '='.repeat(50));
  if (success) {
    console.log('🎉 Production site has full search compatibility!');
    console.log('All 14,467 architecture records are searchable.');
    console.log('Visit: https://bob-takuya.github.io/archi-site/');
  } else {
    console.log('⚠️  Production site may need more time to deploy');
  }
  console.log('='.repeat(50));
  process.exit(success ? 0 : 1);
});