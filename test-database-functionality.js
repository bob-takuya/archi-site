/**
 * Simple Database Functionality Test
 * Validates the database loading timeout fixes without complex dependencies
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Test configuration
const TESTS = {
  LOCAL_URL: 'http://localhost:8080',
  PRODUCTION_URL: 'https://bob-takuya.github.io/archi-site/',
  TIMEOUT: 180000, // 3 minutes
  EXPECTED_ELEMENTS: [
    'h1', // Main heading
    'input[type="text"]', // Search input
    'button', // Buttons
    '.MuiCard-root', // Material UI cards
  ]
};

/**
 * Test URL accessibility
 */
const testUrlAccessibility = async (url) => {
  console.log(`\n🔍 Testing URL accessibility: ${url}`);
  
  try {
    // Use curl to test basic accessibility
    const result = execSync(`curl -I "${url}"`, { 
      encoding: 'utf8',
      timeout: 30000 
    });
    
    const isAccessible = result.includes('200') || result.includes('301') || result.includes('302');
    console.log(`${isAccessible ? '✅' : '❌'} URL ${url} is ${isAccessible ? 'accessible' : 'not accessible'}`);
    
    return {
      url,
      accessible: isAccessible,
      response: result.split('\n')[0] // First line with status
    };
  } catch (error) {
    console.log(`❌ URL ${url} failed: ${error.message}`);
    return {
      url,
      accessible: false,
      error: error.message
    };
  }
};

/**
 * Test database file accessibility
 */
const testDatabaseFile = async (baseUrl) => {
  console.log(`\n📊 Testing database file accessibility from: ${baseUrl}`);
  
  const databaseUrl = `${baseUrl}/db/archimap.sqlite`;
  const wasmUrl = `${baseUrl}/sql-wasm.wasm`;
  
  try {
    // Test database file
    const dbResult = execSync(`curl -I "${databaseUrl}"`, { 
      encoding: 'utf8',
      timeout: 30000 
    });
    
    const dbAccessible = dbResult.includes('200');
    console.log(`${dbAccessible ? '✅' : '❌'} Database file ${dbAccessible ? 'accessible' : 'not accessible'}`);
    
    // Test WASM file
    const wasmResult = execSync(`curl -I "${wasmUrl}"`, { 
      encoding: 'utf8',
      timeout: 30000 
    });
    
    const wasmAccessible = wasmResult.includes('200');
    console.log(`${wasmAccessible ? '✅' : '❌'} WASM file ${wasmAccessible ? 'accessible' : 'not accessible'}`);
    
    // Get file sizes
    const dbSize = dbResult.match(/content-length: (\d+)/i)?.[1];
    const wasmSize = wasmResult.match(/content-length: (\d+)/i)?.[1];
    
    console.log(`📏 Database size: ${dbSize ? Math.round(parseInt(dbSize) / 1024 / 1024 * 100) / 100 : 'unknown'} MB`);
    console.log(`📏 WASM size: ${wasmSize ? Math.round(parseInt(wasmSize) / 1024 * 100) / 100 : 'unknown'} KB`);
    
    return {
      database: {
        url: databaseUrl,
        accessible: dbAccessible,
        size: dbSize ? parseInt(dbSize) : 0
      },
      wasm: {
        url: wasmUrl,
        accessible: wasmAccessible,
        size: wasmSize ? parseInt(wasmSize) : 0
      }
    };
    
  } catch (error) {
    console.log(`❌ Database file test failed: ${error.message}`);
    return {
      database: { accessible: false, error: error.message },
      wasm: { accessible: false, error: error.message }
    };
  }
};

/**
 * Test using simple page fetch
 */
const testPageContent = async (url) => {
  console.log(`\n📄 Testing page content from: ${url}`);
  
  try {
    // Get the page content
    const content = execSync(`curl -s "${url}"`, { 
      encoding: 'utf8',
      timeout: 30000 
    });
    
    if (!content || content.includes('404')) {
      throw new Error('Page not found or empty');
    }
    
    // Check for essential elements
    const checks = {
      hasTitle: content.includes('<title>') && content.includes('建築'),
      hasJapanese: /[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/.test(content),
      hasScript: content.includes('<script'),
      hasReactRoot: content.includes('id="root"'),
      hasDatabase: content.includes('database') || content.includes('Database'),
      hasViteAssets: content.includes('assets/'),
      hasCSS: content.includes('.css'),
      hasJS: content.includes('.js'),
      contentLength: content.length
    };
    
    console.log('📋 Page content analysis:');
    Object.entries(checks).forEach(([key, value]) => {
      if (key === 'contentLength') {
        console.log(`  ${key}: ${value} characters`);
      } else {
        console.log(`  ${value ? '✅' : '❌'} ${key}: ${value}`);
      }
    });
    
    return {
      url,
      success: checks.hasTitle && checks.hasReactRoot && checks.hasViteAssets,
      checks
    };
    
  } catch (error) {
    console.log(`❌ Page content test failed: ${error.message}`);
    return {
      url,
      success: false,
      error: error.message
    };
  }
};

/**
 * Test timeout configuration in source code
 */
const testTimeoutConfiguration = () => {
  console.log('\n⏱️  Testing timeout configuration in source code...');
  
  const sourceFiles = [
    'src/services/db/ClientDatabaseService.ts',
    'src/pages/HomePage.tsx',
    'playwright.config.production.ts'
  ];
  
  const timeoutTests = [];
  
  for (const filePath of sourceFiles) {
    const fullPath = path.join(__dirname, filePath);
    
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      
      const test = {
        file: filePath,
        exists: true,
        timeouts: {
          has45seconds: content.includes('45000') || content.includes('45 * 1000'),
          has90seconds: content.includes('90000') || content.includes('90 * 1000'),
          has120seconds: content.includes('120000') || content.includes('120 * 1000'),
          has180seconds: content.includes('180000') || content.includes('180 * 1000'),
          has300seconds: content.includes('300000') || content.includes('300 * 1000'),
          hasProgressEvents: content.includes('database-download-progress'),
          hasRetryLogic: content.includes('retry') || content.includes('Retry'),
          hasConnectionSpeed: content.includes('connectionSpeed') || content.includes('detectConnectionSpeed')
        }
      };
      
      console.log(`📁 ${filePath}:`);
      Object.entries(test.timeouts).forEach(([key, value]) => {
        console.log(`  ${value ? '✅' : '❌'} ${key}: ${value}`);
      });
      
      timeoutTests.push(test);
    } else {
      console.log(`❌ File not found: ${filePath}`);
      timeoutTests.push({
        file: filePath,
        exists: false,
        error: 'File not found'
      });
    }
  }
  
  return timeoutTests;
};

/**
 * Run all tests
 */
const runAllTests = async () => {
  console.log('🚀 Starting Database Functionality Tests...');
  console.log('=' .repeat(50));
  
  const results = {
    urlTests: [],
    databaseTests: [],
    pageTests: [],
    timeoutTests: [],
    summary: {}
  };
  
  try {
    // Test URL accessibility
    results.urlTests.push(await testUrlAccessibility(TESTS.LOCAL_URL));
    results.urlTests.push(await testUrlAccessibility(TESTS.PRODUCTION_URL));
    
    // Test database file accessibility
    results.databaseTests.push(await testDatabaseFile(TESTS.LOCAL_URL));
    results.databaseTests.push(await testDatabaseFile(TESTS.PRODUCTION_URL));
    
    // Test page content
    results.pageTests.push(await testPageContent(TESTS.LOCAL_URL));
    results.pageTests.push(await testPageContent(TESTS.PRODUCTION_URL));
    
    // Test timeout configuration
    results.timeoutTests = testTimeoutConfiguration();
    
    // Calculate summary
    const accessibleUrls = results.urlTests.filter(t => t.accessible).length;
    const accessibleDatabases = results.databaseTests.filter(t => t.database.accessible && t.wasm.accessible).length;
    const workingPages = results.pageTests.filter(t => t.success).length;
    const properTimeouts = results.timeoutTests.filter(t => t.exists && Object.values(t.timeouts).some(v => v)).length;
    
    results.summary = {
      accessibleUrls,
      accessibleDatabases,
      workingPages,
      properTimeouts,
      totalTests: results.urlTests.length + results.databaseTests.length + results.pageTests.length + results.timeoutTests.length,
      overallSuccess: accessibleUrls > 0 && accessibleDatabases > 0 && workingPages > 0 && properTimeouts > 0
    };
    
    console.log('\n📊 TEST SUMMARY:');
    console.log('=' .repeat(50));
    console.log(`🔗 Accessible URLs: ${accessibleUrls}/${results.urlTests.length}`);
    console.log(`💾 Accessible Databases: ${accessibleDatabases}/${results.databaseTests.length}`);
    console.log(`📄 Working Pages: ${workingPages}/${results.pageTests.length}`);
    console.log(`⏱️  Proper Timeouts: ${properTimeouts}/${results.timeoutTests.length}`);
    console.log(`🎯 Overall Success: ${results.summary.overallSuccess ? '✅ PASSED' : '❌ FAILED'}`);
    
    // Save results
    const resultFile = path.join(__dirname, 'database-functionality-test-results.json');
    fs.writeFileSync(resultFile, JSON.stringify(results, null, 2));
    console.log(`💾 Results saved to: ${resultFile}`);
    
    return results;
    
  } catch (error) {
    console.error('💥 Test execution failed:', error);
    results.summary.overallSuccess = false;
    results.summary.error = error.message;
    return results;
  }
};

// Stop local server when done
const stopLocalServer = () => {
  try {
    if (fs.existsSync('/tmp/test_server.pid')) {
      const pid = fs.readFileSync('/tmp/test_server.pid', 'utf8').trim();
      execSync(`kill ${pid}`);
      fs.unlinkSync('/tmp/test_server.pid');
      console.log('🛑 Local server stopped');
    }
  } catch (error) {
    console.log('ℹ️  Local server may not be running');
  }
};

// Main execution
const main = async () => {
  try {
    const results = await runAllTests();
    
    // Clean up
    stopLocalServer();
    
    process.exit(results.summary.overallSuccess ? 0 : 1);
    
  } catch (error) {
    console.error('💥 Test execution failed:', error);
    stopLocalServer();
    process.exit(1);
  }
};

// Execute if run directly
if (require.main === module) {
  main();
}

module.exports = { runAllTests, testUrlAccessibility, testDatabaseFile, testPageContent, testTimeoutConfiguration };