const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  console.log('=== CHECKING DEPLOYED GITHUB PAGES SITE ===\n');
  
  // Capture console messages
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push({
      type: msg.type(),
      text: msg.text()
    });
  });
  
  // Capture network failures
  const failedRequests = [];
  page.on('requestfailed', request => {
    failedRequests.push({
      url: request.url(),
      failure: request.failure()
    });
  });
  
  try {
    console.log('📍 Navigating to: https://bob-takuya.github.io/archi-site/');
    
    const response = await page.goto('https://bob-takuya.github.io/archi-site/', { 
      waitUntil: 'networkidle',
      timeout: 60000 
    });
    
    console.log(`   Response status: ${response.status()}`);
    
    // Wait for the page to stabilize
    await page.waitForTimeout(10000);
    
    // Check for error messages on the page
    const errorElements = await page.locator('text=/error|エラー/i').all();
    console.log(`\n🔍 Error elements found: ${errorElements.length}`);
    
    if (errorElements.length > 0) {
      for (const el of errorElements) {
        console.log(`   - ${await el.textContent()}`);
      }
    }
    
    // Check if database is loading
    const dbStatus = await page.evaluate(() => {
      return window.localStorage.getItem('database-status');
    });
    console.log(`\n💾 Database status: ${dbStatus || 'Not found in localStorage'}`);
    
    // Check for architecture cards
    const cards = await page.locator('.MuiCard-root').count();
    console.log(`\n🏗️ Architecture cards found: ${cards}`);
    
    // Get page title and content
    const title = await page.title();
    const h1Text = await page.locator('h1').first().textContent() || 'No H1 found';
    
    console.log(`\n📄 Page Information:`);
    console.log(`   Title: ${title}`);
    console.log(`   H1: ${h1Text}`);
    
    // Check console messages
    console.log(`\n📝 Console Messages (${consoleMessages.length}):`);
    consoleMessages.forEach(msg => {
      if (msg.type === 'error') {
        console.log(`   ❌ ERROR: ${msg.text}`);
      } else if (msg.type === 'warning') {
        console.log(`   ⚠️  WARN: ${msg.text}`);
      } else if (msg.text.includes('database') || msg.text.includes('sql')) {
        console.log(`   ℹ️  ${msg.type.toUpperCase()}: ${msg.text}`);
      }
    });
    
    // Check failed requests
    console.log(`\n🚫 Failed Requests (${failedRequests.length}):`);
    failedRequests.forEach(req => {
      console.log(`   - ${req.url}`);
      console.log(`     Failure: ${req.failure?.errorText || 'Unknown'}`);
    });
    
    // Check for specific database files
    const dbFiles = [
      'https://bob-takuya.github.io/archi-site/db/archimap.sqlite3',
      'https://bob-takuya.github.io/archi-site/db/archimap.sqlite3.json',
      'https://bob-takuya.github.io/archi-site/db/database-info.json'
    ];
    
    console.log(`\n🗄️ Checking database files:`);
    for (const dbFile of dbFiles) {
      try {
        const response = await page.request.get(dbFile);
        console.log(`   ✓ ${dbFile.split('/').pop()}: ${response.status()}`);
      } catch (e) {
        console.log(`   ✗ ${dbFile.split('/').pop()}: Failed to fetch`);
      }
    }
    
    // Take screenshot
    await page.screenshot({ path: 'temp/deployed-site-check.png', fullPage: true });
    console.log('\n📸 Screenshot saved to temp/deployed-site-check.png');
    
    // Final assessment
    console.log('\n🎯 DEPLOYMENT STATUS:');
    if (response.status() === 200 && cards > 0 && failedRequests.length === 0) {
      console.log('   ✅ Site is deployed and working properly!');
      console.log(`   ✅ ${cards} architecture projects displayed`);
      console.log('   ✅ No critical errors detected');
    } else {
      console.log('   ⚠️  Site is deployed but may have issues:');
      console.log(`   - HTTP Status: ${response.status()}`);
      console.log(`   - Architecture cards: ${cards}`);
      console.log(`   - Failed requests: ${failedRequests.length}`);
      console.log(`   - Console errors: ${consoleMessages.filter(m => m.type === 'error').length}`);
    }
    
  } catch (error) {
    console.error('❌ Failed to check deployed site:', error);
  } finally {
    await browser.close();
  }
})();