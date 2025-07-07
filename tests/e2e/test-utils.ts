import { Page, expect } from '@playwright/test';

/**
 * Test utilities for E2E testing
 * Provides common functions and helpers for PlaywrightMCP integration
 */

export class TestUtils {
  
  /**
   * Wait for database to be ready
   */
  static async waitForDatabase(page: Page, timeout = 20000): Promise<void> {
    await page.waitForFunction(() => {
      // Check if database service is available
      return window.location.href.includes('localhost') || 
             document.querySelector('[data-testid="architecture-item"]') ||
             document.querySelector('[data-testid="loading-skeleton"]');
    }, { timeout });
  }

  /**
   * Wait for map to be fully loaded
   */
  static async waitForMapLoad(page: Page, timeout = 15000): Promise<void> {
    // Wait for Leaflet container
    await page.waitForSelector('.leaflet-container', { timeout });
    
    // Wait for map tiles to load
    await page.waitForSelector('.leaflet-tile', { timeout: 10000 });
    
    // Wait for map to be interactive
    await page.waitForFunction(() => {
      const map = document.querySelector('.leaflet-container');
      return map && map.classList.contains('leaflet-touch') !== undefined;
    }, { timeout: 5000 });
  }

  /**
   * Check for loading states and wait for content
   */
  static async waitForContentLoad(page: Page, contentSelector: string, timeout = 15000): Promise<void> {
    // First wait for either content or loading state
    await page.waitForSelector(`${contentSelector}, [data-testid="loading-skeleton"], [data-testid="no-results"]`, { 
      timeout 
    });
    
    // If loading skeleton is present, wait for real content
    const hasLoading = await page.locator('[data-testid="loading-skeleton"]').count() > 0;
    if (hasLoading) {
      await page.waitForSelector(contentSelector, { timeout: timeout + 10000 });
    }
  }

  /**
   * Verify responsive design elements
   */
  static async verifyResponsiveElements(page: Page, viewport: { width: number; height: number }): Promise<void> {
    // Check that content doesn't overflow
    const bodyBounds = await page.locator('body').boundingBox();
    if (bodyBounds) {
      expect(bodyBounds.width).toBeLessThanOrEqual(viewport.width + 20);
    }
    
    // Check for touch-friendly elements on mobile
    if (viewport.width < 768) {
      const buttons = page.locator('button:visible');
      const buttonCount = await buttons.count();
      
      for (let i = 0; i < Math.min(buttonCount, 3); i++) {
        const button = buttons.nth(i);
        const buttonBounds = await button.boundingBox();
        
        if (buttonBounds) {
          expect(buttonBounds.height).toBeGreaterThanOrEqual(44);
        }
      }
    }
  }

  /**
   * Test search functionality
   */
  static async testSearchFunctionality(page: Page, searchTerm: string): Promise<boolean> {
    const searchSelectors = [
      '[data-testid="search-input"]',
      'input[type="search"]',
      'input[placeholder*="検索"]',
      'input[placeholder*="search"]'
    ];
    
    let searchInput = null;
    for (const selector of searchSelectors) {
      const input = page.locator(selector);
      if (await input.count() > 0) {
        searchInput = input.first();
        break;
      }
    }
    
    if (!searchInput) {
      return false;
    }
    
    await searchInput.fill(searchTerm);
    
    // Look for search button or press Enter
    const searchButton = page.locator('button:has-text("Search"), button:has-text("検索")');
    if (await searchButton.count() > 0) {
      await searchButton.first().click();
    } else {
      await searchInput.press('Enter');
    }
    
    // Wait for results
    await page.waitForLoadState('networkidle');
    
    return true;
  }

  /**
   * Verify architecture item structure
   */
  static async verifyArchitectureItem(page: Page, itemLocator: any): Promise<void> {
    await expect(itemLocator).toBeVisible();
    
    // Check for name
    const nameElement = itemLocator.locator('[data-testid="architecture-name"], .architecture-name, h2, h3');
    if (await nameElement.count() > 0) {
      await expect(nameElement.first()).toBeVisible();
    }
    
    // Check for architect
    const architectElement = itemLocator.locator('[data-testid="architect-name"], .architect-name');
    if (await architectElement.count() > 0) {
      await expect(architectElement.first()).toBeVisible();
    }
    
    // Check for location
    const locationElement = itemLocator.locator('[data-testid="architecture-location"], .location');
    if (await locationElement.count() > 0) {
      await expect(locationElement.first()).toBeVisible();
    }
  }

  /**
   * Test map marker interaction
   */
  static async testMapMarkerInteraction(page: Page): Promise<boolean> {
    const markers = page.locator('.leaflet-marker-icon');
    const markerCount = await markers.count();
    
    if (markerCount === 0) {
      return false;
    }
    
    // Click on first marker
    await markers.first().click();
    
    // Check for popup
    const popup = page.locator('.leaflet-popup');
    if (await popup.count() > 0) {
      await expect(popup.first()).toBeVisible();
      
      // Check popup content
      const popupContent = page.locator('.leaflet-popup-content');
      await expect(popupContent.first()).toBeVisible();
      
      return true;
    }
    
    return false;
  }

  /**
   * Verify navigation functionality
   */
  static async verifyNavigation(page: Page): Promise<void> {
    const nav = page.getByRole('navigation');
    await expect(nav).toBeVisible();
    
    // Check for main navigation links
    const navLinks = [
      { pattern: /architecture|建築/i, url: '/architecture' },
      { pattern: /architects|建築家/i, url: '/architects' },
      { pattern: /map|マップ/i, url: '/map' }
    ];
    
    for (const link of navLinks) {
      const navLink = page.getByRole('link', { name: link.pattern });
      if (await navLink.count() > 0) {
        await expect(navLink.first()).toBeVisible();
      }
    }
  }

  /**
   * Check accessibility features
   */
  static async verifyAccessibility(page: Page): Promise<void> {
    // Check for proper heading hierarchy
    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toBeVisible();
    
    // Check for alt text on images
    const images = page.locator('img:visible');
    const imageCount = await images.count();
    
    for (let i = 0; i < Math.min(imageCount, 3); i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      const ariaLabel = await img.getAttribute('aria-label');
      
      expect(alt !== null || ariaLabel !== null).toBeTruthy();
    }
    
    // Check for keyboard navigation
    await page.keyboard.press('Tab');
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  }

  /**
   * Monitor performance metrics
   */
  static async getPerformanceMetrics(page: Page): Promise<any> {
    return await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType('paint');
      
      return {
        navigation: {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
          transferSize: navigation.transferSize,
          encodedBodySize: navigation.encodedBodySize
        },
        paint: {
          firstPaint: paint.find(entry => entry.name === 'first-paint')?.startTime,
          firstContentfulPaint: paint.find(entry => entry.name === 'first-contentful-paint')?.startTime
        },
        memory: (performance as any).memory ? {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize
        } : null
      };
    });
  }

  /**
   * Test error handling
   */
  static async verifyErrorHandling(page: Page, expectedErrorSelectors: string[]): Promise<boolean> {
    for (const selector of expectedErrorSelectors) {
      const errorElement = page.locator(selector);
      if (await errorElement.count() > 0) {
        await expect(errorElement.first()).toBeVisible();
        return true;
      }
    }
    return false;
  }

  /**
   * Test filter functionality
   */
  static async testFilterFunctionality(page: Page): Promise<boolean> {
    const filterSelectors = [
      '[data-testid="filter-panel"]',
      '[data-testid="filter-controls"]',
      '.filter-panel',
      '.filters'
    ];
    
    let filterPanel = null;
    for (const selector of filterSelectors) {
      const panel = page.locator(selector);
      if (await panel.count() > 0) {
        filterPanel = panel.first();
        break;
      }
    }
    
    if (!filterPanel) {
      return false;
    }
    
    // Test select filters
    const selectFilters = filterPanel.locator('select');
    if (await selectFilters.count() > 0) {
      const firstSelect = selectFilters.first();
      const options = await firstSelect.locator('option').count();
      
      if (options > 1) {
        await firstSelect.selectOption({ index: 1 });
        await page.waitForLoadState('networkidle');
        return true;
      }
    }
    
    // Test checkbox filters
    const checkboxFilters = filterPanel.locator('input[type="checkbox"]');
    if (await checkboxFilters.count() > 0) {
      await checkboxFilters.first().check();
      await page.waitForLoadState('networkidle');
      return true;
    }
    
    return false;
  }

  /**
   * Verify mobile menu functionality
   */
  static async verifyMobileMenu(page: Page): Promise<void> {
    const mobileMenuToggle = page.locator('[data-testid="mobile-menu-toggle"], .mobile-menu-toggle, button[aria-label*="menu"]');
    
    if (await mobileMenuToggle.count() > 0) {
      await expect(mobileMenuToggle.first()).toBeVisible();
      
      // Test mobile menu interaction
      await mobileMenuToggle.first().click();
      
      // Menu should expand
      const expandedMenu = page.locator('[data-testid="mobile-menu"], .mobile-menu, .nav-menu[aria-expanded="true"]');
      if (await expandedMenu.count() > 0) {
        await expect(expandedMenu.first()).toBeVisible();
      }
    }
  }

  /**
   * Take screenshot with timestamp
   */
  static async takeTimestampedScreenshot(page: Page, name: string): Promise<void> {
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    await page.screenshot({ 
      path: `playwright-results/artifacts/${name}-${timestamp}.png`,
      fullPage: true 
    });
  }

  /**
   * Wait for network to be idle with custom timeout
   */
  static async waitForNetworkIdle(page: Page, timeout = 5000): Promise<void> {
    await page.waitForLoadState('networkidle', { timeout });
  }
}

/**
 * Common test data and constants
 */
export const TestData = {
  viewports: {
    mobile: { width: 375, height: 667 },
    tablet: { width: 768, height: 1024 },
    desktop: { width: 1200, height: 800 },
    large: { width: 1920, height: 1080 }
  },
  
  searchTerms: {
    common: ['Tokyo', 'Osaka', 'Museum', 'Library'],
    uncommon: ['XYZ123NonExistent', 'UnlikelyBuildingName']
  },
  
  timeouts: {
    short: 5000,
    medium: 15000,
    long: 30000,
    database: 20000
  },
  
  selectors: {
    architectureItem: '[data-testid="architecture-item"]',
    loadingSkeleton: '[data-testid="loading-skeleton"]',
    noResults: '[data-testid="no-results"]',
    mapContainer: '[data-testid="map-container"], .leaflet-container',
    searchInput: '[data-testid="search-input"], input[type="search"]',
    filterPanel: '[data-testid="filter-panel"], .filter-panel'
  }
};

/**
 * Performance thresholds for testing
 */
export const PerformanceThresholds = {
  pageLoad: 5000,
  databaseQuery: 3000,
  searchResponse: 5000,
  mapLoad: 15000,
  imageLoad: 30000,
  bundleSize: {
    javascript: 1024, // KB
    css: 200 // KB
  }
};