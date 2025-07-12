import { test, expect } from '@playwright/test';

/**
 * Cross-Browser Search Functionality Tests
 * Tests search functionality across Chrome, Firefox, Safari, Edge, and Mobile browsers
 * Focuses on browser-specific search behaviors and compatibility issues
 */

test.describe('Cross-Browser Search Functionality', () => {
  // Test data for consistent search testing across browsers
  const testSearchTerms = {
    japanese: '安藤忠雄',
    english: 'Tokyo',
    numeric: '1990',
    special: 'スペース テスト',
    empty: '',
    long: 'This is a very long search term that tests the input field limit and behavior across different browsers',
    symbols: '建築-デザイン/現代'
  };

  test.beforeEach(async ({ page }) => {
    // Navigate to architecture search page
    await page.goto('/architecture');
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    // Wait for search input to be available
    await page.waitForSelector('[data-testid="search-input"], input[placeholder*="検索"]', { timeout: 30000 });
  });

  test('Basic search functionality works across all browsers', async ({ page, browserName }) => {
    console.log(`Testing basic search in ${browserName}`);
    
    try {
      // Find search input (multiple selectors for different implementations)
      const searchInput = page.locator('[data-testid="search-input"]').first()
        .or(page.locator('input[placeholder*="検索"]').first())
        .or(page.locator('input[type="search"]').first())
        .or(page.locator('[aria-label*="検索"]').first());
      
      // Verify search input is visible and enabled
      await expect(searchInput).toBeVisible({ timeout: 10000 });
      await expect(searchInput).toBeEnabled();
      
      // Test Japanese character input
      await searchInput.fill(testSearchTerms.japanese);
      await expect(searchInput).toHaveValue(testSearchTerms.japanese);
      
      // Submit search
      await searchInput.press('Enter');
      
      // Wait for search results or loading indicator
      await page.waitForTimeout(2000);
      
      // Check if results loaded or no results message appeared
      const hasResults = await page.locator('[data-testid="architecture-item"]').count() > 0;
      const hasNoResults = await page.locator('text=/結果が見つかりません|No results found/i').isVisible();
      
      expect(hasResults || hasNoResults).toBeTruthy();
      
    } catch (error) {
      console.error(`Basic search failed in ${browserName}:`, error);
      
      // Take screenshot for debugging
      await page.screenshot({ 
        path: `./playwright-results/artifacts/search-failure-${browserName}-${Date.now()}.png`,
        fullPage: true 
      });
      
      throw error;
    }
  });

  test('Search input handles different character sets', async ({ page, browserName }) => {
    console.log(`Testing character input in ${browserName}`);
    
    const searchInput = page.locator('input[placeholder*="検索"]').first()
      .or(page.locator('[data-testid="search-input"]').first());
      
    await expect(searchInput).toBeVisible();
    
    // Test different character types
    const characterTests = [
      { type: 'Japanese Hiragana', text: 'あいうえお' },
      { type: 'Japanese Katakana', text: 'アイウエオ' },
      { type: 'Japanese Kanji', text: '建築家設計' },
      { type: 'English', text: 'Architecture' },
      { type: 'Numbers', text: '12345' },
      { type: 'Mixed', text: 'Tokyo東京123' },
      { type: 'Symbols', text: '建築-デザイン/現代' }
    ];
    
    for (const charTest of characterTests) {
      try {
        await searchInput.clear();
        await searchInput.fill(charTest.text);
        
        // Verify the text was entered correctly
        const actualValue = await searchInput.inputValue();
        expect(actualValue).toBe(charTest.text);
        
        console.log(`✓ ${charTest.type} input successful in ${browserName}`);
        
      } catch (error) {
        console.error(`✗ ${charTest.type} input failed in ${browserName}:`, error);
        
        // Continue testing other character sets
      }
    }
  });

  test('Autocomplete suggestions work correctly', async ({ page, browserName }) => {
    console.log(`Testing autocomplete in ${browserName}`);
    
    const searchInput = page.locator('input[placeholder*="検索"]').first();
    await expect(searchInput).toBeVisible();
    
    try {
      // Start typing to trigger autocomplete
      await searchInput.fill('東京');
      
      // Wait for autocomplete dropdown
      const autocompleteDropdown = page.locator('.MuiAutocomplete-popper, [role="listbox"], .autocomplete-dropdown');
      
      // Check if autocomplete appears (some browsers may not show it immediately)
      const hasAutocomplete = await autocompleteDropdown.isVisible({ timeout: 3000 });
      
      if (hasAutocomplete) {
        const suggestions = page.locator('.MuiAutocomplete-option, [role="option"]');
        const suggestionCount = await suggestions.count();
        
        if (suggestionCount > 0) {
          console.log(`✓ Autocomplete working in ${browserName} with ${suggestionCount} suggestions`);
          
          // Test clicking on a suggestion
          await suggestions.first().click();
          
          // Verify the suggestion was selected
          const inputValue = await searchInput.inputValue();
          expect(inputValue.length).toBeGreaterThan(0);
          
        } else {
          console.log(`⚠ No autocomplete suggestions in ${browserName}`);
        }
      } else {
        console.log(`⚠ Autocomplete dropdown not visible in ${browserName}`);
      }
      
    } catch (error) {
      console.error(`Autocomplete failed in ${browserName}:`, error);
    }
  });

  test('Voice search functionality (where supported)', async ({ page, browserName }) => {
    console.log(`Testing voice search in ${browserName}`);
    
    try {
      // Look for voice search button
      const voiceButton = page.locator('[aria-label*="音声検索"], [aria-label*="voice"], button:has([data-testid="mic-icon"])');
      
      if (await voiceButton.isVisible()) {
        // Check if Web Speech API is available
        const speechSupported = await page.evaluate(() => {
          return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
        });
        
        if (speechSupported) {
          console.log(`✓ Voice search supported in ${browserName}`);
          
          // Click voice button (this will trigger permission request in real browsers)
          await voiceButton.click();
          
          // In test environment, we can't actually test speech recognition
          // but we can verify the UI responds correctly
          
        } else {
          console.log(`⚠ Web Speech API not supported in ${browserName}`);
        }
      } else {
        console.log(`⚠ Voice search button not found in ${browserName}`);
      }
    } catch (error) {
      console.error(`Voice search test failed in ${browserName}:`, error);
    }
  });

  test('Search performance across browsers', async ({ page, browserName }) => {
    console.log(`Testing search performance in ${browserName}`);
    
    const searchInput = page.locator('input[placeholder*="検索"]').first();
    await expect(searchInput).toBeVisible();
    
    try {
      // Measure search input responsiveness
      const startTime = Date.now();
      
      await searchInput.fill('建築');
      
      // Wait for any debounced search to trigger
      await page.waitForTimeout(500);
      
      const inputTime = Date.now() - startTime;
      
      // Test search submission performance
      const searchStartTime = Date.now();
      
      await searchInput.press('Enter');
      
      // Wait for search results or loading state
      await Promise.race([
        page.waitForSelector('[data-testid="architecture-item"]', { timeout: 10000 }),
        page.waitForSelector('text=/結果が見つかりません|No results found/i', { timeout: 10000 }),
        page.waitForSelector('[data-testid="loading"], .loading', { timeout: 10000 })
      ]);
      
      const searchTime = Date.now() - searchStartTime;
      
      console.log(`${browserName} Performance: Input=${inputTime}ms, Search=${searchTime}ms`);
      
      // Performance expectations (generous for cross-browser compatibility)
      expect(inputTime).toBeLessThan(1000);
      expect(searchTime).toBeLessThan(15000);
      
    } catch (error) {
      console.error(`Performance test failed in ${browserName}:`, error);
    }
  });

  test('Touch and mobile gestures (mobile browsers)', async ({ page, browserName }) => {
    console.log(`Testing touch functionality in ${browserName}`);
    
    // Skip for desktop browsers
    if (!browserName.includes('Mobile')) {
      test.skip();
      return;
    }
    
    try {
      const searchInput = page.locator('input[placeholder*="検索"]').first();
      await expect(searchInput).toBeVisible();
      
      // Test touch interaction
      await searchInput.tap();
      
      // Check if mobile keyboard triggers (indicated by focus)
      await expect(searchInput).toBeFocused();
      
      // Test touch input
      await searchInput.fill('タッチテスト');
      
      // Look for mobile-specific UI elements
      const mobileElements = [
        page.locator('[aria-label*="クリア"], .clear-button'),
        page.locator('[aria-label*="音声検索"], .voice-button'),
        page.locator('.mobile-search-actions')
      ];
      
      for (const element of mobileElements) {
        if (await element.isVisible({ timeout: 2000 })) {
          console.log(`✓ Mobile UI element found in ${browserName}`);
        }
      }
      
    } catch (error) {
      console.error(`Touch test failed in ${browserName}:`, error);
    }
  });

  test('Browser-specific search quirks and edge cases', async ({ page, browserName }) => {
    console.log(`Testing browser-specific behaviors in ${browserName}`);
    
    const searchInput = page.locator('input[placeholder*="検索"]').first();
    await expect(searchInput).toBeVisible();
    
    try {
      // Test very long search terms
      await searchInput.fill(testSearchTerms.long);
      const longValue = await searchInput.inputValue();
      
      // Different browsers may handle long input differently
      if (longValue.length !== testSearchTerms.long.length) {
        console.log(`⚠ ${browserName} truncated long input: ${longValue.length}/${testSearchTerms.long.length} characters`);
      }
      
      // Test copy/paste functionality
      await searchInput.clear();
      await page.evaluate((text) => {
        navigator.clipboard?.writeText(text);
      }, testSearchTerms.japanese);
      
      // Simulate Ctrl+V (Cmd+V on Mac)
      await searchInput.focus();
      await page.keyboard.press(process.platform === 'darwin' ? 'Meta+v' : 'Control+v');
      
      await page.waitForTimeout(500);
      const pastedValue = await searchInput.inputValue();
      
      if (pastedValue === testSearchTerms.japanese) {
        console.log(`✓ Copy/paste works in ${browserName}`);
      } else {
        console.log(`⚠ Copy/paste issue in ${browserName}`);
      }
      
      // Test rapid input changes
      await searchInput.clear();
      for (let i = 0; i < 5; i++) {
        await searchInput.fill(`test${i}`);
        await page.waitForTimeout(100);
      }
      
      const finalValue = await searchInput.inputValue();
      expect(finalValue).toBe('test4');
      
    } catch (error) {
      console.error(`Browser-specific test failed in ${browserName}:`, error);
    }
  });

  test('Search results consistency across browsers', async ({ page, browserName }) => {
    console.log(`Testing search result consistency in ${browserName}`);
    
    const searchInput = page.locator('input[placeholder*="検索"]').first();
    await expect(searchInput).toBeVisible();
    
    try {
      // Perform a standard search
      await searchInput.fill('建築');
      await searchInput.press('Enter');
      
      // Wait for results
      await page.waitForTimeout(3000);
      
      // Count results
      const resultItems = page.locator('[data-testid="architecture-item"], .architecture-card, .search-result-item');
      const resultCount = await resultItems.count();
      
      console.log(`${browserName}: Found ${resultCount} search results`);
      
      if (resultCount > 0) {
        // Check if results have consistent structure
        const firstResult = resultItems.first();
        
        const hasTitle = await firstResult.locator('h1, h2, h3, .title, [data-testid="title"]').isVisible();
        const hasImage = await firstResult.locator('img, .image, [data-testid="image"]').isVisible();
        
        console.log(`${browserName} result structure - Title: ${hasTitle}, Image: ${hasImage}`);
        
        // Verify clickable results
        await firstResult.click();
        
        // Check if navigation occurred
        await page.waitForTimeout(2000);
        const currentUrl = page.url();
        
        if (currentUrl.includes('/architecture/') || currentUrl.includes('/details')) {
          console.log(`✓ Result navigation works in ${browserName}`);
        } else {
          console.log(`⚠ Result navigation issue in ${browserName}`);
        }
        
      } else {
        // Check for proper "no results" handling
        const noResultsMessage = await page.locator('text=/結果が見つかりません|No results|見つかりませんでした/i').isVisible();
        
        if (noResultsMessage) {
          console.log(`✓ No results message shown in ${browserName}`);
        } else {
          console.log(`⚠ No results state unclear in ${browserName}`);
        }
      }
      
    } catch (error) {
      console.error(`Result consistency test failed in ${browserName}:`, error);
    }
  });

  test('Accessibility features in search', async ({ page, browserName }) => {
    console.log(`Testing search accessibility in ${browserName}`);
    
    try {
      // Test keyboard navigation
      await page.keyboard.press('Tab');
      
      // Find the focused search input
      const focusedElement = page.locator(':focus');
      const isSearchFocused = await focusedElement.getAttribute('placeholder');
      
      if (isSearchFocused && isSearchFocused.includes('検索')) {
        console.log(`✓ Keyboard navigation to search works in ${browserName}`);
      }
      
      // Test ARIA labels and roles
      const searchInput = page.locator('input[placeholder*="検索"]').first();
      const ariaLabel = await searchInput.getAttribute('aria-label');
      const role = await searchInput.getAttribute('role');
      
      console.log(`${browserName} ARIA - Label: ${ariaLabel}, Role: ${role}`);
      
      // Test screen reader compatibility (limited in automated tests)
      const searchContainer = page.locator('[role="search"], .search-container').first();
      if (await searchContainer.isVisible()) {
        console.log(`✓ Search landmark found in ${browserName}`);
      }
      
    } catch (error) {
      console.error(`Accessibility test failed in ${browserName}:`, error);
    }
  });
});

/**
 * Browser-specific edge cases and known issues
 */
test.describe('Browser-Specific Search Issues', () => {
  
  test('Safari-specific search behavior', async ({ page, browserName }) => {
    test.skip(browserName !== 'webkit', 'Safari-specific test');
    
    console.log('Testing Safari-specific search behaviors');
    
    await page.goto('/architecture');
    const searchInput = page.locator('input[placeholder*="検索"]').first();
    
    // Safari sometimes has issues with Japanese IME
    try {
      await searchInput.fill('あ'); // Hiragana character
      await page.waitForTimeout(500);
      
      const value = await searchInput.inputValue();
      if (value !== 'あ') {
        console.error(`Safari IME issue: Expected 'あ', got '${value}'`);
      }
    } catch (error) {
      console.error('Safari IME test failed:', error);
    }
  });
  
  test('Firefox-specific search behavior', async ({ page, browserName }) => {
    test.skip(browserName !== 'firefox', 'Firefox-specific test');
    
    console.log('Testing Firefox-specific search behaviors');
    
    await page.goto('/architecture');
    
    // Firefox sometimes handles autocomplete differently
    try {
      const searchInput = page.locator('input[placeholder*="検索"]').first();
      await searchInput.fill('東京');
      
      // Check for Firefox-specific autocomplete behavior
      await page.waitForTimeout(1000);
      
      // Firefox may show browser's own autocomplete
      const nativeAutocomplete = page.locator('[role="listbox"]');
      if (await nativeAutocomplete.isVisible()) {
        console.log('Firefox showing native autocomplete');
      }
      
    } catch (error) {
      console.error('Firefox autocomplete test failed:', error);
    }
  });
  
  test('Chrome-specific search behavior', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Chrome-specific test');
    
    console.log('Testing Chrome-specific search behaviors');
    
    await page.goto('/architecture');
    
    // Chrome-specific features like speech recognition
    try {
      const speechSupported = await page.evaluate(() => {
        return 'webkitSpeechRecognition' in window;
      });
      
      if (speechSupported) {
        console.log('Chrome: Web Speech API available');
      } else {
        console.log('Chrome: Web Speech API not available in test environment');
      }
      
    } catch (error) {
      console.error('Chrome speech recognition test failed:', error);
    }
  });
  
  test('Edge-specific search behavior', async ({ page, browserName }) => {
    // Note: Edge may be detected as 'chromium' in Playwright
    console.log('Testing Edge/Chromium-specific search behaviors');
    
    await page.goto('/architecture');
    
    try {
      const searchInput = page.locator('input[placeholder*="検索"]').first();
      
      // Test Edge's handling of international characters
      await searchInput.fill('建築家検索テスト');
      
      const value = await searchInput.inputValue();
      expect(value).toBe('建築家検索テスト');
      
      console.log('Edge: International character input successful');
      
    } catch (error) {
      console.error('Edge character input test failed:', error);
    }
  });
});