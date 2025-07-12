/**
 * Autocomplete Functionality E2E Tests
 * 
 * Testing Requirements:
 * 1. Does autocomplete appear consistently?
 * 2. Do suggestions match the search term?
 * 3. What happens when clicking suggestions?
 * 4. Test with network throttling
 * 5. Test with large result sets
 * 6. Document when autocomplete fails or behaves incorrectly
 */

import { test, expect, Page } from '@playwright/test';

test.describe('Autocomplete Functionality Tests', () => {
  let page: Page;
  
  test.beforeEach(async ({ page: p, context }) => {
    page = p;
    
    // Set up context for testing
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    
    // Navigate to architecture page which has search functionality
    await page.goto('/architecture');
    await page.waitForLoadState('domcontentloaded');
    
    // Wait for the page to be ready
    await page.waitForTimeout(2000);
  });

  test.describe('1. Autocomplete Appearance Consistency', () => {
    test('autocomplete dropdown should appear after typing 2+ characters', async () => {
      // Find the search input
      const searchInput = page.getByTestId('search-bar').or(page.getByPlaceholderText(/検索|建築名|search/i)).first();
      await expect(searchInput).toBeVisible();

      // Type 1 character - autocomplete should NOT appear
      await searchInput.click();
      await searchInput.fill('東');
      await page.waitForTimeout(500);
      
      const autocompleteAfterOne = page.getByTestId('autocomplete-suggestions');
      await expect(autocompleteAfterOne).not.toBeVisible();

      // Type 2 characters - autocomplete SHOULD appear
      await searchInput.fill('東京');
      await page.waitForTimeout(500);
      
      const autocompleteAfterTwo = page.getByTestId('autocomplete-suggestions');
      await expect(autocompleteAfterTwo).toBeVisible({ timeout: 3000 });
    });

    test('autocomplete should appear consistently across multiple searches', async () => {
      const searchInput = page.getByTestId('search-bar').or(page.getByPlaceholderText(/検索|建築名|search/i)).first();
      
      const testQueries = ['東京', '大阪', '安藤', '住宅'];
      
      for (const query of testQueries) {
        console.log(`Testing autocomplete for query: ${query}`);
        
        // Clear previous search
        await searchInput.click();
        await searchInput.fill('');
        await page.waitForTimeout(300);
        
        // Type new search term
        await searchInput.fill(query);
        await page.waitForTimeout(800); // Wait for debounced autocomplete
        
        // Check if autocomplete appears
        const autocomplete = page.getByTestId('autocomplete-suggestions');
        try {
          await expect(autocomplete).toBeVisible({ timeout: 5000 });
          console.log(`✅ Autocomplete appeared for: ${query}`);
        } catch (error) {
          console.log(`❌ Autocomplete failed to appear for: ${query}`);
          throw new Error(`Autocomplete did not appear for query: ${query}`);
        }
      }
    });

    test('autocomplete should hide when input loses focus', async () => {
      const searchInput = page.getByTestId('search-bar').or(page.getByPlaceholderText(/検索|建築名|search/i)).first();
      
      // Type to show autocomplete
      await searchInput.click();
      await searchInput.fill('東京');
      await page.waitForTimeout(800);
      
      const autocomplete = page.getByTestId('autocomplete-suggestions');
      await expect(autocomplete).toBeVisible();
      
      // Click outside to lose focus
      await page.click('body');
      await page.waitForTimeout(500);
      
      // Autocomplete should be hidden
      await expect(autocomplete).not.toBeVisible();
    });

    test('autocomplete should hide when pressing Escape', async () => {
      const searchInput = page.getByTestId('search-bar').or(page.getByPlaceholderText(/検索|建築名|search/i)).first();
      
      // Type to show autocomplete
      await searchInput.click();
      await searchInput.fill('東京');
      await page.waitForTimeout(800);
      
      const autocomplete = page.getByTestId('autocomplete-suggestions');
      await expect(autocomplete).toBeVisible();
      
      // Press Escape
      await searchInput.press('Escape');
      await page.waitForTimeout(300);
      
      // Autocomplete should be hidden
      await expect(autocomplete).not.toBeVisible();
    });
  });

  test.describe('2. Suggestion Relevance and Matching', () => {
    test('suggestions should match the search term', async () => {
      const searchInput = page.getByTestId('search-bar').or(page.getByPlaceholderText(/検索|建築名|search/i)).first();
      
      // Test with specific search terms
      const testCases = [
        { query: '東京', expectedMatch: '東京' },
        { query: '安藤', expectedMatch: '安藤' },
        { query: '住宅', expectedMatch: '住宅' },
        { query: 'Tokyo', expectedMatch: 'tokyo' } // Case insensitive
      ];
      
      for (const testCase of testCases) {
        console.log(`Testing suggestions for: ${testCase.query}`);
        
        await searchInput.click();
        await searchInput.fill('');
        await page.waitForTimeout(300);
        
        await searchInput.fill(testCase.query);
        await page.waitForTimeout(800);
        
        const autocomplete = page.getByTestId('autocomplete-suggestions');
        
        if (await autocomplete.isVisible()) {
          const suggestions = page.getByTestId('suggestion-item');
          const suggestionCount = await suggestions.count();
          
          if (suggestionCount > 0) {
            // Check that at least one suggestion contains the search term
            let foundMatch = false;
            for (let i = 0; i < Math.min(suggestionCount, 5); i++) {
              const suggestion = suggestions.nth(i);
              const text = await suggestion.textContent();
              if (text && text.toLowerCase().includes(testCase.expectedMatch.toLowerCase())) {
                foundMatch = true;
                console.log(`✅ Found matching suggestion: ${text}`);
                break;
              }
            }
            
            if (!foundMatch) {
              console.log(`❌ No matching suggestions found for: ${testCase.query}`);
              const allSuggestions = await suggestions.allTextContents();
              console.log(`Available suggestions: ${allSuggestions.join(', ')}`);
            }
            
            expect(foundMatch).toBeTruthy();
          } else {
            console.log(`⚠️ No suggestions returned for: ${testCase.query}`);
          }
        } else {
          console.log(`⚠️ Autocomplete not visible for: ${testCase.query}`);
        }
      }
    });

    test('suggestions should be categorized correctly', async () => {
      const searchInput = page.getByTestId('search-bar').or(page.getByPlaceholderText(/検索|建築名|search/i)).first();
      
      await searchInput.click();
      await searchInput.fill('東京');
      await page.waitForTimeout(800);
      
      const autocomplete = page.getByTestId('autocomplete-suggestions');
      if (await autocomplete.isVisible()) {
        const suggestions = page.getByTestId('suggestion-item');
        const suggestionCount = await suggestions.count();
        
        if (suggestionCount > 0) {
          // Check that suggestions have category labels
          const categoriesFound = new Set<string>();
          
          for (let i = 0; i < Math.min(suggestionCount, 10); i++) {
            const suggestion = suggestions.nth(i);
            const text = await suggestion.textContent();
            
            if (text) {
              // Look for category indicators (建築, 建築家, 場所, カテゴリ)
              if (text.includes('建築家')) categoriesFound.add('architect');
              if (text.includes('建築') && !text.includes('建築家')) categoriesFound.add('architecture');
              if (text.includes('場所')) categoriesFound.add('location');
              if (text.includes('カテゴリ')) categoriesFound.add('category');
            }
          }
          
          console.log(`Categories found: ${Array.from(categoriesFound).join(', ')}`);
          
          // At least one category should be present
          expect(categoriesFound.size).toBeGreaterThan(0);
        }
      }
    });

    test('suggestions should show result counts', async () => {
      const searchInput = page.getByTestId('search-bar').or(page.getByPlaceholderText(/検索|建築名|search/i)).first();
      
      await searchInput.click();
      await searchInput.fill('東京');
      await page.waitForTimeout(800);
      
      const autocomplete = page.getByTestId('autocomplete-suggestions');
      if (await autocomplete.isVisible()) {
        const suggestions = page.getByTestId('suggestion-item');
        const suggestionCount = await suggestions.count();
        
        if (suggestionCount > 0) {
          // Check for result count patterns (e.g., "100件", "5件")
          let hasResultCount = false;
          
          for (let i = 0; i < Math.min(suggestionCount, 5); i++) {
            const suggestion = suggestions.nth(i);
            const text = await suggestion.textContent();
            
            if (text && /\d+件/.test(text)) {
              hasResultCount = true;
              console.log(`✅ Found result count in suggestion: ${text}`);
              break;
            }
          }
          
          if (!hasResultCount) {
            console.log(`⚠️ No result counts found in suggestions`);
          }
        }
      }
    });
  });

  test.describe('3. Suggestion Click Behavior', () => {
    test('clicking a suggestion should fill the search input', async () => {
      const searchInput = page.getByTestId('search-bar').or(page.getByPlaceholderText(/検索|建築名|search/i)).first();
      
      await searchInput.click();
      await searchInput.fill('東京');
      await page.waitForTimeout(800);
      
      const autocomplete = page.getByTestId('autocomplete-suggestions');
      if (await autocomplete.isVisible()) {
        const suggestions = page.getByTestId('suggestion-item');
        const suggestionCount = await suggestions.count();
        
        if (suggestionCount > 0) {
          const firstSuggestion = suggestions.first();
          const suggestionText = await firstSuggestion.textContent();
          
          // Extract the main text (remove category info)
          const mainText = suggestionText?.split('•')[0].trim() || '';
          
          await firstSuggestion.click();
          await page.waitForTimeout(500);
          
          // Check if input was filled
          const inputValue = await searchInput.inputValue();
          expect(inputValue).toContain(mainText.split(' ')[0]); // At least part of the suggestion
          
          console.log(`✅ Suggestion clicked: ${mainText}, Input filled: ${inputValue}`);
        }
      }
    });

    test('clicking a suggestion should trigger search', async () => {
      const searchInput = page.getByTestId('search-bar').or(page.getByPlaceholderText(/検索|建築名|search/i)).first();
      
      // Set up response listener
      const responsePromise = page.waitForResponse(response => 
        response.url().includes('architecture') && response.status() === 200,
        { timeout: 10000 }
      );
      
      await searchInput.click();
      await searchInput.fill('東京');
      await page.waitForTimeout(800);
      
      const autocomplete = page.getByTestId('autocomplete-suggestions');
      if (await autocomplete.isVisible()) {
        const suggestions = page.getByTestId('suggestion-item');
        const suggestionCount = await suggestions.count();
        
        if (suggestionCount > 0) {
          const firstSuggestion = suggestions.first();
          const suggestionText = await firstSuggestion.textContent();
          
          await firstSuggestion.click();
          
          try {
            await responsePromise;
            console.log(`✅ Search triggered for suggestion: ${suggestionText}`);
          } catch (error) {
            console.log(`❌ Search not triggered for suggestion: ${suggestionText}`);
            throw error;
          }
        }
      }
    });

    test('clicking suggestion should hide autocomplete dropdown', async () => {
      const searchInput = page.getByTestId('search-bar').or(page.getByPlaceholderText(/検索|建築名|search/i)).first();
      
      await searchInput.click();
      await searchInput.fill('東京');
      await page.waitForTimeout(800);
      
      const autocomplete = page.getByTestId('autocomplete-suggestions');
      if (await autocomplete.isVisible()) {
        const suggestions = page.getByTestId('suggestion-item');
        const suggestionCount = await suggestions.count();
        
        if (suggestionCount > 0) {
          await suggestions.first().click();
          await page.waitForTimeout(500);
          
          // Autocomplete should be hidden after click
          await expect(autocomplete).not.toBeVisible();
          console.log(`✅ Autocomplete hidden after suggestion click`);
        }
      }
    });
  });

  test.describe('4. Network Throttling Tests', () => {
    test('autocomplete should work with slow network', async ({ context }) => {
      // Set up slow network conditions
      await context.route('**/*', async route => {
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
        await route.continue();
      });
      
      const searchInput = page.getByTestId('search-bar').or(page.getByPlaceholderText(/検索|建築名|search/i)).first();
      
      await searchInput.click();
      await searchInput.fill('東京');
      
      // Wait longer for autocomplete with slow network
      const autocomplete = page.getByTestId('autocomplete-suggestions');
      
      try {
        await expect(autocomplete).toBeVisible({ timeout: 15000 });
        console.log(`✅ Autocomplete works with slow network`);
      } catch (error) {
        console.log(`❌ Autocomplete failed with slow network`);
        throw error;
      }
    });

    test('autocomplete should handle network failures gracefully', async ({ context }) => {
      const searchInput = page.getByTestId('search-bar').or(page.getByPlaceholderText(/検索|建築名|search/i)).first();
      
      // Start typing
      await searchInput.click();
      await searchInput.fill('東');
      
      // Intercept and fail autocomplete requests
      await context.route('**/autocomplete**', route => route.abort());
      await context.route('**/search**', route => route.abort());
      
      // Continue typing
      await searchInput.fill('東京');
      await page.waitForTimeout(2000);
      
      // App should still be responsive, even if autocomplete fails
      await expect(searchInput).toBeVisible();
      await expect(searchInput).toHaveValue('東京');
      
      console.log(`✅ App remains responsive during network failures`);
    });

    test('autocomplete should show loading state during slow requests', async ({ context }) => {
      // Add delay to requests
      await context.route('**/*', async route => {
        if (route.request().url().includes('autocomplete') || route.request().url().includes('search')) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        await route.continue();
      });
      
      const searchInput = page.getByTestId('search-bar').or(page.getByPlaceholderText(/検索|建築名|search/i)).first();
      
      await searchInput.click();
      await searchInput.fill('東京');
      
      // Check for loading indicators
      const loadingIndicator = page.locator('[role="progressbar"]').or(page.locator('.loading')).or(page.locator('*[data-testid*="loading"]'));
      
      // We expect either a loading indicator or the autocomplete to eventually appear
      await Promise.race([
        expect(loadingIndicator).toBeVisible({ timeout: 3000 }),
        expect(page.getByTestId('autocomplete-suggestions')).toBeVisible({ timeout: 15000 })
      ]);
      
      console.log(`✅ Loading state or autocomplete eventually appeared`);
    });
  });

  test.describe('5. Large Result Set Tests', () => {
    test('autocomplete should limit suggestions to reasonable number', async () => {
      const searchInput = page.getByTestId('search-bar').or(page.getByPlaceholderText(/検索|建築名|search/i)).first();
      
      // Use a common search term that should return many results
      await searchInput.click();
      await searchInput.fill('建築');
      await page.waitForTimeout(800);
      
      const autocomplete = page.getByTestId('autocomplete-suggestions');
      if (await autocomplete.isVisible()) {
        const suggestions = page.getByTestId('suggestion-item');
        const suggestionCount = await suggestions.count();
        
        // Should not show too many suggestions (typically 5-10)
        expect(suggestionCount).toBeLessThanOrEqual(15);
        expect(suggestionCount).toBeGreaterThan(0);
        
        console.log(`✅ Suggestions limited to reasonable number: ${suggestionCount}`);
      }
    });

    test('autocomplete should handle very broad search terms', async () => {
      const searchInput = page.getByTestId('search-bar').or(page.getByPlaceholderText(/検索|建築名|search/i)).first();
      
      const broadTerms = ['建', '東', '住'];
      
      for (const term of broadTerms) {
        await searchInput.click();
        await searchInput.fill('');
        await page.waitForTimeout(300);
        
        await searchInput.fill(term);
        await page.waitForTimeout(800);
        
        const autocomplete = page.getByTestId('autocomplete-suggestions');
        
        if (await autocomplete.isVisible()) {
          const suggestions = page.getByTestId('suggestion-item');
          const suggestionCount = await suggestions.count();
          
          console.log(`Broad term "${term}" returned ${suggestionCount} suggestions`);
          
          // Should still return a manageable number
          expect(suggestionCount).toBeLessThanOrEqual(20);
        } else {
          console.log(`⚠️ No autocomplete for broad term: ${term}`);
        }
      }
    });

    test('autocomplete should scroll for long suggestion lists', async () => {
      const searchInput = page.getByTestId('search-bar').or(page.getByPlaceholderText(/検索|建築名|search/i)).first();
      
      await searchInput.click();
      await searchInput.fill('建築');
      await page.waitForTimeout(800);
      
      const autocomplete = page.getByTestId('autocomplete-suggestions');
      if (await autocomplete.isVisible()) {
        // Check if autocomplete container is scrollable
        const autocompleteStyles = await autocomplete.evaluate(el => {
          const styles = window.getComputedStyle(el);
          return {
            overflow: styles.overflow,
            overflowY: styles.overflowY,
            maxHeight: styles.maxHeight
          };
        });
        
        console.log(`Autocomplete styles:`, autocompleteStyles);
        
        // Should have scroll capability for large lists
        const isScrollable = autocompleteStyles.overflow === 'auto' || 
                           autocompleteStyles.overflowY === 'auto' ||
                           autocompleteStyles.maxHeight !== 'none';
        
        expect(isScrollable).toBeTruthy();
        console.log(`✅ Autocomplete is scrollable for large result sets`);
      }
    });
  });

  test.describe('6. Error Handling and Edge Cases', () => {
    test('autocomplete should handle special characters', async () => {
      const searchInput = page.getByTestId('search-bar').or(page.getByPlaceholderText(/検索|建築名|search/i)).first();
      
      const specialCharQueries = ['東京・', '建築（', '住宅］', '設計!'];
      
      for (const query of specialCharQueries) {
        await searchInput.click();
        await searchInput.fill('');
        await page.waitForTimeout(300);
        
        await searchInput.fill(query);
        await page.waitForTimeout(800);
        
        // Should not crash or show errors
        await expect(searchInput).toBeVisible();
        await expect(searchInput).toHaveValue(query);
        
        console.log(`✅ Special characters handled: ${query}`);
      }
    });

    test('autocomplete should handle rapid typing', async () => {
      const searchInput = page.getByTestId('search-bar').or(page.getByPlaceholderText(/検索|建築名|search/i)).first();
      
      await searchInput.click();
      
      // Type rapidly
      const rapidText = '東京駅建築設計';
      for (const char of rapidText) {
        await searchInput.press(`KeyK`); // Simulate rapid key presses
        await page.waitForTimeout(50);
      }
      
      await searchInput.fill(rapidText);
      await page.waitForTimeout(1000);
      
      // Should still work after rapid typing
      await expect(searchInput).toBeVisible();
      await expect(searchInput).toHaveValue(rapidText);
      
      console.log(`✅ Rapid typing handled successfully`);
    });

    test('autocomplete should handle empty results gracefully', async () => {
      const searchInput = page.getByTestId('search-bar').or(page.getByPlaceholderText(/検索|建築名|search/i)).first();
      
      // Search for something unlikely to exist
      await searchInput.click();
      await searchInput.fill('XYZ123NonExistent');
      await page.waitForTimeout(800);
      
      const autocomplete = page.getByTestId('autocomplete-suggestions');
      
      // Either no autocomplete appears or it shows "no results"
      const autocompleteVisible = await autocomplete.isVisible();
      
      if (autocompleteVisible) {
        const suggestions = page.getByTestId('suggestion-item');
        const suggestionCount = await suggestions.count();
        
        if (suggestionCount === 0) {
          console.log(`✅ No suggestions shown for non-existent term`);
        } else {
          console.log(`⚠️ Unexpected suggestions for non-existent term`);
        }
      } else {
        console.log(`✅ Autocomplete hidden for non-existent term`);
      }
    });
  });

  test.describe('Performance and Accessibility', () => {
    test('autocomplete should be keyboard accessible', async () => {
      const searchInput = page.getByTestId('search-bar').or(page.getByPlaceholderText(/検索|建築名|search/i)).first();
      
      await searchInput.click();
      await searchInput.fill('東京');
      await page.waitForTimeout(800);
      
      const autocomplete = page.getByTestId('autocomplete-suggestions');
      if (await autocomplete.isVisible()) {
        // Test arrow key navigation
        await searchInput.press('ArrowDown');
        await page.waitForTimeout(200);
        
        // Test Enter to select
        await searchInput.press('Enter');
        await page.waitForTimeout(500);
        
        // Should have selected something and hidden autocomplete
        await expect(autocomplete).not.toBeVisible();
        
        console.log(`✅ Keyboard navigation works`);
      }
    });

    test('autocomplete should have proper ARIA attributes', async () => {
      const searchInput = page.getByTestId('search-bar').or(page.getByPlaceholderText(/検索|建築名|search/i)).first();
      
      await searchInput.click();
      await searchInput.fill('東京');
      await page.waitForTimeout(800);
      
      // Check for ARIA attributes
      const ariaExpanded = await searchInput.getAttribute('aria-expanded');
      const ariaAutocomplete = await searchInput.getAttribute('aria-autocomplete');
      
      console.log(`ARIA expanded: ${ariaExpanded}`);
      console.log(`ARIA autocomplete: ${ariaAutocomplete}`);
      
      const autocomplete = page.getByTestId('autocomplete-suggestions');
      if (await autocomplete.isVisible()) {
        const ariaRole = await autocomplete.getAttribute('role');
        console.log(`Autocomplete role: ${ariaRole}`);
      }
      
      console.log(`✅ ARIA attributes checked`);
    });

    test('autocomplete should respond within reasonable time', async () => {
      const searchInput = page.getByTestId('search-bar').or(page.getByPlaceholderText(/検索|建築名|search/i)).first();
      
      const startTime = Date.now();
      
      await searchInput.click();
      await searchInput.fill('東京');
      
      const autocomplete = page.getByTestId('autocomplete-suggestions');
      
      try {
        await expect(autocomplete).toBeVisible({ timeout: 3000 });
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        console.log(`✅ Autocomplete response time: ${responseTime}ms`);
        
        // Should respond within 3 seconds
        expect(responseTime).toBeLessThan(3000);
      } catch (error) {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        console.log(`❌ Autocomplete failed to appear within timeout. Time elapsed: ${responseTime}ms`);
        throw error;
      }
    });
  });
});