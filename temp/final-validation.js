const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  console.log('=== FINAL WEBSITE VALIDATION ===\n');
  
  const results = {
    homepage: false,
    database: false,
    navigation: false,
    search: false,
    architectureList: false,
    map: false
  };
  
  try {
    // Test 1: Homepage loads
    console.log('1. Testing homepage...');
    await page.goto('http://localhost:3001/archi-site/', { waitUntil: 'networkidle' });
    const title = await page.title();
    results.homepage = title.includes('建築');
    console.log(`   ✓ Homepage loads: ${results.homepage} (Title: ${title})`);
    
    // Test 2: Database loads
    console.log('\n2. Testing database connection...');
    await page.waitForTimeout(5000);
    const hasContent = await page.locator('main').isVisible();
    const errorCount = await page.locator('text=/error/i').count();
    results.database = hasContent && errorCount === 0;
    console.log(`   ✓ Database loads without errors: ${results.database}`);
    
    // Test 3: Navigation works
    console.log('\n3. Testing navigation...');
    const navLinks = await page.locator('nav a, header a').count();
    results.navigation = navLinks > 0;
    console.log(`   ✓ Navigation links found: ${navLinks}`);
    
    // Test 4: Search functionality
    console.log('\n4. Testing search...');
    const searchInput = await page.locator('input[type="text"], input[type="search"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('東京');
      await searchInput.press('Enter');
      await page.waitForTimeout(2000);
      results.search = true;
    }
    console.log(`   ✓ Search functionality: ${results.search}`);
    
    // Test 5: Architecture list page
    console.log('\n5. Testing architecture list page...');
    await page.goto('http://localhost:3001/archi-site/#/architecture', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    const architectureItems = await page.locator('.MuiCard-root, [data-testid="architecture-item"]').count();
    results.architectureList = architectureItems > 0;
    console.log(`   ✓ Architecture items displayed: ${architectureItems}`);
    
    // Test 6: Map page
    console.log('\n6. Testing map page...');
    await page.goto('http://localhost:3001/archi-site/#/map', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    const mapContainer = await page.locator('.leaflet-container, #map').count();
    results.map = mapContainer > 0;
    console.log(`   ✓ Map displayed: ${results.map}`);
    
    // Summary
    console.log('\n=== SUMMARY ===');
    const working = Object.values(results).filter(r => r).length;
    const total = Object.values(results).length;
    console.log(`Working features: ${working}/${total}`);
    
    Object.entries(results).forEach(([feature, status]) => {
      console.log(`${status ? '✓' : '✗'} ${feature}`);
    });
    
    // Take final screenshots
    await page.goto('http://localhost:3001/archi-site/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'temp/final-homepage.png', fullPage: true });
    console.log('\nFinal screenshots saved to temp/');
    
  } catch (error) {
    console.error('Validation error:', error);
  } finally {
    await browser.close();
  }
})();