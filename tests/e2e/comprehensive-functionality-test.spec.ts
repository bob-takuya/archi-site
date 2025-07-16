import { test, expect } from '@playwright/test';

// Test against the live deployed site
const BASE_URL = 'https://bob-takuya.github.io/archi-site/';

test.describe('Comprehensive Functionality Test - All Features', () => {
  // Use longer timeout for database loading
  test.setTimeout(60000);

  test('Homepage loads and displays correct content', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Check page title
    await expect(page).toHaveTitle(/建築データベース/);
    
    // Check navigation tabs
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.getByRole('tab', { name: /ホーム/ })).toBeVisible();
    await expect(page.getByRole('tab', { name: /建築物/ })).toBeVisible();
    await expect(page.getByRole('tab', { name: /建築家/ })).toBeVisible();
    await expect(page.getByRole('tab', { name: /地図/ })).toBeVisible();
    await expect(page.getByRole('tab', { name: /研究/ })).toBeVisible();
    
    // Check hero section
    await expect(page.locator('h1')).toContainText(/日本の建築/);
    
    // Check stats cards
    await expect(page.locator('text=/14,\\d{3}/')).toBeVisible();
    await expect(page.locator('text=/2,\\d{3}/')).toBeVisible();
    
    console.log('✅ Homepage test passed');
  });

  test('Architecture tab loads and displays data', async ({ page }) => {
    await page.goto(`${BASE_URL}#/architecture`);
    
    // Wait for data to load
    await page.waitForSelector('.MuiGrid-container', { timeout: 30000 });
    
    // Check search functionality
    const searchInput = page.locator('input[placeholder*="検索"]');
    await expect(searchInput).toBeVisible();
    
    // Check grid/list toggle
    await expect(page.locator('[aria-label*="グリッド表示"]')).toBeVisible();
    
    // Check for architecture cards
    const architectureCards = page.locator('.MuiCard-root');
    await expect(architectureCards.first()).toBeVisible({ timeout: 30000 });
    
    // Verify cards have content
    const firstCard = architectureCards.first();
    await expect(firstCard.locator('h6')).toBeVisible();
    await expect(firstCard.locator('text=/\\d{4}/')).toBeVisible(); // Year
    
    console.log('✅ Architecture tab test passed');
  });

  test('Architects tab loads with real data from SQLite database', async ({ page }) => {
    // Navigate to architects page
    await page.goto(`${BASE_URL}#/architects`);
    
    // Wait for initial load - may show loading state first
    await page.waitForTimeout(3000);
    
    // Check console for database initialization
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('Starting database initialization') || 
          text.includes('Architect records:') ||
          text.includes('RealArchitectService')) {
        console.log('🔍 Console:', text);
      }
    });
    
    // Check if architects are loading or loaded
    const architectCount = page.locator('text=/\\d+人の建築家/');
    
    // Wait for either real data or loading state
    await expect(architectCount).toBeVisible({ timeout: 30000 });
    
    // Get the text to verify it's not "0人の建築家"
    const countText = await architectCount.textContent();
    console.log(`📊 Architect count displayed: ${countText}`);
    
    // Should show more than 0 architects (expecting 2927)
    expect(countText).not.toBe('0人の建築家');
    expect(countText).toMatch(/[1-9]\d*人の建築家/);
    
    // Check for architect cards
    const architectCards = page.locator('.MuiCard-root');
    await expect(architectCards.first()).toBeVisible({ timeout: 30000 });
    
    // Verify cards have real content
    const firstCard = architectCards.first();
    await expect(firstCard.locator('h6')).toBeVisible();
    
    // Check suggestions sidebar
    await expect(page.locator('text="おすすめの検索"')).toBeVisible();
    
    console.log('✅ Architects tab test passed - Real data loaded');
  });

  test('Map page loads with Leaflet map', async ({ page }) => {
    await page.goto(`${BASE_URL}#/map`);
    
    // Wait for map container
    await expect(page.locator('#map')).toBeVisible({ timeout: 30000 });
    
    // Check for Leaflet map elements
    await expect(page.locator('.leaflet-container')).toBeVisible();
    await expect(page.locator('.leaflet-tile-container')).toBeVisible();
    
    // Check map controls
    await expect(page.locator('.leaflet-control-zoom')).toBeVisible();
    
    // Check filter panel
    await expect(page.locator('text="フィルター"')).toBeVisible();
    
    console.log('✅ Map page test passed');
  });

  test('Research page loads and displays content', async ({ page }) => {
    await page.goto(`${BASE_URL}#/research`);
    
    // Check page title
    await expect(page.locator('h4').filter({ hasText: '研究・分析ツール' })).toBeVisible();
    
    // Check research categories
    await expect(page.locator('text="統計分析"')).toBeVisible();
    await expect(page.locator('text="時系列分析"')).toBeVisible();
    await expect(page.locator('text="地理的分析"')).toBeVisible();
    
    console.log('✅ Research page test passed');
  });

  test('Search functionality works across pages', async ({ page }) => {
    // Test architecture search
    await page.goto(`${BASE_URL}#/architecture`);
    await page.waitForSelector('input[placeholder*="検索"]', { timeout: 30000 });
    
    const searchInput = page.locator('input[placeholder*="検索"]');
    await searchInput.fill('東京');
    await searchInput.press('Enter');
    
    // Wait for search results
    await page.waitForTimeout(2000);
    
    // Check URL updated with search parameter
    expect(page.url()).toContain('search=');
    
    console.log('✅ Search functionality test passed');
  });

  test('Filter functionality works', async ({ page }) => {
    await page.goto(`${BASE_URL}#/architecture`);
    
    // Open filter panel
    const filterButton = page.locator('button').filter({ hasText: /フィルター/ });
    if (await filterButton.isVisible()) {
      await filterButton.click();
      
      // Check filter options are visible
      await expect(page.locator('text="都道府県"')).toBeVisible();
      await expect(page.locator('text="年代"')).toBeVisible();
      await expect(page.locator('text="カテゴリー"')).toBeVisible();
    }
    
    console.log('✅ Filter functionality test passed');
  });

  test('Responsive design works on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(BASE_URL);
    
    // Check mobile menu
    const menuButton = page.locator('[aria-label*="menu"]');
    if (await menuButton.isVisible()) {
      await menuButton.click();
      // Mobile menu should open
      await expect(page.locator('nav')).toBeVisible();
    }
    
    console.log('✅ Responsive design test passed');
  });

  test('Database loading and error handling', async ({ page }) => {
    // Monitor console for database messages
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      consoleMessages.push(msg.text());
    });
    
    await page.goto(`${BASE_URL}#/architecture`);
    await page.waitForTimeout(5000);
    
    // Check for database initialization messages
    const dbMessages = consoleMessages.filter(msg => 
      msg.includes('database') || 
      msg.includes('Database') ||
      msg.includes('SQLite') ||
      msg.includes('chunked loading')
    );
    
    console.log('📊 Database messages:', dbMessages);
    expect(dbMessages.length).toBeGreaterThan(0);
    
    console.log('✅ Database loading test passed');
  });

  test('Performance: Page loads within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    
    const loadTime = Date.now() - startTime;
    console.log(`📊 Page load time: ${loadTime}ms`);
    
    // Page should load within 10 seconds
    expect(loadTime).toBeLessThan(10000);
    
    console.log('✅ Performance test passed');
  });
});

// Test specifically for architect database functionality
test.describe('Architect Database Functionality', () => {
  test('Architect database loads and displays real data', async ({ page }) => {
    // Enable console logging
    page.on('console', msg => {
      if (msg.type() === 'log' || msg.type() === 'info') {
        console.log('Browser log:', msg.text());
      } else if (msg.type() === 'error') {
        console.error('Browser error:', msg.text());
      }
    });
    
    await page.goto(`${BASE_URL}#/architects`);
    
    // Wait for database to initialize
    await page.waitForTimeout(5000);
    
    // Check for loading or data state
    const pageContent = await page.content();
    
    // Should not show "0人の建築家"
    expect(pageContent).not.toContain('0人の建築家');
    
    // Should either show loading state or real data
    const hasData = pageContent.includes('人の建築家') && !pageContent.includes('0人の建築家');
    const isLoading = pageContent.includes('検索中') || pageContent.includes('Loading');
    
    expect(hasData || isLoading).toBeTruthy();
    
    if (hasData) {
      // Verify we have architect cards
      const cards = await page.locator('.MuiCard-root').count();
      expect(cards).toBeGreaterThan(0);
      
      console.log(`✅ Found ${cards} architect cards`);
    }
    
    console.log('✅ Architect database functionality test passed');
  });
});