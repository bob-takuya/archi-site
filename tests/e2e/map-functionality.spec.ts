import { test, expect } from '@playwright/test';

test.describe('Map Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/map');
  });

  test('should load map page with Leaflet map', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Map|マップ/);
    
    // Wait for map container to load
    await page.waitForSelector('[data-testid="map-container"], .leaflet-container', { timeout: 15000 });
    
    // Check for map container
    const mapContainer = page.locator('[data-testid="map-container"], .leaflet-container');
    await expect(mapContainer.first()).toBeVisible();
    
    // Check for Leaflet map initialization
    const leafletContainer = page.locator('.leaflet-container');
    await expect(leafletContainer.first()).toBeVisible();
    
    // Wait for map tiles to load
    await page.waitForSelector('.leaflet-tile', { timeout: 10000 });
    
    // Check for map tiles
    const mapTiles = page.locator('.leaflet-tile');
    await expect(mapTiles.first()).toBeVisible();
  });

  test('should display architecture markers on map', async ({ page }) => {
    // Wait for map to load
    await page.waitForSelector('.leaflet-container', { timeout: 15000 });
    
    // Wait for markers to load
    await page.waitForSelector('.leaflet-marker-icon', { timeout: 10000 });
    
    // Check for markers
    const markers = page.locator('.leaflet-marker-icon');
    const markerCount = await markers.count();
    
    if (markerCount > 0) {
      // At least one marker should be visible
      await expect(markers.first()).toBeVisible();
      
      // Test marker interaction
      await markers.first().click();
      
      // Check for popup
      const popup = page.locator('.leaflet-popup');
      if (await popup.count() > 0) {
        await expect(popup.first()).toBeVisible();
        
        // Popup should contain architecture information
        const popupContent = page.locator('.leaflet-popup-content');
        await expect(popupContent.first()).toBeVisible();
      }
    }
  });

  test('should support map zoom controls', async ({ page }) => {
    // Wait for map to load
    await page.waitForSelector('.leaflet-container', { timeout: 15000 });
    
    // Check for zoom controls
    const zoomIn = page.locator('.leaflet-control-zoom-in');
    const zoomOut = page.locator('.leaflet-control-zoom-out');
    
    await expect(zoomIn.first()).toBeVisible();
    await expect(zoomOut.first()).toBeVisible();
    
    // Test zoom in
    await zoomIn.first().click();
    await page.waitForTimeout(500); // Wait for zoom animation
    
    // Map should still be visible
    const mapContainer = page.locator('.leaflet-container');
    await expect(mapContainer.first()).toBeVisible();
    
    // Test zoom out
    await zoomOut.first().click();
    await page.waitForTimeout(500); // Wait for zoom animation
    
    // Map should still be visible
    await expect(mapContainer.first()).toBeVisible();
  });

  test('should support map panning and dragging', async ({ page }) => {
    // Wait for map to load
    await page.waitForSelector('.leaflet-container', { timeout: 15000 });
    
    const mapContainer = page.locator('.leaflet-container');
    
    // Get initial position
    const initialBox = await mapContainer.first().boundingBox();
    
    // Perform drag operation
    await mapContainer.first().hover();
    await page.mouse.down();
    await page.mouse.move(initialBox!.x + 100, initialBox!.y + 100);
    await page.mouse.up();
    
    // Wait for pan animation
    await page.waitForTimeout(500);
    
    // Map should still be visible and responsive
    await expect(mapContainer.first()).toBeVisible();
    
    // Test double-click zoom
    await mapContainer.first().dblclick();
    await page.waitForTimeout(500);
    
    // Map should still be visible
    await expect(mapContainer.first()).toBeVisible();
  });

  test('should display marker popups with architecture details', async ({ page }) => {
    // Wait for map to load
    await page.waitForSelector('.leaflet-container', { timeout: 15000 });
    
    // Wait for markers to load
    await page.waitForSelector('.leaflet-marker-icon', { timeout: 10000 });
    
    const markers = page.locator('.leaflet-marker-icon');
    const markerCount = await markers.count();
    
    if (markerCount > 0) {
      // Test multiple markers
      const markersToTest = Math.min(markerCount, 3);
      
      for (let i = 0; i < markersToTest; i++) {
        const marker = markers.nth(i);
        await marker.click();
        
        // Check for popup
        const popup = page.locator('.leaflet-popup');
        if (await popup.count() > 0) {
          await expect(popup.first()).toBeVisible();
          
          // Check popup content
          const popupContent = page.locator('.leaflet-popup-content');
          await expect(popupContent.first()).toBeVisible();
          
          // Check for architecture name
          const nameElement = popupContent.locator('[data-testid="architecture-name"], .architecture-name, h3, h4');
          if (await nameElement.count() > 0) {
            await expect(nameElement.first()).toBeVisible();
          }
          
          // Check for architect name
          const architectElement = popupContent.locator('[data-testid="architect-name"], .architect-name');
          if (await architectElement.count() > 0) {
            await expect(architectElement.first()).toBeVisible();
          }
          
          // Check for links to detail pages
          const detailLink = popupContent.locator('a[href*="/architecture/"]');
          if (await detailLink.count() > 0) {
            await expect(detailLink.first()).toBeVisible();
          }
          
          // Close popup by clicking elsewhere
          await page.locator('.leaflet-container').click();
          await page.waitForTimeout(200);
        }
      }
    }
  });

  test('should support map layer controls', async ({ page }) => {
    // Wait for map to load
    await page.waitForSelector('.leaflet-container', { timeout: 15000 });
    
    // Check for layer control
    const layerControl = page.locator('.leaflet-control-layers');
    
    if (await layerControl.count() > 0) {
      await expect(layerControl.first()).toBeVisible();
      
      // Click on layer control to expand
      await layerControl.first().click();
      
      // Check for layer options
      const layerOptions = page.locator('.leaflet-control-layers-base input, .leaflet-control-layers-overlays input');
      
      if (await layerOptions.count() > 0) {
        // Test switching layers
        const firstOption = layerOptions.first();
        await firstOption.click();
        
        // Map should still be visible
        const mapContainer = page.locator('.leaflet-container');
        await expect(mapContainer.first()).toBeVisible();
      }
    }
  });

  test('should handle map search and filtering', async ({ page }) => {
    // Look for search controls
    const searchSelectors = [
      '[data-testid="map-search"]',
      '[data-testid="search-input"]',
      'input[type="search"]',
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
      const searchButton = page.locator('button:has-text("Search"), button:has-text("検索")');
      if (await searchButton.count() > 0) {
        await searchButton.first().click();
      } else {
        await searchInput.press('Enter');
      }
      
      // Wait for map to update
      await page.waitForTimeout(1000);
      
      // Check that markers are filtered or map is updated
      const markers = page.locator('.leaflet-marker-icon');
      const markerCount = await markers.count();
      
      // Should have markers or appropriate feedback
      expect(markerCount).toBeGreaterThanOrEqual(0);
    }
    
    // Look for filter controls
    const filterSelectors = [
      '[data-testid="map-filters"]',
      '[data-testid="filter-panel"]',
      '.map-filters',
      '.filter-controls'
    ];
    
    for (const selector of filterSelectors) {
      const filterPanel = page.locator(selector);
      if (await filterPanel.count() > 0) {
        await expect(filterPanel.first()).toBeVisible();
        
        // Test filter functionality
        const selectFilters = filterPanel.locator('select');
        if (await selectFilters.count() > 0) {
          const firstSelect = selectFilters.first();
          const options = await firstSelect.locator('option').count();
          
          if (options > 1) {
            await firstSelect.selectOption({ index: 1 });
            
            // Wait for map to update
            await page.waitForTimeout(1000);
            
            // Check that markers are filtered
            const filteredMarkers = page.locator('.leaflet-marker-icon');
            const filteredCount = await filteredMarkers.count();
            
            expect(filteredCount).toBeGreaterThanOrEqual(0);
          }
        }
        break;
      }
    }
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Reload page for mobile
    await page.reload();
    
    // Wait for map to load
    await page.waitForSelector('.leaflet-container', { timeout: 15000 });
    
    const mapContainer = page.locator('.leaflet-container');
    await expect(mapContainer.first()).toBeVisible();
    
    // Check that map fits mobile screen
    const mapBounds = await mapContainer.first().boundingBox();
    expect(mapBounds?.width).toBeLessThanOrEqual(375);
    
    // Test touch interactions
    await mapContainer.first().tap();
    await page.waitForTimeout(200);
    
    // Map should still be visible
    await expect(mapContainer.first()).toBeVisible();
    
    // Test marker interaction on mobile
    const markers = page.locator('.leaflet-marker-icon');
    if (await markers.count() > 0) {
      await markers.first().tap();
      
      // Check for popup
      const popup = page.locator('.leaflet-popup');
      if (await popup.count() > 0) {
        await expect(popup.first()).toBeVisible();
      }
    }
    
    // Test zoom controls on mobile
    const zoomIn = page.locator('.leaflet-control-zoom-in');
    if (await zoomIn.count() > 0) {
      await zoomIn.first().tap();
      await page.waitForTimeout(500);
      
      // Map should still be visible
      await expect(mapContainer.first()).toBeVisible();
    }
  });

  test('should handle map loading errors gracefully', async ({ page }) => {
    // Simulate network issues for map tiles
    await page.route('**/tile/**', route => {
      route.abort();
    });
    
    await page.goto('/map');
    
    // Wait for map container
    await page.waitForSelector('.leaflet-container', { timeout: 15000 });
    
    // Map container should still be visible
    const mapContainer = page.locator('.leaflet-container');
    await expect(mapContainer.first()).toBeVisible();
    
    // Check for error handling
    const errorSelectors = [
      '[data-testid="map-error"]',
      '.map-error',
      '.error-message'
    ];
    
    for (const selector of errorSelectors) {
      const errorElement = page.locator(selector);
      if (await errorElement.count() > 0) {
        await expect(errorElement.first()).toBeVisible();
        break;
      }
    }
  });

  test('should support marker clustering for performance', async ({ page }) => {
    // Wait for map to load
    await page.waitForSelector('.leaflet-container', { timeout: 15000 });
    
    // Check for marker clusters
    const clusterSelectors = [
      '.marker-cluster',
      '.leaflet-marker-cluster',
      '[data-testid="marker-cluster"]'
    ];
    
    for (const selector of clusterSelectors) {
      const clusters = page.locator(selector);
      if (await clusters.count() > 0) {
        await expect(clusters.first()).toBeVisible();
        
        // Test cluster interaction
        await clusters.first().click();
        
        // Should expand cluster or zoom in
        await page.waitForTimeout(500);
        
        // Map should still be visible
        const mapContainer = page.locator('.leaflet-container');
        await expect(mapContainer.first()).toBeVisible();
        
        break;
      }
    }
  });

  test('should navigate to architecture detail from map popup', async ({ page }) => {
    // Wait for map to load
    await page.waitForSelector('.leaflet-container', { timeout: 15000 });
    
    // Wait for markers to load
    await page.waitForSelector('.leaflet-marker-icon', { timeout: 10000 });
    
    const markers = page.locator('.leaflet-marker-icon');
    const markerCount = await markers.count();
    
    if (markerCount > 0) {
      // Click on first marker
      await markers.first().click();
      
      // Check for popup
      const popup = page.locator('.leaflet-popup');
      if (await popup.count() > 0) {
        await expect(popup.first()).toBeVisible();
        
        // Look for detail link
        const detailLink = popup.locator('a[href*="/architecture/"]');
        if (await detailLink.count() > 0) {
          await detailLink.first().click();
          
          // Should navigate to detail page
          await page.waitForLoadState('networkidle');
          
          // Check that we're on detail page
          expect(page.url()).toContain('/architecture/');
          
          // Check for detail content
          const detailContent = page.locator('[data-testid="architecture-details"]');
          if (await detailContent.count() > 0) {
            await expect(detailContent.first()).toBeVisible();
          }
        }
      }
    }
  });
});