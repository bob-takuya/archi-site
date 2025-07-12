const fs = require('fs');

// Read the file
let content = fs.readFileSync('tests/e2e/search-edge-cases.spec.ts', 'utf8');

// Replace all getByPlaceholderText instances
content = content.replace(/page\.getByPlaceholderText\('検索'\)/g, 'page.locator(\'input[placeholder="検索"]\')');

// Replace all getByRole button instances
content = content.replace(/page\.getByRole\('button',\s*\{\s*name:\s*\/search\/i\s*\}\)/g, 'page.locator(\'button[aria-label*="検索"], button:has-text("検索")\')');

// Replace getByText instances
content = content.replace(/page\.getByText\(\/no results found\/i\)/g, 'page.locator(\'text=/no results found/i\')');

// Write back to file
fs.writeFileSync('tests/e2e/search-edge-cases.spec.ts', content);

console.log('Updated Playwright syntax for version 1.53.2');