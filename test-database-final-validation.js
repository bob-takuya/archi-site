/**
 * Final validation test for the SQLite database loading fix
 * This test directly navigates to the live site and validates the database functionality
 */

const { chromium } = require('playwright');

const TEST_URL = 'https://bob-takuya.github.io/archi-site/';
const EXTENDED_TIMEOUT = 300000; // 5 minutes for database loading

async function runDatabaseValidationTest() {
  console.log('🚀 Starting final database validation test...');
  console.log(`🌐 Testing URL: ${TEST_URL}`);
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Set up console logging to capture database messages
    const consoleMessages = [];
    page.on('console', msg => {
      const text = msg.text();
      consoleMessages.push(text);
      
      if (text.includes('データベース') || text.includes('database') || text.includes('SQLite') || text.includes('sql.js')) {
        console.log(`📊 Database log: ${text}`);
      }
      
      if (text.includes('エラー') || text.includes('error') || text.includes('Error')) {
        console.log(`❌ Error log: ${text}`);
      }
    });
    
    // Navigate to the site
    console.log('🔍 Navigating to site...');
    await page.goto(TEST_URL, { timeout: 60000 });
    
    // Wait for initial page load
    await page.waitForLoadState('networkidle');
    
    // Check page title
    const title = await page.title();
    console.log(`📄 Page title: ${title}`);
    
    // Take initial screenshot
    await page.screenshot({ path: 'validation-initial.png', fullPage: true });
    
    // Wait for database loading with extended timeout
    console.log('⏳ Waiting for database initialization (up to 5 minutes)...');
    
    let databaseLoaded = false;
    let attempts = 0;
    const maxAttempts = 30; // 30 attempts, 10 seconds each = 5 minutes
    
    while (!databaseLoaded && attempts < maxAttempts) {
      attempts++;
      console.log(`🔄 Attempt ${attempts}/${maxAttempts} - Checking database status...`);
      
      try {
        // Check for database completion indicators
        const pageContent = await page.content();
        const bodyText = await page.textContent('body');
        
        console.log('📋 Checking for database completion indicators...');
        
        // Look for signs that database has loaded
        const hasRealData = await page.evaluate(() => {
          const body = document.body;
          const bodyText = body.innerText;
          
          // Check for real architecture data
          const realDataPatterns = [
            /建築家：[^不明データベース]/,
            /\d{4}年[^代不明]/,
            /東京|大阪|京都|名古屋|横浜/,
            /安藤忠雄|丹下健三|隈研吾|伊東豊雄/,
            /美術館|図書館|博物館|駅|タワー/
          ];
          
          const hasRealArchitectureData = realDataPatterns.some(pattern => pattern.test(bodyText));
          
          // Check for cards with real content
          const cards = document.querySelectorAll('.MuiCard-root, .architecture-card, .building-card');
          let hasCardWithRealData = false;
          
          for (const card of cards) {
            const cardText = card.textContent || '';
            if (cardText.includes('年') && !cardText.includes('年代不明') && !cardText.includes('データベース')) {
              hasCardWithRealData = true;
              break;
            }
          }
          
          console.log('🔍 Data check results:');
          console.log('  - Real architecture data patterns:', hasRealArchitectureData);
          console.log('  - Cards with real data:', hasCardWithRealData);
          console.log('  - Total cards found:', cards.length);
          
          return hasRealArchitectureData || hasCardWithRealData;
        });
        
        // Check if still showing loading states
        const isStillLoading = await page.evaluate(() => {
          const loadingText = document.body.innerText;
          return loadingText.includes('データベースを初期化中') || 
                 loadingText.includes('読み込み中') || 
                 loadingText.includes('Loading') ||
                 loadingText.includes('Initializing');
        });
        
        console.log(`🎯 Results for attempt ${attempts}:`);
        console.log(`  - Has real data: ${hasRealData}`);
        console.log(`  - Still loading: ${isStillLoading}`);
        
        if (hasRealData && !isStillLoading) {
          databaseLoaded = true;
          console.log('✅ Database loaded successfully!');
          break;
        }
        
        if (!isStillLoading && !hasRealData) {
          console.log('⚠️ Database loading appears to have failed - no loading state but no real data');
          break;
        }
        
        // Wait 10 seconds before next check
        console.log('⏱️ Waiting 10 seconds before next check...');
        await page.waitForTimeout(10000);
        
      } catch (error) {
        console.log(`❌ Error during attempt ${attempts}:`, error.message);
        await page.waitForTimeout(5000);
      }
    }
    
    // Final validation
    console.log('\n🎯 FINAL VALIDATION RESULTS:');
    console.log(`Database loaded: ${databaseLoaded}`);
    console.log(`Total attempts: ${attempts}`);
    console.log(`Console messages captured: ${consoleMessages.length}`);
    
    // Take final screenshot
    await page.screenshot({ path: 'validation-final.png', fullPage: true });
    
    // Test specific functionality if database loaded
    if (databaseLoaded) {
      console.log('\n🧪 Testing specific functionality...');
      
      // Test search functionality
      console.log('🔍 Testing search functionality...');
      const searchInput = await page.$('input[type="search"], input[placeholder*="検索"]');
      if (searchInput) {
        await searchInput.fill('安藤忠雄');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(5000);
        
        const searchResults = await page.evaluate(() => {
          const results = document.querySelectorAll('.MuiCard-root, .search-result, .architecture-item');
          return results.length;
        });
        
        console.log(`🔍 Search results found: ${searchResults}`);
        await page.screenshot({ path: 'validation-search.png', fullPage: true });
      }
      
      // Test navigation to architecture list
      console.log('🏛️ Testing architecture list navigation...');
      try {
        await page.click('a[href*="architecture"], a[href*="作品"]');
        await page.waitForTimeout(5000);
        
        const architectureItems = await page.evaluate(() => {
          const items = document.querySelectorAll('.MuiCard-root, .architecture-item');
          return items.length;
        });
        
        console.log(`🏛️ Architecture items found: ${architectureItems}`);
        await page.screenshot({ path: 'validation-architecture-list.png', fullPage: true });
      } catch (error) {
        console.log('⚠️ Architecture list navigation failed:', error.message);
      }
    }
    
    // Generate final report
    const report = {
      timestamp: new Date().toISOString(),
      testUrl: TEST_URL,
      success: databaseLoaded,
      attempts: attempts,
      consoleMessagesCount: consoleMessages.length,
      finalStatus: databaseLoaded ? 'SUCCESS' : 'FAILED',
      consoleMessages: consoleMessages.slice(-20) // Last 20 messages
    };
    
    console.log('\n📊 FINAL TEST REPORT:');
    console.log('='.repeat(50));
    console.log(`Test Status: ${report.finalStatus}`);
    console.log(`Database Loaded: ${report.success}`);
    console.log(`Attempts Made: ${report.attempts}`);
    console.log(`Console Messages: ${report.consoleMessagesCount}`);
    console.log('='.repeat(50));
    
    if (report.success) {
      console.log('🎉 SUCCESS: Users can now see Japanese architecture data!');
      console.log('✅ The SQLite database loading fix is working correctly.');
    } else {
      console.log('❌ FAILURE: Database loading is still not working.');
      console.log('❌ Users cannot see architecture data.');
      console.log('🔧 Implementation needs further fixes.');
    }
    
    // Save report to file
    require('fs').writeFileSync(
      'final-validation-report.json', 
      JSON.stringify(report, null, 2)
    );
    
    return report;
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  } finally {
    await browser.close();
  }
}

// Run the test
runDatabaseValidationTest()
  .then(report => {
    console.log('\n✅ Test completed');
    process.exit(report.success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });