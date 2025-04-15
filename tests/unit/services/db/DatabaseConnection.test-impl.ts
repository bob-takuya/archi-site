/**
 * Test implementation for DatabaseConnection.ts
 * 
 * This file is a testable version of the database connection module
 * that avoids dependencies that are difficult to mock in the test environment.
 */

import { createDbWorker } from 'sql.js-httpvfs';

// Worker and query result types
type WorkerHttpvfs = any;
type QueryResult = { columns: string[], values: any[][] };

// Store for test purposes
const queryCache: Record<string, any> = {};

// Single instance of the database worker
let dbWorkerPromise: Promise<WorkerHttpvfs> | null = null;

// Test util functions
const generateTestCacheKey = (query: string, params: any[]): string => 
  `${query}:${JSON.stringify(params)}`;

const optimizeTestQuery = (query: string): string => query;

/**
 * Get the database worker instance.
 * Creates the worker if it doesn't exist or returns the existing one.
 */
export const getDbWorker = async (): Promise<WorkerHttpvfs> => {
  if (!dbWorkerPromise) {
    console.log('Initializing DB worker...');
    try {
      dbWorkerPromise = createDbWorker(
        [{
          from: "inline" as const,
          config: {
            serverMode: "full",
            url: "/db/archimap.sqlite",
            requestChunkSize: 1024 * 1024
          }
        }],
        "/sqlite.worker.js", 
        "/sql-wasm.wasm"
      );
      console.log('DB worker initialized successfully');
    } catch (error) {
      console.error('DB worker initialization error:', error);
      throw error;
    }
  }
  
  try {
    return (await dbWorkerPromise);
  } catch (error) {
    console.error('Error getting DB worker instance:', error);
    throw error;
  }
};

/**
 * Execute a raw SQL query with parameters.
 * @param query SQL query string
 * @param params Query parameters
 * @returns Query result as an array of rows
 */
export const executeQuery = async (query: string, params: any[] = []): Promise<any[]> => {
  try {
    // Apply query optimization
    const optimizedQuery = optimizeTestQuery(query);
    
    // Generate cache key and check cache
    const cacheKey = generateTestCacheKey(optimizedQuery, params);
    const cachedResult = queryCache[cacheKey];
    
    if (cachedResult !== undefined) {
      console.log(`Using cached result for query: ${optimizedQuery.substring(0, 100)}...`);
      return cachedResult;
    }
    
    console.log(`Executing SQL query: ${optimizedQuery.substring(0, 100)}...`);
    const worker = await getDbWorker();
    const startTime = performance.now();
    const result = await worker.db.exec(optimizedQuery, params);
    const execTime = performance.now() - startTime;
    
    // Log slow queries
    if (execTime > 100) {
      console.log(`Query took ${execTime.toFixed(2)}ms: ${optimizedQuery.substring(0, 100)}...`);
    }
    
    const resultValues = result[0]?.values || [];
    
    // Cache the result
    queryCache[cacheKey] = resultValues;
    
    return resultValues;
  } catch (error) {
    console.error('SQL query execution error:', error);
    throw error;
  }
};

/**
 * Execute a database query with support for caching and named parameters.
 * @param query SQL query string
 * @param params Named or indexed parameters
 * @returns Processed query results as an array of objects
 */
export const queryDatabase = async (
  query: string,
  params: Record<string, any> | any[] = {}
): Promise<any[]> => {
  try {
    const worker = await getDbWorker();
    
    // Apply query optimization
    const optimizedQuery = optimizeTestQuery(query);
    
    // Process parameters for SQL.js format
    let sql = optimizedQuery;
    let values: any[] = [];
    
    if (Array.isArray(params)) {
      // If params is already an array, use as is
      values = params;
    } else if (Object.keys(params).length > 0) {
      // Simply convert object params to array for testing
      sql = sql.replace(/:\w+/g, '?');
      values = Object.values(params);
    }
    
    // Generate a cache key
    const cacheKey = generateTestCacheKey(sql, values);
    
    // Try to get results from cache
    const cachedResult = queryCache[cacheKey];
    if (cachedResult !== undefined) {
      console.log('Using cached query result');
      return cachedResult;
    }
    
    // Execute the query - use exec for compatibility with our mocks
    const result = await worker.db.exec(sql, values);
    
    // Simulate the format of query() result
    const rows = [];
    if (result && result[0]) {
      const { columns, values: rowValues } = result[0];
      if (columns && rowValues) {
        for (const row of rowValues) {
          const obj: Record<string, any> = {};
          columns.forEach((col, i) => {
            obj[col] = row[i];
          });
          rows.push(obj);
        }
      }
    }
    
    // Cache the results
    queryCache[cacheKey] = rows;
    
    return rows;
  } catch (error) {
    console.error('Query execution error:', error);
    throw error;
  }
};

/**
 * Clear the query cache to free memory.
 */
export const clearQueryCache = (): void => {
  if (queryCache) {
    Object.keys(queryCache).forEach(key => {
      delete queryCache[key];
    });
    console.log('Query cache cleared');
  }
};

/**
 * Close the database connection and clear resources.
 */
export const closeDatabase = async (): Promise<void> => {
  if (dbWorkerPromise) {
    try {
      const worker = await dbWorkerPromise;
      if (worker && worker.close) {
        await worker.close();
        console.log('Database connection closed');
      }
      dbWorkerPromise = null;
      clearQueryCache();
    } catch (error) {
      console.error('Database shutdown error:', error);
      throw error;
    }
  }
};