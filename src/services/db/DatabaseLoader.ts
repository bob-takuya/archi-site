/**
 * Database loader service that handles database initialization
 * This service ensures the database is properly loaded before allowing queries
 */

import { createDbWorker } from 'sql.js-httpvfs';
import type { SqliteWorker, WorkerHttpvfs } from 'sql.js-httpvfs/dist/sqlite.worker';
import { 
  getCachedQuery, 
  generateCacheKey,
  clearCacheItem,
  clearCache 
} from './DatabaseCache';

// Singleton instance to avoid multiple database initializations
let dbWorker: SqliteWorker<WorkerHttpvfs> | null = null;
let initPromise: Promise<SqliteWorker<WorkerHttpvfs>> | null = null;

// Determine the base path for assets
// In production (GitHub Pages), the base path is /archi-site/
// In development with Vite, the base path is also /archi-site/ due to vite.config.ts
const BASE_PATH = import.meta.env.BASE_URL.replace(/\/$/, '');

/**
 * Initialize the database connection
 * This must be called before any SQL queries can be executed
 */
export async function initDatabase(): Promise<SqliteWorker<WorkerHttpvfs>> {
  // Return existing worker if already initialized
  if (dbWorker) {
    return dbWorker;
  }

  // Return existing initialization promise if already in progress
  if (initPromise) {
    return initPromise;
  }

  console.log(`Initializing database from ${BASE_PATH}/db/archimap.sqlite`);

  // Load database metadata for precise configuration
  let dbConfig;
  try {
    const dbInfoResponse = await fetch(`${BASE_PATH}/db/database-info.json`);
    if (dbInfoResponse.ok) {
      const dbInfo = await dbInfoResponse.json();
      console.log(`Database info loaded - size: ${dbInfo.size} bytes, chunks: ${dbInfo.chunks}`);
      
      dbConfig = {
        serverMode: 'full',
        requestChunkSize: dbInfo.chunkSize || 65536, // Use actual chunk size
        url: `${BASE_PATH}/db/archimap.sqlite`,
        suffixUrl: `${BASE_PATH}/db/archimap.sqlite.suffix`,
        // Explicitly specify the uncompressed size for GitHub Pages compatibility
        size: dbInfo.size,
        maxBytesToRead: dbInfo.size,
      };
    } else {
      throw new Error('Could not load database metadata');
    }
  } catch (error) {
    console.warn('Could not load database metadata, using fallback configuration:', error);
    // Fallback configuration with known values
    dbConfig = {
      serverMode: 'full',
      requestChunkSize: 65536, // 64KB chunks
      url: `${BASE_PATH}/db/archimap.sqlite`,
      suffixUrl: `${BASE_PATH}/db/archimap.sqlite.suffix`,
      size: 12730368, // Known database size
      maxBytesToRead: 12730368,
    };
  }

  // Initialize the database with optimized configuration for GitHub Pages
  initPromise = createDbWorker(
    [{
      from: 'chunks',
      config: dbConfig,
    }],
    `${BASE_PATH}/sqlite.worker.js`,
    `${BASE_PATH}/sql-wasm.wasm`,
  ).then(worker => {
    dbWorker = worker;
    console.log('Database initialized successfully');
    return worker;
  }).catch(error => {
    console.error('Database initialization failed:', error);
    initPromise = null;
    throw error;
  });

  return initPromise;
}

/**
 * Execute a SQL query with parameters
 * @param sql SQL query to execute
 * @param params Query parameters
 * @param useCache Whether to use caching (default true)
 * @returns Query results
 */
export async function executeQuery<T = any>(
  sql: string,
  params: any[] = [],
  useCache: boolean = true
): Promise<T[]> {
  // Generate cache key if caching is enabled
  const cacheKey = useCache ? generateCacheKey(sql, params) : '';
  
  // Use the caching layer if enabled
  if (useCache) {
    return getCachedQuery<T[]>(
      cacheKey,
      () => executeQueryDirect<T>(sql, params),
      // Determine appropriate TTL based on query type
      // SELECT queries can be cached longer than others
      sql.trim().toLowerCase().startsWith('select') ? 300000 : 60000
    );
  }
  
  // Execute directly without caching
  return executeQueryDirect<T>(sql, params);
}

/**
 * Direct execution of SQL query without caching
 * @param sql SQL query to execute
 * @param params Query parameters
 * @returns Query results
 */
async function executeQueryDirect<T = any>(
  sql: string,
  params: any[] = []
): Promise<T[]> {
  const worker = await initDatabase();
  try {
    const result = await worker.db.exec(sql, params);
    if (!result || result.length === 0) {
      return [];
    }

    // Transform sql.js result format to array of objects
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
    console.error('SQL:', sql);
    console.error('Params:', params);
    throw error;
  }
}

/**
 * Execute a SQL query and return a single result
 * @param sql SQL query to execute
 * @param params Query parameters
 * @param useCache Whether to use caching (default true)
 * @returns Single query result or null
 */
export async function executeQuerySingle<T = any>(
  sql: string,
  params: any[] = [],
  useCache: boolean = true
): Promise<T | null> {
  const results = await executeQuery<T>(sql, params, useCache);
  return results.length > 0 ? results[0] : null;
}

/**
 * Check if the database is available by executing a simple query
 * @returns True if database is available, false otherwise
 */
export async function isDatabaseAvailable(): Promise<boolean> {
  try {
    const worker = await initDatabase();
    const result = await worker.db.exec('SELECT 1');
    return result && result.length > 0;
  } catch (error) {
    console.error('Database availability check failed:', error);
    return false;
  }
}

/**
 * Clear the query cache
 * @param specific Optional specific cache key to clear
 */
export function clearQueryCache(specific?: string): void {
  if (specific) {
    clearCacheItem(specific);
  } else {
    clearCache();
  }
}

/**
 * Export database service utilities
 */
export { getCachedQuery, generateCacheKey };