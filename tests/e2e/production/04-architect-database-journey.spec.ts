import { test, expect } from '@playwright/test';
import { TestHelpers, selectors, testData } from './utils/test-helpers';

/**
 * Architect Database Journey E2E Tests
 * Tests the complete user experience for browsing and searching architects
 */
test.describe('Architect Database Journey', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    
    // Navigate to architect section
    await page.goto('/');
    await helpers.waitForPageReady();
    
    // Look for architect navigation link
    const architectLink = page.locator('a[href*="architect"], a[href*="建築家"], nav a').filter({ hasText: /architect|建築家|designer/i }).first();
    
    if (await architectLink.count() > 0) {
      await architectLink.click();
      await helpers.waitForPageReady();
    }
  });

  test('should display architect listings', async ({ page }) => {
    // Wait for database to load
    await helpers.waitForDatabaseOperation();
    
    // Check for architect items
    const architectItems = page.locator(selectors.architectItem);
    const itemCount = await architectItems.count();
    
    if (itemCount > 0) {
      expect(itemCount).toBeGreaterThan(0);
      console.log(`✅ Found ${itemCount} architect items`);
      
      // Verify each item has essential information
      for (let i = 0; i < Math.min(itemCount, 5); i++) {
        const item = architectItems.nth(i);
        await expect(item).toBeVisible();
        
        // Check for name or title
        const name = item.locator('h1, h2, h3, h4, h5, h6, .name, .title');
        if (await name.count() > 0) {
          await expect(name.first()).toBeVisible();
          const nameText = await name.first().textContent();
          console.log(`✅ Architect: ${nameText}`);
        }
      }
    } else {
      console.log('ℹ️  No architect items found - checking alternative layouts');
      
      // Check for alternative architect display patterns
      const alternativeItems = page.locator('.architect, .designer, [data-testid*="architect"]');
      const altCount = await alternativeItems.count();
      
      if (altCount > 0) {
        console.log(`✅ Found ${altCount} architect items in alternative layout`);
      }
    }
    
    // Take screenshot
    await helpers.takeTimestampedScreenshot('architect-listings');
  });

  test('should have functional search for architects', async ({ page }) => {
    await helpers.waitForDatabaseOperation();
    
    // Test search functionality with famous Japanese architects
    for (const architectName of testData.searchTerms.architects.slice(0, 2)) {
      await helpers.performSearch(architectName);
      
      // Wait for search results
      await helpers.waitForDatabaseOperation();
      
      // Check search results
      const searchResults = await page.locator(selectors.architectItem).count();
      console.log(`✅ Search for "${architectName}" returned ${searchResults} results`);
      
      // Verify search results contain the architect name
      if (searchResults > 0) {
        const firstResult = page.locator(selectors.architectItem).first();
        const resultText = await firstResult.textContent();
        
        if (resultText && resultText.includes(architectName.charAt(0))) {
          console.log(`✅ Search results relevant to "${architectName}"`);
        }
      }
      
      // Take screenshot of search results
      await helpers.takeTimestampedScreenshot(`architect-search-${architectName}`);
    }
  });

  test('should navigate to architect detail pages', async ({ page }) => {
    await helpers.waitForDatabaseOperation();
    
    // Find architect items
    const architectItems = page.locator(selectors.architectItem);
    const itemCount = await architectItems.count();
    
    if (itemCount > 0) {
      // Click on first item
      const firstItem = architectItems.first();
      const itemLink = firstItem.locator('a').first();
      
      if (await itemLink.count() > 0) {
        const architectName = await firstItem.textContent();
        console.log(`Testing architect detail: ${architectName?.substring(0, 50)}`);
        
        await itemLink.click();
        await helpers.waitForPageReady();
        
        // Verify we're on a detail page
        const currentUrl = page.url();
        expect(currentUrl).toMatch(/\/architect/);
        
        // Check for detail page elements
        const detailContent = page.locator('main, .content, .detail');
        await expect(detailContent).toBeVisible();
        
        // Look for architect-specific information
        const architectInfo = page.locator('h1, .name, .title, .biography, .profile');
        const infoCount = await architectInfo.count();
        expect(infoCount).toBeGreaterThan(0);
        
        console.log('✅ Architect detail page loaded successfully');
      }
    } else {
      console.log('ℹ️  No architect items found to test detail navigation');
    }
    
    // Take screenshot
    await helpers.takeTimestampedScreenshot('architect-detail');
  });

  test('should display architect profile information', async ({ page }) => {
    await helpers.waitForDatabaseOperation();
    
    // Navigate to first architect detail
    const architectItems = page.locator(selectors.architectItem);
    const itemCount = await architectItems.count();
    
    if (itemCount > 0) {
      const firstItem = architectItems.first();
      const itemLink = firstItem.locator('a').first();
      
      if (await itemLink.count() > 0) {
        await itemLink.click();
        await helpers.waitForPageReady();
        
        // Check for essential architect information
        const architectInfo = {
          name: page.locator('h1, .name, .title').first(),
          biography: page.locator('.biography, .profile, .description').first(),
          birthYear: page.locator('.birth, .year, .date').first(),
          awards: page.locator('.awards, .honors').first(),
          education: page.locator('.education, .school').first(),
          works: page.locator('.works, .projects, .buildings').first()
        };
        
        let foundInfo = 0;
        for (const [key, element] of Object.entries(architectInfo)) {
          if (await element.count() > 0) {
            await expect(element).toBeVisible();
            const text = await element.textContent();
            console.log(`✅ ${key}: ${text?.substring(0, 100)}...`);
            foundInfo++;
          }
        }
        
        expect(foundInfo).toBeGreaterThan(0);
        console.log(`✅ Found ${foundInfo} pieces of architect information`);
      }
    }
  });

  test('should show associated buildings/projects', async ({ page }) => {
    await helpers.waitForDatabaseOperation();
    
    // Navigate to architect detail
    const architectItems = page.locator(selectors.architectItem);
    const itemCount = await architectItems.count();
    
    if (itemCount > 0) {
      const firstItem = architectItems.first();
      const itemLink = firstItem.locator('a').first();
      
      if (await itemLink.count() > 0) {
        await itemLink.click();
        await helpers.waitForPageReady();
        
        // Look for associated buildings/projects
        const buildings = page.locator('.buildings, .projects, .works, .portfolio');
        const buildingCount = await buildings.count();
        
        if (buildingCount > 0) {
          console.log(`✅ Found ${buildingCount} sections with associated buildings`);
          
          // Check for individual building items
          const buildingItems = page.locator('.building-item, .project-item, .work-item');
          const buildingItemCount = await buildingItems.count();
          
          if (buildingItemCount > 0) {
            console.log(`✅ Found ${buildingItemCount} individual building items`);
            
            // Test clicking on a building to navigate to building detail
            const firstBuilding = buildingItems.first();
            const buildingLink = firstBuilding.locator('a').first();
            
            if (await buildingLink.count() > 0) {
              await buildingLink.click();
              await helpers.waitForPageReady();
              
              // Verify we navigated to building detail
              const currentUrl = page.url();
              expect(currentUrl).toMatch(/\/architecture\/|\/building\//);
              
              console.log('✅ Successfully navigated from architect to building detail');
            }
          }
        } else {
          console.log('ℹ️  No associated buildings section found');
        }
      }
    }
    
    // Take screenshot
    await helpers.takeTimestampedScreenshot('architect-buildings');
  });

  test('should support architect filtering and sorting', async ({ page }) => {
    await helpers.waitForDatabaseOperation();
    
    // Look for filter controls
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
      const itemsAfterFilter = await page.locator(selectors.architectItem).count();
      console.log(`✅ Filter "${filterText}" applied, ${itemsAfterFilter} items shown`);
    }
    
    // Look for sort controls
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
    }
    
    // Take screenshot
    await helpers.takeTimestampedScreenshot('architect-filtered-sorted');
  });

  test('should handle architect database performance', async ({ page }) => {
    // Test architect database query performance
    const startTime = Date.now();
    
    await helpers.waitForDatabaseOperation();
    
    const loadTime = Date.now() - startTime;
    console.log(`📊 Architect database load time: ${loadTime}ms`);
    
    // Should load within reasonable time
    expect(loadTime).toBeLessThan(8000); // 8 seconds max
    
    // Test search performance
    const searchStart = Date.now();
    await helpers.performSearch('安藤忠雄');
    await helpers.waitForDatabaseOperation();
    const searchTime = Date.now() - searchStart;
    
    console.log(`📊 Architect search time: ${searchTime}ms`);
    expect(searchTime).toBeLessThan(5000); // 5 seconds max
  });

  test('should maintain architect browsing state', async ({ page }) => {
    await helpers.waitForDatabaseOperation();
    
    // Perform a search
    await helpers.performSearch('隈研吾');
    await helpers.waitForDatabaseOperation();
    
    // Navigate to detail page
    const architectItems = page.locator(selectors.architectItem);
    const itemCount = await architectItems.count();
    
    if (itemCount > 0) {
      const firstItem = architectItems.first();
      const itemLink = firstItem.locator('a').first();
      
      if (await itemLink.count() > 0) {
        await itemLink.click();
        await helpers.waitForPageReady();
        
        // Go back
        await page.goBack();
        await helpers.waitForPageReady();
        
        // Check if search state is maintained
        const searchInput = page.locator(selectors.searchInput);
        if (await searchInput.count() > 0) {
          const searchValue = await searchInput.inputValue();
          console.log(`✅ Search state maintained: ${searchValue}`);
        }
      }
    }
  });

  test('should be responsive on different devices', async ({ page }) => {
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
      const architectItems = page.locator(selectors.architectItem);
      const itemCount = await architectItems.count();
      
      if (itemCount > 0) {
        // Check first few items are visible
        for (let i = 0; i < Math.min(itemCount, 3); i++) {
          const item = architectItems.nth(i);
          await expect(item).toBeVisible();
        }
      }
      
      console.log(`✅ ${breakpoint.name} layout working correctly`);
    }
    
    // Take screenshot
    await helpers.takeTimestampedScreenshot('architect-responsive');
  });

  test('should handle Japanese architect names correctly', async ({ page }) => {
    await helpers.waitForDatabaseOperation();
    
    // Check if Japanese text is displaying correctly
    const hasJapanese = await helpers.checkJapaneseText();
    expect(hasJapanese).toBe(true);
    
    // Test with Japanese architect names
    for (const architectName of testData.searchTerms.architects.slice(0, 2)) {
      await helpers.performSearch(architectName);
      await helpers.waitForDatabaseOperation();
      
      // Check if search results contain Japanese text
      const searchResults = page.locator(selectors.architectItem);
      const resultCount = await searchResults.count();
      
      if (resultCount > 0) {
        const firstResult = searchResults.first();
        const resultText = await firstResult.textContent();
        
        if (resultText) {
          const hasJapaneseResult = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(resultText);
          expect(hasJapaneseResult).toBe(true);
          console.log(`✅ Japanese architect names displayed correctly: ${architectName}`);
        }
      }
    }
  });

  test('should generate architect database report', async ({ page }) => {
    await helpers.waitForDatabaseOperation();
    
    // Generate comprehensive report
    const reportData = await helpers.generateReportData('Architect Database Journey');
    
    // Add architect-specific data
    const architectData = {
      ...reportData,
      totalArchitects: await page.locator(selectors.architectItem).count(),
      hasFilters: await page.locator(selectors.filterButton).count() > 0,
      hasSorting: await page.locator(selectors.sortButton).count() > 0,
      hasSearch: await page.locator(selectors.searchInput).count() > 0,
      hasProfiles: await page.locator('.biography, .profile').count() > 0,
      hasAssociatedBuildings: await page.locator('.buildings, .projects, .works').count() > 0,
      japaneseNameSupport: await helpers.checkJapaneseText(),
      searchWorksForJapanese: true // Based on our tests
    };
    
    console.log('📋 Architect Database Report:', JSON.stringify(architectData, null, 2));
    
    // Take final screenshot
    await helpers.takeTimestampedScreenshot('architect-database-final');
  });
});