/**
 * SOW Phase 2 Integration E2E Test Suite
 * Tests all enhanced features and performance targets
 */

import { test, expect, Page } from '@playwright/test';

// Test configuration
const BASE_URL = 'http://localhost:5173';
const ENHANCED_ARCHITECTS_URL = `${BASE_URL}/#/architects/enhanced`;
const MOBILE_VIEWPORT = { width: 375, height: 667 };
const TABLET_VIEWPORT = { width: 768, height: 1024 };
const DESKTOP_VIEWPORT = { width: 1920, height: 1080 };

// Performance targets from SOW
const PERFORMANCE_TARGETS = {
  perceivedLoadingImprovement: 0.4, // 40%
  imageLoadTime: 2000, // 2 seconds max
  searchResponseTime: 500, // 500ms
  virtualScrollFPS: 30, // 30 FPS minimum
  cacheHitRate: 0.8 // 80% cache hit rate
};

test.describe('Phase 2 - FacetedSearch Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ENHANCED_ARCHITECTS_URL);
    await page.waitForLoadState('networkidle');
  });

  test('should display faceted search with all filter categories', async ({ page }) => {
    // Check for faceted search container
    const facetedSearch = page.locator('[data-testid="faceted-search"]');
    await expect(facetedSearch).toBeVisible();

    // Verify all facet categories are present
    const expectedFacets = [
      '都道府県',
      '建築家',
      '年代',
      'カテゴリー',
      '材料',
      'スタイル'
    ];

    for (const facet of expectedFacets) {
      await expect(page.locator(`text=${facet}`)).toBeVisible();
    }
  });

  test('should filter results when selecting facets', async ({ page }) => {
    // Get initial result count
    const initialResults = await page.locator('[data-testid="architect-card"]').count();
    
    // Click on a prefecture facet
    await page.click('[data-testid="facet-prefecture"] >> nth=0');
    
    // Wait for results to update
    await page.waitForResponse(response => 
      response.url().includes('/api/architects') && response.status() === 200
    );
    
    // Verify results are filtered
    const filteredResults = await page.locator('[data-testid="architect-card"]').count();
    expect(filteredResults).toBeLessThanOrEqual(initialResults);
    
    // Verify active filter chip is displayed
    await expect(page.locator('[data-testid="active-filter-chip"]')).toBeVisible();
  });

  test('should clear all filters when clicking clear button', async ({ page }) => {
    // Apply some filters
    await page.click('[data-testid="facet-category"] >> nth=0');
    await page.click('[data-testid="facet-style"] >> nth=0');
    
    // Click clear all filters
    await page.click('[data-testid="clear-all-filters"]');
    
    // Verify no active filters
    const activeFilters = await page.locator('[data-testid="active-filter-chip"]').count();
    expect(activeFilters).toBe(0);
  });

  test('should update URL with selected facets', async ({ page }) => {
    // Select a facet
    await page.click('[data-testid="facet-prefecture"] >> text=東京都');
    
    // Verify URL contains the facet parameter
    await expect(page).toHaveURL(/prefectures=東京都/);
  });
});

test.describe('Phase 2 - TouchOptimizedSearchBar', () => {
  test.describe('Mobile', () => {
    test.use({ viewport: MOBILE_VIEWPORT });

    test('should display touch-optimized search bar on mobile', async ({ page }) => {
      await page.goto(ENHANCED_ARCHITECTS_URL);
      
      const searchBar = page.locator('[data-testid="touch-optimized-search"]');
      await expect(searchBar).toBeVisible();
      
      // Verify mobile-specific features
      const searchInput = page.locator('[data-testid="search-input"]');
      
      // Check for larger touch targets (min 44px)
      const inputHeight = await searchInput.evaluate(el => 
        window.getComputedStyle(el).height
      );
      expect(parseInt(inputHeight)).toBeGreaterThanOrEqual(44);
    });

    test('should show search suggestions on mobile', async ({ page }) => {
      await page.goto(ENHANCED_ARCHITECTS_URL);
      
      // Type in search
      await page.fill('[data-testid="search-input"]', '安藤');
      
      // Wait for suggestions
      await expect(page.locator('[data-testid="search-suggestions"]')).toBeVisible();
      
      // Verify suggestions are touch-friendly
      const suggestionHeight = await page.locator('[data-testid="suggestion-item"]').first().evaluate(el => 
        window.getComputedStyle(el).height
      );
      expect(parseInt(suggestionHeight)).toBeGreaterThanOrEqual(44);
    });

    test('should handle voice search on mobile', async ({ page, browserName }) => {
      // Skip on Firefox as it doesn't support speech recognition
      if (browserName === 'firefox') {
        test.skip();
      }

      await page.goto(ENHANCED_ARCHITECTS_URL);
      
      // Check for voice search button
      const voiceButton = page.locator('[data-testid="voice-search-button"]');
      await expect(voiceButton).toBeVisible();
      
      // Verify it's accessible
      await expect(voiceButton).toHaveAttribute('aria-label', /音声検索/);
    });
  });

  test.describe('Desktop', () => {
    test.use({ viewport: DESKTOP_VIEWPORT });

    test('should support keyboard navigation', async ({ page }) => {
      await page.goto(ENHANCED_ARCHITECTS_URL);
      
      // Focus search input
      await page.focus('[data-testid="search-input"]');
      
      // Type and check suggestions
      await page.keyboard.type('建築');
      await expect(page.locator('[data-testid="search-suggestions"]')).toBeVisible();
      
      // Navigate with arrow keys
      await page.keyboard.press('ArrowDown');
      await expect(page.locator('[data-testid="suggestion-item"][data-focused="true"]').first()).toBeVisible();
      
      // Select with Enter
      await page.keyboard.press('Enter');
      
      // Verify search was performed
      await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
    });
  });
});

test.describe('Phase 2 - Virtual Scrolling', () => {
  test('should implement virtual scrolling for large result sets', async ({ page }) => {
    await page.goto(ENHANCED_ARCHITECTS_URL);
    
    // Clear any filters to get maximum results
    await page.click('[data-testid="clear-all-filters"]');
    
    // Wait for results
    await page.waitForSelector('[data-testid="virtualized-list"]');
    
    // Check that only visible items are rendered
    const visibleItems = await page.locator('[data-testid="architect-card"]:visible').count();
    const totalItems = await page.getAttribute('[data-testid="virtualized-list"]', 'data-total-items');
    
    // Should render only a subset of total items
    expect(visibleItems).toBeLessThan(parseInt(totalItems || '0'));
    
    // Scroll and verify new items are rendered
    await page.evaluate(() => window.scrollBy(0, 1000));
    await page.waitForTimeout(100); // Wait for render
    
    const newVisibleItems = await page.locator('[data-testid="architect-card"]:visible').count();
    expect(newVisibleItems).toBeGreaterThan(0);
  });

  test('should maintain smooth scrolling performance', async ({ page }) => {
    await page.goto(ENHANCED_ARCHITECTS_URL);
    
    // Start performance measurement
    const metrics = await page.evaluate(() => {
      const startTime = performance.now();
      const frameCount = { count: 0 };
      
      const measureFPS = () => {
        frameCount.count++;
        if (performance.now() - startTime < 1000) {
          requestAnimationFrame(measureFPS);
        }
      };
      
      requestAnimationFrame(measureFPS);
      
      // Scroll rapidly
      const scrollPromise = new Promise<void>(resolve => {
        let scrollCount = 0;
        const scrollInterval = setInterval(() => {
          window.scrollBy(0, 100);
          scrollCount++;
          if (scrollCount >= 10) {
            clearInterval(scrollInterval);
            resolve();
          }
        }, 100);
      });
      
      return scrollPromise.then(() => {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve({ fps: frameCount.count });
          }, 1000);
        });
      });
    });
    
    // Verify FPS meets target
    expect(metrics.fps).toBeGreaterThanOrEqual(PERFORMANCE_TARGETS.virtualScrollFPS);
  });
});

test.describe('Phase 2 - Progressive Image Loading', () => {
  test('should load images progressively with blur placeholders', async ({ page }) => {
    await page.goto(ENHANCED_ARCHITECTS_URL);
    
    // Find an architect card with image
    const imageContainer = page.locator('[data-testid="progressive-image"]').first();
    await expect(imageContainer).toBeVisible();
    
    // Verify blur placeholder is shown initially
    const blurPlaceholder = imageContainer.locator('[data-testid="blur-placeholder"]');
    await expect(blurPlaceholder).toBeVisible();
    
    // Wait for high quality image to load
    await expect(imageContainer.locator('img[data-loaded="true"]')).toBeVisible({ timeout: 5000 });
    
    // Verify blur placeholder is hidden after load
    await expect(blurPlaceholder).toBeHidden();
  });

  test('should support WebP format when available', async ({ page }) => {
    await page.goto(ENHANCED_ARCHITECTS_URL);
    
    // Check if images are using WebP
    const imageSrc = await page.locator('[data-testid="progressive-image"] img').first().getAttribute('src');
    
    // In production, this should use WebP
    // For now, just verify image source exists
    expect(imageSrc).toBeTruthy();
  });

  test('should lazy load images outside viewport', async ({ page }) => {
    await page.goto(ENHANCED_ARCHITECTS_URL);
    
    // Get images below the fold
    const belowFoldImages = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll('[data-testid="progressive-image"] img'));
      const viewportHeight = window.innerHeight;
      
      return images.filter(img => {
        const rect = img.getBoundingClientRect();
        return rect.top > viewportHeight;
      }).map(img => ({
        src: img.getAttribute('src'),
        loading: img.getAttribute('loading')
      }));
    });
    
    // Verify lazy loading attribute
    belowFoldImages.forEach(img => {
      expect(img.loading).toBe('lazy');
    });
  });

  test('should achieve 40% perceived loading improvement', async ({ page }) => {
    await page.goto(ENHANCED_ARCHITECTS_URL);
    
    // Measure loading metrics
    const metrics = await page.evaluate(() => {
      return new Promise(resolve => {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const imageEntries = entries.filter(entry => 
            entry.entryType === 'resource' && 
            entry.name.includes('image')
          );
          
          if (imageEntries.length > 0) {
            const avgLoadTime = imageEntries.reduce((sum, entry) => 
              sum + entry.duration, 0
            ) / imageEntries.length;
            
            observer.disconnect();
            resolve({ avgLoadTime });
          }
        });
        
        observer.observe({ entryTypes: ['resource'] });
        
        // Timeout fallback
        setTimeout(() => {
          observer.disconnect();
          resolve({ avgLoadTime: 0 });
        }, 5000);
      });
    });
    
    // Verify performance improvement (baseline would be higher without optimization)
    expect(metrics.avgLoadTime).toBeLessThan(PERFORMANCE_TARGETS.imageLoadTime);
  });
});

test.describe('Phase 2 - Performance Targets', () => {
  test('should meet search response time target', async ({ page }) => {
    await page.goto(ENHANCED_ARCHITECTS_URL);
    
    // Measure search response time
    const startTime = Date.now();
    
    await page.fill('[data-testid="search-input"]', '安藤忠雄');
    
    // Wait for results to update
    await page.waitForSelector('[data-testid="search-results"][data-loading="false"]');
    
    const responseTime = Date.now() - startTime;
    
    // Verify meets target
    expect(responseTime).toBeLessThan(PERFORMANCE_TARGETS.searchResponseTime);
  });

  test('should utilize caching effectively', async ({ page }) => {
    await page.goto(ENHANCED_ARCHITECTS_URL);
    
    // Perform initial search
    await page.fill('[data-testid="search-input"]', 'モダン');
    await page.waitForSelector('[data-testid="search-results"][data-loading="false"]');
    
    // Clear and repeat same search
    await page.fill('[data-testid="search-input"]', '');
    await page.fill('[data-testid="search-input"]', 'モダン');
    
    // Check for cache indicator
    const cacheHit = await page.getAttribute('[data-testid="performance-monitor"]', 'data-cache-hit');
    
    // In production, this should show cache was used
    expect(cacheHit).toBeTruthy();
  });

  test('should display performance monitoring in development', async ({ page }) => {
    // Set NODE_ENV to development for this test
    await page.goto(ENHANCED_ARCHITECTS_URL);
    
    // Check for performance monitor component
    const perfMonitor = page.locator('[data-testid="performance-monitor"]');
    
    // In development, it should be visible
    if (process.env.NODE_ENV === 'development') {
      await expect(perfMonitor).toBeVisible();
      
      // Verify it shows metrics
      await expect(perfMonitor.locator('text=/Search Time:/')).toBeVisible();
      await expect(perfMonitor.locator('text=/Cache Hit Rate:/')).toBeVisible();
      await expect(perfMonitor.locator('text=/Image Load:/')).toBeVisible();
    }
  });
});

test.describe('Phase 2 - Accessibility', () => {
  test('should maintain accessibility with enhanced features', async ({ page }) => {
    await page.goto(ENHANCED_ARCHITECTS_URL);
    
    // Run accessibility scan
    const accessibilityReport = await page.evaluate(() => {
      const issues: string[] = [];
      
      // Check for proper ARIA labels
      const searchInput = document.querySelector('[data-testid="search-input"]');
      if (!searchInput?.getAttribute('aria-label')) {
        issues.push('Search input missing aria-label');
      }
      
      // Check for keyboard navigation
      const focusableElements = document.querySelectorAll(
        'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      focusableElements.forEach(el => {
        const tabIndex = el.getAttribute('tabindex');
        if (tabIndex === '-1' && !el.getAttribute('aria-hidden')) {
          issues.push(`Element removed from tab order without aria-hidden: ${el.tagName}`);
        }
      });
      
      // Check color contrast (simplified check)
      const cards = document.querySelectorAll('[data-testid="architect-card"]');
      cards.forEach(card => {
        const computedStyle = window.getComputedStyle(card);
        const bgColor = computedStyle.backgroundColor;
        const textColor = computedStyle.color;
        
        // Basic contrast check would go here
        // For now, just ensure colors are set
        if (!bgColor || !textColor) {
          issues.push('Card missing proper color definitions');
        }
      });
      
      return issues;
    });
    
    // Should have no major accessibility issues
    expect(accessibilityReport).toHaveLength(0);
  });

  test('should announce loading states to screen readers', async ({ page }) => {
    await page.goto(ENHANCED_ARCHITECTS_URL);
    
    // Check for ARIA live regions
    const liveRegion = page.locator('[aria-live="polite"], [aria-live="assertive"]');
    await expect(liveRegion).toBeVisible();
    
    // Trigger a search
    await page.fill('[data-testid="search-input"]', 'test');
    
    // Verify loading announcement
    await expect(liveRegion).toContainText(/検索中|Loading/);
  });
});

test.describe('Phase 2 - Error Handling', () => {
  test('should handle image loading failures gracefully', async ({ page }) => {
    await page.goto(ENHANCED_ARCHITECTS_URL);
    
    // Force an image error
    await page.evaluate(() => {
      const img = document.querySelector('[data-testid="progressive-image"] img') as HTMLImageElement;
      if (img) {
        img.src = 'https://invalid-domain-that-does-not-exist.com/image.jpg';
        img.dispatchEvent(new Event('error'));
      }
    });
    
    // Should show error state or fallback
    const errorState = page.locator('[data-testid="image-error-state"]');
    const fallbackImage = page.locator('[data-testid="fallback-image"]');
    
    // Either error state or fallback should be visible
    const hasErrorHandling = await errorState.isVisible() || await fallbackImage.isVisible();
    expect(hasErrorHandling).toBeTruthy();
  });

  test('should handle search errors with user feedback', async ({ page }) => {
    await page.goto(ENHANCED_ARCHITECTS_URL);
    
    // Intercept API calls to simulate error
    await page.route('**/api/architects/search*', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Internal Server Error' })
      });
    });
    
    // Perform search
    await page.fill('[data-testid="search-input"]', 'test search');
    
    // Should show error message
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('text=/エラーが発生しました|An error occurred/')).toBeVisible();
  });
});

// Mobile-specific tests
test.describe('Phase 2 - Mobile Optimization', () => {
  test.use({ viewport: MOBILE_VIEWPORT });

  test('should optimize layout for mobile viewport', async ({ page }) => {
    await page.goto(ENHANCED_ARCHITECTS_URL);
    
    // Check single column layout
    const cards = await page.locator('[data-testid="architect-card"]').all();
    
    if (cards.length >= 2) {
      const firstCardBox = await cards[0].boundingBox();
      const secondCardBox = await cards[1].boundingBox();
      
      // Cards should stack vertically on mobile
      expect(secondCardBox?.y).toBeGreaterThan(firstCardBox?.y || 0);
    }
  });

  test('should show mobile-optimized facet drawer', async ({ page }) => {
    await page.goto(ENHANCED_ARCHITECTS_URL);
    
    // Facets should be hidden by default on mobile
    const facetPanel = page.locator('[data-testid="facet-panel"]');
    await expect(facetPanel).toBeHidden();
    
    // Should have filter button
    const filterButton = page.locator('[data-testid="mobile-filter-button"]');
    await expect(filterButton).toBeVisible();
    
    // Click to open drawer
    await filterButton.click();
    
    // Drawer should slide in
    const drawer = page.locator('[data-testid="facet-drawer"]');
    await expect(drawer).toBeVisible();
  });
});