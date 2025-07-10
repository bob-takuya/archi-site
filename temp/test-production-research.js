const { chromium } = require('playwright');

async function testProductionResearch() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Track analytics requests
  const analyticsRequests = [];
  page.on('request', request => {
    const url = request.url();
    if (url.includes('/data/analytics/')) {
      console.log(`📤 Analytics Request: ${url}`);
      analyticsRequests.push(url);
    }
  });

  page.on('response', response => {
    const url = response.url();
    if (url.includes('/data/analytics/')) {
      console.log(`📥 Analytics Response: ${response.status()} ${url}`);
    }
  });

  // Enable console logging
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Analytics') || text.includes('Precomputed') || text.includes('📊') || text.includes('🔬')) {
      console.log(`🖥️ Console: ${text}`);
    }
  });

  page.on('pageerror', error => {
    console.error(`❌ Page Error: ${error.message}`);
  });

  try {
    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Navigate to the preview server research page
    console.log('Navigating to production research page...');
    await page.goto('http://localhost:4173/archi-site/#/research', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Wait for page to stabilize
    await page.waitForTimeout(3000);

    // Check page content
    const pageText = await page.textContent('body');
    console.log('\n📊 Page State:');
    console.log(`  Title includes "研究": ${pageText.includes('日本建築データベース研究')}`);
    console.log(`  Shows loading: ${pageText.includes('研究データを分析中...')}`);
    console.log(`  Shows error: ${pageText.includes('研究データの読み込みに失敗しました')}`);
    
    // Check if analytics loaded
    console.log(`\n📈 Analytics Requests: ${analyticsRequests.length}`);
    if (analyticsRequests.length > 0) {
      console.log('✅ SUCCESS: Precomputed analytics files were requested!');
      console.log('Files requested:');
      analyticsRequests.forEach(url => {
        const filename = url.split('/').pop();
        console.log(`  - ${filename}`);
      });
    } else {
      console.log('❌ No analytics requests detected');
    }

    // Take screenshot
    await page.screenshot({ path: 'temp/production-research-test.png', fullPage: true });
    console.log('\n📷 Screenshot saved to temp/production-research-test.png');

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await browser.close();
  }
}

testProductionResearch().catch(console.error);