import { test, expect } from '@playwright/test';

test.describe('Worker Loading Debug Test', () => {
  test('should debug worker loading issues', async ({ page }) => {
    console.log('🔍 Starting worker loading debug test...');
    
    // Enable console logging
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      const message = msg.text();
      consoleMessages.push(message);
      console.log(`[BROWSER]: ${message}`);
    });
    
    // Enable error logging
    page.on('pageerror', error => {
      console.error(`[PAGE ERROR]: ${error.message}`);
    });
    
    // Navigate to the app
    await page.goto('https://bob-takuya.github.io/archi-site/');
    await page.waitForLoadState('networkidle');
    
    console.log('📄 Page loaded, waiting for database initialization...');
    
    // Wait for initial database logs (up to 2 minutes)
    await page.waitForFunction(() => {
      return window.console && document.body; // Basic check that page is ready
    }, { timeout: 10000 });
    
    // Give time for database initialization to start
    await page.waitForTimeout(30000); // 30 seconds
    
    console.log(`📝 Captured ${consoleMessages.length} console messages:`);
    consoleMessages.forEach((msg, i) => {
      console.log(`  ${i+1}. ${msg}`);
    });
    
    // Check if we see our debug messages
    const hasDebugMessages = consoleMessages.some(msg => 
      msg.includes('Environment debug info') || 
      msg.includes('Worker file URLs') ||
      msg.includes('Testing worker file accessibility')
    );
    
    console.log(`🔧 Has debug messages: ${hasDebugMessages}`);
    
    // Check for any error messages
    const errorMessages = consoleMessages.filter(msg => 
      msg.includes('error') || msg.includes('Error') || msg.includes('❌') || msg.includes('failed')
    );
    
    if (errorMessages.length > 0) {
      console.log(`❌ Found ${errorMessages.length} error messages:`);
      errorMessages.forEach((msg, i) => {
        console.log(`  ERROR ${i+1}: ${msg}`);
      });
    }
    
    // Look for worker creation success
    const hasWorkerSuccess = consoleMessages.some(msg => 
      msg.includes('worker 初期化完了') || 
      msg.includes('Worker created successfully') ||
      msg.includes('✅')
    );
    
    console.log(`✅ Has worker success: ${hasWorkerSuccess}`);
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'worker-debug-test.png', fullPage: true });
    
    // Try to manually trigger database initialization if not started
    if (!hasDebugMessages) {
      console.log('🔄 Manually triggering database initialization...');
      await page.evaluate(() => {
        // Try to trigger database loading manually
        if (window.location.pathname.includes('/archi-site')) {
          console.log('🔄 Attempting manual database trigger...');
          // Force reload to trigger initialization
          window.location.reload();
        }
      });
      
      await page.waitForTimeout(15000); // Wait another 15 seconds
    }
    
    // Check database loading state
    const dbState = await page.evaluate(() => {
      const bodyText = document.body.innerText;
      return {
        hasLoadingText: bodyText.includes('データベースを初期化中') || bodyText.includes('初期化中'),
        hasErrorText: bodyText.includes('エラー') || bodyText.includes('Error'),
        hasCompletedText: bodyText.includes('完了') || bodyText.includes('Success'),
        hasArchitectureData: /安藤忠雄|丹下健三|隈研吾/.test(bodyText)
      };
    });
    
    console.log('🏗️ Database state:', dbState);
    
    expect.soft(hasDebugMessages).toBeTruthy();
  });
});