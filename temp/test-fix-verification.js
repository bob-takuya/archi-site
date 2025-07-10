const { chromium } = require('playwright');

async function testFixVerification() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  console.log('🔍 Testing Fix Verification');
  console.log('===========================');
  
  let errorCount = 0;
  let mapErrorCount = 0;
  
  try {
    // Listen for console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('❌ Console Error:', msg.text());
        errorCount++;
        if (msg.text().includes('render2') || msg.text().includes('context consumer')) {
          mapErrorCount++;
        }
      }
    });
    
    // Listen for page errors
    page.on('pageerror', error => {
      console.log('❌ Page Error:', error.message);
      errorCount++;
      if (error.message.includes('render2') || error.message.includes('context')) {
        mapErrorCount++;
      }
    });
    
    // Listen for failed requests
    page.on('requestfailed', request => {
      console.log('⚠️ Failed Request:', request.url(), request.failure().errorText);
    });
    
    console.log('\n1️⃣ Testing single architecture page with map...');
    await page.goto('http://localhost:3002/archi-site/#/architecture/1', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    await page.waitForTimeout(5000);
    
    // Check if map is displayed
    const mapDisplayed = await page.evaluate(() => {
      const mapContainer = document.querySelector('.leaflet-container');
      return mapContainer !== null;
    });
    
    console.log(`📍 Map container found: ${mapDisplayed ? '✅' : '❌'}`);
    
    // Check for specific error messages
    const errorMessages = await page.evaluate(() => {
      const bodyText = document.body.textContent || '';
      return {
        hasJapaneseError: bodyText.includes('アプリケーションで予期しないエラーが発生しました') || 
                         bodyText.includes('予期しないエラー') ||
                         bodyText.includes('お手数ですが、再読み込みをお試しください'),
        hasErrorBoundary: document.querySelector('[class*="error"]') !== null
      };
    });
    
    console.log(`🚫 Japanese error message: ${errorMessages.hasJapaneseError ? '❌' : '✅'}`);
    console.log(`🚫 Error boundary triggered: ${errorMessages.hasErrorBoundary ? '❌' : '✅'}`);
    
    console.log('\n2️⃣ Testing map page...');
    await page.goto('http://localhost:3002/archi-site/#/map', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    await page.waitForTimeout(5000);
    
    const mapPageDisplayed = await page.evaluate(() => {
      const mapContainer = document.querySelector('.leaflet-container');
      const hasMarkers = document.querySelectorAll('.leaflet-marker-icon').length > 0;
      return {
        mapContainer: mapContainer !== null,
        hasMarkers: hasMarkers
      };
    });
    
    console.log(`📍 Map page container: ${mapPageDisplayed.mapContainer ? '✅' : '❌'}`);
    console.log(`📍 Map has markers: ${mapPageDisplayed.hasMarkers ? '✅' : '❌'}`);
    
    const mapPageErrors = await page.evaluate(() => {
      const bodyText = document.body.textContent || '';
      return bodyText.includes('アプリケーションで予期しないエラーが発生しました') || 
             bodyText.includes('予期しないエラー') ||
             bodyText.includes('お手数ですが、再読み込みをお試しください');
    });
    
    console.log(`🚫 Map page errors: ${mapPageErrors ? '❌' : '✅'}`);
    
    // Take screenshot
    await page.screenshot({ 
      path: 'temp/fix-verification.png', 
      fullPage: true 
    });
    
    console.log('\n📊 SUMMARY:');
    console.log('============');
    console.log(`Total errors detected: ${errorCount}`);
    console.log(`Map-specific errors: ${mapErrorCount}`);
    console.log(`Architecture page working: ${!errorMessages.hasJapaneseError && !errorMessages.hasErrorBoundary ? '✅' : '❌'}`);
    console.log(`Map page working: ${!mapPageErrors ? '✅' : '❌'}`);
    console.log(`Map components rendering: ${mapDisplayed && mapPageDisplayed.mapContainer ? '✅' : '❌'}`);
    
    if (mapErrorCount === 0 && !errorMessages.hasJapaneseError && !mapPageErrors) {
      console.log('\n🎉 SUCCESS: Map component errors have been fixed!');
      return true;
    } else {
      console.log('\n⚠️ ISSUES REMAIN: Some errors still detected');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
    return false;
  } finally {
    await browser.close();
  }
}

testFixVerification().then(success => {
  console.log('\n' + '='.repeat(50));
  if (success) {
    console.log('✅ Fix verification PASSED - errors resolved!');
  } else {
    console.log('❌ Fix verification FAILED - issues remain');
  }
  console.log('='.repeat(50));
  process.exit(success ? 0 : 1);
});