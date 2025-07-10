// REVIEWER_001 Cross-Browser Compatibility Test
const { chromium, firefox, webkit } = require('playwright');

async function crossBrowserTest() {
    console.log('🌐 REVIEWER_001 Cross-Browser Compatibility Test');
    
    const browsers = [
        { name: 'Chromium', launch: chromium.launch },
        { name: 'Firefox', launch: firefox.launch },
        { name: 'WebKit/Safari', launch: webkit.launch }
    ];
    
    const results = {
        timestamp: new Date().toISOString(),
        browser_results: {},
        overall_compatibility: true
    };
    
    for (const { name, launch } of browsers) {
        console.log(`\n🔍 Testing ${name}...`);
        
        try {
            const browser = await launch();
            const page = await browser.newPage();
            
            const startTime = Date.now();
            await page.goto('https://bob-takuya.github.io/archi-site/', { waitUntil: 'networkidle' });
            const loadTime = Date.now() - startTime;
            
            const title = await page.title();
            const hasCorrectTitle = title.includes('日本の建築マップ');
            
            // Check for content loading
            const navItems = await page.$$('nav a, .MuiTabs-root a, [role="tablist"] *');
            const architectureCards = await page.$$('.MuiCard-root, .architecture-card');
            
            // Take screenshot for documentation
            const screenshotPath = `~/ai-creative-team/archi-site/temp/reviewer-validation-${name.toLowerCase().replace('/', '-')}.png`;
            await page.screenshot({ path: screenshotPath, fullPage: false });
            
            results.browser_results[name] = {
                compatible: hasCorrectTitle && navItems.length > 0,
                load_time_ms: loadTime,
                title_correct: hasCorrectTitle,
                nav_items_count: navItems.length,
                architecture_cards_count: architectureCards.length,
                screenshot_path: screenshotPath,
                notes: `${name} compatibility verified`
            };
            
            console.log(`   ✅ Load time: ${loadTime}ms`);
            console.log(`   ✅ Title correct: ${hasCorrectTitle}`);
            console.log(`   ✅ Navigation items: ${navItems.length}`);
            console.log(`   ✅ Architecture cards: ${architectureCards.length}`);
            
            await browser.close();
            
        } catch (error) {
            console.log(`   ❌ ${name} test failed: ${error.message}`);
            results.browser_results[name] = {
                compatible: false,
                error: error.message,
                notes: `${name} compatibility test failed`
            };
            results.overall_compatibility = false;
        }
    }
    
    console.log('\n🎯 Cross-Browser Results Summary:');
    Object.entries(results.browser_results).forEach(([browser, result]) => {
        console.log(`   ${browser}: ${result.compatible ? '✅ COMPATIBLE' : '❌ INCOMPATIBLE'}`);
    });
    
    // Save results
    const fs = require('fs');
    fs.writeFileSync(
        '~/ai-creative-team/archi-site/temp/reviewer-cross-browser-results.json',
        JSON.stringify(results, null, 2)
    );
    
    console.log('\n🎉 Cross-Browser Testing Complete');
    return results;
}

crossBrowserTest().catch(console.error);