const { chromium } = require('playwright');

async function verifyActualData() {
  const browser = await chromium.launch({ headless: false }); // Run with UI to see what's happening
  const page = await browser.newPage();
  
  console.log('🔍 E2E Test: Verifying Actual Database Content');
  console.log('==============================================');
  
  try {
    // First test local server
    console.log('\n📍 Testing LOCAL SERVER (http://localhost:3000)...');
    await page.goto('http://localhost:3000/archi-site/', { 
      waitUntil: 'networkidle', 
      timeout: 60000 
    });
    
    console.log('⏳ Waiting for actual content to load...');
    
    // Wait up to 30 seconds for actual architecture cards
    let actualDataFound = false;
    let loadingStillVisible = false;
    
    for (let i = 0; i < 30; i++) {
      await page.waitForTimeout(1000);
      
      // Check if loading message is still visible
      const loadingElements = await page.locator('text=/ロード中|読み込み中|Loading/i').all();
      loadingStillVisible = loadingElements.length > 0;
      
      // Look for actual architecture data
      const architectureCards = await page.locator('.MuiCard-root').all();
      console.log(`  Second ${i + 1}: Found ${architectureCards.length} cards, Loading visible: ${loadingStillVisible}`);
      
      if (architectureCards.length > 0) {
        // Check if cards have real content (not loading placeholders)
        for (const card of architectureCards.slice(0, 3)) {
          const cardText = await card.textContent();
          console.log(`    Card content: ${cardText?.substring(0, 100)}...`);
          
          // Look for signs of real data: Japanese text, years, architect names
          if (cardText && (
            cardText.match(/[ぁ-ん]+|[ァ-ヴー]+|[一-龯]+/) || // Japanese characters
            cardText.match(/\d{4}年/) || // Year in Japanese format
            cardText.match(/設計|建築|作品/) // Architecture-related terms
          )) {
            actualDataFound = true;
            console.log('    ✅ Found real architecture data!');
            break;
          }
        }
      }
      
      if (actualDataFound && !loadingStillVisible) {
        console.log(`✅ Data loaded successfully after ${i + 1} seconds`);
        break;
      }
    }
    
    // Take screenshot
    await page.screenshot({ 
      path: 'temp/local-server-state.png', 
      fullPage: true 
    });
    
    // Get page state details
    console.log('\n📊 Page State Analysis:');
    
    // Check for loading indicators
    const loadingIndicators = await page.locator('text=/ロード中|読み込み中|Loading|データベース.*タイムアウト/i').all();
    console.log(`Loading indicators found: ${loadingIndicators.length}`);
    for (const indicator of loadingIndicators) {
      console.log(`  - "${await indicator.textContent()}"`);
    }
    
    // Check for error messages
    const errorMessages = await page.locator('text=/エラー|Error|失敗|failed/i').all();
    console.log(`Error messages found: ${errorMessages.length}`);
    for (const error of errorMessages) {
      console.log(`  - "${await error.textContent()}"`);
    }
    
    // Check for actual content
    const contentElements = await page.locator('.MuiCard-root, .MuiPaper-root').all();
    console.log(`Content elements found: ${contentElements.length}`);
    
    // Sample first few elements
    for (let i = 0; i < Math.min(5, contentElements.length); i++) {
      const text = await contentElements[i].textContent();
      if (text && text.trim()) {
        console.log(`  Element ${i + 1}: "${text.substring(0, 150)}..."`);
      }
    }
    
    // Check console logs
    const consoleLogs = [];
    page.on('console', msg => {
      consoleLogs.push(`${msg.type()}: ${msg.text()}`);
    });
    
    // Reload page to capture console logs
    console.log('\n🔄 Reloading page to capture console logs...');
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(5000);
    
    console.log('\n📋 Console Logs:');
    consoleLogs.slice(-20).forEach(log => console.log(`  ${log}`));
    
    // Final verdict
    console.log('\n📊 FINAL RESULTS:');
    console.log('==================');
    console.log(`Actual Data Found: ${actualDataFound ? '✅ YES' : '❌ NO'}`);
    console.log(`Loading Still Visible: ${loadingStillVisible ? '⚠️ YES' : '✅ NO'}`);
    console.log(`Screenshot saved: temp/local-server-state.png`);
    
    if (!actualDataFound) {
      console.log('\n❌ CRITICAL: No actual database content is being displayed!');
      console.log('The page appears to be stuck in a loading state.');
      
      // Check network tab for failed requests
      console.log('\n🌐 Checking for failed network requests...');
      page.on('requestfailed', request => {
        console.log(`  ❌ Failed: ${request.url()}`);
      });
      
      // Try direct FastArchitectureService test
      console.log('\n🔧 Testing FastArchitectureService directly...');
      const serviceTest = await page.evaluate(async () => {
        try {
          const { getAllArchitectures } = await import('/archi-site/src/services/api/FastArchitectureService.ts');
          const result = await getAllArchitectures(1, 5);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });
      
      console.log('Service test result:', JSON.stringify(serviceTest, null, 2));
    }
    
    return actualDataFound;
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  } finally {
    await browser.close();
  }
}

verifyActualData().then(success => {
  console.log('\n' + '='.repeat(50));
  if (success) {
    console.log('✅ SUCCESS: Actual database content is displaying!');
  } else {
    console.log('❌ FAILURE: Database content is NOT displaying!');
    console.log('The site appears to be stuck in loading state.');
  }
  console.log('='.repeat(50));
  process.exit(success ? 0 : 1);
});