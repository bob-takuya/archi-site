# Network Monitoring Guide for Search Functionality

## Overview

This guide explains how to use the comprehensive network monitoring tests to track and analyze search functionality network behavior. As a TESTER agent monitoring network activity, these tests provide detailed insights into API requests, failures, timing, and performance issues.

## Test Suite Components

### 1. Search Network Monitoring (`search-network-monitoring.spec.ts`)

**Purpose**: Monitor all network activity during search operations

**Coverage**:
- All HTTP requests made during search
- Failed or cancelled request detection
- Request timing and order analysis
- Duplicate request identification
- Response data structure validation

**Key Features**:
- Real-time network event capturing
- Comprehensive request/response logging
- Performance metrics collection
- Duplicate request detection
- Failure analysis and reporting

### 2. Search API Monitoring (`search-api-monitoring.spec.ts`)

**Purpose**: Focused monitoring of Search API endpoints and database operations

**Coverage**:
- Search Service API calls (globalSearch, searchByTag, fullTextSearch)
- SQLite database operations
- Response data validation
- Error handling verification
- Caching behavior analysis

**Key Features**:
- API call interception and analysis
- Response structure validation
- Performance threshold monitoring
- Error scenario testing
- Cache effectiveness measurement

## Running Network Monitoring Tests

### Quick Start

```bash
# Run all network monitoring tests
npm run test:network-monitoring

# Or run the automated script
node scripts/run-network-monitoring-tests.js
```

### Manual Test Execution

```bash
# Run specific test suite
npx playwright test search-network-monitoring.spec.ts --config=tests/e2e/network-monitoring.config.ts

# Run API monitoring tests
npx playwright test search-api-monitoring.spec.ts --config=tests/e2e/network-monitoring.config.ts

# Run with detailed output
npx playwright test --config=tests/e2e/network-monitoring.config.ts --reporter=line
```

### Test Configuration Options

```bash
# Run with specific browser
npx playwright test --project=chromium-network-monitoring

# Run with debug mode
npx playwright test --debug

# Generate trace files
npx playwright test --trace=on
```

## Understanding Test Results

### Network Event Types

1. **Request Events**: Outgoing HTTP requests with headers and timing
2. **Response Events**: Response data, status codes, and performance metrics
3. **Failure Events**: Network failures, timeouts, and error conditions
4. **Cancellation Events**: Cancelled requests and their reasons

### Key Metrics Monitored

#### Request Metrics
- **Request Count**: Number of requests per search operation
- **Request Method**: HTTP methods used (GET, POST, etc.)
- **Request Headers**: Authentication, content-type, cache-control
- **Request Body**: POST data and parameters

#### Response Metrics
- **Response Time**: Time from request to response completion
- **Status Codes**: HTTP status codes (200, 404, 500, etc.)
- **Response Size**: Content-length and actual response size
- **Response Headers**: Cache headers, content-type, etc.

#### Performance Metrics
- **Average Response Time**: Mean response time across all requests
- **Request Frequency**: Requests per second during search operations
- **Cache Hit Rate**: Percentage of cached vs fresh responses
- **Error Rate**: Percentage of failed requests

### Interpreting Results

#### Successful Test Results
```
✓ Search Network Report: 
  Total Requests: 3
  Total Responses: 3
  Failed/Cancelled: 0
  Average Response Time: 245.67ms
```

#### Performance Issues
```
⚠ Search Network Report:
  Total Requests: 5
  Total Responses: 3
  Failed/Cancelled: 2
  Duplicate Requests: 1
  Average Response Time: 3456.78ms
```

#### Critical Issues
```
❌ Search Network Report:
  Failed Requests:
    GET /api/search?q=Tokyo - Request timeout
    POST /api/architecture - HTTP 500
```

## Common Network Issues and Solutions

### 1. Excessive Request Volume

**Symptoms**:
- High duplicate request count
- Multiple requests for same search term
- Browser performance degradation

**Solutions**:
- Implement request debouncing (300ms recommended)
- Add request cancellation for rapid successive searches
- Implement proper loading states

### 2. Slow Response Times

**Symptoms**:
- Average response time > 2000ms
- Search delays affecting user experience
- Timeout errors

**Solutions**:
- Optimize database queries
- Implement response caching
- Add query indexing
- Consider request prioritization

### 3. Request Failures

**Symptoms**:
- HTTP 4xx/5xx status codes
- Network timeout errors
- Cancelled requests

**Solutions**:
- Implement retry logic with exponential backoff
- Add proper error handling and user feedback
- Validate API endpoints and server configuration
- Check network connectivity handling

### 4. Database Loading Issues

**Symptoms**:
- SQLite database loading failures
- WASM/Worker loading errors
- Incomplete database initialization

**Solutions**:
- Verify database file accessibility
- Check WASM file loading
- Implement database connection pooling
- Add database health checks

## Test Customization

### Adding Custom Monitoring

```typescript
// Add custom network event monitoring
monitor.page.on('request', (request) => {
  if (request.url().includes('your-custom-endpoint')) {
    // Custom monitoring logic
  }
});
```

### Custom Performance Thresholds

```typescript
// Set custom thresholds for your application
const RESPONSE_TIME_THRESHOLD = 1500; // ms
const ERROR_RATE_THRESHOLD = 5; // percentage
const DUPLICATE_THRESHOLD = 2; // maximum duplicates
```

### Environment-Specific Configuration

```typescript
// Development vs Production monitoring
const config = {
  development: {
    timeout: 10000,
    retries: 1,
    caching: false
  },
  production: {
    timeout: 5000,
    retries: 3,
    caching: true
  }
};
```

## Continuous Integration

### GitHub Actions Integration

```yaml
- name: Run Network Monitoring Tests
  run: |
    npm install
    npx playwright install
    node scripts/run-network-monitoring-tests.js
  
- name: Upload Network Reports
  uses: actions/upload-artifact@v3
  with:
    name: network-monitoring-reports
    path: reports/network-monitoring/
```

### Automated Alerts

Set up automated alerts for:
- Average response time > 3000ms
- Error rate > 10%
- Duplicate request count > 5
- Database loading failures

## Report Analysis

### Daily Monitoring Checklist

1. **Review Response Times**: Ensure average < 2000ms
2. **Check Error Rates**: Maintain < 5% error rate
3. **Analyze Duplicates**: Investigate > 3 duplicate requests
4. **Database Performance**: Monitor SQLite query performance
5. **Cache Effectiveness**: Verify cache hit rates > 70%

### Weekly Performance Review

1. **Trend Analysis**: Compare week-over-week metrics
2. **Performance Regression**: Identify any degradation
3. **Optimization Opportunities**: Review slow queries
4. **User Experience Impact**: Correlate with user feedback

## Troubleshooting

### Common Test Failures

**Test timeout errors**:
```bash
# Increase timeout in config
timeout: 60000 // 60 seconds
```

**Network isolation issues**:
```bash
# Run with --headed to debug
npx playwright test --headed --debug
```

**Database loading failures**:
```bash
# Check database file existence
ls -la public/db/archimap.sqlite
```

### Debug Commands

```bash
# Enable Playwright debug logs
DEBUG=pw:api npx playwright test

# Capture network traces
npx playwright test --trace=on

# Generate detailed HTML report
npx playwright show-report
```

## Best Practices

### Test Maintenance

1. **Regular Updates**: Keep tests updated with API changes
2. **Threshold Tuning**: Adjust performance thresholds based on requirements
3. **Coverage Expansion**: Add monitoring for new features
4. **Documentation**: Keep monitoring documentation current

### Performance Optimization

1. **Baseline Establishment**: Create performance baselines
2. **Regression Detection**: Monitor for performance degradation
3. **Optimization Validation**: Verify performance improvements
4. **User Experience**: Correlate technical metrics with UX

### Reporting and Communication

1. **Stakeholder Reports**: Generate executive summaries
2. **Developer Alerts**: Real-time notifications for critical issues
3. **Trend Analysis**: Long-term performance trends
4. **Action Items**: Clear recommendations for improvements

---

This comprehensive network monitoring system ensures robust search functionality by providing detailed insights into network behavior, performance characteristics, and potential issues before they affect users.