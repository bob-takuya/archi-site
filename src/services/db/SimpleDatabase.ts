/**
 * Simple, robust database service for GitHub Pages
 * Bypasses sql.js-httpvfs issues with gzip compression
 */

import type { SqlJsStatic, Database } from 'sql.js';

// Base path configuration
const BASE_PATH = import.meta.env.BASE_URL.replace(/\/$/, '');

// Global state
let sqlJsInstance: SqlJsStatic | null = null;
let database: Database | null = null;
let isLoading = false;
let loadPromise: Promise<void> | null = null;

/**
 * Initialize the database with progress tracking
 */
export async function initSimpleDatabase(): Promise<void> {
  if (database) return;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    isLoading = true;
    
    try {
      console.log('🚀 Simple database loading started...');
      
      // Dispatch progress event
      window.dispatchEvent(new CustomEvent('database-status', { 
        detail: { status: 'initializing', message: 'SQL.js を初期化中...' }
      }));

      // Initialize sql.js
      if (!sqlJsInstance) {
        // Dynamic import to handle sql.js properly
        const sqlJsModule = await import('sql.js');
        
        // Handle different export patterns
        const initSqlJs = sqlJsModule.default || sqlJsModule.initSqlJs || sqlJsModule;
        
        if (typeof initSqlJs !== 'function') {
          console.error('Available exports:', Object.keys(sqlJsModule));
          throw new Error('Unable to find SQL.js initialization function');
        }
        
        sqlJsInstance = await initSqlJs({
          locateFile: (file: string) => {
            if (file === 'sql-wasm.wasm') {
              return `${BASE_PATH}/sql-wasm.wasm`;
            }
            return file;
          }
        });
        console.log('✅ SQL.js initialized');
      }

      // Download database with progress
      console.log('📥 Downloading database...');
      window.dispatchEvent(new CustomEvent('database-status', { 
        detail: { status: 'downloading', message: 'データベースをダウンロード中...' }
      }));

      const response = await fetch(`${BASE_PATH}/db/archimap.sqlite3`);
      
      if (!response.ok) {
        throw new Error(`Database download failed: ${response.status}`);
      }

      // Get the response as array buffer (handles gzip automatically)
      const buffer = await response.arrayBuffer();
      const sizeInMB = (buffer.byteLength / 1024 / 1024).toFixed(2);
      
      console.log(`✅ Database downloaded: ${sizeInMB} MB`);
      
      window.dispatchEvent(new CustomEvent('database-status', { 
        detail: { status: 'processing', message: 'データベースを処理中...' }
      }));

      // Create database
      database = new sqlJsInstance.Database(new Uint8Array(buffer));
      
      // Test the database
      const result = database.exec('SELECT COUNT(*) as count FROM ZCDARCHITECTURE');
      const count = result[0]?.values[0]?.[0] || 0;
      
      console.log(`✅ Database ready with ${count} records`);
      
      window.dispatchEvent(new CustomEvent('database-status', { 
        detail: { status: 'ready', message: `${count}件のデータが利用可能`, count }
      }));

    } catch (error) {
      console.error('❌ Database loading failed:', error);
      
      window.dispatchEvent(new CustomEvent('database-status', { 
        detail: { status: 'error', message: 'データベースの読み込みに失敗しました', error: error.message }
      }));
      
      throw error;
    } finally {
      isLoading = false;
    }
  })();

  return loadPromise;
}

/**
 * Execute a SQL query
 */
export async function executeSimpleQuery<T = any>(
  sql: string,
  params: any[] = []
): Promise<T[]> {
  await initSimpleDatabase();
  
  if (!database) {
    throw new Error('Database not available');
  }

  const result = database.exec(sql, params);
  
  if (!result || result.length === 0) {
    return [];
  }

  // Convert to objects
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
}

/**
 * Get single result
 */
export async function executeSimpleQuerySingle<T = any>(
  sql: string,
  params: any[] = []
): Promise<T | null> {
  const results = await executeSimpleQuery<T>(sql, params);
  return results.length > 0 ? results[0] : null;
}

/**
 * Check if database is ready
 */
export function isSimpleDatabaseReady(): boolean {
  return database !== null;
}

/**
 * Check if database is loading
 */
export function isSimpleDatabaseLoading(): boolean {
  return isLoading;
}