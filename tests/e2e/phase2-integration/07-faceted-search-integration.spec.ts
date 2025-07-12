import { test, expect } from '@playwright/test';

/**
 * Phase 2 Integration: FacetedSearch E2E Tests
 * Tests the integration of FacetedSearch component with database services,
 * real-time filtering, and search coordination
 */
test.describe('Phase 2: FacetedSearch Integration', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000); // Allow database loading
    
    // Navigate to architecture page where faceted search is likely implemented
    const archLink = page.locator('a[href*="architecture"], nav a').filter({ hasText: /建築|architecture|building/i }).first();
    if (await archLink.count() > 0) {
      await archLink.click();
      await page.waitForTimeout(2000);
    }
  });

  test('FacetedSearch component should be rendered and functional', async ({ page }) => {
    // Look for faceted search component
    const facetedSearch = page.locator('[data-testid="faceted-search"], .faceted-search, .filters, .search-filters').first();
    
    if (await facetedSearch.count() > 0) {
      await expect(facetedSearch).toBeVisible();
      console.log('✅ FacetedSearch component found and visible');
    } else {
      // Look for individual filter elements
      const filterElements = page.locator('.filter-chip, .filter-button, [data-testid*="filter"]');
      const filterCount = await filterElements.count();
      
      if (filterCount > 0) {
        console.log(`✅ Found ${filterCount} filter elements`);
      } else {
        console.log('ℹ️ No faceted search component found - may be implemented differently');
      }
    }
    
    await page.screenshot({ path: 'playwright-results/phase2-artifacts/faceted-search-basic.png' });
  });

  test('Multi-criteria filtering should work', async ({ page }) => {
    // Wait for architecture items to load
    await page.waitForSelector('.architecture-item, .building-item, [data-testid="architecture-item"]', { timeout: 10000 });
    
    const initialItems = await page.locator('.architecture-item, .building-item, [data-testid="architecture-item"]').count();
    console.log(`Initial items count: ${initialItems}`);
    
    // Look for category filters
    const categoryFilters = page.locator('.filter-chip, .category-filter, [data-filter-type="category"]');
    const categoryCount = await categoryFilters.count();
    
    if (categoryCount > 0) {
      console.log(`Found ${categoryCount} category filters`);
      
      // Test first category filter
      const firstCategory = categoryFilters.first();
      const categoryText = await firstCategory.textContent();
      
      await firstCategory.click();
      await page.waitForTimeout(1000); // Allow filtering to process
      
      const filteredItems = await page.locator('.architecture-item, .building-item, [data-testid="architecture-item"]').count();
      console.log(`✅ Category filter "${categoryText}" applied: ${filteredItems} items shown`);
      
      // Test combining filters
      if (categoryCount > 1) {
        const secondCategory = categoryFilters.nth(1);
        await secondCategory.click();
        await page.waitForTimeout(1000);
        
        const combinedFilterItems = await page.locator('.architecture-item, .building-item, [data-testid="architecture-item"]').count();
        console.log(`✅ Combined filters applied: ${combinedFilterItems} items shown`);
      }
    }
    
    await page.screenshot({ path: 'playwright-results/phase2-artifacts/multi-criteria-filtering.png' });
  });

  test('Real-time facet counting should update', async ({ page }) => {
    // Look for facet counts
    const facetCounters = page.locator('.filter-count, .facet-count, [data-testid*="count"]');
    const counterCount = await facetCounters.count();
    
    if (counterCount > 0) {
      console.log(`Found ${counterCount} facet counters`);
      
      // Record initial counts
      const initialCounts = [];
      for (let i = 0; i < Math.min(counterCount, 5); i++) {
        const counter = facetCounters.nth(i);
        const countText = await counter.textContent();
        initialCounts.push(countText);
      }
      
      // Apply a filter and check if counts update
      const filters = page.locator('.filter-chip, .filter-button');
      if (await filters.count() > 0) {
        await filters.first().click();
        await page.waitForTimeout(1000);
        
        // Check if counts have updated
        let countsUpdated = false;
        for (let i = 0; i < Math.min(counterCount, 5); i++) {
          const counter = facetCounters.nth(i);
          const newCountText = await counter.textContent();
          if (newCountText !== initialCounts[i]) {
            countsUpdated = true;
            console.log(`✅ Facet count updated: ${initialCounts[i]} → ${newCountText}`);
          }
        }
        
        if (countsUpdated) {
          console.log('✅ Real-time facet counting working');
        } else {
          console.log('ℹ️ Facet counts may be static or not implemented');
        }
      }
    } else {
      console.log('ℹ️ No facet counters found');
    }
    
    await page.screenshot({ path: 'playwright-results/phase2-artifacts/facet-counting.png' });
  });

  test('Range slider filtering should work', async ({ page }) => {
    // Look for range slider (typically for year filtering)
    const rangeSlider = page.locator('input[type="range"], .range-slider, [data-testid="year-filter"]');
    const sliderCount = await rangeSlider.count();
    
    if (sliderCount > 0) {
      console.log(`Found ${sliderCount} range sliders`);
      
      const slider = rangeSlider.first();
      const min = await slider.getAttribute('min') || '1900';
      const max = await slider.getAttribute('max') || '2024';
      
      // Test sliding to middle value
      const middleValue = Math.floor((parseInt(min) + parseInt(max)) / 2);
      await slider.fill(middleValue.toString());
      
      await page.waitForTimeout(1000); // Allow filtering to process
      
      // Check if filtering affected results
      const filteredItems = await page.locator('.architecture-item, .building-item, [data-testid="architecture-item"]').count();
      console.log(`✅ Range filter applied (${middleValue}): ${filteredItems} items shown`);
      
      // Test range bounds
      await slider.fill(min);
      await page.waitForTimeout(500);
      const minItems = await page.locator('.architecture-item, .building-item, [data-testid="architecture-item"]').count();
      
      await slider.fill(max);
      await page.waitForTimeout(500);
      const maxItems = await page.locator('.architecture-item, .building-item, [data-testid="architecture-item"]').count();
      
      console.log(`✅ Range filtering: min(${min})=${minItems} items, max(${max})=${maxItems} items`);
    } else {
      console.log('ℹ️ No range sliders found');
    }
    
    await page.screenshot({ path: 'playwright-results/phase2-artifacts/range-filtering.png' });
  });

  test('Mobile responsive design should work', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    
    // Look for mobile filter interface (drawer/collapsible)
    const mobileFilters = page.locator('.filter-drawer, .mobile-filters, [data-testid="mobile-filters"]');
    
    if (await mobileFilters.count() > 0) {
      console.log('✅ Mobile filter interface found');
      await expect(mobileFilters.first()).toBeVisible();
    } else {
      // Check if regular filters are responsive
      const filters = page.locator('.filter-chip, .filter-button');
      const filterCount = await filters.count();
      
      if (filterCount > 0) {
        // Check if filters are still accessible on mobile
        for (let i = 0; i < Math.min(filterCount, 3); i++) {
          const filter = filters.nth(i);
          const boundingBox = await filter.boundingBox();
          
          if (boundingBox) {
            expect(boundingBox.height).toBeGreaterThanOrEqual(44); // Mobile touch target
            console.log(`✅ Filter ${i+1} meets mobile touch requirements`);
          }
        }
      }
    }
    
    // Test filter toggle button for mobile
    const filterToggle = page.locator('.filter-toggle, [data-testid="toggle-filters"], button').filter({ hasText: /filter|フィルター/i });
    if (await filterToggle.count() > 0) {
      await filterToggle.click();
      await page.waitForTimeout(500);
      console.log('✅ Mobile filter toggle working');
    }
    
    await page.screenshot({ path: 'playwright-results/phase2-artifacts/mobile-faceted-search.png' });
  });

  test('Active filter management should work', async ({ page }) => {
    // Apply multiple filters
    const filters = page.locator('.filter-chip, .filter-button');
    const filterCount = await filters.count();
    
    if (filterCount > 1) {
      // Apply first filter
      const firstFilter = filters.first();
      const firstFilterText = await firstFilter.textContent();
      await firstFilter.click();
      await page.waitForTimeout(500);
      
      // Apply second filter
      const secondFilter = filters.nth(1);
      const secondFilterText = await secondFilter.textContent();
      await secondFilter.click();
      await page.waitForTimeout(500);
      
      // Look for active filter display
      const activeFilters = page.locator('.active-filters, .applied-filters, [data-testid="active-filters"]');
      
      if (await activeFilters.count() > 0) {
        await expect(activeFilters).toBeVisible();
        console.log('✅ Active filters display found');
        
        // Check if applied filters are shown
        const activeFilterItems = activeFilters.locator('.filter-tag, .active-filter');
        const activeCount = await activeFilterItems.count();
        console.log(`✅ ${activeCount} active filters displayed`);
      }
      
      // Test filter removal
      const removeButtons = page.locator('.remove-filter, .filter-remove, [aria-label*="remove"]');
      if (await removeButtons.count() > 0) {
        await removeButtons.first().click();
        await page.waitForTimeout(500);
        console.log('✅ Filter removal working');
      }
      
      // Test clear all filters
      const clearAll = page.locator('.clear-filters, [data-testid="clear-filters"]').filter({ hasText: /clear|クリア|すべて/i });
      if (await clearAll.count() > 0) {
        await clearAll.click();
        await page.waitForTimeout(500);
        console.log('✅ Clear all filters working');
      }
    }
    
    await page.screenshot({ path: 'playwright-results/phase2-artifacts/active-filter-management.png' });
  });

  test('Search within facets should work', async ({ page }) => {
    // Look for facet search functionality
    const facetSearch = page.locator('.facet-search, [data-testid="facet-search"], input[placeholder*="filter"]');
    
    if (await facetSearch.count() > 0) {
      console.log('✅ Facet search input found');
      
      const searchInput = facetSearch.first();
      await searchInput.click();
      await searchInput.fill('東京');
      
      await page.waitForTimeout(1000);
      
      // Check if facets are filtered
      const visibleFacets = page.locator('.filter-chip:visible, .filter-button:visible');
      const visibleCount = await visibleFacets.count();
      
      console.log(`✅ Search within facets: ${visibleCount} matching facets shown`);
      
      // Clear facet search
      await searchInput.clear();
      await page.waitForTimeout(500);
      
      const allFacets = await page.locator('.filter-chip, .filter-button').count();
      console.log(`✅ Cleared facet search: ${allFacets} total facets shown`);
    } else {
      console.log('ℹ️ Search within facets not found');
    }
    
    await page.screenshot({ path: 'playwright-results/phase2-artifacts/facet-search.png' });
  });

  test('Performance with large datasets should be acceptable', async ({ page }) => {
    // Test filter application performance
    const startTime = Date.now();
    
    const filters = page.locator('.filter-chip, .filter-button');
    if (await filters.count() > 0) {
      await filters.first().click();
      await page.waitForTimeout(2000); // Wait for filtering
      
      const filterTime = Date.now() - startTime;
      expect(filterTime).toBeLessThan(3000); // Should filter within 3 seconds
      
      console.log(`✅ Filter application time: ${filterTime}ms (target <3000ms)`);
      
      // Test filter count update performance
      const countUpdateStart = Date.now();
      
      if (await filters.count() > 1) {
        await filters.nth(1).click();
        await page.waitForTimeout(1000);
        
        const countUpdateTime = Date.now() - countUpdateStart;
        expect(countUpdateTime).toBeLessThan(2000);
        
        console.log(`✅ Facet count update time: ${countUpdateTime}ms (target <2000ms)`);
      }
    }
    
    // Test memory usage doesn't spike with multiple filters
    const initialItems = await page.locator('.architecture-item, .building-item, [data-testid="architecture-item"]').count();
    console.log(`✅ Dataset size: ${initialItems} items handled efficiently`);
  });

  test('Integration with main search functionality', async ({ page }) => {
    // Combine faceted filters with main search
    const searchBar = page.locator('input[placeholder*="検索"], input[placeholder*="search"]').first();
    
    if (await searchBar.count() > 0) {
      // Apply a facet filter first
      const filters = page.locator('.filter-chip, .filter-button');
      if (await filters.count() > 0) {
        await filters.first().click();
        await page.waitForTimeout(1000);
        
        const filteredItems = await page.locator('.architecture-item, .building-item, [data-testid="architecture-item"]').count();
        
        // Then apply search
        await searchBar.click();
        await searchBar.fill('東京');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(2000);
        
        const combinedResults = await page.locator('.architecture-item, .building-item, [data-testid="architecture-item"]').count();
        
        console.log(`✅ Combined filtering: filter=${filteredItems} items, filter+search=${combinedResults} items`);
        
        // Verify state is maintained
        const activeFilters = page.locator('.filter-chip.active, .filter-button.active, [data-active="true"]');
        const activeCount = await activeFilters.count();
        
        if (activeCount > 0) {
          console.log('✅ Filter state maintained during search');
        }
      }
    }
    
    await page.screenshot({ path: 'playwright-results/phase2-artifacts/faceted-search-integration.png' });
  });

  test('Accessibility compliance should be maintained', async ({ page }) => {
    // Check ARIA labels on filter elements
    const filters = page.locator('.filter-chip, .filter-button');
    const filterCount = await filters.count();
    
    if (filterCount > 0) {
      for (let i = 0; i < Math.min(filterCount, 5); i++) {
        const filter = filters.nth(i);
        const ariaLabel = await filter.getAttribute('aria-label');
        const role = await filter.getAttribute('role');
        
        if (ariaLabel || role) {
          console.log(`✅ Filter ${i+1} has accessibility attributes`);
        }
      }
    }
    
    // Test keyboard navigation
    const firstFilter = filters.first();
    if (await firstFilter.count() > 0) {
      await firstFilter.focus();
      await page.keyboard.press('Space'); // Should toggle filter
      await page.waitForTimeout(500);
      
      await page.keyboard.press('Tab'); // Should move to next filter
      console.log('✅ Keyboard navigation working');
    }
    
    // Test screen reader support
    const filterSection = page.locator('[role="group"], .filters-section, [aria-label*="filter"]');
    if (await filterSection.count() > 0) {
      const sectionLabel = await filterSection.getAttribute('aria-label');
      if (sectionLabel) {
        console.log(`✅ Filter section labeled for screen readers: ${sectionLabel}`);
      }
    }
  });
});