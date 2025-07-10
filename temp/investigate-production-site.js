#!/usr/bin/env node

const { chromium } = require('playwright');

async function investigateProductionSite() {
    console.log('🔍 INVESTIGATING PRODUCTION SITE STRUCTURE');
    
    const browser = await chromium.launch({ headless: true }); // Use headless for CI environment
    const page = await browser.newPage();
    
    try {
        console.log('📡 Navigating to production site...');
        await page.goto('https://bob-takuya.github.io/archi-site/', { 
            waitUntil: 'networkidle', 
            timeout: 60000 
        });
        
        // Take screenshot
        await page.screenshot({ path: 'temp/production-site-investigation.png', fullPage: true });
        console.log('📸 Screenshot saved: production-site-investigation.png');
        
        // Get page title
        const title = await page.title();
        console.log(`📄 Page Title: "${title}"`);
        
        // Get page content
        const content = await page.content();
        console.log(`📐 Content Length: ${content.length} characters`);
        
        // Check for React app mounting
        const reactRoot = await page.$('#root, #app, .app');
        console.log(`⚛️ React Root Element: ${reactRoot ? 'Found' : 'Not Found'}`);
        
        // Check for any loading states
        const loadingElements = await page.$$('[data-testid*="loading"], .loading, .spinner');
        console.log(`⏳ Loading Elements: ${loadingElements.length}`);
        
        // Check what's actually in the body
        const bodyHTML = await page.$eval('body', el => el.innerHTML);
        console.log(`🏗️ Body Content Preview: ${bodyHTML.substring(0, 500)}...`);
        
        // Look for any visible text content
        const visibleText = await page.evaluate(() => {
            const walker = document.createTreeWalker(
                document.body,
                NodeFilter.SHOW_TEXT,
                null,
                false
            );
            
            let text = '';
            let node;
            while (node = walker.nextNode()) {
                if (node.textContent.trim()) {
                    text += node.textContent.trim() + ' ';
                }
            }
            return text.substring(0, 1000);
        });
        console.log(`📝 Visible Text: "${visibleText}"`);
        
        // Wait and check if any content loads dynamically
        console.log('⏰ Waiting 10 seconds for dynamic content...');
        await page.waitForTimeout(10000);
        
        // Take another screenshot
        await page.screenshot({ path: 'temp/production-site-after-wait.png', fullPage: true });
        console.log('📸 After-wait screenshot saved: production-site-after-wait.png');
        
        // Check for errors in console
        const consoleMessages = [];
        page.on('console', msg => {
            consoleMessages.push(`${msg.type()}: ${msg.text()}`);
        });
        
        await page.reload();
        await page.waitForTimeout(5000);
        
        console.log('🐛 Console Messages:');
        consoleMessages.forEach(msg => console.log(`   ${msg}`));
        
        // Check network requests
        const responses = [];
        page.on('response', response => {
            responses.push(`${response.status()} ${response.url()}`);
        });
        
        await page.reload();
        await page.waitForTimeout(3000);
        
        console.log('🌐 Network Responses:');
        responses.slice(0, 10).forEach(resp => console.log(`   ${resp}`));
        
        // Check for JavaScript errors
        const jsErrors = [];
        page.on('pageerror', error => {
            jsErrors.push(error.message);
        });
        
        await page.reload();
        await page.waitForTimeout(3000);
        
        if (jsErrors.length > 0) {
            console.log('⚠️ JavaScript Errors:');
            jsErrors.forEach(error => console.log(`   ${error}`));
        } else {
            console.log('✅ No JavaScript errors detected');
        }
        
    } catch (error) {
        console.error('💥 Investigation failed:', error.message);
    } finally {
        await browser.close();
    }
}

investigateProductionSite().catch(console.error);