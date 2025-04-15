import { test, expect } from '@playwright/test';

// Simple test to verify our testing setup
test('basic test', async ({ page }) => {
  // Create a simple HTML page with content
  await page.setContent(`
    <html>
      <head>
        <title>Basic Test Page</title>
      </head>
      <body>
        <h1>Testing Setup Works</h1>
        <p>This is a basic test to verify our Playwright setup works correctly.</p>
        <button id="test-button">Click Me</button>
        <div id="result"></div>
        <script>
          document.getElementById('test-button').addEventListener('click', () => {
            document.getElementById('result').textContent = 'Button was clicked!';
          });
        </script>
      </body>
    </html>
  `);
  
  // Verify the content is loaded
  await expect(page.locator('h1')).toHaveText('Testing Setup Works');
  
  // Test interaction
  await page.click('#test-button');
  await expect(page.locator('#result')).toHaveText('Button was clicked!');
  
  // Take a screenshot to verify
  await page.screenshot({ path: 'tests/screenshots/basic-test.png' });
});