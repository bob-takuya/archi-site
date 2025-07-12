/**
 * Database Connectivity Test Agent
 * Comprehensive testing script to verify database connection and accessibility
 * 
 * Tests:
 * 1. Database initialization status
 * 2. Worker connection health (sql.js-httpvfs vs direct sql.js)
 * 3. Basic table queries (sqlite_master)
 * 4. ZCDARCHITECT table accessibility and data count
 * 5. Database file loading and chunk processing
 */

// Import required modules dynamically for testing
async function testDatabaseConnectivity() {
  let testResults = {
    summary: "Database Connectivity Test Results",
    timestamp: new Date().toISOString(),
    tests: [],
    success: false,
    error: null,
    database_info: {}
  };
  
  console.log("🔍 Starting Database Connectivity Test Agent...");
  console.log("=".repeat(60));
  
  try {
    // Test 1: Import ClientDatabaseService
    console.log("\n📦 Test 1: Importing ClientDatabaseService...");
    const dbService = await import('../src/services/db/ClientDatabaseService.js');
    
    testResults.tests.push({
      test: "Import ClientDatabaseService",
      status: "PASS",
      details: "Successfully imported database service module"
    });
    console.log("✅ ClientDatabaseService imported successfully");
    
    // Test 2: Check initial database status
    console.log("\n📊 Test 2: Checking initial database status...");
    const initialStatus = dbService.getDatabaseStatus();
    console.log(`📋 Initial status: ${initialStatus}`);
    
    testResults.tests.push({
      test: "Initial Database Status",
      status: "PASS",
      details: `Initial status: ${initialStatus}`
    });
    
    // Test 3: Initialize database
    console.log("\n🚀 Test 3: Initializing database...");
    const startTime = Date.now();
    
    let dbInstance;
    try {
      dbInstance = await dbService.initDatabase();
      const initTime = Date.now() - startTime;
      
      testResults.tests.push({
        test: "Database Initialization",
        status: "PASS",
        details: `Database initialized in ${initTime}ms`,
        metrics: { initialization_time_ms: initTime }
      });
      console.log(`✅ Database initialized successfully in ${initTime}ms`);
    } catch (initError) {
      testResults.tests.push({
        test: "Database Initialization",
        status: "FAIL",
        details: `Initialization failed: ${initError.message}`,
        error: initError.message
      });
      console.error(`❌ Database initialization failed: ${initError.message}`);
      throw initError;
    }
    
    // Test 4: Check post-initialization status
    console.log("\n📊 Test 4: Checking post-initialization status...");
    const postInitStatus = dbService.getDatabaseStatus();
    console.log(`📋 Post-init status: ${postInitStatus}`);
    
    testResults.tests.push({
      test: "Post-initialization Status",
      status: postInitStatus === "ready" ? "PASS" : "FAIL",
      details: `Status after initialization: ${postInitStatus}`
    });
    
    // Test 5: Verify worker/database instance type
    console.log("\n🔧 Test 5: Checking database instance type...");
    const isWorker = dbInstance && typeof dbInstance.db !== 'undefined';
    const isDirect = dbInstance && typeof dbInstance.exec !== 'undefined';
    
    let instanceType = "unknown";
    if (isWorker) {
      instanceType = "sql.js-httpvfs worker";
    } else if (isDirect) {
      instanceType = "direct sql.js database";
    }
    
    testResults.database_info.instance_type = instanceType;
    testResults.database_info.supports_chunked_loading = isWorker;
    
    testResults.tests.push({
      test: "Database Instance Type",
      status: (isWorker || isDirect) ? "PASS" : "FAIL",
      details: `Database instance type: ${instanceType}`
    });
    console.log(`📋 Database instance type: ${instanceType}`);
    
    // Test 6: Basic SQLite version query
    console.log("\n🔍 Test 6: Testing SQLite version query...");
    try {
      const versionResult = await dbService.executeQuery('SELECT sqlite_version()');
      let version = "unknown";
      if (versionResult && versionResult.length > 0 && versionResult[0].values && versionResult[0].values.length > 0) {
        version = versionResult[0].values[0][0];
      }
      
      testResults.database_info.sqlite_version = version;
      testResults.tests.push({
        test: "SQLite Version Query",
        status: "PASS",
        details: `SQLite version: ${version}`
      });
      console.log(`✅ SQLite version: ${version}`);
    } catch (versionError) {
      testResults.tests.push({
        test: "SQLite Version Query",
        status: "FAIL",
        details: `Version query failed: ${versionError.message}`,
        error: versionError.message
      });
      console.error(`❌ Version query failed: ${versionError.message}`);
    }
    
    // Test 7: sqlite_master table query
    console.log("\n📋 Test 7: Testing sqlite_master table query...");
    try {
      const tablesResult = await dbService.executeQuery("SELECT name, type FROM sqlite_master WHERE type='table' ORDER BY name");
      let tableCount = 0;
      let tableNames = [];
      
      if (tablesResult && tablesResult.length > 0 && tablesResult[0].values) {
        tableCount = tablesResult[0].values.length;
        tableNames = tablesResult[0].values.map(row => row[0]);
      }
      
      testResults.database_info.table_count = tableCount;
      testResults.database_info.table_names = tableNames;
      
      testResults.tests.push({
        test: "sqlite_master Query",
        status: tableCount > 0 ? "PASS" : "FAIL",
        details: `Found ${tableCount} tables: ${tableNames.join(', ')}`,
        metrics: { table_count: tableCount }
      });
      console.log(`✅ Found ${tableCount} tables: ${tableNames.join(', ')}`);
    } catch (tablesError) {
      testResults.tests.push({
        test: "sqlite_master Query",
        status: "FAIL",
        details: `Tables query failed: ${tablesError.message}`,
        error: tablesError.message
      });
      console.error(`❌ Tables query failed: ${tablesError.message}`);
    }
    
    // Test 8: ZCDARCHITECT table accessibility
    console.log("\n🏗️ Test 8: Testing ZCDARCHITECT table accessibility...");
    try {
      const architectTableQuery = "SELECT name FROM sqlite_master WHERE type='table' AND name='ZCDARCHITECT'";
      const architectTableResult = await dbService.executeQuery(architectTableQuery);
      
      const architectTableExists = architectTableResult && architectTableResult.length > 0 && architectTableResult[0].values && architectTableResult[0].values.length > 0;
      
      if (architectTableExists) {
        testResults.tests.push({
          test: "ZCDARCHITECT Table Existence",
          status: "PASS",
          details: "ZCDARCHITECT table exists in database"
        });
        console.log("✅ ZCDARCHITECT table exists");
      } else {
        testResults.tests.push({
          test: "ZCDARCHITECT Table Existence",
          status: "FAIL",
          details: "ZCDARCHITECT table not found in database"
        });
        console.error("❌ ZCDARCHITECT table not found");
      }
    } catch (tableCheckError) {
      testResults.tests.push({
        test: "ZCDARCHITECT Table Existence",
        status: "FAIL",
        details: `Table check failed: ${tableCheckError.message}`,
        error: tableCheckError.message
      });
      console.error(`❌ ZCDARCHITECT table check failed: ${tableCheckError.message}`);
    }
    
    // Test 9: Count records in ZCDARCHITECT table
    console.log("\n📊 Test 9: Counting records in ZCDARCHITECT table...");
    try {
      const countQuery = "SELECT COUNT(*) as record_count FROM ZCDARCHITECT";
      const countResult = await dbService.executeQuery(countQuery);
      
      let recordCount = 0;
      if (countResult && countResult.length > 0 && countResult[0].values && countResult[0].values.length > 0) {
        recordCount = countResult[0].values[0][0];
      }
      
      testResults.database_info.zcdarchitect_record_count = recordCount;
      
      testResults.tests.push({
        test: "ZCDARCHITECT Record Count",
        status: recordCount > 0 ? "PASS" : "WARN",
        details: `Found ${recordCount} records in ZCDARCHITECT table`,
        metrics: { record_count: recordCount }
      });
      console.log(`✅ ZCDARCHITECT table contains ${recordCount} records`);
    } catch (countError) {
      testResults.tests.push({
        test: "ZCDARCHITECT Record Count",
        status: "FAIL",
        details: `Record count failed: ${countError.message}`,
        error: countError.message
      });
      console.error(`❌ ZCDARCHITECT record count failed: ${countError.message}`);
    }
    
    // Test 10: Sample data query from ZCDARCHITECT
    console.log("\n🔍 Test 10: Testing sample data query from ZCDARCHITECT...");
    try {
      const sampleQuery = "SELECT ZAR_ID, ZAR_NAME, ZAR_NAMEENG FROM ZCDARCHITECT LIMIT 3";
      const sampleResult = await dbService.executeQuery(sampleQuery);
      
      let sampleData = [];
      if (sampleResult && sampleResult.length > 0 && sampleResult[0].values) {
        sampleData = sampleResult[0].values.map(row => ({
          id: row[0],
          name: row[1],
          name_eng: row[2]
        }));
      }
      
      testResults.database_info.sample_data = sampleData;
      
      testResults.tests.push({
        test: "Sample Data Query",
        status: sampleData.length > 0 ? "PASS" : "WARN",
        details: `Retrieved ${sampleData.length} sample records`,
        metrics: { sample_records: sampleData.length }
      });
      console.log(`✅ Retrieved ${sampleData.length} sample records`);
      if (sampleData.length > 0) {
        console.log("📋 Sample data:");
        sampleData.forEach((record, index) => {
          console.log(`   ${index + 1}. ID: ${record.id}, Name: ${record.name}, Name (English): ${record.name_eng}`);
        });
      }
    } catch (sampleError) {
      testResults.tests.push({
        test: "Sample Data Query",
        status: "FAIL",
        details: `Sample query failed: ${sampleError.message}`,
        error: sampleError.message
      });
      console.error(`❌ Sample data query failed: ${sampleError.message}`);
    }
    
    // Test 11: Test high-level service functions
    console.log("\n🔧 Test 11: Testing high-level service functions...");
    try {
      const serviceTest = await import('../src/services/db/ArchitectService.js');
      
      // Test getting a single architect
      const firstArchitect = await serviceTest.getArchitectById(1);
      
      if (firstArchitect) {
        testResults.tests.push({
          test: "High-level Service Functions",
          status: "PASS",
          details: `Successfully retrieved architect: ${firstArchitect.ZAR_NAME || 'Unknown'}`
        });
        console.log(`✅ High-level service working - retrieved architect: ${firstArchitect.ZAR_NAME || 'Unknown'}`);
      } else {
        testResults.tests.push({
          test: "High-level Service Functions",
          status: "WARN",
          details: "Service functions working but no data found for ID 1"
        });
        console.log("⚠️ High-level service working but no data found for ID 1");
      }
    } catch (serviceError) {
      testResults.tests.push({
        test: "High-level Service Functions",
        status: "FAIL",
        details: `Service test failed: ${serviceError.message}`,
        error: serviceError.message
      });
      console.error(`❌ High-level service test failed: ${serviceError.message}`);
    }
    
    // Calculate overall success
    const passedTests = testResults.tests.filter(test => test.status === "PASS").length;
    const totalTests = testResults.tests.length;
    const failedTests = testResults.tests.filter(test => test.status === "FAIL").length;
    
    testResults.success = failedTests === 0;
    testResults.summary_stats = {
      total_tests: totalTests,
      passed: passedTests,
      failed: failedTests,
      warnings: testResults.tests.filter(test => test.status === "WARN").length,
      success_rate: `${Math.round((passedTests / totalTests) * 100)}%`
    };
    
    console.log("\n" + "=".repeat(60));
    console.log("📊 DATABASE CONNECTIVITY TEST SUMMARY");
    console.log("=".repeat(60));
    console.log(`✅ Passed: ${passedTests}/${totalTests} tests (${testResults.summary_stats.success_rate})`);
    console.log(`❌ Failed: ${failedTests} tests`);
    console.log(`⚠️  Warnings: ${testResults.summary_stats.warnings} tests`);
    console.log(`📊 Overall Status: ${testResults.success ? "SUCCESS" : "FAILURE"}`);
    
    if (testResults.database_info.instance_type) {
      console.log(`🔧 Database Type: ${testResults.database_info.instance_type}`);
    }
    if (testResults.database_info.sqlite_version) {
      console.log(`🔍 SQLite Version: ${testResults.database_info.sqlite_version}`);
    }
    if (testResults.database_info.table_count !== undefined) {
      console.log(`📋 Tables Found: ${testResults.database_info.table_count}`);
    }
    if (testResults.database_info.zcdarchitect_record_count !== undefined) {
      console.log(`🏗️ ZCDARCHITECT Records: ${testResults.database_info.zcdarchitect_record_count}`);
    }
    
  } catch (error) {
    testResults.error = error.message;
    testResults.success = false;
    console.error("\n❌ CRITICAL ERROR:", error);
    
    testResults.tests.push({
      test: "Overall Test Execution",
      status: "FAIL",
      details: `Critical error during testing: ${error.message}`,
      error: error.message
    });
  }
  
  // Save results to file
  const fs = await import('fs');
  const path = await import('path');
  
  try {
    const resultsPath = path.join(process.cwd(), 'temp', 'database-connectivity-test-results.json');
    await fs.promises.writeFile(resultsPath, JSON.stringify(testResults, null, 2));
    console.log(`\n📄 Detailed results saved to: ${resultsPath}`);
  } catch (saveError) {
    console.warn(`⚠️ Could not save results file: ${saveError.message}`);
  }
  
  return testResults;
}

// Auto-run if this script is executed directly
if (typeof window === 'undefined') {
  // Node.js environment
  testDatabaseConnectivity().then(results => {
    process.exit(results.success ? 0 : 1);
  }).catch(error => {
    console.error("Test execution failed:", error);
    process.exit(1);
  });
} else {
  // Browser environment - expose function globally
  window.testDatabaseConnectivity = testDatabaseConnectivity;
  console.log("Database connectivity test function available as window.testDatabaseConnectivity()");
}

export { testDatabaseConnectivity };