#!/usr/bin/env node

/**
 * Quality Gate Check Script
 * Verifies that E2E tests meet the 90% pass rate requirement
 * As mandated by CLAUDE.md specifications
 */

const fs = require('fs');
const path = require('path');

const QUALITY_GATE_THRESHOLD = 90; // 90% pass rate required

function readTestResults() {
  const resultsPath = path.join(__dirname, '..', 'playwright-results', 'results.json');
  
  if (!fs.existsSync(resultsPath)) {
    console.error('❌ No test results found at:', resultsPath);
    console.error('   Please run E2E tests first: npm run test:e2e');
    process.exit(1);
  }
  
  try {
    const resultsData = fs.readFileSync(resultsPath, 'utf8');
    return JSON.parse(resultsData);
  } catch (error) {
    console.error('❌ Failed to parse test results:', error.message);
    process.exit(1);
  }
}

function analyzeTestResults(results) {
  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;
  let skippedTests = 0;
  
  if (results.suites && Array.isArray(results.suites)) {
    for (const suite of results.suites) {
      if (suite.specs && Array.isArray(suite.specs)) {
        for (const spec of suite.specs) {
          totalTests++;
          
          if (spec.ok === true) {
            passedTests++;
          } else if (spec.ok === false) {
            failedTests++;
          } else {
            skippedTests++;
          }
        }
      }
    }
  }
  
  return {
    totalTests,
    passedTests,
    failedTests,
    skippedTests,
    passRate: totalTests > 0 ? (passedTests / totalTests) * 100 : 0
  };
}

function generateReport(analysis, results) {
  console.log('\n📊 E2E Test Quality Gate Report');
  console.log('================================\n');
  
  console.log(`Total Tests:     ${analysis.totalTests}`);
  console.log(`Passed:          ${analysis.passedTests} ✅`);
  console.log(`Failed:          ${analysis.failedTests} ❌`);
  console.log(`Skipped:         ${analysis.skippedTests} ⏭️`);
  console.log(`Pass Rate:       ${analysis.passRate.toFixed(1)}%`);
  console.log(`Required:        ${QUALITY_GATE_THRESHOLD}%\n`);
  
  // Detailed breakdown by test file
  if (results.suites && Array.isArray(results.suites)) {
    console.log('📋 Test File Breakdown:');
    console.log('------------------------\n');
    
    for (const suite of results.suites) {
      if (suite.title && suite.specs) {
        const suitePassed = suite.specs.filter(spec => spec.ok === true).length;
        const suiteTotal = suite.specs.length;
        const suitePassRate = suiteTotal > 0 ? (suitePassed / suiteTotal) * 100 : 0;
        
        const status = suitePassRate >= QUALITY_GATE_THRESHOLD ? '✅' : '❌';
        console.log(`${status} ${suite.title}: ${suitePassed}/${suiteTotal} (${suitePassRate.toFixed(1)}%)`);
        
        // Show failed tests
        if (suitePassRate < 100) {
          const failedSpecs = suite.specs.filter(spec => spec.ok === false);
          for (const failedSpec of failedSpecs) {
            console.log(`   ❌ ${failedSpec.title}`);
          }
        }
      }
    }
  }
  
  console.log('\n');
}

function checkQualityGate(analysis) {
  if (analysis.passRate >= QUALITY_GATE_THRESHOLD) {
    console.log('🎉 QUALITY GATE PASSED! 🎉');
    console.log(`✅ Achieved ${analysis.passRate.toFixed(1)}% pass rate (>= ${QUALITY_GATE_THRESHOLD}% required)`);
    console.log('✅ Tests meet production deployment standards');
    console.log('✅ Ready for deployment to production environment\n');
    
    // Additional checks
    if (analysis.passRate === 100) {
      console.log('🏆 PERFECT SCORE! All tests passed! 🏆\n');
    }
    
    return true;
  } else {
    console.log('🚫 QUALITY GATE FAILED! 🚫');
    console.log(`❌ Only achieved ${analysis.passRate.toFixed(1)}% pass rate (>= ${QUALITY_GATE_THRESHOLD}% required)`);
    console.log('❌ Tests do not meet production deployment standards');
    console.log('❌ Please fix failing tests before deployment\n');
    
    // Provide guidance
    console.log('🔧 Remediation Steps:');
    console.log('1. Review failing tests in the breakdown above');
    console.log('2. Run specific test files to debug: npm run test:e2e:debug');
    console.log('3. Check application logs and network requests');
    console.log('4. Verify database connectivity and data availability');
    console.log('5. Test UI components for proper data-testid attributes');
    console.log('6. Re-run tests after fixes: npm run test:e2e\n');
    
    return false;
  }
}

function generateJUnitReport(analysis, results) {
  const junitPath = path.join(__dirname, '..', 'playwright-results', 'junit-quality-gate.xml');
  
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<testsuite name="Quality Gate" tests="1" failures="${analysis.passRate >= QUALITY_GATE_THRESHOLD ? 0 : 1}" time="0">
  <testcase name="E2E Test Pass Rate Quality Gate" classname="QualityGate">
    ${analysis.passRate >= QUALITY_GATE_THRESHOLD ? 
      '' : 
      `<failure message="Pass rate ${analysis.passRate.toFixed(1)}% below required ${QUALITY_GATE_THRESHOLD}%">
      Quality gate failed: Only ${analysis.passedTests}/${analysis.totalTests} tests passed (${analysis.passRate.toFixed(1)}%)
      Required: ${QUALITY_GATE_THRESHOLD}% pass rate for production deployment
      </failure>`
    }
  </testcase>
</testsuite>`;
  
  fs.writeFileSync(junitPath, xml);
  console.log(`📄 JUnit report generated: ${junitPath}`);
}

function main() {
  console.log('🔍 Starting E2E Test Quality Gate Check...\n');
  
  try {
    // Read and analyze test results
    const results = readTestResults();
    const analysis = analyzeTestResults(results);
    
    // Generate detailed report
    generateReport(analysis, results);
    
    // Generate JUnit report for CI integration
    generateJUnitReport(analysis, results);
    
    // Check quality gate
    const passed = checkQualityGate(analysis);
    
    // Exit with appropriate code
    process.exit(passed ? 0 : 1);
    
  } catch (error) {
    console.error('❌ Quality gate check failed:', error.message);
    process.exit(1);
  }
}

// Run the quality gate check
if (require.main === module) {
  main();
}

module.exports = {
  analyzeTestResults,
  checkQualityGate,
  QUALITY_GATE_THRESHOLD
};