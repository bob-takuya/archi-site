import { defineConfig, devices } from '@playwright/test';

/**
 * Phase 2 Integration Test Configuration
 * Optimized configuration for testing Phase 2 enhanced components
 * Fixes URL configuration issues and adds Phase 2 specific settings
 */
export default defineConfig({
  testDir: './tests/e2e/phase2-integration',
  testMatch: '**/*.spec.ts',
  
  /* Increased timeouts for Phase 2 component testing */
  timeout: 120 * 1000, // 2 minutes for complex integration tests
  expect: {
    timeout: 15000 // Increased for Phase 2 component interactions
  },
  
  /* Run tests in parallel for efficiency */
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 3 : 2,
  workers: process.env.CI ? 2 : 3,
  
  /* Enhanced reporting for Phase 2 integration */
  reporter: [
    ['html', { 
      outputFolder: 'playwright-results/phase2-reports',
      open: 'never'
    }],
    ['json', { outputFile: 'playwright-results/phase2-results.json' }],
    ['junit', { outputFile: 'playwright-results/phase2-junit.xml' }],
    ['list'],
    ['github']
  ],
  
  /* Phase 2 optimized settings */
  use: {
    actionTimeout: 15000, // Increased for Phase 2 component interactions
    
    /* FIXED: Correct base URL for archi-site */
    baseURL: 'https://bob-takuya.github.io/archi-site/',
    
    /* Enhanced tracing for Phase 2 debugging */
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    
    testIdAttribute: 'data-testid',
    
    /* Phase 2 specific settings */
    navigationTimeout: 60000, // Allow time for database and components to load
    ignoreHTTPSErrors: false, // Strict HTTPS for production
    
    /* Custom headers for Phase 2 testing */
    extraHTTPHeaders: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'ja,en-US;q=0.7,en;q=0.3',
      'Cache-Control': 'no-cache',
      'User-Agent': 'Mozilla/5.0 (compatible; Phase2-E2E-Tests/1.0; +https://github.com/bob-takuya/archi-site)'
    }
  },

  /* Comprehensive cross-browser testing for Phase 2 */
  projects: [
    // Desktop browsers for Phase 2 component testing
    {
      name: 'Desktop Chrome - Phase 2',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        headless: !!process.env.CI,
        launchOptions: {
          args: [
            '--disable-web-security', 
            '--disable-features=VizDisplayCompositor',
            '--enable-experimental-web-platform-features' // For Phase 2 advanced features
          ]
        }
      },
    },
    {
      name: 'Desktop Firefox - Phase 2',
      use: { 
        ...devices['Desktop Firefox'],
        viewport: { width: 1920, height: 1080 },
        headless: !!process.env.CI,
      },
    },
    {
      name: 'Desktop Safari - Phase 2',
      use: { 
        ...devices['Desktop Safari'],
        viewport: { width: 1920, height: 1080 },
        headless: !!process.env.CI,
      },
    },
    
    // Mobile devices for Phase 2 mobile optimization testing
    {
      name: 'Mobile Chrome - Phase 2',
      use: { 
        ...devices['Pixel 5'],
        headless: !!process.env.CI,
      },
    },
    {
      name: 'Mobile Safari - Phase 2',
      use: { 
        ...devices['iPhone 12'],
        headless: !!process.env.CI,
      },
    },
    {
      name: 'Mobile Safari Large - Phase 2',
      use: { 
        ...devices['iPhone 12 Pro Max'],
        headless: !!process.env.CI,
      },
    },
    
    // Tablet devices for Phase 2 responsive testing
    {
      name: 'Tablet iPad - Phase 2',
      use: { 
        ...devices['iPad Pro'],
        headless: !!process.env.CI,
      },
    },
    {
      name: 'Tablet Android - Phase 2',
      use: { 
        ...devices['Galaxy Tab S4'],
        headless: !!process.env.CI,
      },
    },
    
    // Specialized viewports for Phase 2 testing
    {
      name: '4K Display - Phase 2',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 3840, height: 2160 },
        deviceScaleFactor: 2,
        headless: !!process.env.CI,
      },
    },
    {
      name: 'Small Mobile - Phase 2',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 320, height: 568 }, // iPhone SE
        headless: !!process.env.CI,
      },
    },
  ],

  /* Phase 2 test artifacts storage */
  outputDir: 'playwright-results/phase2-artifacts',
  
  /* Global setup for Phase 2 integration testing */
  globalSetup: require.resolve('./tests/e2e/phase2-integration/global-setup.ts'),
  globalTeardown: require.resolve('./tests/e2e/phase2-integration/global-teardown.ts'),
});