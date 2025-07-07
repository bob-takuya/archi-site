import { test, expect } from '@playwright/test';

test.describe('Responsive Design Testing', () => {
  const viewports = [
    { name: 'Mobile Portrait', width: 375, height: 667 },
    { name: 'Mobile Landscape', width: 667, height: 375 },
    { name: 'Tablet Portrait', width: 768, height: 1024 },
    { name: 'Tablet Landscape', width: 1024, height: 768 },
    { name: 'Desktop', width: 1200, height: 800 },
    { name: 'Large Desktop', width: 1920, height: 1080 }
  ];

  viewports.forEach(viewport => {
    test(`should display correctly on ${viewport.name} (${viewport.width}x${viewport.height})`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      
      // Test homepage
      await page.goto('/');
      
      // Check that main content is visible
      await expect(page.locator('main')).toBeVisible();
      
      // Check that navigation is accessible
      const nav = page.getByRole('navigation');
      await expect(nav).toBeVisible();
      
      // Check for mobile menu toggle on smaller screens
      if (viewport.width < 768) {
        const mobileMenuToggle = page.locator('[data-testid="mobile-menu-toggle"], .mobile-menu-toggle, button[aria-label*="menu"]');
        if (await mobileMenuToggle.count() > 0) {
          await expect(mobileMenuToggle.first()).toBeVisible();
        }
      }
      
      // Check that content doesn't overflow
      const body = page.locator('body');
      const bodyBounds = await body.boundingBox();
      if (bodyBounds) {
        expect(bodyBounds.width).toBeLessThanOrEqual(viewport.width + 20); // Allow small margin
      }
    });
  });

  test('should handle touch interactions on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Test homepage
    await page.goto('/');
    
    // Test touch navigation
    const navLinks = page.getByRole('link');
    const linkCount = await navLinks.count();
    
    if (linkCount > 0) {
      const firstLink = navLinks.first();
      await firstLink.tap();
      
      // Should navigate successfully
      await page.waitForLoadState('networkidle');
      expect(page.url()).not.toBe('/');
    }
  });

  test('should have touch-friendly button sizes', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Test architecture list page
    await page.goto('/architecture');
    
    // Wait for content to load
    await page.waitForSelector('button', { timeout: 10000 });
    
    // Check button sizes (should be at least 44px for touch)
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < Math.min(buttonCount, 5); i++) {
      const button = buttons.nth(i);
      const buttonBounds = await button.boundingBox();
      
      if (buttonBounds) {
        expect(buttonBounds.height).toBeGreaterThanOrEqual(44);
        expect(buttonBounds.width).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test('should adapt text sizes for different screens', async ({ page }) => {
    // Test desktop first
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('/');
    
    const h1Desktop = page.getByRole('heading', { level: 1 });
    const h1DesktopSize = await h1Desktop.evaluate(el => {
      return window.getComputedStyle(el).fontSize;
    });
    
    // Test mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    
    const h1Mobile = page.getByRole('heading', { level: 1 });
    const h1MobileSize = await h1Mobile.evaluate(el => {
      return window.getComputedStyle(el).fontSize;
    });
    
    // Font sizes should be appropriate for each screen
    expect(parseFloat(h1DesktopSize)).toBeGreaterThanOrEqual(16);
    expect(parseFloat(h1MobileSize)).toBeGreaterThanOrEqual(16);
  });

  test('should handle horizontal scrolling properly', async ({ page }) => {
    const testViewports = [
      { width: 375, height: 667 },
      { width: 768, height: 1024 },
      { width: 1200, height: 800 }
    ];
    
    for (const viewport of testViewports) {
      await page.setViewportSize(viewport);
      await page.goto('/architecture');
      
      // Check for horizontal scrollbars
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      
      // Should not have unwanted horizontal scroll
      expect(hasHorizontalScroll).toBeFalsy();
    }
  });

  test('should adapt map display for different screen sizes', async ({ page }) => {
    const testViewports = [
      { width: 375, height: 667 },
      { width: 768, height: 1024 },
      { width: 1200, height: 800 }
    ];
    
    for (const viewport of testViewports) {
      await page.setViewportSize(viewport);
      await page.goto('/map');
      
      // Wait for map to load
      await page.waitForSelector('.leaflet-container', { timeout: 15000 });
      
      const mapContainer = page.locator('.leaflet-container');
      await expect(mapContainer.first()).toBeVisible();
      
      // Check that map fits viewport
      const mapBounds = await mapContainer.first().boundingBox();
      if (mapBounds) {
        expect(mapBounds.width).toBeLessThanOrEqual(viewport.width);
        expect(mapBounds.height).toBeGreaterThan(200); // Minimum useful height
      }
    }
  });

  test('should show/hide elements based on screen size', async ({ page }) => {
    await page.goto('/');
    
    // Test desktop layout
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.reload();
    
    // Check for desktop-specific elements
    const desktopElements = page.locator('.desktop-only, [data-testid="desktop-only"]');
    if (await desktopElements.count() > 0) {
      await expect(desktopElements.first()).toBeVisible();
    }
    
    // Test mobile layout
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    
    // Check for mobile-specific elements
    const mobileElements = page.locator('.mobile-only, [data-testid="mobile-only"]');
    if (await mobileElements.count() > 0) {
      await expect(mobileElements.first()).toBeVisible();
    }
    
    // Desktop elements should be hidden on mobile
    if (await desktopElements.count() > 0) {
      await expect(desktopElements.first()).not.toBeVisible();
    }
  });

  test('should handle image responsiveness', async ({ page }) => {
    const testViewports = [
      { width: 375, height: 667 },
      { width: 768, height: 1024 },
      { width: 1200, height: 800 }
    ];
    
    for (const viewport of testViewports) {
      await page.setViewportSize(viewport);
      await page.goto('/architecture');
      
      // Wait for potential images to load
      await page.waitForSelector('img', { timeout: 10000 });
      
      const images = page.locator('img');
      const imageCount = await images.count();
      
      if (imageCount > 0) {
        for (let i = 0; i < Math.min(imageCount, 3); i++) {
          const img = images.nth(i);
          const imgBounds = await img.boundingBox();
          
          if (imgBounds) {
            // Images should not overflow viewport
            expect(imgBounds.width).toBeLessThanOrEqual(viewport.width);
            
            // Images should maintain aspect ratio
            const imgElement = await img.elementHandle();
            const naturalWidth = await imgElement?.evaluate(el => (el as HTMLImageElement).naturalWidth);
            const naturalHeight = await imgElement?.evaluate(el => (el as HTMLImageElement).naturalHeight);
            
            if (naturalWidth && naturalHeight && naturalWidth > 0 && naturalHeight > 0) {
              const displayedRatio = imgBounds.width / imgBounds.height;
              const naturalRatio = naturalWidth / naturalHeight;
              
              // Allow some tolerance for rounding
              expect(Math.abs(displayedRatio - naturalRatio)).toBeLessThan(0.1);
            }
          }
        }
      }
    }
  });

  test('should handle form elements responsively', async ({ page }) => {
    const testViewports = [
      { width: 375, height: 667 },
      { width: 768, height: 1024 },
      { width: 1200, height: 800 }
    ];
    
    for (const viewport of testViewports) {
      await page.setViewportSize(viewport);
      await page.goto('/architecture');
      
      // Check search input
      const searchInput = page.locator('input[type="search"], [data-testid="search-input"]');
      if (await searchInput.count() > 0) {
        await expect(searchInput.first()).toBeVisible();
        
        const inputBounds = await searchInput.first().boundingBox();
        if (inputBounds) {
          // Input should fit within viewport
          expect(inputBounds.width).toBeLessThanOrEqual(viewport.width - 40); // Allow margins
          
          // Input should be touch-friendly on mobile
          if (viewport.width < 768) {
            expect(inputBounds.height).toBeGreaterThanOrEqual(44);
          }
        }
      }
      
      // Check select elements
      const selectElements = page.locator('select');
      if (await selectElements.count() > 0) {
        const firstSelect = selectElements.first();
        await expect(firstSelect).toBeVisible();
        
        const selectBounds = await firstSelect.boundingBox();
        if (selectBounds) {
          // Select should fit within viewport
          expect(selectBounds.width).toBeLessThanOrEqual(viewport.width - 40);
          
          // Select should be touch-friendly on mobile
          if (viewport.width < 768) {
            expect(selectBounds.height).toBeGreaterThanOrEqual(44);
          }
        }
      }
    }
  });

  test('should handle navigation menu responsively', async ({ page }) => {
    // Test desktop navigation
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('/');
    
    const nav = page.getByRole('navigation');
    await expect(nav).toBeVisible();
    
    // Check for desktop navigation links
    const navLinks = nav.getByRole('link');
    const linkCount = await navLinks.count();
    
    if (linkCount > 0) {
      // Links should be visible on desktop
      for (let i = 0; i < Math.min(linkCount, 4); i++) {
        await expect(navLinks.nth(i)).toBeVisible();
      }
    }
    
    // Test mobile navigation
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    
    // Check for mobile menu toggle
    const mobileMenuToggle = page.locator('[data-testid="mobile-menu-toggle"], .mobile-menu-toggle, button[aria-label*="menu"]');
    if (await mobileMenuToggle.count() > 0) {
      await expect(mobileMenuToggle.first()).toBeVisible();
      
      // Test mobile menu interaction
      await mobileMenuToggle.first().click();
      
      // Menu should expand
      const expandedMenu = page.locator('[data-testid="mobile-menu"], .mobile-menu, .nav-menu[aria-expanded="true"]');
      if (await expandedMenu.count() > 0) {
        await expect(expandedMenu.first()).toBeVisible();
      }
    }
  });

  test('should handle content layout changes', async ({ page }) => {
    await page.goto('/architecture');
    
    // Test desktop layout
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.reload();
    
    // Wait for content to load
    await page.waitForSelector('[data-testid="architecture-item"]', { timeout: 15000 });
    
    // Count items per row on desktop
    const items = page.locator('[data-testid="architecture-item"]');
    const itemCount = await items.count();
    
    if (itemCount > 0) {
      const firstItem = items.first();
      const firstItemBounds = await firstItem.boundingBox();
      
      if (firstItemBounds) {
        // Test tablet layout
        await page.setViewportSize({ width: 768, height: 1024 });
        await page.reload();
        
        // Wait for content to load
        await page.waitForSelector('[data-testid="architecture-item"]', { timeout: 15000 });
        
        const tabletItems = page.locator('[data-testid="architecture-item"]');
        const tabletItemCount = await tabletItems.count();
        
        if (tabletItemCount > 0) {
          await expect(tabletItems.first()).toBeVisible();
        }
        
        // Test mobile layout
        await page.setViewportSize({ width: 375, height: 667 });
        await page.reload();
        
        // Wait for content to load
        await page.waitForSelector('[data-testid="architecture-item"]', { timeout: 15000 });
        
        const mobileItems = page.locator('[data-testid="architecture-item"]');
        const mobileItemCount = await mobileItems.count();
        
        if (mobileItemCount > 0) {
          await expect(mobileItems.first()).toBeVisible();
          
          // Items should stack vertically on mobile
          const mobileItemBounds = await mobileItems.first().boundingBox();
          if (mobileItemBounds) {
            expect(mobileItemBounds.width).toBeLessThanOrEqual(375);
          }
        }
      }
    }
  });
});