#!/usr/bin/env node

/**
 * Cross-Browser Search Testing Script
 * Runs comprehensive search tests across multiple browsers and generates detailed reports
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const BROWSERS_TO_TEST = [
  'chromium',
  'firefox', 
  'webkit',
  'edge'
];

const MOBILE_BROWSERS = [
  'Mobile Chrome',
  'Mobile Safari'
];

const OUTPUT_DIR = './playwright-results/cross-browser-search';
const REPORT_FILE = path.join(OUTPUT_DIR, 'cross-browser-search-report.md');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Run Playwright tests for a specific browser
 */
async function runTestsForBrowser(browser) {
  console.log(`\n🧪 Testing search functionality in ${browser}...`);
  
  const testCommand = [
    'npx',
    'playwright',
    'test',
    'tests/e2e/cross-browser-search.spec.ts',
    '--project',
    browser,
    '--reporter=json',
    '--retries=2'
  ];

  try {
    const result = execSync(testCommand.join(' '), {
      cwd: process.cwd(),
      encoding: 'utf8',
      timeout: 300000, // 5 minutes timeout
      stdio: 'pipe'
    });

    return {
      browser,
      success: true,
      output: result,
      errors: []
    };
  } catch (error) {
    return {
      browser,
      success: false,
      output: error.stdout || '',
      errors: [error.message],
      stderr: error.stderr || ''
    };
  }
}

/**
 * Parse test results and extract browser-specific issues
 */
function parseTestResults(resultFile, browser) {
  try {
    if (!fs.existsSync(resultFile)) {
      return {
        browser,
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        failures: [],
        warnings: []
      };
    }

    const results = JSON.parse(fs.readFileSync(resultFile, 'utf8'));
    
    const failures = [];
    const warnings = [];
    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;

    if (results.suites) {
      results.suites.forEach(suite => {
        suite.specs?.forEach(spec => {
          totalTests++;
          
          const lastResult = spec.tests?.[0]?.results?.[spec.tests[0].results.length - 1];
          
          if (lastResult) {
            if (lastResult.status === 'passed') {
              passedTests++;
            } else if (lastResult.status === 'failed') {
              failedTests++;
              failures.push({
                test: spec.title,
                error: lastResult.error?.message || 'Unknown error',
                duration: lastResult.duration
              });
            } else if (lastResult.status === 'skipped') {
              warnings.push({
                test: spec.title,
                reason: 'Test skipped'
              });
            }
          }
        });
      });
    }

    return {
      browser,
      totalTests,
      passedTests,
      failedTests,
      failures,
      warnings
    };
  } catch (error) {
    console.error(`Error parsing results for ${browser}:`, error);
    return {
      browser,
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      failures: [{ test: 'Result parsing', error: error.message }],
      warnings: []
    };
  }
}

/**
 * Generate comprehensive cross-browser test report
 */
function generateReport(allResults) {
  const timestamp = new Date().toISOString();
  const totalBrowsers = allResults.length;
  const successfulBrowsers = allResults.filter(r => r.passedTests > 0).length;
  
  let report = `# Cross-Browser Search Testing Report\n\n`;
  report += `**Generated:** ${timestamp}\n`;
  report += `**Browsers Tested:** ${totalBrowsers}\n`;
  report += `**Successful Browsers:** ${successfulBrowsers}/${totalBrowsers}\n\n`;

  // Executive Summary
  report += `## Executive Summary\n\n`;
  
  const compatibilityRate = ((successfulBrowsers / totalBrowsers) * 100).toFixed(1);
  report += `**Overall Compatibility Rate:** ${compatibilityRate}%\n\n`;

  if (compatibilityRate >= 90) {
    report += `✅ **Excellent** - Search functionality works well across all major browsers.\n\n`;
  } else if (compatibilityRate >= 75) {
    report += `⚠️ **Good** - Search functionality works on most browsers with minor issues.\n\n`;
  } else if (compatibilityRate >= 50) {
    report += `❌ **Poor** - Significant browser compatibility issues detected.\n\n`;
  } else {
    report += `🚫 **Critical** - Major browser compatibility failures.\n\n`;
  }

  // Browser-by-Browser Results
  report += `## Browser-by-Browser Results\n\n`;

  allResults.forEach(result => {
    const passRate = result.totalTests > 0 
      ? ((result.passedTests / result.totalTests) * 100).toFixed(1)
      : '0';
    
    report += `### ${result.browser}\n\n`;
    report += `- **Tests Run:** ${result.totalTests}\n`;
    report += `- **Passed:** ${result.passedTests} (${passRate}%)\n`;
    report += `- **Failed:** ${result.failedTests}\n`;
    report += `- **Warnings:** ${result.warnings.length}\n\n`;

    if (result.passedTests === result.totalTests && result.totalTests > 0) {
      report += `✅ **Status:** All search tests passed\n\n`;
    } else if (result.failedTests === 0 && result.totalTests > 0) {
      report += `⚠️ **Status:** Tests passed with warnings\n\n`;
    } else if (result.totalTests === 0) {
      report += `❓ **Status:** No tests executed (browser may not be available)\n\n`;
    } else {
      report += `❌ **Status:** ${result.failedTests} test(s) failed\n\n`;
    }

    // Document failures
    if (result.failures.length > 0) {
      report += `**Failures:**\n`;
      result.failures.forEach(failure => {
        report += `- **${failure.test}:** ${failure.error}\n`;
      });
      report += `\n`;
    }

    // Document warnings
    if (result.warnings.length > 0) {
      report += `**Warnings:**\n`;
      result.warnings.forEach(warning => {
        report += `- **${warning.test}:** ${warning.reason}\n`;
      });
      report += `\n`;
    }
  });

  // Known Issues and Recommendations
  report += `## Known Browser-Specific Issues\n\n`;

  const hasFirefoxIssues = allResults.find(r => r.browser === 'firefox' && r.failedTests > 0);
  const hasSafariIssues = allResults.find(r => r.browser === 'webkit' && r.failedTests > 0);
  const hasEdgeIssues = allResults.find(r => r.browser === 'edge' && r.failedTests > 0);
  const hasChromeIssues = allResults.find(r => r.browser === 'chromium' && r.failedTests > 0);

  if (hasFirefoxIssues) {
    report += `### Firefox\n`;
    report += `- Autocomplete behavior may differ from other browsers\n`;
    report += `- Japanese IME input handling may vary\n`;
    report += `- Native form autocomplete may interfere with custom suggestions\n\n`;
  }

  if (hasSafariIssues) {
    report += `### Safari (WebKit)\n`;
    report += `- Touch events and gesture handling may be limited in test environment\n`;
    report += `- Voice search API support may be restricted\n`;
    report += `- iOS-specific input behavior differences\n\n`;
  }

  if (hasEdgeIssues) {
    report += `### Microsoft Edge\n`;
    report += `- May require specific browser installation\n`;
    report += `- Chromium-based Edge should behave similarly to Chrome\n`;
    report += `- Legacy Edge (if present) may have different behaviors\n\n`;
  }

  if (hasChromeIssues) {
    report += `### Chrome (Chromium)\n`;
    report += `- Web Speech API availability may vary by environment\n`;
    report += `- Security restrictions in test environment\n\n`;
  }

  // Recommendations
  report += `## Recommendations\n\n`;
  
  if (successfulBrowsers < totalBrowsers) {
    report += `### Immediate Actions\n`;
    report += `1. **Review failing tests** and implement browser-specific fixes\n`;
    report += `2. **Add feature detection** for browser-specific capabilities\n`;
    report += `3. **Implement graceful fallbacks** for unsupported features\n\n`;
  }

  report += `### General Improvements\n`;
  report += `1. **Progressive Enhancement:** Ensure core search functionality works without JavaScript\n`;
  report += `2. **Feature Detection:** Use proper detection for voice search, touch events, etc.\n`;
  report += `3. **Responsive Design:** Test on various screen sizes and orientations\n`;
  report += `4. **Accessibility:** Ensure keyboard navigation and screen reader compatibility\n`;
  report += `5. **Performance:** Optimize search response times across all browsers\n\n`;

  // Technical Details
  report += `## Technical Implementation Notes\n\n`;
  report += `- **Search Input Method:** HTML5 input with autocomplete\n`;
  report += `- **Character Support:** Japanese (Hiragana, Katakana, Kanji), English, Numbers\n`;
  report += `- **Voice Search:** Web Speech API (where supported)\n`;
  report += `- **Touch Support:** Touch events and gesture recognition\n`;
  report += `- **Accessibility:** ARIA labels and keyboard navigation\n\n`;

  report += `## Test Environment\n\n`;
  report += `- **Framework:** Playwright\n`;
  report += `- **Test Location:** ${process.cwd()}\n`;
  report += `- **Node Version:** ${process.version}\n`;
  report += `- **Platform:** ${process.platform}\n\n`;

  report += `---\n`;
  report += `*This report was automatically generated by the cross-browser search testing script.*\n`;

  return report;
}

/**
 * Main execution function
 */
async function main() {
  console.log('🚀 Starting cross-browser search testing...\n');

  // Check if the site is running
  try {
    execSync('curl -f http://localhost:4173 > /dev/null 2>&1', { timeout: 5000 });
    console.log('✅ Local development server is running');
  } catch (error) {
    console.log('⚠️  Local server not detected, attempting to start...');
    
    try {
      // Try to start the preview server
      execSync('npm run build', { timeout: 60000 });
      console.log('✅ Build completed');
      
      // Start server in background
      const server = spawn('npm', ['run', 'preview'], {
        detached: true,
        stdio: 'ignore'
      });
      
      // Wait for server to start
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      console.log('✅ Preview server started');
    } catch (error) {
      console.error('❌ Failed to start server:', error.message);
      process.exit(1);
    }
  }

  const allResults = [];

  // Test desktop browsers
  for (const browser of BROWSERS_TO_TEST) {
    try {
      console.log(`\n🔍 Testing ${browser}...`);
      
      const testResult = await runTestsForBrowser(browser);
      
      if (testResult.success) {
        console.log(`✅ ${browser} tests completed`);
      } else {
        console.log(`❌ ${browser} tests failed`);
        console.log(`Error: ${testResult.errors.join(', ')}`);
      }

      // Parse results
      const resultFile = path.join(OUTPUT_DIR, browser, 'results.json');
      const parsedResults = parseTestResults(resultFile, browser);
      allResults.push(parsedResults);

    } catch (error) {
      console.error(`💥 Fatal error testing ${browser}:`, error);
      allResults.push({
        browser,
        totalTests: 0,
        passedTests: 0,
        failedTests: 1,
        failures: [{ test: 'Browser execution', error: error.message }],
        warnings: []
      });
    }
  }

  // Test mobile browsers
  for (const browser of MOBILE_BROWSERS) {
    try {
      console.log(`\n📱 Testing ${browser}...`);
      
      const testResult = await runTestsForBrowser(browser);
      
      if (testResult.success) {
        console.log(`✅ ${browser} tests completed`);
      } else {
        console.log(`❌ ${browser} tests failed`);
      }

      const resultFile = path.join(OUTPUT_DIR, browser.replace(' ', '_'), 'results.json');
      const parsedResults = parseTestResults(resultFile, browser);
      allResults.push(parsedResults);

    } catch (error) {
      console.error(`💥 Fatal error testing ${browser}:`, error);
      allResults.push({
        browser,
        totalTests: 0,
        passedTests: 0,
        failedTests: 1,
        failures: [{ test: 'Mobile browser execution', error: error.message }],
        warnings: []
      });
    }
  }

  // Generate comprehensive report
  console.log('\n📊 Generating cross-browser compatibility report...');
  
  const report = generateReport(allResults);
  fs.writeFileSync(REPORT_FILE, report);
  
  console.log(`✅ Report generated: ${REPORT_FILE}`);

  // Print summary
  console.log('\n📈 SUMMARY:');
  allResults.forEach(result => {
    const status = result.totalTests === 0 ? '❓' : 
                  result.failedTests === 0 ? '✅' : '❌';
    console.log(`${status} ${result.browser}: ${result.passedTests}/${result.totalTests} passed`);
  });

  const totalTests = allResults.reduce((sum, r) => sum + r.totalTests, 0);
  const totalPassed = allResults.reduce((sum, r) => sum + r.passedTests, 0);
  const overallRate = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : '0';
  
  console.log(`\n🎯 Overall Success Rate: ${overallRate}% (${totalPassed}/${totalTests} tests passed)`);
  
  if (totalTests === 0) {
    console.log('\n⚠️  No tests were executed. Please check browser installations and test environment.');
    process.exit(1);
  } else if (parseFloat(overallRate) < 75) {
    console.log('\n🚨 Browser compatibility issues detected. Review the report for details.');
    process.exit(1);
  } else {
    console.log('\n🎉 Cross-browser search testing completed successfully!');
  }
}

// Execute if run directly
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { main, runTestsForBrowser, generateReport };