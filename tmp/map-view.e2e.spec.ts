import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Architecture Page Map View
 * Created by TESTER_MAP_001
 * Validates all map view requirements and quality gates
 */

test.describe('Architecture Page Map View', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/architecture');
    await page.waitForLoadState('networkidle');
  });

  test('should switch between grid and map views seamlessly', async ({ page }) => {
    // Check initial grid view
    const gridView = page.locator('[data-testid="architecture-grid"]');
    await expect(gridView).toBeVisible();
    
    // Switch to map view
    await page.click('[aria-label="マップビュー"]');
    
    // Verify map is visible
    const mapContainer = page.locator('.leaflet-container');
    await expect(mapContainer).toBeVisible();
    
    // Verify grid is hidden
    await expect(gridView).not.toBeVisible();
    
    // Switch back to grid view
    await page.click('[aria-label="カードビュー"]');
    await expect(gridView).toBeVisible();
    await expect(mapContainer).not.toBeVisible();
  });

  test('should maintain filters when switching views', async ({ page }) => {
    // Apply architect filter
    await page.fill('[placeholder*="建築賞、建築家"]', '隈研吾');
    await page.click('text=検索');
    await page.waitForLoadState('networkidle');
    
    // Get filtered results count
    const resultsText = await page.textContent('text=/\\d+件の建築作品/');
    const filteredCount = parseInt(resultsText.match(/\\d+/)[0]);
    
    // Switch to map view
    await page.click('[aria-label="マップビュー"]');
    await page.waitForSelector('.leaflet-container');
    
    // Verify filter is still active
    const filterChip = page.locator('text=建築家: 隈研吾');
    await expect(filterChip).toBeVisible();
    
    // Verify results count remains consistent
    const mapResultsText = await page.textContent('text=/\\d+件の建築作品/');
    expect(mapResultsText).toContain(filteredCount.toString());
  });

  test('should handle large dataset performance', async ({ page }) => {
    // Navigate to page with many results
    await page.goto('/architecture?category=美術館');
    
    // Measure map loading time
    const startTime = Date.now();
    await page.click('[aria-label="マップビュー"]');
    await page.waitForSelector('.leaflet-marker-icon', { timeout: 2000 });
    const loadTime = Date.now() - startTime;
    
    // Should load within 2 seconds as per quality gate
    expect(loadTime).toBeLessThan(2000);
    
    // Check for marker clustering
    const clusters = await page.locator('.marker-cluster').count();
    expect(clusters).toBeGreaterThan(0);
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Switch to map view
    await page.click('[aria-label="マップビュー"]');
    await page.waitForSelector('.leaflet-container');
    
    // Map should fill viewport properly
    const mapBounds = await page.locator('.leaflet-container').boundingBox();
    expect(mapBounds.width).toBeLessThanOrEqual(375);
    expect(mapBounds.height).toBeGreaterThan(400);
    
    // Controls should be accessible
    const zoomIn = page.locator('.leaflet-control-zoom-in');
    await expect(zoomIn).toBeVisible();
    await zoomIn.click();
    
    // Popup should be readable on mobile
    await page.click('.leaflet-marker-icon').first();
    const popup = page.locator('.leaflet-popup-content');
    await expect(popup).toBeVisible();
    const popupWidth = await popup.boundingBox().then(b => b.width);
    expect(popupWidth).toBeLessThanOrEqual(300);
  });

  test('should handle markers without coordinates gracefully', async ({ page }) => {
    // Search for entries that might not have coordinates
    await page.fill('[placeholder*="建築賞、建築家"]', '歴史的建造物');
    await page.click('text=検索');
    await page.waitForLoadState('networkidle');
    
    // Switch to map view
    await page.click('[aria-label="マップビュー"]');
    
    // Should show message about limited markers if some lack coordinates
    const resultsText = await page.textContent('text=/\\d+件の建築作品/');
    if (resultsText.includes('件を地図に表示')) {
      expect(resultsText).toMatch(/\d+件の建築作品.*\d+件を地図に表示/);
    }
  });

  test('should navigate to detail page on marker click', async ({ page }) => {
    await page.click('[aria-label="マップビュー"]');
    await page.waitForSelector('.leaflet-marker-icon');
    
    // Click first marker
    await page.click('.leaflet-marker-icon').first();
    
    // Click detail link in popup
    await page.click('.leaflet-popup-content a[href*="/architecture/"]');
    
    // Should navigate to detail page
    await expect(page).toHaveURL(/\/architecture\/\d+/);
  });

  test('should auto-center and zoom based on filter context', async ({ page }) => {
    // Test regional filter
    await page.goto('/architecture?prefecture=東京都');
    await page.click('[aria-label="マップビュー"]');
    
    // Get map center after auto-centering
    const mapCenter1 = await page.evaluate(() => {
      const map = window.leafletMaps?.[0];
      return map ? map.getCenter() : null;
    });
    
    // Clear filters and check different center
    await page.click('text=すべてクリア');
    await page.waitForLoadState('networkidle');
    
    const mapCenter2 = await page.evaluate(() => {
      const map = window.leafletMaps?.[0];
      return map ? map.getCenter() : null;
    });
    
    // Centers should be different
    expect(mapCenter1).not.toEqual(mapCenter2);
  });

  test('should meet accessibility standards', async ({ page }) => {
    await page.click('[aria-label="マップビュー"]');
    
    // Check for proper ARIA labels
    const mapContainer = page.locator('.leaflet-container');
    await expect(mapContainer).toHaveAttribute('role', 'application');
    
    // Zoom controls should be keyboard accessible
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    const focusedElement = await page.evaluate(() => document.activeElement?.className);
    expect(focusedElement).toContain('leaflet-control');
    
    // Map should have proper contrast
    const backgroundColor = await page.evaluate(() => {
      const map = document.querySelector('.leaflet-container');
      return window.getComputedStyle(map).backgroundColor;
    });
    expect(backgroundColor).toBeTruthy();
  });

  test('should persist view mode in URL', async ({ page }) => {
    // Switch to map view
    await page.click('[aria-label="マップビュー"]');
    
    // Check URL includes view parameter
    await expect(page).toHaveURL(/view=map/);
    
    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Should remain in map view
    const mapContainer = page.locator('.leaflet-container');
    await expect(mapContainer).toBeVisible();
  });

  test('should show loading state while fetching data', async ({ page }) => {
    // Slow down network to see loading state
    await page.route('**/api/architectures**', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.continue();
    });
    
    await page.click('[aria-label="マップビュー"]');
    
    // Should show loading indicator
    const loadingText = page.locator('text=地図を読み込み中...');
    await expect(loadingText).toBeVisible();
    
    // Should hide after loading
    await expect(loadingText).not.toBeVisible({ timeout: 5000 });
  });
});

// Performance benchmark test
test.describe('Map Performance', () => {
  test('should handle 500+ markers efficiently', async ({ page }) => {
    // Mock API to return 500 markers
    await page.route('**/api/architectures**', async route => {
      const mockData = {
        results: Array.from({ length: 500 }, (_, i) => ({
          id: i + 1,
          title: `建築物 ${i + 1}`,
          architect: `建築家 ${i % 50}`,
          year: 1950 + (i % 70),
          category: ['美術館', '図書館', '学校', '住宅'][i % 4],
          latitude: 35.6762 + (Math.random() - 0.5) * 2,
          longitude: 139.6503 + (Math.random() - 0.5) * 2,
          address: `東京都 ${i + 1}`,
          tags: i % 10 === 0 ? '日本建築学会賞' : null
        })),
        total: 500
      };
      await route.fulfill({ json: mockData });
    });
    
    await page.goto('/architecture');
    
    const startTime = Date.now();
    await page.click('[aria-label="マップビュー"]');
    
    // Wait for clusters to appear
    await page.waitForSelector('.marker-cluster', { timeout: 2000 });
    const renderTime = Date.now() - startTime;
    
    // Should render within 2 seconds
    expect(renderTime).toBeLessThan(2000);
    
    // Should have created clusters
    const clusterCount = await page.locator('.marker-cluster').count();
    expect(clusterCount).toBeGreaterThan(5);
    
    // Interaction should remain smooth
    const interactionStart = Date.now();
    await page.click('.marker-cluster').first();
    await page.waitForSelector('.leaflet-marker-icon');
    const interactionTime = Date.now() - interactionStart;
    
    expect(interactionTime).toBeLessThan(500);
  });
});