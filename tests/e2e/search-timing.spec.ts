import { test, expect } from '@playwright/test';

test.describe('Search Timing and Performance Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Go to architecture page before each test
    await page.goto('/#/architecture');
    
    // Wait for the page to load - look for the search input and cards/list items
    await Promise.race([
      page.waitForSelector('[role="combobox"]', { timeout: 15000 }), // Autocomplete search input
      page.waitForSelector('input[placeholder*="検索"]', { timeout: 15000 }) // Search input placeholder
    ]);
    
    // Wait for initial data to load (either cards or list items)
    await Promise.race([
      page.waitForSelector('[role="gridcell"]', { timeout: 10000 }), // Grid cards
      page.waitForSelector('[role="listitem"]', { timeout: 10000 }), // List items
      page.waitForSelector('h6:has-text("建築作品一覧")', { timeout: 10000 }) // Page header as fallback
    ]).catch(() => {
      console.log('Architecture items may not be loaded yet, proceeding with test...');
    });
  });

  test('should handle very slow typing (1 character per second)', async ({ page }) => {
    console.log('Testing very slow typing (1 character per second)...');
    
    // Look for the autocomplete search input
    const searchInput = page.locator('[role="combobox"]').first();
    await expect(searchInput).toBeVisible();
    
    const searchTerm = 'Tokyo';
    const requests: string[] = [];
    
    // Track API requests during slow typing
    page.on('request', (request) => {
      if (request.url().includes('/api/') && request.method() === 'GET') {
        requests.push(`${new Date().toISOString()}: ${request.url()}`);
      }
    });
    
    // Type each character with 1 second delay
    for (let i = 0; i < searchTerm.length; i++) {
      await searchInput.type(searchTerm[i]);
      console.log(`Typed character '${searchTerm[i]}' at ${new Date().toISOString()}`);
      
      // Wait 1 second before next character
      if (i < searchTerm.length - 1) {
        await page.waitForTimeout(1000);
      }
    }
    
    // Wait for debounce to complete (300ms default + buffer)
    await page.waitForTimeout(500);
    
    // Verify final search was executed
    await expect(searchInput).toHaveValue(searchTerm);
    
    // Log all requests for analysis
    console.log('API requests during slow typing:');
    requests.forEach(req => console.log(req));
    
    // Should have made at least one search request
    const searchRequests = requests.filter(req => req.includes('search') || req.includes('architecture'));
    expect(searchRequests.length).toBeGreaterThanOrEqual(1);
  });

  test('should handle very fast typing', async ({ page }) => {
    console.log('Testing very fast typing...');
    
    const searchInput = page.locator('[role="combobox"]').first();
    await expect(searchInput).toBeVisible();
    
    const searchTerm = 'TokyoStation';
    const requests: string[] = [];
    let requestCount = 0;
    
    // Track API requests during fast typing
    page.on('request', (request) => {
      if (request.url().includes('/api/') && request.method() === 'GET') {
        requestCount++;
        requests.push(`Request ${requestCount} at ${new Date().toISOString()}: ${request.url()}`);
      }
    });
    
    // Type as fast as possible (simulates very fast typing)
    const startTime = Date.now();
    await searchInput.type(searchTerm, { delay: 10 }); // 10ms between characters
    const endTime = Date.now();
    
    console.log(`Fast typing completed in ${endTime - startTime}ms`);
    
    // Wait for debounce to settle
    await page.waitForTimeout(500);
    
    // Verify input value
    await expect(searchInput).toHaveValue(searchTerm);
    
    // Log all requests for analysis
    console.log('API requests during fast typing:');
    requests.forEach(req => console.log(req));
    
    // With debouncing, should have minimal requests despite fast typing
    // The debounce should prevent excessive API calls
    expect(requestCount).toBeLessThan(searchTerm.length); // Should be fewer requests than characters
  });

  test('should handle complete search term paste', async ({ page }) => {
    console.log('Testing complete search term paste...');
    
    const searchInput = page.locator('[role="combobox"]').first();
    await expect(searchInput).toBeVisible();
    
    const searchTerm = 'Tadao Ando';
    let requestCount = 0;
    const requests: string[] = [];
    
    // Track API requests during paste operation
    page.on('request', (request) => {
      if (request.url().includes('/api/') && request.method() === 'GET') {
        requestCount++;
        requests.push(`Paste request ${requestCount} at ${new Date().toISOString()}: ${request.url()}`);
      }
    });
    
    // Clear input first
    await searchInput.clear();
    
    // Paste entire search term at once
    const startTime = Date.now();
    await searchInput.fill(searchTerm);
    const pasteTime = Date.now();
    
    console.log(`Paste operation completed in ${pasteTime - startTime}ms`);
    
    // Wait for debounce to complete
    await page.waitForTimeout(500);
    const debounceCompleteTime = Date.now();
    
    console.log(`Debounce completed after ${debounceCompleteTime - pasteTime}ms`);
    
    // Verify input value
    await expect(searchInput).toHaveValue(searchTerm);
    
    // Log requests
    console.log('API requests during paste operation:');
    requests.forEach(req => console.log(req));
    
    // Paste should trigger exactly one debounced search
    expect(requestCount).toEqual(1);
  });

  test('should handle quick delete and retype scenario', async ({ page }) => {
    console.log('Testing quick delete and retype scenario...');
    
    const searchInput = page.locator('[role="combobox"]').first();
    await expect(searchInput).toBeVisible();
    
    const requests: string[] = [];
    let requestCount = 0;
    
    // Track API requests
    page.on('request', (request) => {
      if (request.url().includes('/api/') && request.method() === 'GET') {
        requestCount++;
        requests.push(`Request ${requestCount} at ${new Date().toISOString()}: ${request.url()}`);
      }
    });
    
    // Type initial search term
    const initialTerm = 'Tokyo';
    await searchInput.type(initialTerm);
    console.log(`Initial term '${initialTerm}' typed at ${new Date().toISOString()}`);
    
    // Wait brief moment then quickly delete all and retype
    await page.waitForTimeout(100);
    
    // Select all and delete
    await searchInput.selectText();
    await page.keyboard.press('Backspace');
    console.log(`Text deleted at ${new Date().toISOString()}`);
    
    // Immediately type new term
    const newTerm = 'Osaka';
    await searchInput.type(newTerm, { delay: 50 });
    console.log(`New term '${newTerm}' typed at ${new Date().toISOString()}`);
    
    // Wait for debounce to settle
    await page.waitForTimeout(500);
    
    // Verify final input value
    await expect(searchInput).toHaveValue(newTerm);
    
    // Log all requests
    console.log('API requests during delete/retype scenario:');
    requests.forEach(req => console.log(req));
    
    // Should have minimal requests due to debouncing cancelling previous searches
    console.log(`Total API requests: ${requestCount}`);
  });

  test('should handle typing while results are loading', async ({ page }) => {
    console.log('Testing typing while results are loading...');
    
    const searchInput = page.locator('[role="combobox"]').first();
    await expect(searchInput).toBeVisible();
    
    const requests: string[] = [];
    const responses: string[] = [];
    let requestCount = 0;
    let responseCount = 0;
    
    // Track both requests and responses
    page.on('request', (request) => {
      if (request.url().includes('/api/') && request.method() === 'GET') {
        requestCount++;
        requests.push(`Request ${requestCount} at ${new Date().toISOString()}: ${request.url()}`);
      }
    });
    
    page.on('response', (response) => {
      if (response.url().includes('/api/') && response.status() === 200) {
        responseCount++;
        responses.push(`Response ${responseCount} at ${new Date().toISOString()}: ${response.url()}`);
      }
    });
    
    // Start typing initial term to trigger a search
    const initialTerm = 'Toky';
    await searchInput.type(initialTerm);
    console.log(`Started typing '${initialTerm}' at ${new Date().toISOString()}`);
    
    // Immediately continue typing before response comes back
    // This simulates user continuing to type while search is in progress
    await page.waitForTimeout(50); // Small delay to let request start
    
    const additionalChars = 'o Station';
    await searchInput.type(additionalChars, { delay: 100 }); // Moderate typing speed
    console.log(`Continued typing '${additionalChars}' while loading at ${new Date().toISOString()}`);
    
    // Wait for all operations to complete
    await page.waitForTimeout(1000);
    
    const finalValue = await searchInput.inputValue();
    console.log(`Final input value: '${finalValue}'`);
    
    // Log all network activity
    console.log('Requests during typing while loading:');
    requests.forEach(req => console.log(req));
    console.log('Responses during typing while loading:');
    responses.forEach(resp => console.log(resp));
    
    // Verify final state
    await expect(searchInput).toHaveValue(initialTerm + additionalChars);
    
    // Should handle overlapping requests gracefully
    console.log(`Total requests: ${requestCount}, Total responses: ${responseCount}`);
  });

  test('should handle rapid clear and search operations', async ({ page }) => {
    console.log('Testing rapid clear and search operations...');
    
    const searchInput = page.locator('[role="combobox"]').first();
    const searchButton = page.getByRole('button', { name: '検索' }); // Look for Japanese search button
    await expect(searchInput).toBeVisible();
    
    const requests: string[] = [];
    let requestCount = 0;
    
    // Track API requests
    page.on('request', (request) => {
      if (request.url().includes('/api/') && request.method() === 'GET') {
        requestCount++;
        requests.push(`Request ${requestCount} at ${new Date().toISOString()}: ${request.url()}`);
      }
    });
    
    // Type search term
    await searchInput.type('Tokyo');
    console.log(`Typed 'Tokyo' at ${new Date().toISOString()}`);
    
    // Click search button immediately (bypasses debounce)
    await searchButton.click();
    console.log(`Clicked search button at ${new Date().toISOString()}`);
    
    // Immediately clear and type new term
    await page.waitForTimeout(100);
    
    // Clear the input by selecting all and deleting
    // The autocomplete component may not have a clear button, so use keyboard method
    await searchInput.selectText();
    await page.keyboard.press('Backspace');
    console.log(`Cleared via keyboard at ${new Date().toISOString()}`);
    
    // Type new term immediately
    await searchInput.type('Osaka');
    console.log(`Typed 'Osaka' at ${new Date().toISOString()}`);
    
    // Click search again
    await searchButton.click();
    console.log(`Clicked search button again at ${new Date().toISOString()}`);
    
    // Wait for all operations to complete
    await page.waitForTimeout(500);
    
    // Verify final state
    await expect(searchInput).toHaveValue('Osaka');
    
    // Log all requests
    console.log('API requests during rapid clear/search operations:');
    requests.forEach(req => console.log(req));
    
    console.log(`Total API requests: ${requestCount}`);
    
    // Should have made multiple requests for the explicit search button clicks
    expect(requestCount).toBeGreaterThanOrEqual(2);
  });

  test('should handle Enter key during debounce period', async ({ page }) => {
    console.log('Testing Enter key press during debounce period...');
    
    const searchInput = page.locator('[role="combobox"]').first();
    await expect(searchInput).toBeVisible();
    
    const requests: string[] = [];
    let requestCount = 0;
    
    // Track API requests with timestamps
    page.on('request', (request) => {
      if (request.url().includes('/api/') && request.method() === 'GET') {
        requestCount++;
        requests.push(`Request ${requestCount} at ${new Date().toISOString()}: ${request.url()}`);
      }
    });
    
    // Type search term
    const searchTerm = 'Kyoto';
    await searchInput.type(searchTerm);
    const typingCompleteTime = Date.now();
    console.log(`Finished typing '${searchTerm}' at ${new Date().toISOString()}`);
    
    // Press Enter immediately (before debounce timer expires)
    // This should trigger immediate search, bypassing debounce
    await page.keyboard.press('Enter');
    const enterPressTime = Date.now();
    console.log(`Pressed Enter at ${new Date().toISOString()} (${enterPressTime - typingCompleteTime}ms after typing)`);
    
    // Wait for search to complete
    await page.waitForTimeout(500);
    
    // Verify search was executed
    await expect(searchInput).toHaveValue(searchTerm);
    
    // Log all requests
    console.log('API requests during Enter key test:');
    requests.forEach(req => console.log(req));
    
    // Should have made at least one request (immediate from Enter key)
    expect(requestCount).toBeGreaterThanOrEqual(1);
    
    console.log(`Total API requests: ${requestCount}`);
  });

  test('should handle focus and blur events during search', async ({ page }) => {
    console.log('Testing focus/blur events during search operations...');
    
    const searchInput = page.locator('[role="combobox"]').first();
    await expect(searchInput).toBeVisible();
    
    const requests: string[] = [];
    let requestCount = 0;
    
    // Track API requests
    page.on('request', (request) => {
      if (request.url().includes('/api/') && request.method() === 'GET') {
        requestCount++;
        requests.push(`Request ${requestCount} at ${new Date().toISOString()}: ${request.url()}`);
      }
    });
    
    // Focus input and start typing
    await searchInput.focus();
    console.log(`Focused input at ${new Date().toISOString()}`);
    
    await searchInput.type('Hiro');
    console.log(`Typed 'Hiro' at ${new Date().toISOString()}`);
    
    // Blur the input (simulates clicking elsewhere)
    await searchInput.blur();
    console.log(`Blurred input at ${new Date().toISOString()}`);
    
    // Focus again and continue typing
    await searchInput.focus();
    console.log(`Re-focused input at ${new Date().toISOString()}`);
    
    await searchInput.type('shima');
    console.log(`Continued typing 'shima' at ${new Date().toISOString()}`);
    
    // Wait for debounce to complete
    await page.waitForTimeout(500);
    
    // Verify final state
    await expect(searchInput).toHaveValue('Hiroshima');
    
    // Log all requests
    console.log('API requests during focus/blur test:');
    requests.forEach(req => console.log(req));
    
    console.log(`Total API requests: ${requestCount}`);
  });

  test('should handle concurrent search requests gracefully', async ({ page }) => {
    console.log('Testing concurrent search request handling...');
    
    const searchInput = page.locator('[role="combobox"]').first();
    const searchButton = page.getByRole('button', { name: '検索' }); // Look for Japanese search button
    await expect(searchInput).toBeVisible();
    
    const requests: string[] = [];
    const responses: string[] = [];
    let requestCount = 0;
    let responseCount = 0;
    
    // Track both requests and responses to detect overlapping operations
    page.on('request', (request) => {
      if (request.url().includes('/api/') && request.method() === 'GET') {
        requestCount++;
        requests.push(`Request ${requestCount} at ${new Date().toISOString()}: ${request.url()}`);
      }
    });
    
    page.on('response', (response) => {
      if (response.url().includes('/api/') && response.status() === 200) {
        responseCount++;
        responses.push(`Response ${responseCount} at ${new Date().toISOString()}: Status ${response.status()}`);
      }
    });
    
    // Type first search term
    await searchInput.type('Tokyo');
    console.log(`Typed 'Tokyo' at ${new Date().toISOString()}`);
    
    // Click search button (triggers immediate request)
    await searchButton.click();
    console.log(`Clicked search for 'Tokyo' at ${new Date().toISOString()}`);
    
    // Immediately change search term and search again (concurrent requests)
    await searchInput.selectText();
    await searchInput.type('Osaka');
    console.log(`Changed to 'Osaka' at ${new Date().toISOString()}`);
    
    await searchButton.click();
    console.log(`Clicked search for 'Osaka' at ${new Date().toISOString()}`);
    
    // Change again quickly
    await searchInput.selectText();
    await searchInput.type('Kyoto');
    console.log(`Changed to 'Kyoto' at ${new Date().toISOString()}`);
    
    await searchButton.click();
    console.log(`Clicked search for 'Kyoto' at ${new Date().toISOString()}`);
    
    // Wait for all requests to complete
    await page.waitForTimeout(2000);
    
    // Verify final state
    await expect(searchInput).toHaveValue('Kyoto');
    
    // Log all network activity
    console.log('All requests during concurrent test:');
    requests.forEach(req => console.log(req));
    console.log('All responses during concurrent test:');
    responses.forEach(resp => console.log(resp));
    
    console.log(`Total requests: ${requestCount}, Total responses: ${responseCount}`);
    
    // Should handle multiple concurrent requests without errors
    expect(requestCount).toBeGreaterThanOrEqual(3);
  });
});

test.describe('Search Timing Edge Cases', () => {
  test('should handle extremely rapid input changes', async ({ page }) => {
    console.log('Testing extremely rapid input changes...');
    
    await page.goto('/#/architecture');
    await Promise.race([
      page.waitForSelector('[role="combobox"]', { timeout: 15000 }),
      page.waitForSelector('h6:has-text("建築作品一覧")', { timeout: 15000 })
    ]);
    
    const searchInput = page.locator('[role="combobox"]').first();
    let requestCount = 0;
    
    page.on('request', (request) => {
      if (request.url().includes('/api/') && request.method() === 'GET') {
        requestCount++;
      }
    });
    
    // Simulate extremely rapid changes (faster than debounce)
    const changes = ['T', 'To', 'Tok', 'Toky', 'Tokyo', 'Tokyo ', 'Tokyo S', 'Tokyo St', 'Tokyo Sta'];
    
    for (const change of changes) {
      await searchInput.fill(change);
      await page.waitForTimeout(10); // Much faster than 300ms debounce
    }
    
    // Wait for debounce to settle
    await page.waitForTimeout(500);
    
    console.log(`Made ${requestCount} requests for ${changes.length} rapid changes`);
    
    // Should have significantly fewer requests than changes due to debouncing
    expect(requestCount).toBeLessThan(changes.length);
  });

  test('should maintain performance during stress conditions', async ({ page }) => {
    console.log('Testing search performance under stress conditions...');
    
    await page.goto('/#/architecture');
    await Promise.race([
      page.waitForSelector('[role="combobox"]', { timeout: 15000 }),
      page.waitForSelector('h6:has-text("建築作品一覧")', { timeout: 15000 })
    ]);
    
    const searchInput = page.locator('[role="combobox"]').first();
    const searchButton = page.getByRole('button', { name: '検索' });
    
    let requestCount = 0;
    const startTime = Date.now();
    
    page.on('request', (request) => {
      if (request.url().includes('/api/') && request.method() === 'GET') {
        requestCount++;
      }
    });
    
    // Perform multiple rapid search operations
    const searchTerms = ['Tokyo', 'Osaka', 'Kyoto', 'Hiroshima', 'Nagoya'];
    
    for (let i = 0; i < 3; i++) { // Repeat the cycle 3 times
      for (const term of searchTerms) {
        await searchInput.fill(term);
        await searchButton.click();
        await page.waitForTimeout(50); // Brief pause between operations
      }
    }
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    console.log(`Completed stress test in ${totalTime}ms with ${requestCount} requests`);
    
    // Verify the interface remains responsive
    await expect(searchInput).toBeVisible();
    await expect(searchButton).toBeEnabled();
    
    // Performance should be reasonable even under stress
    expect(totalTime).toBeLessThan(10000); // Should complete within 10 seconds
  });
});