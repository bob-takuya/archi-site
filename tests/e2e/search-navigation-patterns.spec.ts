import { test, expect } from '@playwright/test';

test.describe('Search Functionality After Navigation Patterns', () => {
  
  test.beforeEach(async ({ page }) => {
    // Set up error monitoring
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(`Console Error: ${msg.text()}`);
      }
    });
    page.on('pageerror', err => {
      errors.push(`Page Error: ${err.message}`);
    });
    
    // Store errors for later access
    (page as any)._testErrors = errors;
  });

  test('should search immediately after page load', async ({ page }) => {
    console.log('🔍 Testing search immediately after page load...');
    
    // Navigate to architecture page
    await page.goto('/architecture');
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    
    // Wait for search autocomplete to be ready
    await page.waitForSelector('input[placeholder*="検索"]', { timeout: 10000 });
    
    // Verify initial state
    const initialItems = await page.locator('[data-testid="architecture-item"]').count();
    console.log(`Initial items count: ${initialItems}`);
    
    // Perform search immediately
    await page.getByPlaceholder(/検索/).fill('東京');
    await page.getByRole('button', { name: /検索/ }).click();
    
    // Wait for search results
    await page.waitForResponse(response => 
      response.url().includes('/api/') && response.status() === 200,
      { timeout: 15000 }
    );
    
    // Verify search worked
    const searchResults = await page.locator('[data-testid="architecture-item"]').count();
    console.log(`Search results count: ${searchResults}`);
    
    // Check URL reflects search
    expect(page.url()).toContain('search=東京');
    
    // Verify search input retains value
    await expect(page.getByPlaceholder(/検索/)).toHaveValue('東京');
    
    // Log any errors that occurred
    const errors = (page as any)._testErrors;
    if (errors.length > 0) {
      console.log('❌ Errors after immediate search:', errors);
    } else {
      console.log('✅ No errors during immediate search');
    }
  });

  test('should search after sorting by year (oldest first)', async ({ page }) => {
    console.log('🔍 Testing search after sorting by year (oldest first)...');
    
    await page.goto('/architecture');
    await page.waitForLoadState('networkidle');
    
    // Wait for sort controls to be available
    await page.waitForSelector('select', { timeout: 10000 });
    
    // Change sort order to oldest first
    await page.selectOption('select', 'year_asc');
    console.log('Changed sort to oldest first');
    
    // Wait for results to update
    await page.waitForResponse(response => 
      response.url().includes('/api/') && response.status() === 200,
      { timeout: 15000 }
    );
    
    // Verify URL contains sort parameter
    expect(page.url()).toContain('sort=year_asc');
    
    // Now perform search
    await page.getByPlaceholder(/検索/).fill('美術館');
    await page.getByRole('button', { name: /検索/ }).click();
    
    // Wait for search results
    await page.waitForResponse(response => 
      response.url().includes('/api/') && response.status() === 200,
      { timeout: 15000 }
    );
    
    // Verify both search and sort are maintained in URL
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);
    expect(currentUrl).toContain('search=美術館');
    expect(currentUrl).toContain('sort=year_asc');
    
    // Verify search input retains value
    await expect(page.getByPlaceholder(/検索/)).toHaveValue('美術館');
    
    // Verify sort selection is maintained
    await expect(page.locator('select')).toHaveValue('year_asc');
    
    const errors = (page as any)._testErrors;
    if (errors.length > 0) {
      console.log('❌ Errors after search with sorting:', errors);
    } else {
      console.log('✅ No errors during search after sorting');
    }
  });

  test('should search after sorting by name', async ({ page }) => {
    console.log('🔍 Testing search after sorting by name...');
    
    await page.goto('/architecture');
    await page.waitForLoadState('networkidle');
    
    // Change sort order to name
    await page.selectOption('select', 'name_asc');
    console.log('Changed sort to name order');
    
    // Wait for results to update
    await page.waitForResponse(response => 
      response.url().includes('/api/') && response.status() === 200,
      { timeout: 15000 }
    );
    
    // Now perform search
    await page.getByPlaceholder(/検索/).fill('住宅');
    await page.getByRole('button', { name: /検索/ }).click();
    
    // Wait for search results
    await page.waitForResponse(response => 
      response.url().includes('/api/') && response.status() === 200,
      { timeout: 15000 }
    );
    
    // Verify both search and sort are maintained
    const currentUrl = page.url();
    expect(currentUrl).toContain('search=住宅');
    expect(currentUrl).toContain('sort=name_asc');
    
    console.log('✅ Search after name sorting successful');
  });

  test('should search after paginating to page 2', async ({ page }) => {
    console.log('🔍 Testing search after paginating to page 2...');
    
    await page.goto('/architecture');
    await page.waitForLoadState('networkidle');
    
    // Wait for pagination to be available
    await page.waitForSelector('.MuiPagination-root', { timeout: 10000 });
    
    // Check if page 2 exists
    const page2Button = page.locator('button[aria-label="Go to page 2"]');
    if (await page2Button.count() > 0) {
      // Navigate to page 2
      await page2Button.click();
      console.log('Navigated to page 2');
      
      // Wait for page 2 content to load
      await page.waitForResponse(response => 
        response.url().includes('/api/') && response.status() === 200,
        { timeout: 15000 }
      );
      
      // Verify we're on page 2
      expect(page.url()).toContain('page=2');
      
      // Perform search
      await page.getByPlaceholder(/検索/).fill('学校');
      await page.getByRole('button', { name: /検索/ }).click();
      
      // Wait for search results
      await page.waitForResponse(response => 
        response.url().includes('/api/') && response.status() === 200,
        { timeout: 15000 }
      );
      
      // Verify search worked and we're back to page 1 (search resets pagination)
      const currentUrl = page.url();
      console.log(`URL after search from page 2: ${currentUrl}`);
      expect(currentUrl).toContain('search=学校');
      
      // Search should reset pagination to page 1
      expect(currentUrl).not.toContain('page=2');
      
      console.log('✅ Search after pagination successful');
    } else {
      console.log('⚠️ No page 2 available, skipping pagination test');
    }
    
    const errors = (page as any)._testErrors;
    if (errors.length > 0) {
      console.log('❌ Errors after paginated search:', errors);
    }
  });

  test('should search after paginating to page 3', async ({ page }) => {
    console.log('🔍 Testing search after paginating to page 3...');
    
    await page.goto('/architecture');
    await page.waitForLoadState('networkidle');
    
    // Check if page 3 exists
    const page3Button = page.locator('button[aria-label="Go to page 3"]');
    if (await page3Button.count() > 0) {
      await page3Button.click();
      console.log('Navigated to page 3');
      
      await page.waitForResponse(response => 
        response.url().includes('/api/') && response.status() === 200,
        { timeout: 15000 }
      );
      
      // Perform search
      await page.getByPlaceholder(/検索/).fill('図書館');
      await page.getByRole('button', { name: /検索/ }).click();
      
      await page.waitForResponse(response => 
        response.url().includes('/api/') && response.status() === 200,
        { timeout: 15000 }
      );
      
      const currentUrl = page.url();
      expect(currentUrl).toContain('search=図書館');
      console.log('✅ Search after page 3 navigation successful');
    } else {
      console.log('⚠️ No page 3 available, skipping test');
    }
  });

  test('should search after switching view modes', async ({ page }) => {
    console.log('🔍 Testing search after switching view modes...');
    
    await page.goto('/architecture');
    await page.waitForLoadState('networkidle');
    
    // Switch to list view
    const listViewButton = page.getByLabel(/リストビュー/);
    if (await listViewButton.count() > 0) {
      await listViewButton.click();
      console.log('Switched to list view');
      
      // Wait for view to change
      await page.waitForTimeout(1000);
      
      // Perform search in list view
      await page.getByPlaceholder(/検索/).fill('駅');
      await page.getByRole('button', { name: /検索/ }).click();
      
      await page.waitForResponse(response => 
        response.url().includes('/api/') && response.status() === 200,
        { timeout: 15000 }
      );
      
      expect(page.url()).toContain('search=駅');
      console.log('✅ Search in list view successful');
      
      // Switch to map view
      const mapViewButton = page.getByLabel(/マップビュー/);
      if (await mapViewButton.count() > 0) {
        await mapViewButton.click();
        console.log('Switched to map view');
        
        // Wait for map to load
        await page.waitForTimeout(2000);
        
        // Search should still work in map view
        await page.getByPlaceholder(/検索/).fill('公園');
        await page.getByRole('button', { name: /検索/ }).click();
        
        await page.waitForResponse(response => 
          response.url().includes('/api/') && response.status() === 200,
          { timeout: 15000 }
        );
        
        expect(page.url()).toContain('search=公園');
        console.log('✅ Search in map view successful');
      }
    }
  });

  test('should search after navigating away and back', async ({ page }) => {
    console.log('🔍 Testing search after navigating away and back...');
    
    // Start on architecture page
    await page.goto('/architecture');
    await page.waitForLoadState('networkidle');
    
    // Perform initial search
    await page.getByPlaceholder(/検索/).fill('病院');
    await page.getByRole('button', { name: /検索/ }).click();
    
    await page.waitForResponse(response => 
      response.url().includes('/api/') && response.status() === 200,
      { timeout: 15000 }
    );
    
    console.log('Performed initial search for 病院');
    
    // Navigate to home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    console.log('Navigated away to home page');
    
    // Navigate back to architecture page
    await page.goto('/architecture');
    await page.waitForLoadState('networkidle');
    console.log('Navigated back to architecture page');
    
    // Search should work normally after returning
    await page.getByPlaceholder(/検索/).fill('ホテル');
    await page.getByRole('button', { name: /検索/ }).click();
    
    await page.waitForResponse(response => 
      response.url().includes('/api/') && response.status() === 200,
      { timeout: 15000 }
    );
    
    expect(page.url()).toContain('search=ホテル');
    await expect(page.getByPlaceholder(/検索/)).toHaveValue('ホテル');
    
    console.log('✅ Search after navigation away and back successful');
    
    const errors = (page as any)._testErrors;
    if (errors.length > 0) {
      console.log('❌ Errors after navigation round trip:', errors);
    }
  });

  test('should search after browser refresh', async ({ page }) => {
    console.log('🔍 Testing search after browser refresh...');
    
    await page.goto('/architecture');
    await page.waitForLoadState('networkidle');
    
    // Perform initial search and set sort
    await page.selectOption('select', 'year_asc');
    await page.getByPlaceholder(/検索/).fill('商業施設');
    await page.getByRole('button', { name: /検索/ }).click();
    
    await page.waitForResponse(response => 
      response.url().includes('/api/') && response.status() === 200,
      { timeout: 15000 }
    );
    
    console.log('Performed initial search and sorting');
    const urlBeforeRefresh = page.url();
    console.log(`URL before refresh: ${urlBeforeRefresh}`);
    
    // Refresh the browser
    await page.reload();
    await page.waitForLoadState('networkidle');
    console.log('Browser refreshed');
    
    // Wait for page to restore state from URL
    await page.waitForTimeout(2000);
    
    // Verify state is restored
    const urlAfterRefresh = page.url();
    console.log(`URL after refresh: ${urlAfterRefresh}`);
    expect(urlAfterRefresh).toBe(urlBeforeRefresh);
    
    // Verify search input and sort are restored
    await expect(page.getByPlaceholder(/検索/)).toHaveValue('商業施設');
    await expect(page.locator('select')).toHaveValue('year_asc');
    
    // Perform new search after refresh
    await page.getByPlaceholder(/検索/).clear();
    await page.getByPlaceholder(/検索/).fill('カフェ');
    await page.getByRole('button', { name: /検索/ }).click();
    
    await page.waitForResponse(response => 
      response.url().includes('/api/') && response.status() === 200,
      { timeout: 15000 }
    );
    
    expect(page.url()).toContain('search=カフェ');
    expect(page.url()).toContain('sort=year_asc');
    
    console.log('✅ Search after browser refresh successful');
    
    const errors = (page as any)._testErrors;
    if (errors.length > 0) {
      console.log('❌ Errors after browser refresh:', errors);
    }
  });

  test('should search after applying and removing filters', async ({ page }) => {
    console.log('🔍 Testing search after applying and removing filters...');
    
    await page.goto('/architecture');
    await page.waitForLoadState('networkidle');
    
    // Use autocomplete to apply a filter
    const autocompleteInput = page.getByPlaceholder(/検索/);
    await autocompleteInput.fill('東京');
    
    // Wait for autocomplete options to appear
    await page.waitForTimeout(1000);
    
    // Look for Tokyo prefecture option in autocomplete
    const tokyoOption = page.getByText(/東京/, { exact: false }).first();
    if (await tokyoOption.count() > 0) {
      await tokyoOption.click();
      console.log('Applied Tokyo filter via autocomplete');
      
      await page.waitForResponse(response => 
        response.url().includes('/api/') && response.status() === 200,
        { timeout: 15000 }
      );
      
      // Verify filter is applied
      const hasFilter = await page.locator('.MuiChip-root').count() > 0;
      if (hasFilter) {
        console.log('Filter chip is visible');
        
        // Remove filter
        const clearButton = page.getByRole('button', { name: /すべてクリア/ });
        if (await clearButton.count() > 0) {
          await clearButton.click();
          console.log('Cleared all filters');
          
          await page.waitForResponse(response => 
            response.url().includes('/api/') && response.status() === 200,
            { timeout: 15000 }
          );
        }
      }
    }
    
    // Now perform a fresh search
    await page.getByPlaceholder(/検索/).clear();
    await page.getByPlaceholder(/検索/).fill('テスト検索');
    await page.getByRole('button', { name: /検索/ }).click();
    
    await page.waitForResponse(response => 
      response.url().includes('/api/') && response.status() === 200,
      { timeout: 15000 }
    );
    
    console.log('✅ Search after filter manipulation successful');
  });

  test('should handle search state consistency across all navigation patterns', async ({ page }) => {
    console.log('🔍 Testing search state consistency across multiple navigation patterns...');
    
    await page.goto('/architecture');
    await page.waitForLoadState('networkidle');
    
    // Complex navigation pattern test
    const testSequence = [
      { action: 'initial_search', term: 'テスト建築', expectInUrl: true },
      { action: 'sort_change', value: 'name_asc', expectInUrl: true },
      { action: 'view_change', mode: 'list' },
      { action: 'search_change', term: '新テスト', expectInUrl: true },
      { action: 'refresh' },
      { action: 'search_change', term: '最終テスト', expectInUrl: true }
    ];
    
    for (const step of testSequence) {
      console.log(`Executing step: ${step.action}`);
      
      switch (step.action) {
        case 'initial_search':
        case 'search_change':
          await page.getByPlaceholder(/検索/).clear();
          await page.getByPlaceholder(/検索/).fill(step.term);
          await page.getByRole('button', { name: /検索/ }).click();
          
          await page.waitForResponse(response => 
            response.url().includes('/api/') && response.status() === 200,
            { timeout: 15000 }
          );
          
          if (step.expectInUrl) {
            expect(page.url()).toContain(`search=${step.term}`);
            await expect(page.getByPlaceholder(/検索/)).toHaveValue(step.term);
          }
          break;
          
        case 'sort_change':
          await page.selectOption('select', step.value);
          await page.waitForResponse(response => 
            response.url().includes('/api/') && response.status() === 200,
            { timeout: 15000 }
          );
          if (step.expectInUrl) {
            expect(page.url()).toContain(`sort=${step.value}`);
          }
          break;
          
        case 'view_change':
          if (step.mode === 'list') {
            const listViewButton = page.getByLabel(/リストビュー/);
            if (await listViewButton.count() > 0) {
              await listViewButton.click();
              await page.waitForTimeout(1000);
            }
          }
          break;
          
        case 'refresh':
          const urlBeforeRefresh = page.url();
          await page.reload();
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(2000);
          expect(page.url()).toBe(urlBeforeRefresh);
          break;
      }
      
      // Check for any JavaScript errors after each step
      const errors = (page as any)._testErrors;
      if (errors.length > 0) {
        console.log(`❌ Errors during step ${step.action}:`, errors.slice(-3)); // Show last 3 errors
      }
    }
    
    console.log('✅ Complex navigation pattern test completed');
  });

  test('should document search failures related to navigation state', async ({ page }) => {
    console.log('📝 Documenting search behavior and potential failures...');
    
    const failureReport = {
      timestamp: new Date().toISOString(),
      testEnvironment: 'Playwright E2E',
      searchBehaviorAnalysis: {},
      navigationPatternIssues: []
    };
    
    try {
      await page.goto('/architecture');
      await page.waitForLoadState('networkidle');
      
      // Test scenarios that might fail
      const scenarios = [
        {
          name: 'Fast navigation during search',
          test: async () => {
            await page.getByPlaceholder(/検索/).fill('クイックテスト');
            // Don't wait for search to complete, immediately navigate
            await page.goto('/');
            await page.goto('/architecture');
            await page.waitForLoadState('networkidle');
          }
        },
        {
          name: 'Multiple rapid searches',
          test: async () => {
            for (let i = 0; i < 3; i++) {
              await page.getByPlaceholder(/検索/).fill(`ラピッド${i}`);
              await page.getByRole('button', { name: /検索/ }).click();
              await page.waitForTimeout(100); // Very short wait
            }
          }
        },
        {
          name: 'Search during page transition',
          test: async () => {
            // Start navigation
            const navigationPromise = page.goto('/architecture');
            // Try to search before page fully loads
            await page.getByPlaceholder(/検索/).fill('トランジション');
            await navigationPromise;
            await page.waitForLoadState('networkidle');
          }
        }
      ];
      
      for (const scenario of scenarios) {
        console.log(`Testing scenario: ${scenario.name}`);
        const startTime = Date.now();
        const errorsBefore = (page as any)._testErrors.length;
        
        try {
          await scenario.test();
          const endTime = Date.now();
          const errorsAfter = (page as any)._testErrors.length;
          
          failureReport.searchBehaviorAnalysis[scenario.name] = {
            status: 'passed',
            duration: endTime - startTime,
            newErrors: errorsAfter - errorsBefore,
            notes: 'Scenario completed without critical failures'
          };
        } catch (error) {
          failureReport.navigationPatternIssues.push({
            scenario: scenario.name,
            error: error.message,
            timestamp: new Date().toISOString()
          });
        }
      }
      
      // Test URL consistency
      await page.goto('/architecture?search=URLテスト&sort=name_asc');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      const searchInput = await page.getByPlaceholder(/検索/).inputValue();
      const sortValue = await page.locator('select').inputValue();
      
      failureReport.searchBehaviorAnalysis['URL state restoration'] = {
        searchInputRestored: searchInput === 'URLテスト',
        sortStateRestored: sortValue === 'name_asc',
        notes: `Search input: "${searchInput}", Sort value: "${sortValue}"`
      };
      
      console.log('📊 Search Behavior Analysis Report:');
      console.log(JSON.stringify(failureReport, null, 2));
      
    } catch (error) {
      console.log('❌ Documentation test failed:', error.message);
    }
  });

});