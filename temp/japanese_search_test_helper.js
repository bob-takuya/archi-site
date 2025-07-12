/**
 * Japanese Search Test Helper Script
 * Run this in the browser console while on the architecture site
 * to help automate testing and capture detailed error information
 */

// Test helper functions
window.JapaneseSearchTester = {
    testResults: [],
    originalConsoleError: console.error,
    originalConsoleWarn: console.warn,
    errors: [],
    warnings: [],

    // Initialize error capture
    init: function() {
        console.log('🧪 Japanese Search Tester initialized');
        
        // Capture console errors
        console.error = (...args) => {
            this.errors.push({
                timestamp: new Date().toISOString(),
                type: 'error',
                message: args.join(' ')
            });
            this.originalConsoleError.apply(console, args);
        };

        // Capture console warnings
        console.warn = (...args) => {
            this.warnings.push({
                timestamp: new Date().toISOString(),
                type: 'warning', 
                message: args.join(' ')
            });
            this.originalConsoleWarn.apply(console, args);
        };

        console.log('✅ Error capture enabled');
    },

    // Test cases with Japanese characters
    testCases: [
        { name: 'Tadao Ando', query: '安藤忠雄', description: 'Famous Japanese architect' },
        { name: 'Architecture', query: '建築', description: 'General architecture term' },
        { name: 'Tokyo', query: '東京', description: 'Tokyo location search' },
        { name: 'Mixed Language', query: '東京tower', description: 'Mixed Japanese/English' },
        { name: 'Modern Architecture', query: '現代建築', description: 'Modern architecture term' }
    ],

    // Find search input field
    findSearchInput: function() {
        const selectors = [
            'input[type="search"]',
            'input[placeholder*="search"]',
            'input[placeholder*="検索"]',
            '.search-input',
            '#search',
            '[data-search]',
            'input[name="search"]'
        ];

        for (let selector of selectors) {
            const element = document.querySelector(selector);
            if (element) {
                console.log(`🔍 Found search input: ${selector}`);
                return element;
            }
        }
        
        console.error('❌ Could not find search input field');
        return null;
    },

    // Execute a single search test
    executeSearch: async function(testCase) {
        console.log(`\n🧪 Testing: ${testCase.name} (${testCase.query})`);
        
        const searchInput = this.findSearchInput();
        if (!searchInput) {
            return { success: false, error: 'Search input not found' };
        }

        const startTime = performance.now();
        const errorsBefore = this.errors.length;

        try {
            // Clear existing search
            searchInput.value = '';
            searchInput.dispatchEvent(new Event('input', { bubbles: true }));
            
            // Wait a bit for clearing
            await this.wait(100);

            // Input Japanese text
            searchInput.value = testCase.query;
            searchInput.dispatchEvent(new Event('input', { bubbles: true }));
            
            // Trigger search (try multiple methods)
            searchInput.dispatchEvent(new KeyboardEvent('keypress', { key: 'Enter', bubbles: true }));
            searchInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
            
            // Check for search button
            const searchButton = document.querySelector('button[type="submit"], .search-button, [data-search-button]');
            if (searchButton) {
                searchButton.click();
            }

            // Wait for results
            await this.wait(2000);
            
            const endTime = performance.now();
            const responseTime = endTime - startTime;
            const errorsAfter = this.errors.length;
            const newErrors = errorsAfter - errorsBefore;

            // Try to count results
            const resultCount = this.countSearchResults();
            
            const result = {
                testCase: testCase.name,
                query: testCase.query,
                success: newErrors === 0,
                responseTime: Math.round(responseTime),
                resultCount: resultCount,
                newErrors: newErrors,
                characterDisplayOk: this.checkCharacterDisplay(testCase.query)
            };

            this.testResults.push(result);
            console.log(`✅ Test completed:`, result);
            return result;

        } catch (error) {
            const failResult = {
                testCase: testCase.name,
                query: testCase.query,
                success: false,
                error: error.message,
                responseTime: performance.now() - startTime
            };
            
            this.testResults.push(failResult);
            console.error(`❌ Test failed:`, failResult);
            return failResult;
        }
    },

    // Count search results
    countSearchResults: function() {
        const resultSelectors = [
            '.search-result',
            '.result-item',
            '.architecture-item',
            '.architect-item',
            '[data-result]',
            '.card',
            '.list-item'
        ];

        for (let selector of resultSelectors) {
            const results = document.querySelectorAll(selector);
            if (results.length > 0) {
                console.log(`📊 Found ${results.length} results using selector: ${selector}`);
                return results.length;
            }
        }

        // Look for "no results" indicators
        const noResultSelectors = [
            '.no-results',
            '.empty-state',
            '[data-no-results]'
        ];

        for (let selector of noResultSelectors) {
            if (document.querySelector(selector)) {
                console.log(`📊 No results indicator found: ${selector}`);
                return 0;
            }
        }

        console.warn('⚠️ Could not determine result count');
        return 'unknown';
    },

    // Check if Japanese characters display correctly
    checkCharacterDisplay: function(originalQuery) {
        const pageText = document.body.textContent;
        const containsOriginal = pageText.includes(originalQuery);
        const containsMojibake = /[���������]/.test(pageText);
        
        return {
            containsOriginalQuery: containsOriginal,
            hasMojibake: containsMojibake,
            status: containsOriginal && !containsMojibake ? 'good' : 'issue'
        };
    },

    // Test rapid input
    testRapidInput: async function() {
        console.log('\n🚀 Testing rapid Japanese input...');
        
        const rapidTests = ['安藤', '建築', '東京', '現代', '伝統'];
        const searchInput = this.findSearchInput();
        
        if (!searchInput) {
            console.error('❌ Cannot test rapid input - search field not found');
            return;
        }

        const startTime = performance.now();
        
        for (let query of rapidTests) {
            searchInput.value = query;
            searchInput.dispatchEvent(new Event('input', { bubbles: true }));
            await this.wait(100); // Very fast input
        }
        
        const endTime = performance.now();
        console.log(`✅ Rapid input test completed in ${Math.round(endTime - startTime)}ms`);
    },

    // Run all tests
    runAllTests: async function() {
        console.log('🚀 Starting comprehensive Japanese search tests...\n');
        
        this.init();
        
        // Run individual test cases
        for (let testCase of this.testCases) {
            await this.executeSearch(testCase);
            await this.wait(1000); // Wait between tests
        }
        
        // Run rapid input test
        await this.testRapidInput();
        
        // Generate report
        this.generateReport();
    },

    // Generate test report
    generateReport: function() {
        console.log('\n📊 JAPANESE SEARCH TEST REPORT');
        console.log('=====================================');
        
        const successfulTests = this.testResults.filter(r => r.success).length;
        const totalTests = this.testResults.length;
        
        console.log(`Overall Success Rate: ${successfulTests}/${totalTests} (${Math.round(successfulTests/totalTests*100)}%)`);
        console.log(`Total Errors Captured: ${this.errors.length}`);
        console.log(`Total Warnings Captured: ${this.warnings.length}`);
        
        console.log('\nIndividual Test Results:');
        this.testResults.forEach(result => {
            const status = result.success ? '✅' : '❌';
            console.log(`${status} ${result.testCase}: ${result.query} (${result.responseTime}ms, ${result.resultCount} results)`);
        });
        
        if (this.errors.length > 0) {
            console.log('\n🚨 ERRORS DETECTED:');
            this.errors.forEach(error => {
                console.log(`  ${error.timestamp}: ${error.message}`);
            });
        }
        
        if (this.warnings.length > 0) {
            console.log('\n⚠️ WARNINGS:');
            this.warnings.forEach(warning => {
                console.log(`  ${warning.timestamp}: ${warning.message}`);
            });
        }
        
        // Export results for copy-paste
        const exportData = {
            testResults: this.testResults,
            errors: this.errors,
            warnings: this.warnings,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString()
        };
        
        console.log('\n📋 Copy this data for reporting:');
        console.log(JSON.stringify(exportData, null, 2));
    },

    // Utility function to wait
    wait: function(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};

// Instructions for manual execution
console.log(`
🧪 Japanese Search Test Helper Loaded!

Usage:
1. Run all tests: JapaneseSearchTester.runAllTests()
2. Single test: JapaneseSearchTester.executeSearch({name: 'test', query: '安藤忠雄'})
3. Rapid input test: JapaneseSearchTester.testRapidInput()
4. Generate report: JapaneseSearchTester.generateReport()

The script will automatically capture console errors and test Japanese character handling.
`);