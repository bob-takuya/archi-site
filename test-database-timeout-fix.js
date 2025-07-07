/**
 * Comprehensive Database Timeout Fix Validation Test
 * Tests all the timeout improvements and user experience enhancements
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

// Test configuration
const TEST_CONFIG = {
  LOCAL_URL: 'http://localhost:8080',
  PRODUCTION_URL: 'https://bob-takuya.github.io/archi-site/',
  TIMEOUTS: {
    navigation: 120000,     // 2 minutes
    database: 180000,       // 3 minutes
    wait: 60000            // 1 minute
  },
  EXPECTED_RECORDS: 14000,  // Expected minimum architecture records
  RETRY_ATTEMPTS: 3
};

// Test results storage
const results = {
  localTests: {},
  productionTests: {},
  crossPlatformTests: {},
  summary: {}
};

/**
 * Enhanced wait function with better error handling
 */
const waitWithRetry = async (page, selector, options = {}) => {
  const { timeout = TEST_CONFIG.TIMEOUTS.wait, retries = 3 } = options;
  
  for (let i = 0; i < retries; i++) {
    try {
      await page.waitForSelector(selector, { timeout });
      return true;
    } catch (error) {
      console.log(`Attempt ${i + 1}/${retries} failed for selector: ${selector}`);
      if (i === retries - 1) throw error;
      await page.waitForTimeout(2000);
    }
  }
  return false;
};

/**
 * Test database loading with progress tracking
 */
const testDatabaseLoading = async (page, url, testName) => {
  console.log(`\n🧪 Testing database loading: ${testName}`);
  
  const test = {
    url,
    startTime: Date.now(),
    progressEvents: [],
    errorEvents: [],
    loadingStates: [],
    success: false,
    recordCount: 0,
    loadTime: 0
  };
  
  try {
    // Navigate to the page
    console.log(`📍 Navigating to: ${url}`);
    await page.goto(url, { 
      waitUntil: 'networkidle0',
      timeout: TEST_CONFIG.TIMEOUTS.navigation 
    });
    
    // Set up progress monitoring
    await page.evaluate(() => {
      window.testResults = {
        progressEvents: [],
        errorEvents: [],
        loadingStates: []
      };
      
      // Monitor progress events
      window.addEventListener('database-download-progress', (event) => {
        window.testResults.progressEvents.push({
          timestamp: Date.now(),
          progress: event.detail.progress,
          speed: event.detail.speed,
          eta: event.detail.eta,
          receivedLength: event.detail.receivedLength,
          totalLength: event.detail.totalLength
        });
      });
      
      // Monitor errors
      window.addEventListener('error', (event) => {
        window.testResults.errorEvents.push({
          timestamp: Date.now(),
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        });
      });
      
      // Monitor loading states
      const originalLog = console.log;
      console.log = (...args) => {
        const message = args.join(' ');
        if (message.includes('データベース') || message.includes('Database') || message.includes('loading')) {
          window.testResults.loadingStates.push({
            timestamp: Date.now(),
            message: message
          });
        }
        originalLog.apply(console, args);
      };
    });
    
    // Wait for either success or error
    console.log('⏳ Waiting for database initialization...');
    
    try {
      // Wait for architecture data to load (homepage cards)
      await page.waitForFunction(() => {
        const cards = document.querySelectorAll('[data-testid="architecture-card"]');
        return cards.length > 0;
      }, { timeout: TEST_CONFIG.TIMEOUTS.database });
      
      // Get architecture card count
      const cardCount = await page.evaluate(() => {
        return document.querySelectorAll('[data-testid="architecture-card"]').length;
      });
      
      test.recordCount = cardCount;
      test.success = cardCount > 0;
      
      console.log(`✅ Database loaded successfully! Found ${cardCount} architecture cards.`);
      
    } catch (timeoutError) {
      console.log('⏰ Database loading timed out, checking for error states...');
      
      // Check for error messages
      const errorElement = await page.$('.MuiAlert-root');
      if (errorElement) {
        const errorText = await errorElement.evaluate(el => el.textContent);
        test.errorEvents.push({
          timestamp: Date.now(),
          message: errorText,
          type: 'timeout_error'
        });
        console.log(`❌ Error detected: ${errorText}`);
      }
      
      // Check for loading states
      const loadingElement = await page.$('.MuiCircularProgress-root');
      if (loadingElement) {
        console.log('🔄 Still in loading state');
        test.loadingStates.push({
          timestamp: Date.now(),
          message: 'Still loading after timeout'
        });
      }
    }
    
    // Extract progress and error events
    const pageResults = await page.evaluate(() => window.testResults);
    test.progressEvents = pageResults.progressEvents;
    test.errorEvents = test.errorEvents.concat(pageResults.errorEvents);
    test.loadingStates = test.loadingStates.concat(pageResults.loadingStates);
    
    test.loadTime = Date.now() - test.startTime;
    
    console.log(`📊 Test completed in ${test.loadTime}ms`);
    console.log(`📈 Progress events: ${test.progressEvents.length}`);
    console.log(`❌ Error events: ${test.errorEvents.length}`);
    console.log(`📋 Loading states: ${test.loadingStates.length}`);
    
    return test;
    
  } catch (error) {
    console.error(`❌ Test failed: ${error.message}`);
    test.errorEvents.push({
      timestamp: Date.now(),
      message: error.message,
      type: 'test_error'
    });
    test.loadTime = Date.now() - test.startTime;
    return test;
  }
};

/**
 * Test search functionality
 */
const testSearchFunctionality = async (page, searchTerm = '安藤忠雄') => {
  console.log(`\n🔍 Testing search functionality with: ${searchTerm}`);
  
  try {
    // Find search input
    const searchInput = await page.$('input[type="text"]');
    if (!searchInput) {
      throw new Error('Search input not found');
    }
    
    // Clear and type search term
    await searchInput.click({ clickCount: 3 });
    await searchInput.type(searchTerm);
    
    // Submit search
    const searchButton = await page.$('button[type="submit"]');
    if (searchButton) {
      await searchButton.click();
    } else {
      await searchInput.press('Enter');
    }
    
    // Wait for navigation or results
    await page.waitForTimeout(3000);
    
    const currentUrl = page.url();
    console.log(`📍 Search resulted in URL: ${currentUrl}`);
    
    return {
      success: currentUrl.includes('search=') || currentUrl.includes('architecture'),
      finalUrl: currentUrl,
      searchTerm
    };
    
  } catch (error) {
    console.error(`❌ Search test failed: ${error.message}`);
    return {
      success: false,
      error: error.message,
      searchTerm
    };
  }
};

/**
 * Test navigation functionality  
 */
const testNavigation = async (page) => {
  console.log('\n🧭 Testing navigation functionality...');
  
  const navigationTests = [];
  
  try {
    // Test architecture list navigation
    const architectureLink = await page.$('a[href*="architecture"]');
    if (architectureLink) {
      await architectureLink.click();
      await page.waitForTimeout(3000);
      
      const url = page.url();
      navigationTests.push({
        link: 'architecture',
        success: url.includes('architecture'),
        url
      });
      
      // Go back to home
      await page.goBack();
      await page.waitForTimeout(2000);
    }
    
    // Test map navigation
    const mapLink = await page.$('a[href*="map"]');
    if (mapLink) {
      await mapLink.click();
      await page.waitForTimeout(3000);
      
      const url = page.url();
      navigationTests.push({
        link: 'map',
        success: url.includes('map'),
        url
      });
      
      // Go back to home
      await page.goBack();
      await page.waitForTimeout(2000);
    }
    
    return navigationTests;
    
  } catch (error) {
    console.error(`❌ Navigation test failed: ${error.message}`);
    return [{
      error: error.message,
      success: false
    }];
  }
};

/**
 * Run comprehensive tests
 */
const runComprehensiveTests = async () => {
  console.log('🚀 Starting comprehensive database timeout fix validation...');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  
  try {
    const page = await browser.newPage();
    
    // Set viewport
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Enable request interception to monitor network
    await page.setRequestInterception(true);
    const requests = [];
    
    page.on('request', (request) => {
      requests.push({
        url: request.url(),
        method: request.method(),
        resourceType: request.resourceType(),
        timestamp: Date.now()
      });
      request.continue();
    });
    
    // Test 1: Local environment
    console.log('\n=== LOCAL ENVIRONMENT TESTS ===');
    try {
      results.localTests.databaseLoading = await testDatabaseLoading(page, TEST_CONFIG.LOCAL_URL, 'Local Environment');
      results.localTests.search = await testSearchFunctionality(page);
      results.localTests.navigation = await testNavigation(page);
      results.localTests.success = true;
    } catch (error) {
      console.error('❌ Local tests failed:', error.message);
      results.localTests.success = false;
      results.localTests.error = error.message;
    }
    
    // Test 2: Production environment
    console.log('\n=== PRODUCTION ENVIRONMENT TESTS ===');
    try {
      results.productionTests.databaseLoading = await testDatabaseLoading(page, TEST_CONFIG.PRODUCTION_URL, 'Production Environment');
      results.productionTests.search = await testSearchFunctionality(page);
      results.productionTests.navigation = await testNavigation(page);
      results.productionTests.success = true;
    } catch (error) {
      console.error('❌ Production tests failed:', error.message);
      results.productionTests.success = false;
      results.productionTests.error = error.message;
    }
    
    // Test 3: Cross-platform compatibility
    console.log('\n=== CROSS-PLATFORM TESTS ===');
    const userAgents = [
      'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1',
      'Mozilla/5.0 (Android 10; Mobile; rv:89.0) Gecko/89.0 Firefox/89.0'
    ];
    
    for (const userAgent of userAgents) {
      try {
        await page.setUserAgent(userAgent);
        const mobileTest = await testDatabaseLoading(page, TEST_CONFIG.PRODUCTION_URL, `Mobile (${userAgent.includes('iPhone') ? 'iOS' : 'Android'})`);
        results.crossPlatformTests[userAgent.includes('iPhone') ? 'iOS' : 'Android'] = mobileTest;
      } catch (error) {
        console.error(`❌ Mobile test failed for ${userAgent}:`, error.message);
        results.crossPlatformTests[userAgent.includes('iPhone') ? 'iOS' : 'Android'] = {
          success: false,
          error: error.message
        };
      }
    }
    
    // Calculate summary statistics
    results.summary = {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      averageLoadTime: 0,
      totalProgressEvents: 0,
      totalErrorEvents: 0,
      databaseLoadSuccess: false,
      searchFunctionality: false,
      navigationFunctionality: false
    };
    
    // Analyze results
    const allTests = [
      results.localTests,
      results.productionTests,
      ...Object.values(results.crossPlatformTests)
    ];
    
    for (const test of allTests) {
      if (test.databaseLoading) {
        results.summary.totalTests++;
        if (test.databaseLoading.success) {
          results.summary.passedTests++;
          results.summary.databaseLoadSuccess = true;
        } else {
          results.summary.failedTests++;
        }
        results.summary.averageLoadTime += test.databaseLoading.loadTime;
        results.summary.totalProgressEvents += test.databaseLoading.progressEvents.length;
        results.summary.totalErrorEvents += test.databaseLoading.errorEvents.length;
      }
    }
    
    if (results.summary.totalTests > 0) {
      results.summary.averageLoadTime /= results.summary.totalTests;
    }
    
    results.summary.searchFunctionality = results.localTests.search?.success || results.productionTests.search?.success;
    results.summary.navigationFunctionality = results.localTests.navigation?.some(n => n.success) || results.productionTests.navigation?.some(n => n.success);
    
    console.log('\n📊 COMPREHENSIVE TEST RESULTS:');
    console.log(`Total Tests: ${results.summary.totalTests}`);
    console.log(`Passed: ${results.summary.passedTests}`);
    console.log(`Failed: ${results.summary.failedTests}`);
    console.log(`Average Load Time: ${Math.round(results.summary.averageLoadTime)}ms`);
    console.log(`Progress Events: ${results.summary.totalProgressEvents}`);
    console.log(`Error Events: ${results.summary.totalErrorEvents}`);
    console.log(`Database Load Success: ${results.summary.databaseLoadSuccess ? '✅' : '❌'}`);
    console.log(`Search Functionality: ${results.summary.searchFunctionality ? '✅' : '❌'}`);
    console.log(`Navigation Functionality: ${results.summary.navigationFunctionality ? '✅' : '❌'}`);
    
    return results;
    
  } finally {
    await browser.close();
  }
};

/**
 * Main execution
 */
const main = async () => {
  try {
    const testResults = await runComprehensiveTests();
    
    // Save results to file
    const resultFile = path.join(__dirname, 'database-timeout-fix-test-results.json');
    fs.writeFileSync(resultFile, JSON.stringify(testResults, null, 2));
    
    console.log(`\n💾 Test results saved to: ${resultFile}`);
    
    // Determine overall success
    const overallSuccess = testResults.summary.passedTests > 0 && 
                          testResults.summary.databaseLoadSuccess &&
                          testResults.summary.totalErrorEvents === 0;
    
    console.log(`\n🎯 OVERALL TEST RESULT: ${overallSuccess ? '✅ PASSED' : '❌ FAILED'}`);
    
    process.exit(overallSuccess ? 0 : 1);
    
  } catch (error) {
    console.error('💥 Test execution failed:', error);
    process.exit(1);
  }
};

// Execute tests
main();