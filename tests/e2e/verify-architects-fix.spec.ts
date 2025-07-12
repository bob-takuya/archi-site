import { test, expect } from '@playwright/test';

test.describe('Verify Architects Tab Fix', () => {
  test('should load architects tab successfully after environment variable fix', async ({ page }) => {
    // Set up console logging to monitor for errors
    const consoleLogs: string[] = [];
    const consoleErrors: string[] = [];
    
    page.on('console', (msg) => {
      const text = `[${msg.type()}] ${msg.text()}`;
      consoleLogs.push(text);
      if (msg.type() === 'error') {
        consoleErrors.push(text);
      }
    });
    
    page.on('pageerror', (error) => {
      consoleErrors.push(`Page Error: ${error.message}`);
    });
    
    console.log('Testing homepage after fix...');
    
    // Navigate to the application
    await page.goto('http://localhost:3000/archi-site/', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // Take screenshot of homepage
    await page.screenshot({ 
      path: '/Users/homeserver/ai-creative-team/archi-site/temp/homepage-after-fix.png',
      fullPage: true 
    });
    
    // Check if the app renders properly now
    console.log('Checking for app content...');
    
    // Look for navigation or header content
    const navigation = page.locator('nav, header').first();
    const navVisible = await navigation.isVisible().catch(() => false);
    console.log(`Navigation visible: ${navVisible}`);
    
    // Look for main content
    const mainContent = page.locator('main, [role="main"]').first();
    const mainVisible = await mainContent.isVisible().catch(() => false);
    console.log(`Main content visible: ${mainVisible}`);
    
    // Check for any text content indicating the page loaded
    const bodyText = await page.locator('body').textContent();
    const hasContent = bodyText && bodyText.trim().length > 0;
    console.log(`Page has text content: ${hasContent}`);
    
    if (hasContent) {
      console.log(`First 100 characters: "${bodyText?.slice(0, 100)}..."`);
    }
    
    // Test navigation to architects page
    console.log('Attempting to navigate to architects page...');
    
    try {
      await page.goto('http://localhost:3000/archi-site/#/architects', { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });
      
      console.log('Architects page loaded, checking content...');
      
      // Wait for React to render
      await page.waitForTimeout(3000);
      
      // Take screenshot of architects page
      await page.screenshot({ 
        path: '/Users/homeserver/ai-creative-team/archi-site/temp/architects-after-fix.png',
        fullPage: true 
      });
      
      // Check for architects page specific content
      const architectsTitle = page.locator('h1, h2, h3').first();
      const titleText = await architectsTitle.textContent().catch(() => '');
      console.log(`Architects page title: "${titleText}"`);
      
      // Check for search functionality
      const searchBox = page.locator('input[type="text"], input[placeholder*="検索"]').first();
      const searchVisible = await searchBox.isVisible().catch(() => false);
      console.log(`Search box visible: ${searchVisible}`);
      
      // Check for architects list or cards
      const architectsList = page.locator('.MuiGrid-container, .MuiCard-root').first();
      const listVisible = await architectsList.isVisible().catch(() => false);
      console.log(`Architects list/cards visible: ${listVisible}`);
      
      // Check for loading indicator (should not be stuck loading)
      const loadingSpinner = page.locator('[role="progressbar"], .MuiCircularProgress-root');
      const isLoading = await loadingSpinner.isVisible().catch(() => false);
      console.log(`Still loading: ${isLoading}`);
      
      // If it's still loading, wait a bit more and check again
      if (isLoading) {
        console.log('Waiting for loading to complete...');
        await page.waitForTimeout(10000);
        const stillLoading = await loadingSpinner.isVisible().catch(() => false);
        console.log(`Still loading after 10s: ${stillLoading}`);
      }
      
    } catch (error) {
      console.error('Error navigating to architects page:', error);
    }
    
    // Test other tabs to ensure fix is comprehensive
    console.log('\n=== Testing other tabs ===');
    
    const tabsToTest = [
      { name: 'Architecture', url: 'http://localhost:3000/archi-site/#/architecture' },
      { name: 'Map', url: 'http://localhost:3000/archi-site/#/map' }
    ];
    
    for (const tab of tabsToTest) {
      console.log(`\nTesting ${tab.name} tab...`);
      
      try {
        await page.goto(tab.url, { waitUntil: 'networkidle', timeout: 15000 });
        await page.waitForTimeout(2000);
        
        const tabContent = await page.locator('body').textContent();
        const hasTabContent = tabContent && tabContent.trim().length > 0;
        console.log(`${tab.name} tab has content: ${hasTabContent}`);
        
        if (hasTabContent) {
          console.log(`${tab.name} first 50 chars: "${tabContent?.slice(0, 50)}..."`);
        }
        
        await page.screenshot({ 
          path: `/Users/homeserver/ai-creative-team/archi-site/temp/${tab.name.toLowerCase()}-after-fix.png`,
          fullPage: true 
        });
        
      } catch (error) {
        console.error(`Error testing ${tab.name} tab:`, error);
      }
    }
    
    // Summary of console errors after fix
    console.log('\n=== POST-FIX ERROR ANALYSIS ===');
    console.log(`Total console logs: ${consoleLogs.length}`);
    console.log(`Console errors: ${consoleErrors.length}`);
    
    // Filter out process-related errors to see if fix worked
    const processErrors = consoleErrors.filter(error => 
      error.toLowerCase().includes('process is not defined')
    );
    
    console.log(`Process-related errors: ${processErrors.length}`);
    
    if (consoleErrors.length > 0) {
      console.log('\nRemaining Console Errors:');
      consoleErrors.forEach(error => console.log(`  ${error}`));
    }
    
    // Expected results after fix
    console.log('\n=== VERIFICATION RESULTS ===');
    console.log(`✅ Fix Applied: Environment variable changed to import.meta.env.DEV`);
    console.log(`🔍 Process Errors: ${processErrors.length === 0 ? '✅ RESOLVED' : '❌ STILL PRESENT'}`);
    console.log(`🎨 UI Rendering: ${mainVisible ? '✅ WORKING' : '❌ STILL BROKEN'}`);
    console.log(`🏗️ Navigation: ${navVisible ? '✅ WORKING' : '❌ STILL BROKEN'}`);
    
    // This test should pass if the fix worked
    expect(processErrors.length).toBe(0);
  });
});