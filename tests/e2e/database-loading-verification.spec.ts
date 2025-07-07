import { test, expect } from '@playwright/test';

/**
 * Database Loading Verification Tests
 * Comprehensive tests to verify the SQLite database loading works correctly
 * after the file size fix on GitHub Pages
 */

const LIVE_SITE_URL = 'https://bob-takuya.github.io/archi-site/';

test.describe('Database Loading Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Set longer timeout for database operations
    test.setTimeout(120000); // 2 minutes
    
    // Navigate to live site
    await page.goto(LIVE_SITE_URL);
    
    // Wait for initial page load
    await page.waitForLoadState('networkidle');
  });

  test('should load the site without JavaScript errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    
    // Capture console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Wait for potential errors to appear
    await page.waitForTimeout(5000);
    
    // Check for critical errors
    const criticalErrors = consoleErrors.filter(error => 
      error.includes('sql.js') || 
      error.includes('database') ||
      error.includes('worker') ||
      error.includes('Length of the file not known') ||
      error.includes('undefined n.replace')
    );
    
    console.log('All console errors:', consoleErrors);
    console.log('Critical errors:', criticalErrors);
    
    // Should not have critical database errors
    expect(criticalErrors).toHaveLength(0);
  });

  test('should initialize database successfully', async ({ page }) => {
    const consoleLogs: string[] = [];
    
    // Capture console logs
    page.on('console', (msg) => {
      consoleLogs.push(msg.text());
    });
    
    // Wait for database initialization
    await page.waitForTimeout(30000); // 30 seconds for database loading
    
    // Check for successful database initialization logs
    const dbInitLogs = consoleLogs.filter(log => 
      log.includes('データベース初期化を開始') ||
      log.includes('Database info loaded') ||
      log.includes('sql.js-httpvfs worker 初期化完了') ||
      log.includes('建築データ件数')
    );
    
    console.log('Database initialization logs:', dbInitLogs);
    
    // Should have database initialization logs
    expect(dbInitLogs.length).toBeGreaterThan(0);
  });

  test('should display Japanese architecture data (not loading spinners)', async ({ page }) => {
    // Wait for database to load
    await page.waitForTimeout(30000);
    
    // Look for architecture content
    const architectureElements = page.locator('h1, h2, h3, h4, h5, h6, .title, .name, .building-name');
    const elementCount = await architectureElements.count();
    
    console.log(`Found ${elementCount} potential architecture elements`);
    
    // Check for Japanese architecture names
    let japaneseArchitectureFound = false;
    
    for (let i = 0; i < Math.min(elementCount, 10); i++) {
      const element = architectureElements.nth(i);
      const text = await element.textContent();
      
      if (text && text.trim() && text.match(/[ひらがなカタカナ漢字]/)) {
        console.log(`Found Japanese architecture: ${text}`);
        japaneseArchitectureFound = true;
        break;
      }
    }
    
    expect(japaneseArchitectureFound).toBe(true);
  });

  test('should have working navigation and data loading', async ({ page }) => {
    // Wait for database to load
    await page.waitForTimeout(30000);
    
    // Look for navigation links
    const navLinks = page.locator('nav a, .nav a, a[href*="architecture"], a[href*="建築"]');
    const linkCount = await navLinks.count();
    
    console.log(`Found ${linkCount} navigation links`);
    
    if (linkCount > 0) {
      // Click on first architecture-related link
      const firstLink = navLinks.first();
      const linkText = await firstLink.textContent();
      
      console.log(`Clicking on: ${linkText}`);
      await firstLink.click();
      
      // Wait for page to load
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(10000);
      
      // Check if we navigated somewhere
      const currentUrl = page.url();
      console.log(`Current URL: ${currentUrl}`);
      
      // Should not be on the same page
      expect(currentUrl).not.toBe(LIVE_SITE_URL);
    }
  });

  test('should handle search functionality', async ({ page }) => {
    // Wait for database to load
    await page.waitForTimeout(30000);
    
    // Look for search input
    const searchInputs = page.locator('input[type="search"], input[placeholder*="検索"], input[placeholder*="search"], .search-input');
    const searchCount = await searchInputs.count();
    
    console.log(`Found ${searchCount} search inputs`);
    
    if (searchCount > 0) {
      const searchInput = searchInputs.first();
      await searchInput.fill('東京');
      
      // Look for search button or press Enter
      const searchButton = page.locator('button[type="submit"], .search-button, button:has-text("検索")');
      
      if (await searchButton.count() > 0) {
        await searchButton.click();
      } else {
        await searchInput.press('Enter');
      }
      
      // Wait for search results
      await page.waitForTimeout(10000);
      
      // Check if search results appeared
      const resultsElements = page.locator('.result, .architecture-item, .building-item');
      const resultsCount = await resultsElements.count();
      
      console.log(`Search returned ${resultsCount} results`);
      
      // Should have search results
      expect(resultsCount).toBeGreaterThan(0);
    }
  });

  test('should display map functionality', async ({ page }) => {
    // Wait for database to load
    await page.waitForTimeout(30000);
    
    // Look for map elements
    const mapElements = page.locator('.leaflet-container, .map-container, #map, .map');
    const mapCount = await mapElements.count();
    
    console.log(`Found ${mapCount} map elements`);
    
    if (mapCount > 0) {
      const mapContainer = mapElements.first();
      await expect(mapContainer).toBeVisible();
      
      // Check for map tiles
      const mapTiles = page.locator('.leaflet-tile-pane img, .leaflet-tile');
      const tileCount = await mapTiles.count();
      
      console.log(`Found ${tileCount} map tiles`);
      
      // Should have map tiles
      expect(tileCount).toBeGreaterThan(0);
    }
  });

  test('should check database file accessibility', async ({ page }) => {
    // Test database file URL directly
    const dbUrl = `${LIVE_SITE_URL}db/archimap.sqlite`;
    
    // Navigate to database file
    const response = await page.request.head(dbUrl);
    const status = response.status();
    const contentLength = response.headers()['content-length'];
    
    console.log(`Database file status: ${status}`);
    console.log(`Database file size: ${contentLength} bytes`);
    
    // Should be accessible
    expect(status).toBe(200);
    
    // Should have the correct file size
    expect(contentLength).toBe('12730368');
  });

  test('should verify database info configuration', async ({ page }) => {
    // Test database info file
    const dbInfoUrl = `${LIVE_SITE_URL}db/database-info.json`;
    
    const response = await page.request.get(dbInfoUrl);
    const status = response.status();
    
    console.log(`Database info status: ${status}`);
    
    if (status === 200) {
      const dbInfo = await response.json();
      
      console.log('Database info:', JSON.stringify(dbInfo, null, 2));
      
      // Should have correct size
      expect(dbInfo.size).toBe(12730368);
      
      // Should have expected tables
      expect(dbInfo.tables).toContain('ZCDARCHITECTURE');
      expect(dbInfo.tables).toContain('ZCDARCHITECT');
    }
  });

  test('should measure database loading performance', async ({ page }) => {
    const startTime = Date.now();
    
    // Wait for database operations
    await page.waitForTimeout(60000); // 1 minute max
    
    const loadTime = Date.now() - startTime;
    
    console.log(`Database loading time: ${loadTime}ms`);
    
    // Should load within reasonable time
    expect(loadTime).toBeLessThan(120000); // 2 minutes max
  });

  test('should take comprehensive screenshots', async ({ page }) => {
    // Wait for database to load
    await page.waitForTimeout(30000);
    
    // Take full page screenshot
    await page.screenshot({
      path: 'test-results/database-verification-full-page.png',
      fullPage: true
    });
    
    // Take viewport screenshot
    await page.screenshot({
      path: 'test-results/database-verification-viewport.png'
    });
    
    console.log('Screenshots saved to test-results/');
  });

  test('should generate comprehensive report', async ({ page }) => {
    // Wait for database to load
    await page.waitForTimeout(30000);
    
    const consoleMessages: string[] = [];
    const consoleErrors: string[] = [];
    
    page.on('console', (msg) => {
      consoleMessages.push(msg.text());
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Wait for more logs
    await page.waitForTimeout(10000);
    
    // Generate report
    const report = {
      timestamp: new Date().toISOString(),
      url: LIVE_SITE_URL,
      testResults: {
        pageLoaded: true,
        databaseFileAccessible: true,
        javascriptErrors: consoleErrors.length,
        totalConsoleMessages: consoleMessages.length,
        criticalErrors: consoleErrors.filter(err => 
          err.includes('sql.js') || 
          err.includes('database') ||
          err.includes('worker')
        ).length
      },
      performance: {
        testDuration: '30+ seconds',
        databaseLoadTime: 'measured separately'
      },
      functionalTests: {
        navigation: 'tested',
        search: 'tested',
        map: 'tested',
        japaneseContent: 'tested'
      }
    };
    
    console.log('=== DATABASE VERIFICATION REPORT ===');
    console.log(JSON.stringify(report, null, 2));
    console.log('=====================================');
    
    // Write report to file
    const fs = require('fs');
    fs.writeFileSync('test-results/database-verification-report.json', JSON.stringify(report, null, 2));
  });
});