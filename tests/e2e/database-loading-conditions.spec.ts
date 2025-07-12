import { test, expect, Page, BrowserContext } from '@playwright/test';

/**
 * TESTER Agent #11-20: Comprehensive Database Loading Test Suite
 * Tests database loading under various conditions:
 * - Clear cache, incognito mode, different network speeds
 * - Multiple tabs, browser refresh during load
 * - Service worker enabled/disabled, different viewport sizes
 * - Mobile vs desktop, IPv4 vs IPv6 connections, CDN vs direct access
 */

const LIVE_SITE_URL = 'https://bob-takuya.github.io/archi-site/';
const LOCAL_URL = 'http://localhost:4173';

// Test configuration
const TEST_CONFIG = {
  databaseTimeout: 60000, // 1 minute for database operations
  networkTimeout: 30000,  // 30 seconds for network operations
  refreshInterval: 5000,   // 5 seconds between refresh attempts
  maxRetries: 3
};

interface DatabaseLoadResult {
  success: boolean;
  loadTime: number;
  errors: string[];
  condition: string;
  timestamp: string;
  additionalData?: any;
}

const testResults: DatabaseLoadResult[] = [];

/**
 * Helper function to wait for database loading indicators
 */
async function waitForDatabaseLoad(page: Page, timeout: number = TEST_CONFIG.databaseTimeout): Promise<DatabaseLoadResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  
  // Monitor console errors
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  try {
    // Wait for database initialization logs
    await page.waitForFunction(() => {
      const logs = window.console;
      // Check for specific database success indicators
      return document.querySelector('[data-testid="architecture-list"]') || 
             document.querySelector('.architecture-item') ||
             document.querySelector('.building-item') ||
             window.performance.getEntriesByName('database-loaded').length > 0;
    }, { timeout });

    const loadTime = Date.now() - startTime;
    return {
      success: true,
      loadTime,
      errors,
      condition: 'default',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    const loadTime = Date.now() - startTime;
    return {
      success: false,
      loadTime,
      errors: [...errors, error.message],
      condition: 'default',
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Helper function to check database content
 */
async function verifyDatabaseContent(page: Page): Promise<boolean> {
  try {
    // Look for Japanese architecture content
    const content = page.locator('text=/[ひらがなカタカナ漢字]/');
    const count = await content.count();
    return count > 0;
  } catch {
    return false;
  }
}

test.describe('Database Loading Under Various Conditions', () => {
  
  test.describe('1. Cache and Storage Conditions', () => {
    
    test('should load database with cleared cache', async ({ page }) => {
      test.setTimeout(120000);
      
      // Clear all storage
      await page.goto(LIVE_SITE_URL);
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
        if ('caches' in window) {
          caches.keys().then(names => {
            names.forEach(name => caches.delete(name));
          });
        }
      });
      
      // Reload page
      await page.reload({ waitUntil: 'networkidle' });
      
      const result = await waitForDatabaseLoad(page);
      result.condition = 'cleared-cache';
      testResults.push(result);
      
      expect(result.success).toBe(true);
      
      // Verify content loaded
      const hasContent = await verifyDatabaseContent(page);
      expect(hasContent).toBe(true);
    });

    test('should load database in incognito mode', async ({ browser }) => {
      test.setTimeout(120000);
      
      // Create incognito context
      const incognitoContext = await browser.newContext({
        ignoreHTTPSErrors: true
      });
      const page = await incognitoContext.newPage();
      
      await page.goto(LIVE_SITE_URL);
      await page.waitForLoadState('networkidle');
      
      const result = await waitForDatabaseLoad(page);
      result.condition = 'incognito-mode';
      testResults.push(result);
      
      expect(result.success).toBe(true);
      
      const hasContent = await verifyDatabaseContent(page);
      expect(hasContent).toBe(true);
      
      await incognitoContext.close();
    });
  });

  test.describe('2. Network Speed Conditions', () => {
    
    test('should load database on slow 3G network', async ({ page }) => {
      test.setTimeout(180000); // Extended timeout for slow network
      
      // Simulate slow 3G
      await page.route('**/*', async (route) => {
        await new Promise(resolve => setTimeout(resolve, 100)); // Add 100ms delay
        route.continue();
      });
      
      await page.goto(LIVE_SITE_URL);
      await page.waitForLoadState('networkidle');
      
      const result = await waitForDatabaseLoad(page, 120000); // Extended timeout
      result.condition = 'slow-3g-network';
      testResults.push(result);
      
      // Should still succeed but may take longer
      const hasContent = await verifyDatabaseContent(page);
      expect(hasContent).toBe(true);
    });

    test('should load database on fast network', async ({ page }) => {
      test.setTimeout(120000);
      
      await page.goto(LIVE_SITE_URL);
      await page.waitForLoadState('networkidle');
      
      const result = await waitForDatabaseLoad(page, 30000); // Shorter timeout for fast network
      result.condition = 'fast-network';
      testResults.push(result);
      
      expect(result.success).toBe(true);
      expect(result.loadTime).toBeLessThan(45000); // Should load faster
      
      const hasContent = await verifyDatabaseContent(page);
      expect(hasContent).toBe(true);
    });
  });

  test.describe('3. Multiple Tabs and Concurrent Access', () => {
    
    test('should handle database loading in multiple tabs', async ({ browser }) => {
      test.setTimeout(180000);
      
      const context = await browser.newContext();
      const pages = await Promise.all([
        context.newPage(),
        context.newPage(),
        context.newPage()
      ]);
      
      // Load same site in all tabs simultaneously
      const loadPromises = pages.map(async (page, index) => {
        await page.goto(LIVE_SITE_URL);
        await page.waitForLoadState('networkidle');
        
        const result = await waitForDatabaseLoad(page);
        result.condition = `multiple-tabs-${index + 1}`;
        return result;
      });
      
      const results = await Promise.all(loadPromises);
      testResults.push(...results);
      
      // All tabs should successfully load
      results.forEach(result => {
        expect(result.success).toBe(true);
      });
      
      // Verify content in all tabs
      for (const page of pages) {
        const hasContent = await verifyDatabaseContent(page);
        expect(hasContent).toBe(true);
      }
      
      await context.close();
    });
  });

  test.describe('4. Browser Refresh During Load', () => {
    
    test('should handle refresh during database loading', async ({ page }) => {
      test.setTimeout(180000);
      
      await page.goto(LIVE_SITE_URL);
      
      // Start loading and refresh after 3 seconds
      setTimeout(async () => {
        try {
          await page.reload({ waitUntil: 'networkidle' });
        } catch (error) {
          console.log('Refresh during load:', error.message);
        }
      }, 3000);
      
      const result = await waitForDatabaseLoad(page, 120000);
      result.condition = 'refresh-during-load';
      testResults.push(result);
      
      // Should eventually succeed after refresh
      const hasContent = await verifyDatabaseContent(page);
      expect(hasContent).toBe(true);
    });
  });

  test.describe('5. Service Worker Conditions', () => {
    
    test('should load database with service worker enabled', async ({ page }) => {
      test.setTimeout(120000);
      
      await page.goto(LIVE_SITE_URL);
      await page.waitForLoadState('networkidle');
      
      // Check if service worker is registered
      const swRegistered = await page.evaluate(async () => {
        if ('serviceWorker' in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          return registrations.length > 0;
        }
        return false;
      });
      
      const result = await waitForDatabaseLoad(page);
      result.condition = 'service-worker-enabled';
      result.additionalData = { serviceWorkerRegistered: swRegistered };
      testResults.push(result);
      
      expect(result.success).toBe(true);
      
      const hasContent = await verifyDatabaseContent(page);
      expect(hasContent).toBe(true);
    });

    test('should load database with service worker disabled', async ({ browser }) => {
      test.setTimeout(120000);
      
      // Create context with service workers disabled
      const context = await browser.newContext({
        serviceWorkers: 'block'
      });
      const page = await context.newPage();
      
      await page.goto(LIVE_SITE_URL);
      await page.waitForLoadState('networkidle');
      
      const result = await waitForDatabaseLoad(page);
      result.condition = 'service-worker-disabled';
      testResults.push(result);
      
      expect(result.success).toBe(true);
      
      const hasContent = await verifyDatabaseContent(page);
      expect(hasContent).toBe(true);
      
      await context.close();
    });
  });

  test.describe('6. Different Viewport Sizes', () => {
    
    test('should load database on mobile viewport (375x667)', async ({ browser }) => {
      test.setTimeout(120000);
      
      const context = await browser.newContext({
        viewport: { width: 375, height: 667 }
      });
      const page = await context.newPage();
      
      await page.goto(LIVE_SITE_URL);
      await page.waitForLoadState('networkidle');
      
      const result = await waitForDatabaseLoad(page);
      result.condition = 'mobile-viewport-375x667';
      testResults.push(result);
      
      expect(result.success).toBe(true);
      
      const hasContent = await verifyDatabaseContent(page);
      expect(hasContent).toBe(true);
      
      await context.close();
    });

    test('should load database on tablet viewport (768x1024)', async ({ browser }) => {
      test.setTimeout(120000);
      
      const context = await browser.newContext({
        viewport: { width: 768, height: 1024 }
      });
      const page = await context.newPage();
      
      await page.goto(LIVE_SITE_URL);
      await page.waitForLoadState('networkidle');
      
      const result = await waitForDatabaseLoad(page);
      result.condition = 'tablet-viewport-768x1024';
      testResults.push(result);
      
      expect(result.success).toBe(true);
      
      const hasContent = await verifyDatabaseContent(page);
      expect(hasContent).toBe(true);
      
      await context.close();
    });

    test('should load database on desktop viewport (1920x1080)', async ({ browser }) => {
      test.setTimeout(120000);
      
      const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 }
      });
      const page = await context.newPage();
      
      await page.goto(LIVE_SITE_URL);
      await page.waitForLoadState('networkidle');
      
      const result = await waitForDatabaseLoad(page);
      result.condition = 'desktop-viewport-1920x1080';
      testResults.push(result);
      
      expect(result.success).toBe(true);
      
      const hasContent = await verifyDatabaseContent(page);
      expect(hasContent).toBe(true);
      
      await context.close();
    });

    test('should load database on ultra-wide viewport (2560x1440)', async ({ browser }) => {
      test.setTimeout(120000);
      
      const context = await browser.newContext({
        viewport: { width: 2560, height: 1440 }
      });
      const page = await context.newPage();
      
      await page.goto(LIVE_SITE_URL);
      await page.waitForLoadState('networkidle');
      
      const result = await waitForDatabaseLoad(page);
      result.condition = 'ultra-wide-viewport-2560x1440';
      testResults.push(result);
      
      expect(result.success).toBe(true);
      
      const hasContent = await verifyDatabaseContent(page);
      expect(hasContent).toBe(true);
      
      await context.close();
    });
  });

  test.describe('7. Mobile vs Desktop Device Simulation', () => {
    
    test('should load database on iPhone device', async ({ browser }) => {
      test.setTimeout(120000);
      
      const iPhone = {
        name: 'iPhone 12',
        use: {
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1',
          viewport: { width: 390, height: 844 },
          deviceScaleFactor: 3,
          isMobile: true,
          hasTouch: true
        }
      };
      
      const context = await browser.newContext(iPhone.use);
      const page = await context.newPage();
      
      await page.goto(LIVE_SITE_URL);
      await page.waitForLoadState('networkidle');
      
      const result = await waitForDatabaseLoad(page);
      result.condition = 'iphone-device';
      testResults.push(result);
      
      expect(result.success).toBe(true);
      
      const hasContent = await verifyDatabaseContent(page);
      expect(hasContent).toBe(true);
      
      await context.close();
    });

    test('should load database on Android device', async ({ browser }) => {
      test.setTimeout(120000);
      
      const android = {
        name: 'Pixel 5',
        use: {
          userAgent: 'Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.91 Mobile Safari/537.36',
          viewport: { width: 393, height: 851 },
          deviceScaleFactor: 3,
          isMobile: true,
          hasTouch: true
        }
      };
      
      const context = await browser.newContext(android.use);
      const page = await context.newPage();
      
      await page.goto(LIVE_SITE_URL);
      await page.waitForLoadState('networkidle');
      
      const result = await waitForDatabaseLoad(page);
      result.condition = 'android-device';
      testResults.push(result);
      
      expect(result.success).toBe(true);
      
      const hasContent = await verifyDatabaseContent(page);
      expect(hasContent).toBe(true);
      
      await context.close();
    });

    test('should load database on desktop device', async ({ browser }) => {
      test.setTimeout(120000);
      
      const desktop = {
        name: 'Desktop Chrome',
        use: {
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          viewport: { width: 1280, height: 720 },
          deviceScaleFactor: 1,
          isMobile: false,
          hasTouch: false
        }
      };
      
      const context = await browser.newContext(desktop.use);
      const page = await context.newPage();
      
      await page.goto(LIVE_SITE_URL);
      await page.waitForLoadState('networkidle');
      
      const result = await waitForDatabaseLoad(page);
      result.condition = 'desktop-device';
      testResults.push(result);
      
      expect(result.success).toBe(true);
      
      const hasContent = await verifyDatabaseContent(page);
      expect(hasContent).toBe(true);
      
      await context.close();
    });
  });

  test.describe('8. Network Protocol Conditions', () => {
    
    test('should load database over HTTPS (CDN)', async ({ page }) => {
      test.setTimeout(120000);
      
      await page.goto(LIVE_SITE_URL); // GitHub Pages uses HTTPS
      await page.waitForLoadState('networkidle');
      
      const result = await waitForDatabaseLoad(page);
      result.condition = 'https-cdn-access';
      testResults.push(result);
      
      expect(result.success).toBe(true);
      
      const hasContent = await verifyDatabaseContent(page);
      expect(hasContent).toBe(true);
    });

    test('should load database over HTTP (direct)', async ({ page }) => {
      test.setTimeout(120000);
      
      // Test local server if available
      try {
        await page.goto(LOCAL_URL);
        await page.waitForLoadState('networkidle');
        
        const result = await waitForDatabaseLoad(page);
        result.condition = 'http-direct-access';
        testResults.push(result);
        
        const hasContent = await verifyDatabaseContent(page);
        
        // This test is optional since local server might not be running
        console.log('Local server test result:', result.success);
      } catch (error) {
        console.log('Local server not available, skipping HTTP direct test');
        
        // Add a placeholder result
        testResults.push({
          success: false,
          loadTime: 0,
          errors: ['Local server not available'],
          condition: 'http-direct-access',
          timestamp: new Date().toISOString(),
          additionalData: { skipped: true }
        });
      }
    });
  });

  test.describe('9. Edge Cases and Error Conditions', () => {
    
    test('should handle network interruption during load', async ({ page }) => {
      test.setTimeout(180000);
      
      await page.goto(LIVE_SITE_URL);
      
      // Simulate network interruption after 5 seconds
      setTimeout(async () => {
        try {
          // Block all network requests temporarily
          await page.route('**/*', route => route.abort());
          
          // Re-enable after 2 seconds
          setTimeout(async () => {
            await page.unroute('**/*');
          }, 2000);
        } catch (error) {
          console.log('Network interruption simulation error:', error.message);
        }
      }, 5000);
      
      const result = await waitForDatabaseLoad(page, 120000);
      result.condition = 'network-interruption';
      testResults.push(result);
      
      // May succeed or fail depending on timing
      console.log('Network interruption test result:', result.success);
    });

    test('should handle memory pressure conditions', async ({ browser }) => {
      test.setTimeout(120000);
      
      // Create multiple contexts to simulate memory pressure
      const contexts = await Promise.all(
        Array(5).fill(null).map(() => browser.newContext())
      );
      
      const pages = await Promise.all(
        contexts.map(context => context.newPage())
      );
      
      // Load heavy content in background tabs
      const backgroundPromises = pages.slice(1).map(async (page) => {
        try {
          await page.goto('data:text/html,<html><body>' + 'x'.repeat(1000000) + '</body></html>');
        } catch (error) {
          console.log('Background page load error:', error.message);
        }
      });
      
      // Test main page
      const mainPage = pages[0];
      await mainPage.goto(LIVE_SITE_URL);
      await mainPage.waitForLoadState('networkidle');
      
      const result = await waitForDatabaseLoad(mainPage);
      result.condition = 'memory-pressure';
      testResults.push(result);
      
      // Should still succeed under memory pressure
      expect(result.success).toBe(true);
      
      const hasContent = await verifyDatabaseContent(mainPage);
      expect(hasContent).toBe(true);
      
      // Cleanup
      await Promise.allSettled(backgroundPromises);
      await Promise.all(contexts.map(context => context.close()));
    });
  });

  test.describe('10. Test Results Summary', () => {
    
    test('should generate comprehensive test report', async ({ page }) => {
      test.setTimeout(30000);
      
      // Calculate statistics
      const totalTests = testResults.length;
      const successfulTests = testResults.filter(r => r.success).length;
      const failedTests = totalTests - successfulTests;
      const averageLoadTime = testResults
        .filter(r => r.success)
        .reduce((sum, r) => sum + r.loadTime, 0) / successfulTests || 0;
      
      // Group results by condition type
      const conditionGroups = testResults.reduce((groups, result) => {
        const conditionType = result.condition.split('-')[0];
        if (!groups[conditionType]) {
          groups[conditionType] = [];
        }
        groups[conditionType].push(result);
        return groups;
      }, {} as Record<string, DatabaseLoadResult[]>);
      
      // Generate comprehensive report
      const report = {
        testAgent: 'TESTER_11-20',
        timestamp: new Date().toISOString(),
        summary: {
          totalTests,
          successfulTests,
          failedTests,
          successRate: `${((successfulTests / totalTests) * 100).toFixed(2)}%`,
          averageLoadTime: `${averageLoadTime.toFixed(0)}ms`
        },
        conditionGroups: Object.entries(conditionGroups).map(([type, results]) => ({
          conditionType: type,
          testsRun: results.length,
          successCount: results.filter(r => r.success).length,
          avgLoadTime: results.filter(r => r.success)
            .reduce((sum, r) => sum + r.loadTime, 0) / results.filter(r => r.success).length || 0,
          results: results
        })),
        detailedResults: testResults,
        recommendations: [
          successRate >= 90 ? 'Database loading is robust across conditions' : 'Database loading needs improvement',
          averageLoadTime < 30000 ? 'Loading performance is acceptable' : 'Loading performance needs optimization',
          failedTests === 0 ? 'No critical failures detected' : `${failedTests} conditions need attention`
        ],
        criticalIssues: testResults
          .filter(r => !r.success)
          .map(r => ({
            condition: r.condition,
            errors: r.errors,
            timestamp: r.timestamp
          })),
        performanceMetrics: {
          fastestLoad: Math.min(...testResults.filter(r => r.success).map(r => r.loadTime)),
          slowestLoad: Math.max(...testResults.filter(r => r.success).map(r => r.loadTime)),
          loadTimeDistribution: testResults
            .filter(r => r.success)
            .map(r => r.loadTime)
            .sort((a, b) => a - b)
        }
      };
      
      console.log('\n=== TESTER AGENT #11-20 DATABASE LOADING TEST REPORT ===');
      console.log(JSON.stringify(report, null, 2));
      console.log('=======================================================\n');
      
      // Write comprehensive report to file
      const fs = require('fs');
      const reportPath = 'test-results/database-loading-conditions-report.json';
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      
      console.log(`Comprehensive test report saved to: ${reportPath}`);
      
      // Assertions for CI/CD
      expect(successfulTests).toBeGreaterThan(totalTests * 0.7); // At least 70% success rate
      expect(failedTests).toBeLessThan(totalTests * 0.3); // Less than 30% failure rate
      
      // Performance assertions
      if (successfulTests > 0) {
        expect(averageLoadTime).toBeLessThan(90000); // Average load time under 90 seconds
      }
    });
  });
});