/**
 * Simplified Database Service - More reliable database connection
 * Focuses on getting basic functionality working before attempting complex features
 */

// Simple database configuration
const BASE_PATH = '/archi-site';
const DATABASE_URL = `${BASE_PATH}/db/archimap.sqlite`;

// Database state management
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
  if (database) return DatabaseStatus.READY;
  if (isInitializing) return DatabaseStatus.INITIALIZING;
  return DatabaseStatus.NOT_INITIALIZED;
};

/**
 * Initialize database with simple, direct approach
 */
export const initDatabase = async (): Promise<any> => {
  // Return existing database if already initialized
  if (database) {
    return database;
  }
  
  // Return existing promise if already initializing
  if (initPromise) {
    return initPromise;
  }
  
  isInitializing = true;
  
  initPromise = (async () => {
    try {
      console.log('🚀 Starting simple database initialization...');
      
      // Import sql.js
      const sqljs = await import('sql.js');
      const initSqlJs = sqljs.default || sqljs.initSqlJs;
      
      if (typeof initSqlJs !== 'function') {
        throw new Error('sql.js initialization function not found');
      }
      
      // Initialize SQL.js
      const SQL = await initSqlJs({
        locateFile: (file: string) => {
          if (file === 'sql-wasm.wasm') {
            return `${BASE_PATH}/sql-wasm.wasm`;
          }
          return file;
        }
      });
      
      console.log('✅ SQL.js initialized');
      
      // Check if database file exists
      const response = await fetch(DATABASE_URL, { method: 'HEAD' });
      if (!response.ok) {
        throw new Error(`Database file not found: ${response.status}`);
      }
      
      // Download database
      console.log('📥 Downloading database...');
      const dbResponse = await fetch(DATABASE_URL);
      if (!dbResponse.ok) {
        throw new Error(`Failed to download database: ${dbResponse.status}`);
      }
      
      const dbArrayBuffer = await dbResponse.arrayBuffer();
      console.log(`✅ Database downloaded: ${(dbArrayBuffer.byteLength / 1024 / 1024).toFixed(2)} MB`);
      
      // Create database
      database = new SQL.Database(new Uint8Array(dbArrayBuffer));
      
      // Test basic functionality
      const result = database.exec('SELECT COUNT(*) as count FROM ZCDARCHITECTURE LIMIT 1');
      if (result && result.length > 0) {
        console.log(`✅ Database ready with ${result[0].values[0][0]} records`);
      }
      
      return database;
      
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
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
 * Execute a simple SQL query
 */
export const executeQuery = async (query: string, params: any[] = []): Promise<any[]> => {
  if (!database) {
    await initDatabase();
  }
  
  if (!database) {
    throw new Error('Database not initialized');
  }
  
  try {
    const result = database.exec(query, params);
    return result;
  } catch (error) {
    console.error('Query execution error:', error);
    throw error;
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