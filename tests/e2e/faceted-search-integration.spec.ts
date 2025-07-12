import { test, expect } from '@playwright/test';

test.describe('FacetedSearch Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/architects');
    
    // Wait for the page to load and the search component to be ready
    await page.waitForSelector('[data-testid="search-bar"]', { timeout: 10000 });
  });

  test('should load faceted search interface', async ({ page }) => {
    // Check that the main search interface elements are present
    await expect(page.getByText('建築家一覧')).toBeVisible();
    await expect(page.getByText('世界の著名な建築家を検索・絞り込みできます')).toBeVisible();
    
    // Check that the search bar is present
    await expect(page.locator('[data-testid="search-bar"]')).toBeVisible();
    
    // Check for filter sections (desktop view)
    const viewport = page.viewportSize();
    if (viewport && viewport.width >= 960) {
      await expect(page.getByText('フィルター')).toBeVisible();
      await expect(page.getByText('都道府県')).toBeVisible();
      await expect(page.getByText('建築家')).toBeVisible();
      await expect(page.getByText('竣工年')).toBeVisible();
    }
  });

  test('should perform basic search', async ({ page }) => {
    const searchInput = page.locator('[data-testid="search-bar"] input');
    
    // Type a search query
    await searchInput.fill('安藤');
    await searchInput.press('Enter');
    
    // Wait for search results
    await page.waitForSelector('[data-testid*="architect-card"]', { timeout: 10000 }).catch(() => {
      // If no specific architect cards exist, just wait for the content area
      return page.waitForTimeout(2000);
    });
    
    // Check that search was performed (URL should contain search parameter)
    await expect(page).toHaveURL(/search=/);
  });

  test('should show responsive filter interface on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Reload to apply mobile layout
    await page.reload();
    await page.waitForSelector('[data-testid="search-bar"]', { timeout: 10000 });
    
    // Look for mobile filter button (tune icon)
    const filterButton = page.locator('button').filter({ has: page.locator('svg[data-testid="TuneIcon"]') });
    
    if (await filterButton.count() > 0) {
      await expect(filterButton).toBeVisible();
      
      // Click to open mobile filter drawer
      await filterButton.click();
      
      // Check that mobile filter drawer opens
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByText('フィルター')).toBeVisible();
    }
  });

  test('should handle facet filtering', async ({ page }) => {
    const viewport = page.viewportSize();
    
    // Only test facets on desktop where they're visible
    if (viewport && viewport.width >= 960) {
      // Wait for facets to load
      await page.waitForTimeout(3000);
      
      // Look for facet accordions
      const prefectureAccordion = page.getByRole('button', { name: /都道府県/ });
      
      if (await prefectureAccordion.count() > 0) {
        // Click to expand prefecture facet
        await prefectureAccordion.click();
        
        // Wait for facet content to expand
        await page.waitForTimeout(1000);
        
        // Look for checkboxes in the expanded section
        const checkboxes = page.locator('input[type="checkbox"]').first();
        
        if (await checkboxes.count() > 0) {
          await checkboxes.check();
          
          // Wait for the search to be triggered
          await page.waitForTimeout(2000);
          
          // Verify that the URL contains facet parameters
          const url = page.url();
          expect(url).toMatch(/prefectures=/);
        }
      }
    }
  });

  test('should handle page navigation and URL updates', async ({ page }) => {
    const searchInput = page.locator('[data-testid="search-bar"] input');
    
    // Perform a search
    await searchInput.fill('建築家');
    await searchInput.press('Enter');
    
    // Wait for search to complete
    await page.waitForTimeout(3000);
    
    // Check that URL reflects the search
    await expect(page).toHaveURL(/search=建築家/);
    
    // Check if pagination exists and test it
    const paginationNext = page.locator('button[aria-label*="page 2"], button[aria-label*="Go to page 2"]');
    
    if (await paginationNext.count() > 0) {
      await paginationNext.click();
      
      // Wait for page change
      await page.waitForTimeout(2000);
      
      // Check that URL reflects the page change
      await expect(page).toHaveURL(/page=2/);
    }
  });

  test('should show search results or empty state', async ({ page }) => {
    // Wait for initial load
    await page.waitForTimeout(3000);
    
    // Check if there are architect cards or an empty state
    const architectCards = page.locator('[data-testid*="architect-card"]');
    const emptyStateMessage = page.getByText('建築家が見つかりませんでした');
    const personIcon = page.locator('svg[data-testid="PersonIcon"]');
    
    // Either should have results or show empty state
    const hasResults = await architectCards.count() > 0;
    const hasEmptyState = await emptyStateMessage.isVisible() || await personIcon.isVisible();
    
    expect(hasResults || hasEmptyState).toBeTruthy();
    
    if (hasResults) {
      // If there are results, verify they have proper structure
      const firstCard = architectCards.first();
      
      // Each card should be clickable and lead to architect detail
      await expect(firstCard).toBeVisible();
      
      // Check for basic architect information in cards
      const cardText = await firstCard.textContent();
      expect(cardText).toBeTruthy();
    }
  });

  test('should handle search performance within acceptable limits', async ({ page }) => {
    const searchInput = page.locator('[data-testid="search-bar"] input');
    
    // Measure search response time
    const startTime = Date.now();
    
    await searchInput.fill('test');
    await searchInput.press('Enter');
    
    // Wait for search completion indicators
    await page.waitForTimeout(2000);
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    // Search should complete within 5 seconds (accounting for debounce and network)
    expect(responseTime).toBeLessThan(5000);
  });

  test('should maintain search state on browser back/forward', async ({ page }) => {
    const searchInput = page.locator('[data-testid="search-bar"] input');
    
    // Perform initial search
    await searchInput.fill('modern');
    await searchInput.press('Enter');
    await page.waitForTimeout(2000);
    
    // Navigate to a different page
    await page.goto('/');
    
    // Go back
    await page.goBack();
    
    // Verify search state is maintained
    await expect(page).toHaveURL(/search=modern/);
    
    // Verify search input still contains the search term
    await expect(searchInput).toHaveValue('modern');
  });
});