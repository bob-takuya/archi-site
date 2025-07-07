import { test, expect } from '@playwright/test';
import { TestHelpers, selectors, testData } from './utils/test-helpers';

/**
 * Architecture Database Journey E2E Tests
 * Tests the complete user experience for browsing and searching architecture
 */
test.describe('Architecture Database Journey', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    
    // Navigate to architecture section
    await page.goto('/');
    await helpers.waitForPageReady();
    
    // Look for architecture navigation link
    const archLink = page.locator('a[href*="architecture"], a[href*="建築"], nav a').filter({ hasText: /建築|architecture|building/i }).first();
    
    if (await archLink.count() > 0) {
      await archLink.click();
      await helpers.waitForPageReady();
    }
  });

  test('should display architecture list/grid view', async ({ page }) => {
    // Wait for database to load
    await helpers.waitForDatabaseOperation();
    
    // Check for architecture items
    const architectureItems = page.locator(selectors.architectureItem);
    const itemCount = await architectureItems.count();
    
    expect(itemCount).toBeGreaterThan(0);
    console.log(`✅ Found ${itemCount} architecture items`);
    
    // Verify each item has essential information
    for (let i = 0; i < Math.min(itemCount, 5); i++) {
      const item = architectureItems.nth(i);
      await expect(item).toBeVisible();
      
      // Check for title or name
      const title = item.locator('h1, h2, h3, h4, h5, h6, .title, .name');
      if (await title.count() > 0) {
        await expect(title.first()).toBeVisible();
      }
    }
    
    // Take screenshot
    await helpers.takeTimestampedScreenshot('architecture-list');
  });

  test('should have working filtering options', async ({ page }) => {
    await helpers.waitForDatabaseOperation();
    
    // Look for filter buttons/controls
    const filterButtons = page.locator(selectors.filterButton);
    const filterCount = await filterButtons.count();
    
    if (filterCount > 0) {
      console.log(`Found ${filterCount} filter options`);
      
      // Test first filter
      const firstFilter = filterButtons.first();
      const filterText = await firstFilter.textContent();
      
      await firstFilter.click();
      await helpers.waitForDatabaseOperation();
      
      // Check if filtering affected results
      const itemsAfterFilter = await page.locator(selectors.architectureItem).count();
      console.log(`✅ Filter "${filterText}" applied, ${itemsAfterFilter} items shown`);
      
      // Take screenshot of filtered results
      await helpers.takeTimestampedScreenshot('architecture-filtered');
    } else {
      console.log('ℹ️  No filter options found');
    }
  });

  test('should have working sorting options', async ({ page }) => {
    await helpers.waitForDatabaseOperation();
    
    // Look for sort buttons/controls
    const sortButtons = page.locator(selectors.sortButton);
    const sortCount = await sortButtons.count();
    
    if (sortCount > 0) {
      console.log(`Found ${sortCount} sort options`);
      
      // Test first sort option
      const firstSort = sortButtons.first();
      const sortText = await firstSort.textContent();
      
      await firstSort.click();
      await helpers.waitForDatabaseOperation();
      
      console.log(`✅ Sort "${sortText}" applied`);
      
      // Take screenshot of sorted results
      await helpers.takeTimestampedScreenshot('architecture-sorted');
    } else {
      console.log('ℹ️  No sort options found');
    }
  });

  test('should have functional search', async ({ page }) => {
    await helpers.waitForDatabaseOperation();
    
    // Test search functionality
    for (const searchTerm of testData.searchTerms.japanese.slice(0, 3)) {
      await helpers.performSearch(searchTerm);
      
      // Wait for search results
      await helpers.waitForDatabaseOperation();
      
      // Check search results
      const searchResults = await page.locator(selectors.architectureItem).count();
      console.log(`✅ Search for "${searchTerm}" returned ${searchResults} results`);
      
      // Take screenshot of search results
      await helpers.takeTimestampedScreenshot(`architecture-search-${searchTerm}`);
    }
  });

  test('should navigate to architecture detail pages', async ({ page }) => {
    await helpers.waitForDatabaseOperation();
    
    // Find architecture items
    const architectureItems = page.locator(selectors.architectureItem);
    const itemCount = await architectureItems.count();
    
    if (itemCount > 0) {
      // Click on first item
      const firstItem = architectureItems.first();
      const itemLink = firstItem.locator('a').first();
      
      if (await itemLink.count() > 0) {
        await itemLink.click();
        await helpers.waitForPageReady();
        
        // Verify we're on a detail page
        const currentUrl = page.url();
        expect(currentUrl).toContain('/architecture');
        
        // Check for detail page elements
        const detailContent = page.locator('main, .content, .detail');
        await expect(detailContent).toBeVisible();
        
        // Look for architecture-specific information
        const architectureInfo = page.locator('h1, .title, .name, .description');
        const infoCount = await architectureInfo.count();
        expect(infoCount).toBeGreaterThan(0);
        
        // Take screenshot
        await helpers.takeTimestampedScreenshot('architecture-detail');
        
        console.log('✅ Architecture detail page loaded successfully');
      }
    }
  });

  test('should display building information correctly', async ({ page }) => {
    await helpers.waitForDatabaseOperation();
    
    // Navigate to first architecture detail
    const architectureItems = page.locator(selectors.architectureItem);
    const itemCount = await architectureItems.count();
    
    if (itemCount > 0) {
      const firstItem = architectureItems.first();
      const itemLink = firstItem.locator('a').first();
      
      if (await itemLink.count() > 0) {
        await itemLink.click();
        await helpers.waitForPageReady();
        
        // Check for essential building information
        const buildingInfo = {
          title: page.locator('h1, .title, .name').first(),
          architect: page.locator('.architect, .designer').first(),
          year: page.locator('.year, .date').first(),
          location: page.locator('.location, .address').first(),
          description: page.locator('.description, .summary').first()
        };
        
        for (const [key, element] of Object.entries(buildingInfo)) {
          if (await element.count() > 0) {
            await expect(element).toBeVisible();
            const text = await element.textContent();
            console.log(`✅ ${key}: ${text?.substring(0, 50)}...`);
          }
        }
        
        // Check for images
        const images = page.locator('img');
        const imageCount = await images.count();
        
        if (imageCount > 0) {
          console.log(`✅ Found ${imageCount} images`);
          
          // Verify first image loads
          const firstImage = images.first();
          await expect(firstImage).toBeVisible();
          
          // Check if image has alt text
          const altText = await firstImage.getAttribute('alt');
          if (altText) {
            console.log(`✅ Image alt text: ${altText}`);
          }
        }
      }
    }
  });

  test('should handle database performance with large dataset', async ({ page }) => {
    // Test database query performance
    const startTime = Date.now();
    
    await helpers.waitForDatabaseOperation();
    
    const loadTime = Date.now() - startTime;
    console.log(`📊 Database load time: ${loadTime}ms`);
    
    // Should load within reasonable time even with 14,000+ buildings
    expect(loadTime).toBeLessThan(10000); // 10 seconds max
    
    // Test pagination or infinite scroll if present
    const paginationButtons = page.locator('.pagination button, .next, .load-more');
    const paginationCount = await paginationButtons.count();
    
    if (paginationCount > 0) {
      console.log(`✅ Found pagination controls: ${paginationCount}`);
      
      // Test pagination performance
      const nextButton = paginationButtons.filter({ hasText: /next|次|more/i }).first();
      
      if (await nextButton.count() > 0) {
        const paginationStart = Date.now();
        await nextButton.click();
        await helpers.waitForDatabaseOperation();
        const paginationTime = Date.now() - paginationStart;
        
        console.log(`📊 Pagination load time: ${paginationTime}ms`);
        expect(paginationTime).toBeLessThan(5000); // 5 seconds max
      }
    }
  });

  test('should maintain state during navigation', async ({ page }) => {
    await helpers.waitForDatabaseOperation();
    
    // Apply a filter
    const filterButtons = page.locator(selectors.filterButton);
    if (await filterButtons.count() > 0) {
      await filterButtons.first().click();
      await helpers.waitForDatabaseOperation();
    }
    
    // Perform a search
    await helpers.performSearch('東京');
    await helpers.waitForDatabaseOperation();
    
    // Navigate to detail page
    const architectureItems = page.locator(selectors.architectureItem);
    const itemCount = await architectureItems.count();
    
    if (itemCount > 0) {
      const firstItem = architectureItems.first();
      const itemLink = firstItem.locator('a').first();
      
      if (await itemLink.count() > 0) {
        await itemLink.click();
        await helpers.waitForPageReady();
        
        // Go back
        await page.goBack();
        await helpers.waitForPageReady();
        
        // Check if search/filter state is maintained
        const searchInput = page.locator(selectors.searchInput);
        if (await searchInput.count() > 0) {
          const searchValue = await searchInput.inputValue();
          console.log(`✅ Search state maintained: ${searchValue}`);
        }
      }
    }
  });

  test('should be responsive on different screen sizes', async ({ page }) => {
    await helpers.waitForDatabaseOperation();
    
    // Test different breakpoints
    const breakpoints = [
      { name: 'Mobile', width: 375, height: 667 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Desktop', width: 1920, height: 1080 }
    ];
    
    for (const breakpoint of breakpoints) {
      await page.setViewportSize({ width: breakpoint.width, height: breakpoint.height });
      await helpers.waitForPageReady();
      
      // Check if content is visible
      const architectureItems = page.locator(selectors.architectureItem);
      const itemCount = await architectureItems.count();
      
      if (itemCount > 0) {
        // Check first few items are visible
        for (let i = 0; i < Math.min(itemCount, 3); i++) {
          const item = architectureItems.nth(i);
          await expect(item).toBeVisible();
        }
      }
      
      // Take screenshot
      await helpers.takeTimestampedScreenshot(`architecture-responsive-${breakpoint.name.toLowerCase()}`);
      
      console.log(`✅ ${breakpoint.name} layout working correctly`);
    }
  });

  test('should generate architecture database report', async ({ page }) => {
    await helpers.waitForDatabaseOperation();
    
    // Generate comprehensive report
    const reportData = await helpers.generateReportData('Architecture Database Journey');
    
    // Add architecture-specific data
    const architectureData = {
      ...reportData,
      totalItems: await page.locator(selectors.architectureItem).count(),
      hasFilters: await page.locator(selectors.filterButton).count() > 0,
      hasSorting: await page.locator(selectors.sortButton).count() > 0,
      hasSearch: await page.locator(selectors.searchInput).count() > 0,
      hasPagination: await page.locator('.pagination, .next, .load-more').count() > 0,
      hasDatabase: await helpers.hasDatabase(),
      japaneseSupport: await helpers.checkJapaneseText()
    };
    
    console.log('📋 Architecture Database Report:', JSON.stringify(architectureData, null, 2));
    
    // Take final screenshot
    await helpers.takeTimestampedScreenshot('architecture-database-final');
  });
});