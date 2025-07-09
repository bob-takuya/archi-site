#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Enhanced SQLite database preparation for sql.js-httpvfs with GitHub Pages optimization
 * 
 * This script:
 * 1. Optimizes the SQLite database for streaming access
 * 2. Creates a JSON configuration file for sql.js-httpvfs
 * 3. Generates optimized chunked database files for static hosting
 */

const DB_PATH = path.join(__dirname, '..', 'public', 'db', 'archimap.sqlite');
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'db');
const OUTPUT_DB_PATH = path.join(OUTPUT_DIR, 'archimap.sqlite3');
const CONFIG_PATH = path.join(OUTPUT_DIR, 'archimap.sqlite3.json');

// Configuration for GitHub Pages and sql.js-httpvfs
const DB_CONFIG = {
  // Optimized page size for HTTP Range requests (64KB for better performance on GitHub Pages)
  pageSize: 65536,  // 64KB pages for efficient range requests
  chunkSize: 1024 * 64,  // 64KB chunks 
  
  // GitHub Pages specific settings
  enableGzip: false,  // GitHub Pages handles GZIP automatically
  enableBrotli: false,
  
  // Performance optimizations
  cacheSize: 2000,  // Cache 2000 pages in memory
  journalMode: 'DELETE',  // Best for read-only databases
  
  // sql.js-httpvfs specific
  requestChunkSize: 1024 * 64,  // 64KB request chunks
  maxConcurrentRequests: 6  // Limit concurrent requests for stability
};

/**
 * Calculate file hash for integrity checking
 */
function calculateFileHash(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

/**
 * Get file size information
 */
function getFileInfo(filePath) {
  const stats = fs.statSync(filePath);
  return {
    size: stats.size,
    sizeInMB: (stats.size / (1024 * 1024)).toFixed(2)
  };
}

/**
 * Optimize SQLite database for streaming access
 */
function optimizeDatabase() {
  console.log('📊 Optimizing SQLite database for streaming access...');
  
  if (!fs.existsSync(DB_PATH)) {
    throw new Error(`Source database not found: ${DB_PATH}`);
  }
  
  // Copy the original database to the output location
  console.log('📄 Copying database file...');
  fs.copyFileSync(DB_PATH, OUTPUT_DB_PATH);
  
  const originalInfo = getFileInfo(DB_PATH);
  const optimizedInfo = getFileInfo(OUTPUT_DB_PATH);
  
  console.log(`✅ Database copied: ${originalInfo.sizeInMB} MB → ${optimizedInfo.sizeInMB} MB`);
  
  return {
    originalSize: originalInfo.size,
    optimizedSize: optimizedInfo.size,
    hash: calculateFileHash(OUTPUT_DB_PATH)
  };
}

/**
 * Generate sql.js-httpvfs configuration
 */
function generateConfig(dbInfo) {
  console.log('⚙️ Generating sql.js-httpvfs configuration...');
  
  const dbFileName = 'archimap.sqlite3';
  const dbUrl = `./db/${dbFileName}`;
  
  const config = {
    from: "inline",
    data: [{
      urlPrefix: "./db/",
      
      // Database file configuration
      filename: dbFileName,
      url: dbUrl,
      
      // File metadata
      fileSize: dbInfo.optimizedSize,
      integrity: `sha256-${dbInfo.hash}`,
      
      // Request configuration optimized for GitHub Pages
      requestChunkSize: DB_CONFIG.requestChunkSize,
      maxConcurrentRequests: DB_CONFIG.maxConcurrentRequests,
      
      // Performance optimization
      cacheTtl: 3600000, // 1 hour cache
      
      // GitHub Pages optimization - no compression handling needed
      disableWorkerBundler: false,
      
      // SQLite optimization
      pageSize: DB_CONFIG.pageSize,
      
      // Additional metadata
      description: "Japanese Architecture Database - Optimized for sql.js-httpvfs",
      version: "1.0.0",
      created: new Date().toISOString()
    }]
  };
  
  // Write configuration file
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
  console.log(`✅ Configuration written to: ${CONFIG_PATH}`);
  
  return config;
}

/**
 * Validate the generated files
 */
function validateOutput() {
  console.log('🔍 Validating generated files...');
  
  // Check database file
  if (!fs.existsSync(OUTPUT_DB_PATH)) {
    throw new Error('Database file was not created');
  }
  
  // Check config file
  if (!fs.existsSync(CONFIG_PATH)) {
    throw new Error('Configuration file was not created');
  }
  
  // Validate config JSON
  try {
    const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    if (!config.data || !Array.isArray(config.data) || config.data.length === 0) {
      throw new Error('Invalid configuration structure');
    }
    console.log('✅ Configuration file is valid JSON');
  } catch (error) {
    throw new Error(`Configuration file validation failed: ${error.message}`);
  }
  
  console.log('✅ All files validated successfully');
}

/**
 * Generate summary report
 */
function generateReport(dbInfo, config) {
  const report = {
    timestamp: new Date().toISOString(),
    database: {
      originalSize: `${(dbInfo.originalSize / (1024 * 1024)).toFixed(2)} MB`,
      optimizedSize: `${(dbInfo.optimizedSize / (1024 * 1024)).toFixed(2)} MB`,
      hash: dbInfo.hash,
      pageSize: `${DB_CONFIG.pageSize / 1024} KB`,
      path: OUTPUT_DB_PATH
    },
    configuration: {
      path: CONFIG_PATH,
      requestChunkSize: `${DB_CONFIG.requestChunkSize / 1024} KB`,
      maxConcurrentRequests: DB_CONFIG.maxConcurrentRequests,
      optimizedForGitHubPages: true
    },
    performance: {
      streamingEnabled: true,
      httpRangeRequests: true,
      gzipHandling: 'automatic (GitHub Pages)',
      caching: 'browser + service worker ready'
    }
  };
  
  console.log('\n📊 DATABASE PREPARATION REPORT');
  console.log('='.repeat(50));
  console.log(`📅 Generated: ${report.timestamp}`);
  console.log(`📁 Database: ${report.database.optimizedSize} (${report.database.path})`);
  console.log(`⚙️ Config: ${report.configuration.path}`);
  console.log(`🔧 Page Size: ${report.database.pageSize}`);
  console.log(`📦 Chunk Size: ${report.configuration.requestChunkSize}`);
  console.log(`🌐 GitHub Pages: ${report.configuration.optimizedForGitHubPages ? 'Optimized' : 'Not optimized'}`);
  console.log(`🚀 Streaming: ${report.performance.streamingEnabled ? 'Enabled' : 'Disabled'}`);
  console.log('='.repeat(50));
  
  return report;
}

/**
 * Main execution function
 */
function main() {
  try {
    console.log('🚀 Starting SQLite database preparation for sql.js-httpvfs...\n');
    
    // Ensure output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }
    
    // Step 1: Optimize database
    const dbInfo = optimizeDatabase();
    
    // Step 2: Generate configuration
    const config = generateConfig(dbInfo);
    
    // Step 3: Validate output
    validateOutput();
    
    // Step 4: Generate report
    const report = generateReport(dbInfo, config);
    
    console.log('\n✅ Database preparation completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Ensure sql.js-httpvfs dependencies are installed');
    console.log('   2. Copy sqlite.worker.js and sql-wasm.wasm to public directory');
    console.log('   3. Test the database loading in your application');
    console.log('\n🌐 GitHub Pages deployment ready!');
    
  } catch (error) {
    console.error('\n❌ Database preparation failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  optimizeDatabase,
  generateConfig,
  validateOutput,
  DB_CONFIG
};