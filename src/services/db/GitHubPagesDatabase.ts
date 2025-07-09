/**
 * Simplified database service optimized for GitHub Pages deployment
 * Uses direct sql.js loading without chunking for better compatibility
 */

import initSqlJs from 'sql.js';
import type { SqlJsStatic, Database } from 'sql.js';

// GitHub Pages base path
const BASE_PATH = '/archi-site';

// Database state
let sqlJs: SqlJsStatic | null = null;
let database: Database | null = null;
let initPromise: Promise<void> | null = null;

/**
 * Initialize sql.js and load the database
 */
export async function initGitHubPagesDatabase(): Promise<void> {
  if (database) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      console.log('🚀 Initializing database for GitHub Pages...');
      
      // Initialize sql.js with the WASM file
      if (!sqlJs) {
        sqlJs = await initSqlJs({
          locateFile: (file: string) => {
            if (file === 'sql-wasm.wasm') {
              return `${BASE_PATH}/sql-wasm.wasm`;
            }
            return file;
          }
        });
        console.log('✅ sql.js initialized');
      }

      // Fetch the database file
      console.log(`📥 Downloading database from ${BASE_PATH}/db/archimap.sqlite3...`);
      const response = await fetch(`${BASE_PATH}/db/archimap.sqlite3`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch database: ${response.status} ${response.statusText}`);
      }

      // Show progress if possible
      const contentLength = response.headers.get('content-length');
      if (contentLength) {
        console.log(`📦 Database size: ${(parseInt(contentLength) / 1024 / 1024).toFixed(2)} MB`);
      }

      const buffer = await response.arrayBuffer();
      console.log(`✅ Database downloaded (${buffer.byteLength} bytes)`);

      // Create the database from the buffer
      database = new sqlJs.Database(new Uint8Array(buffer));
      console.log('✅ Database loaded successfully');

      // Test the database
      const testResult = database.exec('SELECT COUNT(*) as count FROM ZCDARCHITECTURE');
      if (testResult && testResult.length > 0) {
        const count = testResult[0].values[0][0];
        console.log(`✅ Database ready with ${count} architecture records`);
      }

    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      database = null;
      sqlJs = null;
      initPromise = null;
      throw error;
    }
  })();

  return initPromise;
}

/**
 * Execute a query on the database
 */
export async function executeGitHubPagesQuery<T = any>(
  sql: string,
  params: any[] = []
): Promise<T[]> {
  await initGitHubPagesDatabase();
  
  if (!database) {
    throw new Error('Database not initialized');
  }

  try {
    const result = database.exec(sql, params);
    
    if (!result || result.length === 0) {
      return [];
    }

    // Convert to array of objects
    const rows: T[] = [];
    const columns = result[0].columns;
    const values = result[0].values;

    for (const value of values) {
      const row: any = {};
      columns.forEach((column, index) => {
        row[column] = value[index];
      });
      rows.push(row as T);
    }

    return rows;
  } catch (error) {
    console.error('Query execution failed:', error);
    throw error;
  }
}

/**
 * Check if database is ready
 */
export function isGitHubPagesDatabaseReady(): boolean {
  return database !== null;
}