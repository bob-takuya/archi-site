const { test, expect } = require('@playwright/test');

test('Architects tab loading verification', async ({ page }) => {
  // Enable console logging
  page.on('console', msg => {
    console.log('🖥️ Console:', msg.text());
  });

  page.on('pageerror', error => {
    console.error('🚨 Page Error:', error.message);
  });

  console.log('🚀 Starting architects tab test...');

  try {
    // Navigate to the app
    await page.goto('http://localhost:3000/archi-site/', { waitUntil: 'networkidle' });
    
    // Wait for the app to load
    await page.waitForTimeout(3000);
    
    console.log('✅ App loaded successfully');

    // Click on architects tab
    const architectsTab = await page.waitForSelector('a[href*="architects"]:has-text("建築家"), a[href*="architects"]:has-text("Architects")', { timeout: 10000 });
    await architectsTab.click();
    
    console.log('✅ Clicked architects tab');

    // Wait for navigation
    await page.waitForURL('**/architects*', { timeout: 10000 });
    
    console.log('✅ Navigated to architects page');

    // Check for loading indicators
    const hasLoadingSpinner = await page.locator('.MuiCircularProgress-root').isVisible();
    console.log(`🔄 Loading spinner visible: ${hasLoadingSpinner}`);

    // Wait for content to load (give it more time)
    await page.waitForTimeout(5000);

    // Check if architects content is visible
    const hasArchitectsList = await page.locator('.architects-list, .architect-card, [data-testid="architect-item"]').count() > 0;
    const hasNoResultsMessage = await page.locator('text=見つかりませんでした, text=No architects found, text=no results').isVisible();
    const hasErrorMessage = await page.locator('text=エラー, text=Error, text=失敗').isVisible();

    console.log(`📋 Architects list visible: ${hasArchitectsList}`);
    console.log(`❌ No results message: ${hasNoResultsMessage}`);
    console.log(`🚨 Error message: ${hasErrorMessage}`);

    // Check page title
    const pageTitle = await page.locator('h1, .page-title, [role="heading"]').first().textContent();
    console.log(`📝 Page title: ${pageTitle}`);

    // Check for search functionality
    const hasSearchBox = await page.locator('input[type="text"], input[placeholder*="検索"], input[placeholder*="Search"]').isVisible();
    console.log(`🔍 Search box visible: ${hasSearchBox}`);

    // Check final loading state
    const stillLoading = await page.locator('.MuiCircularProgress-root').isVisible();
    console.log(`⏳ Still loading: ${stillLoading}`);

    // Take screenshot for verification
    await page.screenshot({ path: '~/ai-creative-team/temp/architects_tab_test.png', fullPage: true });
    console.log('📸 Screenshot saved');

    // Verify success conditions
    if (!stillLoading && (hasArchitectsList || hasNoResultsMessage) && !hasErrorMessage) {
      console.log('✅ SUCCESS: Architects tab is working correctly!');
    } else if (stillLoading) {
      console.log('❌ FAILURE: Still stuck in loading state');
    } else if (hasErrorMessage) {
      console.log('❌ FAILURE: Error state detected');
    } else {
      console.log('⚠️ UNCLEAR: Tab loaded but unclear state');
    }

  } catch (error) {
    console.error('🚨 Test failed:', error.message);
    await page.screenshot({ path: '~/ai-creative-team/temp/architects_tab_error.png', fullPage: true });
  }
});