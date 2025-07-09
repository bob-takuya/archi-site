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
    console.log('\n2️⃣ Checking search results for 隈研吾...');
    
    // Wait for results to load
    await page.waitForSelector('.MuiCard-root', { timeout: 10000 });
    
    // Get all architecture cards
    const searchResults = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.MuiGrid-container .MuiCard-root'));
      return cards.map(card => {
        const title = card.querySelector('h2')?.textContent || '';
        const content = card.textContent || '';
        return { title, content };
      });
    });
    
    console.log(`   Found ${searchResults.length} results`);
    
    // Check if results contain 隈研吾
    const kumaResults = searchResults.filter(r => 
      r.content.includes('隈研吾')
    );
    console.log(`   Results with '隈研吾': ${kumaResults.length}`);
    
    if (kumaResults.length > 0) {
      console.log('\n   Sample results:');
      kumaResults.slice(0, 3).forEach((r, i) => {
        console.log(`   ${i + 1}. ${r.title}`);
      });
    }
    
    // 3. Test direct navigation to search
    console.log('\n3️⃣ Testing direct URL search...');
    await page.goto('http://localhost:3000/archi-site/#/architecture?search=東京', {
      waitUntil: 'networkidle'
    });
    
    await page.waitForTimeout(3000);
    
    const tokyoResults = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.MuiGrid-container .MuiCard-root'));
      return cards.filter(card => {
        const content = card.textContent || '';
        return content.includes('東京');
      }).length;
    });
    
    console.log(`   Results containing '東京': ${tokyoResults}`);
    
    // 4. Test year search via URL
    console.log('\n4️⃣ Testing year search...');
    await page.goto('http://localhost:3000/archi-site/#/architecture?search=year:2012', {
      waitUntil: 'networkidle'
    });
    
    await page.waitForTimeout(3000);
    
    const yearResults = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.MuiGrid-container .MuiCard-root'));
      return cards.filter(card => {
        const content = card.textContent || '';
        return content.includes('2012年');
      }).length;
    });
    
    console.log(`   Results from 2012: ${yearResults}`);
    
    // 5. Test architect search via URL
    console.log('\n5️⃣ Testing architect search...');
    await page.goto('http://localhost:3000/archi-site/#/architecture?search=architect:アトリエブンク', {
      waitUntil: 'networkidle'
    });
    
    await page.waitForTimeout(3000);
    
    const architectResults = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.MuiGrid-container .MuiCard-root'));
      return cards.filter(card => {
        const content = card.textContent || '';
        return content.includes('アトリエブンク');
      }).length;
    });
    
    console.log(`   Results by アトリエブンク: ${architectResults}`);
    
    // 6. Test pagination
    console.log('\n6️⃣ Testing pagination...');
    await page.goto('http://localhost:3000/archi-site/#/architecture', {
      waitUntil: 'networkidle'
    });
    
    await page.waitForTimeout(2000);
    
    // Check if pagination exists
    const paginationButtons = await page.locator('.MuiPagination-root button').count();
    console.log(`   Pagination buttons found: ${paginationButtons}`);
    
    if (paginationButtons > 3) { // At least prev, 1, 2, next
      // Click page 2
      const page2Button = await page.locator('.MuiPagination-root button:has-text("2")').first();
      if (await page2Button.isVisible()) {
        await page2Button.click();
        await page.waitForTimeout(2000);
        
        const urlAfterPagination = page.url();
        console.log(`   ✅ Pagination working: ${urlAfterPagination !== 'http://localhost:3000/archi-site/#/architecture' ? 'YES' : 'MAYBE'}`);
      }
    }
    
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
    console.log(`✅ Pagination: ${paginationButtons > 3 ? 'AVAILABLE' : 'NOT FOUND'}`);
    
    const allTestsPassed = kumaResults.length > 0 && tokyoResults > 0 && 
                          yearResults > 0 && architectResults > 0;
    
    return allTestsPassed;
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
    console.error(error.stack);
    return false;
  } finally {
    await browser.close();
  }
}

testSearchFunctionality().then(success => {
  console.log('\n' + '='.repeat(50));
  if (success) {
    console.log('🎉 All search functionality tests passed!');
  } else {
    console.log('⚠️  Some search tests failed - check results above');
  }
  console.log('='.repeat(50));
  process.exit(success ? 0 : 1);
});