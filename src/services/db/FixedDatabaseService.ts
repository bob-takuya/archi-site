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
    const sqlJsHttpvfs = await import('sql.js-httpvfs');
    const { createDbWorker } = sqlJsHttpvfs;
    
    // Ensure createDbWorker is available
    if (!createDbWorker || typeof createDbWorker !== 'function') {
      throw new Error('createDbWorker function not found in sql.js-httpvfs module');
    }
    
    // Test database config file accessibility
    const configResponse = await fetch(`${BASE_PATH}/db/database-info.json`, { method: 'HEAD' });
    if (!configResponse.ok) {
      throw new Error(`Database config not accessible: ${configResponse.status}`);
    }
    
    console.log('✅ Database config is accessible');
    
    // Use the existing JSON configuration file
    const dbConfig = [{
      from: "jsonconfig",
      configUrl: `${BASE_PATH}/db/archimap.sqlite3.json`
    }];
    
    console.log('🔧 Using jsonconfig for production-safe loading');
    
    // Initialize worker with absolute URLs
    const publicUrl = window.location.origin;
    const workerUrl = `${publicUrl}${BASE_PATH}/sqlite.worker.js`;
    const wasmUrl = `${publicUrl}${BASE_PATH}/sql-wasm.wasm`;
    
    console.log('📍 Worker URL:', workerUrl);
    console.log('📍 WASM URL:', wasmUrl);
    
    worker = await createDbWorker(dbConfig, workerUrl, wasmUrl)
    
    console.log('✅ Chunked database worker initialized');
    
    // Test functionality with error handling for minification issues
    try {
      const exec = worker.db.exec || worker.db['exec'];
      if (!exec || typeof exec !== 'function') {
        throw new Error('exec method not found on worker.db');
      }
      
      const versionResult = await exec.call(worker.db, 'SELECT sqlite_version()');
      if (versionResult && versionResult.length > 0) {
        console.log(`🔍 SQLite version: ${versionResult[0].values[0][0]}`);
      }
    } catch (versionError) {
      console.warn('⚠️ Version check failed, but continuing:', versionError);
    }
    
    // Test both main tables with error handling
    try {
      const exec = worker.db.exec || worker.db['exec'];
      const archCountResult = await exec.call(worker.db, "SELECT COUNT(*) FROM ZCDARCHITECTURE");
      if (archCountResult && archCountResult.length > 0) {
        console.log(`🏢 Architecture records: ${archCountResult[0].values[0][0]} (chunked loading)`);
      }
    } catch (tableError) {
      console.warn('⚠️ Architecture table check failed:', tableError);
    }
    
    try {
      const exec = worker.db.exec || worker.db['exec'];
      const architectCountResult = await exec.call(worker.db, "SELECT COUNT(*) FROM ZCDARCHITECT");
      if (architectCountResult && architectCountResult.length > 0) {
        console.log(`👤 Architect records: ${architectCountResult[0].values[0][0]} (chunked loading)`);
      }
    } catch (tableError) {
      console.warn('⚠️ Architect table check failed:', tableError);
    }
    
    return worker;
  } catch (error) {
    console.warn('⚠️ Chunked loading failed:', error);
    throw error;
  }
}

/**
 * Fallback to direct loading (only for smaller databases)
 */
async function tryDirectLoading(): Promise<any> {
  console.log('🚀 Fallback: Direct loading (may be slow for large files)...');
  
  try {
    const sqlJsModule = await import('sql.js');
    const initSqlJs = sqlJsModule.default;
    
    if (!initSqlJs || typeof initSqlJs !== 'function') {
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
    
    // Test both main tables
    const archCountResult = database.exec("SELECT COUNT(*) FROM ZCDARCHITECTURE");
    if (archCountResult.length > 0) {
      console.log(`🏢 Architecture records: ${archCountResult[0].values[0][0]} (direct loading)`);
    }
    
    const architectCountResult = database.exec("SELECT COUNT(*) FROM ZCDARCHITECT");
    if (architectCountResult.length > 0) {
      console.log(`👤 Architect records: ${architectCountResult[0].values[0][0]} (direct loading)`);
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
  console.log('🔍 initDatabase called - Current state:', {
    hasWorker: !!worker,
    hasDatabase: !!database,
    isInitializing,
    hasInitPromise: !!initPromise
  });
  
  if (worker || database) {
    console.log('✅ Database already initialized');
    return worker || database;
  }
  
  if (initPromise) {
    console.log('⏳ Database initialization already in progress');
    return initPromise;
  }
  
  isInitializing = true;
  
  initPromise = (async () => {
    try {
      console.log('🚀 Starting database initialization (chunked preferred)...');
      console.log('📍 Current URL:', window.location.href);
      
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
  console.log('📊 executeQuery called:', { query: query.substring(0, 50) + '...', hasWorker: !!worker, hasDatabase: !!database });
  
  if (!worker && !database) {
    console.log('📊 No database connection, initializing...');
    await initDatabase();
  }
  
  if (worker) {
    try {
      // Handle potential minification issues with method names
      const exec = worker.db.exec || worker.db['exec'];
      if (!exec || typeof exec !== 'function') {
        throw new Error('exec method not found on worker.db');
      }
      const result = await exec.call(worker.db, query, params);
      return result;
    } catch (error) {
      console.error('Worker query error:', error);
      throw error;
    }
  } else if (database) {
    try {
      const result = database.exec(query, params);
      return result;
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
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