#!/usr/bin/env node

const https = require('https');
const http = require('http');

const GITHUB_PAGES_URL = 'https://bob-takuya.github.io/archi-site/';

console.log('🔍 Verifying GitHub Pages deployment...');

function checkUrl(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : http;
    
    const req = protocol.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });
    
    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function verifyDeployment() {
  try {
    console.log(`📍 Checking: ${GITHUB_PAGES_URL}`);
    
    const response = await checkUrl(GITHUB_PAGES_URL);
    
    if (response.statusCode === 200) {
      console.log('✅ Site is accessible!');
      console.log(`📊 Status: ${response.statusCode}`);
      console.log(`📄 Content length: ${response.body.length} bytes`);
      
      // Check for key indicators
      if (response.body.includes('日本の建築マップ')) {
        console.log('✅ Title found: Site content is correct');
      } else {
        console.log('⚠️  Title not found: Site content might be incomplete');
      }
      
      if (response.body.includes('assets/')) {
        console.log('✅ Assets referenced: Build artifacts are present');
      } else {
        console.log('⚠️  Assets not found: Build might be incomplete');
      }
      
      // Check database files
      try {
        const dbResponse = await checkUrl(GITHUB_PAGES_URL + 'db/archimap.sqlite');
        if (dbResponse.statusCode === 200) {
          console.log('✅ Database file is accessible');
          console.log(`📊 Database size: ${dbResponse.body.length} bytes`);
        } else {
          console.log(`⚠️  Database file not accessible: ${dbResponse.statusCode}`);
        }
      } catch (dbError) {
        console.log(`⚠️  Database check failed: ${dbError.message}`);
      }
      
      return true;
    } else {
      console.log(`❌ Site returned status: ${response.statusCode}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Error checking site: ${error.message}`);
    return false;
  }
}

// Wait for deployment to complete and then verify
async function waitAndVerify() {
  console.log('⏳ Waiting for deployment to complete...');
  
  for (let i = 0; i < 20; i++) {
    console.log(`🔄 Attempt ${i + 1}/20...`);
    
    const success = await verifyDeployment();
    if (success) {
      console.log('🎉 Deployment verification successful!');
      process.exit(0);
    }
    
    if (i < 19) {
      console.log('⏳ Waiting 30 seconds before next check...');
      await new Promise(resolve => setTimeout(resolve, 30000));
    }
  }
  
  console.log('⏰ Verification timeout. Please check manually.');
  process.exit(1);
}

waitAndVerify().catch(console.error);