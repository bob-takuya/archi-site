/**
 * prepare-static-db.js
 * 
 * This script prepares the SQLite database for static deployment with sql.js
 * It processes the database and creates the necessary files for sql.js-httpvfs
 * to efficiently load database chunks on demand.
 */

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Configuration
const SOURCE_DB_PATH = path.join(__dirname, '..', 'Archimap_database.sqlite');
const DEST_DB_PATH = path.join(__dirname, '..', 'public', 'db', 'archimap.sqlite');
const DEST_SUFFIX_PATH = path.join(__dirname, '..', 'public', 'db', 'archimap.sqlite.suffix');
const CHUNK_SIZE = 1024 * 64; // 64KB chunks for efficient loading

console.log('Preparing SQLite database for static deployment...');

// Ensure the destination directory exists
if (!fs.existsSync(path.dirname(DEST_DB_PATH))) {
  fs.mkdirSync(path.dirname(DEST_DB_PATH), { recursive: true });
}

// Create a copy of the database for optimization
const OPTIMIZED_DB_PATH = path.join(__dirname, '..', 'public', 'db', 'temp_optimized.sqlite');
fs.copyFileSync(SOURCE_DB_PATH, OPTIMIZED_DB_PATH);
console.log(`Created temporary database for optimization at ${OPTIMIZED_DB_PATH}`);

// Open the temporary database for optimization
const db = new sqlite3.Database(OPTIMIZED_DB_PATH);

// Helper function for index creation error handling
function handleIndexError(err) {
  if (err) {
    console.error('Error creating index:', err);
    // Don't fail the entire process for a single index failure
    // but log the error for debugging
  }
}

// Add performance optimization function
async function optimizeDatabase() {
  return new Promise((resolve, reject) => {
    try {
      db.serialize(() => {
        console.log('Optimizing database for client-side performance...');
        
        // Set small page size for HTTP range request efficiency (as per blog post)
        db.run('PRAGMA page_size = 1024');
        
        // Enable WAL mode for better performance
        db.run('PRAGMA journal_mode = WAL');
        
        // Run ANALYZE to update statistics
        db.run('ANALYZE');
        
        // Optimize database with VACUUM to apply page size changes
        db.run('VACUUM');
        
        // Create indexes for commonly filtered columns
        console.log('Creating performance indexes...');
        
        // Drop existing indexes if they exist to avoid errors
        db.run(`DROP INDEX IF EXISTS idx_zcdarchitecture_year`);
        db.run(`DROP INDEX IF EXISTS idx_zcdarchitecture_prefecture`);
        db.run(`DROP INDEX IF EXISTS idx_zcdarchitecture_architect`);
        db.run(`DROP INDEX IF EXISTS idx_zcdarchitecture_title`);
        db.run(`DROP INDEX IF EXISTS idx_zcdarchitecture_tag`);
        db.run(`DROP INDEX IF EXISTS idx_zcdarchitecture_category`);
        db.run(`DROP INDEX IF EXISTS idx_zcdarchitecture_geo`);
        db.run(`DROP INDEX IF EXISTS idx_zcdarchitecture_title_eng`);
        db.run(`DROP INDEX IF EXISTS idx_zcdarchitecture_architect_eng`);
        db.run(`DROP INDEX IF EXISTS idx_zcdarchitecture_search`);
        db.run(`DROP INDEX IF EXISTS idx_zcdarchitect_name`);
        db.run(`DROP INDEX IF EXISTS idx_zcdarchitect_name_en`);
        db.run(`DROP INDEX IF EXISTS idx_zcdarchitect_birth_death`);
        
        // Create optimized indexes in a transaction for better performance
        db.run('BEGIN TRANSACTION');
        
        // Basic single column indexes for common filters
        db.run(`CREATE INDEX IF NOT EXISTS idx_zcdarchitecture_year ON ZCDARCHITECTURE(ZAR_YEAR)`, handleIndexError);
        db.run(`CREATE INDEX IF NOT EXISTS idx_zcdarchitecture_prefecture ON ZCDARCHITECTURE(ZAR_PREFECTURE)`, handleIndexError);
        db.run(`CREATE INDEX IF NOT EXISTS idx_zcdarchitecture_architect ON ZCDARCHITECTURE(ZAR_ARCHITECT)`, handleIndexError);
        db.run(`CREATE INDEX IF NOT EXISTS idx_zcdarchitecture_title ON ZCDARCHITECTURE(ZAR_TITLE)`, handleIndexError);
        db.run(`CREATE INDEX IF NOT EXISTS idx_zcdarchitecture_tag ON ZCDARCHITECTURE(ZAR_TAG)`, handleIndexError);
        db.run(`CREATE INDEX IF NOT EXISTS idx_zcdarchitecture_category ON ZCDARCHITECTURE(ZAR_CATEGORY, ZAR_BIGCATEGORY)`, handleIndexError);
        
        // Add English-specific indexes for multilingual search
        db.run(`CREATE INDEX IF NOT EXISTS idx_zcdarchitecture_title_eng ON ZCDARCHITECTURE(ZAR_TITLE_ENG)`, handleIndexError);
        db.run(`CREATE INDEX IF NOT EXISTS idx_zcdarchitecture_architect_eng ON ZCDARCHITECTURE(ZAR_ARCHITECT_ENG)`, handleIndexError);
        
        // Composite index for geospatial queries
        db.run(`CREATE INDEX IF NOT EXISTS idx_zcdarchitecture_geo ON ZCDARCHITECTURE(ZAR_LATITUDE, ZAR_LONGITUDE) 
                WHERE ZAR_LATITUDE IS NOT NULL AND ZAR_LONGITUDE IS NOT NULL`, handleIndexError);
                
        // Composite index for common filtering patterns based on the app usage
        db.run(`CREATE INDEX IF NOT EXISTS idx_zcdarchitecture_search ON ZCDARCHITECTURE(ZAR_PREFECTURE, ZAR_CATEGORY, ZAR_YEAR)`, handleIndexError);
        
        // Architect table indexes for related queries
        db.run(`CREATE INDEX IF NOT EXISTS idx_zcdarchitect_name ON ZCDARCHITECT(ZAT_ARCHITECT)`, handleIndexError);
        db.run(`CREATE INDEX IF NOT EXISTS idx_zcdarchitect_name_en ON ZCDARCHITECT(ZAT_ARCHITECT_EN)`, handleIndexError);
        db.run(`CREATE INDEX IF NOT EXISTS idx_zcdarchitect_birth_death ON ZCDARCHITECT(ZAT_BIRTHYEAR, ZAT_DEATHYEAR)`, handleIndexError);
        
        // Commit transaction
        db.run('COMMIT', (err) => {
          if (err) {
            console.error('Error committing index transaction:', err);
            db.run('ROLLBACK');
            reject(err);
            return;
          }
          console.log('Indexes created successfully');
          
          // Final optimization
          db.run('PRAGMA optimize', (err) => {
            if (err) {
              console.error('Error optimizing database:', err);
              // According to development guidelines, we should provide better error handling
              // and ensure the process fails properly when there are critical errors
              reject(err);
            } else {
              console.log('Database optimization complete');
            }
            
            // Close the database connection
            db.close((err) => {
              if (err) {
                console.error('Error closing database:', err);
                reject(err);
              } else {
                // Use the optimized database as the final version
                fs.copyFileSync(OPTIMIZED_DB_PATH, DEST_DB_PATH);
                console.log(`Optimized database copied to ${DEST_DB_PATH}`);
                
                // Remove temporary file
                fs.unlinkSync(OPTIMIZED_DB_PATH);
                console.log('Temporary database removed');
                
                resolve();
              }
            });
          });
        });
      });
    } catch (error) {
      console.error('Error in database optimization:', error);
      reject(error);
    }
  });
}

/**
 * Split the SQLite database into chunks for sql.js-httpvfs
 * @param {string} dbPath Path to the SQLite database
 * @param {string} outputDir Directory to write chunks
 * @param {Object} options Options for chunking
 * @param {number} options.chunkSize Size of each chunk in bytes
 */
function splitDatabaseIntoChunks(dbPath, outputDir, options = {}) {
  console.log(`Splitting database into chunks: ${dbPath}...`);
  
  const chunkSize = options.chunkSize || 1024 * 64; // Default 64KB
  const dbBuffer = fs.readFileSync(dbPath);
  const dbSize = dbBuffer.length;
  const chunkCount = Math.ceil(dbSize / chunkSize);
  
  console.log(`Database size: ${(dbSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Chunk size: ${(chunkSize / 1024).toFixed(2)} KB`);
  console.log(`Total chunks: ${chunkCount}`);
  
  // Create chunks directory
  const chunksDir = path.join(outputDir, 'chunks');
  if (!fs.existsSync(chunksDir)) {
    fs.mkdirSync(chunksDir, { recursive: true });
  }
  
  // Split database into chunks
  const chunks = [];
  for (let i = 0; i < chunkCount; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, dbSize);
    const chunk = dbBuffer.slice(start, end);
    
    const chunkPath = path.join(chunksDir, `chunk_${i.toString().padStart(6, '0')}.bin`);
    fs.writeFileSync(chunkPath, chunk);
    
    chunks.push({
      index: i,
      size: chunk.length,
      path: path.relative(outputDir, chunkPath),
      start: start,
      end: end
    });
    
    if (i % 100 === 0) {
      console.log(`Created chunk ${i + 1}/${chunkCount}`);
    }
  }
  
  console.log(`Successfully created ${chunks.length} chunks`);
  return chunks;
}

/**
 * Create a suffix file for the SQLite database
 * This implements the functionality needed by sql.js-httpvfs
 * @param {string} dbPath Path to the SQLite database
 * @param {string} suffixPath Path to write the suffix file
 * @param {Array} chunks Array of chunk information
 * @param {Object} options Options for suffix file creation
 * @param {number} options.chunkSize Size of each chunk in bytes
 */
function createSuffixFile(dbPath, suffixPath, chunks, options = {}) {
  console.log(`Creating suffix file for ${dbPath}...`);
  
  const chunkSize = options.chunkSize || 1024 * 64; // Default 64KB
  const dbSize = fs.statSync(dbPath).size;
  
  // Create a suffix file that contains metadata about the database
  // Format required by sql.js-httpvfs
  const suffixData = {
    // Database size in bytes
    size: dbSize,
    // Page size (usually 4096 or 8192 bytes)
    pageSize: 4096,
    // Chunk size used for chunked access
    chunkSize: chunkSize,
    // URL to the SQLite database (relative path for GitHub Pages)
    url: 'archimap.sqlite',
    // Total number of chunks
    chunkCount: chunks.length,
    // Chunk information for sql.js-httpvfs
    chunks: chunks.map(chunk => ({
      index: chunk.index,
      size: chunk.size,
      url: chunk.path,
      start: chunk.start,
      end: chunk.end
    })),
    // Version of the suffix file format
    version: 1,
    // Additional metadata
    metadata: {
      created: new Date().toISOString(),
      originalSize: dbSize,
      totalChunks: chunks.length,
      avgChunkSize: Math.round(dbSize / chunks.length)
    }
  };
  
  // Write the suffix file
  fs.writeFileSync(suffixPath, JSON.stringify(suffixData, null, 2));
  console.log(`Created suffix file at ${suffixPath}`);
  
  return suffixData;
}

// Execute database optimization and then create suffix file
async function prepareDatabase() {
  try {
    await optimizeDatabase();
    
    // Get the database size
    const stats = fs.statSync(DEST_DB_PATH);
    const dbSize = stats.size;
    
    console.log(`Optimized database size: ${(dbSize / 1024 / 1024).toFixed(2)} MB`);
    
    // For sql.js-httpvfs, we don't need manual chunking - it uses HTTP range requests
    // Just create a simple info file for reference
    const infoData = {
      database: path.basename(DEST_DB_PATH),
      size: dbSize,
      pageSize: 1024, // Small page size for efficient range requests
      optimizedFor: 'sql.js-httpvfs HTTP range requests',
      date: new Date().toISOString()
    };
    
    fs.writeFileSync(
      path.join(path.dirname(DEST_DB_PATH), 'database-info.json'),
      JSON.stringify(infoData, null, 2)
    );
    
    // Analyze and log database structure for reference
    const finalDb = new sqlite3.Database(DEST_DB_PATH);
    
    finalDb.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
      if (err) {
        console.error('Error analyzing tables:', err);
        return;
      }
      
      console.log(`Found ${tables.length} tables`);
      const tableNames = tables.map(t => t.name).join(', ');
      console.log(`Tables: ${tableNames}`);
      
      // Get index information
      finalDb.all("SELECT name FROM sqlite_master WHERE type='index'", (err, indexes) => {
        if (err) {
          console.error('Error analyzing indexes:', err);
          return;
        }
        
        console.log(`Found ${indexes.length} indexes`);
        
        // Create helpful index file for reference
        const indexContent = {
          database: path.basename(DEST_DB_PATH),
          suffix: path.basename(DEST_SUFFIX_PATH),
          tables: tables.map(t => t.name),
          indexes: indexes.map(i => i.name),
          size: dbSize,
          chunkSize: CHUNK_SIZE,
          chunks: Math.ceil(dbSize / CHUNK_SIZE),
          date: new Date().toISOString()
        };
        
        fs.writeFileSync(
          path.join(path.dirname(DEST_DB_PATH), 'database-info.json'),
          JSON.stringify(indexContent, null, 2)
        );
        
        finalDb.close();
        console.log('Database preparation complete.');
      });
    });
  } catch (error) {
    console.error('Error preparing database for static deployment:', error);
    process.exit(1);
  }
}

// Run the database preparation process
prepareDatabase();