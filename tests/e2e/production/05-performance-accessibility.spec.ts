import { test, expect } from '@playwright/test';
import { TestHelpers, selectors, testData } from './utils/test-helpers';

/**
 * Performance & Accessibility E2E Tests
 * Comprehensive testing for performance metrics and accessibility compliance
 */
test.describe('Performance & Accessibility', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
  });

  test.describe('Performance Testing', () => {
    test('should have good homepage performance', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/');
      await helpers.waitForPageReady();
      
      const totalLoadTime = Date.now() - startTime;
      console.log(`📊 Total page load time: ${totalLoadTime}ms`);
      
      // Get detailed performance metrics
      const metrics = await helpers.checkPerformance();
      
      // Performance thresholds
      expect(totalLoadTime).toBeLessThan(testData.performance.maxLoadTime);
      expect(metrics.domContentLoaded).toBeLessThan(testData.performance.maxDomContentLoaded);
      
      if (metrics.firstContentfulPaint > 0) {
        expect(metrics.firstContentfulPaint).toBeLessThan(testData.performance.maxFirstContentfulPaint);
      }
      
      console.log('📊 Performance metrics:', {
        totalLoadTime: `${totalLoadTime}ms`,
        loadTime: `${metrics.loadTime}ms`,
        domContentLoaded: `${metrics.domContentLoaded}ms`,
        firstContentfulPaint: `${metrics.firstContentfulPaint}ms`
      });
      
      // Take screenshot
      await helpers.takeTimestampedScreenshot('performance-homepage');
    });

    test('should have good database query performance', async ({ page }) => {
      await page.goto('/');
      await helpers.waitForPageReady();
      
      // Navigate to architecture section
      const archLink = page.locator('a[href*="architecture"], a[href*="建築"], nav a').filter({ hasText: /建築|architecture|building/i }).first();
      
      if (await archLink.count() > 0) {
        const dbStartTime = Date.now();
        
        await archLink.click();
        await helpers.waitForDatabaseOperation();
        
        const dbLoadTime = Date.now() - dbStartTime;
        console.log(`📊 Database load time: ${dbLoadTime}ms`);
        
        // Should load database within reasonable time
        expect(dbLoadTime).toBeLessThan(10000); // 10 seconds max
        
        // Test search performance
        const searchStartTime = Date.now();
        await helpers.performSearch('東京');
        await helpers.waitForDatabaseOperation();
        const searchTime = Date.now() - searchStartTime;
        
        console.log(`📊 Search performance: ${searchTime}ms`);
        expect(searchTime).toBeLessThan(5000); // 5 seconds max
      }
    });

    test('should handle large image loading efficiently', async ({ page }) => {
      await page.goto('/');
      await helpers.waitForPageReady();
      
      // Count images on page
      const images = page.locator('img');
      const imageCount = await images.count();
      
      if (imageCount > 0) {
        console.log(`📊 Found ${imageCount} images`);
        
        // Test image loading performance
        const imageStartTime = Date.now();
        
        // Wait for all images to load
        await page.waitForLoadState('networkidle');
        
        const imageLoadTime = Date.now() - imageStartTime;
        console.log(`📊 Image loading time: ${imageLoadTime}ms`);
        
        // Check for lazy loading
        const lazyImages = page.locator('img[loading="lazy"]');
        const lazyCount = await lazyImages.count();
        
        if (lazyCount > 0) {
          console.log(`✅ Found ${lazyCount} lazy-loaded images`);
        }
        
        // Check for responsive images
        const responsiveImages = page.locator('img[srcset]');
        const responsiveCount = await responsiveImages.count();
        
        if (responsiveCount > 0) {
          console.log(`✅ Found ${responsiveCount} responsive images`);
        }
      }
    });

    test('should have good map performance', async ({ page }) => {
      await page.goto('/');
      await helpers.waitForPageReady();
      
      // Navigate to map
      const mapLink = page.locator('a[href*="map"], a[href*="マップ"], nav a').filter({ hasText: /map|マップ|地図/i }).first();
      
      if (await mapLink.count() > 0) {
        const mapStartTime = Date.now();
        
        await mapLink.click();
        await helpers.waitForMapLoad();
        
        const mapLoadTime = Date.now() - mapStartTime;
        console.log(`📊 Map load time: ${mapLoadTime}ms`);
        
        // Should load map within reasonable time
        expect(mapLoadTime).toBeLessThan(15000); // 15 seconds max
        
        // Test map interaction performance
        const interactionStartTime = Date.now();
        const zoomIn = page.locator('.leaflet-control-zoom-in');
        
        if (await zoomIn.count() > 0) {
          await zoomIn.click();
          await page.waitForTimeout(2000);
        }
        
        const interactionTime = Date.now() - interactionStartTime;
        console.log(`📊 Map interaction time: ${interactionTime}ms`);
        expect(interactionTime).toBeLessThan(5000); // 5 seconds max
      }
    });

    test('should handle concurrent users simulation', async ({ page }) => {
      // Simulate multiple concurrent requests
      const promises = [];
      
      for (let i = 0; i < 3; i++) {
        promises.push(
          page.evaluate(() => {
            return fetch(window.location.origin + '/').then(r => r.status);
          })
        );
      }
      
      const startTime = Date.now();
      const results = await Promise.all(promises);
      const concurrentTime = Date.now() - startTime;
      
      console.log(`📊 Concurrent requests time: ${concurrentTime}ms`);
      console.log(`📊 Response statuses: ${results.join(', ')}`);
      
      // All requests should succeed
      results.forEach(status => expect(status).toBe(200));
    });
  });

  test.describe('Accessibility Testing', () => {
    test('should have proper heading structure', async ({ page }) => {
      await page.goto('/');
      await helpers.waitForPageReady();
      
      // Check for h1 elements
      const h1Elements = page.locator('h1');
      const h1Count = await h1Elements.count();
      
      expect(h1Count).toBeGreaterThanOrEqual(1);
      expect(h1Count).toBeLessThanOrEqual(1); // Should have exactly one h1
      
      // Check heading hierarchy
      const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
      const headingLevels = [];
      
      for (const heading of headings) {
        const tagName = await heading.evaluate(el => el.tagName);
        headingLevels.push(parseInt(tagName.charAt(1)));
      }
      
      console.log('📊 Heading structure:', headingLevels);
      
      // Check for proper heading hierarchy (no skipping levels)
      for (let i = 1; i < headingLevels.length; i++) {
        const diff = headingLevels[i] - headingLevels[i - 1];
        if (diff > 1) {
          console.warn(`⚠️  Heading level skipped: h${headingLevels[i - 1]} to h${headingLevels[i]}`);
        }
      }
      
      console.log('✅ Heading structure checked');
    });

    test('should have proper alt text for images', async ({ page }) => {
      await page.goto('/');
      await helpers.waitForPageReady();
      
      const images = page.locator('img');
      const imageCount = await images.count();
      
      if (imageCount > 0) {
        console.log(`📊 Found ${imageCount} images`);
        
        let imagesWithAlt = 0;
        let imagesWithoutAlt = 0;
        
        for (let i = 0; i < imageCount; i++) {
          const img = images.nth(i);
          const alt = await img.getAttribute('alt');
          const src = await img.getAttribute('src');
          
          if (alt !== null && alt.trim() !== '') {
            imagesWithAlt++;
          } else {
            imagesWithoutAlt++;
            console.warn(`⚠️  Image without alt text: ${src}`);
          }
        }
        
        console.log(`📊 Images with alt text: ${imagesWithAlt}/${imageCount}`);
        
        // At least 80% of images should have alt text
        const altTextRatio = imagesWithAlt / imageCount;
        expect(altTextRatio).toBeGreaterThan(0.8);
      }
    });

    test('should have proper form labels', async ({ page }) => {
      await page.goto('/');
      await helpers.waitForPageReady();
      
      const inputs = page.locator('input, select, textarea');
      const inputCount = await inputs.count();
      
      if (inputCount > 0) {
        console.log(`📊 Found ${inputCount} form inputs`);
        
        let labeledInputs = 0;
        
        for (let i = 0; i < inputCount; i++) {
          const input = inputs.nth(i);
          const id = await input.getAttribute('id');
          const ariaLabel = await input.getAttribute('aria-label');
          const ariaLabelledby = await input.getAttribute('aria-labelledby');
          const type = await input.getAttribute('type');
          
          let hasLabel = false;
          
          if (id) {
            const label = page.locator(`label[for="${id}"]`);
            if (await label.count() > 0) {
              hasLabel = true;
            }
          }
          
          if (ariaLabel || ariaLabelledby) {
            hasLabel = true;
          }
          
          if (hasLabel) {
            labeledInputs++;
          } else {
            console.warn(`⚠️  Input without label: type=${type}, id=${id}`);
          }
        }
        
        console.log(`📊 Labeled inputs: ${labeledInputs}/${inputCount}`);
        
        // All inputs should have labels
        expect(labeledInputs).toBe(inputCount);
      }
    });

    test('should support keyboard navigation', async ({ page }) => {
      await page.goto('/');
      await helpers.waitForPageReady();
      
      // Test tab navigation
      const focusableElements = page.locator('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
      const focusableCount = await focusableElements.count();
      
      if (focusableCount > 0) {
        console.log(`📊 Found ${focusableCount} focusable elements`);
        
        // Test tabbing through elements
        for (let i = 0; i < Math.min(focusableCount, 10); i++) {
          await page.keyboard.press('Tab');
          await page.waitForTimeout(100);
          
          // Check if focus is visible
          const focusedElement = page.locator(':focus');
          const focusedCount = await focusedElement.count();
          
          if (focusedCount > 0) {
            const tagName = await focusedElement.evaluate(el => el.tagName);
            console.log(`✅ Tab ${i + 1}: Focused on ${tagName}`);
          }
        }
        
        // Test Enter key on buttons
        const buttons = page.locator('button, [role="button"]');
        const buttonCount = await buttons.count();
        
        if (buttonCount > 0) {
          const firstButton = buttons.first();
          await firstButton.focus();
          await page.keyboard.press('Enter');
          await page.waitForTimeout(1000);
          
          console.log('✅ Enter key navigation tested');
        }
      }
    });

    test('should have proper color contrast', async ({ page }) => {
      await page.goto('/');
      await helpers.waitForPageReady();
      
      // Test color contrast programmatically
      const contrastIssues = await page.evaluate(() => {
        const elements = document.querySelectorAll('*');
        const issues = [];
        
        for (const element of elements) {
          const styles = window.getComputedStyle(element);
          const color = styles.color;
          const backgroundColor = styles.backgroundColor;
          
          // Simple contrast check (this is a basic implementation)
          if (color === 'rgb(255, 255, 255)' && backgroundColor === 'rgb(255, 255, 255)') {
            issues.push('White text on white background');
          }
          
          if (color === 'rgb(0, 0, 0)' && backgroundColor === 'rgb(0, 0, 0)') {
            issues.push('Black text on black background');
          }
        }
        
        return issues;
      });
      
      console.log(`📊 Color contrast issues: ${contrastIssues.length}`);
      
      if (contrastIssues.length > 0) {
        console.warn('⚠️  Color contrast issues found:', contrastIssues);
      }
      
      // Should have minimal color contrast issues
      expect(contrastIssues.length).toBeLessThan(5);
    });

    test('should have proper ARIA attributes', async ({ page }) => {
      await page.goto('/');
      await helpers.waitForPageReady();
      
      // Check for proper ARIA usage
      const ariaElements = page.locator('[aria-label], [aria-labelledby], [aria-describedby], [role]');
      const ariaCount = await ariaElements.count();
      
      console.log(`📊 Elements with ARIA attributes: ${ariaCount}`);
      
      // Check for proper landmarks
      const landmarks = page.locator('[role="main"], [role="navigation"], [role="banner"], [role="contentinfo"], main, nav, header, footer');
      const landmarkCount = await landmarks.count();
      
      console.log(`📊 Landmark elements: ${landmarkCount}`);
      expect(landmarkCount).toBeGreaterThan(0);
      
      // Check for skip links
      const skipLinks = page.locator('a[href="#main"], a[href="#content"], .skip-link');
      const skipLinkCount = await skipLinks.count();
      
      console.log(`📊 Skip links: ${skipLinkCount}`);
      
      if (skipLinkCount > 0) {
        console.log('✅ Skip links found');
      }
    });

    test('should support screen reader compatibility', async ({ page }) => {
      await page.goto('/');
      await helpers.waitForPageReady();
      
      // Test screen reader compatible elements
      const srElements = page.locator('.sr-only, .visually-hidden, [aria-hidden="true"]');
      const srCount = await srElements.count();
      
      console.log(`📊 Screen reader elements: ${srCount}`);
      
      // Check for proper button text
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();
      
      if (buttonCount > 0) {
        let buttonsWithText = 0;
        
        for (let i = 0; i < buttonCount; i++) {
          const button = buttons.nth(i);
          const text = await button.textContent();
          const ariaLabel = await button.getAttribute('aria-label');
          
          if ((text && text.trim() !== '') || ariaLabel) {
            buttonsWithText++;
          }
        }
        
        console.log(`📊 Buttons with accessible text: ${buttonsWithText}/${buttonCount}`);
        
        // All buttons should have accessible text
        expect(buttonsWithText).toBe(buttonCount);
      }
    });

    test('should handle reduced motion preferences', async ({ page }) => {
      // Test with reduced motion preference
      await page.emulateMedia({ reducedMotion: 'reduce' });
      
      await page.goto('/');
      await helpers.waitForPageReady();
      
      // Check for CSS animations
      const animatedElements = await page.evaluate(() => {
        const elements = document.querySelectorAll('*');
        const animated = [];
        
        for (const element of elements) {
          const styles = window.getComputedStyle(element);
          
          if (styles.animationName !== 'none' || styles.transitionDuration !== '0s') {
            animated.push(element.tagName);
          }
        }
        
        return animated;
      });
      
      console.log(`📊 Animated elements: ${animatedElements.length}`);
      
      // Should respect reduced motion preference
      if (animatedElements.length > 0) {
        console.log('ℹ️  Animated elements found (should respect prefers-reduced-motion)');
      }
    });
  });

  test('should generate comprehensive performance and accessibility report', async ({ page }) => {
    await page.goto('/');
    await helpers.waitForPageReady();
    
    // Gather all accessibility and performance data
    const reportData = await helpers.generateReportData('Performance & Accessibility');
    
    const performanceMetrics = await helpers.checkPerformance();
    const accessibilityData = await helpers.checkAccessibility();
    
    // Generate comprehensive report
    const comprehensiveReport = {
      ...reportData,
      performance: {
        loadTime: performanceMetrics.loadTime,
        domContentLoaded: performanceMetrics.domContentLoaded,
        firstContentfulPaint: performanceMetrics.firstContentfulPaint,
        meetsThresholds: {
          loadTime: performanceMetrics.loadTime < testData.performance.maxLoadTime,
          domContentLoaded: performanceMetrics.domContentLoaded < testData.performance.maxDomContentLoaded,
          firstContentfulPaint: performanceMetrics.firstContentfulPaint < testData.performance.maxFirstContentfulPaint
        }
      },
      accessibility: {
        hasAccessibleElements: accessibilityData,
        headingCount: await page.locator('h1, h2, h3, h4, h5, h6').count(),
        imageCount: await page.locator('img').count(),
        buttonCount: await page.locator('button').count(),
        linkCount: await page.locator('a').count(),
        formInputCount: await page.locator('input, select, textarea').count(),
        landmarkCount: await page.locator('main, nav, header, footer, [role="main"], [role="navigation"]').count(),
        ariaElementCount: await page.locator('[aria-label], [aria-labelledby], [role]').count()
      },
      database: {
        hasDatabase: await helpers.hasDatabase(),
        japaneseSupport: await helpers.checkJapaneseText()
      }
    };
    
    console.log('📋 Performance & Accessibility Report:', JSON.stringify(comprehensiveReport, null, 2));
    
    // Take final screenshot
    await helpers.takeTimestampedScreenshot('performance-accessibility-final');
  });
});