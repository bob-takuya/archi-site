import { FullConfig } from '@playwright/test';
import fs from 'fs';

/**
 * Global teardown for E2E tests
 * Cleans up resources and generates final reports
 */
async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global teardown for E2E tests...');
  
  try {
    // Clean up state file
    const stateFile = 'tests/e2e/state.json';
    if (fs.existsSync(stateFile)) {
      fs.unlinkSync(stateFile);
      console.log('✅ Cleaned up state file');
    }
    
    // Generate performance report if data exists
    const resultsFile = 'playwright-results/results.json';
    if (fs.existsSync(resultsFile)) {
      const results = JSON.parse(fs.readFileSync(resultsFile, 'utf8'));
      
      // Calculate basic metrics
      const totalTests = results.suites?.reduce((total: number, suite: any) => {
        return total + (suite.specs?.length || 0);
      }, 0) || 0;
      
      const passedTests = results.suites?.reduce((total: number, suite: any) => {
        return total + (suite.specs?.filter((spec: any) => spec.ok).length || 0);
      }, 0) || 0;
      
      const passRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;
      
      console.log(`📊 Test Results Summary:`);
      console.log(`   Total Tests: ${totalTests}`);
      console.log(`   Passed: ${passedTests}`);
      console.log(`   Pass Rate: ${passRate.toFixed(1)}%`);
      
      // Check if we meet the 90% pass rate requirement
      if (passRate >= 90) {
        console.log('✅ Quality gate passed: 90%+ test pass rate achieved');
      } else {
        console.log('❌ Quality gate failed: Less than 90% test pass rate');
        console.log('   Please review failed tests and fix issues before deployment');
      }
    }
    
    console.log('✅ Global teardown completed successfully');
    
  } catch (error) {
    console.error('❌ Global teardown failed:', error);
    // Don't throw error in teardown to avoid masking test failures
  }
}

export default globalTeardown;