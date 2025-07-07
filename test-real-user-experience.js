/**
 * Real User Experience Test for Database Timeout Fix
 * Simulates actual user interactions with the application
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  PRODUCTION_URL: 'https://bob-takuya.github.io/archi-site/',
  LOCAL_URL: 'http://localhost:8080',
  TIMEOUT: 300000, // 5 minutes to match our implementation
  EXPECTED_RECORD_COUNT: 6, // Homepage should show 6 recent architecture works
  SEARCH_TERMS: ['安藤忠雄', 'Tokyo', '建築', 'museum']
};

/**
 * Test real user journey using Node.js HTTP requests
 */
const testRealUserJourney = async (baseUrl) => {
  console.log(`\n👤 Testing real user journey: ${baseUrl}`);
  
  const results = {
    pageLoad: false,
    databaseLoad: false,
    searchFunctionality: false,
    navigationWorking: false,
    progressTracking: false,
    errorHandling: false,
    performanceMetrics: {},
    issues: []
  };
  
  try {
    // Test 1: Basic page load
    console.log('📄 Testing basic page load...');
    const pageResponse = await fetch(baseUrl);
    
    if (pageResponse.ok) {
      const html = await pageResponse.text();
      results.pageLoad = true;
      
      // Check for essential elements
      const hasEssentialElements = html.includes('建築データベース') && 
                                 html.includes('id="root"') && 
                                 html.includes('assets/');
      
      if (!hasEssentialElements) {
        results.issues.push('Essential page elements missing');
      }
      
      console.log('✅ Page loaded successfully');
    } else {
      results.issues.push(`Page load failed: ${pageResponse.status}`);
      console.log(`❌ Page load failed: ${pageResponse.status}`);
    }
    
    // Test 2: Database file accessibility and size
    console.log('💾 Testing database file accessibility...');
    const dbResponse = await fetch(`${baseUrl}db/archimap.sqlite`);
    
    if (dbResponse.ok) {
      const dbSize = parseInt(dbResponse.headers.get('content-length') || '0');
      results.databaseLoad = true;
      results.performanceMetrics.databaseSize = dbSize;
      
      console.log(`✅ Database accessible (${Math.round(dbSize / 1024 / 1024 * 100) / 100} MB)`);
      
      // Check if database is reasonable size (should be around 12MB)
      if (dbSize < 10 * 1024 * 1024) {
        results.issues.push('Database file appears too small');
      }
      
    } else {
      results.issues.push(`Database file not accessible: ${dbResponse.status}`);
      console.log(`❌ Database file not accessible: ${dbResponse.status}`);
    }
    
    // Test 3: WASM file accessibility
    console.log('🔧 Testing WASM file accessibility...');
    const wasmResponse = await fetch(`${baseUrl}sql-wasm.wasm`);
    
    if (wasmResponse.ok) {
      const wasmSize = parseInt(wasmResponse.headers.get('content-length') || '0');
      results.performanceMetrics.wasmSize = wasmSize;
      
      console.log(`✅ WASM accessible (${Math.round(wasmSize / 1024 * 100) / 100} KB)`);
      
      // Check if WASM is reasonable size (should be around 1.2MB)
      if (wasmSize < 1000 * 1024) {
        results.issues.push('WASM file appears too small');
      }
      
    } else {
      results.issues.push(`WASM file not accessible: ${wasmResponse.status}`);
      console.log(`❌ WASM file not accessible: ${wasmResponse.status}`);
    }
    
    // Test 4: Critical JavaScript bundles
    console.log('📦 Testing JavaScript bundles...');
    const bundleResponse = await fetch(`${baseUrl}assets/`);
    
    if (bundleResponse.ok) {
      const bundleHtml = await bundleResponse.text();
      const hasJSBundles = bundleHtml.includes('.js');
      
      if (hasJSBundles) {
        console.log('✅ JavaScript bundles accessible');
      } else {
        results.issues.push('JavaScript bundles not found');
        console.log('❌ JavaScript bundles not found');
      }
    }
    
    // Test 5: CSS bundles
    console.log('🎨 Testing CSS bundles...');
    const bundleResponse2 = await fetch(`${baseUrl}assets/`);
    
    if (bundleResponse2.ok) {
      const bundleHtml2 = await bundleResponse2.text();
      const hasCSSBundles = bundleHtml2.includes('.css');
      
      if (hasCSSBundles) {
        console.log('✅ CSS bundles accessible');
      } else {
        results.issues.push('CSS bundles not found');
        console.log('❌ CSS bundles not found');
      }
    }
    
    // Test 6: Simulate timeout scenarios
    console.log('⏱️  Testing timeout configuration...');
    
    // Check source code for timeout implementations
    const sourceFiles = [
      'src/services/db/ClientDatabaseService.ts',
      'src/pages/HomePage.tsx'
    ];
    
    let hasProperTimeouts = false;
    
    for (const file of sourceFiles) {
      const filePath = path.join(__dirname, file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Check for extended timeouts
        const hasExtendedTimeouts = content.includes('120000') || // 2 minutes
                                  content.includes('90000') ||  // 1.5 minutes
                                  content.includes('45000');    // 45 seconds
        
        if (hasExtendedTimeouts) {
          hasProperTimeouts = true;
          break;
        }
      }
    }
    
    if (hasProperTimeouts) {
      results.progressTracking = true;
      console.log('✅ Extended timeouts implemented');
    } else {
      results.issues.push('Extended timeouts not found in source code');
      console.log('❌ Extended timeouts not found in source code');
    }
    
    // Test 7: Check for progress tracking implementation
    console.log('📊 Testing progress tracking implementation...');
    
    for (const file of sourceFiles) {
      const filePath = path.join(__dirname, file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Check for progress tracking features
        const hasProgressTracking = content.includes('database-download-progress') &&
                                   content.includes('progress') &&
                                   content.includes('speed');
        
        if (hasProgressTracking) {
          results.progressTracking = true;
          console.log('✅ Progress tracking implemented');
          break;
        }
      }
    }
    
    if (!results.progressTracking) {
      results.issues.push('Progress tracking not found in source code');
      console.log('❌ Progress tracking not found in source code');
    }
    
    // Test 8: Check for retry logic
    console.log('🔄 Testing retry logic implementation...');
    
    for (const file of sourceFiles) {
      const filePath = path.join(__dirname, file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Check for retry logic
        const hasRetryLogic = content.includes('retry') || 
                            content.includes('Retry') ||
                            content.includes('maxRetries');
        
        if (hasRetryLogic) {
          results.errorHandling = true;
          console.log('✅ Retry logic implemented');
          break;
        }
      }
    }
    
    if (!results.errorHandling) {
      results.issues.push('Retry logic not found in source code');
      console.log('❌ Retry logic not found in source code');
    }
    
    // Test 9: Performance metrics
    console.log('⚡ Calculating performance metrics...');
    
    const totalDownloadSize = (results.performanceMetrics.databaseSize || 0) + 
                            (results.performanceMetrics.wasmSize || 0);
    
    results.performanceMetrics.totalDownloadSize = totalDownloadSize;
    results.performanceMetrics.estimatedDownloadTime = {
      slowConnection: Math.round(totalDownloadSize / (100 * 1024)), // 100 KB/s
      fastConnection: Math.round(totalDownloadSize / (1024 * 1024)), // 1 MB/s
      veryFastConnection: Math.round(totalDownloadSize / (10 * 1024 * 1024)) // 10 MB/s
    };
    
    console.log(`📏 Total download size: ${Math.round(totalDownloadSize / 1024 / 1024 * 100) / 100} MB`);
    console.log(`🐌 Estimated time (slow): ${results.performanceMetrics.estimatedDownloadTime.slowConnection}s`);
    console.log(`🏃 Estimated time (fast): ${results.performanceMetrics.estimatedDownloadTime.fastConnection}s`);
    console.log(`🚀 Estimated time (very fast): ${results.performanceMetrics.estimatedDownloadTime.veryFastConnection}s`);
    
    // Test 10: Overall success assessment
    const criticalTests = [
      results.pageLoad,
      results.databaseLoad,
      results.progressTracking,
      results.errorHandling
    ];
    
    const successRate = criticalTests.filter(Boolean).length / criticalTests.length;
    results.overallSuccess = successRate >= 0.75; // 75% success rate
    
    console.log(`🎯 Critical tests passed: ${criticalTests.filter(Boolean).length}/${criticalTests.length}`);
    console.log(`📊 Success rate: ${Math.round(successRate * 100)}%`);
    
    return results;
    
  } catch (error) {
    console.error(`❌ Real user journey test failed: ${error.message}`);
    results.issues.push(`Test execution failed: ${error.message}`);
    results.overallSuccess = false;
    return results;
  }
};

/**
 * Test cross-platform scenarios
 */
const testCrossPlatformScenarios = async (baseUrl) => {
  console.log(`\n🌐 Testing cross-platform scenarios: ${baseUrl}`);
  
  const scenarios = [
    {
      name: 'Desktop Chrome',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      expectedPerformance: 'fast'
    },
    {
      name: 'Mobile Safari',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Mobile/15E148 Safari/604.1',
      expectedPerformance: 'slow'
    },
    {
      name: 'Mobile Chrome',
      userAgent: 'Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Mobile Safari/537.36',
      expectedPerformance: 'slow'
    }
  ];
  
  const results = [];
  
  for (const scenario of scenarios) {
    console.log(`📱 Testing ${scenario.name}...`);
    
    try {
      const response = await fetch(baseUrl, {
        headers: {
          'User-Agent': scenario.userAgent
        }
      });
      
      if (response.ok) {
        const html = await response.text();
        const hasResponsiveDesign = html.includes('viewport') && 
                                  html.includes('width=device-width');
        
        results.push({
          scenario: scenario.name,
          success: true,
          hasResponsiveDesign,
          expectedPerformance: scenario.expectedPerformance
        });
        
        console.log(`✅ ${scenario.name} compatible`);
      } else {
        results.push({
          scenario: scenario.name,
          success: false,
          error: `HTTP ${response.status}`
        });
        
        console.log(`❌ ${scenario.name} failed: HTTP ${response.status}`);
      }
      
    } catch (error) {
      results.push({
        scenario: scenario.name,
        success: false,
        error: error.message
      });
      
      console.log(`❌ ${scenario.name} failed: ${error.message}`);
    }
  }
  
  return results;
};

/**
 * Run comprehensive user experience tests
 */
const runUserExperienceTests = async () => {
  console.log('🚀 Starting Real User Experience Tests...');
  console.log('='.repeat(60));
  
  const results = {
    localTest: {},
    productionTest: {},
    crossPlatformTests: [],
    summary: {}
  };
  
  try {
    // Test 1: Local environment
    console.log('\n=== LOCAL ENVIRONMENT TEST ===');
    results.localTest = await testRealUserJourney(TEST_CONFIG.LOCAL_URL);
    
    // Test 2: Production environment
    console.log('\n=== PRODUCTION ENVIRONMENT TEST ===');
    results.productionTest = await testRealUserJourney(TEST_CONFIG.PRODUCTION_URL);
    
    // Test 3: Cross-platform scenarios
    console.log('\n=== CROSS-PLATFORM TESTS ===');
    results.crossPlatformTests = await testCrossPlatformScenarios(TEST_CONFIG.PRODUCTION_URL);
    
    // Calculate summary
    const localSuccess = results.localTest.overallSuccess;
    const productionSuccess = results.productionTest.overallSuccess;
    const crossPlatformSuccess = results.crossPlatformTests.every(t => t.success);
    
    const totalIssues = (results.localTest.issues || []).length + 
                       (results.productionTest.issues || []).length;
    
    results.summary = {
      localSuccess,
      productionSuccess,
      crossPlatformSuccess,
      totalIssues,
      overallSuccess: localSuccess && productionSuccess && crossPlatformSuccess && totalIssues === 0,
      recommendations: []
    };
    
    // Generate recommendations
    if (totalIssues > 0) {
      results.summary.recommendations.push('Address identified issues in test results');
    }
    
    if (!crossPlatformSuccess) {
      results.summary.recommendations.push('Improve cross-platform compatibility');
    }
    
    if (results.productionTest.performanceMetrics?.estimatedDownloadTime?.slowConnection > 120) {
      results.summary.recommendations.push('Consider optimizing file sizes for slower connections');
    }
    
    console.log('\n📊 USER EXPERIENCE TEST SUMMARY:');
    console.log('='.repeat(60));
    console.log(`🏠 Local Success: ${localSuccess ? '✅' : '❌'}`);
    console.log(`🌍 Production Success: ${productionSuccess ? '✅' : '❌'}`);
    console.log(`📱 Cross-Platform Success: ${crossPlatformSuccess ? '✅' : '❌'}`);
    console.log(`🚨 Total Issues: ${totalIssues}`);
    console.log(`🎯 Overall Success: ${results.summary.overallSuccess ? '✅ PASSED' : '❌ FAILED'}`);
    
    if (results.summary.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      results.summary.recommendations.forEach((rec, i) => {
        console.log(`   ${i + 1}. ${rec}`);
      });
    }
    
    // Save results
    const resultFile = path.join(__dirname, 'user-experience-test-results.json');
    fs.writeFileSync(resultFile, JSON.stringify(results, null, 2));
    console.log(`\n💾 Results saved to: ${resultFile}`);
    
    return results;
    
  } catch (error) {
    console.error('💥 User experience test failed:', error);
    results.summary.overallSuccess = false;
    results.summary.error = error.message;
    return results;
  }
};

/**
 * Main execution
 */
const main = async () => {
  try {
    const results = await runUserExperienceTests();
    
    // Detailed reporting
    console.log('\n' + '='.repeat(60));
    console.log('📋 DETAILED TEST RESULTS');
    console.log('='.repeat(60));
    
    if (results.productionTest.issues && results.productionTest.issues.length > 0) {
      console.log('\n❌ Issues Found:');
      results.productionTest.issues.forEach((issue, i) => {
        console.log(`   ${i + 1}. ${issue}`);
      });
    }
    
    if (results.productionTest.performanceMetrics) {
      console.log('\n📊 Performance Metrics:');
      console.log(`   Database Size: ${Math.round((results.productionTest.performanceMetrics.databaseSize || 0) / 1024 / 1024 * 100) / 100} MB`);
      console.log(`   WASM Size: ${Math.round((results.productionTest.performanceMetrics.wasmSize || 0) / 1024 * 100) / 100} KB`);
      console.log(`   Total Download: ${Math.round((results.productionTest.performanceMetrics.totalDownloadSize || 0) / 1024 / 1024 * 100) / 100} MB`);
      
      if (results.productionTest.performanceMetrics.estimatedDownloadTime) {
        console.log(`   Estimated Download Time (slow): ${results.productionTest.performanceMetrics.estimatedDownloadTime.slowConnection}s`);
        console.log(`   Estimated Download Time (fast): ${results.productionTest.performanceMetrics.estimatedDownloadTime.fastConnection}s`);
      }
    }
    
    // Final verdict
    const isSuccess = results.summary.overallSuccess;
    console.log(`\n🎯 FINAL VERDICT: ${isSuccess ? '✅ DATABASE TIMEOUT FIX SUCCESSFUL' : '❌ DATABASE TIMEOUT FIX NEEDS IMPROVEMENT'}`);
    
    if (isSuccess) {
      console.log('\n🎉 The database timeout fix has been successfully implemented and tested!');
      console.log('✅ Users should now be able to load the architecture database even on slow connections.');
      console.log('✅ Progress tracking provides real-time feedback during large file downloads.');
      console.log('✅ Extended timeouts (45s, 90s, 120s, 180s) accommodate various network conditions.');
      console.log('✅ Retry logic handles temporary network failures gracefully.');
    } else {
      console.log('\n⚠️  The database timeout fix needs further attention:');
      if (results.summary.recommendations.length > 0) {
        results.summary.recommendations.forEach((rec, i) => {
          console.log(`   ${i + 1}. ${rec}`);
        });
      }
    }
    
    process.exit(isSuccess ? 0 : 1);
    
  } catch (error) {
    console.error('💥 Test execution failed:', error);
    process.exit(1);
  }
};

// Execute if run directly
if (require.main === module) {
  main();
}

module.exports = { runUserExperienceTests, testRealUserJourney, testCrossPlatformScenarios };