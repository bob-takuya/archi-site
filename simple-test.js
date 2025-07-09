const { chromium } = require('playwright');

async function simpleTest() {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    // Capture console messages to see what's happening
    page.on('console', msg => {
        const text = msg.text();
        if (text.includes('チャンク') || text.includes('直接') || text.includes('SQLite') || 
            text.includes('データベース') || text.includes('成功') || text.includes('ERROR') ||
            text.includes('sql.js')) {
            console.log(`🔍 Console: ${text}`);
        }
    });
    
    try {
        console.log('🚀 Testing chunked/fallback database loading...');
        await page.goto('http://localhost:3000/archi-site/');
        
        // Wait up to 5 minutes for database to load
        console.log('⏳ Waiting for database to initialize (up to 5 minutes)...');
        
        await page.waitForFunction(() => {
            const bodyText = document.body.innerText;
            
            // Check for real data indicators
            const hasRealData = [
                /建築家：[^不明]/,
                /\d{4}年/,
                /東京|大阪|京都|名古屋/,
                /安藤忠雄|丹下健三|隈研吾/
            ].some(pattern => pattern.test(bodyText));
            
            // Also check for architecture cards
            const hasCards = document.querySelector('[data-testid="architecture-card"]') !== null;
            
            return hasRealData || hasCards;
        }, { timeout: 300000 }); // 5 minutes
        
        console.log('✅ Database loaded successfully!');
        
        // Check what kind of data we have
        const bodyText = await page.textContent('body');
        console.log('\n📊 Sample data found:');
        console.log(bodyText.substring(0, 500) + '...');
        
        // Count architecture cards
        const cardCount = await page.locator('[data-testid="architecture-card"]').count();
        console.log(`🏢 Architecture cards found: ${cardCount}`);
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        
        // Get current page state
        const bodyText = await page.textContent('body');
        console.log('\n📋 Current page state:');
        console.log(bodyText.substring(0, 200) + '...');
    } finally {
        await browser.close();
    }
}

simpleTest();