#!/usr/bin/env node

/**
 * Deployment Verification Script
 * Checks if the GitHub Pages deployment is working correctly
 */

const https = require('https');
const http = require('http');

const SITE_URL = 'https://bob-takuya.github.io/archi-site/';
const TIMEOUT = 10000; // 10 seconds

function log(message) {
  console.log(`[VERIFY] ${message}`);
}

function checkUrl(url, timeout = TIMEOUT) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : http;
    const timeoutId = setTimeout(() => {
      reject(new Error(`Request timeout after ${timeout}ms`));
    }, timeout);

    const req = protocol.get(url, (res) => {
      clearTimeout(timeoutId);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
          redirected: res.url !== url
        });
      });
    });

    req.on('error', (err) => {
      clearTimeout(timeoutId);
      reject(err);
    });
  });
}

async function verifyDeployment() {
  log('Starting deployment verification...');
  
  try {
    log(`Checking: ${SITE_URL}`);
    const response = await checkUrl(SITE_URL);
    
    if (response.statusCode === 200) {
      log('✅ Site is accessible!');
      log(`Status: ${response.statusCode}`);
      
      // Check if the response contains expected content
      if (response.body.includes('<div id="root">')) {
        log('✅ React app structure detected');
      } else {
        log('⚠️  React app structure not found in response');
      }
      
      if (response.body.includes('/archi-site/assets/')) {
        log('✅ Assets are correctly referenced with base path');
      } else {
        log('⚠️  Assets may not be correctly referenced');
      }
      
      // Check content type
      const contentType = response.headers['content-type'];
      if (contentType && contentType.includes('text/html')) {
        log('✅ Correct content type: HTML');
      } else {
        log(`⚠️  Unexpected content type: ${contentType}`);
      }
      
      log(`Response size: ${response.body.length} bytes`);
      
      // Test a few more critical paths
      const testPaths = [
        '/archi-site/404.html',
        '/archi-site/assets/'
      ];
      
      for (const path of testPaths) {
        const testUrl = `https://bob-takuya.github.io${path}`;
        try {
          const testResponse = await checkUrl(testUrl);
          if (testResponse.statusCode === 200 || testResponse.statusCode === 403) {
            log(`✅ ${path} - Status: ${testResponse.statusCode}`);
          } else {
            log(`⚠️  ${path} - Status: ${testResponse.statusCode}`);
          }
        } catch (error) {
          log(`❌ ${path} - Error: ${error.message}`);
        }
      }
      
      log('🎉 Deployment verification completed successfully!');
      log('🌐 Your site is live at: https://bob-takuya.github.io/archi-site/');
      
    } else if (response.statusCode === 404) {
      log('❌ Site returned 404 - deployment may have failed');
      log('This could mean:');
      log('  - GitHub Pages is not configured correctly');
      log('  - The gh-pages branch was not created properly');
      log('  - GitHub Pages is still processing the deployment');
      process.exit(1);
      
    } else {
      log(`❌ Unexpected status code: ${response.statusCode}`);
      log('Response headers:', response.headers);
      process.exit(1);
    }
    
  } catch (error) {
    log(`❌ Error checking deployment: ${error.message}`);
    log('This could mean:');
    log('  - The site is not yet deployed');
    log('  - Network connectivity issues');
    log('  - GitHub Pages is still processing');
    log('  - DNS propagation is still in progress');
    
    log('Please wait a few minutes and try again.');
    process.exit(1);
  }
}

// Run verification
verifyDeployment().catch(error => {
  console.error('Verification failed:', error);
  process.exit(1);
});