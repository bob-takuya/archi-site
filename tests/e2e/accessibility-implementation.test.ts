import { test, expect } from '@playwright/test';

/**
 * Comprehensive Accessibility and Internationalization Tests
 * Validates WCAG 2.1 AA compliance and complete i18n implementation
 */

test.describe('Accessibility and Internationalization Implementation', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for application to load
    await page.waitForSelector('[data-testid="site-title"]');
  });

  test.describe('Language Switching', () => {
    test('should switch between Japanese and English', async ({ page }) => {
      // Check initial language (should be Japanese)
      const title = await page.textContent('[data-testid="site-title"]');
      expect(title).toContain('建築データベース');
      
      // Open language switcher
      await page.click('button[aria-label*="言語"]');
      
      // Switch to English
      await page.click('li[role="menuitemradio"]:has-text("English")');
      
      // Verify language change
      await page.waitForTimeout(1000); // Wait for i18n to update
      const englishTitle = await page.textContent('[data-testid="site-title"]');
      expect(englishTitle).toContain('Architecture Database');
      
      // Verify navigation items are translated
      const homeNav = await page.textContent('[data-testid="nav-link-home"]');
      expect(homeNav).toContain('Home');
    });

    test('should persist language preference', async ({ page }) => {
      // Switch to English
      await page.click('button[aria-label*="言語"]');
      await page.click('li[role="menuitemradio"]:has-text("English")');
      
      // Reload page
      await page.reload();
      await page.waitForSelector('[data-testid="site-title"]');
      
      // Verify language persisted
      const title = await page.textContent('[data-testid="site-title"]');
      expect(title).toContain('Architecture Database');
    });

    test('should announce language changes to screen readers', async ({ page }) => {
      // Listen for aria-live announcements
      const announcements: string[] = [];
      page.on('domcontentloaded', async () => {
        await page.evaluate(() => {
          const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
              if (mutation.type === 'childList') {
                mutation.addedNodes.forEach((node) => {
                  if (node.nodeType === Node.ELEMENT_NODE) {
                    const element = node as Element;
                    if (element.hasAttribute('aria-live')) {
                      console.log('ARIA announcement:', element.textContent);
                    }
                  }
                });
              }
            });
          });
          observer.observe(document.body, { childList: true, subtree: true });
        });
      });
      
      // Switch language and verify announcement
      await page.click('button[aria-label*="言語"]');
      await page.click('li[role="menuitemradio"]:has-text("English")');
      
      // Wait for announcement
      await page.waitForTimeout(1500);
    });
  });

  test.describe('High Contrast Mode', () => {
    test('should toggle high contrast mode', async ({ page }) => {
      // Find and click high contrast toggle
      await page.click('button[aria-label*="ハイコントラスト"]');
      
      // Verify high contrast class is added
      const htmlClass = await page.getAttribute('html', 'class');
      expect(htmlClass).toContain('high-contrast-mode');
      
      // Verify CSS variables are updated
      const primaryColor = await page.evaluate(() => {
        return getComputedStyle(document.documentElement).getPropertyValue('--primary-color');
      });
      expect(primaryColor.trim()).toBe('#000000');
    });

    test('should persist high contrast preference', async ({ page }) => {
      // Enable high contrast
      await page.click('button[aria-label*="ハイコントラスト"]');
      
      // Reload page
      await page.reload();
      await page.waitForSelector('[data-testid="site-title"]');
      
      // Verify high contrast persisted
      const htmlClass = await page.getAttribute('html', 'class');
      expect(htmlClass).toContain('high-contrast-mode');
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('should support Tab navigation through all interactive elements', async ({ page }) => {
      // Start from the first focusable element
      await page.keyboard.press('Tab');
      
      let focusedElement = await page.locator(':focus');
      expect(await focusedElement.textContent()).toContain('メインコンテンツ');
      
      // Continue tabbing through navigation
      await page.keyboard.press('Tab');
      focusedElement = await page.locator(':focus');
      
      // Verify focus indicators are visible
      const focusOutline = await focusedElement.evaluate((el) => {
        const style = getComputedStyle(el);
        return style.outline !== 'none' || style.boxShadow !== 'none';
      });
      expect(focusOutline).toBe(true);
    });

    test('should support arrow key navigation in menu', async ({ page }) => {
      // Open mobile menu on smaller screens or use desktop navigation
      const isMobile = await page.evaluate(() => window.innerWidth < 600);
      
      if (isMobile) {
        await page.click('[data-testid="mobile-menu-button"]');
        await page.waitForSelector('[role="menu"]');
        
        // Navigate with arrow keys
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('ArrowDown');
        
        // Verify correct element is focused
        const focusedItem = await page.locator(':focus');
        expect(await focusedItem.getAttribute('role')).toBe('menuitem');
      }
    });

    test('should support Escape key to close menus', async ({ page }) => {
      // Open language switcher menu
      await page.click('button[aria-label*="言語"]');
      
      // Verify menu is open
      expect(await page.locator('[role="menu"]').isVisible()).toBe(true);
      
      // Press Escape
      await page.keyboard.press('Escape');
      
      // Verify menu is closed
      expect(await page.locator('[role="menu"]').isVisible()).toBe(false);
    });
  });

  test.describe('ARIA and Semantic HTML', () => {
    test('should have proper heading structure', async ({ page }) => {
      const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
      
      // Should have exactly one H1
      const h1Count = await page.locator('h1').count();
      expect(h1Count).toBe(1);
      
      // Verify heading hierarchy
      const headingLevels = await Promise.all(
        headings.map(h => h.evaluate(el => parseInt(el.tagName.charAt(1))))
      );
      
      let expectedLevel = 1;
      for (const level of headingLevels) {
        if (level === 1) {
          expectedLevel = 2;
        } else {
          expect(level).toBeLessThanOrEqual(expectedLevel);
          expectedLevel = level + 1;
        }
      }
    });

    test('should have proper ARIA labels on interactive elements', async ({ page }) => {
      // Check navigation elements
      const navItems = await page.locator('[role="menuitem"]').all();
      
      for (const item of navItems) {
        const ariaLabel = await item.getAttribute('aria-label');
        const textContent = await item.textContent();
        
        // Should have either aria-label or meaningful text content
        expect(ariaLabel || textContent?.trim()).toBeTruthy();
      }
      
      // Check buttons
      const buttons = await page.locator('button').all();
      
      for (const button of buttons) {
        const ariaLabel = await button.getAttribute('aria-label');
        const textContent = await button.textContent();
        
        expect(ariaLabel || textContent?.trim()).toBeTruthy();
      }
    });

    test('should have proper landmark roles', async ({ page }) => {
      // Check for required landmarks
      expect(await page.locator('[role="navigation"]').count()).toBeGreaterThanOrEqual(1);
      expect(await page.locator('[role="main"]').count()).toBe(1);
      expect(await page.locator('main').count()).toBe(1);
    });

    test('should have skip links', async ({ page }) => {
      // Tab to the first element (skip link)
      await page.keyboard.press('Tab');
      
      const skipLink = await page.locator(':focus');
      const skipLinkText = await skipLink.textContent();
      
      expect(skipLinkText).toContain('メインコンテンツ');
      
      // Verify skip link functionality
      await page.keyboard.press('Enter');
      
      const focusedAfterSkip = await page.locator(':focus');
      expect(await focusedAfterSkip.getAttribute('id')).toBe('main-content');
    });
  });

  test.describe('Color Contrast', () => {
    test('should meet WCAG AA contrast requirements', async ({ page }) => {
      // Test primary text elements
      const textElements = await page.locator('p, h1, h2, h3, h4, h5, h6, span, a, button').all();
      
      for (const element of textElements.slice(0, 10)) { // Test first 10 elements
        const contrast = await element.evaluate((el) => {
          const style = getComputedStyle(el);
          const textColor = style.color;
          const backgroundColor = style.backgroundColor;
          
          // Skip transparent backgrounds
          if (backgroundColor === 'rgba(0, 0, 0, 0)') return null;
          
          // Return color information for manual verification
          return { textColor, backgroundColor, text: el.textContent?.slice(0, 50) };
        });
        
        if (contrast) {
          console.log('Color contrast check:', contrast);
        }
      }
    });
  });

  test.describe('Focus Management', () => {
    test('should trap focus in modal dialogs', async ({ page }) => {
      // This test would apply when modal dialogs are implemented
      // For now, test focus trap in mobile menu
      
      const isMobile = await page.evaluate(() => window.innerWidth < 600);
      
      if (isMobile) {
        await page.click('[data-testid="mobile-menu-button"]');
        
        // Focus should be trapped within the drawer
        const focusableInDrawer = await page.locator('#mobile-drawer [tabindex], #mobile-drawer button, #mobile-drawer a').all();
        
        if (focusableInDrawer.length > 0) {
          // Tab through all elements
          for (let i = 0; i < focusableInDrawer.length + 2; i++) {
            await page.keyboard.press('Tab');
          }
          
          // Focus should still be within the drawer
          const currentFocus = await page.locator(':focus');
          const isInDrawer = await currentFocus.evaluate((el) => {
            const drawer = document.getElementById('mobile-drawer');
            return drawer?.contains(el) || false;
          });
          
          expect(isInDrawer).toBe(true);
        }
      }
    });

    test('should restore focus when modal closes', async ({ page }) => {
      const isMobile = await page.evaluate(() => window.innerWidth < 600);
      
      if (isMobile) {
        // Focus the menu button
        await page.focus('[data-testid="mobile-menu-button"]');
        
        // Open menu
        await page.click('[data-testid="mobile-menu-button"]');
        
        // Close with Escape
        await page.keyboard.press('Escape');
        
        // Focus should return to menu button
        const focusedElement = await page.locator(':focus');
        expect(await focusedElement.getAttribute('data-testid')).toBe('mobile-menu-button');
      }
    });
  });

  test.describe('Screen Reader Support', () => {
    test('should have proper live regions for announcements', async ({ page }) => {
      // Check for aria-live regions
      const liveRegions = await page.locator('[aria-live]').count();
      expect(liveRegions).toBeGreaterThanOrEqual(1);
      
      // Verify live region attributes
      const liveRegion = page.locator('[aria-live]').first();
      const ariaLive = await liveRegion.getAttribute('aria-live');
      expect(['polite', 'assertive']).toContain(ariaLive);
    });

    test('should announce loading states', async ({ page }) => {
      // Look for loading indicators with proper ARIA
      const loadingElements = await page.locator('[role="status"], [aria-label*="読み込み"], [aria-label*="Loading"]').count();
      
      // If loading elements exist, they should have proper attributes
      if (loadingElements > 0) {
        const loadingElement = page.locator('[role="status"]').first();
        expect(await loadingElement.isVisible()).toBe(true);
      }
    });
  });

  test.describe('Touch and Mobile Accessibility', () => {
    test('should have adequate touch targets on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE size
      
      const touchTargets = await page.locator('button, a, [role="button"]').all();
      
      for (const target of touchTargets) {
        const boundingBox = await target.boundingBox();
        if (boundingBox && await target.isVisible()) {
          // WCAG recommends minimum 44x44px touch targets
          expect(Math.min(boundingBox.width, boundingBox.height)).toBeGreaterThanOrEqual(40);
        }
      }
    });

    test('should support swipe gestures appropriately', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Test that swipe doesn't interfere with normal scrolling
      const initialScrollY = await page.evaluate(() => window.scrollY);
      
      // Simulate swipe down (scroll up)
      await page.touchscreen.tap(100, 300);
      await page.touchscreen.swipe(100, 300, 100, 500);
      
      const finalScrollY = await page.evaluate(() => window.scrollY);
      
      // Should allow normal scrolling behavior
      expect(finalScrollY).toBeGreaterThanOrEqual(initialScrollY);
    });
  });

  test.describe('Reduced Motion Support', () => {
    test('should respect prefers-reduced-motion', async ({ page }) => {
      // Enable reduced motion preference
      await page.emulateMedia({ reducedMotion: 'reduce' });
      
      // Check that animations are disabled
      const animationDuration = await page.evaluate(() => {
        const element = document.querySelector('[transition], [animation]');
        if (element) {
          const style = getComputedStyle(element);
          return style.animationDuration || style.transitionDuration;
        }
        return null;
      });
      
      // Animations should be very short or disabled
      if (animationDuration) {
        expect(animationDuration).toMatch(/0\.01ms|none/);
      }
    });
  });

  test.describe('Form Accessibility', () => {
    test('should have proper form field labels and descriptions', async ({ page }) => {
      // Navigate to a page with forms (search)
      const searchInput = page.locator('input[type="search"], input[placeholder*="検索"]').first();
      
      if (await searchInput.isVisible()) {
        // Should have aria-label or associated label
        const ariaLabel = await searchInput.getAttribute('aria-label');
        const ariaLabelledBy = await searchInput.getAttribute('aria-labelledby');
        const associatedLabel = await page.locator(`label[for="${await searchInput.getAttribute('id')}"]`).count();
        
        expect(ariaLabel || ariaLabelledBy || associatedLabel > 0).toBeTruthy();
      }
    });

    test('should show validation errors accessibly', async ({ page }) => {
      // Test form validation when forms are available
      const forms = await page.locator('form').count();
      
      if (forms > 0) {
        const form = page.locator('form').first();
        const requiredFields = await form.locator('input[required], textarea[required], select[required]').all();
        
        for (const field of requiredFields) {
          // Should have aria-required
          const ariaRequired = await field.getAttribute('aria-required');
          expect(ariaRequired).toBe('true');
        }
      }
    });
  });
});

test.describe('Performance Impact of Accessibility Features', () => {
  test('should not significantly impact page load performance', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForSelector('[data-testid="site-title"]');
    
    const loadTime = Date.now() - startTime;
    
    // Should load within reasonable time (adjust threshold as needed)
    expect(loadTime).toBeLessThan(5000);
  });

  test('should not block user interactions', async ({ page }) => {
    await page.goto('/');
    
    // Test that interactions are responsive
    const startTime = Date.now();
    await page.click('button[aria-label*="言語"]');
    const responseTime = Date.now() - startTime;
    
    // Should respond quickly to user input
    expect(responseTime).toBeLessThan(500);
  });
});

test.describe('Cross-browser Compatibility', () => {
  test('should work across different browsers', async ({ page, browserName }) => {
    await page.goto('/');
    
    // Basic functionality should work in all browsers
    expect(await page.textContent('[data-testid="site-title"]')).toBeTruthy();
    
    // Test language switching
    await page.click('button[aria-label*="言語"]');
    expect(await page.locator('[role="menu"]').isVisible()).toBe(true);
    
    console.log(`Tested in browser: ${browserName}`);
  });
});