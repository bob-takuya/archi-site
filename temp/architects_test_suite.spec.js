import { test, expect } from '@playwright/test';

test.describe('Architects Page Comprehensive Test Suite', () => {
  let consoleLogs = [];
  let consoleErrors = [];
  let consoleWarnings = [];
  let networkErrors = [];

  test.beforeEach(async ({ page }) => {
    // Reset logs
    consoleLogs = [];
    consoleErrors = [];
    consoleWarnings = [];
    networkErrors = [];

    // Capture console messages
    page.on('console', (msg) => {
      const text = `[${msg.type()}] ${msg.text()}`;
      consoleLogs.push(text);
      
      if (msg.type() === 'error') {
        consoleErrors.push(text);
      } else if (msg.type() === 'warning') {
        consoleWarnings.push(text);
      }
    });

    // Capture network failures
    page.on('response', (response) => {
      if (!response.ok() && response.url().includes('/api/')) {
        networkErrors.push({
          status: response.status(),
          statusText: response.statusText(),
          url: response.url()
        });
      }
    });

    // Capture page errors
    page.on('pageerror', (error) => {
      consoleErrors.push(`Page Error: ${error.message}`);
    });
  });

  test('1. Database Connection and Data Retrieval', async ({ page }) => {
    console.log('Testing database connection and data retrieval...');
    
    // Navigate to architects page
    await page.goto('http://localhost:3000/archi-site/#/architects', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Wait for loading to complete
    await page.waitForSelector('[data-testid="architects-loading"]', { state: 'hidden', timeout: 10000 }).catch(() => {});

    // Check for error states
    const errorElement = await page.locator('[data-testid="error-message"], .error-message, text=/問題が発生しました/').first();
    const hasError = await errorElement.isVisible().catch(() => false);
    
    if (hasError) {
      const errorText = await errorElement.textContent();
      console.error('Database error detected:', errorText);
    }

    // Check architect count
    const countElement = await page.locator('text=/\d+人の建築家/').first();
    const countVisible = await countElement.isVisible().catch(() => false);
    
    if (countVisible) {
      const countText = await countElement.textContent();
      const count = parseInt(countText.match(/(\d+)人/)?.[1] || '0');
      console.log(`Found ${count} architects displayed`);
      
      // Should be 2927 architects
      expect(count).toBe(2927);
    } else {
      console.error('Architect count not visible');
    }

    // Check if architect cards are displayed
    const architectCards = await page.locator('[data-testid="architect-card"], .architect-card').all();
    console.log(`Found ${architectCards.length} architect cards`);
    expect(architectCards.length).toBeGreaterThan(0);
  });

  test('2. Filtering by Nationality', async ({ page }) => {
    console.log('Testing nationality filter...');
    
    await page.goto('http://localhost:3000/archi-site/#/architects', {
      waitUntil: 'networkidle'
    });

    // Wait for filters to load
    await page.waitForSelector('[data-testid="filters-sidebar"], .suggestions-sidebar', { timeout: 10000 });

    // Click on nationality filter
    const nationalitySection = await page.locator('text=/国籍|Nationality/i').first();
    await nationalitySection.click();

    // Select a nationality (e.g., Japanese)
    const japaneseFilter = await page.locator('text=/日本|Japan/i').first();
    await japaneseFilter.click();

    // Wait for filtered results
    await page.waitForTimeout(1000);

    // Verify URL updated with filter
    const url = page.url();
    expect(url).toContain('nationality=');

    // Verify results are filtered
    const filteredCards = await page.locator('[data-testid="architect-card"], .architect-card').all();
    console.log(`Filtered to ${filteredCards.length} architects`);
    expect(filteredCards.length).toBeGreaterThan(0);
  });

  test('3. Search Functionality', async ({ page }) => {
    console.log('Testing search functionality...');
    
    await page.goto('http://localhost:3000/archi-site/#/architects', {
      waitUntil: 'networkidle'
    });

    // Find search input
    const searchInput = await page.locator('input[type="search"], input[placeholder*="検索"], input[placeholder*="Search"]').first();
    
    // Type search term
    await searchInput.fill('安藤');
    await searchInput.press('Enter');

    // Wait for search results
    await page.waitForTimeout(1000);

    // Verify URL updated with search
    const url = page.url();
    expect(url).toContain('search=');

    // Verify search results
    const searchResults = await page.locator('[data-testid="architect-card"], .architect-card').all();
    console.log(`Search returned ${searchResults.length} results`);
    
    // Verify at least one result contains the search term
    if (searchResults.length > 0) {
      const firstCardText = await searchResults[0].textContent();
      expect(firstCardText).toContain('安藤');
    }
  });

  test('4. ArchitectCard Component Rendering', async ({ page }) => {
    console.log('Testing ArchitectCard component...');
    
    await page.goto('http://localhost:3000/archi-site/#/architects', {
      waitUntil: 'networkidle'
    });

    // Wait for cards to load
    await page.waitForSelector('[data-testid="architect-card"], .architect-card', { timeout: 10000 });

    // Get first architect card
    const firstCard = await page.locator('[data-testid="architect-card"], .architect-card').first();
    
    // Verify card structure
    const cardElements = {
      name: await firstCard.locator('[data-testid="architect-name"], .architect-name, h3, h4').first(),
      birthYear: await firstCard.locator('text=/\d{4}/', 'text=/生年/').first(),
      nationality: await firstCard.locator('[data-testid="architect-nationality"], text=/国籍/').first()
    };

    // Check visibility of key elements
    for (const [key, element] of Object.entries(cardElements)) {
      const isVisible = await element.isVisible().catch(() => false);
      console.log(`${key} visible: ${isVisible}`);
    }

    // Test card interaction (click)
    await firstCard.click();
    
    // Should navigate to architect detail page
    await page.waitForTimeout(1000);
    const detailUrl = page.url();
    expect(detailUrl).toMatch(/architect\/\d+|architects\/\d+/);
  });

  test('5. Pagination Behavior', async ({ page }) => {
    console.log('Testing pagination...');
    
    await page.goto('http://localhost:3000/archi-site/#/architects', {
      waitUntil: 'networkidle'
    });

    // Find pagination component
    const pagination = await page.locator('[data-testid="pagination"], .MuiPagination-root, nav[aria-label="pagination"]').first();
    const paginationVisible = await pagination.isVisible().catch(() => false);
    
    if (!paginationVisible) {
      console.log('Pagination not visible - may be due to limited data');
      return;
    }

    // Get current page
    const currentPage = await page.locator('[aria-current="page"], .Mui-selected').first();
    const currentPageText = await currentPage.textContent();
    console.log(`Current page: ${currentPageText}`);

    // Click next page
    const nextButton = await page.locator('[aria-label="Go to next page"], button:has-text("Next"), button:has-text("次へ")').first();
    const nextVisible = await nextButton.isVisible().catch(() => false);
    
    if (nextVisible) {
      await nextButton.click();
      await page.waitForTimeout(1000);
      
      // Verify URL updated
      const url = page.url();
      expect(url).toContain('page=2');
      
      // Verify new content loaded
      const newCards = await page.locator('[data-testid="architect-card"], .architect-card').all();
      expect(newCards.length).toBeGreaterThan(0);
    }
  });

  test('6. Error Handling for Database Failures', async ({ page }) => {
    console.log('Testing error handling...');
    
    // Intercept API calls to simulate failure
    await page.route('**/api/architects*', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Database connection failed' })
      });
    });

    await page.goto('http://localhost:3000/archi-site/#/architects', {
      waitUntil: 'networkidle'
    });

    // Check for error message
    const errorMessage = await page.locator('text=/エラー|Error|問題が発生しました/').first();
    const errorVisible = await errorMessage.isVisible().catch(() => false);
    
    console.log(`Error message visible: ${errorVisible}`);
    
    // Should show fallback UI or error state
    expect(errorVisible || networkErrors.length > 0).toBeTruthy();
  });

  test('7. Loading States', async ({ page }) => {
    console.log('Testing loading states...');
    
    // Slow down network to see loading states
    await page.route('**/api/architects*', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      await route.continue();
    });

    await page.goto('http://localhost:3000/archi-site/#/architects');

    // Check for loading indicators
    const loadingIndicators = [
      '[data-testid="loading-spinner"]',
      '.MuiCircularProgress-root',
      '.MuiSkeleton-root',
      'text=/読み込み中|Loading/'
    ];

    let loadingFound = false;
    for (const selector of loadingIndicators) {
      const element = await page.locator(selector).first();
      const isVisible = await element.isVisible().catch(() => false);
      if (isVisible) {
        loadingFound = true;
        console.log(`Found loading indicator: ${selector}`);
        break;
      }
    }

    expect(loadingFound).toBeTruthy();
  });

  test('8. Console Errors and Warnings', async ({ page }) => {
    console.log('Checking for console errors and warnings...');
    
    await page.goto('http://localhost:3000/archi-site/#/architects', {
      waitUntil: 'networkidle'
    });

    // Wait for page to fully load
    await page.waitForTimeout(3000);

    // Report console errors
    console.log(`Console Errors: ${consoleErrors.length}`);
    consoleErrors.forEach(error => console.error(error));

    // Report console warnings
    console.log(`Console Warnings: ${consoleWarnings.length}`);
    consoleWarnings.forEach(warning => console.warn(warning));

    // Report network errors
    console.log(`Network Errors: ${networkErrors.length}`);
    networkErrors.forEach(error => console.error(error));

    // Ideally should have no errors
    expect(consoleErrors.length).toBe(0);
  });

  test('9. Filter Sidebar Functionality', async ({ page }) => {
    console.log('Testing filter sidebar...');
    
    await page.goto('http://localhost:3000/archi-site/#/architects', {
      waitUntil: 'networkidle'
    });

    // Check sidebar visibility
    const sidebar = await page.locator('[data-testid="filters-sidebar"], .suggestions-sidebar').first();
    const sidebarVisible = await sidebar.isVisible().catch(() => false);
    
    console.log(`Sidebar visible: ${sidebarVisible}`);
    expect(sidebarVisible).toBeTruthy();

    // Test category filter
    const categorySection = await page.locator('text=/カテゴリー|Category/i').first();
    const categoryVisible = await categorySection.isVisible().catch(() => false);
    
    if (categoryVisible) {
      await categorySection.click();
      const categoryOptions = await page.locator('[data-testid="category-option"], .category-option').all();
      console.log(`Found ${categoryOptions.length} category options`);
    }

    // Test school filter
    const schoolSection = await page.locator('text=/学校|School/i').first();
    const schoolVisible = await schoolSection.isVisible().catch(() => false);
    
    if (schoolVisible) {
      await schoolSection.click();
      const schoolOptions = await page.locator('[data-testid="school-option"], .school-option').all();
      console.log(`Found ${schoolOptions.length} school options`);
    }
  });

  test('10. Mobile Responsiveness', async ({ page }) => {
    console.log('Testing mobile responsiveness...');
    
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('http://localhost:3000/archi-site/#/architects', {
      waitUntil: 'networkidle'
    });

    // Check if layout adapts
    const mobileMenu = await page.locator('[data-testid="mobile-menu"], .mobile-menu').first();
    const mobileMenuVisible = await mobileMenu.isVisible().catch(() => false);
    
    console.log(`Mobile menu visible: ${mobileMenuVisible}`);

    // Check card layout on mobile
    const cards = await page.locator('[data-testid="architect-card"], .architect-card').all();
    if (cards.length > 0) {
      const firstCardBox = await cards[0].boundingBox();
      console.log(`Mobile card width: ${firstCardBox?.width}px`);
      
      // Cards should be full width on mobile
      expect(firstCardBox?.width).toBeGreaterThan(300);
    }
  });

  test.afterEach(async ({ page }, testInfo) => {
    // Save screenshot on failure
    if (testInfo.status !== 'passed') {
      await page.screenshot({ 
        path: `/Users/homeserver/ai-creative-team/temp/architects_test_failure_${testInfo.title.replace(/\s+/g, '_')}.png`,
        fullPage: true 
      });
    }

    // Generate test report
    console.log('\n--- Test Summary ---');
    console.log(`Test: ${testInfo.title}`);
    console.log(`Status: ${testInfo.status}`);
    console.log(`Duration: ${testInfo.duration}ms`);
    console.log(`Console Errors: ${consoleErrors.length}`);
    console.log(`Network Errors: ${networkErrors.length}`);
  });
});

// Additional test for production site
test.describe('Production Site Tests', () => {
  test('Production Architects Page Check', async ({ page }) => {
    const productionUrl = process.env.PRODUCTION_URL || 'https://your-production-site.com';
    
    console.log(`Testing production site: ${productionUrl}`);
    
    await page.goto(`${productionUrl}/architects`, {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Quick smoke test
    const title = await page.title();
    console.log(`Page title: ${title}`);

    // Check if page loads without critical errors
    const pageContent = await page.locator('body').textContent();
    expect(pageContent).not.toContain('500');
    expect(pageContent).not.toContain('404');
    
    // Check for architect content
    const hasArchitectContent = pageContent.includes('建築家') || pageContent.includes('Architect');
    expect(hasArchitectContent).toBeTruthy();
  });
});