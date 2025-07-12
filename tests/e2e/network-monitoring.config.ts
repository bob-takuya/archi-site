/**
 * Network Monitoring Test Configuration
 * 
 * Specialized Playwright configuration for network monitoring tests
 * Optimized for capturing detailed network activity during search operations
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: ['**/search-*-monitoring.spec.ts'],
  
  // Global test timeout for network monitoring
  timeout: 60000,
  
  // Expect timeout for network assertions
  expect: {
    timeout: 10000
  },
  
  // Test execution settings
  fullyParallel: false, // Run sequentially to avoid network interference
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Single worker to ensure consistent network monitoring
  
  // Reporter configuration for network monitoring
  reporter: [
    ['html', { open: 'never', outputFolder: 'test-results/network-monitoring' }],
    ['json', { outputFile: 'test-results/network-monitoring-results.json' }],
    ['line'],
    ['allure-playwright', { outputFolder: 'allure-results' }]
  ],
  
  // Global test setup
  use: {
    // Base URL
    baseURL: process.env.BASE_URL || 'http://localhost:4173',
    
    // Network monitoring settings
    trace: 'retain-on-failure', // Capture traces for failed tests
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    
    // Browser context settings for network monitoring
    viewport: { width: 1280, height: 720 },
    
    // Network-specific settings
    extraHTTPHeaders: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5,ja;q=0.3',
      'Cache-Control': 'no-cache'
    },
    
    // Ignore HTTPS errors for local testing
    ignoreHTTPSErrors: true,
    
    // Extended timeouts for network operations
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },
  
  // Project configurations for different browsers
  projects: [
    {
      name: 'chromium-network-monitoring',
      use: { 
        ...devices['Desktop Chrome'],
        // Enable network domain for detailed monitoring
        launchOptions: {
          args: [
            '--enable-features=NetworkService',
            '--enable-logging=stderr',
            '--log-level=0',
            '--disable-web-security', // For testing purposes only
            '--disable-features=VizDisplayCompositor',
            '--enable-network-logging'
          ]
        }
      },
    },
    
    {
      name: 'firefox-network-monitoring',
      use: { 
        ...devices['Desktop Firefox'],
        launchOptions: {
          firefoxUserPrefs: {
            'devtools.console.stdout.content': true,
            'network.http.logging.enabled': true
          }
        }
      },
    },
    
    {
      name: 'mobile-network-monitoring',
      use: { 
        ...devices['Pixel 5'],
        // Mobile-specific network monitoring
        launchOptions: {
          args: [
            '--enable-features=NetworkService',
            '--enable-logging=stderr',
            '--log-level=0'
          ]
        }
      },
    },
  ],
  
  // Web server for testing
  webServer: {
    command: 'npm run preview',
    port: 4173,
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
  
  // Global setup and teardown
  globalSetup: './tests/config/global-setup.ts',
  globalTeardown: './tests/config/global-teardown.ts',
});