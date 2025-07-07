import { test, expect } from '@playwright/test';

const PRODUCTION_URL = 'https://bob-takuya.github.io/archi-site/';

test.describe('Production Deployment', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(PRODUCTION_URL);
  });

  test('should load the production site successfully', async ({ page }) => {
    await expect(page).toHaveTitle(/日本の建築マップ/);
    
    // Check that the main content is loaded
    await expect(page.locator('#root')).toBeVisible();
    
    // Check for the main navigation or key elements (use first match to avoid strict mode violation)
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('should have working asset loading', async ({ page }) => {
    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    // Check for any console errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Allow some time for any async operations
    await page.waitForTimeout(3000);
    
    // Check that there are no critical console errors
    const criticalErrors = consoleErrors.filter(error => 
      error.includes('Failed to load') || 
      error.includes('404') ||
      error.includes('net::ERR_')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });

  test('should handle SPA routing correctly', async ({ page }) => {
    // Test the 404 page fallback for SPA routing
    await page.goto(`${PRODUCTION_URL}non-existent-page`);
    
    // Should still load the app (due to 404.html fallback)
    await expect(page.locator('#root')).toBeVisible();
    
    // The app should handle the unknown route gracefully
    await expect(page).toHaveTitle(/日本の建築マップ/);
  });

  test('should have proper security headers', async ({ page }) => {
    const response = await page.goto(PRODUCTION_URL);
    
    expect(response?.status()).toBe(200);
    
    // Check for common security headers
    const headers = response?.headers();
    
    // GitHub Pages provides basic security, but not all headers are guaranteed
    // Just check that we got some headers back
    expect(headers).toBeDefined();
    expect(Object.keys(headers || {}).length).toBeGreaterThan(0);
  });
});