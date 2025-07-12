import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * TESTER Agent - English Search Functionality Test
 * 
 * Tests the architecture search functionality with English characters as requested:
 * 1. Search for "museum"
 * 2. Search for "Ando" 
 * 3. Search for "Tokyo"
 * 4. Try partial words like "mus"
 * 5. Try uppercase "MUSEUM"
 * 
 * Documents when it works/fails and identifies patterns.
 */

interface SearchTestResult {
  searchTerm: string;
  resultCount: number;
  hasResults: boolean;
  searchTime: number;
  status: string;
  findings: string[];
  screenshot?: string;
}

test.describe('English Search Functionality Testing', () => {
  const testResults: SearchTestResult[] = [];
  
  // Helper function to perform search and capture results
  const performSearch = async (page: any, searchTerm: string): Promise<SearchTestResult> => {
    const startTime = Date.now();
    const result: SearchTestResult = {
      searchTerm,
      resultCount: 0,
      hasResults: false,
      searchTime: 0,
      status: 'unknown',
      findings: []
    };

    try {
      console.log(`\n🔍 Testing search for: "${searchTerm}"`);
      
      // Navigate to architecture page
      await page.goto('/architecture');
      await page.waitForLoadState('networkidle');
      
      // Find search input (Japanese placeholder "検索")
      const searchInput = page.getByPlaceholder('検索');
      await expect(searchInput).toBeVisible();
      
      // Clear and enter search term
      await searchInput.clear();
      await searchInput.fill(searchTerm);
      
      // Submit search by pressing Enter
      await searchInput.press('Enter');
      
      // Wait for search to process
      await page.waitForTimeout(3000);
      
      // Count results
      const architectureItems = page.locator('[data-testid="architecture-item"]');
      result.resultCount = await architectureItems.count();
      result.hasResults = result.resultCount > 0;
      
      // Determine status
      if (result.hasResults) {
        result.status = 'SUCCESS';
        result.findings.push(`Found ${result.resultCount} matching architectures`);
        
        // Analyze first result content
        const firstResult = architectureItems.first();
        if (await firstResult.count() > 0) {
          const firstResultText = await firstResult.textContent() || '';
          result.findings.push(`First result: ${firstResultText.substring(0, 80)}...`);
          
          // Check if search term appears in the result
          const termInResult = firstResultText.toLowerCase().includes(searchTerm.toLowerCase());
          result.findings.push(`Search term "${searchTerm}" found in result: ${termInResult}`);
        }
      } else {
        // Check for explicit "no results" message
        const noResultsText = ['no results', '結果が見つかりません', '検索結果がありません'];
        let hasNoResultsMessage = false;
        
        for (const text of noResultsText) {
          const element = page.locator(`text=${text}`).first();
          if (await element.isVisible().catch(() => false)) {
            hasNoResultsMessage = true;
            break;
          }
        }
        
        if (hasNoResultsMessage) {
          result.status = 'NO_RESULTS_EXPLICIT';
          result.findings.push('Explicit "no results" message displayed');
        } else {
          result.status = 'NO_RESULTS_SILENT';
          result.findings.push('No results found, no explicit message');
        }
      }
      
      // Check current URL for search parameters
      const currentUrl = page.url();
      result.findings.push(`Search URL: ${currentUrl}`);
      
      // Verify search input retains the search term
      const inputValue = await searchInput.inputValue();
      result.findings.push(`Search input value: "${inputValue}"`);
      
      result.searchTime = Date.now() - startTime;
      
      // Take screenshot for documentation
      const screenshotDir = './test-results/screenshots';
      if (!fs.existsSync(screenshotDir)) {
        fs.mkdirSync(screenshotDir, { recursive: true });
      }
      
      const screenshotPath = `${screenshotDir}/search-${searchTerm.toLowerCase()}-${Date.now()}.png`;
      await page.screenshot({ 
        path: screenshotPath,
        fullPage: true 
      });
      result.screenshot = screenshotPath;
      
      console.log(`   Status: ${result.status}`);
      console.log(`   Results: ${result.resultCount}`);
      console.log(`   Time: ${result.searchTime}ms`);
      
    } catch (error) {
      result.status = 'ERROR';
      result.findings.push(`Error: ${error.message}`);
      console.log(`   Error: ${error.message}`);
    }
    
    testResults.push(result);
    return result;
  };

  test('1. Search for "museum" - English architectural term', async ({ page }) => {
    const result = await performSearch(page, 'museum');
    
    // Basic assertions
    expect(result.searchTime).toBeLessThan(10000);
    expect(result.status).not.toBe('ERROR');
    
    // Log findings for analysis
    console.log('🔍 Museum Search Analysis:');
    console.log('   Expected: Should find museums (博物館) if translation/romanization supported');
    console.log(`   Actual: ${result.status} with ${result.resultCount} results`);
    result.findings.forEach(finding => console.log(`   - ${finding}`));
  });

  test('2. Search for "Ando" - Architect name', async ({ page }) => {
    const result = await performSearch(page, 'Ando');
    
    expect(result.searchTime).toBeLessThan(10000);
    expect(result.status).not.toBe('ERROR');
    
    console.log('🔍 Ando Search Analysis:');
    console.log('   Expected: Should find Tadao Ando (安藤忠雄) works if romanized names indexed');
    console.log(`   Actual: ${result.status} with ${result.resultCount} results`);
    result.findings.forEach(finding => console.log(`   - ${finding}`));
  });

  test('3. Search for "Tokyo" - Location name', async ({ page }) => {
    const result = await performSearch(page, 'Tokyo');
    
    expect(result.searchTime).toBeLessThan(10000);
    expect(result.status).not.toBe('ERROR');
    
    console.log('🔍 Tokyo Search Analysis:');
    console.log('   Expected: Should find Tokyo buildings if English location names supported');
    console.log(`   Actual: ${result.status} with ${result.resultCount} results`);
    result.findings.forEach(finding => console.log(`   - ${finding}`));
  });

  test('4. Search for "mus" - Partial word matching', async ({ page }) => {
    const result = await performSearch(page, 'mus');
    
    expect(result.searchTime).toBeLessThan(10000);
    expect(result.status).not.toBe('ERROR');
    
    console.log('🔍 Partial Word "mus" Search Analysis:');
    console.log('   Expected: Should test substring/partial matching capabilities');
    console.log(`   Actual: ${result.status} with ${result.resultCount} results`);
    result.findings.forEach(finding => console.log(`   - ${finding}`));
  });

  test('5. Search for "MUSEUM" - Case sensitivity test', async ({ page }) => {
    const result = await performSearch(page, 'MUSEUM');
    
    expect(result.searchTime).toBeLessThan(10000);
    expect(result.status).not.toBe('ERROR');
    
    console.log('🔍 Uppercase "MUSEUM" Search Analysis:');
    console.log('   Expected: Should behave same as lowercase if case-insensitive');
    console.log(`   Actual: ${result.status} with ${result.resultCount} results`);
    result.findings.forEach(finding => console.log(`   - ${finding}`));
  });

  test.afterAll('Generate comprehensive analysis report', async () => {
    console.log('\n📊 COMPREHENSIVE ENGLISH SEARCH ANALYSIS REPORT');
    console.log('=================================================');
    
    // Pattern Analysis
    console.log('\n🔍 SEARCH PATTERNS IDENTIFIED:');
    
    // Success rate analysis
    const successfulSearches = testResults.filter(r => r.status === 'SUCCESS');
    const successRate = (successfulSearches.length / testResults.length) * 100;
    console.log(`\n1. SUCCESS RATE: ${successRate.toFixed(1)}% (${successfulSearches.length}/${testResults.length})`);
    
    if (successRate === 0) {
      console.log('   ❌ NO English search terms returned results');
      console.log('   💡 Indicates no English-Japanese translation layer');
    } else if (successRate < 50) {
      console.log('   ⚠️  LIMITED English search support');
    } else {
      console.log('   ✅ GOOD English search support detected');
    }
    
    // Case sensitivity analysis
    const museumLower = testResults.find(r => r.searchTerm === 'museum');
    const museumUpper = testResults.find(r => r.searchTerm === 'MUSEUM');
    if (museumLower && museumUpper) {
      const caseSensitive = museumLower.resultCount !== museumUpper.resultCount;
      console.log(`\n2. CASE SENSITIVITY: ${caseSensitive ? 'CASE SENSITIVE' : 'CASE INSENSITIVE'}`);
      console.log(`   - "museum": ${museumLower.resultCount} results`);
      console.log(`   - "MUSEUM": ${museumUpper.resultCount} results`);
    }
    
    // Partial matching analysis
    const partialSearch = testResults.find(r => r.searchTerm === 'mus');
    const fullSearch = testResults.find(r => r.searchTerm === 'museum');
    if (partialSearch && fullSearch) {
      console.log(`\n3. PARTIAL WORD MATCHING:`);
      console.log(`   - "mus": ${partialSearch.resultCount} results`);
      console.log(`   - "museum": ${fullSearch.resultCount} results`);
      
      if (partialSearch.resultCount > 0) {
        console.log('   ✅ Supports substring/partial matching');
      } else {
        console.log('   ❌ Requires complete words');
      }
    }
    
    // Content analysis
    console.log('\n4. CONTENT ANALYSIS:');
    const hasTermInResults = testResults.some(r => 
      r.findings.some(f => f.includes('found in result: true'))
    );
    
    if (hasTermInResults) {
      console.log('   ✅ Search terms found in result content');
    } else {
      console.log('   ❌ Search terms NOT found in result content');
      console.log('   💡 May indicate fuzzy matching or translation at work');
    }
    
    // Performance analysis
    const avgSearchTime = testResults.reduce((sum, r) => sum + r.searchTime, 0) / testResults.length;
    console.log(`\n5. PERFORMANCE: Average search time ${avgSearchTime.toFixed(0)}ms`);
    
    // Recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    
    if (successRate === 0) {
      console.log('   1. Implement English-Japanese term mapping (museum → 博物館)');
      console.log('   2. Add romanized architect names to search index');
      console.log('   3. Include English location names (Tokyo → 東京)');
      console.log('   4. Consider search suggestions to guide users to Japanese terms');
    } else if (successRate < 100) {
      console.log('   1. Expand English term coverage for architectural vocabulary');
      console.log('   2. Improve partial word matching capabilities');
      console.log('   3. Add autocomplete suggestions for English terms');
    } else {
      console.log('   1. Excellent English search support detected!');
      console.log('   2. Consider adding more architectural terms for completeness');
    }
    
    // Save detailed results
    const reportPath = './test-results/english-search-analysis-report.json';
    const report = {
      timestamp: new Date().toISOString(),
      testSuite: 'English Search Functionality Analysis',
      summary: {
        totalTests: testResults.length,
        successfulSearches: successfulSearches.length,
        successRate: successRate,
        averageSearchTime: avgSearchTime
      },
      patterns: {
        caseSensitive: museumLower && museumUpper ? 
          museumLower.resultCount !== museumUpper.resultCount : 'unknown',
        supportsPartialMatching: partialSearch ? partialSearch.resultCount > 0 : false,
        hasTermInResults: hasTermInResults
      },
      results: testResults
    };
    
    const reportDir = path.dirname(reportPath);
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n💾 Detailed report saved to: ${reportPath}`);
    
    console.log('\n✅ English search functionality analysis complete!');
  });
});