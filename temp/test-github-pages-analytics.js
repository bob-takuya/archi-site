const { chromium } = require('playwright');

async function testGitHubPagesAnalytics() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Track analytics requests
  const analyticsRequests = [];
  page.on('request', request => {
    const url = request.url();
    if (url.includes('/data/analytics/') || url.includes('base.json')) {
      console.log(`📤 Analytics Request: ${url}`);
      analyticsRequests.push(url);
    }
  });

  page.on('response', response => {
    const url = response.url();
    if (url.includes('/data/analytics/') || url.includes('base.json')) {
      console.log(`📥 Analytics Response: ${response.status()} - ${url}`);
    }
  });

  // Enable console logging
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Analytics') || text.includes('Precomputed') || text.includes('📊') || text.includes('🔬') || text.includes('loaded')) {
      console.log(`🖥️ Console: ${text}`);
    }
  });

  page.on('pageerror', error => {
    console.error(`❌ Page Error: ${error.message}`);
  });

  try {
    // Navigate to the GitHub Pages research page
    console.log('Navigating to GitHub Pages research page...');
    await page.goto('https://bob-takuya.github.io/archi-site/#/research', {
      waitUntil: 'networkidle',
      timeout: 60000
    });

    // Wait for page to stabilize
    await page.waitForTimeout(10000);

    // Check page content
    const pageText = await page.textContent('body');
    console.log('\n📊 Page State:');
    console.log(`  URL: ${page.url()}`);
    console.log(`  Title includes "研究": ${pageText.includes('日本建築データベース研究')}`);
    console.log(`  Shows loading: ${pageText.includes('研究データを分析中...') || pageText.includes('研究データを読み込み中...')}`);
    console.log(`  Shows error: ${pageText.includes('研究データの読み込みに失敗しました')}`);
    
    // Check if analytics were requested
    console.log(`\n📈 Analytics Requests: ${analyticsRequests.length}`);
    if (analyticsRequests.length > 0) {
      console.log('✅ SUCCESS: Precomputed analytics files were requested!');
      console.log('Files:');
      analyticsRequests.forEach(url => {
        console.log(`  - ${url}`);
      });
    } else {
      console.log('❌ No analytics requests detected');
      console.log('\n⚠️ The page is likely still loading ALL page data instead of precomputed analytics');
    }

    // Check what the page actually shows
    const researchTabs = await page.locator('.MuiTab-root, [role="tab"]').count();
    console.log(`\nResearch page tabs found: ${researchTabs}`);

    // Take screenshot
    await page.screenshot({ path: 'temp/github-pages-analytics-test.png', fullPage: true });
    console.log('\n📷 Screenshot saved to temp/github-pages-analytics-test.png');

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await browser.close();
  }
}

testGitHubPagesAnalytics().catch(console.error);