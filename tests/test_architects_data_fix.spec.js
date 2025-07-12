const { test, expect } = require('@playwright/test');

test('Verify architects data fix', async ({ page }) => {
  console.log('🚀 Testing architects data fix...');

  // Navigate to architects page
  await page.goto('http://localhost:3000/archi-site/architects');
  await page.waitForTimeout(3000);

  // Check if we have architect cards now
  const architectCards = await page.locator('.MuiCard-root').count();
  const hasNoResults = await page.locator('text=建築家が見つかりませんでした').isVisible();
  const hasError = await page.locator('text=エラー, text=Error').isVisible();

  console.log(`📋 Architect cards found: ${architectCards}`);
  console.log(`❌ No results message: ${hasNoResults}`);
  console.log(`🚨 Error present: ${hasError}`);

  // Check first architect card content
  if (architectCards > 0) {
    const firstArchitectName = await page.locator('.MuiCard-root').first().locator('h6').textContent();
    console.log(`👤 First architect: ${firstArchitectName}`);
  }

  await page.screenshot({ path: '/Users/homeserver/ai-creative-team/temp/architects_after_data_fix.png' });

  if (architectCards > 0 && !hasError) {
    console.log('✅ SUCCESS: Architects data is now loading!');
  } else if (hasNoResults) {
    console.log('❌ Still showing no results');
  } else {
    console.log('⚠️ Unknown state');
  }
});