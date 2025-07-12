/**
 * Autocomplete Diagnostic Test
 * 
 * This test helps identify the current state of autocomplete functionality
 * and documents what's working vs what's not working.
 */

import { test, expect, Page } from '@playwright/test';

test.describe('Autocomplete Diagnostic Tests', () => {
  
  test('diagnose search functionality and identify autocomplete elements', async ({ page }) => {
    console.log('🔍 Starting autocomplete diagnostic...');
    
    // Navigate to architecture page
    await page.goto('/architecture');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);
    
    // Take screenshot for visual inspection
    await page.screenshot({ path: 'tests/screenshots/initial-page.png', fullPage: true });
    
    console.log('📄 Page loaded, searching for search elements...');
    
    // Try to find search input using various selectors
    const searchSelectors = [
      '[data-testid="search-bar"]',
      'input[placeholder*="検索"]',
      'input[placeholder*="建築"]', 
      'input[placeholder*="search"]',
      'input[type="search"]',
      'input[type="text"]',
      '.search-input',
      '.MuiInputBase-input'
    ];
    
    let searchInput = null;
    let foundSelector = '';
    
    for (const selector of searchSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible()) {
          searchInput = element;
          foundSelector = selector;
          console.log(`✅ Found search input with selector: ${selector}`);
          break;
        }
      } catch (error) {
        console.log(`❌ Selector not found: ${selector}`);
      }
    }
    
    if (!searchInput) {
      // List all input elements to help debug
      const allInputs = await page.locator('input').all();
      console.log(`Found ${allInputs.length} input elements on page:`);
      
      for (let i = 0; i < allInputs.length; i++) {
        const input = allInputs[i];
        const placeholder = await input.getAttribute('placeholder');
        const type = await input.getAttribute('type');
        const id = await input.getAttribute('id');
        const testId = await input.getAttribute('data-testid');
        const classes = await input.getAttribute('class');
        
        console.log(`Input ${i + 1}:`, {
          placeholder,
          type,
          id,
          testId,
          classes: classes?.substring(0, 50) + '...'
        });
      }
      
      throw new Error('No search input found on page');
    }
    
    console.log(`🎯 Using search input with selector: ${foundSelector}`);
    
    // Test basic search functionality
    await searchInput.click();
    await searchInput.fill('東京');
    
    console.log('💭 Typed "東京", waiting for autocomplete...');
    await page.waitForTimeout(1000);
    
    // Take screenshot after typing
    await page.screenshot({ path: 'tests/screenshots/after-typing.png', fullPage: true });
    
    // Look for autocomplete dropdown with various selectors
    const autocompleteSelectors = [
      '[data-testid="autocomplete-suggestions"]',
      '[data-testid="suggestion-item"]',
      '.autocomplete-dropdown',
      '.suggestions-list',
      '.MuiPaper-root[role="listbox"]',
      '.MuiAutocomplete-popper',
      '*[role="listbox"]',
      '*[role="combobox"]',
      '.suggestions',
      '.dropdown'
    ];
    
    let autocompleteFound = false;
    let autocompleteSelector = '';
    
    for (const selector of autocompleteSelectors) {
      try {
        const element = page.locator(selector);
        if (await element.isVisible()) {
          autocompleteFound = true;
          autocompleteSelector = selector;
          console.log(`✅ Found autocomplete with selector: ${selector}`);
          
          const suggestionItems = element.locator('*').filter({ hasText: /東京|Tokyo/i });
          const count = await suggestionItems.count();
          console.log(`   - Found ${count} items containing "東京" or "Tokyo"`);
          
          if (count > 0) {
            const firstSuggestion = suggestionItems.first();
            const text = await firstSuggestion.textContent();
            console.log(`   - First suggestion: "${text}"`);
          }
          break;
        }
      } catch (error) {
        // Continue to next selector
      }
    }
    
    if (!autocompleteFound) {
      console.log('❌ No autocomplete dropdown found');
      
      // Check if any new elements appeared after typing
      const allElements = await page.locator('*').all();
      console.log(`Total elements on page: ${allElements.length}`);
      
      // Look for any elements containing the search term
      const elementsWithTokyo = page.locator('*').filter({ hasText: /東京|Tokyo/i });
      const tokyoCount = await elementsWithTokyo.count();
      console.log(`Elements containing "東京" or "Tokyo": ${tokyoCount}`);
      
      if (tokyoCount > 0) {
        for (let i = 0; i < Math.min(tokyoCount, 5); i++) {
          const element = elementsWithTokyo.nth(i);
          const text = await element.textContent();
          const tagName = await element.evaluate(el => el.tagName);
          console.log(`  - ${tagName}: "${text?.substring(0, 100)}..."`);
        }
      }
    }
    
    // Test if there's a search button
    const searchButtonSelectors = [
      'button[aria-label*="search"]',
      'button[aria-label*="検索"]', 
      'button:has-text("検索")',
      'button:has-text("Search")',
      '*[role="button"]:has-text("検索")',
      '.search-button'
    ];
    
    let searchButton = null;
    for (const selector of searchButtonSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible()) {
          searchButton = element;
          console.log(`✅ Found search button with selector: ${selector}`);
          break;
        }
      } catch (error) {
        // Continue to next selector
      }
    }
    
    if (searchButton) {
      console.log('🔘 Testing search button click...');
      await searchButton.click();
      await page.waitForTimeout(1000);
      
      // Take screenshot after search
      await page.screenshot({ path: 'tests/screenshots/after-search.png', fullPage: true });
    } else {
      console.log('❌ No search button found, testing Enter key...');
      await searchInput.press('Enter');
      await page.waitForTimeout(1000);
      
      // Take screenshot after Enter
      await page.screenshot({ path: 'tests/screenshots/after-enter.png', fullPage: true });
    }
    
    // Check if the page changed/updated after search
    const currentUrl = page.url();
    console.log(`Current URL after search: ${currentUrl}`);
    
    // Look for search results
    const resultSelectors = [
      '[data-testid="architecture-item"]',
      '[data-testid="search-results"]',
      '.architecture-card',
      '.search-result',
      '.result-item'
    ];
    
    let resultsFound = false;
    for (const selector of resultSelectors) {
      try {
        const elements = page.locator(selector);
        const count = await elements.count();
        if (count > 0) {
          resultsFound = true;
          console.log(`✅ Found ${count} results with selector: ${selector}`);
          break;
        }
      } catch (error) {
        // Continue to next selector
      }
    }
    
    if (!resultsFound) {
      console.log('❌ No search results found');
    }
    
    // Summary
    console.log('\n📋 DIAGNOSTIC SUMMARY:');
    console.log(`Search Input: ${searchInput ? '✅ Found' : '❌ Not Found'} (${foundSelector})`);
    console.log(`Autocomplete: ${autocompleteFound ? '✅ Found' : '❌ Not Found'} (${autocompleteSelector})`);
    console.log(`Search Button: ${searchButton ? '✅ Found' : '❌ Not Found'}`);
    console.log(`Search Results: ${resultsFound ? '✅ Found' : '❌ Not Found'}`);
    
    // Test passes if we at least found a search input
    expect(searchInput).toBeTruthy();
  });
  
  test('test autocomplete timing and behavior', async ({ page }) => {
    await page.goto('/architecture');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    // Find search input (using the diagnostic results)
    const searchInput = page.locator('input').first();
    
    if (await searchInput.isVisible()) {
      console.log('⏱️ Testing autocomplete timing...');
      
      // Test 1: Type single character - should NOT show autocomplete
      await searchInput.click();
      await searchInput.fill('東');
      await page.waitForTimeout(1000);
      
      let autocompleteVisible = await page.locator('*').filter({ hasText: /suggestion|autocomplete/i }).isVisible();
      console.log(`After 1 character: Autocomplete visible = ${autocompleteVisible}`);
      
      // Test 2: Type two characters - SHOULD show autocomplete
      await searchInput.fill('東京');
      await page.waitForTimeout(1000);
      
      autocompleteVisible = await page.locator('*').filter({ hasText: /東京/i }).isVisible();
      console.log(`After 2 characters: Related content visible = ${autocompleteVisible}`);
      
      // Test 3: Clear and test different terms
      const testTerms = ['大阪', '安藤', '住宅'];
      for (const term of testTerms) {
        await searchInput.fill('');
        await page.waitForTimeout(300);
        await searchInput.fill(term);
        await page.waitForTimeout(800);
        
        const relatedContentVisible = await page.locator('*').filter({ hasText: new RegExp(term, 'i') }).isVisible();
        console.log(`Term "${term}": Related content visible = ${relatedContentVisible}`);
      }
    }
  });
  
  test('test network behavior with autocomplete', async ({ page, context }) => {
    console.log('🌐 Testing network behavior...');
    
    // Monitor network requests
    const requests: string[] = [];
    page.on('request', request => {
      if (request.url().includes('search') || request.url().includes('autocomplete')) {
        requests.push(request.url());
        console.log(`Network request: ${request.url()}`);
      }
    });
    
    await page.goto('/architecture');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    const searchInput = page.locator('input').first();
    
    if (await searchInput.isVisible()) {
      await searchInput.click();
      await searchInput.fill('東京');
      await page.waitForTimeout(2000);
      
      console.log(`Total relevant network requests: ${requests.length}`);
      requests.forEach((url, index) => {
        console.log(`${index + 1}. ${url}`);
      });
      
      // Test with slow network
      await context.route('**/*', async route => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await route.continue();
      });
      
      await searchInput.fill('大阪');
      await page.waitForTimeout(3000);
      
      console.log('Slow network test completed');
    }
  });
});