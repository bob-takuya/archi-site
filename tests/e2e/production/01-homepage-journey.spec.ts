import { test, expect } from '@playwright/test';
import { TestHelpers, selectors, testData } from './utils/test-helpers';

/**
 * Homepage User Journey E2E Tests
 * Tests the complete user experience on the homepage
 */
test.describe('Homepage User Journey', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await page.goto('/');
    await helpers.waitForPageReady();
  });

  test('should load homepage successfully', async ({ page }) => {
    // Verify page title
    await expect(page).toHaveTitle(/建築|アーキテクチャ|Architecture/);
    
    // Verify main navigation elements
    const nav = page.locator(selectors.navigation);
    await expect(nav).toBeVisible();
    
    // Verify Japanese text is displaying correctly
    const hasJapanese = await helpers.checkJapaneseText();
    expect(hasJapanese).toBe(true);
    
    // Take screenshot for verification
    await helpers.takeTimestampedScreenshot('homepage-loaded');
  });

  test('should display hero section and feature cards', async ({ page }) => {
    // Check for hero section
    const hero = page.locator('section, .hero, .banner, .intro').first();
    await expect(hero).toBeVisible();
    
    // Check for feature cards or main content sections
    const cards = page.locator(selectors.card);
    const cardCount = await cards.count();
    expect(cardCount).toBeGreaterThan(0);
    
    // Verify content is loaded
    const hasDatabase = await helpers.hasDatabase();
    if (hasDatabase) {
      console.log('✅ Database content detected on homepage');
    } else {
      console.log('ℹ️  No database content detected on homepage (may be expected)');
    }
  });

  test('should have working navigation menu', async ({ page }) => {
    // Test main navigation links
    const navLinks = page.locator('nav a, nav button');
    const linkCount = await navLinks.count();
    expect(linkCount).toBeGreaterThan(0);
    
    // Test each navigation link
    for (let i = 0; i < Math.min(linkCount, 5); i++) {
      const link = navLinks.nth(i);
      const linkText = await link.textContent();
      const href = await link.getAttribute('href');
      
      if (linkText && href && !href.startsWith('#')) {
        console.log(`Testing navigation link: ${linkText} -> ${href}`);
        
        // Click the link
        await link.click();
        
        // Wait for navigation
        await page.waitForLoadState('networkidle');
        
        // Verify we navigated somewhere
        const currentUrl = page.url();
        expect(currentUrl).not.toBe('/');
        
        // Go back to homepage
        await page.goBack();
        await helpers.waitForPageReady();
        
        break; // Test just one link to avoid too many navigations
      }
    }
  });

  test('should have functional search', async ({ page }) => {
    // Look for search input
    const searchInput = page.locator(selectors.searchInput);
    
    if (await searchInput.count() > 0) {
      await expect(searchInput).toBeVisible();
      
      // Test search functionality
      for (const term of testData.searchTerms.japanese.slice(0, 2)) {
        await helpers.performSearch(term);
        
        // Wait for potential results
        await page.waitForTimeout(2000);
        
        // Check if search affected the page
        const pageContent = await page.textContent('body');
        expect(pageContent).toBeTruthy();
        
        console.log(`✅ Search performed for: ${term}`);
      }
    } else {
      console.log('ℹ️  No search functionality found on homepage');
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await helpers.waitForPageReady();
    
    // Check if content is visible
    const body = page.locator('body');
    await expect(body).toBeVisible();
    
    // Check for mobile navigation (hamburger menu)
    const menuButton = page.locator(selectors.menuButton);
    if (await menuButton.count() > 0) {
      await expect(menuButton).toBeVisible();
      
      // Test menu functionality
      await menuButton.click();
      await page.waitForTimeout(1000);
      
      // Check if menu opened
      const menu = page.locator('nav, .menu, [data-testid="menu"]');
      await expect(menu).toBeVisible();
      
      console.log('✅ Mobile navigation menu working');
    }
    
    // Take mobile screenshot
    await helpers.takeTimestampedScreenshot('homepage-mobile');
  });

  test('should be responsive on tablet', async ({ page }) => {
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await helpers.waitForPageReady();
    
    // Check if content is visible and properly laid out
    const body = page.locator('body');
    await expect(body).toBeVisible();
    
    // Check for proper tablet layout
    const cards = page.locator(selectors.card);
    const cardCount = await cards.count();
    
    if (cardCount > 0) {
      // Verify cards are properly displayed
      for (let i = 0; i < Math.min(cardCount, 3); i++) {
        const card = cards.nth(i);
        await expect(card).toBeVisible();
      }
    }
    
    // Take tablet screenshot
    await helpers.takeTimestampedScreenshot('homepage-tablet');
  });

  test('should have good performance', async ({ page }) => {
    // Measure performance metrics
    const metrics = await helpers.checkPerformance();
    
    // Check performance thresholds
    expect(metrics.loadTime).toBeLessThan(testData.performance.maxLoadTime);
    expect(metrics.domContentLoaded).toBeLessThan(testData.performance.maxDomContentLoaded);
    
    if (metrics.firstContentfulPaint > 0) {
      expect(metrics.firstContentfulPaint).toBeLessThan(testData.performance.maxFirstContentfulPaint);
    }
    
    console.log('📊 Performance metrics:', {
      loadTime: `${metrics.loadTime}ms`,
      domContentLoaded: `${metrics.domContentLoaded}ms`,
      firstContentfulPaint: `${metrics.firstContentfulPaint}ms`
    });
  });

  test('should have accessible elements', async ({ page }) => {
    // Check basic accessibility
    const hasAccessibleElements = await helpers.checkAccessibility();
    expect(hasAccessibleElements).toBe(true);
    
    // Check for proper heading structure
    const h1 = page.locator('h1');
    const h1Count = await h1.count();
    expect(h1Count).toBeGreaterThanOrEqual(1);
    
    // Check for proper landmarks
    const main = page.locator('main');
    const mainCount = await main.count();
    expect(mainCount).toBeGreaterThanOrEqual(1);
    
    // Check for proper navigation
    const nav = page.locator('nav');
    const navCount = await nav.count();
    expect(navCount).toBeGreaterThanOrEqual(1);
    
    console.log('✅ Basic accessibility checks passed');
  });

  test('should handle errors gracefully', async ({ page }) => {
    // Test error handling by checking for error messages
    const errorMessages = page.locator('.error, .alert-danger, [data-testid="error"]');
    const errorCount = await errorMessages.count();
    
    // Should not have critical errors visible
    expect(errorCount).toBe(0);
    
    // Check console for JavaScript errors
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleMessages.push(msg.text());
      }
    });
    
    // Wait a bit to collect console messages
    await page.waitForTimeout(3000);
    
    // Log any console errors for debugging
    if (consoleMessages.length > 0) {
      console.log('⚠️  Console errors detected:', consoleMessages);
    }
    
    // Check for network errors
    const failedRequests: string[] = [];
    page.on('response', response => {
      if (response.status() >= 400) {
        failedRequests.push(`${response.status()} ${response.url()}`);
      }
    });
    
    await page.reload();
    await helpers.waitForPageReady();
    
    // Log failed requests
    if (failedRequests.length > 0) {
      console.log('⚠️  Failed requests:', failedRequests);
    }
  });

  test('should generate homepage report', async ({ page }) => {
    // Generate comprehensive report data
    const reportData = await helpers.generateReportData('Homepage Journey');
    
    // Add homepage-specific data
    const homepageData = {
      ...reportData,
      hasJapaneseText: await helpers.checkJapaneseText(),
      hasDatabase: await helpers.hasDatabase(),
      navigationLinks: await page.locator('nav a').count(),
      cardCount: await page.locator(selectors.card).count(),
      hasSearch: await page.locator(selectors.searchInput).count() > 0
    };
    
    console.log('📋 Homepage Report:', JSON.stringify(homepageData, null, 2));
    
    // Take final screenshot
    await helpers.takeTimestampedScreenshot('homepage-final');
  });
});