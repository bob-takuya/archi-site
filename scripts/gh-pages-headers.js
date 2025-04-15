/**
 * GitHub Pages Headers Script
 * 
 * This script adds the necessary Cross-Origin headers for SharedArrayBuffer support
 * in GitHub Pages deployment through _headers file generation.
 * 
 * Cross-Origin-Opener-Policy: same-origin
 * Cross-Origin-Embedder-Policy: require-corp
 * 
 * These headers are crucial for SQL.js-httpvfs to work properly as it uses SharedArrayBuffer.
 */

const fs = require('fs');
const path = require('path');

/**
 * Generate headers file for GitHub Pages
 */
function generateHeaders() {
  console.log('Generating _headers file for GitHub Pages deployment...');
  
  const headersContent = `
# Headers for GitHub Pages deployment
# These are required for SharedArrayBuffer support used by SQL.js

/*
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Embedder-Policy: require-corp
  
# Cache static assets for better performance
/static/*
  Cache-Control: public, max-age=31536000, immutable

# Cache database chunks for better performance
/db/*.chunk
  Cache-Control: public, max-age=31536000, immutable

# Don't cache HTML files
*.html
  Cache-Control: no-cache

# Required database worker files
/sql-wasm.wasm
  Content-Type: application/wasm
  Cache-Control: public, max-age=31536000, immutable

/sqlite.worker.js
  Content-Type: application/javascript
  Cache-Control: public, max-age=31536000, immutable
`;

  // Path for the _headers file in the dist directory
  const headersPath = path.join(__dirname, '../dist/_headers');
  
  try {
    fs.writeFileSync(headersPath, headersContent.trim(), 'utf8');
    console.log('Successfully created _headers file at:', headersPath);
  } catch (error) {
    console.error('Error creating _headers file:', error);
    process.exit(1);
  }
}

// Execute if this script is run directly
if (require.main === module) {
  generateHeaders();
}

module.exports = { generateHeaders };