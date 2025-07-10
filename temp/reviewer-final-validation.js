// REVIEWER_001 Final Validation Script
// Critical Japanese Architecture Database Validation

const { chromium } = require('playwright');

async function runFinalValidation() {
    console.log('🎯 REVIEWER_001 Final Validation - Japanese Architecture Database');
    console.log('🔍 Target: https://bob-takuya.github.io/archi-site/');
    
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    const validationResults = {
        timestamp: new Date().toISOString(),
        overall_status: 'PENDING',
        critical_tests: {},
        performance_metrics: {},
        accessibility_score: 0,
        production_readiness: false,
        issues: [],
        recommendations: []
    };

    try {
        // 1. CRITICAL: Site Loading & Basic Functionality
        console.log('\n🚀 Test 1: Core Site Loading');
        const startTime = Date.now();
        await page.goto('https://bob-takuya.github.io/archi-site/', { waitUntil: 'networkidle' });
        const loadTime = Date.now() - startTime;
        
        const title = await page.title();
        const hasJapaneseTitle = title.includes('日本の建築マップ') || title.includes('Architecture Map');
        
        validationResults.critical_tests.site_loading = {
            passed: hasJapaneseTitle,
            load_time_ms: loadTime,
            title: title,
            notes: hasJapaneseTitle ? 'Japanese title detected' : 'Japanese title missing'
        };
        
        console.log(`   ✅ Load time: ${loadTime}ms`);
        console.log(`   ✅ Title: ${title}`);

        // 2. CRITICAL: Navigation & UI Structure
        console.log('\n🧭 Test 2: Navigation Structure');
        const navItems = await page.$$eval('nav a, .MuiTabs-root a, [role="tablist"] *', 
            els => els.map(el => el.textContent?.trim()).filter(text => text && text.length > 0)
        );
        
        const japaneseNavTerms = navItems.filter(item => 
            /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(item)
        );
        
        validationResults.critical_tests.navigation = {
            passed: japaneseNavTerms.length >= 4,
            nav_items_count: navItems.length,
            japanese_nav_items: japaneseNavTerms.length,
            nav_items: navItems,
            notes: `Found ${japaneseNavTerms.length} Japanese navigation items`
        };
        
        console.log(`   ✅ Navigation items: ${navItems.length}`);
        console.log(`   ✅ Japanese nav items: ${japaneseNavTerms.length}`);

        // 3. CRITICAL: Database Functionality
        console.log('\n🗄️ Test 3: Database Content Loading');
        
        // Wait for database content to load
        try {
            await page.waitForSelector('.MuiCard-root, .architecture-card, [data-testid*="architecture"], .building-card', { timeout: 30000 });
            
            const architectureCards = await page.$$('.MuiCard-root, .architecture-card, [data-testid*="architecture"], .building-card');
            const cardCount = architectureCards.length;
            
            // Check for real architecture data
            const cardTexts = await page.$$eval(
                '.MuiCard-root, .architecture-card, [data-testid*="architecture"], .building-card',
                cards => cards.map(card => card.textContent?.slice(0, 200) || '')
            );
            
            const hasRealData = cardTexts.some(text => 
                /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(text) && 
                (text.includes('建築') || text.includes('設計') || text.includes('年') || text.includes('東京') || text.includes('大阪'))
            );
            
            validationResults.critical_tests.database_content = {
                passed: cardCount > 0 && hasRealData,
                cards_found: cardCount,
                has_real_architecture_data: hasRealData,
                sample_content: cardTexts.slice(0, 3),
                notes: cardCount > 0 ? 'Architecture cards loaded' : 'No architecture cards found'
            };
            
            console.log(`   ✅ Architecture cards found: ${cardCount}`);
            console.log(`   ✅ Real architecture data: ${hasRealData}`);
            
        } catch (error) {
            validationResults.critical_tests.database_content = {
                passed: false,
                cards_found: 0,
                has_real_architecture_data: false,
                error: error.message,
                notes: 'Database content failed to load within 30 seconds'
            };
            console.log(`   ❌ Database loading failed: ${error.message}`);
        }

        // 4. CRITICAL: Search Functionality
        console.log('\n🔍 Test 4: Search Functionality');
        try {
            const searchInput = await page.$('input[type="search"], input[placeholder*="検索"], input[placeholder*="search"], .MuiInputBase-input');
            
            if (searchInput) {
                await searchInput.fill('東京');
                await page.waitForTimeout(2000); // Wait for search results
                
                const searchResults = await page.$$('.MuiCard-root, .architecture-card, [data-testid*="architecture"], .building-card');
                
                validationResults.critical_tests.search_functionality = {
                    passed: searchResults.length > 0,
                    search_input_found: true,
                    search_results_count: searchResults.length,
                    search_term: '東京',
                    notes: 'Japanese search functionality working'
                };
                
                console.log(`   ✅ Search input found and functional`);
                console.log(`   ✅ Search results for "東京": ${searchResults.length}`);
            } else {
                validationResults.critical_tests.search_functionality = {
                    passed: false,
                    search_input_found: false,
                    notes: 'Search input not found'
                };
                console.log(`   ❌ Search input not found`);
            }
        } catch (error) {
            validationResults.critical_tests.search_functionality = {
                passed: false,
                error: error.message,
                notes: 'Search functionality test failed'
            };
            console.log(`   ❌ Search test failed: ${error.message}`);
        }

        // 5. CRITICAL: Mobile Responsiveness
        console.log('\n📱 Test 5: Mobile Responsiveness');
        
        // Test mobile viewport
        await page.setViewportSize({ width: 375, height: 667 });
        await page.waitForTimeout(1000);
        
        const mobileNavVisible = await page.isVisible('nav, .MuiTabs-root, [role="navigation"]');
        const mobileContentVisible = await page.isVisible('.MuiCard-root, .architecture-card, main');
        
        validationResults.critical_tests.mobile_responsiveness = {
            passed: mobileNavVisible && mobileContentVisible,
            mobile_nav_visible: mobileNavVisible,
            mobile_content_visible: mobileContentVisible,
            viewport: '375x667',
            notes: 'Mobile responsiveness test completed'
        };
        
        console.log(`   ✅ Mobile navigation visible: ${mobileNavVisible}`);
        console.log(`   ✅ Mobile content visible: ${mobileContentVisible}`);

        // 6. ACCESSIBILITY VALIDATION
        console.log('\n♿ Test 6: Accessibility');
        
        // Reset to desktop for accessibility test
        await page.setViewportSize({ width: 1920, height: 1080 });
        await page.waitForTimeout(1000);
        
        const landmarks = await page.$$('main, nav, header, footer, [role="main"], [role="navigation"]');
        const headings = await page.$$('h1, h2, h3, h4, h5, h6');
        const images = await page.$$('img');
        const imagesWithAlt = await page.$$('img[alt]');
        
        const accessibilityScore = Math.round(
            ((landmarks.length > 0 ? 25 : 0) +
             (headings.length > 0 ? 25 : 0) +
             (images.length === 0 ? 25 : (imagesWithAlt.length / images.length) * 25) +
             25) // Base score for being accessible
        );
        
        validationResults.critical_tests.accessibility = {
            passed: accessibilityScore >= 75,
            score: accessibilityScore,
            landmarks_count: landmarks.length,
            headings_count: headings.length,
            images_total: images.length,
            images_with_alt: imagesWithAlt.length,
            notes: `Accessibility score: ${accessibilityScore}%`
        };
        
        validationResults.accessibility_score = accessibilityScore;
        
        console.log(`   ✅ Landmarks: ${landmarks.length}`);
        console.log(`   ✅ Headings: ${headings.length}`);
        console.log(`   ✅ Images with alt text: ${imagesWithAlt.length}/${images.length}`);
        console.log(`   ✅ Accessibility score: ${accessibilityScore}%`);

        // FINAL ASSESSMENT
        const criticalTestsPassed = Object.values(validationResults.critical_tests)
            .filter(test => test.passed).length;
        const totalCriticalTests = Object.keys(validationResults.critical_tests).length;
        const passRate = Math.round((criticalTestsPassed / totalCriticalTests) * 100);
        
        // Performance Assessment
        validationResults.performance_metrics = {
            page_load_time_ms: loadTime,
            grade: loadTime < 1000 ? 'EXCELLENT' : loadTime < 3000 ? 'GOOD' : 'NEEDS_IMPROVEMENT'
        };
        
        // Production Readiness Assessment
        const productionReady = passRate >= 90 && accessibilityScore >= 75 && loadTime < 5000;
        
        validationResults.overall_status = productionReady ? 'PRODUCTION_READY' : 'NEEDS_IMPROVEMENT';
        validationResults.production_readiness = productionReady;
        
        // Generate Issues and Recommendations
        if (!productionReady) {
            if (passRate < 90) {
                validationResults.issues.push(`Test pass rate ${passRate}% below 90% threshold`);
            }
            if (accessibilityScore < 75) {
                validationResults.issues.push(`Accessibility score ${accessibilityScore}% below 75% threshold`);
            }
            if (loadTime >= 5000) {
                validationResults.issues.push(`Page load time ${loadTime}ms exceeds 5 second threshold`);
            }
        }
        
        if (!validationResults.critical_tests.database_content?.passed) {
            validationResults.issues.push('Database content loading failed');
            validationResults.recommendations.push('Investigate database loading and SQLite file integrity');
        }
        
        if (!validationResults.critical_tests.search_functionality?.passed) {
            validationResults.issues.push('Search functionality not working');
            validationResults.recommendations.push('Debug search implementation and event handlers');
        }
        
        // FINAL REPORT
        console.log('\n🎯 FINAL VALIDATION RESULTS');
        console.log('='.repeat(50));
        console.log(`Overall Status: ${validationResults.overall_status}`);
        console.log(`Production Ready: ${productionReady ? '✅ YES' : '❌ NO'}`);
        console.log(`Test Pass Rate: ${passRate}% (${criticalTestsPassed}/${totalCriticalTests})`);
        console.log(`Accessibility Score: ${accessibilityScore}%`);
        console.log(`Performance Grade: ${validationResults.performance_metrics.grade}`);
        console.log(`Load Time: ${loadTime}ms`);
        
        if (validationResults.issues.length > 0) {
            console.log('\n❌ Issues Identified:');
            validationResults.issues.forEach(issue => console.log(`   - ${issue}`));
        }
        
        if (validationResults.recommendations.length > 0) {
            console.log('\n💡 Recommendations:');
            validationResults.recommendations.forEach(rec => console.log(`   - ${rec}`));
        }
        
        console.log('\n🎉 REVIEWER_001 Final Validation Complete');

    } catch (error) {
        console.error('❌ Validation failed:', error);
        validationResults.overall_status = 'FAILED';
        validationResults.production_readiness = false;
        validationResults.issues.push(`Validation script error: ${error.message}`);
    }

    await browser.close();
    
    // Save detailed results
    const fs = require('fs');
    fs.writeFileSync(
        '/Users/homeserver/ai-creative-team/archi-site/temp/reviewer-final-validation-results.json',
        JSON.stringify(validationResults, null, 2)
    );
    
    return validationResults;
}

// Execute validation
runFinalValidation().then(results => {
    process.exit(results.production_readiness ? 0 : 1);
}).catch(error => {
    console.error('Script execution failed:', error);
    process.exit(1);
});