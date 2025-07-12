import { test, expect } from '@playwright/test';

test.describe('Page Inspection and Debugging', () => {
  
  test('inspect page content and structure', async ({ page }) => {
    console.log('🔍 Inspecting page content and structure...');
    
    await page.goto('/architecture');
    await page.waitForLoadState('domcontentloaded');
    
    // Get page content
    const bodyContent = await page.locator('body').innerHTML();
    console.log(`Body content length: ${bodyContent.length}`);
    
    // Check if it's a React app
    const reactRoot = page.locator('#root');
    const reactRootCount = await reactRoot.count();
    console.log(`React root elements found: ${reactRootCount}`);
    
    if (reactRootCount > 0) {
      const rootContent = await reactRoot.innerHTML();
      console.log(`Root content length: ${rootContent.length}`);
      
      // Check for React components
      const muiComponents = page.locator('[class*="Mui"]');
      const muiCount = await muiComponents.count();
      console.log(`Material-UI components found: ${muiCount}`);
    }
    
    // Check for error messages
    const errorElements = page.locator(':has-text("Error"), :has-text("エラー"), :has-text("Failed"), :has-text("失敗")');
    const errorCount = await errorElements.count();
    console.log(`Error elements found: ${errorCount}`);
    
    if (errorCount > 0) {
      for (let i = 0; i < Math.min(errorCount, 3); i++) {
        const errorText = await errorElements.nth(i).textContent();
        console.log(`Error ${i + 1}: ${errorText}`);
      }
    }
    
    // Check for loading states
    const loadingElements = page.locator(':has-text("Loading"), :has-text("読み込み"), .loading, [data-testid*="loading"]');
    const loadingCount = await loadingElements.count();
    console.log(`Loading elements found: ${loadingCount}`);
    
    // Check console errors
    const logs: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        logs.push(`Console Error: ${msg.text()}`);
      }
    });
    
    await page.waitForTimeout(3000);
    
    if (logs.length > 0) {
      console.log('Console errors:');
      logs.forEach(log => console.log(log));
    } else {
      console.log('✅ No console errors detected');
    }
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'test-results/page-inspection.png', fullPage: true });
    console.log('📸 Screenshot saved to test-results/page-inspection.png');
  });

  test('check if development server is running', async ({ page }) => {
    console.log('🔍 Checking if development server is running...');
    
    try {
      const response = await page.goto('/');
      console.log(`Response status: ${response?.status()}`);
      console.log(`Response URL: ${response?.url()}`);
      
      const title = await page.title();
      console.log(`Page title: "${title}"`);
      
      // Check if we're getting a valid HTML page
      const htmlContent = await page.content();
      const isValidHtml = htmlContent.includes('<html') && htmlContent.includes('</html>');
      console.log(`Valid HTML structure: ${isValidHtml}`);
      
      // Check for Vite development server
      const isVitePage = htmlContent.includes('vite') || htmlContent.includes('@vite/client');
      console.log(`Vite development server detected: ${isVitePage}`);
      
      // Check for React
      const hasReact = htmlContent.includes('react') || htmlContent.includes('React');
      console.log(`React detected: ${hasReact}`);
      
    } catch (error) {
      console.log(`❌ Failed to load page: ${error.message}`);
    }
  });

  test('wait for architecture page to fully load', async ({ page }) => {
    console.log('🔍 Testing different loading strategies...');
    
    await page.goto('/architecture');
    
    // Strategy 1: Wait for network idle
    console.log('Testing networkidle...');
    await page.waitForLoadState('networkidle');
    
    let elementCount = await page.locator('*').count();
    console.log(`Elements after networkidle: ${elementCount}`);
    
    // Strategy 2: Wait for specific elements
    console.log('Waiting for specific elements...');
    try {
      await page.waitForSelector('h1, h2, h3, h4', { timeout: 5000 });
      console.log('✅ Header elements found');
    } catch (e) {
      console.log('❌ No header elements found');
    }
    
    try {
      await page.waitForSelector('[role="main"], main, .main', { timeout: 5000 });
      console.log('✅ Main content area found');
    } catch (e) {
      console.log('❌ No main content area found');
    }
    
    // Strategy 3: Wait for React to render
    console.log('Waiting for React rendering...');
    await page.waitForTimeout(5000); // Give React time to render
    
    elementCount = await page.locator('*').count();
    console.log(`Elements after React wait: ${elementCount}`);
    
    // Look for any form elements that might be search-related
    const inputs = page.locator('input');
    const inputCount = await inputs.count();
    console.log(`Input elements: ${inputCount}`);
    
    const textareas = page.locator('textarea');
    const textareaCount = await textareas.count();
    console.log(`Textarea elements: ${textareaCount}`);
    
    const selects = page.locator('select');
    const selectCount = await selects.count();
    console.log(`Select elements: ${selectCount}`);
    
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    console.log(`Button elements: ${buttonCount}`);
    
    // Check if we have any content at all
    const textContent = await page.locator('body').textContent();
    const hasSignificantContent = textContent && textContent.length > 100;
    console.log(`Has significant content: ${hasSignificantContent}`);
    console.log(`Content length: ${textContent?.length || 0}`);
    
    if (textContent && textContent.length < 500) {
      console.log('Page content preview:');
      console.log(textContent.slice(0, 200));
    }
  });

  test('check alternative routes', async ({ page }) => {
    console.log('🔍 Checking alternative routes...');
    
    const routes = ['/', '/architecture', '/architect', '/map'];
    
    for (const route of routes) {
      try {
        console.log(`Testing route: ${route}`);
        const response = await page.goto(route);
        
        console.log(`  Status: ${response?.status()}`);
        
        await page.waitForTimeout(2000);
        
        const title = await page.title();
        console.log(`  Title: "${title}"`);
        
        const elementCount = await page.locator('*').count();
        console.log(`  Elements: ${elementCount}`);
        
        // Look for search functionality on any route
        const searchInputs = page.locator('input[placeholder*="検索"], input[placeholder*="search"]');
        const searchCount = await searchInputs.count();
        if (searchCount > 0) {
          console.log(`  🎯 Search inputs found: ${searchCount}`);
        }
        
      } catch (error) {
        console.log(`  ❌ Error: ${error.message}`);
      }
    }
  });
});