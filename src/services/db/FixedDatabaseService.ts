/**
 * Fixed Database Service - Restores chunked loading with simplified error handling
 * Combines reliable chunked loading (sql.js-httpvfs) with better user experience
 */

const BASE_PATH = '/archi-site';

// Database state management
let worker: any = null;
let database: any = null;
let isInitializing = false;
let initPromise: Promise<any> | null = null;

export enum DatabaseStatus {
  NOT_INITIALIZED = 'not_initialized',
  INITIALIZING = 'initializing',
  READY = 'ready',
  ERROR = 'error',
}

export const getDatabaseStatus = (): DatabaseStatus => {
  if (worker || database) return DatabaseStatus.READY;
  if (isInitializing) return DatabaseStatus.INITIALIZING;
  return DatabaseStatus.NOT_INITIALIZED;
};

/**
 * Try chunked loading first (fast for large files)
 */
async function tryChunkedLoading(): Promise<any> {
  console.log('🚀 Attempting chunked database loading...');
  
  try {
    // Dynamic import of sql.js-httpvfs
    const { createDbWorker } = await import('sql.js-httpvfs');
    
    // Test database config file accessibility
    const configResponse = await fetch(`${BASE_PATH}/db/database-info.json`, { method: 'HEAD' });
    if (!configResponse.ok) {
      throw new Error(`Database config not accessible: ${configResponse.status}`);
    }
    
    console.log('✅ Database config is accessible');
    
    // Use direct chunked configuration
    const dbConfig = [{
      from: "inline",
      config: {
        serverMode: "full", 
        url: `${BASE_PATH}/db/archimap.sqlite`,
        requestChunkSize: 65536
      }
    }];
    
    console.log('🔧 Using chunked config for 12MB database');
    
    // Initialize worker
    const workerUrl = new URL(`${BASE_PATH}/sqlite.worker.js`, window.location.origin);
    const wasmUrl = new URL(`${BASE_PATH}/sql-wasm.wasm`, window.location.origin);
    
    worker = await createDbWorker(dbConfig, workerUrl.toString(), wasmUrl.toString());
    
    console.log('✅ Chunked database worker initialized');
    
    // Test functionality
    const versionResult = await worker.db.exec('SELECT sqlite_version()');
    if (versionResult && versionResult.length > 0) {
      console.log(`🔍 SQLite version: ${versionResult[0].values[0][0]}`);
    }
    
    const countResult = await worker.db.exec("SELECT COUNT(*) FROM ZCDARCHITECTURE");
    if (countResult && countResult.length > 0) {
      console.log(`🏢 Architecture records: ${countResult[0].values[0][0]} (chunked loading)`);
    }
    
    return worker;
  } catch (error) {
    console.warn('⚠️ Chunked loading failed:', error.message);
    throw error;
  }
}

/**
 * Fallback to direct loading (only for smaller databases)
 */
async function tryDirectLoading(): Promise<any> {
  console.log('🚀 Fallback: Direct loading (may be slow for large files)...');
  
  try {
    const sqljs = await import('sql.js');
    const initSqlJs = sqljs.default || sqljs.initSqlJs;
    
    if (typeof initSqlJs !== 'function') {
      throw new Error('sql.js initialization function not found');
    }
    
    const SQL = await initSqlJs({
      locateFile: (file: string) => {
        if (file === 'sql-wasm.wasm') {
          return `${BASE_PATH}/sql-wasm.wasm`;
        }
        return file;
      }
    });
    
    console.log('📥 Downloading 12MB database (this may take time)...');
    const dbResponse = await fetch(`${BASE_PATH}/db/archimap.sqlite`);
    if (!dbResponse.ok) {
      throw new Error(`Failed to download database: ${dbResponse.status}`);
    }
    
    const dbArrayBuffer = await dbResponse.arrayBuffer();
    console.log(`✅ Database downloaded: ${(dbArrayBuffer.byteLength / 1024 / 1024).toFixed(2)} MB`);
    
    database = new SQL.Database(new Uint8Array(dbArrayBuffer));
    
    const countResult = database.exec("SELECT COUNT(*) FROM ZCDARCHITECTURE");
    if (countResult.length > 0) {
      console.log(`🏢 Architecture records: ${countResult[0].values[0][0]} (direct loading)`);
    }
    
    return database;
  } catch (error) {
    console.error('❌ Direct loading failed:', error);
    throw error;
  }
}

/**
 * Initialize database with chunked loading preferred, direct fallback
 */
export const initDatabase = async (): Promise<any> => {
  if (worker || database) {
    return worker || database;
  }
  
  if (initPromise) {
    return initPromise;
  }
  
  isInitializing = true;
  
  initPromise = (async () => {
    try {
      console.log('🚀 Starting database initialization (chunked preferred)...');
      
      // Try chunked loading first (much faster for 12MB file)
      try {
        const result = await tryChunkedLoading();
        console.log('🎉 Chunked loading successful!');
        return result;
      } catch (chunkedError) {
        console.warn('⚠️ Chunked loading failed, trying direct loading:', chunkedError.message);
      }
      
      // Fallback to direct loading
      const result = await tryDirectLoading();
      console.log('🎉 Direct loading successful!');
      return result;
      
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      worker = null;
      database = null;
      throw error;
    } finally {
      isInitializing = false;
      initPromise = null;
    }
  })();
  
  return initPromise;
};

/**
 * Execute SQL query
 */
export const executeQuery = async (query: string, params: any[] = []): Promise<any[]> => {
  if (!worker && !database) {
    await initDatabase();
  }
  
  if (worker) {
    // Use chunked worker
    const result = await worker.db.exec(query, params);
    return result;
  } else if (database) {
    // Use direct database
    const result = database.exec(query, params);
    return result;
  } else {
    throw new Error('Database not initialized');
  }
};

/**
 * Convert query results to objects
 */
export const resultsToObjects = <T = Record<string, any>>(result: any[]): T[] => {
  if (!result || result.length === 0) {
    return [];
  }
  
  const { columns, values } = result[0];
  
  return values.map((row: any[]) => {
    const obj: Record<string, any> = {};
    columns.forEach((col: string, i: number) => {
      obj[col] = row[i];
    });
    return obj as T;
  });
};

/**
 * Get results as objects array
 */
export const getResultsArray = async <T = Record<string, any>>(
  query: string,
  params: any[] = []
): Promise<T[]> => {
  const results = await executeQuery(query, params);
  return resultsToObjects<T>(results);
};

/**
 * Get single result
 */
export const getSingleResult = async <T = Record<string, any>>(
  query: string,
  params: any[] = []
): Promise<T | undefined> => {
  const results = await getResultsArray<T>(query, params);
  return results[0];
};