// REVIEWER_001 Final Documentation Screenshot
const { chromium } = require('playwright');

async function takeFinalScreenshot() {
    console.log('📸 Taking final validation screenshot...');
    
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    await page.goto('https://bob-takuya.github.io/archi-site/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    await page.screenshot({ 
        path: '~/ai-creative-team/archi-site/temp/reviewer-final-validation-screenshot.png', 
        fullPage: true 
    });
    
    console.log('✅ Screenshot saved');
    await browser.close();
}

takeFinalScreenshot().catch(console.error);