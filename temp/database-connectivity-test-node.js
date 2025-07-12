#!/usr/bin/env node

/**
 * Database Connectivity Test Agent - Node.js Version
 * Command-line tool to verify database connection and accessibility
 * 
 * Usage: node database-connectivity-test-node.js
 */

import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { writeFileSync } from 'fs';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function testDatabaseConnectivity() {
  console.log("🔍 Database Connectivity Test Agent (Node.js)");
  console.log("=".repeat(60));
  
  const results = {
    timestamp: new Date().toISOString(),
    environment: "Node.js",
    success: false,
    tests: [],
    database_info: {},
    summary_stats: {}
  };
  
  try {
    // Note: Since we're testing a client-side database service that uses browser APIs,
    // we'll simulate the testing environment and check file availability
    
    console.log("📋 Test 1: Checking project structure...");
    const projectRoot = join(__dirname, '..');
    
    // Check if database files exist
    const dbPath = join(projectRoot, 'public', 'db', 'archimap.sqlite');
    const configPath = join(projectRoot, 'public', 'db', 'database-info.json');
    const servicePath = join(projectRoot, 'src', 'services', 'db', 'ClientDatabaseService.ts');
    
    try {
      const fs = require('fs');
      
      // Check service file
      if (fs.existsSync(servicePath)) {
        console.log("✅ ClientDatabaseService.ts found");
        results.tests.push({
          test: "Service File Existence",
          status: "PASS",
          details: "ClientDatabaseService.ts exists"
        });
      } else {
        console.log("❌ ClientDatabaseService.ts not found");
        results.tests.push({
          test: "Service File Existence",
          status: "FAIL",
          details: "ClientDatabaseService.ts not found"
        });
      }
      
      // Check database file
      if (fs.existsSync(dbPath)) {
        const stats = fs.statSync(dbPath);
        const sizeInMB = (stats.size / 1024 / 1024).toFixed(2);
        console.log(`✅ Database file found (${sizeInMB} MB)`);
        results.database_info.file_size_mb = parseFloat(sizeInMB);
        results.tests.push({
          test: "Database File Existence",
          status: "PASS",
          details: `Database file exists (${sizeInMB} MB)`
        });
      } else {
        console.log("❌ Database file not found at " + dbPath);
        results.tests.push({
          test: "Database File Existence",
          status: "FAIL",
          details: "Database file not found"
        });
      }
      
      // Check config file
      if (fs.existsSync(configPath)) {
        console.log("✅ Database config file found");
        const configContent = fs.readFileSync(configPath, 'utf8');
        const config = JSON.parse(configContent);
        results.database_info.config = config;
        results.tests.push({
          test: "Database Config File",
          status: "PASS",
          details: "Database config file exists and is valid JSON"
        });
      } else {
        console.log("❌ Database config file not found");
        results.tests.push({
          test: "Database Config File",
          status: "FAIL",
          details: "Database config file not found"
        });
      }
      
    } catch (fsError) {
      console.log(`❌ File system check failed: ${fsError.message}`);
      results.tests.push({
        test: "File System Access",
        status: "FAIL",
        details: `File system check failed: ${fsError.message}`
      });
    }
    
    console.log("\n📋 Test 2: Checking SQL.js compatibility...");
    try {
      // Test if sql.js can be imported (this won't work in Node.js but we can check if it exists)
      const sqlJsPath = join(projectRoot, 'node_modules', 'sql.js');
      const httpvfsPath = join(projectRoot, 'node_modules', 'sql.js-httpvfs');
      
      const fs = require('fs');
      
      if (fs.existsSync(sqlJsPath)) {
        console.log("✅ sql.js package found");
        results.tests.push({
          test: "SQL.js Package",
          status: "PASS",
          details: "sql.js package is available"
        });
      } else {
        console.log("❌ sql.js package not found");
        results.tests.push({
          test: "SQL.js Package",
          status: "FAIL",
          details: "sql.js package not found in node_modules"
        });
      }
      
      if (fs.existsSync(httpvfsPath)) {
        console.log("✅ sql.js-httpvfs package found");
        results.tests.push({
          test: "SQL.js-httpvfs Package",
          status: "PASS",
          details: "sql.js-httpvfs package is available"
        });
      } else {
        console.log("❌ sql.js-httpvfs package not found");
        results.tests.push({
          test: "SQL.js-httpvfs Package",
          status: "FAIL",
          details: "sql.js-httpvfs package not found in node_modules"
        });
      }
      
    } catch (packageError) {
      console.log(`❌ Package check failed: ${packageError.message}`);
      results.tests.push({
        test: "Package Dependencies",
        status: "FAIL",
        details: `Package check failed: ${packageError.message}`
      });
    }
    
    console.log("\n📋 Test 3: Checking TypeScript compilation...");
    try {
      // Check if the service can be imported (this requires compilation)
      const tsNode = require.resolve('typescript/lib/tsc.js');
      console.log("✅ TypeScript compiler available");
      results.tests.push({
        test: "TypeScript Availability",
        status: "PASS",
        details: "TypeScript compiler is available"
      });
    } catch (tsError) {
      console.log("⚠️ TypeScript not available - this is normal for browser-only code");
      results.tests.push({
        test: "TypeScript Availability",
        status: "WARN",
        details: "TypeScript not available (normal for browser-only code)"
      });
    }
    
    console.log("\n📋 Test 4: Checking static assets...");
    try {
      const wasmPath = join(projectRoot, 'public', 'sql-wasm.wasm');
      const workerPath = join(projectRoot, 'public', 'sqlite.worker.js');
      
      const fs = require('fs');
      
      if (fs.existsSync(wasmPath)) {
        const stats = fs.statSync(wasmPath);
        const sizeKB = (stats.size / 1024).toFixed(2);
        console.log(`✅ SQL WASM file found (${sizeKB} KB)`);
        results.database_info.wasm_size_kb = parseFloat(sizeKB);
        results.tests.push({
          test: "SQL WASM File",
          status: "PASS",
          details: `SQL WASM file exists (${sizeKB} KB)`
        });
      } else {
        console.log("❌ SQL WASM file not found");
        results.tests.push({
          test: "SQL WASM File",
          status: "FAIL",
          details: "SQL WASM file not found"
        });
      }
      
      if (fs.existsSync(workerPath)) {
        console.log("✅ SQLite worker file found");
        results.tests.push({
          test: "SQLite Worker File",
          status: "PASS",
          details: "SQLite worker file exists"
        });
      } else {
        console.log("❌ SQLite worker file not found");
        results.tests.push({
          test: "SQLite Worker File",
          status: "FAIL",
          details: "SQLite worker file not found"
        });
      }
      
    } catch (assetError) {
      console.log(`❌ Asset check failed: ${assetError.message}`);
      results.tests.push({
        test: "Static Assets",
        status: "FAIL",
        details: `Asset check failed: ${assetError.message}`
      });
    }
    
    console.log("\n📋 Test 5: Environment compatibility check...");
    
    // Check Node.js version
    const nodeVersion = process.version;
    console.log(`📋 Node.js version: ${nodeVersion}`);
    results.database_info.node_version = nodeVersion;
    
    // Check if this is a browser-compatible environment
    const isBrowserCompatible = typeof window === 'undefined' && typeof global !== 'undefined';
    console.log(`📋 Environment: ${isBrowserCompatible ? 'Node.js (requires browser for full testing)' : 'Browser-like'}`);
    
    results.tests.push({
      test: "Environment Compatibility",
      status: "INFO",
      details: `Running in Node.js ${nodeVersion} (browser required for actual database testing)`
    });
    
    console.log("\n📋 Test 6: Configuration validation...");
    try {
      // Read and validate the service configuration
      const fs = require('fs');
      const servicePath = join(projectRoot, 'src', 'services', 'db', 'ClientDatabaseService.ts');
      
      if (fs.existsSync(servicePath)) {
        const serviceContent = fs.readFileSync(servicePath, 'utf8');
        
        // Check for key configuration values
        const hasBasePathConfig = serviceContent.includes('BASE_PATH');
        const hasDatabaseConfig = serviceContent.includes('DATABASE_CONFIG');
        const hasInitFunction = serviceContent.includes('initDatabase');
        const hasExecuteQuery = serviceContent.includes('executeQuery');
        
        console.log(`✅ Configuration check: BASE_PATH=${hasBasePathConfig}, DATABASE_CONFIG=${hasDatabaseConfig}, initDatabase=${hasInitFunction}, executeQuery=${hasExecuteQuery}`);
        
        if (hasBasePathConfig && hasDatabaseConfig && hasInitFunction && hasExecuteQuery) {
          results.tests.push({
            test: "Service Configuration",
            status: "PASS",
            details: "All required configuration elements found"
          });
        } else {
          results.tests.push({
            test: "Service Configuration",
            status: "FAIL",
            details: "Missing required configuration elements"
          });
        }
        
      } else {
        results.tests.push({
          test: "Service Configuration",
          status: "FAIL",
          details: "Service file not found for configuration check"
        });
      }
      
    } catch (configError) {
      console.log(`❌ Configuration check failed: ${configError.message}`);
      results.tests.push({
        test: "Service Configuration",
        status: "FAIL",
        details: `Configuration check failed: ${configError.message}`
      });
    }
    
    // Calculate results
    const passedTests = results.tests.filter(t => t.status === 'PASS').length;
    const failedTests = results.tests.filter(t => t.status === 'FAIL').length;
    const warnTests = results.tests.filter(t => t.status === 'WARN').length;
    const totalTests = results.tests.length;
    
    results.summary_stats = {
      total: totalTests,
      passed: passedTests,
      failed: failedTests,
      warnings: warnTests,
      success_rate: `${Math.round((passedTests / totalTests) * 100)}%`
    };
    
    results.success = failedTests === 0;
    
    console.log("\n" + "=".repeat(60));
    console.log("📊 DATABASE ENVIRONMENT TEST SUMMARY");
    console.log("=".repeat(60));
    console.log(`✅ Passed: ${passedTests}/${totalTests} tests`);
    console.log(`❌ Failed: ${failedTests} tests`);
    console.log(`⚠️  Warnings: ${warnTests} tests`);
    console.log(`📊 Success Rate: ${results.summary_stats.success_rate}`);
    console.log(`📊 Overall Status: ${results.success ? 'ENVIRONMENT OK' : 'ISSUES FOUND'}`);
    
    console.log("\n📋 RECOMMENDATIONS:");
    if (failedTests > 0) {
      console.log("❌ Issues found in environment setup:");
      results.tests.filter(t => t.status === 'FAIL').forEach(test => {
        console.log(`   - ${test.test}: ${test.details}`);
      });
      console.log("\n📋 For actual database connectivity testing, use the browser test:");
      console.log(`   - Open: temp/database-test.html in a web browser`);
      console.log(`   - Or run: npx serve . and visit http://localhost:3000/temp/database-test.html`);
    } else {
      console.log("✅ Environment setup looks good!");
      console.log("📋 To test actual database connectivity:");
      console.log(`   - Open: temp/database-test.html in a web browser`);
      console.log(`   - Or run: npx serve . and visit http://localhost:3000/temp/database-test.html`);
    }
    
  } catch (error) {
    console.error(`\n❌ Test execution failed: ${error.message}`);
    results.success = false;
    results.error = error.message;
  }
  
  // Save results
  try {
    const resultsPath = join(__dirname, 'database-environment-test-results.json');
    writeFileSync(resultsPath, JSON.stringify(results, null, 2));
    console.log(`\n📄 Results saved to: ${resultsPath}`);
  } catch (saveError) {
    console.warn(`⚠️ Could not save results: ${saveError.message}`);
  }
  
  return results;
}

// Run the test
testDatabaseConnectivity().then(results => {
  process.exit(results.success ? 0 : 1);
}).catch(error => {
  console.error("❌ Critical error:", error);
  process.exit(1);
});