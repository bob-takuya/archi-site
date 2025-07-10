const { chromium } = require('playwright');

async function testResearchAnalytics() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Track all network requests
  const requests = [];
  page.on('request', request => {
    const url = request.url();
    requests.push(url);
    if (url.includes('analytics') || url.includes('.json')) {
      console.log(`📤 Request: ${url}`);
    }
  });

  page.on('response', response => {
    const url = response.url();
    if (url.includes('analytics')) {
      console.log(`📥 Response: ${response.status()} ${url}`);
    }
  });

  // Enable console logging
  page.on('console', msg => {
    console.log(`🖥️ Console: ${msg.text()}`);
  });

  page.on('pageerror', error => {
    console.error(`❌ Page Error: ${error.message}`);
  });

  try {
    // Navigate to the local dev server (assuming it's already running)
    console.log('Navigating to local research page...');
    await page.goto('http://localhost:3000/#/research', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    // Wait for page to stabilize
    await page.waitForTimeout(5000);

    // Check page content
    const pageText = await page.textContent('body');
    console.log('\n📊 Page State:');
    console.log(`  Title includes "研究": ${pageText.includes('日本建築データベース研究')}`);
    console.log(`  Shows loading: ${pageText.includes('研究データを分析中...')}`);
    console.log(`  Shows error: ${pageText.includes('研究データの読み込みに失敗しました')}`);
    
    // Check if any analytics requests were made
    const analyticsRequests = requests.filter(url => url.includes('/data/analytics/'));
    console.log(`\n📈 Analytics Requests: ${analyticsRequests.length}`);
    if (analyticsRequests.length > 0) {
      console.log('Analytics files requested:');
      analyticsRequests.forEach(url => {
        const filename = url.split('/').pop();
        console.log(`  - ${filename}`);
      });
    }

    // Take screenshot
    await page.screenshot({ path: 'temp/research-page-test.png', fullPage: true });
    console.log('\n📷 Screenshot saved to temp/research-page-test.png');

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await browser.close();
  }
}

// First, make sure dev server is running
console.log('⚠️  Make sure the dev server is running (npm run dev) before running this test!');
console.log('Waiting 3 seconds before starting test...\n');
setTimeout(() => {
  testResearchAnalytics().catch(console.error);
}, 3000);