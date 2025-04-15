// SQL.js worker configuration for sql.js-httpvfs
// This file must be placed in the public directory for the web worker to load properly

// Determine the base path for assets
// In GitHub Pages, this will be /{repo-name}/
// In development, it will be /
const baseUrl = self.location.pathname.split('/').slice(0, -1).join('/');

// Import required libraries (these will be included in the worker)
// Use versioned CDN URLs for reliability
importScripts('https://cdn.jsdelivr.net/npm/sql.js@1.8.0/dist/sql-wasm.js');
importScripts('https://cdn.jsdelivr.net/npm/sql.js-httpvfs@0.8.12/dist/sqlite.worker.js');

// Worker initialization logic is provided by sql.js-httpvfs
// No additional configuration is needed here as sql.js-httpvfs handles the worker lifecycle
console.log('SQLite worker initialized with base path:', baseUrl);