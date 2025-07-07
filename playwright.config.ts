import { defineConfig, devices } from '@playwright/test';

/**
 * Comprehensive Playwright configuration for E2E testing
 * Optimized for archi-site project with PlaywrightMCP integration
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e',
  // Match all test files in the e2e directory with .spec.ts extension
  testMatch: '**/*.spec.ts',
  // Explicitly exclude unit tests
  testIgnore: ['**/unit/**/*.test.ts', '**/unit/**/*.test.tsx'],
  /* Maximum time one test can run for */
  timeout: 60 * 1000, // Increased for complex interactions
  expect: {
    /**
     * Maximum time expect() should wait for the condition to be met
     */
    timeout: 10000 // Increased for database operations
  },
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 3 : 1, // Increased retries for stability
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 2 : undefined, // Increased workers for better performance
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { 
      outputFolder: 'playwright-results/reports',
      open: 'never' // Don't auto-open in CI
    }],
    ['json', { outputFile: 'playwright-results/results.json' }],
    ['junit', { outputFile: 'playwright-results/junit.xml' }], // For CI integration
    ['list'], // For clearer CLI output
    ['github'] // GitHub Actions integration
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Maximum time each action such as `click()` can take. Defaults to 0 (no limit). */
    actionTimeout: 10000, // Set reasonable timeout for actions
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.BASE_URL || 'http://localhost:4173', // Updated for Vite preview server

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry', // Always collect traces for debugging
    
    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Record video for failed tests */
    video: 'retain-on-failure',
    
    /* Store test artifacts in a structured way */
    testIdAttribute: 'data-testid',
    
    /* Additional settings for better test reliability */
    navigationTimeout: 30000, // Increased for slow database loads
    ignoreHTTPSErrors: true, // For development environments
  },

  /* Configure projects for major browsers - enhanced for comprehensive testing */
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Enable headless mode in CI
        headless: !!process.env.CI,
        // Optimize for testing
        launchOptions: {
          args: ['--disable-web-security', '--disable-features=VizDisplayCompositor']
        }
      },
    },
    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        headless: !!process.env.CI,
      },
    },
    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
        headless: !!process.env.CI,
      },
    },
    // Mobile testing for responsive design
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
    // Tablet testing
    {
      name: 'Tablet',
      use: { 
        ...devices['iPad Pro'],
        headless: !!process.env.CI,
      },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run preview',
    port: 4173, // Vite preview server port
    reuseExistingServer: true, // Use existing server for now
    timeout: 60 * 1000, // Allow 1 minute for server to start
    env: {
      NODE_ENV: 'test'
    }
  },
  /* Where to store test artifacts (screenshots, videos, etc.) */
  outputDir: 'playwright-results/artifacts',
  
  // /* Global setup and teardown */
  // globalSetup: require.resolve('./tests/e2e/global-setup.ts'),
  // globalTeardown: require.resolve('./tests/e2e/global-teardown.ts'),
});