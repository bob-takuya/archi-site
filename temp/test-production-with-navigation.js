const { chromium } = require('playwright');

async function testProductionWithNavigation() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Track all requests
  const requests = [];
  page.on('request', request => {
    const url = request.url();
    requests.push(url);
    if (url.includes('/data/analytics/') || url.includes('base.json')) {
      console.log(`📤 Request: ${url}`);
    }
  });

  page.on('response', response => {
    const url = response.url();
    if (url.includes('/data/analytics/') || url.includes('base.json')) {
      console.log(`📥 Response: ${response.status()} - ${url}`);
    }
  });

  // Enable detailed console logging
  page.on('console', msg => {
    console.log(`🖥️ Console [${msg.type()}]: ${msg.text()}`);
  });

  page.on('pageerror', error => {
    console.error(`❌ Page Error: ${error.message}`);
  });

  try {
    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Navigate to home page first
    console.log('Navigating to home page...');
    await page.goto('http://localhost:4173/archi-site/', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Check if error dialog appears
    const errorDialog = await page.locator('text="問題が発生しました"').isVisible();
    if (errorDialog) {
      console.log('⚠️ Error dialog detected, clicking "ホームに戻る"...');
      await page.click('text="ホームに戻る"');
      await page.waitForTimeout(2000);
    }

    // Now navigate to research page
    console.log('\nNavigating to research page...');
    
    // Try clicking the nav link if available
    const researchLink = page.locator('a[href*="research"], a:has-text("研究")');
    if (await researchLink.isVisible()) {
      console.log('Clicking research link...');
      await researchLink.click();
    } else {
      console.log('Navigating directly to research URL...');
      await page.goto('http://localhost:4173/archi-site/#/research');
    }
    
    await page.waitForTimeout(5000);

    // Check page content
    const pageText = await page.textContent('body');
    console.log('\n📊 Page State:');
    console.log(`  URL: ${page.url()}`);
    console.log(`  Title includes "研究": ${pageText.includes('日本建築データベース研究')}`);
    console.log(`  Shows loading: ${pageText.includes('研究データを分析中...') || pageText.includes('研究データを読み込み中...')}`);
    console.log(`  Shows error: ${pageText.includes('研究データの読み込みに失敗しました')}`);
    
    // Check if analytics were requested
    const analyticsRequests = requests.filter(url => url.includes('/data/analytics/'));
    console.log(`\n📈 Analytics Requests: ${analyticsRequests.length}`);
    if (analyticsRequests.length > 0) {
      console.log('✅ SUCCESS: Precomputed analytics files were requested!');
      console.log('Files:');
      analyticsRequests.forEach(url => {
        console.log(`  - ${url}`);
      });
    }

    // Take screenshot
    await page.screenshot({ path: 'temp/production-navigation-test.png', fullPage: true });
    console.log('\n📷 Screenshot saved to temp/production-navigation-test.png');

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await browser.close();
  }
}

testProductionWithNavigation().catch(console.error);