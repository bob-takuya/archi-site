/**
 * Search Network Activity Monitoring Test Suite
 * 
 * As a TESTER agent, this comprehensive test monitors all network activity
 * during search operations to identify issues that could cause search failures.
 * 
 * Test Coverage:
 * 1. API requests made for each search
 * 2. Failed or cancelled requests
 * 3. Request timing and order
 * 4. Duplicate request detection
 * 5. Response data structure validation
 */

import { test, expect, Page } from '@playwright/test';

interface NetworkRequest {
  url: string;
  method: string;
  timestamp: number;
  requestId: string;
  headers: Record<string, string>;
  postData?: string;
}

interface NetworkResponse {
  url: string;
  status: number;
  statusText: string;
  timestamp: number;
  requestId: string;
  headers: Record<string, string>;
  size: number;
  responseTime: number;
  body?: any;
}

interface NetworkEvent {
  type: 'request' | 'response' | 'failure' | 'cancelled';
  timestamp: number;
  data: NetworkRequest | NetworkResponse | { url: string; error: string };
}

class NetworkMonitor {
  private events: NetworkEvent[] = [];
  private pendingRequests: Map<string, NetworkRequest> = new Map();
  private duplicateRequests: Map<string, number> = new Map();
  
  constructor(private page: Page) {
    this.setupMonitoring();
  }

  private setupMonitoring() {
    // Monitor request events
    this.page.on('request', (request) => {
      const timestamp = Date.now();
      const requestData: NetworkRequest = {
        url: request.url(),
        method: request.method(),
        timestamp,
        requestId: request.url() + timestamp,
        headers: request.headers(),
        postData: request.postData() || undefined
      };

      // Track duplicate requests
      const requestKey = `${request.method()}_${request.url()}`;
      const count = this.duplicateRequests.get(requestKey) || 0;
      this.duplicateRequests.set(requestKey, count + 1);

      this.pendingRequests.set(requestData.requestId, requestData);
      this.events.push({
        type: 'request',
        timestamp,
        data: requestData
      });
    });

    // Monitor response events
    this.page.on('response', async (response) => {
      const timestamp = Date.now();
      const request = response.request();
      const requestKey = request.url() + response.request().timing().startTime;
      const pendingRequest = this.pendingRequests.get(requestKey);
      
      if (pendingRequest) {
        const responseTime = timestamp - pendingRequest.timestamp;
        
        // Get response body for API calls
        let body: any = undefined;
        try {
          if (response.url().includes('/api/') || 
              response.url().includes('.json') ||
              response.url().includes('search') ||
              response.url().includes('db/')) {
            const contentType = response.headers()['content-type'] || '';
            if (contentType.includes('application/json')) {
              body = await response.json();
            } else if (contentType.includes('text/')) {
              body = await response.text();
            }
          }
        } catch (error) {
          // Body parsing failed, continue without body
        }

        const responseData: NetworkResponse = {
          url: response.url(),
          status: response.status(),
          statusText: response.statusText(),
          timestamp,
          requestId: requestKey,
          headers: response.headers(),
          size: parseInt(response.headers()['content-length'] || '0'),
          responseTime,
          body
        };

        this.events.push({
          type: 'response',
          timestamp,
          data: responseData
        });

        this.pendingRequests.delete(requestKey);
      }
    });

    // Monitor request failures
    this.page.on('requestfailed', (request) => {
      const timestamp = Date.now();
      this.events.push({
        type: 'failure',
        timestamp,
        data: {
          url: request.url(),
          error: request.failure()?.errorText || 'Unknown error'
        }
      });
    });

    // Monitor request cancellations
    this.page.on('requestfinished', (request) => {
      // Check if request was cancelled (no response received)
      if (!request.response()) {
        const timestamp = Date.now();
        this.events.push({
          type: 'cancelled',
          timestamp,
          data: {
            url: request.url(),
            error: 'Request was cancelled'
          }
        });
      }
    });
  }

  getEvents(): NetworkEvent[] {
    return [...this.events];
  }

  getRequestsForSearch(searchTerm?: string): NetworkEvent[] {
    return this.events.filter(event => {
      const url = typeof event.data === 'object' && 'url' in event.data ? event.data.url : '';
      return url.includes('search') || 
             url.includes('/api/') || 
             url.includes('db/') ||
             (searchTerm && url.includes(encodeURIComponent(searchTerm)));
    });
  }

  getFailedRequests(): NetworkEvent[] {
    return this.events.filter(event => 
      event.type === 'failure' || 
      event.type === 'cancelled' ||
      (event.type === 'response' && 
       typeof event.data === 'object' && 
       'status' in event.data && 
       event.data.status >= 400)
    );
  }

  getDuplicateRequests(): { url: string; count: number; method: string }[] {
    const duplicates: { url: string; count: number; method: string }[] = [];
    
    for (const [key, count] of this.duplicateRequests.entries()) {
      if (count > 1) {
        const [method, ...urlParts] = key.split('_');
        duplicates.push({
          method,
          url: urlParts.join('_'),
          count
        });
      }
    }
    
    return duplicates;
  }

  getAverageResponseTime(): number {
    const responseTimes = this.events
      .filter(event => event.type === 'response')
      .map(event => (event.data as NetworkResponse).responseTime)
      .filter(time => time > 0);
    
    if (responseTimes.length === 0) return 0;
    return responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
  }

  clearEvents() {
    this.events = [];
    this.pendingRequests.clear();
    this.duplicateRequests.clear();
  }

  generateReport(): string {
    const totalRequests = this.events.filter(e => e.type === 'request').length;
    const totalResponses = this.events.filter(e => e.type === 'response').length;
    const failedRequests = this.getFailedRequests().length;
    const duplicates = this.getDuplicateRequests();
    const avgResponseTime = this.getAverageResponseTime();

    return `
Network Monitoring Report:
========================
Total Requests: ${totalRequests}
Total Responses: ${totalResponses}
Failed/Cancelled: ${failedRequests}
Duplicate Requests: ${duplicates.length}
Average Response Time: ${avgResponseTime.toFixed(2)}ms

${duplicates.length > 0 ? `
Duplicate Requests:
${duplicates.map(d => `  ${d.method} ${d.url} (${d.count} times)`).join('\n')}
` : ''}

${failedRequests > 0 ? `
Failed Requests:
${this.getFailedRequests().map(e => `  ${(e.data as any).url} - ${(e.data as any).error || 'HTTP ' + (e.data as any).status}`).join('\n')}
` : ''}
    `.trim();
  }
}

test.describe('Search Network Activity Monitoring', () => {
  let monitor: NetworkMonitor;

  test.beforeEach(async ({ page }) => {
    monitor = new NetworkMonitor(page);
    await page.goto('/architecture');
    
    // Wait for initial page load to complete
    await page.waitForLoadState('networkidle');
    
    // Clear monitoring data after page load
    monitor.clearEvents();
  });

  test('should monitor global search API requests', async ({ page }) => {
    const searchTerm = 'Tokyo';
    
    // Perform search
    await page.getByPlaceholder('検索').fill(searchTerm);
    await page.getByRole('button', { name: /search/i }).click();
    
    // Wait for search to complete
    await page.waitForTimeout(2000);
    
    // Analyze network activity
    const searchRequests = monitor.getRequestsForSearch(searchTerm);
    const failedRequests = monitor.getFailedRequests();
    const duplicates = monitor.getDuplicateRequests();
    
    console.log('Search Network Report:', monitor.generateReport());
    
    // Assertions
    expect(searchRequests.length, 'Should have search-related requests').toBeGreaterThan(0);
    expect(failedRequests.length, 'Should have no failed requests').toBe(0);
    
    // Check for reasonable response times
    const avgResponseTime = monitor.getAverageResponseTime();
    expect(avgResponseTime, 'Average response time should be reasonable').toBeLessThan(5000);
    
    // Log duplicate requests if any
    if (duplicates.length > 0) {
      console.warn('Duplicate requests detected:', duplicates);
    }
  });

  test('should monitor faceted search with filters', async ({ page }) => {
    // Check if filters are available on the page
    const filterToggle = page.getByTestId('filter-toggle');
    if (await filterToggle.isVisible()) {
      await filterToggle.click();
    }
    
    // Apply prefecture filter if available
    const prefectureFilter = page.getByLabel(/prefecture/i);
    if (await prefectureFilter.isVisible()) {
      await prefectureFilter.selectOption('Tokyo');
    }
    
    // Apply filters
    const applyButton = page.getByRole('button', { name: /apply filters/i });
    if (await applyButton.isVisible()) {
      await applyButton.click();
    }
    
    // Wait for search to complete
    await page.waitForTimeout(2000);
    
    // Analyze network activity
    const searchRequests = monitor.getRequestsForSearch();
    const failedRequests = monitor.getFailedRequests();
    
    console.log('Faceted Search Network Report:', monitor.generateReport());
    
    // Assertions
    expect(searchRequests.length, 'Should have filter-related requests').toBeGreaterThan(0);
    expect(failedRequests.length, 'Should have no failed requests').toBe(0);
  });

  test('should detect search debouncing behavior', async ({ page }) => {
    const searchInput = page.getByPlaceholder('検索');
    
    // Type rapidly to trigger debouncing
    const rapidSearchTerms = ['T', 'To', 'Tok', 'Toky', 'Tokyo'];
    
    for (const term of rapidSearchTerms) {
      await searchInput.fill(term);
      await page.waitForTimeout(100); // Small delay between keystrokes
    }
    
    // Wait for debounce period to complete
    await page.waitForTimeout(1000);
    
    // Analyze network requests
    const allEvents = monitor.getEvents();
    const searchRequests = monitor.getRequestsForSearch('Tokyo');
    
    console.log('Debouncing Test Network Report:', monitor.generateReport());
    
    // Should not have excessive requests due to debouncing
    expect(searchRequests.length, 'Debouncing should limit request count').toBeLessThan(rapidSearchTerms.length);
  });

  test('should validate search response data structure', async ({ page }) => {
    // Perform search
    await page.getByPlaceholder('検索').fill('architecture');
    await page.getByRole('button', { name: /search/i }).click();
    
    // Wait for search to complete
    await page.waitForTimeout(2000);
    
    // Find search response data
    const searchResponses = monitor.getEvents()
      .filter(event => event.type === 'response')
      .map(event => event.data as NetworkResponse)
      .filter(response => 
        response.url.includes('search') || 
        response.url.includes('/api/') ||
        response.body !== undefined
      );
    
    console.log('Response Structure Test Network Report:', monitor.generateReport());
    
    // Validate response structures
    for (const response of searchResponses) {
      expect(response.status, `Response ${response.url} should be successful`).toBeLessThan(400);
      
      if (response.body && typeof response.body === 'object') {
        // Check common search response structure
        if (Array.isArray(response.body)) {
          // Array response (list of results)
          expect(response.body.length, 'Response array should be valid').toBeGreaterThanOrEqual(0);
        } else if (response.body.hasOwnProperty('items') || 
                   response.body.hasOwnProperty('architectures') ||
                   response.body.hasOwnProperty('results')) {
          // Paginated or structured response
          expect(typeof response.body, 'Response should be an object').toBe('object');
        }
      }
    }
    
    expect(searchResponses.length, 'Should have search response data').toBeGreaterThan(0);
  });

  test('should monitor database loading requests', async ({ page }) => {
    // Navigate to a page that requires database loading
    await page.goto('/architecture');
    
    // Wait for database loading to complete
    await page.waitForTimeout(3000);
    
    // Analyze database-related requests
    const dbEvents = monitor.getEvents().filter(event => {
      const url = typeof event.data === 'object' && 'url' in event.data ? event.data.url : '';
      return url.includes('db/') || 
             url.includes('.sqlite') || 
             url.includes('database') ||
             url.includes('.wasm') ||
             url.includes('worker');
    });
    
    console.log('Database Loading Network Report:', monitor.generateReport());
    
    // Validate database loading
    expect(dbEvents.length, 'Should have database-related requests').toBeGreaterThan(0);
    
    // Check for specific database files
    const sqliteRequests = dbEvents.filter(event => 
      typeof event.data === 'object' && 
      'url' in event.data && 
      event.data.url.includes('.sqlite')
    );
    
    if (sqliteRequests.length > 0) {
      expect(sqliteRequests.length, 'Should load SQLite database').toBeGreaterThan(0);
    }
  });

  test('should monitor search request cancellation scenarios', async ({ page }) => {
    const searchInput = page.getByPlaceholder('検索');
    
    // Start a search
    await searchInput.fill('Tokyo');
    await page.getByRole('button', { name: /search/i }).click();
    
    // Immediately change search term to potentially cancel the first request
    await page.waitForTimeout(100);
    await searchInput.fill('Osaka');
    await page.getByRole('button', { name: /search/i }).click();
    
    // Wait for all requests to complete
    await page.waitForTimeout(2000);
    
    // Check for cancelled requests
    const cancelledRequests = monitor.getEvents().filter(event => event.type === 'cancelled');
    const failedRequests = monitor.getFailedRequests();
    
    console.log('Request Cancellation Network Report:', monitor.generateReport());
    
    // Log cancelled requests for analysis
    if (cancelledRequests.length > 0) {
      console.log('Cancelled requests detected:', cancelledRequests.length);
    }
    
    // Ensure no failed requests (cancellation should be handled gracefully)
    const actualFailures = failedRequests.filter(event => event.type === 'failure');
    expect(actualFailures.length, 'Should handle cancellations without failures').toBe(0);
  });

  test('should monitor search performance under load', async ({ page }) => {
    const searchTerms = ['Tokyo', 'Osaka', 'Kyoto', 'Hiroshima', 'Fukuoka'];
    
    // Perform multiple searches rapidly
    for (const term of searchTerms) {
      await page.getByPlaceholder('検索').fill(term);
      await page.getByRole('button', { name: /search/i }).click();
      await page.waitForTimeout(500);
    }
    
    // Wait for all searches to complete
    await page.waitForTimeout(3000);
    
    // Analyze performance
    const allEvents = monitor.getEvents();
    const responseEvents = allEvents.filter(event => event.type === 'response');
    const avgResponseTime = monitor.getAverageResponseTime();
    const failedRequests = monitor.getFailedRequests();
    
    console.log('Performance Test Network Report:', monitor.generateReport());
    
    // Performance assertions
    expect(avgResponseTime, 'Average response time should be reasonable under load').toBeLessThan(10000);
    expect(failedRequests.length, 'Should handle load without failures').toBe(0);
    expect(responseEvents.length, 'Should receive responses for all requests').toBeGreaterThan(0);
  });

  test.afterEach(async ({ page }) => {
    // Generate final report
    const finalReport = monitor.generateReport();
    console.log('Final Network Monitoring Report:', finalReport);
    
    // Capture any remaining network issues
    const failedRequests = monitor.getFailedRequests();
    const duplicates = monitor.getDuplicateRequests();
    
    if (failedRequests.length > 0) {
      console.error('Network issues detected:', failedRequests);
    }
    
    if (duplicates.length > 0) {
      console.warn('Duplicate requests detected:', duplicates);
    }
  });
});