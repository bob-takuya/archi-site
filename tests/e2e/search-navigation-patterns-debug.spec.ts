import { test, expect } from '@playwright/test';

test.describe('Search Navigation Patterns - Debug', () => {
  
  test('debug search functionality and identify issues', async ({ page }) => {
    console.log('🔍 Starting debug analysis of search functionality...');
    
    // Go to architecture page
    await page.goto('/architecture');
    await page.waitForLoadState('networkidle');
    console.log('✅ Page loaded');
    
    // Check if page is accessible
    const title = await page.title();
    console.log(`Page title: ${title}`);
    
    // Look for search elements
    const searchInput = page.locator('input[placeholder*="検索"]');
    const searchInputCount = await searchInput.count();
    console.log(`Search input elements found: ${searchInputCount}`);
    
    if (searchInputCount > 0) {
      const placeholder = await searchInput.first().getAttribute('placeholder');
      console.log(`Search placeholder: ${placeholder}`);
      
      // Try to fill search
      await searchInput.first().fill('東京');
      console.log('✅ Search input filled');
      
      // Look for search button
      const searchButton = page.getByRole('button', { name: /検索/ });
      const searchButtonCount = await searchButton.count();
      console.log(`Search button elements found: ${searchButtonCount}`);
      
      if (searchButtonCount > 0) {
        await searchButton.click();
        console.log('✅ Search button clicked');
        
        // Wait for any response
        try {
          await page.waitForResponse(response => 
            response.url().includes('/') && response.status() < 400,
            { timeout: 5000 }
          );
          console.log('✅ Response received');
        } catch (e) {
          console.log('⚠️ No response within timeout');
        }
        
        // Check URL change
        const currentUrl = page.url();
        console.log(`Current URL: ${currentUrl}`);
        
        // Check for architecture items
        const items = page.locator('[data-testid="architecture-item"]');
        const itemCount = await items.count();
        console.log(`Architecture items found: ${itemCount}`);
        
        if (itemCount === 0) {
          // Look for alternative selectors
          const cardItems = page.locator('.MuiCard-root');
          const cardCount = await cardItems.count();
          console.log(`Card elements found: ${cardCount}`);
          
          const listItems = page.locator('.MuiListItem-root');
          const listCount = await listItems.count();
          console.log(`List items found: ${listCount}`);
        }
      } else {
        console.log('❌ No search button found');
      }
    } else {
      console.log('❌ No search input found');
      
      // Look for alternative search inputs
      const allInputs = page.locator('input');
      const inputCount = await allInputs.count();
      console.log(`Total input elements: ${inputCount}`);
      
      for (let i = 0; i < Math.min(inputCount, 5); i++) {
        const input = allInputs.nth(i);
        const placeholder = await input.getAttribute('placeholder');
        const type = await input.getAttribute('type');
        console.log(`Input ${i}: type="${type}", placeholder="${placeholder}"`);
      }
    }
    
    // Check for sorting controls
    const sortSelect = page.locator('select');
    const sortCount = await sortSelect.count();
    console.log(`Sort select elements found: ${sortCount}`);
    
    // Check for pagination
    const pagination = page.locator('.MuiPagination-root');
    const paginationCount = await pagination.count();
    console.log(`Pagination elements found: ${paginationCount}`);
    
    // Check for view mode buttons
    const viewButtons = page.locator('[aria-label*="ビュー"]');
    const viewButtonCount = await viewButtons.count();
    console.log(`View mode buttons found: ${viewButtonCount}`);
  });

  test('test simplified search flow', async ({ page }) => {
    console.log('🔍 Testing simplified search flow...');
    
    await page.goto('/architecture');
    await page.waitForLoadState('networkidle');
    
    // Wait for any loading to complete
    await page.waitForTimeout(3000);
    
    // Try basic search without waiting for specific responses
    const searchInput = page.locator('input').first();
    await searchInput.fill('テスト');
    
    // Press Enter instead of clicking button
    await searchInput.press('Enter');
    
    // Wait and check for any changes
    await page.waitForTimeout(2000);
    
    const url = page.url();
    console.log(`URL after search: ${url}`);
    
    if (url.includes('テスト') || url.includes('test')) {
      console.log('✅ Search term appears in URL');
    } else {
      console.log('❌ Search term not in URL');
    }
  });

  test('test navigation without search', async ({ page }) => {
    console.log('🔍 Testing navigation without search...');
    
    await page.goto('/architecture');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Try sorting
    const sortSelect = page.locator('select').first();
    if (await sortSelect.count() > 0) {
      await sortSelect.selectOption('name_asc');
      console.log('✅ Sort option changed');
      await page.waitForTimeout(1000);
      
      const url = page.url();
      console.log(`URL after sort: ${url}`);
    }
    
    // Try pagination
    const page2 = page.locator('button[aria-label="Go to page 2"]');
    if (await page2.count() > 0) {
      await page2.click();
      console.log('✅ Navigated to page 2');
      await page.waitForTimeout(1000);
      
      const url = page.url();
      console.log(`URL after pagination: ${url}`);
    } else {
      console.log('⚠️ Page 2 not available');
    }
  });

  test('document current search behavior vs expectations', async ({ page }) => {
    console.log('📝 Documenting search behavior...');
    
    const report = {
      timestamp: new Date().toISOString(),
      expectedBehavior: {
        searchAfterPageLoad: 'Should be able to search immediately after page loads',
        searchAfterSorting: 'Search should work after changing sort order',
        searchAfterPagination: 'Search should work after navigating through pages',
        searchAfterNavigation: 'Search should work after navigating away and back',
        searchAfterRefresh: 'Search state should persist after browser refresh'
      },
      actualBehavior: {},
      failures: [],
      recommendations: []
    };
    
    try {
      await page.goto('/architecture');
      await page.waitForLoadState('networkidle');
      
      // Test 1: Immediate search
      console.log('Testing immediate search...');
      const searchInput = page.locator('input').first();
      const searchButton = page.getByRole('button', { name: /検索/ });
      
      if (await searchInput.count() > 0 && await searchButton.count() > 0) {
        await searchInput.fill('テスト');
        await searchButton.click();
        await page.waitForTimeout(3000);
        
        const urlAfterSearch = page.url();
        report.actualBehavior.searchAfterPageLoad = {
          success: urlAfterSearch.includes('テスト') || urlAfterSearch.includes('search='),
          url: urlAfterSearch,
          notes: 'Search input and button are present'
        };
      } else {
        report.failures.push('Search input or button not found');
        report.actualBehavior.searchAfterPageLoad = {
          success: false,
          notes: `Search input count: ${await searchInput.count()}, Button count: ${await searchButton.count()}`
        };
      }
      
      // Test 2: Search timing issues
      console.log('Testing search timing...');
      await page.goto('/architecture');
      await page.waitForLoadState('domcontentloaded'); // Don't wait for networkidle
      
      try {
        await searchInput.fill('速いテスト');
        await searchButton.click();
        await page.waitForTimeout(1000);
        
        report.actualBehavior.fastSearch = {
          success: true,
          notes: 'Search works without waiting for networkidle'
        };
      } catch (e) {
        report.actualBehavior.fastSearch = {
          success: false,
          notes: `Error: ${e.message}`
        };
      }
      
    } catch (error) {
      report.failures.push(`Test execution failed: ${error.message}`);
    }
    
    // Generate recommendations
    if (report.failures.length > 0) {
      report.recommendations.push('Check search element selectors and timing');
      report.recommendations.push('Verify API endpoints are accessible');
      report.recommendations.push('Consider reducing wait times for better test performance');
    }
    
    console.log('📊 Search Behavior Report:');
    console.log(JSON.stringify(report, null, 2));
  });
});