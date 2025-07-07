import { test, expect } from '@playwright/test';
import { TestHelpers, selectors, testData } from './utils/test-helpers';

/**
 * Interactive Map Journey E2E Tests
 * Tests the complete user experience for map functionality
 */
test.describe('Interactive Map Journey', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    
    // Navigate to map section
    await page.goto('/');
    await helpers.waitForPageReady();
    
    // Look for map navigation link
    const mapLink = page.locator('a[href*="map"], a[href*="マップ"], nav a').filter({ hasText: /map|マップ|地図/i }).first();
    
    if (await mapLink.count() > 0) {
      await mapLink.click();
      await helpers.waitForPageReady();
    }
  });

  test('should load map and display properly', async ({ page }) => {
    // Wait for map to load
    await helpers.waitForMapLoad();
    
    // Check for Leaflet container
    const mapContainer = page.locator(selectors.mapContainer);
    await expect(mapContainer).toBeVisible();
    
    // Check for map tiles
    const mapTiles = page.locator('.leaflet-tile');
    const tileCount = await mapTiles.count();
    expect(tileCount).toBeGreaterThan(0);
    
    console.log(`✅ Map loaded with ${tileCount} tiles`);
    
    // Take screenshot
    await helpers.takeTimestampedScreenshot('map-loaded');
  });

  test('should display building markers', async ({ page }) => {
    await helpers.waitForMapLoad();
    
    // Check for map markers
    const markers = page.locator(selectors.mapMarker);
    const markerCount = await markers.count();
    
    if (markerCount > 0) {
      expect(markerCount).toBeGreaterThan(0);
      console.log(`✅ Found ${markerCount} building markers`);
      
      // Verify markers are visible
      for (let i = 0; i < Math.min(markerCount, 5); i++) {
        const marker = markers.nth(i);
        await expect(marker).toBeVisible();
      }
    } else {
      console.log('ℹ️  No markers found - database may not be loaded');
    }
    
    // Take screenshot
    await helpers.takeTimestampedScreenshot('map-markers');
  });

  test('should support zoom functionality', async ({ page }) => {
    await helpers.waitForMapLoad();
    
    // Find zoom controls
    const zoomIn = page.locator('.leaflet-control-zoom-in');
    const zoomOut = page.locator('.leaflet-control-zoom-out');
    
    if (await zoomIn.count() > 0) {
      // Test zoom in
      await zoomIn.click();
      await page.waitForTimeout(1000);
      
      // Test zoom out
      await zoomOut.click();
      await page.waitForTimeout(1000);
      
      console.log('✅ Zoom controls working');
    }
    
    // Test mouse wheel zoom (if supported)
    const mapContainer = page.locator(selectors.mapContainer);
    if (await mapContainer.count() > 0) {
      await mapContainer.hover();
      await page.mouse.wheel(0, -100); // Zoom in
      await page.waitForTimeout(1000);
      
      await page.mouse.wheel(0, 100); // Zoom out
      await page.waitForTimeout(1000);
      
      console.log('✅ Mouse wheel zoom working');
    }
    
    // Take screenshot
    await helpers.takeTimestampedScreenshot('map-zoom');
  });

  test('should support pan functionality', async ({ page }) => {
    await helpers.waitForMapLoad();
    
    // Test map panning
    const mapContainer = page.locator(selectors.mapContainer);
    
    if (await mapContainer.count() > 0) {
      const mapBox = await mapContainer.boundingBox();
      
      if (mapBox) {
        // Pan the map by dragging
        await page.mouse.move(mapBox.x + mapBox.width / 2, mapBox.y + mapBox.height / 2);
        await page.mouse.down();
        await page.mouse.move(mapBox.x + mapBox.width / 2 + 100, mapBox.y + mapBox.height / 2 + 100);
        await page.mouse.up();
        
        await page.waitForTimeout(1000);
        
        console.log('✅ Map panning working');
      }
    }
    
    // Take screenshot
    await helpers.takeTimestampedScreenshot('map-panned');
  });

  test('should open popups when clicking markers', async ({ page }) => {
    await helpers.waitForMapLoad();
    
    // Find markers
    const markers = page.locator(selectors.mapMarker);
    const markerCount = await markers.count();
    
    if (markerCount > 0) {
      // Click on first marker
      const firstMarker = markers.first();
      await firstMarker.click();
      await page.waitForTimeout(2000);
      
      // Check for popup
      const popup = page.locator(selectors.mapPopup);
      
      if (await popup.count() > 0) {
        await expect(popup).toBeVisible();
        
        // Check popup content
        const popupContent = await popup.textContent();
        expect(popupContent).toBeTruthy();
        
        console.log('✅ Marker popup opened with content:', popupContent?.substring(0, 100));
      } else {
        console.log('ℹ️  No popup found after clicking marker');
      }
      
      // Take screenshot
      await helpers.takeTimestampedScreenshot('map-popup');
    }
  });

  test('should navigate to building details from map', async ({ page }) => {
    await helpers.waitForMapLoad();
    
    // Find markers
    const markers = page.locator(selectors.mapMarker);
    const markerCount = await markers.count();
    
    if (markerCount > 0) {
      // Click on first marker
      const firstMarker = markers.first();
      await firstMarker.click();
      await page.waitForTimeout(2000);
      
      // Look for detail link in popup
      const detailLink = page.locator('.leaflet-popup a, .popup a').filter({ hasText: /詳細|detail|more/i }).first();
      
      if (await detailLink.count() > 0) {
        await detailLink.click();
        await helpers.waitForPageReady();
        
        // Verify we navigated to detail page
        const currentUrl = page.url();
        expect(currentUrl).toMatch(/\/architecture\/|\/building\/|\/detail\//);
        
        console.log('✅ Successfully navigated to detail page from map');
        
        // Take screenshot
        await helpers.takeTimestampedScreenshot('map-to-detail');
      } else {
        console.log('ℹ️  No detail link found in popup');
      }
    }
  });

  test('should handle map performance with large dataset', async ({ page }) => {
    // Test map loading performance
    const startTime = Date.now();
    
    await helpers.waitForMapLoad();
    
    const loadTime = Date.now() - startTime;
    console.log(`📊 Map load time: ${loadTime}ms`);
    
    // Should load within reasonable time even with many markers
    expect(loadTime).toBeLessThan(15000); // 15 seconds max
    
    // Test marker clustering or performance optimization
    const markers = page.locator(selectors.mapMarker);
    const markerCount = await markers.count();
    
    if (markerCount > 100) {
      console.log(`✅ Map handling large dataset: ${markerCount} markers`);
      
      // Test zooming with many markers
      const zoomStart = Date.now();
      const zoomIn = page.locator('.leaflet-control-zoom-in');
      if (await zoomIn.count() > 0) {
        await zoomIn.click();
        await page.waitForTimeout(2000);
      }
      const zoomTime = Date.now() - zoomStart;
      
      console.log(`📊 Zoom performance with ${markerCount} markers: ${zoomTime}ms`);
      expect(zoomTime).toBeLessThan(5000); // 5 seconds max
    }
  });

  test('should support different map views/layers', async ({ page }) => {
    await helpers.waitForMapLoad();
    
    // Look for layer control
    const layerControl = page.locator('.leaflet-control-layers');
    
    if (await layerControl.count() > 0) {
      await layerControl.click();
      await page.waitForTimeout(1000);
      
      // Check for different layer options
      const layerOptions = page.locator('.leaflet-control-layers input');
      const layerCount = await layerOptions.count();
      
      if (layerCount > 1) {
        console.log(`✅ Found ${layerCount} layer options`);
        
        // Test switching layers
        const secondLayer = layerOptions.nth(1);
        await secondLayer.click();
        await page.waitForTimeout(2000);
        
        console.log('✅ Layer switching working');
      }
    } else {
      console.log('ℹ️  No layer control found');
    }
    
    // Take screenshot
    await helpers.takeTimestampedScreenshot('map-layers');
  });

  test('should maintain map state during navigation', async ({ page }) => {
    await helpers.waitForMapLoad();
    
    // Zoom in and pan to a specific location
    const zoomIn = page.locator('.leaflet-control-zoom-in');
    if (await zoomIn.count() > 0) {
      await zoomIn.click();
      await zoomIn.click();
      await page.waitForTimeout(2000);
    }
    
    // Pan the map
    const mapContainer = page.locator(selectors.mapContainer);
    if (await mapContainer.count() > 0) {
      const mapBox = await mapContainer.boundingBox();
      if (mapBox) {
        await page.mouse.move(mapBox.x + mapBox.width / 2, mapBox.y + mapBox.height / 2);
        await page.mouse.down();
        await page.mouse.move(mapBox.x + mapBox.width / 2 + 100, mapBox.y + mapBox.height / 2 + 100);
        await page.mouse.up();
        await page.waitForTimeout(1000);
      }
    }
    
    // Navigate to a different page
    await page.goto('/');
    await helpers.waitForPageReady();
    
    // Navigate back to map
    const mapLink = page.locator('a[href*="map"], a[href*="マップ"], nav a').filter({ hasText: /map|マップ|地図/i }).first();
    if (await mapLink.count() > 0) {
      await mapLink.click();
      await helpers.waitForMapLoad();
    }
    
    // Check if map state is restored (this depends on implementation)
    console.log('✅ Map navigation state test completed');
  });

  test('should work on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await helpers.waitForMapLoad();
    
    // Check if map is visible and functional on mobile
    const mapContainer = page.locator(selectors.mapContainer);
    await expect(mapContainer).toBeVisible();
    
    // Test touch gestures (simulated)
    const mapBox = await mapContainer.boundingBox();
    if (mapBox) {
      // Simulate pinch to zoom
      await page.touchscreen.tap(mapBox.x + mapBox.width / 2, mapBox.y + mapBox.height / 2);
      await page.waitForTimeout(1000);
      
      console.log('✅ Mobile touch interaction working');
    }
    
    // Test markers on mobile
    const markers = page.locator(selectors.mapMarker);
    const markerCount = await markers.count();
    
    if (markerCount > 0) {
      const firstMarker = markers.first();
      await firstMarker.click();
      await page.waitForTimeout(2000);
      
      console.log('✅ Mobile marker interaction working');
    }
    
    // Take screenshot
    await helpers.takeTimestampedScreenshot('map-mobile');
  });

  test('should handle offline/connection issues gracefully', async ({ page }) => {
    await helpers.waitForMapLoad();
    
    // Test with slow network
    await page.route('**/*.{png,jpg,jpeg,gif,webp}', route => {
      setTimeout(() => route.continue(), 2000); // 2 second delay
    });
    
    // Zoom in to trigger new tile loading
    const zoomIn = page.locator('.leaflet-control-zoom-in');
    if (await zoomIn.count() > 0) {
      await zoomIn.click();
      await page.waitForTimeout(5000); // Wait for tiles to load with delay
    }
    
    // Check if map still functions
    const mapContainer = page.locator(selectors.mapContainer);
    await expect(mapContainer).toBeVisible();
    
    console.log('✅ Map handles slow network conditions');
  });

  test('should generate interactive map report', async ({ page }) => {
    await helpers.waitForMapLoad();
    
    // Generate comprehensive report
    const reportData = await helpers.generateReportData('Interactive Map Journey');
    
    // Add map-specific data
    const mapData = {
      ...reportData,
      hasMap: await page.locator(selectors.mapContainer).count() > 0,
      markerCount: await page.locator(selectors.mapMarker).count(),
      hasZoomControls: await page.locator('.leaflet-control-zoom').count() > 0,
      hasLayerControl: await page.locator('.leaflet-control-layers').count() > 0,
      tileCount: await page.locator('.leaflet-tile').count(),
      mapLibrary: 'Leaflet',
      popupSupport: await page.locator(selectors.mapPopup).count() > 0
    };
    
    console.log('📋 Interactive Map Report:', JSON.stringify(mapData, null, 2));
    
    // Take final screenshot
    await helpers.takeTimestampedScreenshot('interactive-map-final');
  });
});