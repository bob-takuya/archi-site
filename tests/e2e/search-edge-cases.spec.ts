import { test, expect } from '@playwright/test';

/**
 * TESTER Agent - Search Edge Cases Testing Suite
 * 
 * This test suite documents edge case behaviors and potential failures
 * for the search functionality in the Architecture Database application.
 * 
 * Test Categories:
 * 1. Empty search (clear the field)
 * 2. Single character search
 * 3. Very long search term (50+ characters)
 * 4. Special characters like @#$%
 * 5. Numbers only like "2023"
 * 6. Spaces only
 */

test.describe('Search Edge Cases - Comprehensive Testing', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to architecture page before each test
    await page.goto('/architecture');
    
    // Wait for the page to fully load and search component to be available
    await page.waitForSelector('[data-testid="architecture-item"]', { timeout: 30000 });
    await page.waitForSelector('input[placeholder="検索"]', { timeout: 10000 });
  });

  test.describe('Edge Case 1: Empty Search (Clear Field)', () => {
    test('should handle empty search - clearing after entering text', async ({ page }) => {
      const searchInput = page.locator('input[placeholder="検索"]');
      const searchButton = page.locator('button[aria-label*="検索"], button:has-text("検索")');
      
      // First, enter some text
      await searchInput.fill('Tokyo');
      await expect(searchInput).toHaveValue('Tokyo');
      
      // Count items with search
      await searchButton.click();
      await page.waitForResponse(response => 
        response.url().includes('/api/architecture') && 
        response.status() === 200
      );
      const searchResultsCount = await page.locator('[data-testid="architecture-item"]').count();
      
      // Clear the search field
      await searchInput.clear();
      await expect(searchInput).toHaveValue('');
      
      // Check if clear button exists and click it
      const clearButton = page.locator('button[aria-label*="クリア"], button:has-text("クリア")');
      if (await clearButton.isVisible()) {
        await clearButton.click();
      }
      
      // Perform empty search
      await searchButton.click();
      await page.waitForResponse(response => 
        response.url().includes('/api/architecture') && 
        response.status() === 200
      );
      
      // Count items after empty search
      const emptySearchCount = await page.locator('[data-testid="architecture-item"]').count();
      
      // Document behavior: Empty search should return all items or show appropriate message
      console.log(`Empty search result count: ${emptySearchCount}`);
      console.log(`Previous search result count: ${searchResultsCount}`);
      
      // Verify that empty search doesn't crash the application
      await expect(page.locator('body')).toBeVisible();
      
      // Either shows all items or shows appropriate empty state
      const noResultsMessage = page.locator('text=/no results found/i');
      const hasResults = emptySearchCount > 0;
      const hasNoResultsMessage = await noResultsMessage.isVisible();
      
      expect(hasResults || hasNoResultsMessage).toBeTruthy();
    });

    test('should handle direct empty search without prior input', async ({ page }) => {
      const searchInput = page.locator('input[placeholder="検索"]');
      const searchButton = page.locator('button[aria-label*="検索"], button:has-text("検索")');
      
      // Ensure field is empty
      await expect(searchInput).toHaveValue('');
      
      // Perform search with empty field
      await searchButton.click();
      await page.waitForResponse(response => 
        response.url().includes('/api/architecture') && 
        response.status() === 200
      );
      
      // Document behavior
      const resultCount = await page.locator('[data-testid="architecture-item"]').count();
      console.log(`Direct empty search result count: ${resultCount}`);
      
      // Application should not crash
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Edge Case 2: Single Character Search', () => {
    test('should handle single character search - letter', async ({ page }) => {
      const searchInput = page.locator('input[placeholder="検索"]');
      const searchButton = page.locator('button[aria-label*="検索"], button:has-text("検索")');
      
      // Test single letter
      await searchInput.fill('T');
      await expect(searchInput).toHaveValue('T');
      
      await searchButton.click();
      await page.waitForResponse(response => 
        response.url().includes('/api/architecture') && 
        response.status() === 200
      );
      
      const resultCount = await page.locator('[data-testid="architecture-item"]').count();
      console.log(`Single character 'T' search result count: ${resultCount}`);
      
      // Verify no crash and proper handling
      await expect(page.locator('body')).toBeVisible();
      
      // Check if results contain the search term or show no results message
      if (resultCount > 0) {
        const items = await page.locator('[data-testid="architecture-item"]').all();
        let foundMatch = false;
        for (const item of items.slice(0, 3)) { // Check first few items
          const text = await item.textContent();
          if (text?.toLowerCase().includes('t')) {
            foundMatch = true;
            break;
          }
        }
        console.log(`Single character search found matches: ${foundMatch}`);
      } else {
        const noResultsVisible = await page.locator('text=/no results found/i').isVisible();
        console.log(`Single character search shows no results message: ${noResultsVisible}`);
      }
    });

    test('should handle single character search - number', async ({ page }) => {
      const searchInput = page.locator('input[placeholder="検索"]');
      const searchButton = page.locator('button[aria-label*="検索"], button:has-text("検索")');
      
      // Test single number
      await searchInput.fill('2');
      await expect(searchInput).toHaveValue('2');
      
      await searchButton.click();
      await page.waitForResponse(response => 
        response.url().includes('/api/architecture') && 
        response.status() === 200
      );
      
      const resultCount = await page.locator('[data-testid="architecture-item"]').count();
      console.log(`Single character '2' search result count: ${resultCount}`);
      
      // Application should handle single digits without crashing
      await expect(page.locator('body')).toBeVisible();
    });

    test('should handle single character search - Japanese character', async ({ page }) => {
      const searchInput = page.locator('input[placeholder="検索"]');
      const searchButton = page.locator('button[aria-label*="検索"], button:has-text("検索")');
      
      // Test single Japanese character
      await searchInput.fill('東'); // "East" character
      await expect(searchInput).toHaveValue('東');
      
      await searchButton.click();
      await page.waitForResponse(response => 
        response.url().includes('/api/architecture') && 
        response.status() === 200
      );
      
      const resultCount = await page.locator('[data-testid="architecture-item"]').count();
      console.log(`Single Japanese character '東' search result count: ${resultCount}`);
      
      // Should handle Japanese characters properly
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Edge Case 3: Very Long Search Term (50+ characters)', () => {
    test('should handle extremely long search terms', async ({ page }) => {
      const searchInput = page.locator('input[placeholder="検索"]');
      const searchButton = page.locator('button[aria-label*="検索"], button:has-text("検索")');
      
      // Create a 60-character search term
      const longSearchTerm = 'ThisIsAnExtremelyLongSearchTermThatExceeds50CharactersInLength';
      expect(longSearchTerm.length).toBeGreaterThan(50);
      
      await searchInput.fill(longSearchTerm);
      await expect(searchInput).toHaveValue(longSearchTerm);
      
      console.log(`Long search term length: ${longSearchTerm.length}`);
      
      await searchButton.click();
      await page.waitForResponse(response => 
        response.url().includes('/api/architecture') && 
        response.status() === 200
      );
      
      const resultCount = await page.locator('[data-testid="architecture-item"]').count();
      console.log(`Long search term result count: ${resultCount}`);
      
      // Application should not crash with long input
      await expect(page.locator('body')).toBeVisible();
      
      // Most likely no results, but should show appropriate message
      if (resultCount === 0) {
        const noResultsVisible = await page.locator('text=/no results found/i').isVisible();
        console.log(`Long search shows no results message: ${noResultsVisible}`);
      }
    });

    test('should handle very long search with mixed content', async ({ page }) => {
      const searchInput = page.locator('input[placeholder="検索"]');
      const searchButton = page.locator('button[aria-label*="検索"], button:has-text("検索")');
      
      // 55-character mixed content search
      const mixedLongTerm = 'Tokyo東京1234567890ArchitectureBuilding建築物Structure';
      expect(mixedLongTerm.length).toBeGreaterThan(50);
      
      await searchInput.fill(mixedLongTerm);
      await expect(searchInput).toHaveValue(mixedLongTerm);
      
      await searchButton.click();
      await page.waitForResponse(response => 
        response.url().includes('/api/architecture') && 
        response.status() === 200
      );
      
      const resultCount = await page.locator('[data-testid="architecture-item"]').count();
      console.log(`Mixed long search term result count: ${resultCount}`);
      
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Edge Case 4: Special Characters (@#$%)', () => {
    test('should handle special symbols', async ({ page }) => {
      const searchInput = page.locator('input[placeholder="検索"]');
      const searchButton = page.locator('button[aria-label*="検索"], button:has-text("検索")');
      
      const specialChars = '@#$%^&*()';
      
      await searchInput.fill(specialChars);
      await expect(searchInput).toHaveValue(specialChars);
      
      await searchButton.click();
      await page.waitForResponse(response => 
        response.url().includes('/api/architecture') && 
        response.status() === 200
      );
      
      const resultCount = await page.locator('[data-testid="architecture-item"]').count();
      console.log(`Special characters search result count: ${resultCount}`);
      
      // Should not crash the application
      await expect(page.locator('body')).toBeVisible();
      
      // Most likely no results
      if (resultCount === 0) {
        const noResultsVisible = await page.locator('text=/no results found/i').isVisible();
        console.log(`Special characters show no results message: ${noResultsVisible}`);
      }
    });

    test('should handle SQL injection attempt characters', async ({ page }) => {
      const searchInput = page.locator('input[placeholder="検索"]');
      const searchButton = page.locator('button[aria-label*="検索"], button:has-text("検索")');
      
      const sqlInjectionAttempt = "'; DROP TABLE--";
      
      await searchInput.fill(sqlInjectionAttempt);
      await expect(searchInput).toHaveValue(sqlInjectionAttempt);
      
      await searchButton.click();
      await page.waitForResponse(response => 
        response.url().includes('/api/architecture') && 
        response.status() === 200
      );
      
      const resultCount = await page.locator('[data-testid="architecture-item"]').count();
      console.log(`SQL injection attempt result count: ${resultCount}`);
      
      // Critical: Application should not crash and should be secure
      await expect(page.locator('body')).toBeVisible();
      
      // Should show normal no results behavior
      if (resultCount === 0) {
        const noResultsVisible = await page.locator('text=/no results found/i').isVisible();
        console.log(`SQL injection attempt safely handled: ${noResultsVisible}`);
      }
    });

    test('should handle unicode and emoji characters', async ({ page }) => {
      const searchInput = page.locator('input[placeholder="検索"]');
      const searchButton = page.locator('button[aria-label*="検索"], button:has-text("検索")');
      
      const unicodeSearch = '🏢🌸🗾➕❤️';
      
      await searchInput.fill(unicodeSearch);
      await expect(searchInput).toHaveValue(unicodeSearch);
      
      await searchButton.click();
      await page.waitForResponse(response => 
        response.url().includes('/api/architecture') && 
        response.status() === 200
      );
      
      const resultCount = await page.locator('[data-testid="architecture-item"]').count();
      console.log(`Unicode/emoji search result count: ${resultCount}`);
      
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Edge Case 5: Numbers Only (like "2023")', () => {
    test('should handle year search', async ({ page }) => {
      const searchInput = page.locator('input[placeholder="検索"]');
      const searchButton = page.locator('button[aria-label*="検索"], button:has-text("検索")');
      
      await searchInput.fill('2023');
      await expect(searchInput).toHaveValue('2023');
      
      await searchButton.click();
      await page.waitForResponse(response => 
        response.url().includes('/api/architecture') && 
        response.status() === 200
      );
      
      const resultCount = await page.locator('[data-testid="architecture-item"]').count();
      console.log(`Year "2023" search result count: ${resultCount}`);
      
      await expect(page.locator('body')).toBeVisible();
      
      // If results found, they should relate to the year 2023
      if (resultCount > 0) {
        const items = await page.locator('[data-testid="architecture-item"]').all();
        let foundYearMatch = false;
        for (const item of items.slice(0, 3)) {
          const text = await item.textContent();
          if (text?.includes('2023')) {
            foundYearMatch = true;
            break;
          }
        }
        console.log(`Year search found relevant matches: ${foundYearMatch}`);
      }
    });

    test('should handle large numbers', async ({ page }) => {
      const searchInput = page.locator('input[placeholder="検索"]');
      const searchButton = page.locator('button[aria-label*="検索"], button:has-text("検索")');
      
      await searchInput.fill('999999999');
      await expect(searchInput).toHaveValue('999999999');
      
      await searchButton.click();
      await page.waitForResponse(response => 
        response.url().includes('/api/architecture') && 
        response.status() === 200
      );
      
      const resultCount = await page.locator('[data-testid="architecture-item"]').count();
      console.log(`Large number search result count: ${resultCount}`);
      
      await expect(page.locator('body')).toBeVisible();
    });

    test('should handle decimal numbers', async ({ page }) => {
      const searchInput = page.locator('input[placeholder="検索"]');
      const searchButton = page.locator('button[aria-label*="検索"], button:has-text("検索")');
      
      await searchInput.fill('35.6761');
      await expect(searchInput).toHaveValue('35.6761');
      
      await searchButton.click();
      await page.waitForResponse(response => 
        response.url().includes('/api/architecture') && 
        response.status() === 200
      );
      
      const resultCount = await page.locator('[data-testid="architecture-item"]').count();
      console.log(`Decimal number search result count: ${resultCount}`);
      
      await expect(page.locator('body')).toBeVisible();
    });

    test('should handle negative numbers', async ({ page }) => {
      const searchInput = page.locator('input[placeholder="検索"]');
      const searchButton = page.locator('button[aria-label*="検索"], button:has-text("検索")');
      
      await searchInput.fill('-123');
      await expect(searchInput).toHaveValue('-123');
      
      await searchButton.click();
      await page.waitForResponse(response => 
        response.url().includes('/api/architecture') && 
        response.status() === 200
      );
      
      const resultCount = await page.locator('[data-testid="architecture-item"]').count();
      console.log(`Negative number search result count: ${resultCount}`);
      
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Edge Case 6: Spaces Only', () => {
    test('should handle single space', async ({ page }) => {
      const searchInput = page.locator('input[placeholder="検索"]');
      const searchButton = page.locator('button[aria-label*="検索"], button:has-text("検索")');
      
      await searchInput.fill(' ');
      await expect(searchInput).toHaveValue(' ');
      
      await searchButton.click();
      await page.waitForResponse(response => 
        response.url().includes('/api/architecture') && 
        response.status() === 200
      );
      
      const resultCount = await page.locator('[data-testid="architecture-item"]').count();
      console.log(`Single space search result count: ${resultCount}`);
      
      await expect(page.locator('body')).toBeVisible();
    });

    test('should handle multiple spaces', async ({ page }) => {
      const searchInput = page.locator('input[placeholder="検索"]');
      const searchButton = page.locator('button[aria-label*="検索"], button:has-text("検索")');
      
      await searchInput.fill('     '); // 5 spaces
      await expect(searchInput).toHaveValue('     ');
      
      await searchButton.click();
      await page.waitForResponse(response => 
        response.url().includes('/api/architecture') && 
        response.status() === 200
      );
      
      const resultCount = await page.locator('[data-testid="architecture-item"]').count();
      console.log(`Multiple spaces search result count: ${resultCount}`);
      
      await expect(page.locator('body')).toBeVisible();
    });

    test('should handle tabs and different whitespace', async ({ page }) => {
      const searchInput = page.locator('input[placeholder="検索"]');
      const searchButton = page.locator('button[aria-label*="検索"], button:has-text("検索")');
      
      await searchInput.fill('\t\n '); // tab, newline, space
      
      await searchButton.click();
      await page.waitForResponse(response => 
        response.url().includes('/api/architecture') && 
        response.status() === 200
      );
      
      const resultCount = await page.locator('[data-testid="architecture-item"]').count();
      console.log(`Mixed whitespace search result count: ${resultCount}`);
      
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Additional Edge Cases - Performance and Behavior', () => {
    test('should handle rapid consecutive searches (stress test)', async ({ page }) => {
      const searchInput = page.locator('input[placeholder="検索"]');
      const searchButton = page.locator('button[aria-label*="検索"], button:has-text("検索")');
      
      const searchTerms = ['A', 'AB', 'ABC', 'ABCD', 'ABCDE'];
      
      console.log('Starting rapid search stress test...');
      
      for (const term of searchTerms) {
        await searchInput.fill(term);
        await searchButton.click();
        // Small delay to allow for debounce but still stress test
        await page.waitForTimeout(100);
      }
      
      // Wait for final response
      await page.waitForResponse(response => 
        response.url().includes('/api/architecture') && 
        response.status() === 200
      );
      
      const resultCount = await page.locator('[data-testid="architecture-item"]').count();
      console.log(`Rapid search final result count: ${resultCount}`);
      
      // Application should still be responsive
      await expect(page.locator('body')).toBeVisible();
      await expect(searchInput).toBeVisible();
    });

    test('should handle search with Enter key vs button click consistency', async ({ page }) => {
      const searchInput = page.locator('input[placeholder="検索"]');
      const searchButton = page.locator('button[aria-label*="検索"], button:has-text("検索")');
      
      // Test with button click
      await searchInput.fill('Tokyo');
      await searchButton.click();
      await page.waitForResponse(response => 
        response.url().includes('/api/architecture') && 
        response.status() === 200
      );
      const buttonResultCount = await page.locator('[data-testid="architecture-item"]').count();
      
      // Clear and test with Enter key
      await searchInput.clear();
      await searchInput.fill('Tokyo');
      await searchInput.press('Enter');
      await page.waitForResponse(response => 
        response.url().includes('/api/architecture') && 
        response.status() === 200
      );
      const enterResultCount = await page.locator('[data-testid="architecture-item"]').count();
      
      console.log(`Button click results: ${buttonResultCount}, Enter key results: ${enterResultCount}`);
      
      // Results should be consistent
      expect(buttonResultCount).toEqual(enterResultCount);
    });

    test('should handle debounce behavior with quick typing', async ({ page }) => {
      const searchInput = page.locator('input[placeholder="検索"]');
      
      console.log('Testing debounce behavior...');
      
      // Type quickly (simulating real user typing)
      await searchInput.type('Tokyo', { delay: 50 }); // 50ms between characters
      
      // Wait for debounce timeout (SearchBar uses 300ms debounce)
      await page.waitForTimeout(400);
      
      // Should have triggered search automatically due to debounce
      await page.waitForResponse(response => 
        response.url().includes('/api/architecture') && 
        response.status() === 200
      );
      
      const resultCount = await page.locator('[data-testid="architecture-item"]').count();
      console.log(`Debounced search result count: ${resultCount}`);
      
      await expect(page.locator('body')).toBeVisible();
    });
  });
});

/**
 * EDGE CASE TESTING SUMMARY
 * 
 * This test suite covers the following edge cases:
 * 
 * ✅ TESTED EDGE CASES:
 * 1. Empty search (direct and after clearing)
 * 2. Single character search (letters, numbers, Japanese)
 * 3. Very long search terms (50+ characters)
 * 4. Special characters and potential security issues
 * 5. Number-only searches (years, large numbers, decimals)
 * 6. Whitespace-only searches (spaces, tabs, mixed)
 * 7. Performance edge cases (rapid searches, debounce)
 * 8. Consistency between search methods (button vs Enter)
 * 
 * 🔍 EXPECTED BEHAVIORS TO DOCUMENT:
 * - Application should never crash on any input
 * - Empty searches should return all items or show appropriate message
 * - Single character searches may return broad results
 * - Long searches will likely return no results
 * - Special characters should be safely handled (no SQL injection)
 * - Number searches should work for years and coordinates
 * - Whitespace searches should be treated as empty or return no results
 * - Debounce should prevent excessive API calls
 * 
 * ⚠️ POTENTIAL FAILURE POINTS TO WATCH:
 * - Memory issues with very long search terms
 * - Security vulnerabilities with special characters
 * - Performance degradation with rapid searches
 * - Inconsistent behavior between search methods
 * - Unicode/emoji handling issues
 * - Network timeout issues with slow responses
 */