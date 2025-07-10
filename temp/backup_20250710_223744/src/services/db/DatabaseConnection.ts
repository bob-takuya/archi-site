/**
 * Database Connection Module
 * 
 * This module provides the core database connection and query functionality.
 * It manages the singleton database worker instance and offers basic query methods.
 */

import { createDbWorker } from 'sql.js-httpvfs';
import {
  generateCacheKey,
  getCachedQueryResult,
  cacheQueryResult,
  normalizeQueryParams,
  optimizeQuery,
  analyzeQueryCaching
} from '../../server/utils/queryOptimizer';

// Worker and query result types
type WorkerHttpvfs = any;
type QueryResult = { columns: string[], values: any[][] };
type DbQueryResult = QueryResult[];

// Cache for query results to improve performance
const queryCache: Record<string, any> = {};

// Configuration for the SQLite database worker
const workerConfig: any = {
  from: "inline" as const,
  config: {
    serverMode: "full",
    url: "/db/archimap.sqlite",
    requestChunkSize: 1024 * 1024
  }
};

// Single instance of the database worker
let dbWorkerPromise: Promise<WorkerHttpvfs> | null = null;

/**
 * Get the database worker instance.
 * Creates the worker if it doesn't exist or returns the existing one.
 */
export const getDbWorker = async (): Promise<WorkerHttpvfs> => {
  if (!dbWorkerPromise) {
    console.log('Initializing DB worker...');
    try {
      dbWorkerPromise = createDbWorker(
        [workerConfig],
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
    return (await dbWorkerPromise).db;
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
    const optimizedQuery = optimizeQuery(query);
    
    // Generate cache key and check cache
    const cacheKey = generateCacheKey(optimizedQuery, params);
    const cachedResult = getCachedQueryResult(cacheKey);
    
    if (cachedResult !== undefined) {
      console.log(`Using cached result for query: ${optimizedQuery.substring(0, 100)}...`);
      return cachedResult;
    }
    
    console.log(`Executing SQL query: ${optimizedQuery.substring(0, 100)}...`);
    const worker = await getDbWorker();
    const startTime = performance.now();
    const result = await worker.exec(optimizedQuery, params);
    const execTime = performance.now() - startTime;
    
    // Log slow queries
    if (execTime > 100) {
      console.log(`Query took ${execTime.toFixed(2)}ms: ${optimizedQuery.substring(0, 100)}...`);
    }
    
    const resultValues = result[0]?.values || [];
    
    // Cache the result if appropriate
    const ttl = analyzeQueryCaching(optimizedQuery);
    if (ttl > 0) {
      cacheQueryResult(cacheKey, resultValues, ttl);
    }
    
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
    const optimizedQuery = optimizeQuery(query);
    
    // Process parameters for SQL.js format
    let sql = optimizedQuery;
    let values: any[] = [];
    
    if (Array.isArray(params)) {
      // If params is already an array, use as is
      values = params;
    } else if (Object.keys(params).length > 0) {
      // Normalize named parameters to positional ones
      const normalized = normalizeQueryParams(sql, params);
      sql = normalized.query;
      values = normalized.params;
    }
    
    // Generate a cache key
    const cacheKey = generateCacheKey(sql, values);
    
    // Try to get results from cache
    const cachedResult = getCachedQueryResult(cacheKey);
    if (cachedResult !== undefined) {
      console.log('Using cached query result');
      return cachedResult;
    }
    
    // Execute the query
    const startTime = performance.now();
    let result;
    
    try {
      result = await worker.db.query(sql, values);
    } catch (error) {
      console.error('Error executing query:', error, 'SQL:', sql, 'Values:', values);
      throw error;
    }
    
    const execTime = performance.now() - startTime;
    if (execTime > 100) {
      console.log(`Query took ${execTime.toFixed(2)}ms: ${sql.substring(0, 100)}...`);
    }
    
    // Process results
    const rows = Array.isArray(result) ? result : [];
    
    // Cache the results if appropriate
    const ttl = analyzeQueryCaching(sql);
    if (ttl > 0) {
      cacheQueryResult(cacheKey, rows, ttl);
    }
    
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