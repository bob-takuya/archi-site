import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load homepage with all essential elements', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Japanese Architecture Map|日本の建築マップ/);
    
    // Check hero section
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    
    // Check navigation menu
    await expect(page.getByRole('navigation')).toBeVisible();
    
    // Check main navigation links - handle mobile menu
    const mobileMenuButton = page.getByTestId('mobile-menu-button');
    const isMobile = await mobileMenuButton.isVisible();
    
    if (isMobile) {
      // Open mobile menu first
      await mobileMenuButton.click();
      await expect(page.getByRole('menu')).toBeVisible();
    }
    
    // Check navigation links (either in header or mobile menu)
    await expect(page.getByTestId('nav-link-建築作品')).toBeVisible();
    await expect(page.getByTestId('nav-link-建築家')).toBeVisible();
    await expect(page.getByTestId('nav-link-マップ')).toBeVisible();
    
    // Check search functionality
    await expect(page.getByTestId('search-input')).toBeVisible();
    
    // Check footer (scroll to it on mobile)
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(page.getByTestId('footer')).toBeVisible();
  });

  test('should have working search functionality', async ({ page }) => {
    // Locate search input
    const searchInput = page.getByTestId('search-input');
    await expect(searchInput).toBeVisible();
    
    // Enter search term
    await searchInput.fill('Tokyo');
    
    // Submit search (look for search button or press Enter)
    const searchButton = page.getByTestId('search-button');
    if (await searchButton.isVisible()) {
      await searchButton.click();
    } else {
      await searchInput.press('Enter');
    }
    
    // Should navigate to search results or update current page
    await page.waitForLoadState('networkidle');
    
    // Check that we either navigated to results or results are shown
    const hasNavigated = page.url().includes('/architecture') || page.url().includes('/search');
    const hasResults = await page.locator('[data-testid="architecture-item"]').count() > 0;
    const hasNoResults = await page.getByText(/no results|結果が見つかりません/i).isVisible();
    
    expect(hasNavigated || hasResults || hasNoResults).toBeTruthy();
  });

  test('should display feature cards or sections', async ({ page }) => {
    // Look for feature cards, sections, or similar content
    const featureSelectors = [
      '[data-testid="feature-card"]',
      '[data-testid="feature-section"]',
      '.feature-card',
      '.feature-section',
      '[role="article"]'
    ];
    
    let featuresFound = false;
    for (const selector of featureSelectors) {
      const elements = page.locator(selector);
      if (await elements.count() > 0) {
        await expect(elements.first()).toBeVisible();
        featuresFound = true;
        break;
      }
    }
    
    // If no specific feature cards, check for general content sections
    if (!featuresFound) {
      const contentSections = page.locator('main section, .content-section, .hero-section');
      if (await contentSections.count() > 0) {
        await expect(contentSections.first()).toBeVisible();
      }
    }
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check that navigation is mobile-friendly
    const nav = page.getByRole('navigation');
    await expect(nav).toBeVisible();
    
    // Check for mobile menu toggle if it exists
    const mobileMenuToggle = page.getByRole('button', { name: /menu|メニュー/i });
    if (await mobileMenuToggle.isVisible()) {
      await mobileMenuToggle.click();
      // Menu should expand
      await expect(page.getByRole('menu')).toBeVisible();
    }
    
    // Check that search is accessible on mobile
    await expect(page.getByTestId('search-input')).toBeVisible();
    
    // Check that main content is visible and properly scaled
    await expect(page.locator('main')).toBeVisible();
  });

  test('should handle slow loading gracefully', async ({ page }) => {
    // Simulate slow network
    await page.route('**/*', route => {
      setTimeout(() => route.continue(), 100);
    });
    
    await page.goto('/');
    
    // Check for loading indicators
    const loadingIndicators = [
      '[data-testid="loading-skeleton"]',
      '[data-testid="loading-spinner"]',
      '.loading',
      '.skeleton'
    ];
    
    for (const selector of loadingIndicators) {
      const loading = page.locator(selector);
      if (await loading.count() > 0) {
        // Loading indicator should be visible initially
        await expect(loading.first()).toBeVisible();
        break;
      }
    }
    
    // Wait for content to load
    await page.waitForLoadState('networkidle');
    
    // Check that main content is eventually visible
    await expect(page.locator('main')).toBeVisible();
  });

  test('should have proper accessibility features', async ({ page }) => {
    // Check for skip links
    const skipLinks = page.getByRole('link', { name: /skip to main content|skip to content/i });
    if (await skipLinks.count() > 0) {
      await expect(skipLinks.first()).toBeVisible();
    }
    
    // Check for proper heading hierarchy
    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toBeVisible();
    
    // Check for alt text on images
    const images = page.locator('img');
    const imageCount = await images.count();
    
    if (imageCount > 0) {
      for (let i = 0; i < Math.min(imageCount, 5); i++) {
        const img = images.nth(i);
        const alt = await img.getAttribute('alt');
        const ariaLabel = await img.getAttribute('aria-label');
        
        // Images should have alt text or aria-label
        expect(alt !== null || ariaLabel !== null).toBeTruthy();
      }
    }
    
    // Check for proper focus management
    await page.keyboard.press('Tab');
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('should handle errors gracefully', async ({ page }) => {
    // Test what happens when we try to access a non-existent route
    await page.goto('/non-existent-page');
    
    // Should show 404 page or redirect to home
    const is404 = page.url().includes('404') || 
                  await page.getByText(/404|not found|見つかりません/i).isVisible();
    const isHome = page.url().endsWith('/') || page.url().endsWith('/index.html');
    
    expect(is404 || isHome).toBeTruthy();
    
    // If it's a 404, check that navigation still works
    if (is404) {
      const homeLink = page.getByRole('link', { name: /home|ホーム/i });
      if (await homeLink.isVisible()) {
        await homeLink.click();
        await expect(page).toHaveURL('/');
      }
    }
  });
});