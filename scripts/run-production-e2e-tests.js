#!/usr/bin/env node

/**
 * Comprehensive Production E2E Test Runner
 * Executes all E2E tests against the live archi-site deployment
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  baseUrl: 'https://bob-takuya.github.io/archi-site/',
  playwrightConfig: 'playwright.config.production.ts',
  testDir: 'tests/e2e/production',
  reportDir: 'playwright-results/production-reports',
  artifactsDir: 'playwright-results/production-artifacts',
  timeout: 600000, // 10 minutes total timeout
  retries: 2,
  workers: 3
};

// Test suites to run
const TEST_SUITES = [
  {
    name: 'Homepage Journey',
    file: '01-homepage-journey.spec.ts',
    description: 'Tests homepage functionality, navigation, and responsiveness'
  },
  {
    name: 'Architecture Database Journey',
    file: '02-architecture-database-journey.spec.ts',
    description: 'Tests architecture browsing, filtering, search, and detail views'
  },
  {
    name: 'Interactive Map Journey',
    file: '03-interactive-map-journey.spec.ts',
    description: 'Tests map functionality, markers, and navigation'
  },
  {
    name: 'Architect Database Journey',
    file: '04-architect-database-journey.spec.ts',
    description: 'Tests architect listings, search, and profile pages'
  },
  {
    name: 'Performance & Accessibility',
    file: '05-performance-accessibility.spec.ts',
    description: 'Tests performance metrics and accessibility compliance'
  }
];

// Browser configurations
const BROWSERS = ['chromium', 'firefox', 'webkit'];
const MOBILE_BROWSERS = ['Mobile Chrome', 'Mobile Safari'];

class ProductionE2ERunner {
  constructor() {
    this.startTime = Date.now();
    this.results = {
      totalTests: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      suiteResults: [],
      errors: []
    };
    
    console.log('🚀 Starting Production E2E Test Suite');
    console.log('🎯 Target URL:', CONFIG.baseUrl);
    console.log('📅 Started at:', new Date().toISOString());
    console.log('=' .repeat(80));
  }

  async checkPrerequisites() {
    console.log('🔍 Checking prerequisites...');
    
    // Check if target site is accessible
    try {
      const response = await fetch(CONFIG.baseUrl);
      if (!response.ok) {
        throw new Error(`Site not accessible: ${response.status}`);
      }
      console.log('✅ Target site is accessible');
    } catch (error) {
      console.error('❌ Target site is not accessible:', error.message);
      process.exit(1);
    }
    
    // Check Playwright installation
    try {
      execSync('npx playwright --version', { stdio: 'ignore' });
      console.log('✅ Playwright is installed');
    } catch (error) {
      console.error('❌ Playwright is not installed');
      console.log('📦 Installing Playwright...');
      execSync('npm install -g @playwright/test', { stdio: 'inherit' });
      execSync('npx playwright install', { stdio: 'inherit' });
    }
    
    // Check test files exist
    const missingFiles = [];
    for (const suite of TEST_SUITES) {
      const testFile = path.join(CONFIG.testDir, suite.file);
      if (!fs.existsSync(testFile)) {
        missingFiles.push(testFile);
      }
    }
    
    if (missingFiles.length > 0) {
      console.error('❌ Missing test files:', missingFiles);
      process.exit(1);
    }
    
    console.log('✅ All test files found');
    console.log('✅ Prerequisites check completed');
  }

  async runTestSuite(suite) {
    console.log(`\n🧪 Running ${suite.name}`);
    console.log(`📄 ${suite.description}`);
    console.log('-'.repeat(60));
    
    const testFile = path.join(CONFIG.testDir, suite.file);
    const suiteStartTime = Date.now();
    
    try {
      // Run the test suite
      const command = `npx playwright test ${testFile} --config ${CONFIG.playwrightConfig} --reporter=json`;
      
      console.log(`▶️  Executing: ${command}`);
      
      const output = execSync(command, { 
        encoding: 'utf8',
        timeout: CONFIG.timeout,
        env: { ...process.env, BASE_URL: CONFIG.baseUrl }
      });
      
      const duration = Date.now() - suiteStartTime;
      
      // Parse results if JSON output is available
      try {
        const results = JSON.parse(output);
        const suiteResult = {
          name: suite.name,
          file: suite.file,
          duration: duration,
          passed: results.stats?.passed || 0,
          failed: results.stats?.failed || 0,
          skipped: results.stats?.skipped || 0,
          status: 'passed'
        };
        
        this.results.suiteResults.push(suiteResult);
        this.results.totalTests += suiteResult.passed + suiteResult.failed + suiteResult.skipped;
        this.results.passed += suiteResult.passed;
        this.results.failed += suiteResult.failed;
        this.results.skipped += suiteResult.skipped;
        
        console.log(`✅ ${suite.name} completed in ${duration}ms`);
        console.log(`   📊 Passed: ${suiteResult.passed}, Failed: ${suiteResult.failed}, Skipped: ${suiteResult.skipped}`);
        
      } catch (parseError) {
        console.log(`✅ ${suite.name} completed in ${duration}ms`);
        console.log('   📊 Results parsing not available');
      }
      
    } catch (error) {
      const duration = Date.now() - suiteStartTime;
      
      console.error(`❌ ${suite.name} failed after ${duration}ms`);
      console.error('   Error:', error.message);
      
      this.results.errors.push({
        suite: suite.name,
        error: error.message,
        duration: duration
      });
      
      this.results.suiteResults.push({
        name: suite.name,
        file: suite.file,
        duration: duration,
        passed: 0,
        failed: 1,
        skipped: 0,
        status: 'failed',
        error: error.message
      });
      
      this.results.failed += 1;
      this.results.totalTests += 1;
    }
  }

  async runAllTests() {
    console.log(`\n🎯 Running ${TEST_SUITES.length} test suites`);
    console.log(`🌐 Browsers: ${BROWSERS.join(', ')}`);
    console.log(`📱 Mobile: ${MOBILE_BROWSERS.join(', ')}`);
    
    // Run each test suite
    for (const suite of TEST_SUITES) {
      await this.runTestSuite(suite);
    }
  }

  generateReport() {
    const totalDuration = Date.now() - this.startTime;
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 PRODUCTION E2E TEST REPORT');
    console.log('='.repeat(80));
    console.log(`🎯 Target URL: ${CONFIG.baseUrl}`);
    console.log(`⏱️  Total Duration: ${totalDuration}ms (${Math.round(totalDuration / 1000)}s)`);
    console.log(`📅 Completed at: ${new Date().toISOString()}`);
    console.log('');
    
    // Overall results
    console.log('📈 OVERALL RESULTS:');
    console.log(`   Total Tests: ${this.results.totalTests}`);
    console.log(`   ✅ Passed: ${this.results.passed}`);
    console.log(`   ❌ Failed: ${this.results.failed}`);
    console.log(`   ⏭️  Skipped: ${this.results.skipped}`);
    
    if (this.results.totalTests > 0) {
      const passRate = Math.round((this.results.passed / this.results.totalTests) * 100);
      console.log(`   📊 Pass Rate: ${passRate}%`);
    }
    
    console.log('');
    
    // Suite breakdown
    console.log('🧪 SUITE BREAKDOWN:');
    this.results.suiteResults.forEach((suite, index) => {
      const status = suite.status === 'passed' ? '✅' : '❌';
      const duration = Math.round(suite.duration / 1000);
      
      console.log(`   ${index + 1}. ${status} ${suite.name} (${duration}s)`);
      
      if (suite.passed || suite.failed || suite.skipped) {
        console.log(`      📊 P:${suite.passed} F:${suite.failed} S:${suite.skipped}`);
      }
      
      if (suite.error) {
        console.log(`      ❌ Error: ${suite.error}`);
      }
    });
    
    console.log('');
    
    // Errors
    if (this.results.errors.length > 0) {
      console.log('❌ ERRORS:');
      this.results.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error.suite}: ${error.error}`);
      });
      console.log('');
    }
    
    // Artifacts
    console.log('📁 ARTIFACTS:');
    console.log(`   HTML Reports: ${CONFIG.reportDir}/index.html`);
    console.log(`   Screenshots: ${CONFIG.artifactsDir}/`);
    console.log(`   Videos: ${CONFIG.artifactsDir}/`);
    console.log('');
    
    // Recommendations
    console.log('💡 RECOMMENDATIONS:');
    
    if (this.results.failed > 0) {
      console.log('   🔍 Review failed tests in the HTML report');
      console.log('   🎥 Check videos and screenshots for failure details');
      console.log('   🔄 Consider running failed tests individually for debugging');
    }
    
    if (this.results.passed === this.results.totalTests) {
      console.log('   🎉 All tests passed! Site is production-ready');
      console.log('   📈 Consider adding more edge cases and performance tests');
    }
    
    console.log('');
    
    // Quality gates
    const passRate = this.results.totalTests > 0 ? (this.results.passed / this.results.totalTests) * 100 : 0;
    
    console.log('🚪 QUALITY GATES:');
    console.log(`   Pass Rate: ${passRate.toFixed(1)}% ${passRate >= 90 ? '✅' : '❌'} (Required: ≥90%)`);
    console.log(`   Critical Failures: ${this.results.failed} ${this.results.failed === 0 ? '✅' : '❌'} (Required: 0)`);
    console.log(`   Performance: ${totalDuration < 600000 ? '✅' : '❌'} (Required: <10min)`);
    
    const overallStatus = passRate >= 90 && this.results.failed === 0 && totalDuration < 600000;
    console.log(`   Overall Status: ${overallStatus ? '✅ PASSED' : '❌ FAILED'}`);
    
    console.log('');
    console.log('='.repeat(80));
    
    return {
      ...this.results,
      totalDuration,
      passRate,
      overallStatus,
      qualityGates: {
        passRate: passRate >= 90,
        criticalFailures: this.results.failed === 0,
        performance: totalDuration < 600000,
        overall: overallStatus
      }
    };
  }

  async saveReport(report) {
    const reportData = {
      timestamp: new Date().toISOString(),
      target: CONFIG.baseUrl,
      ...report
    };
    
    const reportFile = path.join(CONFIG.reportDir, 'production-e2e-report.json');
    
    // Ensure report directory exists
    if (!fs.existsSync(CONFIG.reportDir)) {
      fs.mkdirSync(CONFIG.reportDir, { recursive: true });
    }
    
    fs.writeFileSync(reportFile, JSON.stringify(reportData, null, 2));
    console.log(`💾 Report saved to: ${reportFile}`);
  }
}

// Main execution
async function main() {
  const runner = new ProductionE2ERunner();
  
  try {
    await runner.checkPrerequisites();
    await runner.runAllTests();
    
    const report = runner.generateReport();
    await runner.saveReport(report);
    
    // Exit with appropriate code
    process.exit(report.qualityGates.overall ? 0 : 1);
    
  } catch (error) {
    console.error('❌ Fatal error in test runner:', error);
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Test execution interrupted by user');
  process.exit(130);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Test execution terminated');
  process.exit(143);
});

// Run the test suite
if (require.main === module) {
  main();
}

module.exports = { ProductionE2ERunner, CONFIG, TEST_SUITES };