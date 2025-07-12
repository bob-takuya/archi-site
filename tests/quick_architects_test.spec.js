const { test, expect } = require('@playwright/test');

test('Quick architects tab verification', async ({ page }) => {
  console.log('🚀 Testing architects tab fixes...');

  // Navigate to the app
  await page.goto('http://localhost:3000/archi-site/');
  await page.waitForTimeout(2000);

  // Click architects tab
  await page.click('a[href*="architects"]');
  await page.waitForURL('**/architects*');
  
  // Wait for content
  await page.waitForTimeout(3000);

  // Check results
  const title = await page.locator('h1').textContent();
  const stillLoading = await page.locator('.MuiCircularProgress-root').isVisible();
  const hasContent = await page.locator('.architect-card, [data-testid="architect"], .MuiCard-root').count();
  const hasError = await page.locator('text=Error, text=エラー').isVisible();

  console.log(`📝 Title: ${title}`);
  console.log(`⏳ Still loading: ${stillLoading}`);
  console.log(`📋 Architect cards: ${hasContent}`);
  console.log(`🚨 Has error: ${hasError}`);

  if (!stillLoading && hasContent > 0 && !hasError) {
    console.log('✅ SUCCESS: Architects tab is working!');
  } else {
    console.log('❌ Still has issues');
  }

  await page.screenshot({ path: '~/ai-creative-team/temp/architects_quick_test.png' });
});