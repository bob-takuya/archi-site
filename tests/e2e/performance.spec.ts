import { test, expect } from '@playwright/test';

test.describe('Performance Testing', () => {
  test('should load homepage within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    
    // Wait for main content to be visible
    await page.waitForSelector('main', { timeout: 15000 });
    
    const loadTime = Date.now() - startTime;
    
    // Homepage should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
    
    // Check for performance metrics
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint: performance.getEntriesByType('paint').find(entry => entry.name === 'first-paint')?.startTime,
        firstContentfulPaint: performance.getEntriesByType('paint').find(entry => entry.name === 'first-contentful-paint')?.startTime
      };
    });
    
    // DOM content should load quickly
    expect(performanceMetrics.domContentLoaded).toBeLessThan(2000);
    
    // First paint should happen quickly
    if (performanceMetrics.firstPaint) {
      expect(performanceMetrics.firstPaint).toBeLessThan(2000);
    }
    
    // First contentful paint should happen quickly
    if (performanceMetrics.firstContentfulPaint) {
      expect(performanceMetrics.firstContentfulPaint).toBeLessThan(3000);
    }
  });

  test('should load architecture list efficiently', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/architecture');
    
    // Wait for architecture items to load
    await page.waitForSelector('[data-testid="architecture-item"], [data-testid="loading-skeleton"]', { timeout: 15000 });
    
    const initialLoadTime = Date.now() - startTime;
    
    // Initial load should be quick
    expect(initialLoadTime).toBeLessThan(10000);
    
    // Wait for actual data to load
    await page.waitForSelector('[data-testid="architecture-item"]', { timeout: 20000 });
    
    const fullLoadTime = Date.now() - startTime;
    
    // Full data load should be reasonable
    expect(fullLoadTime).toBeLessThan(20000);
    
    // Check for lazy loading or pagination
    const items = page.locator('[data-testid="architecture-item"]');
    const itemCount = await items.count();
    
    // Should load a reasonable number of items per page
    expect(itemCount).toBeGreaterThan(0);
    expect(itemCount).toBeLessThan(100); // Avoid loading too many items at once
  });

  test('should handle database queries efficiently', async ({ page }) => {
    await page.goto('/architecture');
    
    // Monitor network requests
    const dbRequests: Array<{ url: string; duration: number }> = [];
    
    page.on('response', response => {
      if (response.url().includes('/api/') || response.url().includes('database')) {
        const request = response.request();
        const timing = response.timing();
        
        dbRequests.push({
          url: response.url(),
          duration: timing.responseEnd - timing.requestStart
        });
      }
    });
    
    // Wait for items to load
    await page.waitForSelector('[data-testid="architecture-item"]', { timeout: 20000 });
    
    // Check database query performance
    if (dbRequests.length > 0) {
      const slowQueries = dbRequests.filter(req => req.duration > 5000);
      expect(slowQueries.length).toBe(0);
      
      // Average query time should be reasonable
      const avgDuration = dbRequests.reduce((sum, req) => sum + req.duration, 0) / dbRequests.length;
      expect(avgDuration).toBeLessThan(3000);
    }
  });

  test('should handle search performance', async ({ page }) => {
    await page.goto('/architecture');
    
    // Wait for page to load
    await page.waitForSelector('[data-testid="architecture-item"]', { timeout: 15000 });
    
    // Find search input
    const searchInput = page.locator('[data-testid="search-input"], input[type="search"]');
    
    if (await searchInput.count() > 0) {
      const startTime = Date.now();
      
      // Perform search
      await searchInput.first().fill('Tokyo');
      
      // Look for search button or press Enter
      const searchButton = page.locator('button:has-text("Search"), button:has-text("検索")');
      if (await searchButton.count() > 0) {
        await searchButton.first().click();
      } else {
        await searchInput.first().press('Enter');
      }
      
      // Wait for search results
      await page.waitForLoadState('networkidle');
      
      const searchTime = Date.now() - startTime;
      
      // Search should complete within reasonable time
      expect(searchTime).toBeLessThan(5000);
      
      // Check for search results or no results message
      const hasResults = await page.locator('[data-testid="architecture-item"]').count() > 0;
      const hasNoResults = await page.locator('[data-testid="no-results"]').count() > 0;
      
      expect(hasResults || hasNoResults).toBeTruthy();
    }
  });

  test('should handle map loading performance', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/map');
    
    // Wait for map container
    await page.waitForSelector('.leaflet-container', { timeout: 15000 });
    
    const mapLoadTime = Date.now() - startTime;
    
    // Map should load within reasonable time
    expect(mapLoadTime).toBeLessThan(15000);
    
    // Wait for map tiles to load
    await page.waitForSelector('.leaflet-tile', { timeout: 10000 });
    
    const tilesLoadTime = Date.now() - startTime;
    
    // Tiles should load within reasonable time
    expect(tilesLoadTime).toBeLessThan(20000);
    
    // Check for markers
    const markerStartTime = Date.now();
    await page.waitForSelector('.leaflet-marker-icon', { timeout: 10000 });
    
    const markerLoadTime = Date.now() - markerStartTime;
    
    // Markers should load quickly
    expect(markerLoadTime).toBeLessThan(10000);
  });

  test('should handle image loading performance', async ({ page }) => {
    await page.goto('/architecture');
    
    // Wait for content to load
    await page.waitForSelector('[data-testid="architecture-item"]', { timeout: 15000 });
    
    // Check for images
    const images = page.locator('img');
    const imageCount = await images.count();
    
    if (imageCount > 0) {
      const startTime = Date.now();
      
      // Wait for images to load
      await page.waitForFunction(() => {
        const imgs = document.querySelectorAll('img');
        return Array.from(imgs).every(img => img.complete);
      }, { timeout: 30000 });
      
      const imageLoadTime = Date.now() - startTime;
      
      // Images should load within reasonable time
      expect(imageLoadTime).toBeLessThan(30000);
      
      // Check image sizes for optimization
      for (let i = 0; i < Math.min(imageCount, 5); i++) {
        const img = images.nth(i);
        const imgSrc = await img.getAttribute('src');
        
        if (imgSrc) {
          const response = await page.request.head(imgSrc);
          const contentLength = response.headers()['content-length'];
          
          if (contentLength) {
            const sizeKB = parseInt(contentLength) / 1024;
            // Images should be reasonably sized (under 500KB)
            expect(sizeKB).toBeLessThan(500);
          }
        }
      }
    }
  });

  test('should handle responsive image loading', async ({ page }) => {
    const viewports = [
      { width: 375, height: 667 },
      { width: 768, height: 1024 },
      { width: 1200, height: 800 }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.goto('/architecture');
      
      const startTime = Date.now();
      
      // Wait for images to load
      await page.waitForSelector('img', { timeout: 10000 });
      
      const images = page.locator('img');
      const imageCount = await images.count();
      
      if (imageCount > 0) {
        // Wait for images to complete loading
        await page.waitForFunction(() => {
          const imgs = document.querySelectorAll('img');
          return Array.from(imgs).slice(0, 3).every(img => img.complete);
        }, { timeout: 15000 });
        
        const loadTime = Date.now() - startTime;
        
        // Images should load quickly on all viewports
        expect(loadTime).toBeLessThan(15000);
      }
    }
  });

  test('should handle concurrent user interactions', async ({ page }) => {
    await page.goto('/architecture');
    
    // Wait for initial load
    await page.waitForSelector('[data-testid="architecture-item"]', { timeout: 15000 });
    
    // Simulate concurrent interactions
    const startTime = Date.now();
    
    // Start multiple actions simultaneously
    const actions = [
      // Search action
      (async () => {
        const searchInput = page.locator('[data-testid="search-input"], input[type="search"]');
        if (await searchInput.count() > 0) {
          await searchInput.first().fill('Tokyo');
          await searchInput.first().press('Enter');
        }
      })(),
      
      // Navigation action
      (async () => {
        const navLink = page.getByRole('link', { name: /map/i });
        if (await navLink.count() > 0) {
          await navLink.first().click();
        }
      })(),
      
      // Filter action
      (async () => {
        const filterSelect = page.locator('select');
        if (await filterSelect.count() > 0) {
          await filterSelect.first().selectOption({ index: 1 });
        }
      })()
    ];
    
    // Wait for all actions to complete
    await Promise.all(actions);
    
    const totalTime = Date.now() - startTime;
    
    // Concurrent actions should complete within reasonable time
    expect(totalTime).toBeLessThan(10000);
    
    // Page should still be responsive
    await page.waitForLoadState('networkidle');
    
    const finalState = await page.locator('body').isVisible();
    expect(finalState).toBeTruthy();
  });

  test('should handle memory usage efficiently', async ({ page }) => {
    await page.goto('/architecture');
    
    // Wait for initial load
    await page.waitForSelector('[data-testid="architecture-item"]', { timeout: 15000 });
    
    // Get initial memory usage
    const initialMemory = await page.evaluate(() => {
      return (performance as any).memory ? {
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
        jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
      } : null;
    });
    
    // Perform multiple operations
    const operations = [
      '/architecture',
      '/map',
      '/architects',
      '/'
    ];
    
    for (const route of operations) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
    }
    
    // Return to architecture page
    await page.goto('/architecture');
    await page.waitForSelector('[data-testid="architecture-item"]', { timeout: 15000 });
    
    // Get final memory usage
    const finalMemory = await page.evaluate(() => {
      return (performance as any).memory ? {
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
        jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
      } : null;
    });
    
    if (initialMemory && finalMemory) {
      // Memory usage should not increase dramatically
      const memoryIncrease = finalMemory.usedJSHeapSize - initialMemory.usedJSHeapSize;
      const memoryIncreasePercent = (memoryIncrease / initialMemory.usedJSHeapSize) * 100;
      
      // Memory increase should be reasonable (less than 50%)
      expect(memoryIncreasePercent).toBeLessThan(50);
    }
  });

  test('should handle bundle size optimization', async ({ page }) => {
    // Monitor resource loading
    const resources: Array<{ url: string; size: number; type: string }> = [];
    
    page.on('response', response => {
      const url = response.url();
      const headers = response.headers();
      const contentLength = headers['content-length'];
      
      if (contentLength) {
        const size = parseInt(contentLength);
        let type = 'other';
        
        if (url.includes('.js')) type = 'javascript';
        else if (url.includes('.css')) type = 'css';
        else if (url.includes('.woff') || url.includes('.ttf')) type = 'font';
        else if (url.includes('.png') || url.includes('.jpg') || url.includes('.svg')) type = 'image';
        
        resources.push({ url, size, type });
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check bundle sizes
    const jsResources = resources.filter(r => r.type === 'javascript');
    const cssResources = resources.filter(r => r.type === 'css');
    
    if (jsResources.length > 0) {
      const totalJSSize = jsResources.reduce((sum, r) => sum + r.size, 0);
      const totalJSSizeKB = totalJSSize / 1024;
      
      // JavaScript bundle should be reasonable size (under 1MB)
      expect(totalJSSizeKB).toBeLessThan(1024);
    }
    
    if (cssResources.length > 0) {
      const totalCSSSize = cssResources.reduce((sum, r) => sum + r.size, 0);
      const totalCSSSizeKB = totalCSSSize / 1024;
      
      // CSS bundle should be reasonable size (under 200KB)
      expect(totalCSSSizeKB).toBeLessThan(200);
    }
  });

  test('should handle caching effectively', async ({ page }) => {
    // First visit
    await page.goto('/architecture');
    await page.waitForSelector('[data-testid="architecture-item"]', { timeout: 15000 });
    
    // Get initial load time
    const firstVisitMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart
      };
    });
    
    // Reload page (should use cache)
    await page.reload();
    await page.waitForSelector('[data-testid="architecture-item"]', { timeout: 15000 });
    
    // Get cached load time
    const cachedVisitMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart
      };
    });
    
    // Cached visit should be faster (or at least not significantly slower)
    expect(cachedVisitMetrics.domContentLoaded).toBeLessThanOrEqual(firstVisitMetrics.domContentLoaded + 1000);
  });
});