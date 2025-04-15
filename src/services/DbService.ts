/**
 * Database Service Facade
 * 
 * This file serves as a facade that re-exports functions from the modular database services.
 * It maintains backward compatibility with any code that imports from this file directly.
 * 
 * Note: New code should import directly from the services/db directory instead.
 */

// Re-export everything from the new modular services
export * from './db';

/**
 * Client-side database service using SQL.js and sql.js-httpvfs
 * This replaces the server-side SQLite implementation for GitHub Pages deployment
 */

import { createDbWorker } from 'sql.js-httpvfs';
import type { SqliteWorker, WorkerHttpvfs } from 'sql.js-httpvfs/dist/sqlite.worker';
import type { QueryResult, QueryParameter, DbConfig } from '../types/db';

// Database configuration
const DB_CONFIG: DbConfig = {
  from: 'chunks',
  baseUrl: '/db/',
  databaseFile: 'archimap.sqlite',
  suffixFile: 'archimap.sqlite.suffix',
  chunkSize: 64 * 1024, // 64KB chunks
  requestChunkSize: 4 * 1024 * 1024, // 4MB per request
  cacheSize: 20 * 1024 * 1024, // 20MB cache size
};

// Create a singleton instance that can be shared across the application
class DbService {
  private static instance: DbService;
  private worker: SqliteWorker<WorkerHttpvfs> | null = null;
  private initPromise: Promise<void> | null = null;
  private isInitializing = false;

  private constructor() {
    // Private constructor for singleton
  }

  /**
   * Get the singleton instance of the DbService
   */
  public static getInstance(): DbService {
    if (!DbService.instance) {
      DbService.instance = new DbService();
    }
    return DbService.instance;
  }

  /**
   * Initialize the database connection
   * This must be called before any queries can be executed
   */
  public async init(): Promise<void> {
    if (this.worker) {
      return Promise.resolve();
    }

    if (this.isInitializing) {
      return this.initPromise!;
    }

    this.isInitializing = true;
    this.initPromise = this.initDatabase();
    return this.initPromise;
  }

  /**
   * Initialize the database worker and connection
   */
  private async initDatabase(): Promise<void> {
    try {
      console.log('Initializing database connection...');
      
      // Create the database worker
      this.worker = await createDbWorker(
        [{
          from: 'chunks',
          config: {
            serverMode: 'full',
            requestChunkSize: DB_CONFIG.requestChunkSize,
            url: `${DB_CONFIG.baseUrl}${DB_CONFIG.databaseFile}`,
            suffixUrl: `${DB_CONFIG.baseUrl}${DB_CONFIG.suffixFile}`,
          },
        }],
        () => new Worker('/sqlite.worker.js'),
        DB_CONFIG.cacheSize
      );
      
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      this.isInitializing = false;
      throw error;
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * Execute a query against the database
   * @param query SQL query string
   * @param params Query parameters
   * @returns Promise with query results
   */
  public async executeQuery<T = any>(
    query: string,
    params: QueryParameter[] = []
  ): Promise<QueryResult<T>> {
    await this.init();
    
    if (!this.worker) {
      throw new Error('Database not initialized. Call init() first.');
    }
    
    try {
      console.log(`Executing query: ${query.slice(0, 100)}${query.length > 100 ? '...' : ''}`);
      const result = await this.worker.db.exec(query, params);
      
      // Transform the result to a more usable format
      const transformedResult: T[] = this.transformQueryResult<T>(result);
      
      return {
        success: true,
        data: transformedResult,
        error: null
      };
    } catch (error) {
      console.error('Query execution failed:', error);
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Execute a query that returns a single row
   * @param query SQL query string
   * @param params Query parameters
   * @returns Promise with a single result or null
   */
  public async executeQuerySingle<T = any>(
    query: string,
    params: QueryParameter[] = []
  ): Promise<T | null> {
    const result = await this.executeQuery<T>(query, params);
    
    if (!result.success || result.data.length === 0) {
      return null;
    }
    
    return result.data[0];
  }

  /**
   * Execute a count query and return the total count
   * @param query SQL count query string (should return a single row with a 'total' column)
   * @param params Query parameters
   * @returns Promise with the count
   */
  public async executeCountQuery(
    query: string,
    params: QueryParameter[] = []
  ): Promise<number> {
    const result = await this.executeQuerySingle<{ total: number }>(query, params);
    return result?.total || 0;
  }

  /**
   * Transform the result from sql.js format to a more usable array of objects
   * @param result The sql.js query result
   * @returns An array of objects with column names as keys
   */
  private transformQueryResult<T>(result: any[]): T[] {
    if (!result || result.length === 0) {
      return [];
    }

    const columns = result[0].columns;
    const values = result[0].values;
    
    return values.map((row: any[]) => {
      const obj: Record<string, any> = {};
      columns.forEach((column: string, index: number) => {
        obj[column] = row[index];
      });
      return obj as T;
    });
  }

  /**
   * Close the database connection when the application is unloaded
   */
  public async close(): Promise<void> {
    if (this.worker) {
      // No explicit close method in sql.js-httpvfs, but we can terminate the worker
      // this.worker.terminate();
      this.worker = null;
    }
  }
}

export default DbService;