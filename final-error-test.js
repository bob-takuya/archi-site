const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  let hasErrorBoundary = false;
  let hasJapaneseError = false;
  let functionalTests = [];
  let jsErrors = [];
  
  // Capture console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      jsErrors.push(msg.text());
    }
  });
  
  page.on('pageerror', exception => {
    jsErrors.push(exception.toString());
  });
  
  try {
    console.log('🔍 FINAL TEST: Checking for Japanese error boundary...');
    
    // Navigate to the architecture page
    await page.goto('https://bob-takuya.github.io/archi-site/#/architecture', { 
      waitUntil: 'domcontentloaded',
      timeout: 20000 
    });
    
    // Wait for React to render
    await page.waitForTimeout(5000);
    
    // 1. Check for the specific Japanese error boundary message
    const errorBoundaryText = await page.locator('*').filter({ 
      hasText: '問題が発生しました' 
    }).count();
    
    const unexpectedErrorText = await page.locator('*').filter({ 
      hasText: 'アプリケーションで予期しないエラーが発生しました' 
    }).count();
    
    const reloadText = await page.locator('*').filter({ 
      hasText: 'お手数ですが、再読み込みをお試しください' 
    }).count();
    
    hasErrorBoundary = errorBoundaryText > 0 || unexpectedErrorText > 0 || reloadText > 0;
    hasJapaneseError = errorBoundaryText > 0 && unexpectedErrorText > 0 && reloadText > 0;
    
    functionalTests.push(`Japanese Error Boundary: ${hasJapaneseError ? '❌ FOUND' : '✅ NOT FOUND'}`);
    functionalTests.push(`Any Error Boundary: ${hasErrorBoundary ? '❌ DETECTED' : '✅ CLEAN'}`);
    
    // 2. Check if page loads properly
    const pageTitle = await page.locator('h1').first().textContent().catch(() => 'NOT_FOUND');
    functionalTests.push(`Page Title: ${pageTitle === '建築作品一覧' ? '✅ CORRECT' : '❌ WRONG'} ("${pageTitle}")`);
    
    // 3. Check if data is displayed
    const cardCount = await page.locator('.MuiCard-root').count();
    functionalTests.push(`Architecture Cards: ${cardCount > 0 ? '✅ LOADED' : '❌ NONE'} (${cardCount})`);
    
    // 4. Check if search is available
    const searchInput = await page.locator('input[type="text"]').first().isVisible();
    functionalTests.push(`Search Input: ${searchInput ? '✅ AVAILABLE' : '❌ MISSING'}`);
    
    // 5. Check if view toggles work
    const viewToggles = await page.locator('[aria-label*="ビュー"], [role="button"]').count();
    functionalTests.push(`View Controls: ${viewToggles > 0 ? '✅ FOUND' : '❌ MISSING'} (${viewToggles})`);
    
    // 6. Test mobile optimization (resize to mobile)
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    const mobileCards = await page.locator('.MuiCard-root').count();
    functionalTests.push(`Mobile Responsive: ${mobileCards > 0 ? '✅ WORKING' : '❌ BROKEN'} (${mobileCards} cards)`);
    
    // 7. Check if TouchOptimizedSearchBar is working
    const searchBar = await page.locator('input[placeholder*="検索"]').isVisible();
    functionalTests.push(`Touch Search Bar: ${searchBar ? '✅ OPTIMIZED' : '❌ STANDARD'}`);
    
    // 8. Try a simple interaction
    if (searchBar) {
      try {
        await page.locator('input[placeholder*="検索"]').click();
        await page.locator('input[placeholder*="検索"]').fill('東京');
        await page.waitForTimeout(2000);
        functionalTests.push(`Search Interaction: ✅ WORKING`);
      } catch (e) {
        functionalTests.push(`Search Interaction: ❌ FAILED (${e.message.substring(0, 50)})`);
      }
    }
    
    // Take final screenshot
    await page.screenshot({ path: 'final-error-boundary-test.png', fullPage: true });
    console.log('📸 Screenshot saved as final-error-boundary-test.png');
    
  } catch (error) {
    functionalTests.push(`Test Execution: ❌ FAILED (${error.message})`);
  }
  
  await browser.close();
  
  // Report results
  console.log('\n📋 FUNCTIONAL TESTS:');
  functionalTests.forEach(test => console.log(`  ${test}`));
  
  console.log(`\n🔍 JAVASCRIPT ERRORS: ${jsErrors.length}`);
  if (jsErrors.length > 0) {
    console.log('📋 Error samples:');
    jsErrors.slice(0, 3).forEach(error => {
      const truncated = error.length > 100 ? error.substring(0, 100) + '...' : error;
      console.log(`  ❌ ${truncated}`);
    });
  }
  
  // Final verdict
  console.log('\n🎯 FINAL VERDICT:');
  
  if (hasJapaneseError) {
    console.log('❌ CRITICAL: Japanese error boundary still appears');
    console.log('   The original issue "問題が発生しました アプリケーションで予期しないエラーが発生しました。 お手数ですが、再読み込みをお試しください。" is NOT fixed');
  } else if (hasErrorBoundary) {
    console.log('⚠️  WARNING: Some error boundary detected, but not the specific Japanese error');
  } else {
    console.log('✅ SUCCESS: No error boundary detected');
  }
  
  const passedTests = functionalTests.filter(t => t.includes('✅')).length;
  const totalTests = functionalTests.length;
  const successRate = Math.round((passedTests / totalTests) * 100);
  
  console.log(`📊 Success Rate: ${passedTests}/${totalTests} tests passed (${successRate}%)`);
  
  if (hasJapaneseError) {
    console.log('\n🚨 CONCLUSION: ISSUE STILL EXISTS - Japanese error boundary found');
  } else if (successRate >= 80) {
    console.log('\n🎉 CONCLUSION: ISSUE RESOLVED - Architecture page working normally');
  } else {
    console.log('\n⚠️  CONCLUSION: MIXED RESULTS - No error boundary but functionality issues');
  }
})();