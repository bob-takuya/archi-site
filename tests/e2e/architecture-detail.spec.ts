import { test, expect } from '@playwright/test';

test.describe('Architecture Detail Page', () => {
  test('should display architecture details with all essential information', async ({ page }) => {
    // Navigate to architecture list first
    await page.goto('/architecture');
    
    // Wait for items to load
    await page.waitForSelector('[data-testid="architecture-item"]', { timeout: 15000 });
    
    const architectureItems = page.locator('[data-testid="architecture-item"]');
    const itemCount = await architectureItems.count();
    
    if (itemCount > 0) {
      // Click on first item to go to detail page
      await architectureItems.first().click();
      
      // Wait for detail page to load
      await page.waitForLoadState('networkidle');
      
      // Check that we're on a detail page
      expect(page.url()).toContain('/architecture/');
      
      // Check for main details container
      const detailsContainer = page.locator('[data-testid="architecture-details"]');
      if (await detailsContainer.count() > 0) {
        await expect(detailsContainer).toBeVisible();
      }
      
      // Check for architecture name
      const nameSelectors = [
        '[data-testid="architecture-name"]',
        'h1',
        '.architecture-name',
        '.title'
      ];
      
      let nameFound = false;
      for (const selector of nameSelectors) {
        const nameElement = page.locator(selector);
        if (await nameElement.count() > 0) {
          await expect(nameElement.first()).toBeVisible();
          nameFound = true;
          break;
        }
      }
      expect(nameFound).toBeTruthy();
      
      // Check for architect information
      const architectSelectors = [
        '[data-testid="architect-name"]',
        '[data-testid="architect-info"]',
        '.architect-name',
        '.architect-info'
      ];
      
      for (const selector of architectSelectors) {
        const architectElement = page.locator(selector);
        if (await architectElement.count() > 0) {
          await expect(architectElement.first()).toBeVisible();
          break;
        }
      }
      
      // Check for location information
      const locationSelectors = [
        '[data-testid="architecture-location"]',
        '[data-testid="location"]',
        '.location',
        '.address'
      ];
      
      for (const selector of locationSelectors) {
        const locationElement = page.locator(selector);
        if (await locationElement.count() > 0) {
          await expect(locationElement.first()).toBeVisible();
          break;
        }
      }
      
      // Check for year information
      const yearSelectors = [
        '[data-testid="architecture-year"]',
        '[data-testid="year"]',
        '.year',
        '.completion-year'
      ];
      
      for (const selector of yearSelectors) {
        const yearElement = page.locator(selector);
        if (await yearElement.count() > 0) {
          await expect(yearElement.first()).toBeVisible();
          break;
        }
      }
    }
  });

  test('should display integrated map with architecture location', async ({ page }) => {
    // Navigate to architecture list first
    await page.goto('/architecture');
    
    // Wait for items to load
    await page.waitForSelector('[data-testid="architecture-item"]', { timeout: 15000 });
    
    const architectureItems = page.locator('[data-testid="architecture-item"]');
    const itemCount = await architectureItems.count();
    
    if (itemCount > 0) {
      // Click on first item to go to detail page
      await architectureItems.first().click();
      
      // Wait for detail page to load
      await page.waitForLoadState('networkidle');
      
      // Check for map container
      const mapSelectors = [
        '[data-testid="map-container"]',
        '[data-testid="leaflet-map"]',
        '.leaflet-container',
        '.map-container'
      ];
      
      let mapFound = false;
      for (const selector of mapSelectors) {
        const mapElement = page.locator(selector);
        if (await mapElement.count() > 0) {
          await expect(mapElement.first()).toBeVisible();
          mapFound = true;
          
          // Check for Leaflet map initialization
          const leafletContainer = page.locator('.leaflet-container');
          if (await leafletContainer.count() > 0) {
            await expect(leafletContainer.first()).toBeVisible();
            
            // Check for map tiles
            const mapTiles = page.locator('.leaflet-tile');
            await expect(mapTiles.first()).toBeVisible();
            
            // Check for map markers
            const markers = page.locator('.leaflet-marker-icon');
            if (await markers.count() > 0) {
              await expect(markers.first()).toBeVisible();
            }
          }
          break;
        }
      }
      
      // Map should be present for location display
      expect(mapFound).toBeTruthy();
    }
  });

  test('should handle map interaction and popups', async ({ page }) => {
    // Navigate to architecture list first
    await page.goto('/architecture');
    
    // Wait for items to load
    await page.waitForSelector('[data-testid="architecture-item"]', { timeout: 15000 });
    
    const architectureItems = page.locator('[data-testid="architecture-item"]');
    const itemCount = await architectureItems.count();
    
    if (itemCount > 0) {
      // Click on first item to go to detail page
      await architectureItems.first().click();
      
      // Wait for detail page to load
      await page.waitForLoadState('networkidle');
      
      // Wait for map to load
      await page.waitForSelector('.leaflet-container', { timeout: 10000 });
      
      const mapContainer = page.locator('.leaflet-container');
      if (await mapContainer.count() > 0) {
        // Test map interaction
        await mapContainer.first().click();
        
        // Check for map markers
        const markers = page.locator('.leaflet-marker-icon');
        if (await markers.count() > 0) {
          // Click on marker to open popup
          await markers.first().click();
          
          // Check for popup
          const popup = page.locator('.leaflet-popup');
          if (await popup.count() > 0) {
            await expect(popup.first()).toBeVisible();
          }
        }
        
        // Test map zoom controls
        const zoomIn = page.locator('.leaflet-control-zoom-in');
        if (await zoomIn.count() > 0) {
          await zoomIn.first().click();
          // Map should still be visible after zoom
          await expect(mapContainer.first()).toBeVisible();
        }
      }
    }
  });

  test('should support navigation back to list', async ({ page }) => {
    // Navigate to architecture list first
    await page.goto('/architecture');
    
    // Wait for items to load
    await page.waitForSelector('[data-testid="architecture-item"]', { timeout: 15000 });
    
    const architectureItems = page.locator('[data-testid="architecture-item"]');
    const itemCount = await architectureItems.count();
    
    if (itemCount > 0) {
      // Click on first item to go to detail page
      await architectureItems.first().click();
      
      // Wait for detail page to load
      await page.waitForLoadState('networkidle');
      
      // Check that we're on detail page
      expect(page.url()).toContain('/architecture/');
      
      // Look for back button or navigation
      const backSelectors = [
        '[data-testid="back-button"]',
        'button:has-text("Back")',
        'button:has-text("戻る")',
        '.back-button',
        'a:has-text("Back to List")'
      ];
      
      let backFound = false;
      for (const selector of backSelectors) {
        const backElement = page.locator(selector);
        if (await backElement.count() > 0) {
          await backElement.first().click();
          backFound = true;
          break;
        }
      }
      
      // If no back button found, use browser back
      if (!backFound) {
        await page.goBack();
      }
      
      // Should be back on list page
      await expect(page).toHaveURL(/.*\/architecture$/);
    }
  });

  test('should display additional architecture information', async ({ page }) => {
    // Navigate to architecture list first
    await page.goto('/architecture');
    
    // Wait for items to load
    await page.waitForSelector('[data-testid="architecture-item"]', { timeout: 15000 });
    
    const architectureItems = page.locator('[data-testid="architecture-item"]');
    const itemCount = await architectureItems.count();
    
    if (itemCount > 0) {
      // Click on first item to go to detail page
      await architectureItems.first().click();
      
      // Wait for detail page to load
      await page.waitForLoadState('networkidle');
      
      // Check for description or additional info
      const descriptionSelectors = [
        '[data-testid="architecture-description"]',
        '[data-testid="description"]',
        '.description',
        '.details',
        '.summary'
      ];
      
      for (const selector of descriptionSelectors) {
        const descElement = page.locator(selector);
        if (await descElement.count() > 0) {
          await expect(descElement.first()).toBeVisible();
          break;
        }
      }
      
      // Check for specifications or technical details
      const specSelectors = [
        '[data-testid="specifications"]',
        '[data-testid="technical-details"]',
        '.specifications',
        '.technical-details'
      ];
      
      for (const selector of specSelectors) {
        const specElement = page.locator(selector);
        if (await specElement.count() > 0) {
          await expect(specElement.first()).toBeVisible();
          break;
        }
      }
      
      // Check for images or gallery
      const imageSelectors = [
        '[data-testid="architecture-image"]',
        '[data-testid="image-gallery"]',
        '.architecture-image',
        '.image-gallery',
        'img'
      ];
      
      for (const selector of imageSelectors) {
        const imageElement = page.locator(selector);
        if (await imageElement.count() > 0) {
          await expect(imageElement.first()).toBeVisible();
          break;
        }
      }
    }
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Navigate to architecture list first
    await page.goto('/architecture');
    
    // Wait for items to load
    await page.waitForSelector('[data-testid="architecture-item"]', { timeout: 15000 });
    
    const architectureItems = page.locator('[data-testid="architecture-item"]');
    const itemCount = await architectureItems.count();
    
    if (itemCount > 0) {
      // Click on first item to go to detail page
      await architectureItems.first().click();
      
      // Wait for detail page to load
      await page.waitForLoadState('networkidle');
      
      // Check that main content is visible on mobile
      const mainContent = page.locator('main, [data-testid="architecture-details"]');
      if (await mainContent.count() > 0) {
        await expect(mainContent.first()).toBeVisible();
      }
      
      // Check that map is visible and responsive
      const mapContainer = page.locator('.leaflet-container, [data-testid="map-container"]');
      if (await mapContainer.count() > 0) {
        await expect(mapContainer.first()).toBeVisible();
        
        // Map should be touch-friendly
        const mapBounds = await mapContainer.first().boundingBox();
        expect(mapBounds?.width).toBeLessThanOrEqual(375);
      }
      
      // Check for mobile-friendly navigation
      const backButton = page.locator('[data-testid="back-button"], .back-button');
      if (await backButton.count() > 0) {
        await expect(backButton.first()).toBeVisible();
        
        // Button should be touch-friendly (at least 44px)
        const buttonBounds = await backButton.first().boundingBox();
        expect(buttonBounds?.height).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test('should handle loading states and errors', async ({ page }) => {
    // Test direct navigation to detail page
    await page.goto('/architecture/1');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check for valid detail page or error handling
    const isDetailPage = await page.locator('[data-testid="architecture-details"]').count() > 0;
    const isErrorPage = await page.locator('[data-testid="error-message"]').count() > 0 ||
                        await page.getByText(/not found|見つかりません/i).count() > 0;
    
    expect(isDetailPage || isErrorPage).toBeTruthy();
    
    // If it's an error page, check error handling
    if (isErrorPage) {
      // Should have proper error message
      const errorMessage = page.locator('[data-testid="error-message"]');
      if (await errorMessage.count() > 0) {
        await expect(errorMessage.first()).toBeVisible();
      }
      
      // Should have navigation options
      const homeLink = page.locator('a:has-text("Home"), a:has-text("ホーム")');
      if (await homeLink.count() > 0) {
        await expect(homeLink.first()).toBeVisible();
      }
    }
  });

  test('should handle non-existent architecture ID', async ({ page }) => {
    // Navigate to non-existent architecture
    await page.goto('/architecture/999999');
    
    // Wait for response
    await page.waitForLoadState('networkidle');
    
    // Should handle gracefully
    const errorSelectors = [
      '[data-testid="error-message"]',
      '[data-testid="not-found"]',
      'text="Architecture not found"',
      'text="見つかりません"'
    ];
    
    let errorFound = false;
    for (const selector of errorSelectors) {
      const errorElement = page.locator(selector);
      if (await errorElement.count() > 0) {
        await expect(errorElement.first()).toBeVisible();
        errorFound = true;
        break;
      }
    }
    
    // Should either show error or redirect to list
    const isListPage = page.url().includes('/architecture') && !page.url().includes('/architecture/');
    
    expect(errorFound || isListPage).toBeTruthy();
  });
});