const { chromium } = require('playwright');

async function testChunkedLoading() {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    // Capture all console messages
    page.on('console', msg => {
        console.log(`🔍 Console: ${msg.text()}`);
    });
    
    // Capture all network requests
    page.on('request', request => {
        const url = request.url();
        if (url.includes('sqlite') || url.includes('wasm') || url.includes('worker') || url.includes('.json')) {
            console.log(`📡 Request: ${request.method()} ${url}`);
        }
    });
    
    try {
        console.log('🚀 Navigating to debug page...');
        await page.goto('http://localhost:3000/archi-site/debug-chunked-loading.html');
        
        // Wait for the debug to complete
        await page.waitForTimeout(30000);
        
        const logs = await page.locator('#logs .log').allTextContents();
        console.log('\n📊 Debug page results:');
        logs.forEach(log => console.log(log));
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await browser.close();
    }
}

testChunkedLoading();