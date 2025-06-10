/**
 * Static Database Service
 * 
 * A singleton service for client-side database operations using SQL.js and httpvfs.
 * This service is designed for GitHub Pages compatibility, running entirely in the browser.
 */

import { createDbWorker } from 'sql.js-httpvfs';

// Type definitions
type WorkerHttpvfs = any;
type QueryResult = { columns: string[], values: any[][] };
type DbQueryResult = QueryResult[];

// Worker configuration for loading SQLite database over HTTP
const workerConfig = {
  from: "inline" as const,
  config: {
    serverMode: "full",
    url: "/db/archimap.sqlite",
    requestChunkSize: 1024 * 1024
  }
};

/**
 * StaticDatabaseService provides a client-side database service using SQL.js-httpvfs.
 * It implements a singleton pattern to ensure only one database connection is used.
 */
export class StaticDatabaseService {
  private static instance: StaticDatabaseService;
  private worker: WorkerHttpvfs | null = null;
  private dbWorkerPromise: Promise<WorkerHttpvfs> | null = null;
  private queryCache: Map<string, { data: any, timestamp: number, ttl: number }> = new Map();
  
  /**
   * Private constructor to enforce the singleton pattern
   */
  private constructor() {}
  
  /**
   * Get the singleton instance of StaticDatabaseService
   */
  public static getInstance(): StaticDatabaseService {
    if (!StaticDatabaseService.instance) {
      StaticDatabaseService.instance = new StaticDatabaseService();
    }
    return StaticDatabaseService.instance;
  }

  /**
   * Reset the singleton instance (primarily for testing)
   */
  public static resetInstance(): void {
    if (StaticDatabaseService.instance) {
      StaticDatabaseService.instance.worker = null;
      StaticDatabaseService.instance.dbWorkerPromise = null;
    }
    // @ts-ignore allow clearing private field
    StaticDatabaseService.instance = undefined;
  }
  
  /**
   * Initialize the database connection using SQL.js worker
   */
  public async initDatabase(): Promise<WorkerHttpvfs> {
    if (!this.dbWorkerPromise) {
      console.log('Initializing DB worker...');
      try {
        this.dbWorkerPromise = createDbWorker(
          [workerConfig],
          "/sqlite.worker.js", 
          "/sql-wasm.wasm"
        );
        console.log('DB worker initialized successfully');
      } catch (error) {
        console.error('DB worker initialization error:', error);
        this.dbWorkerPromise = null;
        throw error;
      }
    }
    
    try {
      const result = await this.dbWorkerPromise;
      this.worker = result.db;
      return this.worker;
    } catch (error) {
      console.error('Error getting DB worker instance:', error);
      throw error;
    }
  }
  
  /**
   * Generate a cache key from a query and parameters
   */
  private generateCacheKey(query: string, params: any[] = []): string {
    return `${query}:${JSON.stringify(params)}`;
  }
  
  /**
   * Get a result from the cache if available and not expired
   */
  private getCachedResult(key: string): any | undefined {
    const entry = this.queryCache.get(key);
    if (!entry) return undefined;
    
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.queryCache.delete(key);
      return undefined;
    }
    
    return entry.data;
  }
  
  /**
   * Cache a query result with a specified TTL
   */
  private cacheResult(key: string, data: any, ttl: number = 60000): void {
    this.queryCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }
  
  /**
   * Analyze a query to determine if it should be cached and for how long
   */
  private analyzeQueryCaching(query: string): number {
    // Read-only queries (SELECT) can be cached longer
    if (query.trim().toUpperCase().startsWith('SELECT')) {
      if (query.includes('ZCDARCHITECTURE') || query.includes('ZCDARCHITECT')) {
        return 5 * 60 * 1000; // 5 minutes for main tables
      }
      return 60 * 1000; // 1 minute for other queries
    }
    
    // Don't cache write operations
    return 0;
  }
  
  /**
   * Execute a raw SQL query with parameters
   */
  public async executeQuery(query: string, params: any[] = []): Promise<DbQueryResult> {
    if (!this.worker) {
      await this.initDatabase();
    }
    
    // Check cache for this query
    const cacheKey = this.generateCacheKey(query, params);
    const cachedResult = this.getCachedResult(cacheKey);
    if (cachedResult !== undefined) {
      console.log(`Using cached result for query: ${query.substring(0, 100)}...`);
      return cachedResult;
    }
    
    try {
      console.log(`Executing SQL query: ${query.substring(0, 100)}...`);
      const startTime = performance.now();
      const result = await this.worker.exec(query, params);
      const execTime = performance.now() - startTime;
      
      // Log slow queries
      if (execTime > 100) {
        console.log(`Query took ${execTime.toFixed(2)}ms: ${query.substring(0, 100)}...`);
      }
      
      // Cache the result if appropriate
      const ttl = this.analyzeQueryCaching(query);
      if (ttl > 0) {
        this.cacheResult(cacheKey, result, ttl);
      }
      
      return result;
    } catch (error) {
      console.error('SQL query execution error:', error);
      throw error;
    }
  }
  
  /**
   * Convert SQL result to an array of objects
   */
  private resultToObjects(result: QueryResult | undefined): any[] {
    if (!result || !result.columns || !result.values) return [];
    
    const { columns, values } = result;
    return values.map(row => {
      const obj: Record<string, any> = {};
      columns.forEach((col, i) => {
        obj[col] = row[i];
      });
      return obj;
    });
  }
  
  /**
   * Get all architectures with pagination, search and filters
   */
  public async getAllArchitectures(
    page: number = 1, 
    pageSize: number = 10,
    searchTerm: string = '',
    filters: Record<string, any> = {}
  ): Promise<{ data: any[], total: number }> {
    const offset = (page - 1) * pageSize;
    
    // Build the WHERE clause
    let whereClause = '';
    const params: any[] = [];
    
    if (searchTerm) {
      whereClause = `WHERE (ZAA_NAME LIKE ? OR ZAA_PREFECTURE LIKE ? OR ZAA_CITY LIKE ?)`;
      params.push(`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`);
    }
    
    // Add filters to WHERE clause
    if (Object.keys(filters).length > 0) {
      if (whereClause === '') {
        whereClause = 'WHERE ';
      } else {
        whereClause += ' AND ';
      }
      
      const filterClauses: string[] = [];
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (key === 'yearRange') {
            if (value.from) {
              filterClauses.push('ZAA_YEAR >= ?');
              params.push(value.from);
            }
            if (value.to) {
              filterClauses.push('ZAA_YEAR <= ?');
              params.push(value.to);
            }
          } else {
            filterClauses.push(`${key} = ?`);
            params.push(value);
          }
        }
      });
      
      whereClause += filterClauses.join(' AND ');
    }
    
    // Get total count
    const countQuery = `SELECT COUNT(*) AS total FROM ZCDARCHITECTURE ${whereClause}`;
    const countResult = await this.executeQuery(countQuery, params);
    const total = countResult[0]?.values[0][0] || 0;
    
    // Get data with pagination
    const dataQuery = `
      SELECT * FROM ZCDARCHITECTURE 
      ${whereClause} 
      ORDER BY ZAA_NAME ASC 
      LIMIT ? OFFSET ?
    `;
    
    const dataParams = [...params, pageSize, offset];
    const dataResult = await this.executeQuery(dataQuery, dataParams);
    const data = this.resultToObjects(dataResult[0]);
    
    return { data, total };
  }
  
  /**
   * Get a specific architecture by ID
   */
  public async getArchitectureById(id: number): Promise<any | null> {
    const query = `SELECT * FROM ZCDARCHITECTURE WHERE ZAA_ID = ?`;
    const result = await this.executeQuery(query, [id]);
    
    if (!result[0] || result[0].values.length === 0) {
      return null;
    }
    
    return this.resultToObjects(result[0])[0];
  }
  
  /**
   * Get a specific architect by ID
   */
  public async getArchitectById(id: number): Promise<any | null> {
    const query = `SELECT * FROM ZCDARCHITECT WHERE ZAR_ID = ?`;
    const result = await this.executeQuery(query, [id]);
    
    if (!result[0] || result[0].values.length === 0) {
      return null;
    }
    
    return this.resultToObjects(result[0])[0];
  }
  
  /**
   * Get all architects with pagination and search
   */
  public async getAllArchitects(
    page: number = 1,
    pageSize: number = 10,
    searchTerm: string = ''
  ): Promise<{ data: any[], total: number }> {
    const offset = (page - 1) * pageSize;
    
    // Build the query
    let whereClause = '';
    const params: any[] = [];
    
    if (searchTerm) {
      whereClause = `WHERE (ZAR_NAME LIKE ? OR ZAR_NATIONALITY LIKE ?)`;
      params.push(`%${searchTerm}%`, `%${searchTerm}%`);
    }
    
    // Get total count
    const countQuery = `SELECT COUNT(*) AS total FROM ZCDARCHITECT ${whereClause}`;
    const countResult = await this.executeQuery(countQuery, params);
    const total = countResult[0]?.values[0][0] || 0;
    
    // Get data with pagination
    const dataQuery = `
      SELECT * FROM ZCDARCHITECT 
      ${whereClause} 
      ORDER BY ZAR_NAME ASC 
      LIMIT ? OFFSET ?
    `;
    
    const dataParams = [...params, pageSize, offset];
    const dataResult = await this.executeQuery(dataQuery, dataParams);
    const data = this.resultToObjects(dataResult[0]);
    
    return { data, total };
  }
  
  /**
   * Get architectures designed by a specific architect
   */
  public async getArchitecturesByArchitect(
    architectId: number,
    page: number = 1,
    pageSize: number = 10
  ): Promise<{ data: any[], total: number }> {
    const offset = (page - 1) * pageSize;
    
    // Get total count
    const countQuery = `
      SELECT COUNT(*) AS total 
      FROM ZCDARCHITECTURE 
      WHERE ZAA_ARCHITECT_ID = ?
    `;
    const countResult = await this.executeQuery(countQuery, [architectId]);
    const total = countResult[0]?.values[0][0] || 0;
    
    // Get data with pagination
    const dataQuery = `
      SELECT * FROM ZCDARCHITECTURE 
      WHERE ZAA_ARCHITECT_ID = ? 
      ORDER BY ZAA_YEAR DESC 
      LIMIT ? OFFSET ?
    `;
    
    const dataResult = await this.executeQuery(dataQuery, [architectId, pageSize, offset]);
    const data = this.resultToObjects(dataResult[0]);
    
    return { data, total };
  }
  
  /**
   * Clear the query cache
   */
  public clearCache(): void {
    this.queryCache.clear();
    console.log('Query cache cleared');
  }
  
  /**
   * Close the database connection and clean up resources
   */
  public async closeDatabase(): Promise<void> {
    if (this.worker) {
      try {
        await this.worker.close();
        this.worker = null;
        this.dbWorkerPromise = null;
        this.clearCache();
        console.log('Database connection closed');
      } catch (error) {
        console.error('Error closing database:', error);
        throw error;
      }
    }
  }
}