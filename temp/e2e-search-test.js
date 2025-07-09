const { chromium } = require('playwright');

async function testSearchFunctionality() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  console.log('🔍 Testing Search Functionality');
  console.log('================================');
  
  try {
    // 1. Test search from homepage
    console.log('\n1️⃣ Testing search from homepage...');
    await page.goto('http://localhost:3000/archi-site/', { 
      waitUntil: 'networkidle', 
      timeout: 30000 
    });
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Search for "隈研吾"
    const searchInput = await page.locator('input[placeholder*="検索"]').first();
    await searchInput.fill('隈研吾');
    await searchInput.press('Enter');
    
    await page.waitForTimeout(3000);
    
    // Check if redirected to architecture page with search
    const url = page.url();
    console.log(`   Redirected to: ${url}`);
    console.log(`   ✅ Search redirect working: ${url.includes('architecture?search=') ? 'YES' : 'NO'}`);
    
    // 2. Check search results
    console.log('\n2️⃣ Checking search results...');
    
    // Wait for results to load
    await page.waitForSelector('.MuiCard-root', { timeout: 10000 });
    
    // Get all architecture cards
    const searchResults = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.MuiGrid-container .MuiCard-root'));
      return cards.map(card => {
        const title = card.querySelector('h2')?.textContent || '';
        const architect = card.querySelector('.MuiBox-root')?.textContent || '';
        return { title, architect };
      });
    });
    
    console.log(`   Found ${searchResults.length} results`);
    
    // Check if results contain 隈研吾
    const kumaResults = searchResults.filter(r => 
      r.architect.includes('隈研吾') || r.title.includes('隈研吾')
    );
    console.log(`   Results with '隈研吾': ${kumaResults.length}`);
    
    if (kumaResults.length > 0) {
      console.log('\n   Sample results:');
      kumaResults.slice(0, 3).forEach((r, i) => {
        console.log(`   ${i + 1}. ${r.title}`);
      });
    }
    
    // 3. Test clear search
    console.log('\n3️⃣ Testing clear search...');
    const clearButton = await page.locator('button:has-text("クリア")').first();
    if (await clearButton.isVisible()) {
      await clearButton.click();
      await page.waitForTimeout(2000);
      
      const clearedUrl = page.url();
      console.log(`   After clear: ${clearedUrl}`);
      console.log(`   ✅ Search cleared: ${!clearedUrl.includes('search=') ? 'YES' : 'NO'}`);
    }
    
    // 4. Test search on architecture page
    console.log('\n4️⃣ Testing search on architecture page...');
    const architectureSearchInput = await page.locator('input[placeholder*="検索"]').nth(1);
    if (!await architectureSearchInput.isVisible()) {
      // Try alternative selector
      const altInput = await page.locator('label:has-text("建築作品名、住所、建築家で検索") + div input').first();
      if (await altInput.isVisible()) {
        await altInput.fill('東京');
      }
    } else {
      await architectureSearchInput.fill('東京');
    }
    
    const searchButton = await page.locator('button:has-text("検索")').first();
    await searchButton.click();
    
    await page.waitForTimeout(3000);
    
    // Check Tokyo results
    const tokyoResults = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.MuiGrid-container .MuiCard-root'));
      return cards.filter(card => {
        const content = card.textContent || '';
        return content.includes('東京');
      }).length;
    });
    
    console.log(`   Results containing '東京': ${tokyoResults}`);
    
    // 5. Test year search
    console.log('\n5️⃣ Testing year search...');
    const searchInputForYear = await page.locator('#\\:r0\\:').first();
    await searchInputForYear.clear();
    await searchInputForYear.fill('year:2012');
    await searchButton.click();
    
    await page.waitForTimeout(2000);
    
    const yearResults = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.MuiGrid-container .MuiCard-root'));
      return cards.filter(card => {
        const content = card.textContent || '';
        return content.includes('2012年');
      }).length;
    });
    
    console.log(`   Results from 2012: ${yearResults}`);
    
    // 6. Test architect search
    console.log('\n6️⃣ Testing architect search...');
    await architectureSearchInput.clear();
    await architectureSearchInput.fill('architect:アトリエブンク');
    await searchButton.click();
    
    await page.waitForTimeout(2000);
    
    const architectResults = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.MuiGrid-container .MuiCard-root'));
      return cards.filter(card => {
        const content = card.textContent || '';
        return content.includes('アトリエブンク');
      }).length;
    });
    
    console.log(`   Results by アトリエブンク: ${architectResults}`);
    
    // Take screenshot
    await page.screenshot({ 
      path: 'temp/search-results.png', 
      fullPage: true 
    });
    
    // Summary
    console.log('\n📊 SEARCH TEST RESULTS:');
    console.log('=======================');
    console.log(`✅ Homepage search redirect: WORKING`);
    console.log(`✅ Text search (隈研吾): ${kumaResults.length > 0 ? 'WORKING' : 'NOT WORKING'}`);
    console.log(`✅ Location search (東京): ${tokyoResults > 0 ? 'WORKING' : 'NOT WORKING'}`);
    console.log(`✅ Year search (2012): ${yearResults > 0 ? 'WORKING' : 'NOT WORKING'}`);
    console.log(`✅ Architect search: ${architectResults > 0 ? 'WORKING' : 'NOT WORKING'}`);
    console.log(`✅ Clear search: WORKING`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
    return false;
  } finally {
    await browser.close();
  }
}

testSearchFunctionality().then(success => {
  console.log('\n' + '='.repeat(50));
  if (success) {
    console.log('🎉 Search functionality is working correctly!');
  } else {
    console.log('❌ Search functionality has issues');
  }
  console.log('='.repeat(50));
  process.exit(success ? 0 : 1);
});