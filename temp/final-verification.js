const playwright = require('playwright');

(async () => {
  console.log('Final verification of production site...');
  const browser = await playwright.chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('Navigating to: https://bob-takuya.github.io/archi-site/');
    await page.goto('https://bob-takuya.github.io/archi-site/', {
      waitUntil: 'networkidle',
      timeout: 60000
    });

    await page.waitForTimeout(5000);

    // Take screenshots
    await page.screenshot({ path: 'temp/production-site-fixed.png', fullPage: true });

    // Check for the error message
    const errorText = await page.textContent('body');
    const hasError = errorText.includes('問題が発生しました');
    
    // Check for UI elements
    const hasSearchBar = await page.locator('input[type="search"], input[placeholder*="検索"], input[placeholder*="Search"]').count() > 0;
    const hasNavigation = await page.locator('nav, header').count() > 0;
    const hasContent = await page.locator('.MuiGrid-container').count() > 0;
    const hasCards = await page.locator('[class*="MuiCard"], [class*="card"]').count() > 0;
    
    console.log('\n=== FINAL VERIFICATION ===');
    console.log('❌ Has error message "問題が発生しました":', hasError);
    console.log('✅ Has search bar:', hasSearchBar);
    console.log('✅ Has navigation:', hasNavigation);
    console.log('✅ Has content grid:', hasContent);
    console.log('✅ Has content cards:', hasCards);
    
    if (!hasError && hasSearchBar && hasNavigation && hasContent) {
      console.log('\n🎉 SUCCESS: The production site is now working correctly!');
      console.log('The "問題が発生しました" error has been fixed.');
    }

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await browser.close();
  }
})();