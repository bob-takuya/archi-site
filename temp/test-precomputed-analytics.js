const { chromium } = require('playwright');

async function testPrecomputedAnalytics() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Track analytics requests
  const analyticsRequests = [];
  page.on('request', request => {
    if (request.url().includes('/data/analytics/')) {
      console.log(`📤 Analytics Request: ${request.url()}`);
      analyticsRequests.push(request.url());
    }
  });

  page.on('response', response => {
    if (response.url().includes('/data/analytics/')) {
      console.log(`📥 Analytics Response: ${response.status()} ${response.url()}`);
    }
  });

  // Enable console logging
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Analytics') || text.includes('Precomputed') || text.includes('📊') || text.includes('🔬')) {
      console.log(`🖥️ Console: ${text}`);
    }
  });

  // Start local server
  console.log('Starting local server...');
  const { spawn } = require('child_process');
  const server = spawn('npm', ['run', 'dev'], {
    env: { ...process.env, PORT: 3000 }
  });

  // Wait for server to start
  await new Promise(resolve => {
    server.stdout.on('data', (data) => {
      if (data.toString().includes('Local:')) {
        resolve();
      }
    });
  });

  // Navigate to research page
  console.log('Navigating to research page...');
  await page.goto('http://localhost:3000/#/research', {
    waitUntil: 'networkidle',
    timeout: 30000
  });

  // Wait for analytics to load
  await page.waitForTimeout(3000);

  // Check if analytics loaded properly
  const loadingText = await page.textContent('body');
  const isLoading = loadingText.includes('研究データを分析中...');
  const hasError = loadingText.includes('研究データの読み込みに失敗しました');
  
  console.log('\n📊 Test Results:');
  console.log(`  Analytics requests made: ${analyticsRequests.length}`);
  console.log(`  Still showing loading state: ${isLoading}`);
  console.log(`  Has error message: ${hasError}`);
  
  if (analyticsRequests.length > 0) {
    console.log('\n✅ SUCCESS: Research page is requesting precomputed analytics files!');
    console.log('Requested files:');
    analyticsRequests.forEach(url => {
      console.log(`  - ${url.split('/').pop()}`);
    });
  } else {
    console.log('\n❌ FAILURE: No analytics requests detected');
  }

  // Take screenshot
  await page.screenshot({ path: 'temp/research-page-analytics-test.png', fullPage: true });
  console.log('\nScreenshot saved to temp/research-page-analytics-test.png');

  // Cleanup
  server.kill();
  await browser.close();
}

testPrecomputedAnalytics().catch(console.error);