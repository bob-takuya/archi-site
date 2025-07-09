const { chromium } = require('playwright');

async function verifyJsonDataLoading() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('🔍 E2E Test: Verifying JSON Data Loading');
  console.log('=========================================');
  
  // Enable detailed console logging
  const consoleLogs = [];
  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push(text);
    if (text.includes('FastArchitectureService') || 
        text.includes('Loaded page') || 
        text.includes('Search index') ||
        text.includes('建築')) {
      console.log(`📡 Console: ${text}`);
    }
  });
  
  // Monitor network requests
  const jsonRequests = [];
  page.on('request', request => {
    if (request.url().includes('.json')) {
      jsonRequests.push(request.url());
    }
  });
  
  try {
    console.log('\n📍 Loading local server...');
    await page.goto('http://localhost:3000/archi-site/', { 
      waitUntil: 'networkidle', 
      timeout: 30000 
    });
    
    console.log('\n🌐 JSON requests made:');
    jsonRequests.forEach(url => console.log(`  - ${url}`));
    
    // Wait for content
    await page.waitForTimeout(3000);
    
    // Check for actual architecture data
    console.log('\n📊 Checking for architecture data...');
    
    // Look for architecture cards with real data
    const architectureCards = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.MuiCard-root'));
      return cards.map(card => {
        const text = card.textContent || '';
        return {
          hasTitle: text.includes('建築作品') || text.includes('建築家'),
          content: text.substring(0, 200),
          // Check for specific data patterns
          hasYear: /\d{4}年/.test(text),
          hasArchitect: text.includes('設計') || text.includes('建築家'),
          hasAddress: text.includes('東京') || text.includes('大阪') || text.includes('京都')
        };
      });
    });
    
    console.log(`\n📋 Found ${architectureCards.length} cards:`);
    architectureCards.forEach((card, i) => {
      console.log(`\nCard ${i + 1}:`);
      console.log(`  Content: "${card.content.substring(0, 100)}..."`);
      console.log(`  Has Year: ${card.hasYear}`);
      console.log(`  Has Architect: ${card.hasArchitect}`);
      console.log(`  Has Address: ${card.hasAddress}`);
    });
    
    // Check specific elements
    const recentWorksSection = await page.locator('text="最近の建築作品"').isVisible();
    console.log(`\n✅ Recent works section visible: ${recentWorksSection}`);
    
    // Check for loading indicators
    const loadingIndicators = await page.locator('text=/ロード中|Loading|読み込み中/').count();
    console.log(`⏳ Loading indicators: ${loadingIndicators}`);
    
    // Check for error messages
    const errorMessages = await page.locator('text=/エラー|Error|失敗/').count();
    console.log(`❌ Error messages: ${errorMessages}`);
    
    // Take screenshot
    await page.screenshot({ 
      path: 'temp/json-data-state.png', 
      fullPage: true 
    });
    
    // Check if FastArchitectureService was used
    const usedFastService = consoleLogs.some(log => 
      log.includes('FastArchitectureService') || 
      log.includes('Loaded page') ||
      log.includes('Search index')
    );
    
    const usedSqlite = consoleLogs.some(log => 
      log.includes('sql.js-httpvfs') || 
      log.includes('SQLite') ||
      log.includes('チャンク読み込み')
    );
    
    console.log('\n📊 Service Analysis:');
    console.log(`  FastArchitectureService used: ${usedFastService ? '✅ YES' : '❌ NO'}`);
    console.log(`  SQLite (sql.js-httpvfs) used: ${usedSqlite ? '⚠️ YES' : '✅ NO'}`);
    
    // Final check: are there any cards with real architecture data?
    const hasRealData = architectureCards.some(card => 
      card.hasYear || card.hasArchitect || card.hasAddress
    );
    
    console.log('\n📊 FINAL VERDICT:');
    console.log('==================');
    console.log(`Real architecture data found: ${hasRealData ? '✅ YES' : '❌ NO'}`);
    console.log(`Using JSON service: ${usedFastService ? '✅ YES' : '❌ NO'}`);
    console.log(`JSON requests made: ${jsonRequests.length}`);
    console.log(`Screenshot saved: temp/json-data-state.png`);
    
    return hasRealData && usedFastService;
    
  } catch (error) {
    console.error('\n❌ Test error:', error.message);
    return false;
  } finally {
    await browser.close();
  }
}

verifyJsonDataLoading().then(success => {
  console.log('\n' + '='.repeat(50));
  if (success) {
    console.log('✅ SUCCESS: JSON data is loading correctly!');
  } else {
    console.log('❌ FAILURE: JSON data is NOT loading correctly!');
    console.log('The site may still be using SQLite instead of JSON.');
  }
  console.log('='.repeat(50));
  process.exit(success ? 0 : 1);
});