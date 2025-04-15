import { test, expect } from '@playwright/test';

test.describe('Search and Filter', () => {
  test('should filter architectures with search', async ({ page }) => {
    // Go to architecture page
    await page.goto('/architecture');
    
    // Wait for the list to load
    await page.waitForSelector('[data-testid="architecture-item"]');
    
    // Count initial items
    const initialCount = await page.locator('[data-testid="architecture-item"]').count();
    
    // Search for "Tokyo"
    await page.getByPlaceholderText('検索').fill('Tokyo');
    await page.getByRole('button', { name: /search/i }).click();
    
    // Wait for results to update
    await page.waitForResponse(response => 
      response.url().includes('/api/architecture') && 
      response.status() === 200
    );
    
    // Count filtered items (if any results were found)
    const filteredCount = await page.locator('[data-testid="architecture-item"]').count();
    
    if (filteredCount > 0) {
      // All items should contain "Tokyo"
      const items = await page.locator('[data-testid="architecture-item"]').all();
      for (const item of items) {
        const text = await item.textContent();
        expect(text?.toLowerCase().includes('tokyo')).toBeTruthy();
      }
    } else {
      // If no items were found, a no results message should be displayed
      await expect(page.getByText(/no results found/i)).toBeVisible();
    }
  });
  
  test('should apply multiple filter criteria', async ({ page }) => {
    // Go to architecture page
    await page.goto('/architecture');
    
    // Wait for filters to load
    await page.waitForSelector('[data-testid="filter-panel"]');
    
    // Open filter panel if it's not already visible
    const filterToggle = page.getByTestId('filter-toggle');
    if (await filterToggle.isVisible()) {
      await filterToggle.click();
    }
    
    // Select filters
    await page.getByLabel(/prefecture/i).selectOption('Tokyo');
    
    // Apply year range if year filter inputs exist
    const yearFromInput = page.getByLabel(/year from/i);
    const yearToInput = page.getByLabel(/year to/i);
    
    if (await yearFromInput.isVisible() && await yearToInput.isVisible()) {
      await yearFromInput.fill('1950');
      await yearToInput.fill('2000');
    }
    
    // Apply filters
    await page.getByRole('button', { name: /apply filters/i }).click();
    
    // Wait for results to update
    await page.waitForResponse(response => 
      response.url().includes('/api/architecture') && 
      response.status() === 200
    );
    
    // If we got results
    const architectureItems = page.locator('[data-testid="architecture-item"]');
    if (await architectureItems.count() > 0) {
      // All items should be in Tokyo prefecture
      const prefectures = await page.locator('[data-testid="architecture-prefecture"]').all();
      for (const prefecture of prefectures) {
        await expect(prefecture).toContainText('Tokyo');
      }
      
      // If we have year information displayed
      const years = await page.locator('[data-testid="architecture-year"]').all();
      for (const year of years) {
        const yearText = await year.textContent();
        if (yearText) {
          const yearValue = parseInt(yearText.trim());
          expect(yearValue).toBeGreaterThanOrEqual(1950);
          expect(yearValue).toBeLessThanOrEqual(2000);
        }
      }
    } else {
      // If no buildings match our criteria, there should be a message
      await expect(page.getByText(/no results found/i)).toBeVisible();
    }
  });
  
  test('should show message when no results found', async ({ page }) => {
    // Go to architecture page
    await page.goto('/architecture');
    
    // Search for something unlikely to match
    await page.getByPlaceholderText('検索').fill('XYZ123NonExistentBuilding');
    await page.getByRole('button', { name: /search/i }).click();
    
    // Wait for results to update
    await page.waitForResponse(response => 
      response.url().includes('/api/architecture') && 
      response.status() === 200
    );
    
    // Should show no results message
    await expect(page.getByText(/no results found/i)).toBeVisible();
  });
  
  test('should reset filters', async ({ page }) => {
    // Go to architecture page
    await page.goto('/architecture');
    
    // Wait for the list to load
    await page.waitForSelector('[data-testid="architecture-item"]');
    
    // Count initial items
    const initialCount = await page.locator('[data-testid="architecture-item"]').count();
    
    // Search for "Tokyo"
    await page.getByPlaceholderText('検索').fill('Tokyo');
    await page.getByRole('button', { name: /search/i }).click();
    
    // Wait for results to update
    await page.waitForResponse(response => 
      response.url().includes('/api/architecture') && 
      response.status() === 200
    );
    
    // Find and click the reset button
    await page.getByRole('button', { name: /reset|clear/i }).click();
    
    // Wait for results to update again
    await page.waitForResponse(response => 
      response.url().includes('/api/architecture') && 
      response.status() === 200
    );
    
    // Count items after reset
    const afterResetCount = await page.locator('[data-testid="architecture-item"]').count();
    
    // Should return to showing all items
    expect(afterResetCount).toEqual(initialCount);
    
    // Search field should be empty
    await expect(page.getByPlaceholderText('検索')).toHaveValue('');
  });
});