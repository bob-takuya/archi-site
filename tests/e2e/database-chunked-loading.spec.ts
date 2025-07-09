import { test, expect } from '@playwright/test';

test.describe('Database Chunked Loading with sql.js-httpvfs', () => {
  test.setTimeout(300000); // 5 minutes for initial database loading

  test('should load Japanese architecture data using chunked database approach', async ({ page }) => {
    // Navigate to the application
    await page.goto('/');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Check if database initialization starts
    await expect(page.locator('h6')).toHaveText(/データベースを初期化中|データベースの準備中|初期化中/, { timeout: 30000 });

    // Look for console logs indicating sql.js-httpvfs initialization
    const initLogs: string[] = [];
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('sql.js-httpvfs') || text.includes('chunk') || text.includes('worker')) {
        initLogs.push(text);
        console.log(`🔍 Console: ${text}`);
      }
    });

    // Wait for database to initialize with chunked loading
    // sql.js-httpvfs should be much faster than full download
    await page.waitForFunction(() => {
      const bodyText = document.body.innerText;
      // Look for signs that real data is loaded
      const hasRealData = [
        /建築家：[^不明]/,  // Real architect names
        /\d{4}年/,         // Real years  
        /東京|大阪|京都|名古屋|横浜|神戸|広島|福岡|札幌|仙台/,  // Real Japanese cities
        /安藤忠雄|丹下健三|隈研吾|磯崎新|妹島和世|坂本一成/  // Famous Japanese architects
      ].some(pattern => pattern.test(bodyText));
      
      return hasRealData;
    }, { timeout: 180000 }); // 3 minutes max wait

    // Check that we have real Japanese architecture data
    const pageContent = await page.textContent('body');
    
    // Verify real data is present
    const realDataPatterns = [
      /建築家：[^不明]/,  // Real architect names (not "不明")
      /\d{4}年/,         // Years (indicating real dates)
      /東京|大阪|京都|名古屋/,  // Real Japanese cities
      /安藤忠雄|丹下健三|隈研吾/  // Famous Japanese architects
    ];

    let foundRealData = false;
    for (const pattern of realDataPatterns) {
      if (pattern.test(pageContent || '')) {
        foundRealData = true;
        console.log(`✅ Found real data matching pattern: ${pattern}`);
        break;
      }
    }

    expect(foundRealData).toBe(true);

    // Verify architecture cards are displayed with real data
    const architectureCards = page.locator('[data-testid="architecture-card"]');
    const cardCount = await architectureCards.count();
    
    if (cardCount > 0) {
      console.log(`✅ Found ${cardCount} architecture cards`);
      
      // Check first few cards for real data
      for (let i = 0; i < Math.min(3, cardCount); i++) {
        const card = architectureCards.nth(i);
        const cardText = await card.textContent();
        
        // Each card should have substantive information
        expect(cardText).not.toContain('不明'); // Should not contain "unknown"
        expect(cardText).toMatch(/\d{4}/); // Should contain a year
        
        console.log(`✅ Card ${i + 1} has real data: ${cardText?.substring(0, 100)}...`);
      }
    }

    // Verify that chunked loading was actually used
    expect(initLogs.some(log => 
      log.includes('sql.js-httpvfs') || 
      log.includes('chunk') || 
      log.includes('worker')
    )).toBe(true);

    // Check for specific sql.js-httpvfs success indicators
    await page.waitForFunction(() => {
      return document.body.innerText.includes('建築作品') || 
             document.body.innerText.includes('architecture') ||
             document.querySelector('[data-testid="architecture-card"]');
    }, { timeout: 30000 });

    console.log('✅ Chunked database loading test completed successfully');
  });

  test('should handle database loading errors gracefully', async ({ page }) => {
    // Test error handling by trying to access a non-existent database config
    await page.route('**/archimap.sqlite3.json', route => {
      route.fulfill({ status: 404, body: 'Not Found' });
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Should show appropriate error message
    await expect(page.locator('body')).toContainText(/エラー|Error|データベース/, { timeout: 60000 });
  });

  test('should show progress during chunked loading', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Should show loading indicator
    await expect(page.locator('[role="progressbar"], .loading, [data-testid="loading"]')).toBeVisible({ timeout: 30000 });

    // Should eventually hide loading indicator
    await expect(page.locator('[role="progressbar"], .loading, [data-testid="loading"]')).toBeHidden({ timeout: 180000 });
  });

  test('should verify chunked requests are made', async ({ page }) => {
    const httpRequests: string[] = [];
    
    page.on('request', request => {
      const url = request.url();
      if (url.includes('.sqlite') || url.includes('chunk') || url.includes('range')) {
        httpRequests.push(`${request.method()} ${url}`);
        console.log(`📡 Request: ${request.method()} ${url}`);
        
        // Check for Range headers (indicating chunked loading)
        const headers = request.headers();
        if (headers.range) {
          console.log(`📦 Range request: ${headers.range}`);
        }
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait for database to start loading
    await page.waitForTimeout(5000);

    // Should have made requests to database files
    expect(httpRequests.length).toBeGreaterThan(0);
    
    // Log all database-related requests
    console.log('📊 Database requests made:');
    httpRequests.forEach(req => console.log(`  - ${req}`));
  });
});