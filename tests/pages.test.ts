import { test, expect } from '@playwright/test';

// Test suite for the main pages of the application
test.describe('Main Pages Navigation', () => {
  // Test for the home page
  test('Home page loads correctly', async ({ page }) => {
    // Navigate to the home page
    await page.goto('/');
    
    // Check that the page title is correct
    await expect(page).toHaveTitle(/日本の建築マップ/);
    
    // Verify header and navigation are present
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('nav')).toBeVisible();
    
    // Verify the page contains some expected content
    await expect(page.getByRole('heading', { name: /日本の建築/ })).toBeVisible();
    
    // Take a screenshot for visual reference
    await page.screenshot({ path: 'tests/screenshots/home-page.png' });
  });
  
  // Test for the architecture list page
  test('Architecture list page displays buildings', async ({ page }) => {
    // Navigate to the architectures page
    await page.goto('/architectures');
    
    // Wait for data to load
    await page.waitForSelector('[data-testid="architecture-list"]');
    
    // Verify some buildings are displayed
    const buildingCards = await page.locator('[data-testid="architecture-card"]').count();
    expect(buildingCards).toBeGreaterThan(0);
    
    // Test search functionality
    await page.fill('[data-testid="search-input"]', '東京');
    await page.click('[data-testid="search-button"]');
    
    // Wait for search results
    await page.waitForLoadState('networkidle');
    
    // Verify filter has been applied (check URL has search param)
    expect(page.url()).toContain('search=');
    
    // Take a screenshot for visual reference
    await page.screenshot({ path: 'tests/screenshots/architecture-list.png' });
  });
  
  // Test for the architects list page
  test('Architects list page displays architects', async ({ page }) => {
    // Navigate to the architects page
    await page.goto('/architects');
    
    // Wait for data to load
    await page.waitForSelector('[data-testid="architect-list"]');
    
    // Verify some architects are displayed
    const architectCards = await page.locator('[data-testid="architect-card"]').count();
    expect(architectCards).toBeGreaterThan(0);
    
    // Test filter functionality
    const filterChip = page.locator('[data-testid="filter-chip"]').first();
    await filterChip.click();
    
    // Wait for filter to apply
    await page.waitForLoadState('networkidle');
    
    // Verify filter has been applied
    expect(filterChip).toHaveClass(/selected/);
    
    // Take a screenshot for visual reference
    await page.screenshot({ path: 'tests/screenshots/architects-list.png' });
  });
  
  // Test for the map page
  test('Map page displays correctly', async ({ page }) => {
    // Navigate to the map page
    await page.goto('/map');
    
    // Wait for the map to load
    await page.waitForSelector('.leaflet-container');
    
    // Verify map container is visible
    await expect(page.locator('.leaflet-container')).toBeVisible();
    
    // Verify markers are loaded
    await page.waitForSelector('.leaflet-marker-icon', { timeout: 10000 });
    const markers = await page.locator('.leaflet-marker-icon').count();
    expect(markers).toBeGreaterThan(0);
    
    // Test zoom controls
    await page.click('.leaflet-control-zoom-in');
    
    // Take a screenshot for visual reference
    await page.screenshot({ path: 'tests/screenshots/map-page.png' });
  });
  
  // Test navigation between pages
  test('Navigation between pages works correctly', async ({ page }) => {
    // Start at home page
    await page.goto('/');
    
    // Navigate to architectures page
    await page.click('nav >> text=建築物');
    await expect(page).toHaveURL(/\/architectures/);
    
    // Navigate to architects page
    await page.click('nav >> text=建築家');
    await expect(page).toHaveURL(/\/architects/);
    
    // Navigate to map page
    await page.click('nav >> text=マップ');
    await expect(page).toHaveURL(/\/map/);
    
    // Navigate back to home page
    await page.click('header >> text=日本の建築マップ');
    await expect(page).toHaveURL(/\/$/);
  });
});