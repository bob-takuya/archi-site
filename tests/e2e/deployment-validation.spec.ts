import { test, expect } from '@playwright/test';

test.describe('Archi Site Deployment Validation', () => {
  const DEPLOYED_URL = 'https://bob-takuya.github.io/archi-site/';
  
  test.beforeEach(async ({ page }) => {
    // Navigate to the deployed site
    await page.goto(DEPLOYED_URL);
  });

  test('site loads successfully', async ({ page }) => {
    // Verify the page loads without errors
    await expect(page).toHaveURL(DEPLOYED_URL);
    
    // Wait for initial load
    await page.waitForLoadState('networkidle');
    
    // Check that the page has loaded content
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.length).toBeGreaterThan(10);
  });

  test('Japanese title displays correctly', async ({ page }) => {
    // Wait for content to load
    await page.waitForLoadState('networkidle');
    
    // Check for Japanese title in the page
    const title = await page.title();
    console.log('Page title:', title);
    
    // Look for Japanese content in the title or main heading
    const hasJapaneseTitle = title.includes('建築') || 
                            title.includes('サイト') || 
                            title.includes('アーキ') ||
                            title.includes('新建築');
    
    // If not in title, check for Japanese heading or text
    if (!hasJapaneseTitle) {
      const japaneseContent = await page.locator('text=/建築|設計|建物|プロジェクト|ギャラリー|作品|新建築/i').first();
      await expect(japaneseContent).toBeVisible({ timeout: 15000 });
    } else {
      expect(hasJapaneseTitle).toBeTruthy();
    }
  });

  test('React app is functioning', async ({ page }) => {
    // Check for React root element
    const reactRoot = await page.locator('#root, .App, [data-reactroot]').first();
    await expect(reactRoot).toBeVisible();
    
    // Verify some content is rendered
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.length).toBeGreaterThan(50); // Should have substantial content
    
    // Check for interactive elements
    const interactiveElements = await page.locator('button, input, a, select').count();
    expect(interactiveElements).toBeGreaterThan(0);
  });

  test('database content is accessible', async ({ page }) => {
    // Wait for content to load
    await page.waitForLoadState('networkidle');
    
    // Check for architecture-related content
    const architectureContent = await page.locator('text=/建築|設計|建物|プロジェクト|ギャラリー|作品|新建築/i').first();
    
    // Should find some architecture-related Japanese text
    await expect(architectureContent).toBeVisible({ timeout: 15000 });
    
    // Check if database is loading - look for loading states or actual content
    const hasLoadingState = await page.locator('text=/loading|読み込み中|ロード中/i').isVisible();
    const hasContent = await page.locator('text=/建築|設計|建物/i').count() > 0;
    
    // Either should be loading or have content
    expect(hasLoadingState || hasContent).toBeTruthy();
  });

  test('basic navigation elements exist', async ({ page }) => {
    // Check for navigation elements
    const navElements = await page.locator('nav, header, [class*="nav"], [class*="menu"], a[href]').count();
    console.log('Navigation elements found:', navElements);
    
    // Should have some navigation
    expect(navElements).toBeGreaterThan(0);
    
    // Check for clickable links
    const links = await page.locator('a[href]').count();
    expect(links).toBeGreaterThan(0);
  });

  test('essential page elements are present', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check for essential elements
    const hasHeader = await page.locator('header, h1, [class*="header"]').count() > 0;
    const hasMainContent = await page.locator('main, [class*="main"], [class*="content"]').count() > 0;
    const hasFooter = await page.locator('footer, [class*="footer"]').count() > 0;
    
    // Should have at least header and main content
    expect(hasHeader || hasMainContent).toBeTruthy();
    
    // Log what we found
    console.log('Page structure - Header:', hasHeader, 'Main:', hasMainContent, 'Footer:', hasFooter);
  });
});