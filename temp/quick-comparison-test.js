const { chromium } = require('playwright');

async function quickTest(name, url) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  console.log(`\n=== ${name} ===`);
  console.log(`URL: ${url}`);
  
  const errors = [];
  
  // Capture console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`   Console Error: ${msg.text()}`);
      errors.push(msg.text());
    }
  });
  
  try {
    console.log('1. Loading page...');
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    console.log('   ✓ Page loaded');
    
    console.log('2. Checking initial state...');
    const loadingMessage = await page.locator('text=データベースを初期化中').isVisible().catch(() => false);
    console.log(`   Loading message visible: ${loadingMessage}`);
    
    console.log('3. Waiting 30 seconds for database...');
    await page.waitForTimeout(30000);
    
    const cards = await page.locator('.MuiCard-root').count();
    console.log(`   Cards found: ${cards}`);
    
    if (cards > 0) {
      const firstCard = await page.locator('.MuiCard-root').first();
      const cardText = await firstCard.textContent();
      console.log(`   First card content: "${cardText.split('\n')[0]}"`);
      
      const hasRealData = cardText && !cardText.includes('undefined') && cardText.trim().length > 10;
      console.log(`   Has real data: ${hasRealData}`);
    }
    
    // Check for search input
    const searchInputs = await page.locator('input').count();
    console.log(`   Search inputs found: ${searchInputs}`);
    
    // Check if database files are accessible
    console.log('4. Checking database file accessibility...');
    const dbResponse = await page.evaluate(async (baseUrl) => {
      try {
        const response = await fetch(`${baseUrl.replace(/\/$/, '')}/db/archimap.sqlite3`, { method: 'HEAD' });
        return {
          status: response.status,
          contentLength: response.headers.get('content-length'),
          contentType: response.headers.get('content-type'),
          contentEncoding: response.headers.get('content-encoding')
        };
      } catch (e) {
        return { error: e.message };
      }
    }, url.replace(/\/$/, ''));
    
    console.log(`   Database file response:`, dbResponse);
    
    await page.screenshot({ path: `temp/${name.toLowerCase().replace(/\s+/g, '-')}-quick-test.png` });
    
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    errors.push(error.message);
  } finally {
    await browser.close();
  }
  
  return { errors, url };
}

(async () => {
  console.log('🔍 QUICK COMPARISON TEST');
  
  const local = await quickTest('LOCAL', 'http://localhost:3000/archi-site/');
  const production = await quickTest('PRODUCTION', 'https://bob-takuya.github.io/archi-site/');
  
  console.log('\n📊 SUMMARY:');
  console.log(`Local errors: ${local.errors.length}`);
  console.log(`Production errors: ${production.errors.length}`);
  
  if (production.errors.length > local.errors.length) {
    console.log('\n❌ PRODUCTION ISSUE CONFIRMED');
    console.log('Production has more errors than local');
  }
})();