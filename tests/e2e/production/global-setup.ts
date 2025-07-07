import { chromium, FullConfig } from '@playwright/test';

/**
 * Global setup for production E2E tests
 * Performs initial health checks and setup validation
 */
async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting Production E2E Test Suite');
  console.log('🎯 Target URL: https://bob-takuya.github.io/archi-site/');
  
  // Launch browser for initial health check
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    console.log('🔍 Performing initial health check...');
    
    // Check if the site is accessible
    const response = await page.goto('https://bob-takuya.github.io/archi-site/', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    if (!response || response.status() !== 200) {
      throw new Error(`Site is not accessible. Status: ${response?.status()}`);
    }
    
    console.log('✅ Site is accessible');
    
    // Check if essential elements are present
    const titleElement = await page.locator('title').first();
    const title = await titleElement.textContent();
    
    if (!title || !title.includes('建築')) {
      console.warn('⚠️  Page title may not be correct:', title);
    } else {
      console.log('✅ Page title is correct:', title);
    }
    
    // Check if database is loading
    await page.waitForTimeout(3000); // Allow time for database to load
    
    // Look for common elements that indicate the app is working
    const hasContent = await page.locator('body').evaluate(el => el.textContent && el.textContent.length > 100);
    
    if (!hasContent) {
      console.warn('⚠️  Page content may not be loading properly');
    } else {
      console.log('✅ Page content is loading');
    }
    
    console.log('✅ Initial health check completed successfully');
    
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
  
  console.log('🎉 Production E2E Test Suite setup complete');
}

export default globalSetup;