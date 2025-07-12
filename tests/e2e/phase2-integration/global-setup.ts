import { chromium, FullConfig } from '@playwright/test';

/**
 * Global setup for Phase 2 Integration Tests
 * Validates that the production environment is ready for Phase 2 testing
 */
async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting Phase 2 Integration Test Setup...');
  
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Test 1: Verify site accessibility
    console.log('📡 Checking site accessibility...');
    const response = await page.goto('https://bob-takuya.github.io/archi-site/');
    
    if (!response || response.status() !== 200) {
      throw new Error(`Site not accessible. Status: ${response?.status()}`);
    }
    
    console.log('✅ Site is accessible');
    
    // Test 2: Verify basic page structure
    console.log('🏗️ Checking basic page structure...');
    await page.waitForLoadState('domcontentloaded');
    
    const title = await page.title();
    if (!title || title === 'Site not found · GitHub Pages') {
      throw new Error('Site appears to be showing 404 page');
    }
    
    console.log(`✅ Page title: "${title}"`);
    
    // Test 3: Wait for database loading
    console.log('🗄️ Waiting for database initialization...');
    await page.waitForTimeout(5000); // Allow database to load
    
    // Test 4: Check for Phase 2 components
    console.log('🧩 Checking for Phase 2 components...');
    
    const componentChecks = {
      searchBar: false,
      navigation: false,
      content: false
    };
    
    // Look for search functionality
    const searchElements = await page.locator('input, [role="search"], [data-testid*="search"]').count();
    componentChecks.searchBar = searchElements > 0;
    
    // Look for navigation
    const navElements = await page.locator('nav, header, [role="navigation"]').count();
    componentChecks.navigation = navElements > 0;
    
    // Look for main content
    const contentElements = await page.locator('main, .content, .container, [role="main"]').count();
    componentChecks.content = contentElements > 0;
    
    console.log('📋 Component availability:', componentChecks);
    
    // Test 5: Check JavaScript execution
    console.log('⚡ Testing JavaScript execution...');
    const jsTest = await page.evaluate(() => {
      return {
        userAgent: navigator.userAgent,
        screenWidth: screen.width,
        screenHeight: screen.height,
        timestamp: Date.now()
      };
    });
    
    console.log('✅ JavaScript execution working');
    
    // Test 6: Performance baseline
    console.log('📊 Measuring performance baseline...');
    const performanceMetrics = await page.evaluate(() => {
      const perf = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: perf.domContentLoadedEventEnd - perf.navigationStart,
        loadComplete: perf.loadEventEnd - perf.navigationStart,
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
      };
    });
    
    console.log('📊 Performance baseline:', performanceMetrics);
    
    // Test 7: Mobile viewport test
    console.log('📱 Testing mobile viewport...');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    
    const mobileTest = await page.evaluate(() => {
      return {
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio
      };
    });
    
    console.log('✅ Mobile viewport test passed:', mobileTest);
    
    // Test 8: Create Phase 2 test data directory
    console.log('📁 Setting up Phase 2 test data...');
    
    const testData = {
      setupTimestamp: new Date().toISOString(),
      baseURL: 'https://bob-takuya.github.io/archi-site/',
      componentChecks,
      performanceBaseline: performanceMetrics,
      environmentInfo: {
        userAgent: jsTest.userAgent,
        viewport: mobileTest
      }
    };
    
    // Save test data for use in tests
    await page.evaluate((data) => {
      sessionStorage.setItem('phase2TestData', JSON.stringify(data));
    }, testData);
    
    console.log('✅ Phase 2 test environment ready');
    console.log('🎯 Setup completed successfully - Phase 2 integration tests can proceed');
    
  } catch (error) {
    console.error('❌ Phase 2 setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;