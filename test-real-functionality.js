const { chromium } = require('playwright');

async function testRealFunctionality() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  console.log('Starting comprehensive functionality test...\n');
  
  try {
    // Test 1: Home Page and Basic Loading
    console.log('1. Testing Home Page...');
    await page.goto('https://bob-takuya.github.io/archi-site/', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // Check if React app loaded
    const title = await page.title();
    console.log(`   - Page title: ${title}`);
    
    // Look for navigation elements
    const navLinks = await page.$$eval('nav a, header a, .nav a, [role="navigation"] a', links => 
      links.map(link => ({ text: link.textContent.trim(), href: link.href }))
    );
    console.log(`   - Navigation links found: ${navLinks.length}`);
    navLinks.forEach(link => console.log(`     * ${link.text} -> ${link.href}`));
    
    // Test 2: Architecture List Page
    console.log('\n2. Testing Architecture List Page...');
    
    // Try different possible navigation methods
    const architectureLink = await page.$('a[href*="architecture"], a:has-text("Architecture"), a:has-text("建築")');
    if (architectureLink) {
      await architectureLink.click();
      await page.waitForLoadState('networkidle');
    } else {
      // Direct navigation
      await page.goto('https://bob-takuya.github.io/archi-site/architecture', {
        waitUntil: 'networkidle',
        timeout: 30000
      });
    }
    
    // Wait for any content to load
    await page.waitForTimeout(3000);
    
    // Check for architecture items
    const architectureItems = await page.$$eval('*', elements => {
      const items = [];
      elements.forEach(el => {
        const text = el.textContent || '';
        // Look for patterns that might indicate building names
        if (text.length > 3 && text.length < 100 && 
            (text.includes('House') || text.includes('Building') || text.includes('Museum') || 
             text.includes('Church') || text.includes('Hall') || text.includes('Center') ||
             text.includes('住宅') || text.includes('美術館') || text.includes('教会') ||
             text.includes('ビル') || text.includes('センター'))) {
          items.push(text.trim());
        }
      });
      return [...new Set(items)]; // Remove duplicates
    });
    
    console.log(`   - Potential architecture items found: ${architectureItems.length}`);
    architectureItems.slice(0, 10).forEach(item => console.log(`     * ${item}`));
    
    // Test 3: Search Functionality
    console.log('\n3. Testing Search Functionality...');
    
    // Look for search input
    const searchInput = await page.$('input[type="search"], input[placeholder*="search" i], input[placeholder*="検索"], input[name*="search" i]');
    if (searchInput) {
      console.log('   - Search input found');
      await searchInput.fill('Tokyo');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(2000);
      
      // Check for search results
      const searchResults = await page.textContent('body');
      if (searchResults.toLowerCase().includes('tokyo')) {
        console.log('   - Search results contain "Tokyo"');
      } else {
        console.log('   - No "Tokyo" found in search results');
      }
    } else {
      console.log('   - No search input found');
    }
    
    // Test 4: Architects Page
    console.log('\n4. Testing Architects Page...');
    
    await page.goto('https://bob-takuya.github.io/archi-site/architects', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    await page.waitForTimeout(3000);
    
    // Look for architect names
    const architectNames = await page.$$eval('*', elements => {
      const names = [];
      const knownArchitects = ['安藤忠雄', 'Tadao Ando', '隈研吾', 'Kengo Kuma', '伊東豊雄', 'Toyo Ito', 
                               'Frank Lloyd Wright', 'Le Corbusier', 'Zaha Hadid', 'Frank Gehry'];
      
      elements.forEach(el => {
        const text = el.textContent || '';
        knownArchitects.forEach(architect => {
          if (text.includes(architect)) {
            names.push(architect);
          }
        });
      });
      return [...new Set(names)];
    });
    
    console.log(`   - Known architects found: ${architectNames.length}`);
    architectNames.forEach(name => console.log(`     * ${name}`));
    
    // Test 5: Map Page
    console.log('\n5. Testing Map Page...');
    
    await page.goto('https://bob-takuya.github.io/archi-site/map', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    await page.waitForTimeout(3000);
    
    // Check for map container
    const mapContainer = await page.$('#map, .map, [class*="leaflet"], [class*="mapbox"], canvas');
    if (mapContainer) {
      console.log('   - Map container found');
      
      // Check for map markers
      const markers = await page.$$('.leaflet-marker-icon, .mapbox-marker, [class*="marker"]');
      console.log(`   - Map markers found: ${markers.length}`);
    } else {
      console.log('   - No map container found');
    }
    
    // Test 6: Database/Data Loading Check
    console.log('\n6. Checking for Database Content...');
    
    // Check browser console for errors
    const consoleMessages = [];
    page.on('console', msg => consoleMessages.push({ type: msg.type(), text: msg.text() }));
    
    // Navigate back to architecture page to check data loading
    await page.goto('https://bob-takuya.github.io/archi-site/architecture', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    await page.waitForTimeout(5000);
    
    // Check for any database-related errors
    const errors = consoleMessages.filter(msg => msg.type === 'error');
    console.log(`   - Console errors: ${errors.length}`);
    errors.forEach(err => console.log(`     * ${err.text}`));
    
    // Check network requests for database files
    const dbRequests = [];
    page.on('request', request => {
      const url = request.url();
      if (url.includes('.db') || url.includes('.sqlite') || url.includes('database')) {
        dbRequests.push(url);
      }
    });
    
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    console.log(`   - Database requests: ${dbRequests.length}`);
    dbRequests.forEach(req => console.log(`     * ${req}`));
    
    // Test 7: Check Page Content Structure
    console.log('\n7. Analyzing Page Content Structure...');
    
    const pageStructure = await page.evaluate(() => {
      const structure = {
        hasReactRoot: !!document.querySelector('#root, #app, [data-react-root]'),
        hasList: !!document.querySelector('ul, ol, .list, .grid'),
        hasCards: !!document.querySelector('.card, .item, [class*="card"], [class*="item"]'),
        hasImages: document.querySelectorAll('img').length,
        hasLinks: document.querySelectorAll('a').length,
        totalTextLength: document.body.textContent.length,
        uniqueElements: new Set([...document.querySelectorAll('*')].map(el => el.tagName)).size
      };
      return structure;
    });
    
    console.log('   - Page structure analysis:');
    Object.entries(pageStructure).forEach(([key, value]) => {
      console.log(`     * ${key}: ${value}`);
    });
    
    // Test 8: Check for Loading States
    console.log('\n8. Checking for Loading States...');
    
    const loadingIndicators = await page.$$eval('*', elements => {
      const indicators = [];
      elements.forEach(el => {
        const text = (el.textContent || '').toLowerCase();
        const className = (el.className || '').toLowerCase();
        if (text.includes('loading') || text.includes('読み込み中') || 
            className.includes('loading') || className.includes('spinner') ||
            text.includes('no data') || text.includes('データがありません')) {
          indicators.push({
            text: el.textContent.trim().substring(0, 50),
            class: el.className
          });
        }
      });
      return indicators;
    });
    
    console.log(`   - Loading/empty state indicators: ${loadingIndicators.length}`);
    loadingIndicators.forEach(ind => console.log(`     * "${ind.text}" (class: ${ind.class})`));
    
    // Final Summary
    console.log('\n=== FUNCTIONALITY TEST SUMMARY ===');
    console.log(`✓ Site is accessible: ${title ? 'Yes' : 'No'}`);
    console.log(`✓ Navigation works: ${navLinks.length > 0 ? 'Yes' : 'No'}`);
    console.log(`✓ Architecture data found: ${architectureItems.length > 0 ? 'Yes' : 'No'}`);
    console.log(`✓ Architect data found: ${architectNames.length > 0 ? 'Yes' : 'No'}`);
    console.log(`✓ Map functionality: ${mapContainer ? 'Present' : 'Not found'}`);
    console.log(`✓ Console errors: ${errors.length === 0 ? 'None' : errors.length + ' errors'}`);
    console.log(`✓ Database requests: ${dbRequests.length > 0 ? 'Yes' : 'No'}`);
    
    if (architectureItems.length === 0 && architectNames.length === 0) {
      console.log('\n⚠️  WARNING: No architecture or architect data found!');
      console.log('   This suggests the database is not loading or accessible.');
      console.log('   Possible issues:');
      console.log('   - SQLite database file not deployed or accessible');
      console.log('   - CORS issues preventing database access');
      console.log('   - JavaScript errors preventing data loading');
      console.log('   - Wrong API endpoints or data source configuration');
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testRealFunctionality().catch(console.error);