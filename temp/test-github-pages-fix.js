const { chromium } = require('playwright');

async function testGitHubPagesFix() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  console.log('🧪 Testing GitHub Pages Database Fix');
  console.log('==================================');
  
  // Capture console logs
  const consoleLogs = [];
  page.on('console', msg => {
    consoleLogs.push(`${msg.type()}: ${msg.text()}`);
    console.log(`Console ${msg.type()}: ${msg.text()}`);
  });
  
  try {
    console.log('📍 Loading GitHub Pages site...');
    await page.goto('https://bob-takuya.github.io/archi-site/', { 
      waitUntil: 'networkidle', 
      timeout: 120000 
    });
    
    console.log('⏳ Waiting for database initialization...');
    let success = false;
    let attempts = 0;
    const maxAttempts = 30; // 5 minutes
    
    while (!success && attempts < maxAttempts) {
      await page.waitForTimeout(10000); // Wait 10 seconds between checks
      attempts++;
      
      console.log(`   Attempt ${attempts}/${maxAttempts}: Checking for database content...`);
      
      // Check for architecture cards with real content
      const cards = await page.locator('.MuiCard-root').all();
      if (cards.length > 0) {
        console.log(`   Found ${cards.length} cards, checking content...`);
        
        let hasRealContent = false;
        for (const card of cards.slice(0, 3)) {
          const cardText = await card.textContent();
          if (cardText && cardText.trim().length > 20 && !cardText.includes('undefined') && !cardText.includes('unknown')) {
            hasRealContent = true;
            console.log(`   ✅ Real content found: ${cardText.split('\n')[0]}`);
            break;
          }
        }
        
        if (hasRealContent) {
          success = true;
          console.log('🎉 SUCCESS: Database is loading with real content!');
          
          // Test search functionality
          console.log('🔍 Testing search functionality...');
          const searchInput = await page.locator('input[type="text"]').first();
          if (await searchInput.isVisible()) {
            await searchInput.fill('隈研吾');
            await searchInput.press('Enter');
            await page.waitForTimeout(5000);
            
            const searchResults = await page.locator('.MuiCard-root').count();
            if (searchResults > 0) {
              console.log(`   ✅ Search works: ${searchResults} results for 隈研吾`);
            }
          }
          
          break;
        } else {
          console.log(`   ⚠️ Cards found but no real content yet...`);
        }
      } else {
        console.log(`   ⚠️ No cards found yet...`);
      }
    }
    
    if (!success) {
      console.log('❌ FAILURE: Database did not load with real content after 5 minutes');
      
      // Check for specific error patterns
      const hasGzipError = consoleLogs.some(log => log.includes('gzip') || log.includes('compression'));
      const hasRangeError = consoleLogs.some(log => log.includes('range') || log.includes('206'));
      const hasContentLengthError = consoleLogs.some(log => log.includes('content-length'));
      
      if (hasGzipError) {
        console.log('🔍 GZIP compression errors detected - fix may need further adjustment');
      }
      if (hasRangeError) {
        console.log('🔍 HTTP Range request errors detected');
      }
      if (hasContentLengthError) {
        console.log('🔍 Content-length header errors detected');
      }
    }
    
    // Take a screenshot for debugging
    await page.screenshot({ 
      path: 'temp/github-pages-fix-test.png', 
      fullPage: true 
    });
    
    console.log('\n📊 Test Summary:');
    console.log(`Result: ${success ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Database Loading: ${success ? 'Working' : 'Failed'}`);
    console.log(`Console Messages: ${consoleLogs.length} total`);
    console.log('Screenshot: temp/github-pages-fix-test.png');
    
    return success;
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    return false;
  } finally {
    await browser.close();
  }
}

testGitHubPagesFix().then(success => {
  console.log('\n🏁 FINAL RESULT:', success ? 'GitHub Pages fix SUCCESSFUL!' : 'GitHub Pages fix FAILED');
  process.exit(success ? 0 : 1);
});