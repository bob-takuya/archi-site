import { test, expect } from '@playwright/test';

/**
 * Final validation test for the AI Creative Team database timeout fix
 * Tests that users can actually see and interact with architecture data
 */

test.describe('AI Creative Team - Final Database Fix Validation', () => {
  
  test('should load database and display actual Japanese architecture data', async ({ page }) => {
    console.log('🚀 Final validation: Testing database loading with extended timeouts...');
    
    // Navigate to the live site
    await page.goto('https://bob-takuya.github.io/archi-site/');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Verify the page title is correct
    const title = await page.title();
    console.log(`📖 Page title: ${title}`);
    expect(title).toContain('建築');
    
    // Listen for console messages about database loading
    const dbMessages: string[] = [];
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('データベース') || text.includes('database') || text.includes('SQLite') || text.includes('建築')) {
        dbMessages.push(text);
        console.log(`🖥️ Database log: ${text}`);
      }
    });
    
    // Wait up to 3 minutes for database to load (our extended timeout)
    console.log('⏳ Waiting for database initialization (up to 3 minutes)...');
    
    // Look for signs that database has loaded successfully
    await page.waitForFunction(() => {
      const bodyText = document.body.innerText;
      
      // Look for real architecture data indicators
      const hasRealData = [
        /建築家：[^不明]/, // Architect name that's not "不明"
        /\d{4}年/, // Year format like "1990年"
        /東京|大阪|京都|名古屋/, // Major Japanese city names
        /安藤忠雄|丹下健三|隈研吾/, // Famous Japanese architects
        /美術館|図書館|駅|タワー/ // Building types
      ].some(pattern => pattern.test(bodyText));
      
      if (hasRealData) {
        console.log('✅ Real architecture data found!');
        return true;
      }
      
      // Also check for Material-UI cards with real content
      const cards = document.querySelectorAll('.MuiCard-root');
      if (cards.length > 0) {
        for (const card of cards) {
          const cardText = card.textContent || '';
          if (cardText.includes('年') && !cardText.includes('年代不明')) {
            console.log('✅ Card with real year data found!');
            return true;
          }
        }
      }
      
      return false;
    }, { timeout: 180000 }); // 3 minutes as per our extended timeout
    
    // Verify we have actual content now
    const hasArchitectureContent = await page.evaluate(() => {
      const bodyText = document.body.innerText;
      
      // Count indicators of real data
      let dataIndicators = 0;
      
      // Check for Japanese architect names
      if (/安藤忠雄|丹下健三|隈研吾|伊東豊雄|藤森照信/.test(bodyText)) {
        dataIndicators++;
        console.log('✅ Famous Japanese architect names found');
      }
      
      // Check for years
      if (/\d{4}年/.test(bodyText)) {
        dataIndicators++;
        console.log('✅ Year data found');
      }
      
      // Check for Japanese cities
      if (/東京|大阪|京都|名古屋|福岡|横浜/.test(bodyText)) {
        dataIndicators++;
        console.log('✅ Japanese city names found');
      }
      
      // Check for building types
      if (/美術館|図書館|博物館|駅|タワー|住宅/.test(bodyText)) {
        dataIndicators++;
        console.log('✅ Building type names found');
      }
      
      console.log(`📊 Data indicators found: ${dataIndicators}/4`);
      return dataIndicators >= 2; // At least 2 indicators of real data
    });
    
    console.log(`📝 Database messages captured: ${dbMessages.length}`);
    console.log(`🏗️ Has real architecture content: ${hasArchitectureContent}`);
    
    // Take a screenshot for verification
    await page.screenshot({ path: 'final-validation-homepage.png', fullPage: true });
    
    expect(hasArchitectureContent).toBeTruthy();
  });
  
  test('should test search functionality with real Japanese terms', async ({ page }) => {
    console.log('🔍 Testing search with real Japanese architect names...');
    
    await page.goto('https://bob-takuya.github.io/archi-site/');
    await page.waitForLoadState('networkidle');
    
    // Wait for database to be ready (shorter wait since previous test confirmed it works)
    await page.waitForTimeout(60000); // 1 minute
    
    // Find and test search input
    const searchInput = page.locator('input[role="searchbox"], input[placeholder*="検索"], input[type="search"]').first();
    
    if (await searchInput.count() > 0) {
      console.log('✅ Search input found');
      
      // Try searching for famous Japanese architect
      await searchInput.fill('安藤忠雄');
      await searchInput.press('Enter');
      
      // Wait for search results
      await page.waitForTimeout(5000);
      
      // Check if search produced any results
      const hasSearchResults = await page.evaluate(() => {
        const bodyText = document.body.innerText;
        return bodyText.includes('安藤') || 
               document.querySelectorAll('[data-testid*="result"], .search-result, .architecture-item').length > 0;
      });
      
      console.log(`🎯 Search results for '安藤忠雄': ${hasSearchResults}`);
      
      // Take screenshot of search results
      await page.screenshot({ path: 'final-validation-search.png', fullPage: true });
    }
  });
  
  test('should navigate to architecture list and verify real building data', async ({ page }) => {
    console.log('🏛️ Testing architecture list page with real data...');
    
    await page.goto('https://bob-takuya.github.io/archi-site/#/architecture');
    await page.waitForLoadState('networkidle');
    
    // Wait for database to load
    await page.waitForTimeout(90000); // 1.5 minutes
    
    // Check for architecture list items
    const hasArchitectureList = await page.evaluate(() => {
      const items = document.querySelectorAll('[data-testid*="architecture"], .architecture-item, .building-item, .MuiCard-root');
      
      if (items.length === 0) {
        console.log('No architecture items found');
        return false;
      }
      
      console.log(`Found ${items.length} potential architecture items`);
      
      // Check if any contain real building data
      for (const item of items) {
        const text = item.textContent || '';
        if (text.includes('年') && !text.includes('年代不明')) {
          console.log('✅ Found item with real year data');
          return true;
        }
        if (/安藤忠雄|丹下健三|隈研吾/.test(text)) {
          console.log('✅ Found item with famous architect');
          return true;
        }
      }
      
      return false;
    });
    
    console.log(`🏗️ Architecture list has real data: ${hasArchitectureList}`);
    
    // Take screenshot
    await page.screenshot({ path: 'final-validation-architecture-list.png', fullPage: true });
    
    expect(hasArchitectureList).toBeTruthy();
  });
  
});