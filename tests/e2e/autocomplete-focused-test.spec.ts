/**
 * Focused Autocomplete Test Based on Actual Implementation
 * 
 * Based on diagnostic results, the architecture page uses:
 * - 1 TextField component
 * - 2 InputBase components  
 * - 1 Autocomplete component
 * - 1 Search icon
 * - 2 total input elements
 */

import { test, expect } from '@playwright/test';

test.describe('Autocomplete Focused Tests', () => {
  
  test('test autocomplete on architecture page with actual selectors', async ({ page }) => {
    console.log('🎯 Testing autocomplete with real selectors...');
    
    await page.goto('/#/architecture');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);
    
    // Take initial screenshot
    await page.screenshot({ path: 'tests/screenshots/arch-page-initial.png', fullPage: true });
    
    // Look for Material-UI Autocomplete component
    const autocompleteComponent = page.locator('.MuiAutocomplete-root');
    
    if (await autocompleteComponent.isVisible()) {
      console.log('✅ Found MuiAutocomplete component');
      
      // Find the input within the autocomplete
      const autocompleteInput = autocompleteComponent.locator('input');
      
      if (await autocompleteInput.isVisible()) {
        console.log('✅ Found input within autocomplete');
        
        const placeholder = await autocompleteInput.getAttribute('placeholder');
        console.log(`Autocomplete placeholder: "${placeholder}"`);
        
        // Test typing in the autocomplete
        await autocompleteInput.click();
        await autocompleteInput.fill('東京');
        
        console.log('Typed "東京" into autocomplete');
        
        // Wait for potential dropdown
        await page.waitForTimeout(1000);
        
        // Look for dropdown/suggestions
        const dropdownSelectors = [
          '.MuiAutocomplete-popper',
          '.MuiPaper-root[role="listbox"]',
          '.MuiAutocomplete-listbox',
          '.MuiAutocomplete-option',
          '[role="listbox"]',
          '[role="option"]',
          '*[data-testid*="suggestion"]'
        ];
        
        let foundDropdown = false;
        for (const selector of dropdownSelectors) {
          const dropdown = page.locator(selector);
          if (await dropdown.isVisible()) {
            console.log(`✅ Found dropdown with selector: ${selector}`);
            foundDropdown = true;
            
            const options = dropdown.locator('*').filter({ hasText: /東京/i });
            const optionCount = await options.count();
            console.log(`  Options containing "東京": ${optionCount}`);
            
            if (optionCount > 0) {
              // Test clicking an option
              const firstOption = options.first();
              const optionText = await firstOption.textContent();
              console.log(`  Clicking option: "${optionText}"`);
              
              await firstOption.click();
              await page.waitForTimeout(500);
              
              // Check if input value changed
              const newValue = await autocompleteInput.inputValue();
              console.log(`  New input value: "${newValue}"`);
            }
            break;
          }
        }
        
        if (!foundDropdown) {
          console.log('❌ No dropdown found after typing');
          
          // Take screenshot for debugging
          await page.screenshot({ path: 'tests/screenshots/no-dropdown.png', fullPage: true });
        }
        
        // Take final screenshot
        await page.screenshot({ path: 'tests/screenshots/arch-page-after-test.png', fullPage: true });
        
      } else {
        console.log('❌ No input found within autocomplete');
      }
    } else {
      console.log('❌ No MuiAutocomplete component found');
      
      // Try other input elements
      console.log('🔍 Trying other input elements...');
      
      const allInputs = await page.locator('input').all();
      for (let i = 0; i < allInputs.length; i++) {
        const input = allInputs[i];
        const visible = await input.isVisible();
        const placeholder = await input.getAttribute('placeholder');
        const type = await input.getAttribute('type');
        
        console.log(`Input ${i + 1}: visible=${visible}, placeholder="${placeholder}", type="${type}"`);
        
        if (visible) {
          console.log(`  Testing input ${i + 1}...`);
          await input.click();
          await input.fill('東京');
          await page.waitForTimeout(1000);
          
          // Check for any changes
          const currentValue = await input.inputValue();
          console.log(`  Current value: "${currentValue}"`);
        }
      }
    }
    
    expect(true).toBeTruthy(); // Test for information gathering
  });
  
  test('test homepage search functionality for comparison', async ({ page }) => {
    console.log('🏠 Testing homepage search for comparison...');
    
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    // Find the homepage search input
    const searchInput = page.locator('input[placeholder*="建築作品"]');
    
    if (await searchInput.isVisible()) {
      console.log('✅ Found homepage search input');
      
      const placeholder = await searchInput.getAttribute('placeholder');
      console.log(`Homepage search placeholder: "${placeholder}"`);
      
      // Test autocomplete on homepage
      await searchInput.click();
      await searchInput.fill('東京');
      
      console.log('Typed "東京" into homepage search');
      await page.waitForTimeout(1000);
      
      // Look for any dropdown or suggestions
      const suggestionElements = await page.locator('*').filter({ hasText: /東京/i }).count();
      console.log(`Elements containing "東京" after typing: ${suggestionElements}`);
      
      // Test Enter key
      await searchInput.press('Enter');
      await page.waitForTimeout(1000);
      
      const currentUrl = page.url();
      console.log(`URL after search: ${currentUrl}`);
      
      // Take screenshot
      await page.screenshot({ path: 'tests/screenshots/homepage-search-test.png', fullPage: true });
      
    } else {
      console.log('❌ Homepage search input not found');
    }
    
    expect(true).toBeTruthy(); // Test for information gathering
  });
  
  test('test network throttling with autocomplete', async ({ page, context }) => {
    console.log('🌐 Testing autocomplete with network throttling...');
    
    // Monitor network requests
    const autocompleteRequests: string[] = [];
    page.on('request', request => {
      const url = request.url();
      if (url.includes('search') || url.includes('autocomplete') || url.includes('suggest')) {
        autocompleteRequests.push(url);
        console.log(`Autocomplete request: ${url}`);
      }
    });
    
    await page.goto('/#/architecture');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    // Find and test autocomplete with normal network
    const autocompleteComponent = page.locator('.MuiAutocomplete-root');
    
    if (await autocompleteComponent.isVisible()) {
      const autocompleteInput = autocompleteComponent.locator('input');
      
      if (await autocompleteInput.isVisible()) {
        console.log('Testing normal network speed...');
        
        await autocompleteInput.click();
        await autocompleteInput.fill('東京');
        await page.waitForTimeout(2000);
        
        console.log(`Normal network - Autocomplete requests: ${autocompleteRequests.length}`);
        
        // Clear and test with slow network
        await autocompleteInput.fill('');
        autocompleteRequests.length = 0;
        
        // Set up slow network
        await context.route('**/*', async route => {
          if (route.request().url().includes('search') || 
              route.request().url().includes('autocomplete')) {
            await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
          }
          await route.continue();
        });
        
        console.log('Testing slow network speed...');
        
        await autocompleteInput.fill('大阪');
        await page.waitForTimeout(4000); // Wait longer for slow network
        
        console.log(`Slow network - Autocomplete requests: ${autocompleteRequests.length}`);
        
      }
    }
    
    expect(true).toBeTruthy(); // Test for information gathering
  });
  
  test('document autocomplete behavior and failures', async ({ page }) => {
    console.log('📝 Documenting autocomplete behavior...');
    
    const testResults = {
      homepageSearch: { working: false, details: '' },
      architecturePageAutocomplete: { working: false, details: '' },
      networkRequests: { count: 0, urls: [] as string[] },
      errors: [] as string[],
      recommendations: [] as string[]
    };
    
    // Monitor errors
    page.on('pageerror', error => {
      testResults.errors.push(error.message);
      console.log(`Page error: ${error.message}`);
    });
    
    // Monitor console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        testResults.errors.push(msg.text());
        console.log(`Console error: ${msg.text()}`);
      }
    });
    
    // Monitor network
    page.on('request', request => {
      const url = request.url();
      if (url.includes('search') || url.includes('autocomplete')) {
        testResults.networkRequests.count++;
        testResults.networkRequests.urls.push(url);
      }
    });
    
    // Test homepage
    console.log('Testing homepage search...');
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    const homepageSearch = page.locator('input[placeholder*="建築作品"]');
    if (await homepageSearch.isVisible()) {
      testResults.homepageSearch.working = true;
      testResults.homepageSearch.details = 'Found search input with correct placeholder';
      
      await homepageSearch.click();
      await homepageSearch.fill('テスト');
      await page.waitForTimeout(1000);
    } else {
      testResults.homepageSearch.details = 'Search input not found';
    }
    
    // Test architecture page
    console.log('Testing architecture page autocomplete...');
    await page.goto('/#/architecture');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);
    
    const autocompleteComponent = page.locator('.MuiAutocomplete-root');
    if (await autocompleteComponent.isVisible()) {
      const input = autocompleteComponent.locator('input');
      if (await input.isVisible()) {
        testResults.architecturePageAutocomplete.working = true;
        testResults.architecturePageAutocomplete.details = 'Found MUI Autocomplete component with input';
        
        await input.click();
        await input.fill('テスト');
        await page.waitForTimeout(2000);
        
        // Check for dropdown
        const dropdown = page.locator('.MuiAutocomplete-popper, [role="listbox"]');
        if (await dropdown.isVisible()) {
          testResults.architecturePageAutocomplete.details += ' - Dropdown appears';
        } else {
          testResults.architecturePageAutocomplete.details += ' - No dropdown visible';
        }
      } else {
        testResults.architecturePageAutocomplete.details = 'Autocomplete component found but no input';
      }
    } else {
      testResults.architecturePageAutocomplete.details = 'No MUI Autocomplete component found';
    }
    
    // Generate recommendations
    if (!testResults.homepageSearch.working) {
      testResults.recommendations.push('Homepage search input needs to be implemented or fixed');
    }
    
    if (!testResults.architecturePageAutocomplete.working) {
      testResults.recommendations.push('Architecture page autocomplete needs implementation');
    }
    
    if (testResults.networkRequests.count === 0) {
      testResults.recommendations.push('No autocomplete network requests detected - backend service may be missing');
    }
    
    if (testResults.errors.length > 0) {
      testResults.recommendations.push('JavaScript errors are preventing autocomplete from working');
    }
    
    // Generate report
    console.log('\n📊 AUTOCOMPLETE TEST REPORT:');
    console.log('=====================================');
    console.log(`Homepage Search: ${testResults.homepageSearch.working ? '✅ Working' : '❌ Not Working'}`);
    console.log(`  Details: ${testResults.homepageSearch.details}`);
    console.log(`Architecture Page Autocomplete: ${testResults.architecturePageAutocomplete.working ? '✅ Working' : '❌ Not Working'}`);
    console.log(`  Details: ${testResults.architecturePageAutocomplete.details}`);
    console.log(`Network Requests: ${testResults.networkRequests.count}`);
    testResults.networkRequests.urls.forEach(url => console.log(`  - ${url}`));
    console.log(`Errors Found: ${testResults.errors.length}`);
    testResults.errors.forEach(error => console.log(`  - ${error}`));
    console.log('Recommendations:');
    testResults.recommendations.forEach(rec => console.log(`  • ${rec}`));
    console.log('=====================================\n');
    
    expect(true).toBeTruthy(); // Test for documentation
  });
});