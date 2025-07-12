const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

/**
 * TESTER Agent - Live English Search E2E Test
 * 
 * This test actually executes the English search terms against the live website
 * and documents the real behavior patterns.
 */

const TEST_RESULTS_FILE = './test-results/live-english-search-results.json';
const SCREENSHOT_DIR = './test-results/screenshots';

// Ensure test directories exist
test.beforeAll(async () => {
  const dirs = [
    path.dirname(TEST_RESULTS_FILE),
    SCREENSHOT_DIR
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
});

test.describe('English Search Functionality - Live Testing', () => {
  let testResults = {
    testSuite: 'Live English Search E2E Testing',
    timestamp: new Date().toISOString(),
    results: [],
    patterns: [],
    summary: {
      totalTests: 0,
      successful: 0,
      noResults: 0,
      errors: 0
    }
  };

  test.afterAll(async () => {
    // Analyze patterns and save results
    analyzeSearchPatterns();
    fs.writeFileSync(TEST_RESULTS_FILE, JSON.stringify(testResults, null, 2));
    console.log(`Test results saved to: ${TEST_RESULTS_FILE}`);
  });

  // Helper function to perform search and analyze results
  const performSearch = async (page, searchTerm, testId, description) => {
    const result = {
      id: testId,
      searchTerm,
      description,
      timestamp: new Date().toISOString(),
      status: 'unknown',
      resultCount: 0,
      hasResults: false,
      searchTime: 0,
      findings: [],
      errors: [],
      screenshot: null
    };

    try {
      const startTime = Date.now();
      
      // Go to architecture page
      await page.goto('/architecture');
      await page.waitForLoadState('networkidle');
      
      // Find and clear search input
      const searchInput = page.getByPlaceholder('検索');
      await searchInput.clear();
      
      // Type search term
      await searchInput.fill(searchTerm);
      
      // Trigger search (try both enter key and search button)
      await searchInput.press('Enter');
      
      // Wait for search results to load
      await page.waitForTimeout(2000); // Allow search to process
      
      // Check for architecture items
      const architectureItems = page.locator('[data-testid="architecture-item"]');
      result.resultCount = await architectureItems.count();
      result.hasResults = result.resultCount > 0;
      
      // Check for no results message
      const noResultsMessage = page.locator('text=no results', { timeout: 1000 }).first();
      const hasNoResultsMessage = await noResultsMessage.isVisible().catch(() => false);
      
      // Analyze search behavior
      if (result.hasResults) {
        result.status = 'found_results';
        result.findings.push(`Found ${result.resultCount} architecture items`);
        
        // Analyze first few results
        const firstItems = await architectureItems.first().count() > 0 ? 
          await architectureItems.first().textContent() : '';
        if (firstItems) {
          result.findings.push(`First result contains: ${firstItems.substring(0, 100)}...`);
        }
        
        // Check if search term appears in results
        const pageContent = await page.textContent('body');
        const searchTermInResults = pageContent.toLowerCase().includes(searchTerm.toLowerCase());
        result.findings.push(`Search term "${searchTerm}" appears in results: ${searchTermInResults}`);
        
      } else if (hasNoResultsMessage) {
        result.status = 'no_results_explicit';
        result.findings.push('Explicit "no results" message displayed');
      } else {
        result.status = 'no_results_implicit';
        result.findings.push('No results found, no explicit message');
      }
      
      result.searchTime = Date.now() - startTime;
      
      // Take screenshot
      const screenshotPath = `${SCREENSHOT_DIR}/search-${testId}-${Date.now()}.png`;
      await page.screenshot({ 
        path: screenshotPath,
        fullPage: true 
      });
      result.screenshot = screenshotPath;
      
      // Check search URL and parameters
      const currentUrl = page.url();
      result.findings.push(`Search URL: ${currentUrl}`);
      
      // Log search input value
      const inputValue = await searchInput.inputValue();
      result.findings.push(`Search input value after search: "${inputValue}"`);
      
    } catch (error) {
      result.status = 'error';
      result.errors.push(error.message);
    }
    
    testResults.results.push(result);
    testResults.summary.totalTests++;
    
    if (result.status === 'found_results') {
      testResults.summary.successful++;
    } else if (result.status.includes('no_results')) {
      testResults.summary.noResults++;
    } else {
      testResults.summary.errors++;
    }
    
    return result;
  };

  test('Search for "museum" - lowercase English term', async ({ page }) => {
    const result = await performSearch(page, 'museum', 'museum_lowercase', 
      'Testing search for museum in English - should find 博物館 if translation works');
    
    // Additional assertions
    expect(result.searchTime).toBeLessThan(10000); // Should complete within 10s
    expect(result.errors).toHaveLength(0);
    
    console.log(`Museum search: ${result.status}, ${result.resultCount} results`);
  });

  test('Search for "Ando" - architect name', async ({ page }) => {
    const result = await performSearch(page, 'Ando', 'ando_architect',
      'Testing search for Ando - should find 安藤忠雄 works if romanized names are indexed');
    
    expect(result.searchTime).toBeLessThan(10000);
    expect(result.errors).toHaveLength(0);
    
    console.log(`Ando search: ${result.status}, ${result.resultCount} results`);
  });

  test('Search for "Tokyo" - location name', async ({ page }) => {
    const result = await performSearch(page, 'Tokyo', 'tokyo_location',
      'Testing search for Tokyo - should find 東京 buildings if English location names supported');
    
    expect(result.searchTime).toBeLessThan(10000);
    expect(result.errors).toHaveLength(0);
    
    console.log(`Tokyo search: ${result.status}, ${result.resultCount} results`);
  });

  test('Search for "mus" - partial word', async ({ page }) => {
    const result = await performSearch(page, 'mus', 'partial_mus',
      'Testing partial word search - should test substring matching behavior');
    
    expect(result.searchTime).toBeLessThan(10000);
    expect(result.errors).toHaveLength(0);
    
    console.log(`Partial "mus" search: ${result.status}, ${result.resultCount} results`);
  });

  test('Search for "MUSEUM" - uppercase test', async ({ page }) => {
    const result = await performSearch(page, 'MUSEUM', 'museum_uppercase',
      'Testing case sensitivity - should work same as lowercase if case-insensitive');
    
    expect(result.searchTime).toBeLessThan(10000);
    expect(result.errors).toHaveLength(0);
    
    console.log(`Uppercase MUSEUM search: ${result.status}, ${result.resultCount} results`);
  });

  // Pattern analysis function
  const analyzeSearchPatterns = () => {
    const patterns = [];
    
    // Analyze success rates
    const successRate = testResults.summary.successful / testResults.summary.totalTests;
    patterns.push({
      pattern: 'English Search Success Rate',
      value: `${(successRate * 100).toFixed(1)}%`,
      analysis: successRate > 0.5 ? 'Good English search support' : 'Limited English search support'
    });
    
    // Analyze case sensitivity
    const museumLower = testResults.results.find(r => r.id === 'museum_lowercase');
    const museumUpper = testResults.results.find(r => r.id === 'museum_uppercase');
    if (museumLower && museumUpper) {
      const caseSensitive = museumLower.resultCount !== museumUpper.resultCount;
      patterns.push({
        pattern: 'Case Sensitivity',
        value: caseSensitive ? 'Case Sensitive' : 'Case Insensitive',
        analysis: caseSensitive ? 'Search is case sensitive' : 'Search handles case properly'
      });
    }
    
    // Analyze partial matching
    const partialSearch = testResults.results.find(r => r.id === 'partial_mus');
    if (partialSearch) {
      patterns.push({
        pattern: 'Partial Word Matching',
        value: partialSearch.hasResults ? 'Supported' : 'Not Supported',
        analysis: partialSearch.hasResults ? 'Supports substring search' : 'Requires complete words'
      });
    }
    
    // Analyze translation capability
    const englishTerms = testResults.results.filter(r => r.searchTerm.match(/^[a-zA-Z]+$/));
    const translationWorking = englishTerms.some(r => r.hasResults);
    patterns.push({
      pattern: 'English-Japanese Translation',
      value: translationWorking ? 'Working' : 'Not Working',
      analysis: translationWorking ? 'Some English terms find Japanese content' : 'No translation layer detected'
    });
    
    testResults.patterns = patterns;
  };
});