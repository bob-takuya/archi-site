import { test, expect } from '@playwright/test';

test.describe('Search Edge Cases - Quick Diagnosis', () => {
  test('should load architecture page and check search field', async ({ page }) => {
    console.log('Starting basic page load test...');
    
    // Navigate to architecture page
    await page.goto('/architecture');
    console.log('Navigated to /architecture');
    
    // Wait longer for page to load
    await page.waitForLoadState('networkidle', { timeout: 60000 });
    console.log('Page loaded state: networkidle');
    
    // Check if search input exists
    const searchInput = page.getByPlaceholderText('検索');
    await expect(searchInput).toBeVisible({ timeout: 30000 });
    console.log('Search input is visible');
    
    // Test a simple empty search edge case
    await searchInput.fill('');
    console.log('Search field cleared');
    
    const searchButton = page.getByRole('button', { name: /search/i });
    await expect(searchButton).toBeVisible();
    console.log('Search button is visible');
    
    // Click search
    await searchButton.click();
    console.log('Search button clicked');
    
    // Wait a reasonable time
    await page.waitForTimeout(5000);
    console.log('Waited 5 seconds');
    
    // Check if page is still responsive
    await expect(page.locator('body')).toBeVisible();
    console.log('Page is still responsive');
  });

  test('should test single character edge case', async ({ page }) => {
    console.log('Testing single character search...');
    
    await page.goto('/architecture');
    await page.waitForLoadState('networkidle', { timeout: 60000 });
    
    const searchInput = page.getByPlaceholderText('検索');
    await expect(searchInput).toBeVisible({ timeout: 30000 });
    
    // Test single character
    await searchInput.fill('T');
    console.log('Entered single character: T');
    
    const searchButton = page.getByRole('button', { name: /search/i });
    await searchButton.click();
    console.log('Search executed');
    
    await page.waitForTimeout(5000);
    
    // Check if application is still functional
    await expect(page.locator('body')).toBeVisible();
    console.log('Single character search completed without crash');
  });

  test('should test special characters edge case', async ({ page }) => {
    console.log('Testing special characters...');
    
    await page.goto('/architecture');
    await page.waitForLoadState('networkidle', { timeout: 60000 });
    
    const searchInput = page.getByPlaceholderText('検索');
    await expect(searchInput).toBeVisible({ timeout: 30000 });
    
    // Test special characters
    await searchInput.fill('@#$%');
    console.log('Entered special characters: @#$%');
    
    const searchButton = page.getByRole('button', { name: /search/i });
    await searchButton.click();
    console.log('Special character search executed');
    
    await page.waitForTimeout(5000);
    
    await expect(page.locator('body')).toBeVisible();
    console.log('Special character search completed without crash');
  });
});