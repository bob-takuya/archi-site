/**
 * Network Monitoring Test Runner
 * 
 * Runs comprehensive network monitoring tests for search functionality
 * and generates detailed reports for analysis
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class NetworkTestRunner {
  constructor() {
    this.resultsDir = path.join(__dirname, '..', 'test-results', 'network-monitoring');
    this.reportsDir = path.join(__dirname, '..', 'reports', 'network-monitoring');
    
    // Ensure directories exist
    this.ensureDirectories();
  }
  
  ensureDirectories() {
    [this.resultsDir, this.reportsDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }
  
  async runTests() {
    console.log('🔍 Starting Network Monitoring Tests...\n');
    
    try {
      // Run network monitoring tests
      console.log('📊 Running search network monitoring tests...');
      this.runPlaywrightTests('search-network-monitoring.spec.ts');
      
      console.log('🔌 Running search API monitoring tests...');
      this.runPlaywrightTests('search-api-monitoring.spec.ts');
      
      // Generate comprehensive report
      console.log('📋 Generating network monitoring report...');
      this.generateNetworkReport();
      
      // Generate JSON report
      this.generateJsonReport();
      
      console.log('✅ Network monitoring tests completed successfully!');
      
    } catch (error) {
      console.error('❌ Network monitoring tests failed:', error.message);
      process.exit(1);
    }
  }
  
  runPlaywrightTests(testFile) {
    try {
      const command = `npx playwright test ${testFile} --config=tests/e2e/network-monitoring.config.ts --reporter=json`;
      const output = execSync(command, { 
        cwd: path.join(__dirname, '..'),
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      console.log(`✓ ${testFile} completed`);
      return output;
      
    } catch (error) {
      console.error(`✗ ${testFile} failed:`, error.message);
      throw error;
    }
  }
  
  generateNetworkReport() {
    const reportPath = path.join(this.reportsDir, 'network-monitoring-report.md');
    const timestamp = new Date().toISOString();
    
    let report = `# Network Monitoring Report\n\n`;
    report += `**Generated:** ${timestamp}\n\n`;
    report += `## Executive Summary\n\n`;
    
    // Try to read test results
    const resultsFile = path.join(this.resultsDir, 'network-monitoring-results.json');
    if (fs.existsSync(resultsFile)) {
      try {
        const results = JSON.parse(fs.readFileSync(resultsFile, 'utf8'));
        report += this.generateSummaryFromResults(results);
      } catch (error) {
        report += `Error reading test results: ${error.message}\n\n`;
      }
    }
    
    report += this.generateRecommendations();
    report += this.generateTechnicalDetails();
    
    fs.writeFileSync(reportPath, report);
    console.log(`📄 Network monitoring report generated: ${reportPath}`);
  }
  
  generateSummaryFromResults(results) {
    let summary = '';
    
    const totalTests = results.suites?.reduce((sum, suite) => {
      return sum + (suite.specs?.length || 0);
    }, 0) || 0;
    
    const passedTests = results.suites?.reduce((sum, suite) => {
      return sum + (suite.specs?.filter(spec => spec.tests?.every(test => test.status === 'passed'))?.length || 0);
    }, 0) || 0;
    
    const failedTests = totalTests - passedTests;
    
    summary += `### Test Results\n\n`;
    summary += `- **Total Tests:** ${totalTests}\n`;
    summary += `- **Passed:** ${passedTests}\n`;
    summary += `- **Failed:** ${failedTests}\n`;
    summary += `- **Success Rate:** ${totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : 0}%\n\n`;
    
    if (failedTests > 0) {
      summary += `### ⚠️ Critical Issues Detected\n\n`;
      
      results.suites?.forEach(suite => {
        suite.specs?.forEach(spec => {
          spec.tests?.forEach(test => {
            if (test.status === 'failed') {
              summary += `- **${test.title}**: ${test.error?.message || 'Unknown error'}\n`;
            }
          });
        });
      });
      
      summary += `\n`;
    }
    
    return summary;
  }
  
  generateRecommendations() {
    return `## Recommendations\n\n` +
      `### Search Performance Optimization\n\n` +
      `1. **Request Debouncing**: Ensure search requests are properly debounced to prevent excessive API calls\n` +
      `2. **Response Caching**: Implement appropriate caching strategies for frequently searched terms\n` +
      `3. **Error Handling**: Verify graceful handling of network failures and timeouts\n` +
      `4. **Request Cancellation**: Implement proper request cancellation for rapid successive searches\n\n` +
      
      `### Network Reliability\n\n` +
      `1. **Retry Logic**: Implement exponential backoff for failed requests\n` +
      `2. **Timeout Management**: Set appropriate timeouts for different types of requests\n` +
      `3. **Connection Monitoring**: Monitor network connectivity and provide offline feedback\n` +
      `4. **Duplicate Prevention**: Prevent duplicate requests for the same search terms\n\n` +
      
      `### Database Performance\n\n` +
      `1. **Query Optimization**: Optimize SQLite queries for better search performance\n` +
      `2. **Index Management**: Ensure proper database indexes for search fields\n` +
      `3. **Connection Pooling**: Implement database connection pooling if applicable\n` +
      `4. **Memory Management**: Monitor database memory usage and implement cleanup\n\n`;
  }
  
  generateTechnicalDetails() {
    return `## Technical Details\n\n` +
      `### Monitored Network Events\n\n` +
      `1. **Request Events**: All outgoing HTTP requests with timing information\n` +
      `2. **Response Events**: Response data, status codes, and performance metrics\n` +
      `3. **Failure Events**: Network failures, timeouts, and error conditions\n` +
      `4. **Cancellation Events**: Cancelled requests and their reasons\n\n` +
      
      `### Search API Endpoints\n\n` +
      `1. **Global Search**: \`globalSearch(searchTerm, limit)\` function monitoring\n` +
      `2. **Tag Search**: \`searchByTag(tag, page, limit)\` function monitoring\n` +
      `3. **Full-Text Search**: \`fullTextSearch(term, page, limit)\` function monitoring\n` +
      `4. **Database Queries**: SQLite query execution and performance\n\n` +
      
      `### Performance Metrics\n\n` +
      `1. **Response Times**: Average, minimum, and maximum response times\n` +
      `2. **Request Frequency**: Number of requests per search operation\n` +
      `3. **Cache Hit Rates**: Effectiveness of caching mechanisms\n` +
      `4. **Error Rates**: Percentage of failed vs successful requests\n\n` +
      
      `### Browser Compatibility\n\n` +
      `1. **Chromium**: Desktop Chrome network behavior\n` +
      `2. **Firefox**: Desktop Firefox network behavior\n` +
      `3. **Mobile**: Mobile browser network performance\n` +
      `4. **Cross-Browser**: Consistency across different browsers\n\n`;
  }
  
  generateJsonReport() {
    // Generate a machine-readable JSON report
    const jsonReport = {
      timestamp: new Date().toISOString(),
      testSuite: 'Network Monitoring',
      summary: {
        purpose: 'Monitor network activity during search operations',
        coverage: [
          'API request monitoring',
          'Failed request detection',
          'Request timing analysis',
          'Duplicate request identification',
          'Response data validation'
        ]
      },
      metrics: {
        monitored: [
          'Request count per search',
          'Average response time',
          'Error rate',
          'Cache hit rate',
          'Duplicate request count'
        ]
      },
      recommendations: [
        'Implement request debouncing',
        'Add response caching',
        'Improve error handling',
        'Optimize database queries',
        'Monitor network connectivity'
      ]
    };
    
    const jsonReportPath = path.join(this.reportsDir, 'network-monitoring-report.json');
    fs.writeFileSync(jsonReportPath, JSON.stringify(jsonReport, null, 2));
    console.log(`📊 JSON report generated: ${jsonReportPath}`);
  }
}

// Run the network monitoring tests
if (require.main === module) {
  const runner = new NetworkTestRunner();
  runner.runTests().catch(error => {
    console.error('Failed to run network monitoring tests:', error);
    process.exit(1);
  });
}

module.exports = NetworkTestRunner;