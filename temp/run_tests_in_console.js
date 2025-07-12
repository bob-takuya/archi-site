// COPY AND PASTE THIS ENTIRE SCRIPT INTO THE BROWSER CONSOLE
// Navigate to: https://bob-takuya.github.io/archi-site/#/architecture
// Open DevTools (F12) -> Console Tab -> Paste this script -> Press Enter

(function() {
    'use strict';
    
    console.log('%c🧪 JAPANESE SEARCH TESTER - STARTING AUTOMATED TESTS', 'color: blue; font-size: 16px; font-weight: bold;');
    console.log('Testing Japanese character search functionality...\n');
    
    // Test configuration
    const TESTS = [
        { name: 'Tadao Ando', query: '安藤忠雄', expected: 'architect results' },
        { name: 'Architecture', query: '建築', expected: 'general architecture' },
        { name: 'Tokyo', query: '東京', expected: 'Tokyo buildings' },
        { name: 'Mixed Language', query: '東京tower', expected: 'Tokyo Tower' },
        { name: 'Modern Architecture', query: '現代建築', expected: 'modern buildings' }
    ];
    
    let results = [];
    let errors = [];
    let testIndex = 0;
    
    // Error capture
    const originalError = console.error;
    console.error = function(...args) {
        errors.push({
            time: new Date().toISOString(),
            message: args.join(' ')
        });
        originalError.apply(console, args);
    };
    
    // Find search input
    function findSearchInput() {
        const selectors = [
            'input[type="search"]',
            'input[placeholder*="search"]', 
            'input[placeholder*="Search"]',
            'input[placeholder*="検索"]',
            '.search-input',
            '#search',
            '#searchInput',
            '[data-search]',
            'input[name="search"]',
            '.search-box input',
            '.search-field',
            'input.form-control'
        ];
        
        for (let selector of selectors) {
            const element = document.querySelector(selector);
            if (element) {
                console.log(`✅ Found search input: ${selector}`);
                return element;
            }
        }
        
        console.error('❌ Search input field not found! Checked selectors:', selectors);
        return null;
    }
    
    // Count results
    function countResults() {
        const selectors = [
            '.search-result',
            '.result-item', 
            '.architecture-item',
            '.architect-item',
            '.building-card',
            '.card',
            '.list-item',
            '[data-result]',
            '.grid-item',
            '.search-results > *'
        ];
        
        for (let selector of selectors) {
            const results = document.querySelectorAll(selector);
            if (results.length > 0) {
                return results.length;
            }
        }
        
        // Check for no results message
        const noResultSelectors = [
            '.no-results',
            '.empty-state',
            '.no-matches',
            '[data-no-results]'
        ];
        
        for (let selector of noResultSelectors) {
            if (document.querySelector(selector)) {
                return 0;
            }
        }
        
        return 'unknown';
    }
    
    // Check character display
    function checkCharacterDisplay(query) {
        const pageText = document.body.textContent || '';
        const searchInput = findSearchInput();
        const inputValue = searchInput ? searchInput.value : '';
        
        return {
            queryInPage: pageText.includes(query),
            queryInInput: inputValue === query,
            hasMojibake: /[���������]/.test(pageText),
            inputCorrect: inputValue === query
        };
    }
    
    // Execute single test
    async function executeTest(test) {
        console.log(`\n🧪 Test ${testIndex + 1}/${TESTS.length}: ${test.name}`);
        console.log(`Query: "${test.query}"`);
        
        const searchInput = findSearchInput();
        if (!searchInput) {
            return {
                ...test,
                success: false,
                error: 'Search input not found',
                timestamp: new Date().toISOString()
            };
        }
        
        const startTime = performance.now();
        const errorsBefore = errors.length;
        
        try {
            // Clear and input new text
            searchInput.value = '';
            searchInput.focus();
            
            // Type the Japanese characters
            searchInput.value = test.query;
            
            // Trigger events
            ['input', 'change', 'keyup'].forEach(eventType => {
                searchInput.dispatchEvent(new Event(eventType, { bubbles: true }));
            });
            
            // Try Enter key
            searchInput.dispatchEvent(new KeyboardEvent('keydown', { 
                key: 'Enter', 
                code: 'Enter',
                bubbles: true 
            }));
            
            // Look for and click search button
            const searchButtons = [
                'button[type="submit"]',
                '.search-button',
                '.search-btn',
                '[data-search-button]',
                'button:contains("Search")',
                'button:contains("検索")'
            ];
            
            for (let btnSelector of searchButtons) {
                const btn = document.querySelector(btnSelector);
                if (btn) {
                    btn.click();
                    console.log(`🔍 Clicked search button: ${btnSelector}`);
                    break;
                }
            }
            
            // Wait for results
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            const endTime = performance.now();
            const responseTime = Math.round(endTime - startTime);
            const newErrors = errors.length - errorsBefore;
            const resultCount = countResults();
            const charDisplay = checkCharacterDisplay(test.query);
            
            const result = {
                ...test,
                success: newErrors === 0 && charDisplay.inputCorrect,
                responseTime,
                resultCount,
                newErrors,
                characterDisplay: charDisplay,
                timestamp: new Date().toISOString()
            };
            
            // Log result
            if (result.success) {
                console.log(`✅ SUCCESS - Response: ${responseTime}ms, Results: ${resultCount}`);
            } else {
                console.log(`❌ FAILED - Errors: ${newErrors}, Input: ${charDisplay.inputCorrect}`);
            }
            
            return result;
            
        } catch (error) {
            console.error(`❌ Test execution failed: ${error.message}`);
            return {
                ...test,
                success: false,
                error: error.message,
                responseTime: Math.round(performance.now() - startTime),
                timestamp: new Date().toISOString()
            };
        }
    }
    
    // Run all tests
    async function runAllTests() {
        console.log(`🚀 Starting ${TESTS.length} Japanese search tests...\n`);
        
        for (let test of TESTS) {
            const result = await executeTest(test);
            results.push(result);
            testIndex++;
            
            // Small delay between tests
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // Generate final report
        generateReport();
    }
    
    // Generate comprehensive report
    function generateReport() {
        console.log('\n' + '='.repeat(60));
        console.log('%c📊 JAPANESE SEARCH TEST REPORT', 'color: green; font-size: 18px; font-weight: bold;');
        console.log('='.repeat(60));
        
        const successful = results.filter(r => r.success).length;
        const total = results.length;
        const successRate = Math.round((successful / total) * 100);
        
        console.log(`\n📈 OVERALL RESULTS:`);
        console.log(`   Success Rate: ${successful}/${total} (${successRate}%)`);
        console.log(`   Total Errors: ${errors.length}`);
        console.log(`   Average Response Time: ${Math.round(results.reduce((sum, r) => sum + (r.responseTime || 0), 0) / results.length)}ms`);
        
        console.log(`\n📋 DETAILED RESULTS:`);
        results.forEach((result, index) => {
            const status = result.success ? '✅' : '❌';
            const timing = result.responseTime ? `${result.responseTime}ms` : 'N/A';
            const count = result.resultCount !== undefined ? result.resultCount : 'N/A';
            
            console.log(`   ${status} ${index + 1}. ${result.name}`);
            console.log(`      Query: "${result.query}"`);
            console.log(`      Results: ${count} | Time: ${timing}`);
            if (result.error) {
                console.log(`      Error: ${result.error}`);
            }
            if (result.characterDisplay && !result.characterDisplay.inputCorrect) {
                console.log(`      ⚠️ Character input issue detected`);
            }
        });
        
        if (errors.length > 0) {
            console.log(`\n🚨 CONSOLE ERRORS CAPTURED:`);
            errors.forEach((error, index) => {
                console.log(`   ${index + 1}. ${error.time}: ${error.message}`);
            });
        }
        
        // Export data
        const exportData = {
            summary: {
                totalTests: total,
                successfulTests: successful,
                successRate: successRate,
                totalErrors: errors.length,
                testDate: new Date().toISOString(),
                userAgent: navigator.userAgent
            },
            testResults: results,
            capturedErrors: errors
        };
        
        console.log(`\n📤 EXPORT DATA (Copy for reporting):`);
        console.log(JSON.stringify(exportData, null, 2));
        
        // Summary recommendations
        console.log(`\n💡 RECOMMENDATIONS:`);
        if (successRate >= 80) {
            console.log(`   ✅ Japanese search functionality is working well`);
        } else if (successRate >= 60) {
            console.log(`   ⚠️ Japanese search has some issues that should be addressed`);
        } else {
            console.log(`   ❌ Japanese search functionality needs immediate attention`);
        }
        
        if (errors.length > 0) {
            console.log(`   🔧 Debug console errors related to Japanese character handling`);
        }
        
        const avgResponseTime = results.reduce((sum, r) => sum + (r.responseTime || 0), 0) / results.length;
        if (avgResponseTime > 2000) {
            console.log(`   ⏱️ Search performance is slow (avg ${Math.round(avgResponseTime)}ms)`);
        }
    }
    
    // Start testing
    runAllTests().catch(error => {
        console.error('❌ Testing failed:', error);
    });
    
})();

// END OF SCRIPT - PASTE EVERYTHING ABOVE INTO CONSOLE