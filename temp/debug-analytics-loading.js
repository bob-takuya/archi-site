const { chromium } = require('playwright');

async function debugAnalyticsLoading() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Track all network requests
  const requests = [];
  page.on('request', request => {
    if (request.url().includes('analytics') || request.url().includes('.json')) {
      console.log(`📤 Request: ${request.method()} ${request.url()}`);
      requests.push({
        url: request.url(),
        method: request.method(),
        headers: request.headers()
      });
    }
  });

  page.on('response', response => {
    if (response.url().includes('analytics') || response.url().includes('.json')) {
      console.log(`📥 Response: ${response.status()} ${response.url()}`);
    }
  });

  // Enable console logging
  page.on('console', msg => {
    if (msg.text().includes('Analytics') || msg.text().includes('Failed') || msg.text().includes('📊')) {
      console.log(`🖥️ Console: ${msg.text()}`);
    }
  });

  // Navigate to the research page
  console.log('Navigating to production site...');
  await page.goto('https://bob-takuya.github.io/archi-site/#/research', {
    waitUntil: 'networkidle',
    timeout: 30000
  });

  // Wait a bit for analytics to try loading
  await page.waitForTimeout(5000);

  // Check what's displayed on the page
  const loadingText = await page.textContent('body');
  if (loadingText.includes('研究データを分析中...')) {
    console.log('⚠️ Page is showing fallback loading state');
  }

  // Try to find error messages
  const alerts = await page.locator('[role="alert"]').all();
  for (const alert of alerts) {
    const text = await alert.textContent();
    console.log(`🚨 Alert: ${text}`);
  }

  // Check import.meta.env.BASE_URL value
  const baseUrl = await page.evaluate(() => {
    return window.import?.meta?.env?.BASE_URL || 'undefined';
  });
  console.log(`🔧 BASE_URL in browser: ${baseUrl}`);

  // List all analytics-related requests
  console.log('\n📊 Analytics-related requests:');
  requests.forEach(req => {
    console.log(`  - ${req.url}`);
  });

  await browser.close();
}

debugAnalyticsLoading().catch(console.error);