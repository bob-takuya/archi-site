#!/usr/bin/env node

const { chromium } = require('playwright');

async function testLocalDevelopment() {
    console.log('🧪 TESTING LOCAL DEVELOPMENT ENVIRONMENT');
    
    const localUrls = [
        'http://localhost:3001/archi-site/',
        'http://localhost:3001/',
        'http://localhost:5173/archi-site/',
        'http://localhost:5173/',
        'http://localhost:3000/archi-site/',
        'http://localhost:3000/'
    ];
    
    const browser = await chromium.launch({ headless: true });
    
    for (const url of localUrls) {
        try {
            console.log(`🔍 Trying: ${url}`);
            const page = await browser.newPage();
            
            // Set shorter timeout for local testing
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
            
            const title = await page.title();
            console.log(`✅ SUCCESS: ${url} - Title: "${title}"`);
            
            // Quick functional test
            const hasRoot = await page.$('#root') !== null;
            const hasNav = await page.$('nav') !== null;
            
            console.log(`   - React root: ${hasRoot ? '✅' : '❌'}`);
            console.log(`   - Navigation: ${hasNav ? '✅' : '❌'}`);
            
            if (hasRoot && hasNav) {
                console.log('🎉 Local development environment is FUNCTIONAL!');
                await page.close();
                await browser.close();
                return { success: true, url, title };
            }
            
            await page.close();
        } catch (error) {
            console.log(`❌ Failed: ${url} - ${error.message}`);
        }
    }
    
    await browser.close();
    console.log('⚠️ No working local development server found');
    return { success: false };
}

testLocalDevelopment().catch(console.error);