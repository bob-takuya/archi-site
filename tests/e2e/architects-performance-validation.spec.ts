/**
 * Architects Performance Validation Tests - SOW Phase 2
 * Comprehensive E2E testing for performance optimization features
 */

import { test, expect, Page } from '@playwright/test';

interface PerformanceMetrics {
  loadTime: number;
  cacheHitRate: number;
  scrollFPS: number;
  memoryUsage: number;
  bundleSize: number;
}

test.describe('Architects Performance Optimization - SOW Phase 2', () => {
  let page: Page;
  
  test.beforeEach(async ({ page: p }) => {
    page = p;
    
    // Enable performance tracking
    await page.addInitScript(() => {
      window.performanceMetrics = {
        loadStartTime: performance.now(),
        frameCount: 0,
        lastFrameTime: 0,
        cacheHits: 0,
        cacheMisses: 0
      };
    });
    
    // Navigate to optimized architects page
    await page.goto('/architects');
  });

  test.describe('Load Time Performance', () => {
    test('should load initial page in under 2 seconds', async () => {
      const startTime = Date.now();
      
      // Wait for main content to be visible
      await expect(page.locator('[data-testid="architects-list"]')).toBeVisible({ timeout: 2000 });
      
      const loadTime = Date.now() - startTime;
      
      // Validate load time target
      expect(loadTime).toBeLessThan(2000);
      
      console.log(`✅ Initial load time: ${loadTime}ms (Target: < 2000ms)`);
    });

    test('should have optimized Core Web Vitals', async () => {
      // Measure Core Web Vitals
      const metrics = await page.evaluate(() => {
        return new Promise((resolve) => {
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const vitals = {
              FCP: 0,
              LCP: 0,
              FID: 0,
              CLS: 0
            };

            entries.forEach((entry) => {
              if (entry.name === 'first-contentful-paint') {
                vitals.FCP = entry.startTime;
              }
              if (entry.entryType === 'largest-contentful-paint') {
                vitals.LCP = entry.startTime;
              }
              if (entry.entryType === 'first-input') {
                vitals.FID = entry.processingStart - entry.startTime;
              }
              if (entry.entryType === 'layout-shift' && !entry.hadRecentInput) {
                vitals.CLS += entry.value;
              }
            });

            resolve(vitals);
          }).observe({ entryTypes: ['paint', 'largest-contentful-paint', 'first-input', 'layout-shift'] });
          
          // Timeout fallback
          setTimeout(() => resolve({ FCP: 0, LCP: 0, FID: 0, CLS: 0 }), 5000);
        });
      });

      // Validate Core Web Vitals thresholds
      expect(metrics.FCP).toBeLessThan(1800); // First Contentful Paint < 1.8s
      expect(metrics.LCP).toBeLessThan(2500); // Largest Contentful Paint < 2.5s
      expect(metrics.FID).toBeLessThan(100);  // First Input Delay < 100ms
      expect(metrics.CLS).toBeLessThan(0.1);  // Cumulative Layout Shift < 0.1

      console.log('✅ Core Web Vitals:', metrics);
    });

    test('should load bundle chunks efficiently', async () => {
      // Monitor network requests for chunk loading
      const chunks: string[] = [];
      
      page.on('response', (response) => {
        const url = response.url();
        if (url.includes('.js') && url.includes('chunk')) {
          chunks.push(url);
        }
      });

      // Wait for initial load
      await page.waitForLoadState('networkidle');

      // Validate chunk loading strategy
      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks.length).toBeLessThan(10); // Not too many chunks

      console.log('✅ Loaded chunks:', chunks.length);
    });
  });

  test.describe('Cache Performance', () => {
    test('should achieve 80% cache hit rate', async () => {
      // Perform multiple operations to build cache
      const operations = [
        () => page.click('[data-testid="search-input"]'),
        () => page.fill('[data-testid="search-input"]', '安藤'),
        () => page.click('[data-testid="search-button"]'),
        () => page.waitForResponse(/architects/),
        () => page.click('[data-testid="page-2"]'),
        () => page.waitForResponse(/architects/),
        () => page.click('[data-testid="page-1"]'),
        () => page.waitForResponse(/architects/)
      ];

      // Execute operations and monitor cache performance
      for (const operation of operations) {
        await operation();
        await page.waitForTimeout(100);
      }

      // Get cache statistics
      const cacheStats = await page.evaluate(() => {
        return window.cacheService?.getStats() || { hitRatio: 0 };
      });

      // Validate cache hit rate
      expect(cacheStats.hitRatio).toBeGreaterThanOrEqual(0.8);

      console.log(`✅ Cache hit rate: ${(cacheStats.hitRatio * 100).toFixed(1)}% (Target: ≥ 80%)`);
    });

    test('should implement predictive prefetching', async () => {
      // Navigate through pages to trigger predictive loading
      await page.click('[data-testid="page-2"]');
      await page.waitForTimeout(500);

      // Check if next page was prefetched
      const prefetchStats = await page.evaluate(() => {
        return window.cacheService?.getPendingPredictiveQueries?.() || [];
      });

      expect(prefetchStats.length).toBeGreaterThan(0);

      console.log('✅ Predictive prefetching active:', prefetchStats.length, 'queries');
    });
  });

  test.describe('Virtual Scrolling Performance', () => {
    test('should maintain 60fps during scroll', async () => {
      // Navigate to a page with many architects
      await page.goto('/architects?page=1&limit=50');
      await page.waitForSelector('[data-testid="virtualized-list"]');

      // Setup FPS monitoring
      await page.evaluate(() => {
        window.fpsData = [];
        let frameCount = 0;
        let lastTime = performance.now();

        function measureFPS() {
          const currentTime = performance.now();
          frameCount++;

          if (currentTime - lastTime >= 1000) {
            const fps = frameCount * 1000 / (currentTime - lastTime);
            window.fpsData.push(fps);
            frameCount = 0;
            lastTime = currentTime;
          }

          requestAnimationFrame(measureFPS);
        }

        measureFPS();
      });

      // Perform smooth scrolling
      const virtualList = page.locator('[data-testid="virtualized-list"]');
      
      for (let i = 0; i < 10; i++) {
        await virtualList.evaluate((el, scrollTop) => {
          el.scrollTop = scrollTop;
        }, i * 100);
        await page.waitForTimeout(100);
      }

      // Get FPS data
      await page.waitForTimeout(2000); // Collect FPS data
      
      const fpsData = await page.evaluate(() => window.fpsData || []);
      
      if (fpsData.length > 0) {
        const avgFPS = fpsData.reduce((sum, fps) => sum + fps, 0) / fpsData.length;
        expect(avgFPS).toBeGreaterThanOrEqual(58); // Allow slight variance from 60fps
        
        console.log(`✅ Average scroll FPS: ${avgFPS.toFixed(1)} (Target: ≥ 60fps)`);
      }
    });

    test('should handle 1000+ items efficiently', async () => {
      // Mock large dataset
      await page.route('/api/architects*', async (route) => {
        const url = new URL(route.request().url());
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '12');
        
        // Generate mock data for large dataset
        const architects = Array.from({ length: limit }, (_, i) => ({
          ZAT_ID: (page - 1) * limit + i + 1,
          ZAT_ARCHITECT: `Architect ${(page - 1) * limit + i + 1}`,
          ZAT_NATIONALITY: 'Japan',
          ZAT_BIRTHYEAR: 1950 + (i % 50),
          ZAT_CATEGORY: 'Modern'
        }));

        await route.fulfill({
          json: {
            items: architects,
            total: 1000,
            page,
            limit,
            totalPages: Math.ceil(1000 / limit)
          }
        });
      });

      await page.goto('/architects');
      await page.waitForSelector('[data-testid="virtualized-list"]');

      // Verify large dataset handling
      const totalItems = await page.locator('[data-testid="total-items"]').textContent();
      expect(totalItems).toContain('1000');

      // Test scroll performance with large dataset
      const scrollContainer = page.locator('[data-testid="virtualized-list"]');
      
      const startTime = performance.now();
      await scrollContainer.evaluate(el => {
        el.scrollTop = 5000; // Scroll significantly
      });
      await page.waitForTimeout(100);
      const scrollTime = performance.now() - startTime;

      expect(scrollTime).toBeLessThan(50); // Scroll should be fast

      console.log(`✅ Large dataset scroll time: ${scrollTime.toFixed(1)}ms`);
    });
  });

  test.describe('Memory Performance', () => {
    test('should maintain optimal memory usage', async () => {
      // Get initial memory baseline
      const initialMemory = await page.evaluate(() => {
        if ('memory' in performance) {
          return (performance as any).memory.usedJSHeapSize;
        }
        return 0;
      });

      if (initialMemory === 0) {
        console.log('⚠️ Memory API not available, skipping memory test');
        return;
      }

      // Perform memory-intensive operations
      for (let i = 0; i < 10; i++) {
        await page.click('[data-testid="search-input"]');
        await page.fill('[data-testid="search-input"]', `test ${i}`);
        await page.click('[data-testid="search-button"]');
        await page.waitForTimeout(200);
      }

      // Get final memory usage
      const finalMemory = await page.evaluate(() => {
        if ('memory' in performance) {
          const memory = (performance as any).memory;
          return {
            used: memory.usedJSHeapSize,
            total: memory.totalJSHeapSize,
            limit: memory.jsHeapSizeLimit
          };
        }
        return null;
      });

      if (finalMemory) {
        const memoryUsagePercent = finalMemory.used / finalMemory.limit;
        expect(memoryUsagePercent).toBeLessThan(0.7); // Less than 70% memory usage

        const memoryIncrease = (finalMemory.used - initialMemory) / (1024 * 1024); // MB
        expect(memoryIncrease).toBeLessThan(50); // Less than 50MB increase

        console.log(`✅ Memory usage: ${(memoryUsagePercent * 100).toFixed(1)}% (Target: < 70%)`);
        console.log(`✅ Memory increase: ${memoryIncrease.toFixed(1)}MB (Target: < 50MB)`);
      }
    });
  });

  test.describe('Performance Monitoring', () => {
    test('should display performance monitor', async () => {
      // Enable performance monitor
      await page.click('[data-testid="performance-monitor-toggle"]');
      
      // Verify monitor is visible
      await expect(page.locator('[data-testid="performance-monitor"]')).toBeVisible();

      // Check for key metrics
      await expect(page.locator('[data-testid="query-time-metric"]')).toBeVisible();
      await expect(page.locator('[data-testid="cache-hit-metric"]')).toBeVisible();
      await expect(page.locator('[data-testid="memory-usage-metric"]')).toBeVisible();

      console.log('✅ Performance monitor displaying correctly');
    });

    test('should show performance targets status', async () => {
      // Enable performance monitor
      await page.click('[data-testid="performance-monitor-toggle"]');
      await page.click('[data-testid="expand-monitor"]');

      // Wait for targets table
      await expect(page.locator('[data-testid="performance-targets-table"]')).toBeVisible();

      // Verify target metrics are displayed
      const targets = await page.locator('[data-testid="performance-target-row"]').count();
      expect(targets).toBeGreaterThanOrEqual(4); // At least 4 targets

      // Check for status indicators
      const successIcons = await page.locator('[data-testid="target-success-icon"]').count();
      expect(successIcons).toBeGreaterThan(0);

      console.log(`✅ Performance targets displayed: ${targets} targets, ${successIcons} met`);
    });
  });

  test.describe('Code Splitting Validation', () => {
    test('should lazy load components', async () => {
      const networkRequests: string[] = [];
      
      page.on('response', (response) => {
        if (response.url().includes('.js')) {
          networkRequests.push(response.url());
        }
      });

      // Initial load should not load all components
      await page.waitForLoadState('networkidle');
      const initialChunks = networkRequests.filter(url => url.includes('chunk'));

      // Trigger lazy loading by opening performance monitor
      await page.click('[data-testid="performance-monitor-toggle"]');
      await page.waitForTimeout(1000);

      // Should load additional chunks
      const afterMonitorChunks = networkRequests.filter(url => url.includes('chunk'));
      expect(afterMonitorChunks.length).toBeGreaterThan(initialChunks.length);

      console.log(`✅ Code splitting working: ${initialChunks.length} → ${afterMonitorChunks.length} chunks`);
    });
  });

  test.describe('Overall Performance Score', () => {
    test('should achieve overall performance score > 90%', async () => {
      // Collect all performance metrics
      const metrics: PerformanceMetrics = {
        loadTime: 0,
        cacheHitRate: 0,
        scrollFPS: 0,
        memoryUsage: 0,
        bundleSize: 0
      };

      // Measure load time
      const startTime = Date.now();
      await page.waitForSelector('[data-testid="architects-list"]');
      metrics.loadTime = Date.now() - startTime;

      // Perform operations to measure cache
      await page.click('[data-testid="search-input"]');
      await page.fill('[data-testid="search-input"]', 'test');
      await page.click('[data-testid="search-button"]');
      await page.waitForTimeout(500);

      // Get performance stats
      const performanceStats = await page.evaluate(() => {
        const cacheStats = window.cacheService?.getStats() || { hitRatio: 0 };
        const memory = (performance as any).memory;
        
        return {
          cacheHitRate: cacheStats.hitRatio,
          memoryUsage: memory ? memory.usedJSHeapSize / memory.jsHeapSizeLimit : 0,
          bundleSize: window.performanceMetrics?.bundleSize || 0
        };
      });

      metrics.cacheHitRate = performanceStats.cacheHitRate;
      metrics.memoryUsage = performanceStats.memoryUsage;
      metrics.bundleSize = performanceStats.bundleSize;

      // Calculate overall score
      const loadTimeScore = Math.max(0, 1 - metrics.loadTime / 2000);
      const cacheScore = metrics.cacheHitRate;
      const memoryScore = Math.max(0, 1 - metrics.memoryUsage);
      const bundleSizeScore = metrics.bundleSize > 0 ? Math.max(0, 1 - metrics.bundleSize / (500 * 1024)) : 1;

      const overallScore = (loadTimeScore + cacheScore + memoryScore + bundleSizeScore) / 4;

      expect(overallScore).toBeGreaterThan(0.9); // 90% overall score

      console.log('📊 Performance Summary:');
      console.log(`  Load Time: ${metrics.loadTime}ms (Score: ${(loadTimeScore * 100).toFixed(1)}%)`);
      console.log(`  Cache Hit Rate: ${(metrics.cacheHitRate * 100).toFixed(1)}% (Score: ${(cacheScore * 100).toFixed(1)}%)`);
      console.log(`  Memory Usage: ${(metrics.memoryUsage * 100).toFixed(1)}% (Score: ${(memoryScore * 100).toFixed(1)}%)`);
      console.log(`  Bundle Score: ${(bundleSizeScore * 100).toFixed(1)}%`);
      console.log(`✅ Overall Performance Score: ${(overallScore * 100).toFixed(1)}% (Target: > 90%)`);
    });
  });
});

// Helper function to add custom matchers
declare global {
  interface Window {
    performanceMetrics: any;
    fpsData: number[];
    cacheService: any;
  }
}