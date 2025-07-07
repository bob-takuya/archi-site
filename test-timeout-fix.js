/**
 * Quick test to verify the database timeout fixes work correctly
 */

const { chromium } = require('playwright');

async function testTimeoutFix() {
  console.log('🧪 Testing database timeout fixes...');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Set up console logging
  page.on('console', msg => {
    if (msg.type() === 'log' || msg.type() === 'warn' || msg.type() === 'error') {
      console.log(`[${msg.type().toUpperCase()}] ${msg.text()}`);
    }
  });
  
  try {
    console.log('📥 Loading homepage...');
    await page.goto('http://localhost:8080', { waitUntil: 'networkidle', timeout: 60000 });
    
    console.log('⏳ Waiting for page to be ready...');
    
    // Wait for either content to load or error states
    await page.waitForFunction(() => {
      const body = document.body;
      const text = body?.textContent || '';
      
      // Check for success indicators
      const hasContent = text.includes('建築') || text.includes('データベース') || text.length > 1000;
      
      // Check for our timeout fix indicators
      const hasProgressIndicator = text.includes('読み込み中') || text.includes('大きなデータベース');
      const hasTimeoutMessage = text.includes('タイムアウト') || text.includes('時間がかかっています');
      const hasRetryButton = document.querySelector('[data-testid="retry-button"]') || 
                           text.includes('再試行');
      
      console.log('🔍 Page content check:', {
        textLength: text.length,
        hasContent,
        hasProgressIndicator,
        hasTimeoutMessage,
        hasRetryButton
      });
      
      return hasContent || hasTimeoutMessage || hasRetryButton;
    }, { timeout: 30000 });
    
    // Check what we got
    const pageText = await page.textContent('body');
    const hasProgressUI = pageText.includes('大きなデータベース') || pageText.includes('読み込み中');
    const hasTimeoutHandling = pageText.includes('タイムアウト') || pageText.includes('再試行');
    const hasBasicContent = pageText.includes('建築データベース');
    
    console.log('📊 Test Results:');
    console.log(`✅ Basic content loaded: ${hasBasicContent}`);
    console.log(`✅ Progress UI present: ${hasProgressUI}`);
    console.log(`✅ Timeout handling: ${hasTimeoutHandling}`);
    console.log(`📝 Page text length: ${pageText.length} characters`);
    
    // Take a screenshot for verification
    await page.screenshot({ path: 'timeout-fix-test.png', fullPage: true });
    console.log('📸 Screenshot saved as timeout-fix-test.png');
    
    if (hasBasicContent) {
      console.log('🎉 SUCCESS: Page loads with timeout fixes implemented!');
      return true;
    } else if (hasTimeoutHandling) {
      console.log('✅ PARTIAL SUCCESS: Timeout handling is working!');
      return true;
    } else {
      console.log('❌ ISSUE: Page may not be loading correctly');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'timeout-fix-error.png', fullPage: true });
    return false;
  } finally {
    await browser.close();
  }
}

// Run the test
testTimeoutFix().then(success => {
  console.log(`\n🏁 Test ${success ? 'PASSED' : 'FAILED'}`);
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('💥 Test runner error:', error);
  process.exit(1);
});