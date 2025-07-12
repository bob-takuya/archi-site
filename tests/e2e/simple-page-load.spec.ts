/**
 * Simple Page Load Test
 * Test basic page loading and identify what's actually on the page
 */

import { test, expect } from '@playwright/test';

test.describe('Simple Page Load Tests', () => {
  
  test('test if homepage loads correctly', async ({ page }) => {
    console.log('🏠 Testing homepage load...');
    
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);
    
    // Take screenshot
    await page.screenshot({ path: 'tests/screenshots/homepage.png', fullPage: true });
    
    // Check if page has loaded
    const title = await page.title();
    console.log(`Page title: "${title}"`);
    
    // List all elements on page
    const allElements = await page.locator('*').count();
    console.log(`Total elements on page: ${allElements}`);
    
    // Check for any text content
    const bodyText = await page.locator('body').textContent();
    console.log(`Body text length: ${bodyText?.length || 0}`);
    console.log(`First 200 characters: "${bodyText?.substring(0, 200)}..."`);
    
    // Check for input elements
    const inputs = await page.locator('input').all();
    console.log(`Found ${inputs.length} input elements`);
    
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];
      const placeholder = await input.getAttribute('placeholder');
      const type = await input.getAttribute('type');
      const visible = await input.isVisible();
      console.log(`Input ${i + 1}: type=${type}, placeholder="${placeholder}", visible=${visible}`);
    }
    
    expect(title).toBeTruthy();
  });
  
  test('test all main routes', async ({ page }) => {
    const routes = ['/', '/#/architecture', '/#/architects', '/#/map'];
    
    for (const route of routes) {
      console.log(`🌐 Testing route: ${route}`);
      
      await page.goto(route);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);
      
      const title = await page.title();
      const url = page.url();
      const bodyText = await page.locator('body').textContent();
      
      console.log(`Route: ${route}`);
      console.log(`  Title: "${title}"`);
      console.log(`  URL: ${url}`);
      console.log(`  Content length: ${bodyText?.length || 0}`);
      
      // Check for search inputs on each page
      const searchInputs = await page.locator('input[placeholder*="検索"], input[placeholder*="search"], input[type="search"]').count();
      console.log(`  Search inputs found: ${searchInputs}`);
      
      if (searchInputs > 0) {
        const firstSearchInput = page.locator('input[placeholder*="検索"], input[placeholder*="search"], input[type="search"]').first();
        const placeholder = await firstSearchInput.getAttribute('placeholder');
        const visible = await firstSearchInput.isVisible();
        console.log(`  First search input: placeholder="${placeholder}", visible=${visible}`);
      }
      
      // Take screenshot
      const routeName = route.replace(/[/#]/g, '_') || 'root';
      await page.screenshot({ path: `tests/screenshots/route_${routeName}.png`, fullPage: true });
    }
  });
  
  test('check architecture page specifically', async ({ page }) => {
    console.log('🏛️ Testing architecture page specifically...');
    
    await page.goto('/#/architecture');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(5000); // Wait longer for any async loading
    
    await page.screenshot({ path: 'tests/screenshots/architecture-page-detailed.png', fullPage: true });
    
    // Get page HTML for inspection
    const html = await page.content();
    console.log(`Page HTML length: ${html.length}`);
    
    // Check for common search-related elements
    const searchElements = {
      'Input with search placeholder': await page.locator('input[placeholder*="検索"]').count(),
      'Input with type search': await page.locator('input[type="search"]').count(),
      'TextField components': await page.locator('.MuiTextField-root').count(),
      'InputBase components': await page.locator('.MuiInputBase-root').count(),
      'Autocomplete components': await page.locator('.MuiAutocomplete-root').count(),
      'Search icons': await page.locator('svg[data-testid="SearchIcon"]').count(),
      'Any input elements': await page.locator('input').count(),
      'Button elements': await page.locator('button').count(),
      'Text containing search': await page.locator('*').filter({ hasText: /検索|search/i }).count()
    };
    
    console.log('Search-related elements found:');
    Object.entries(searchElements).forEach(([key, count]) => {
      console.log(`  ${key}: ${count}`);
    });
    
    // Check for data loading
    const dataElements = {
      'Architecture items': await page.locator('[data-testid*="architecture"]').count(),
      'Card components': await page.locator('.MuiCard-root').count(),
      'List items': await page.locator('.MuiListItem-root').count(),
      'Grid items': await page.locator('.MuiGrid-item').count()
    };
    
    console.log('Data elements found:');
    Object.entries(dataElements).forEach(([key, count]) => {
      console.log(`  ${key}: ${count}`);
    });
    
    // Check for any error messages
    const errorElements = await page.locator('*').filter({ hasText: /error|エラー|失敗|failed/i }).count();
    console.log(`Error elements found: ${errorElements}`);
    
    if (errorElements > 0) {
      const errorTexts = await page.locator('*').filter({ hasText: /error|エラー|失敗|failed/i }).allTextContents();
      console.log('Error messages:', errorTexts);
    }
    
    // Check for loading indicators
    const loadingElements = await page.locator('*').filter({ hasText: /loading|読み込み|ロード/i }).count();
    console.log(`Loading elements found: ${loadingElements}`);
    
    expect(true).toBeTruthy(); // This test is for information gathering
  });
});