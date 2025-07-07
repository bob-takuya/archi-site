import { defineConfig, devices } from '@playwright/test';

/**
 * Comprehensive Playwright configuration for Production E2E testing
 * Targets the deployed site at https://bob-takuya.github.io/archi-site/
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e/production',
  // Match all test files in the production e2e directory
  testMatch: '**/*.spec.ts',
  /* Maximum time one test can run for - Extended for large database downloads */
  timeout: 300 * 1000, // Extended to 5 minutes for database loading (12.7MB + 1.2MB WASM)
  expect: {
    /**
     * Maximum time expect() should wait for the condition to be met
     */
    timeout: 30000 // Extended for database operations
  },
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 3 : 2, // Increased retries for production stability
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 2 : 3, // Adjusted for production testing
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { 
      outputFolder: 'playwright-results/production-reports',
      open: 'never'
    }],
    ['json', { outputFile: 'playwright-results/production-results.json' }],
    ['junit', { outputFile: 'playwright-results/production-junit.xml' }],
    ['list'],
    ['github']
  ],
  /* Shared settings for all the projects below. */
  use: {
    /* Maximum time each action such as `click()` can take. */
    actionTimeout: 30000, // Extended for database-dependent actions
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'https://bob-takuya.github.io/archi-site/',

    /* Collect trace when retrying the failed test. */
    trace: 'on-first-retry',
    
    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Record video for failed tests */
    video: 'retain-on-failure',
    
    /* Store test artifacts in a structured way */
    testIdAttribute: 'data-testid',
    
    /* Additional settings for production testing */
    navigationTimeout: 120000, // Extended for large database downloads
    ignoreHTTPSErrors: false, // Strict HTTPS for production
    
    /* User agent for testing */
    userAgent: 'Mozilla/5.0 (compatible; ArchiSite-E2E-Tests/1.0; +https://github.com/bob-takuya/archi-site)',
    
    /* Extra HTTP headers */
    extraHTTPHeaders: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'ja,en-US;q=0.7,en;q=0.3',
      'Accept-Encoding': 'gzip, deflate, br',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    }
  },

  /* Configure projects for comprehensive cross-browser testing */
  projects: [
    // Desktop browsers
    {
      name: 'Desktop Chrome',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        headless: !!process.env.CI,
        launchOptions: {
          args: ['--disable-web-security', '--disable-features=VizDisplayCompositor']
        }
      },
    },
    {
      name: 'Desktop Firefox',
      use: { 
        ...devices['Desktop Firefox'],
        viewport: { width: 1920, height: 1080 },
        headless: !!process.env.CI,
      },
    },
    {
      name: 'Desktop Safari',
      use: { 
        ...devices['Desktop Safari'],
        viewport: { width: 1920, height: 1080 },
        headless: !!process.env.CI,
      },
    },
    // Mobile devices
    {
      name: 'Mobile Chrome',
      use: { 
        ...devices['Pixel 5'],
        headless: !!process.env.CI,
      },
    },
    {
      name: 'Mobile Safari',
      use: { 
        ...devices['iPhone 12'],
        headless: !!process.env.CI,
      },
    },
    {
      name: 'Mobile Safari Large',
      use: { 
        ...devices['iPhone 12 Pro Max'],
        headless: !!process.env.CI,
      },
    },
    // Tablet devices
    {
      name: 'Tablet iPad',
      use: { 
        ...devices['iPad Pro'],
        headless: !!process.env.CI,
      },
    },
    {
      name: 'Tablet Android',
      use: { 
        ...devices['Galaxy Tab S4'],
        headless: !!process.env.CI,
      },
    },
    // High-resolution displays
    {
      name: '4K Display',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 3840, height: 2160 },
        deviceScaleFactor: 2,
        headless: !!process.env.CI,
      },
    },
    // Low-resolution displays
    {
      name: 'Small Desktop',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1024, height: 768 },
        headless: !!process.env.CI,
      },
    },
  ],

  /* Where to store test artifacts (screenshots, videos, etc.) */
  outputDir: 'playwright-results/production-artifacts',
  
  /* Global setup and teardown for production testing */
  globalSetup: require.resolve('./tests/e2e/production/global-setup.ts'),
  globalTeardown: require.resolve('./tests/e2e/production/global-teardown.ts'),
});