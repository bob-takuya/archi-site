/**
 * Search API Network Monitoring Test Suite
 * 
 * Focused monitoring of Search API endpoints and database queries
 * This test specifically tracks the SearchService API calls and SQLite operations
 */

import { test, expect, Page } from '@playwright/test';

interface ApiCall {
  url: string;
  method: string;
  timestamp: number;
  headers: Record<string, string>;
  requestBody?: any;
  responseBody?: any;
  status?: number;
  responseTime?: number;
  error?: string;
}

class SearchApiMonitor {
  private apiCalls: ApiCall[] = [];
  private page: Page;
  
  constructor(page: Page) {
    this.page = page;
    this.setupApiMonitoring();
  }
  
  private setupApiMonitoring() {
    // Monitor search-related API calls
    this.page.route('**/search**', async (route) => {
      const request = route.request();
      const timestamp = Date.now();
      
      const apiCall: ApiCall = {
        url: request.url(),
        method: request.method(),
        timestamp,
        headers: request.headers(),
        requestBody: request.postDataJSON()
      };
      
      try {
        const response = await route.fetch();
        const responseBody = await this.parseResponseBody(response);
        
        apiCall.status = response.status();
        apiCall.responseTime = Date.now() - timestamp;
        apiCall.responseBody = responseBody;
        
        this.apiCalls.push(apiCall);
        
        // Continue with the response
        route.fulfill({
          status: response.status(),
          headers: response.headers(),
          body: await response.body()
        });
      } catch (error) {
        apiCall.error = error instanceof Error ? error.message : 'Unknown error';
        this.apiCalls.push(apiCall);
        route.abort();
      }
    });
    
    // Monitor database-related requests
    this.page.route('**/db/**', async (route) => {
      const request = route.request();
      const timestamp = Date.now();
      
      const apiCall: ApiCall = {
        url: request.url(),
        method: request.method(),
        timestamp,
        headers: request.headers()
      };
      
      try {
        const response = await route.fetch();
        
        apiCall.status = response.status();
        apiCall.responseTime = Date.now() - timestamp;
        
        // Don't parse binary database files
        if (!request.url().includes('.sqlite') && !request.url().includes('.wasm')) {
          apiCall.responseBody = await this.parseResponseBody(response);
        }
        
        this.apiCalls.push(apiCall);
        
        route.fulfill({
          status: response.status(),
          headers: response.headers(),
          body: await response.body()
        });
      } catch (error) {
        apiCall.error = error instanceof Error ? error.message : 'Unknown error';
        this.apiCalls.push(apiCall);
        route.abort();
      }
    });
  }
  
  private async parseResponseBody(response: Response): Promise<any> {
    try {
      const contentType = response.headers()['content-type'] || '';
      if (contentType.includes('application/json')) {
        return await response.json();
      } else if (contentType.includes('text/')) {
        return await response.text();
      }
    } catch {
      // Return null if parsing fails
    }
    return null;
  }
  
  getApiCalls(): ApiCall[] {
    return [...this.apiCalls];
  }
  
  getSearchApiCalls(): ApiCall[] {
    return this.apiCalls.filter(call => 
      call.url.includes('search') || 
      call.url.includes('/api/architecture') ||
      call.url.includes('/api/architect')
    );
  }
  
  getDatabaseCalls(): ApiCall[] {
    return this.apiCalls.filter(call => call.url.includes('/db/'));
  }
  
  getFailedCalls(): ApiCall[] {
    return this.apiCalls.filter(call => 
      call.error || (call.status && call.status >= 400)
    );
  }
  
  getSlowCalls(threshold: number = 2000): ApiCall[] {
    return this.apiCalls.filter(call => 
      call.responseTime && call.responseTime > threshold
    );
  }
  
  clearCalls() {
    this.apiCalls = [];
  }
  
  generateReport(): string {
    const total = this.apiCalls.length;
    const searchCalls = this.getSearchApiCalls().length;
    const dbCalls = this.getDatabaseCalls().length;
    const failed = this.getFailedCalls().length;
    const slow = this.getSlowCalls().length;
    
    const avgResponseTime = this.apiCalls
      .filter(call => call.responseTime)
      .reduce((sum, call) => sum + (call.responseTime || 0), 0) / 
      this.apiCalls.filter(call => call.responseTime).length || 0;
    
    return `
Search API Monitoring Report:
============================
Total API Calls: ${total}
Search API Calls: ${searchCalls}
Database Calls: ${dbCalls}
Failed Calls: ${failed}
Slow Calls (>2s): ${slow}
Average Response Time: ${avgResponseTime.toFixed(2)}ms

${failed > 0 ? `
Failed Calls:
${this.getFailedCalls().map(call => `  ${call.method} ${call.url} - ${call.error || 'HTTP ' + call.status}`).join('\n')}
` : ''}

${slow > 0 ? `
Slow Calls:
${this.getSlowCalls().map(call => `  ${call.method} ${call.url} - ${call.responseTime}ms`).join('\n')}
` : ''}
    `.trim();
  }
}

test.describe('Search API Network Monitoring', () => {
  let apiMonitor: SearchApiMonitor;

  test.beforeEach(async ({ page }) => {
    apiMonitor = new SearchApiMonitor(page);
    await page.goto('/architecture');
    await page.waitForLoadState('networkidle');
    apiMonitor.clearCalls();
  });

  test('should monitor global search API calls', async ({ page }) => {
    // Perform a global search
    await page.getByPlaceholder('検索').fill('Tokyo Station');
    
    // Wait for debounced search
    await page.waitForTimeout(500);
    
    // Trigger immediate search
    await page.getByRole('button', { name: /search/i }).click();
    
    // Wait for search completion
    await page.waitForTimeout(2000);
    
    const searchCalls = apiMonitor.getSearchApiCalls();
    const failedCalls = apiMonitor.getFailedCalls();
    
    console.log('Global Search API Report:', apiMonitor.generateReport());
    
    // Validate search API calls
    expect(searchCalls.length, 'Should make search API calls').toBeGreaterThan(0);
    expect(failedCalls.length, 'Should have no failed API calls').toBe(0);
    
    // Validate search response structure
    const validSearchCalls = searchCalls.filter(call => call.responseBody);
    for (const call of validSearchCalls) {
      expect(call.status, `API call ${call.url} should be successful`).toBeLessThan(400);
      
      if (call.responseBody) {
        // Check for expected search response structure
        const body = call.responseBody;
        if (typeof body === 'object') {
          // Could be SearchResult interface with architectures, architects, etc.
          const hasValidStructure = 
            body.hasOwnProperty('architectures') ||
            body.hasOwnProperty('items') ||
            Array.isArray(body);
          
          expect(hasValidStructure, `Search response should have valid structure for ${call.url}`).toBeTruthy();
        }
      }
    }
  });

  test('should monitor tag-based search API calls', async ({ page }) => {
    // Navigate to a specific tag search if possible
    // This might be done through filters or direct URL
    
    const filterToggle = page.getByTestId('filter-toggle');
    if (await filterToggle.isVisible()) {
      await filterToggle.click();
      
      // Select a category filter if available
      const categoryFilter = page.getByLabel(/category/i).first();
      if (await categoryFilter.isVisible()) {
        await categoryFilter.click();
      }
    }
    
    await page.waitForTimeout(2000);
    
    const searchCalls = apiMonitor.getSearchApiCalls();
    const failedCalls = apiMonitor.getFailedCalls();
    
    console.log('Tag Search API Report:', apiMonitor.generateReport());
    
    // Validate tag search calls
    if (searchCalls.length > 0) {
      expect(failedCalls.length, 'Tag search should not fail').toBe(0);
      
      // Check for pagination structure in tag search responses
      const tagResponses = searchCalls.filter(call => call.responseBody);
      for (const call of tagResponses) {
        if (call.responseBody && typeof call.responseBody === 'object') {
          const body = call.responseBody;
          
          // Tag search might return paginated results
          if (body.hasOwnProperty('items') && body.hasOwnProperty('total')) {
            expect(typeof body.total, 'Total should be a number').toBe('number');
            expect(Array.isArray(body.items), 'Items should be an array').toBeTruthy();
          }
        }
      }
    }
  });

  test('should monitor full-text search API calls', async ({ page }) => {
    // Perform a detailed full-text search
    await page.getByPlaceholder('検索').fill('modern architecture concrete steel');
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: /search/i }).click();
    
    await page.waitForTimeout(2000);
    
    const searchCalls = apiMonitor.getSearchApiCalls();
    const failedCalls = apiMonitor.getFailedCalls();
    const slowCalls = apiMonitor.getSlowCalls(3000);
    
    console.log('Full-Text Search API Report:', apiMonitor.generateReport());
    
    // Validate full-text search performance
    expect(failedCalls.length, 'Full-text search should not fail').toBe(0);
    expect(slowCalls.length, 'Full-text search should be reasonably fast').toBeLessThan(searchCalls.length);
    
    // Validate search relevance in responses
    const relevantCalls = searchCalls.filter(call => 
      call.responseBody && 
      typeof call.responseBody === 'object'
    );
    
    for (const call of relevantCalls) {
      const body = call.responseBody;
      if (Array.isArray(body)) {
        // Check if results seem relevant (contain search terms)
        for (const item of body.slice(0, 3)) { // Check first 3 results
          if (item && typeof item === 'object') {
            const itemText = JSON.stringify(item).toLowerCase();
            const searchTerms = ['modern', 'architecture', 'concrete', 'steel'];
            const hasRelevantContent = searchTerms.some(term => itemText.includes(term));
            
            // Log for analysis but don't fail test (depends on database content)
            if (!hasRelevantContent) {
              console.log(`Search result may not be relevant for: ${JSON.stringify(item)}`);
            }
          }
        }
      }
    }
  });

  test('should monitor database initialization calls', async ({ page }) => {
    // Navigate to a fresh page to trigger database initialization
    await page.goto('/architecture?fresh=true');
    
    // Wait for database loading
    await page.waitForTimeout(3000);
    
    const dbCalls = apiMonitor.getDatabaseCalls();
    const failedCalls = apiMonitor.getFailedCalls();
    
    console.log('Database Initialization API Report:', apiMonitor.generateReport());
    
    // Validate database loading
    expect(dbCalls.length, 'Should make database-related calls').toBeGreaterThan(0);
    expect(failedCalls.length, 'Database loading should not fail').toBe(0);
    
    // Check for specific database files
    const sqliteCall = dbCalls.find(call => call.url.includes('.sqlite'));
    const wasmCall = dbCalls.find(call => call.url.includes('.wasm'));
    const workerCall = dbCalls.find(call => call.url.includes('worker'));
    
    if (sqliteCall) {
      expect(sqliteCall.status, 'SQLite database should load successfully').toBeLessThan(400);
    }
    
    if (wasmCall) {
      expect(wasmCall.status, 'WASM file should load successfully').toBeLessThan(400);
    }
    
    if (workerCall) {
      expect(workerCall.status, 'Worker file should load successfully').toBeLessThan(400);
    }
  });

  test('should monitor search API error handling', async ({ page }) => {
    // Test with potentially problematic search terms
    const problemSearchTerms = [
      '', // Empty search
      '%', // SQL special character
      '\'', // SQL injection attempt
      'SELECT * FROM', // SQL injection attempt
      'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', // Very long term
      '特殊文字', // Special Japanese characters
    ];
    
    for (const term of problemSearchTerms) {
      apiMonitor.clearCalls();
      
      await page.getByPlaceholder('検索').fill(term);
      await page.waitForTimeout(300);
      await page.getByRole('button', { name: /search/i }).click();
      await page.waitForTimeout(1000);
      
      const searchCalls = apiMonitor.getSearchApiCalls();
      const failedCalls = apiMonitor.getFailedCalls();
      
      // Should handle all search terms gracefully
      if (searchCalls.length > 0) {
        expect(failedCalls.length, `Should handle search term "${term}" without failures`).toBe(0);
        
        // Validate response for edge cases
        const responseCalls = searchCalls.filter(call => call.responseBody);
        for (const call of responseCalls) {
          expect(call.status, `Should return valid status for "${term}"`).toBeLessThan(400);
          
          // Empty search should return empty or all results
          if (term === '') {
            const body = call.responseBody;
            if (typeof body === 'object' && body.hasOwnProperty('architectures')) {
              expect(Array.isArray(body.architectures), 'Empty search should return valid structure').toBeTruthy();
            }
          }
        }
      }
    }
    
    console.log('Error Handling API Report:', apiMonitor.generateReport());
  });

  test('should monitor search API caching behavior', async ({ page }) => {
    const searchTerm = 'Tokyo Tower';
    
    // Perform the same search multiple times
    for (let i = 0; i < 3; i++) {
      await page.getByPlaceholder('検索').fill(searchTerm);
      await page.waitForTimeout(300);
      await page.getByRole('button', { name: /search/i }).click();
      await page.waitForTimeout(1000);
    }
    
    const searchCalls = apiMonitor.getSearchApiCalls();
    const uniqueUrls = new Set(searchCalls.map(call => call.url));
    
    console.log('Caching Behavior API Report:', apiMonitor.generateReport());
    
    // Analyze caching behavior
    if (searchCalls.length > 0) {
      // Check if subsequent calls are faster (indicating caching)
      const callsByUrl = new Map<string, ApiCall[]>();
      
      for (const call of searchCalls) {
        if (!callsByUrl.has(call.url)) {
          callsByUrl.set(call.url, []);
        }
        callsByUrl.get(call.url)!.push(call);
      }
      
      for (const [url, calls] of callsByUrl.entries()) {
        if (calls.length > 1) {
          const firstCall = calls[0];
          const subsequentCalls = calls.slice(1);
          
          // Log caching behavior
          console.log(`URL: ${url}`);
          console.log(`First call: ${firstCall.responseTime}ms`);
          console.log(`Subsequent calls: ${subsequentCalls.map(c => c.responseTime + 'ms').join(', ')}`);
          
          // Subsequent calls might be faster due to caching
          const avgSubsequentTime = subsequentCalls.reduce((sum, call) => sum + (call.responseTime || 0), 0) / subsequentCalls.length;
          
          if (firstCall.responseTime && avgSubsequentTime < firstCall.responseTime) {
            console.log('Caching appears to be working - subsequent calls are faster');
          }
        }
      }
    }
  });

  test.afterEach(async ({ page }) => {
    // Generate final API monitoring report
    const report = apiMonitor.generateReport();
    console.log('Final Search API Report:', report);
    
    // Log any critical issues
    const failedCalls = apiMonitor.getFailedCalls();
    const slowCalls = apiMonitor.getSlowCalls(5000);
    
    if (failedCalls.length > 0) {
      console.error('Critical API failures detected:', failedCalls);
    }
    
    if (slowCalls.length > 0) {
      console.warn('Performance issues detected:', slowCalls);
    }
  });
});