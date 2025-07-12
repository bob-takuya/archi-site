import { test, expect } from '@playwright/test';

test.describe('Architects Tab Loading Investigation', () => {
  test('should investigate architects tab loading behavior', async ({ page }) => {
    // Set up console logging to capture JavaScript errors
    const consoleLogs: string[] = [];
    const consoleErrors: string[] = [];
    const networkErrors: string[] = [];
    
    // Capture console messages
    page.on('console', (msg) => {
      const text = `[${msg.type()}] ${msg.text()}`;
      consoleLogs.push(text);
      if (msg.type() === 'error') {
        consoleErrors.push(text);
      }
    });
    
    // Capture network failures
    page.on('response', (response) => {
      if (!response.ok()) {
        networkErrors.push(`${response.status()} ${response.statusText()} - ${response.url()}`);
      }
    });
    
    // Capture page errors
    page.on('pageerror', (error) => {
      consoleErrors.push(`Page Error: ${error.message}`);
    });
    
    console.log('Starting architects tab investigation...');
    
    // Navigate to the application
    await page.goto('http://localhost:3000/archi-site/', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    console.log('Homepage loaded successfully');
    
    // Wait for the page to fully load
    await page.waitForLoadState('domcontentloaded');
    
    // Take a screenshot of the homepage
    await page.screenshot({ 
      path: '/Users/homeserver/ai-creative-team/archi-site/temp/homepage-investigation.png',
      fullPage: true 
    });
    
    // Look for navigation menu and architects link
    console.log('Looking for architects navigation link...');
    
    // Try to find the architects link in different ways
    const architectsLink = page.locator('a[href*="architects"]').first();
    const architectsButton = page.locator('text=建築家').first(); // Japanese text for "Architects"
    const architectsNav = page.locator('[data-testid="architects-nav"]').first();
    
    // Check if any architects navigation element is visible
    const linkVisible = await architectsLink.isVisible().catch(() => false);
    const buttonVisible = await architectsButton.isVisible().catch(() => false);
    const navVisible = await architectsNav.isVisible().catch(() => false);
    
    console.log(`Architects link visible: ${linkVisible}`);
    console.log(`Architects button visible: ${buttonVisible}`);
    console.log(`Architects nav visible: ${navVisible}`);
    
    // Log all visible navigation elements
    const allNavLinks = await page.locator('nav a, header a').all();
    console.log(`Found ${allNavLinks.length} navigation links`);
    
    for (let i = 0; i < allNavLinks.length; i++) {
      const text = await allNavLinks[i].textContent();
      const href = await allNavLinks[i].getAttribute('href');
      console.log(`Nav link ${i}: "${text}" -> ${href}`);
    }
    
    // Try to navigate to architects page directly
    console.log('Attempting to navigate to architects page...');
    
    try {
      // First, try clicking the architects link if it exists
      if (linkVisible) {
        console.log('Clicking architects link...');
        await architectsLink.click();
      } else if (buttonVisible) {
        console.log('Clicking architects button...');
        await architectsButton.click();
      } else {
        console.log('No architects navigation found, navigating directly...');
        await page.goto('http://localhost:3000/archi-site/#/architects', { 
          waitUntil: 'networkidle',
          timeout: 30000 
        });
      }
      
      console.log('Navigation initiated, waiting for page to load...');
      
      // Wait for the architects page to start loading
      await page.waitForURL('**/architects*', { timeout: 10000 });
      console.log('URL changed to architects page');
      
      // Wait for page load state
      await page.waitForLoadState('domcontentloaded');
      
      // Look for loading indicators
      const loadingSpinner = page.locator('[role="progressbar"], .MuiCircularProgress-root');
      const loadingText = page.locator('text=読み込み中, text=Loading');
      
      console.log('Checking for loading indicators...');
      const hasSpinner = await loadingSpinner.isVisible().catch(() => false);
      const hasLoadingText = await loadingText.isVisible().catch(() => false);
      
      console.log(`Loading spinner visible: ${hasSpinner}`);
      console.log(`Loading text visible: ${hasLoadingText}`);
      
      // Monitor loading state for up to 30 seconds
      const startTime = Date.now();
      let stillLoading = true;
      let loadingTimeout = false;
      
      while (stillLoading && !loadingTimeout) {
        const elapsed = Date.now() - startTime;
        if (elapsed > 30000) {
          loadingTimeout = true;
          console.log('Loading timeout reached (30 seconds)');
          break;
        }
        
        // Check if still loading
        const spinnerVisible = await loadingSpinner.isVisible().catch(() => false);
        const textVisible = await loadingText.isVisible().catch(() => false);
        stillLoading = spinnerVisible || textVisible;
        
        if (stillLoading) {
          console.log(`Still loading after ${Math.round(elapsed/1000)}s...`);
          await page.waitForTimeout(2000); // Wait 2 seconds before next check
        }
      }
      
      // Take a screenshot of the current state
      await page.screenshot({ 
        path: '/Users/homeserver/ai-creative-team/archi-site/temp/architects-loading-state.png',
        fullPage: true 
      });
      
      // Check for specific content that should appear when loaded
      console.log('Checking for architects page content...');
      
      const pageTitle = page.locator('h1, h2, h3').first();
      const architectsList = page.locator('[data-testid="architects-list"], .MuiGrid-container');
      const searchBox = page.locator('input[type="text"], input[placeholder*="検索"]');
      
      const titleText = await pageTitle.textContent().catch(() => 'No title found');
      const listVisible = await architectsList.isVisible().catch(() => false);
      const searchVisible = await searchBox.isVisible().catch(() => false);
      
      console.log(`Page title: "${titleText}"`);
      console.log(`Architects list visible: ${listVisible}`);
      console.log(`Search box visible: ${searchVisible}`);
      
      // Check for error messages
      const errorMessage = page.locator('text=エラー, text=Error, .MuiAlert-root[role="alert"]');
      const hasError = await errorMessage.isVisible().catch(() => false);
      
      if (hasError) {
        const errorText = await errorMessage.textContent();
        console.log(`Error message found: "${errorText}"`);
      }
      
      // Check database connection status
      console.log('Checking database connection...');
      
      // Look for database-related errors in console
      const dbErrors = consoleLogs.filter(log => 
        log.toLowerCase().includes('database') || 
        log.toLowerCase().includes('sqlite') ||
        log.toLowerCase().includes('sql') ||
        log.toLowerCase().includes('worker')
      );
      
      if (dbErrors.length > 0) {
        console.log('Database-related console messages:');
        dbErrors.forEach(error => console.log(`  ${error}`));
      }
      
      // Wait a bit more to see if content eventually appears
      if (!listVisible && !hasError) {
        console.log('Waiting additional 10 seconds for content to appear...');
        await page.waitForTimeout(10000);
        
        // Check again
        const finalListVisible = await architectsList.isVisible().catch(() => false);
        const finalError = await errorMessage.isVisible().catch(() => false);
        
        console.log(`Final architects list visible: ${finalListVisible}`);
        console.log(`Final error visible: ${finalError}`);
      }
      
      // Take final screenshot
      await page.screenshot({ 
        path: '/Users/homeserver/ai-creative-team/archi-site/temp/architects-final-state.png',
        fullPage: true 
      });
      
    } catch (error) {
      console.error('Error during architects page navigation:', error);
      await page.screenshot({ 
        path: '/Users/homeserver/ai-creative-team/archi-site/temp/architects-error-state.png',
        fullPage: true 
      });
    }
    
    // Test other tabs for comparison
    console.log('\n=== Testing other tabs for comparison ===');
    
    const tabsToTest = [
      { name: 'Architecture', url: 'http://localhost:3000/archi-site/#/architecture' },
      { name: 'Map', url: 'http://localhost:3000/archi-site/#/map' }
    ];
    
    for (const tab of tabsToTest) {
      console.log(`\nTesting ${tab.name} tab...`);
      
      try {
        await page.goto(tab.url, { waitUntil: 'networkidle', timeout: 15000 });
        
        // Check if page loads successfully
        const loadingSpinner = page.locator('[role="progressbar"], .MuiCircularProgress-root');
        const hasSpinner = await loadingSpinner.isVisible().catch(() => false);
        
        if (hasSpinner) {
          console.log(`${tab.name} tab shows loading spinner`);
          await page.waitForTimeout(5000);
          const stillLoading = await loadingSpinner.isVisible().catch(() => false);
          console.log(`${tab.name} tab still loading after 5s: ${stillLoading}`);
        } else {
          console.log(`${tab.name} tab loaded without spinner`);
        }
        
        await page.screenshot({ 
          path: `/Users/homeserver/ai-creative-team/archi-site/temp/${tab.name.toLowerCase()}-tab-state.png`,
          fullPage: true 
        });
        
      } catch (error) {
        console.error(`Error testing ${tab.name} tab:`, error);
      }
    }
    
    // Summary report
    console.log('\n=== INVESTIGATION SUMMARY ===');
    console.log(`Total console logs: ${consoleLogs.length}`);
    console.log(`Console errors: ${consoleErrors.length}`);
    console.log(`Network errors: ${networkErrors.length}`);
    
    if (consoleErrors.length > 0) {
      console.log('\nConsole Errors:');
      consoleErrors.forEach(error => console.log(`  ${error}`));
    }
    
    if (networkErrors.length > 0) {
      console.log('\nNetwork Errors:');
      networkErrors.forEach(error => console.log(`  ${error}`));
    }
    
    // Export detailed logs to file
    const investigation = {
      timestamp: new Date().toISOString(),
      summary: {
        totalLogs: consoleLogs.length,
        totalErrors: consoleErrors.length,
        networkErrors: networkErrors.length
      },
      consoleLogs: consoleLogs,
      consoleErrors: consoleErrors,
      networkErrors: networkErrors
    };
    
    await page.evaluate((data) => {
      console.log('INVESTIGATION_RESULTS:', JSON.stringify(data, null, 2));
    }, investigation);
    
  });
});