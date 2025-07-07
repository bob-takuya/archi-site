#!/usr/bin/env node

/**
 * GitHub Pages Deployment Script
 * Deploys the built application to gh-pages branch
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function log(message) {
  console.log(`[DEPLOY] ${message}`);
}

function executeCommand(command, options = {}) {
  log(`Executing: ${command}`);
  try {
    const result = execSync(command, { 
      stdio: 'inherit', 
      encoding: 'utf8',
      ...options 
    });
    return result;
  } catch (error) {
    console.error(`Error executing command: ${command}`);
    console.error(error.message);
    process.exit(1);
  }
}

async function deployToGhPages() {
  log('Starting GitHub Pages deployment...');
  
  // Check if we're in a git repository
  try {
    executeCommand('git rev-parse --git-dir', { stdio: 'pipe' });
  } catch (error) {
    log('ERROR: Not in a git repository');
    process.exit(1);
  }
  
  // Check if we have uncommitted changes
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    if (status.trim()) {
      log('WARNING: You have uncommitted changes. Consider committing them first.');
      log('Uncommitted changes:');
      console.log(status);
    }
  } catch (error) {
    log('Could not check git status');
  }
  
  // Ensure we're on the main branch
  try {
    const currentBranch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
    if (currentBranch !== 'main') {
      log(`WARNING: You are on branch '${currentBranch}', not 'main'`);
      log('It is recommended to deploy from the main branch');
    }
  } catch (error) {
    log('Could not determine current branch');
  }
  
  // Install dependencies if needed
  if (!fs.existsSync('node_modules')) {
    log('Installing dependencies...');
    executeCommand('npm install --legacy-peer-deps');
  }
  
  // Prepare static database
  log('Preparing static database...');
  executeCommand('mkdir -p public/db');
  try {
    executeCommand('node scripts/prepare-static-db.js');
  } catch (error) {
    log('Database preparation failed, continuing without it...');
  }
  
  // Build the application
  log('Building application...');
  executeCommand('npm run build');
  
  // Verify build output
  if (!fs.existsSync('dist')) {
    log('ERROR: Build output directory "dist" not found');
    process.exit(1);
  }
  
  // Create necessary files for GitHub Pages
  log('Preparing GitHub Pages files...');
  
  // Create .nojekyll file
  fs.writeFileSync(path.join('dist', '.nojekyll'), '');
  log('Created .nojekyll file');
  
  // Create 404.html for SPA routing
  const indexPath = path.join('dist', 'index.html');
  const notFoundPath = path.join('dist', '404.html');
  if (fs.existsSync(indexPath) && !fs.existsSync(notFoundPath)) {
    fs.copyFileSync(indexPath, notFoundPath);
    log('Created 404.html for SPA routing');
  }
  
  // Create CNAME file if needed (for custom domains)
  // fs.writeFileSync(path.join('dist', 'CNAME'), 'your-domain.com');
  
  // Deploy using gh-pages
  log('Deploying to gh-pages branch...');
  try {
    executeCommand('npx gh-pages -d dist -b gh-pages');
    log('✅ Successfully deployed to gh-pages branch!');
    log('🌐 Your site should be available at: https://bob-takuya.github.io/archi-site/');
    log('📝 Note: It may take a few minutes for GitHub Pages to update');
  } catch (error) {
    log('❌ Deployment failed');
    process.exit(1);
  }
}

// Run deployment
deployToGhPages().catch(error => {
  console.error('Deployment failed:', error);
  process.exit(1);
});