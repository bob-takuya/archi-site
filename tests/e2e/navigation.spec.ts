import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should navigate between main pages', async ({ page }) => {
    // Start at home page
    await page.goto('/');
    await expect(page).toHaveTitle(/Japanese Architecture Map/);
    
    // Navigate to Architecture page
    await page.getByRole('link', { name: /architecture/i }).click();
    await expect(page).toHaveURL(/.*\/architecture/);
    await expect(page.getByRole('heading', { name: /architecture/i })).toBeVisible();
    
    // Navigate to Architects page
    await page.getByRole('link', { name: /architects/i }).click();
    await expect(page).toHaveURL(/.*\/architects/);
    await expect(page.getByRole('heading', { name: /architects/i })).toBeVisible();
    
    // Navigate to Map page
    await page.getByRole('link', { name: /map/i }).click();
    await expect(page).toHaveURL(/.*\/map/);
    await expect(page.getByTestId('map-container')).toBeVisible();
    
    // Navigate back to home
    await page.getByRole('link', { name: /home/i }).click();
    await expect(page).toHaveURL(/.*\/$/);
  });
  
  test('should maintain state between page navigations', async ({ page }) => {
    // Start at architecture page
    await page.goto('/architecture');
    
    // Perform a search
    await page.getByPlaceholderText('検索').fill('Tokyo');
    await page.getByRole('button', { name: /search/i }).click();
    
    // Wait for results
    await page.waitForResponse(response => 
      response.url().includes('/api/architecture') && 
      response.status() === 200
    );
    
    // Navigate to another page and back
    await page.getByRole('link', { name: /map/i }).click();
    await page.getByRole('link', { name: /architecture/i }).click();
    
    // Search term should be preserved
    await expect(page.getByPlaceholderText('検索')).toHaveValue('Tokyo');
    
    // Results should still be filtered
    const items = await page.locator('[data-testid="architecture-item"]').all();
    for (const item of items) {
      const text = await item.textContent();
      expect(text?.includes('Tokyo')).toBeTruthy();
    }
  });
  
  test('should handle browser back/forward navigation', async ({ page }) => {
    // Visit pages in sequence
    await page.goto('/');
    await page.getByRole('link', { name: /architecture/i }).click();
    await expect(page).toHaveURL(/.*\/architecture/);
    
    await page.getByRole('link', { name: /architects/i }).click();
    await expect(page).toHaveURL(/.*\/architects/);
    
    await page.getByRole('link', { name: /map/i }).click();
    await expect(page).toHaveURL(/.*\/map/);
    
    // Go back through history
    await page.goBack();
    await expect(page).toHaveURL(/.*\/architects/);
    
    await page.goBack();
    await expect(page).toHaveURL(/.*\/architecture/);
    
    await page.goBack();
    await expect(page).toHaveURL(/.*\/$/);
    
    // Go forward
    await page.goForward();
    await expect(page).toHaveURL(/.*\/architecture/);
  });
  
  test('should navigate to architecture details page', async ({ page }) => {
    // Start at architecture page
    await page.goto('/architecture');
    
    // Wait for items to load
    await page.waitForSelector('[data-testid="architecture-item"]');
    
    // Click on the first architecture item
    await page.locator('[data-testid="architecture-item"]').first().click();
    
    // Should navigate to detail page
    await expect(page.url()).toContain('/architecture/');
    
    // Detail page should have specific elements
    await expect(page.getByTestId('architecture-details')).toBeVisible();
    await expect(page.getByTestId('architecture-name')).toBeVisible();
    await expect(page.getByTestId('map-container')).toBeVisible();
  });
  
  test('should navigate to architect details page', async ({ page }) => {
    // Start at architects page
    await page.goto('/architects');
    
    // Wait for items to load
    await page.waitForSelector('[data-testid="architect-item"]');
    
    // Click on the first architect item
    await page.locator('[data-testid="architect-item"]').first().click();
    
    // Should navigate to detail page
    await expect(page.url()).toContain('/architects/');
    
    // Detail page should have specific elements
    await expect(page.getByTestId('architect-details')).toBeVisible();
    await expect(page.getByTestId('architect-name')).toBeVisible();
    await expect(page.getByTestId('architect-works')).toBeVisible();
  });
});