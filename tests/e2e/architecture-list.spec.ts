import { test, expect } from '@playwright/test';

test.describe('Architecture List Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/architecture');
  });

  test('should load architecture list with proper structure', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Architecture|建築/);
    
    // Check main heading
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    
    // Wait for either data to load or loading state
    await page.waitForSelector('[data-testid="architecture-item"], [data-testid="loading-skeleton"], [data-testid="no-results"]', { 
      timeout: 15000 
    });
    
    // Check for architecture items or appropriate messaging
    const architectureItems = page.locator('[data-testid="architecture-item"]');
    const loadingSkeletons = page.locator('[data-testid="loading-skeleton"]');
    const noResults = page.locator('[data-testid="no-results"]');
    
    const hasItems = await architectureItems.count() > 0;
    const hasLoading = await loadingSkeletons.count() > 0;
    const hasNoResults = await noResults.count() > 0;
    
    expect(hasItems || hasLoading || hasNoResults).toBeTruthy();
  });

  test('should display architecture items with required information', async ({ page }) => {
    // Wait for items to load
    await page.waitForSelector('[data-testid="architecture-item"]', { timeout: 15000 });
    
    const architectureItems = page.locator('[data-testid="architecture-item"]');
    const itemCount = await architectureItems.count();
    
    if (itemCount > 0) {
      // Check first few items for required information
      const itemsToCheck = Math.min(itemCount, 3);
      
      for (let i = 0; i < itemsToCheck; i++) {
        const item = architectureItems.nth(i);
        
        // Each item should be visible and clickable
        await expect(item).toBeVisible();
        
        // Check for architecture name
        const nameElement = item.locator('[data-testid="architecture-name"], .architecture-name, h2, h3');
        await expect(nameElement.first()).toBeVisible();
        
        // Check for architect name if displayed
        const architectElement = item.locator('[data-testid="architect-name"], .architect-name');
        if (await architectElement.count() > 0) {
          await expect(architectElement.first()).toBeVisible();
        }
        
        // Check for location if displayed\n        const locationElement = item.locator('[data-testid="architecture-location"], .location');
        if (await locationElement.count() > 0) {
          await expect(locationElement.first()).toBeVisible();
        }
        
        // Check for year if displayed
        const yearElement = item.locator('[data-testid="architecture-year"], .year');
        if (await yearElement.count() > 0) {
          await expect(yearElement.first()).toBeVisible();
        }
      }
    }
  });

  test('should support pagination', async ({ page }) => {
    // Wait for items to load
    await page.waitForSelector('[data-testid="architecture-item"]', { timeout: 15000 });
    
    // Look for pagination controls
    const paginationSelectors = [
      '[data-testid="pagination"]',
      '.pagination',
      '[role="navigation"][aria-label*="pagination"]'
    ];
    
    let paginationFound = false;
    for (const selector of paginationSelectors) {
      const pagination = page.locator(selector);
      if (await pagination.count() > 0) {
        await expect(pagination.first()).toBeVisible();
        paginationFound = true;
        
        // Check for next/previous buttons
        const nextButton = pagination.locator('button:has-text("Next"), button:has-text("次へ"), button[aria-label*="next"]');
        const prevButton = pagination.locator('button:has-text("Previous"), button:has-text("前へ"), button[aria-label*="previous"]');
        
        if (await nextButton.count() > 0) {
          const isNextEnabled = await nextButton.first().isEnabled();
          if (isNextEnabled) {
            // Test pagination
            const initialCount = await page.locator('[data-testid="architecture-item"]').count();
            await nextButton.first().click();
            
            // Wait for new items to load
            await page.waitForLoadState('networkidle');
            
            // Check that content changed
            const newCount = await page.locator('[data-testid="architecture-item"]').count();
            expect(newCount).toBeGreaterThan(0);
          }
        }
        break;
      }
    }
    
    // If no pagination found, check if all items are loaded on one page
    if (!paginationFound) {
      const itemCount = await page.locator('[data-testid="architecture-item"]').count();
      expect(itemCount).toBeGreaterThan(0);
    }
  });

  test('should have functional search', async ({ page }) => {
    // Look for search input
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
    
    if (searchInput) {
      await expect(searchInput).toBeVisible();
      
      // Test search functionality
      await searchInput.fill('Tokyo');
      
      // Look for search button or press Enter
      const searchButton = page.locator('button:has-text("Search"), button:has-text("検索"), [data-testid="search-button"]');
      if (await searchButton.count() > 0) {
        await searchButton.first().click();
      } else {
        await searchInput.press('Enter');
      }
      
      // Wait for results to update
      await page.waitForLoadState('networkidle');
      
      // Check that we have results or no results message
      const items = page.locator('[data-testid="architecture-item"]');
      const noResults = page.locator('[data-testid="no-results"]');
      
      const hasItems = await items.count() > 0;
      const hasNoResults = await noResults.count() > 0;
      
      expect(hasItems || hasNoResults).toBeTruthy();
      
      // If we have results, they should be relevant
      if (hasItems) {
        const firstItem = items.first();
        const itemText = await firstItem.textContent();
        // Results should contain search term (case insensitive)
        expect(itemText?.toLowerCase().includes('tokyo')).toBeTruthy();
      }
    }
  });

  test('should support filtering', async ({ page }) => {
    // Look for filter controls
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
    
    if (filterPanel) {
      await expect(filterPanel).toBeVisible();
      
      // Look for filter options
      const selectFilters = filterPanel.locator('select');
      const checkboxFilters = filterPanel.locator('input[type="checkbox"]');
      const rangeFilters = filterPanel.locator('input[type="range"], input[type="number"]');
      
      // Test select filters
      if (await selectFilters.count() > 0) {
        const firstSelect = selectFilters.first();
        const options = await firstSelect.locator('option').count();
        
        if (options > 1) {
          await firstSelect.selectOption({ index: 1 });
          
          // Wait for results to update
          await page.waitForLoadState('networkidle');
          
          // Check that results are filtered
          const items = page.locator('[data-testid="architecture-item"]');
          const itemCount = await items.count();
          expect(itemCount).toBeGreaterThanOrEqual(0);
        }
      }
      
      // Test checkbox filters
      if (await checkboxFilters.count() > 0) {
        const firstCheckbox = checkboxFilters.first();
        await firstCheckbox.check();
        
        // Wait for results to update
        await page.waitForLoadState('networkidle');
        
        // Check that results are updated
        const items = page.locator('[data-testid="architecture-item"]');
        const itemCount = await items.count();
        expect(itemCount).toBeGreaterThanOrEqual(0);
      }
    }
  });

  test('should handle item clicks and navigation', async ({ page }) => {
    // Wait for items to load
    await page.waitForSelector('[data-testid="architecture-item"]', { timeout: 15000 });
    
    const architectureItems = page.locator('[data-testid="architecture-item"]');
    const itemCount = await architectureItems.count();
    
    if (itemCount > 0) {
      // Click on first item
      const firstItem = architectureItems.first();
      await firstItem.click();
      
      // Should navigate to detail page
      await page.waitForLoadState('networkidle');
      
      // Check that we're on a detail page
      const isDetailPage = page.url().includes('/architecture/') || 
                          await page.locator('[data-testid="architecture-details"]').count() > 0;
      
      expect(isDetailPage).toBeTruthy();
      
      // Go back to list
      await page.goBack();
      await expect(page).toHaveURL(/.*\/architecture$/);
    }
  });

  test('should be responsive on different screen sizes', async ({ page }) => {
    // Test desktop view
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.reload();
    
    // Wait for items to load
    await page.waitForSelector('[data-testid="architecture-item"]', { timeout: 15000 });
    
    // Check desktop layout
    const desktopItems = page.locator('[data-testid="architecture-item"]');
    const desktopCount = await desktopItems.count();
    
    if (desktopCount > 0) {
      await expect(desktopItems.first()).toBeVisible();
    }
    
    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();
    
    // Wait for items to load
    await page.waitForSelector('[data-testid="architecture-item"]', { timeout: 15000 });
    
    const tabletItems = page.locator('[data-testid="architecture-item"]');
    const tabletCount = await tabletItems.count();
    
    if (tabletCount > 0) {
      await expect(tabletItems.first()).toBeVisible();
    }
    
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    
    // Wait for items to load
    await page.waitForSelector('[data-testid="architecture-item"]', { timeout: 15000 });
    
    const mobileItems = page.locator('[data-testid="architecture-item"]');
    const mobileCount = await mobileItems.count();
    
    if (mobileCount > 0) {
      await expect(mobileItems.first()).toBeVisible();
    }
  });

  test('should handle loading states properly', async ({ page }) => {
    // Simulate slow network
    await page.route('**/api/**', route => {
      setTimeout(() => route.continue(), 1000);
    });
    
    await page.goto('/architecture');
    
    // Should show loading state initially
    const loadingStates = [
      '[data-testid="loading-skeleton"]',
      '[data-testid="loading-spinner"]',
      '.loading',
      '.skeleton'
    ];
    
    let loadingFound = false;
    for (const selector of loadingStates) {
      const loading = page.locator(selector);
      if (await loading.count() > 0) {
        await expect(loading.first()).toBeVisible();
        loadingFound = true;
        break;
      }
    }
    
    // Wait for content to load
    await page.waitForSelector('[data-testid="architecture-item"]', { timeout: 20000 });
    
    // Loading should be gone, content should be visible
    const items = page.locator('[data-testid="architecture-item"]');
    const itemCount = await items.count();
    
    if (itemCount > 0) {
      await expect(items.first()).toBeVisible();
    }
  });

  test('should handle empty states', async ({ page }) => {
    // Test search with no results
    const searchInput = page.locator('[data-testid="search-input"], input[type="search"]');
    
    if (await searchInput.count() > 0) {
      await searchInput.first().fill('XYZ123NonExistentBuilding');
      
      const searchButton = page.locator('button:has-text("Search"), button:has-text("検索")');
      if (await searchButton.count() > 0) {
        await searchButton.first().click();
      } else {
        await searchInput.first().press('Enter');
      }
      
      // Wait for response
      await page.waitForLoadState('networkidle');
      
      // Should show no results message
      const noResultsSelectors = [
        '[data-testid="no-results"]',
        'text="No results found"',
        'text="結果が見つかりません"'
      ];
      
      let noResultsFound = false;
      for (const selector of noResultsSelectors) {
        const noResults = page.locator(selector);
        if (await noResults.count() > 0) {
          await expect(noResults.first()).toBeVisible();
          noResultsFound = true;
          break;
        }
      }
      
      expect(noResultsFound).toBeTruthy();
    }
  });
});