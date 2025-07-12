import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/*investigate-architects-tab.spec.ts',
  timeout: 120 * 1000,
  expect: {
    timeout: 10000
  },
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: [['list']],
  use: {
    actionTimeout: 10000,
    baseURL: 'http://localhost:3000/archi-site/',
    trace: 'on',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    navigationTimeout: 30000,
    headless: false, // Run in headed mode
  },
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        headless: false,
      },
    },
  ],
  // Don't start web server since we're using existing dev server
  outputDir: 'temp/playwright-artifacts',
});