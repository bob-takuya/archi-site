const playwright = require('playwright');

(async () => {
  console.log('Testing local preview server...');
  const browser = await playwright.chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Collect console errors
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
      console.error('Console Error:', msg.text());
    }
  });

  page.on('pageerror', error => {
    console.error('Page Error:', error.message);
    errors.push(`Page Error: ${error.message}`);
  });

  try {
    console.log('Navigating to local preview...');
    await page.goto('http://localhost:4173/archi-site/', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    await page.waitForTimeout(3000);

    // Check for the error message
    const errorText = await page.textContent('body');
    const hasError = errorText.includes('問題が発生しました');
    
    // Check for UI elements
    const hasSearchBar = await page.locator('input[type="search"], input[placeholder*="検索"], input[placeholder*="Search"]').count() > 0;
    const hasNavigation = await page.locator('nav, header').count() > 0;
    
    console.log('\n=== TEST RESULTS ===');
    console.log('Has error message "問題が発生しました":', hasError);
    console.log('Has search bar:', hasSearchBar);
    console.log('Has navigation:', hasNavigation);
    console.log('Console errors:', errors.length);
    
    if (!hasError && hasSearchBar && hasNavigation && errors.length === 0) {
      console.log('\n✅ SUCCESS: Local preview is working correctly!');
    } else {
      console.log('\n❌ FAILED: Issues found');
      errors.forEach(err => console.log('  -', err));
    }

    await page.screenshot({ path: 'temp/local-preview-fixed.png' });

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await browser.close();
  }
})();