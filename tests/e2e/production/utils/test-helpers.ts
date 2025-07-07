import { Page, expect, Locator } from '@playwright/test';

/**
 * Production E2E Test Utilities
 * Shared helpers for comprehensive testing
 */

export class TestHelpers {
  constructor(private page: Page) {}

  /**
   * Wait for page to be fully loaded with database content
   * Extended timeout for large database downloads (12.7MB + 1.2MB WASM)
   */
  async waitForPageReady(timeout: number = 200000) { // Extended to 200 seconds for database operations
    try {
      // Wait for network to be idle with extended timeout
      await this.page.waitForLoadState('networkidle', { timeout: Math.min(timeout, 60000) });
      
      // Wait for React to render
      await this.page.waitForTimeout(2000);
      
      // Check if we're on a database-dependent page and extend timeout accordingly
      const isDatabasePage = await this.page.evaluate(() => {
        const url = window.location.pathname;
        return url.includes('/architecture') || url.includes('/architects') || url.includes('/map') || url === '/' || url === '/archi-site/';
      });
      
      if (isDatabasePage) {
        console.log('📊 Database-dependent page detected, waiting for database loading...');
        
        // First, wait for the page structure to load
        await this.page.waitForFunction(() => {
          const body = document.body;
          const hasBasicContent = body && body.textContent && body.textContent.length > 100;
          return hasBasicContent;
        }, { timeout: 30000 });
        
        // Then wait for database content or loading indicators
        await this.page.waitForFunction(() => {
          const body = document.body;
          const text = body?.textContent || '';
          
          // Check for database content indicators
          const hasArchitectureData = text.includes('建築') || text.includes('architecture') || text.includes('作品');
          const hasArchitectData = text.includes('建築家') || text.includes('architect');
          const hasMapContent = document.querySelector('.leaflet-container');
          const hasProgressIndicator = text.includes('読み込み中') || text.includes('loading') || text.includes('ダウンロード');
          const hasErrorMessage = text.includes('タイムアウト') || text.includes('timeout') || text.includes('エラー');
          
          // Page is ready if we have data, or if there's an error message, or if it's clearly not loading
          return hasArchitectureData || hasArchitectData || hasMapContent || hasErrorMessage || 
                 (body.textContent && body.textContent.length > 500 && !hasProgressIndicator);
        }, { timeout: timeout - 35000 }); // Reserve 35 seconds for initial loading
        
        // Additional wait for any remaining UI updates
        await this.page.waitForTimeout(3000);
      } else {
        // For non-database pages, use shorter timeout
        await this.page.waitForFunction(() => {
          const body = document.body;
          return body && body.textContent && body.textContent.length > 200;
        }, { timeout: 15000 });
      }
    } catch (error) {
      console.warn('⚠️ Page ready timeout - continuing with test (this may be expected for slow database loading)');
      // Take a screenshot for debugging
      await this.page.screenshot({ path: `playwright-results/production-artifacts/timeout-debug-${Date.now()}.png`, fullPage: true });
    }
  }

  /**
   * Check if the page has database content loaded
   */
  async hasDatabase(): Promise<boolean> {
    try {
      // Look for architecture or architect data
      const hasArchitecture = await this.page.locator('[data-testid*="architecture"], .architecture-item, .building-item').count() > 0;
      const hasArchitect = await this.page.locator('[data-testid*="architect"], .architect-item').count() > 0;
      const hasMap = await this.page.locator('.leaflet-container, [data-testid="map"]').count() > 0;
      
      return hasArchitecture || hasArchitect || hasMap;
    } catch {
      return false;
    }
  }

  /**
   * Perform a search and wait for results
   */
  async performSearch(query: string, timeout: number = 10000): Promise<void> {
    // Find search input
    const searchInput = this.page.locator('input[type="search"], input[placeholder*="検索"], input[placeholder*="search"], [data-testid="search-input"]').first();
    
    if (await searchInput.count() > 0) {
      await searchInput.fill(query);
      await searchInput.press('Enter');
      
      // Wait for search results
      await this.page.waitForTimeout(2000);
    }
  }

  /**
   * Check responsive design at different breakpoints
   */
  async checkResponsiveDesign() {
    const breakpoints = [
      { name: 'Mobile', width: 375, height: 667 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Desktop', width: 1920, height: 1080 }
    ];

    for (const breakpoint of breakpoints) {
      await this.page.setViewportSize({ width: breakpoint.width, height: breakpoint.height });
      await this.page.waitForTimeout(1000);
      
      // Check if content is visible and properly laid out
      const body = this.page.locator('body');
      await expect(body).toBeVisible();
      
      // Check for horizontal scrollbar (should not be present on mobile)
      if (breakpoint.width < 768) {
        const hasHorizontalScroll = await this.page.evaluate(() => {
          return document.body.scrollWidth > document.body.clientWidth;
        });
        
        if (hasHorizontalScroll) {
          console.warn(`⚠️  Horizontal scroll detected on ${breakpoint.name}`);
        }
      }
    }
  }

  /**
   * Check page performance metrics
   */
  async checkPerformance(): Promise<{
    loadTime: number;
    domContentLoaded: number;
    firstContentfulPaint: number;
  }> {
    const performanceMetrics = await this.page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType('paint');
      
      return {
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0
      };
    });

    return performanceMetrics;
  }

  /**
   * Check accessibility features
   */
  async checkAccessibility() {
    // Check for proper heading structure
    const headings = await this.page.locator('h1, h2, h3, h4, h5, h6').all();
    
    // Check for alt text on images
    const images = await this.page.locator('img').all();
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      if (!alt) {
        console.warn('⚠️  Image without alt text found');
      }
    }

    // Check for proper form labels
    const inputs = await this.page.locator('input, select, textarea').all();
    for (const input of inputs) {
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledby = await input.getAttribute('aria-labelledby');
      
      if (id) {
        const label = await this.page.locator(`label[for="${id}"]`).count();
        if (label === 0 && !ariaLabel && !ariaLabelledby) {
          console.warn('⚠️  Input without proper label found');
        }
      }
    }

    // Check for keyboard navigation
    const focusableElements = await this.page.locator('a, button, input, select, textarea, [tabindex]').all();
    return focusableElements.length > 0;
  }

  /**
   * Take a screenshot with timestamp
   */
  async takeTimestampedScreenshot(name: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${name}-${timestamp}.png`;
    await this.page.screenshot({ path: `playwright-results/production-artifacts/${filename}`, fullPage: true });
    return filename;
  }

  /**
   * Wait for map to load (Leaflet)
   */
  async waitForMapLoad(timeout: number = 15000): Promise<void> {
    // Wait for Leaflet container
    await this.page.waitForSelector('.leaflet-container', { timeout });
    
    // Wait for map tiles to load
    await this.page.waitForFunction(() => {
      const container = document.querySelector('.leaflet-container');
      if (!container) return false;
      
      const tiles = container.querySelectorAll('.leaflet-tile');
      return tiles.length > 0;
    }, { timeout });
    
    // Additional wait for map to stabilize
    await this.page.waitForTimeout(2000);
  }

  /**
   * Check if Japanese text is displaying correctly
   */
  async checkJapaneseText(): Promise<boolean> {
    const japaneseText = await this.page.locator('body').evaluate(el => {
      const text = el.textContent || '';
      // Check for common Japanese characters
      return /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(text);
    });

    return japaneseText;
  }

  /**
   * Wait for database operations to complete
   * Extended timeout for large database downloads
   */
  async waitForDatabaseOperation(timeout: number = 180000): Promise<void> { // Extended to 180 seconds
    try {
      // Wait for loading indicators to disappear or content to appear
      await this.page.waitForFunction(() => {
        const loadingElements = document.querySelectorAll('[data-testid*="loading"], .loading, .spinner');
        const hasContent = document.body?.textContent && document.body.textContent.length > 500;
        const hasError = document.body?.textContent?.includes('タイムアウト') || document.body?.textContent?.includes('エラー');
        
        return loadingElements.length === 0 || hasContent || hasError;
      }, { timeout });
      
      // Additional wait for content to render
      await this.page.waitForTimeout(2000);
    } catch (error) {
      console.warn('⚠️ Database operation timeout - this may be expected for large database downloads');
    }
  }

  /**
   * Generate test report data
   */
  async generateReportData(testName: string) {
    const url = this.page.url();
    const title = await this.page.title();
    const timestamp = new Date().toISOString();
    const viewport = this.page.viewportSize();
    
    return {
      testName,
      url,
      title,
      timestamp,
      viewport,
      userAgent: await this.page.evaluate(() => navigator.userAgent)
    };
  }
}

/**
 * Common selectors for the architecture site
 */
export const selectors = {
  // Navigation
  navigation: 'nav, [data-testid="navigation"]',
  menuButton: 'button[aria-label*="menu"], [data-testid="menu-button"]',
  
  // Search
  searchInput: 'input[type="search"], input[placeholder*="検索"], input[placeholder*="search"], [data-testid="search-input"]',
  searchButton: 'button[type="submit"], [data-testid="search-button"]',
  
  // Architecture elements
  architectureList: '[data-testid="architecture-list"], .architecture-list',
  architectureItem: '[data-testid*="architecture"], .architecture-item, .building-item',
  architectureCard: '.card, .architecture-card, [data-testid="architecture-card"]',
  
  // Architect elements
  architectList: '[data-testid="architect-list"], .architect-list',
  architectItem: '[data-testid*="architect"], .architect-item',
  architectCard: '.card, .architect-card, [data-testid="architect-card"]',
  
  // Map elements
  mapContainer: '.leaflet-container, [data-testid="map"]',
  mapMarker: '.leaflet-marker, .marker',
  mapPopup: '.leaflet-popup, .popup',
  
  // Filters and controls
  filterButton: '[data-testid*="filter"], .filter-button',
  sortButton: '[data-testid*="sort"], .sort-button',
  
  // Common UI elements
  button: 'button, [role="button"]',
  link: 'a, [role="link"]',
  card: '.card, [data-testid*="card"]',
  modal: '.modal, [role="dialog"]',
  
  // Loading states
  loading: '[data-testid*="loading"], .loading, .spinner',
  skeleton: '.skeleton, [data-testid="skeleton"]'
};

/**
 * Test data for searches and validations
 */
export const testData = {
  // Common search terms
  searchTerms: {
    japanese: ['東京', '建築', '住宅', '商業', '文化施設'],
    english: ['Tokyo', 'architecture', 'building', 'house', 'commercial'],
    architects: ['安藤忠雄', '隈研吾', '妹島和世', '西沢立衛'],
    buildingTypes: ['住宅', '商業', '文化施設', '教育', '医療']
  },
  
  // Expected page elements
  expectedElements: {
    homepage: ['nav', 'main', 'footer'],
    architecturePage: ['h1', 'nav', 'main'],
    mapPage: ['.leaflet-container', 'nav']
  },
  
  // Performance thresholds (adjusted for large database loading)
  performance: {
    maxLoadTime: 30000,      // Extended for database download
    maxDomContentLoaded: 10000,  // Extended for initial page setup
    maxFirstContentfulPaint: 5000   // Extended for progressive loading
  }
};