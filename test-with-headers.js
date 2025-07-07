const { chromium } = require('playwright');

async function testWithHeaders() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  console.log('Testing database loading with header analysis...\n');
  
  const headers = {};
  
  // Capture all response headers
  page.on('response', response => {
    const url = response.url();
    if (url.includes('archimap.sqlite')) {
      headers[url] = response.headers();
      console.log(`Headers for ${url}:`);
      Object.entries(response.headers()).forEach(([key, value]) => {
        console.log(`  ${key}: ${value}`);
      });
    }
  });
  
  // Test HEAD request to database file
  try {
    console.log('Making HEAD request to database file...');
    const response = await page.request.head('https://bob-takuya.github.io/archi-site/db/archimap.sqlite');
    console.log(`Status: ${response.status()}`);
    console.log('HEAD Response headers:');
    Object.entries(response.headers()).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });
    
    const contentLength = response.headers()['content-length'];
    console.log(`Content-Length: ${contentLength || 'NOT PROVIDED'}`);
    
  } catch (error) {
    console.error('HEAD request failed:', error);
  }
  
  // Navigate to the site and observe
  await page.goto('https://bob-takuya.github.io/archi-site/', {
    waitUntil: 'networkidle',
    timeout: 30000
  });
  
  await page.waitForTimeout(5000);
  
  await browser.close();
}

testWithHeaders().catch(console.error);