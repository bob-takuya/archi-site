/**
 * Progressive Database Loading Strategy
 * Implements 2MB + 8MB + on-demand loading for optimal performance
 * 
 * Loading phases:
 * 1. Critical data (2MB) - Essential search indices, popular items
 * 2. Important data (8MB) - Common queries, metadata
 * 3. On-demand data - Loaded as needed based on user interactions
 */

import { createDbWorker } from 'sql.js-httpvfs';
import type { SqliteWorker, WorkerHttpvfs } from 'sql.js-httpvfs/dist/sqlite.worker';
import type { QueryResult, QueryParameter, DbConfig } from '../types/db';
import CacheService from './CacheService';

interface LoadingPhase {
  name: string;
  priority: number;
  maxSize: number; // in bytes
  queries: string[];
  isComplete: boolean;
  progress: number;
}

interface LoadingStats {
  currentPhase: string;
  totalProgress: number;
  loadedSize: number;
  totalSize: number;
  isComplete: boolean;
  errors: string[];
}

class ProgressiveDbLoader {
  private static instance: ProgressiveDbLoader;
  private worker: SqliteWorker<WorkerHttpvfs> | null = null;
  private cache: CacheService;
  private loadingPhases: LoadingPhase[] = [];
  private currentPhaseIndex = 0;
  private stats: LoadingStats;
  private listeners: Array<(stats: LoadingStats) => void> = [];

  // Database configuration for progressive loading
  private readonly DB_CONFIG: DbConfig = {
    from: 'chunks',
    baseUrl: '/db/',
    databaseFile: 'archimap.sqlite',
    suffixFile: 'archimap.sqlite.suffix',
    chunkSize: 64 * 1024, // 64KB chunks
    requestChunkSize: 512 * 1024, // 512KB per request for better control
    cacheSize: 50 * 1024 * 1024, // 50MB cache
  };

  private constructor() {
    this.cache = CacheService.getInstance();
    this.initializeLoadingPhases();
    this.stats = {
      currentPhase: 'initializing',
      totalProgress: 0,
      loadedSize: 0,
      totalSize: 10 * 1024 * 1024, // Estimated 10MB total
      isComplete: false,
      errors: [],
    };
  }

  public static getInstance(): ProgressiveDbLoader {
    if (!ProgressiveDbLoader.instance) {
      ProgressiveDbLoader.instance = new ProgressiveDbLoader();
    }
    return ProgressiveDbLoader.instance;
  }

  /**
   * Initialize the three loading phases
   */
  private initializeLoadingPhases(): void {
    this.loadingPhases = [
      {
        name: 'critical',
        priority: 1,
        maxSize: 2 * 1024 * 1024, // 2MB
        queries: [
          // Essential search indices
          'SELECT name, architect, city, year FROM architecture ORDER BY id LIMIT 100',
          'SELECT DISTINCT architect FROM architecture WHERE architect IS NOT NULL LIMIT 50',
          'SELECT DISTINCT city FROM architecture WHERE city IS NOT NULL LIMIT 30',
          'SELECT id, name FROM architecture WHERE tag LIKE "%受賞%" LIMIT 20',
          // Popular searches cache
          'SELECT * FROM popular_searches ORDER BY frequency DESC LIMIT 20',
        ],
        isComplete: false,
        progress: 0,
      },
      {
        name: 'important',
        priority: 2,
        maxSize: 8 * 1024 * 1024, // 8MB
        queries: [
          // Extended metadata
          'SELECT * FROM architecture ORDER BY id LIMIT 500',
          'SELECT DISTINCT tag FROM architecture WHERE tag IS NOT NULL',
          'SELECT DISTINCT category FROM architecture WHERE category IS NOT NULL',
          'SELECT * FROM architect_profiles LIMIT 100',
          // Geographic data
          'SELECT DISTINCT prefecture FROM architecture WHERE prefecture IS NOT NULL',
          // Temporal data
          'SELECT year, COUNT(*) as count FROM architecture WHERE year > 0 GROUP BY year',
        ],
        isComplete: false,
        progress: 0,
      },
      {
        name: 'on-demand',
        priority: 3,
        maxSize: Infinity, // No limit for on-demand
        queries: [
          // Full dataset loaded as needed
        ],
        isComplete: false,
        progress: 0,
      },
    ];
  }

  /**
   * Start progressive loading
   */
  public async startLoading(): Promise<void> {
    console.log('[ProgressiveDbLoader] Starting progressive database loading...');
    
    try {
      // Initialize database worker
      await this.initializeWorker();
      
      // Load phases sequentially
      for (let i = 0; i < this.loadingPhases.length - 1; i++) { // Skip on-demand phase
        this.currentPhaseIndex = i;
        await this.loadPhase(this.loadingPhases[i]);
      }
      
      this.stats.isComplete = true;
      this.stats.currentPhase = 'complete';
      this.stats.totalProgress = 100;
      this.notifyListeners();
      
      console.log('[ProgressiveDbLoader] Progressive loading completed');
      
    } catch (error) {
      console.error('[ProgressiveDbLoader] Loading failed:', error);
      this.stats.errors.push(error instanceof Error ? error.message : String(error));
      this.notifyListeners();
    }
  }

  /**
   * Initialize database worker
   */
  private async initializeWorker(): Promise<void> {
    if (this.worker) return;

    console.log('[ProgressiveDbLoader] Initializing database worker...');
    
    this.worker = await createDbWorker(
      [{
        from: 'chunks',
        config: {
          serverMode: 'full',
          requestChunkSize: this.DB_CONFIG.requestChunkSize,
          url: `${this.DB_CONFIG.baseUrl}${this.DB_CONFIG.databaseFile}`,
          suffixUrl: `${this.DB_CONFIG.baseUrl}${this.DB_CONFIG.suffixFile}`,
        },
      }],
      () => new Worker('/sqlite.worker.js'),
      this.DB_CONFIG.cacheSize
    );
    
    console.log('[ProgressiveDbLoader] Database worker initialized');
  }

  /**
   * Load a specific phase
   */
  private async loadPhase(phase: LoadingPhase): Promise<void> {
    console.log(`[ProgressiveDbLoader] Starting ${phase.name} phase...`);
    
    this.stats.currentPhase = phase.name;
    let loadedInPhase = 0;
    
    for (let i = 0; i < phase.queries.length; i++) {
      const query = phase.queries[i];
      
      try {
        // Execute query and cache result
        const result = await this.executeAndCache(query, [], phase.name);
        
        // Estimate loaded size (rough approximation)
        const resultSize = this.estimateQueryResultSize(result);
        loadedInPhase += resultSize;
        this.stats.loadedSize += resultSize;
        
        // Update phase progress
        phase.progress = ((i + 1) / phase.queries.length) * 100;
        
        // Update total progress
        const phasesCompleted = this.currentPhaseIndex;
        const currentPhaseProgress = phase.progress / 100;
        const totalPhases = this.loadingPhases.length - 1; // Exclude on-demand
        this.stats.totalProgress = ((phasesCompleted + currentPhaseProgress) / totalPhases) * 100;
        
        this.notifyListeners();
        
        // Stop if phase size limit reached
        if (loadedInPhase >= phase.maxSize) {
          console.log(`[ProgressiveDbLoader] ${phase.name} phase size limit reached`);
          break;
        }
        
        // Add small delay to prevent blocking
        await new Promise(resolve => setTimeout(resolve, 10));
        
      } catch (error) {
        console.error(`[ProgressiveDbLoader] Error in ${phase.name} phase:`, error);
        this.stats.errors.push(`${phase.name}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    phase.isComplete = true;
    console.log(`[ProgressiveDbLoader] ${phase.name} phase completed (${loadedInPhase} bytes)`);
  }

  /**
   * Execute query and cache result with phase tagging
   */
  private async executeAndCache<T = any>(
    query: string,
    params: QueryParameter[] = [],
    phase: string
  ): Promise<QueryResult<T>> {
    if (!this.worker) {
      throw new Error('Database worker not initialized');
    }

    // Check cache first
    const cacheKey = `${phase}:${query}`;
    const cached = await this.cache.get<QueryResult<T>>(cacheKey, params);
    if (cached) {
      return cached;
    }

    try {
      const result = await this.worker.db.exec(query, params);
      const transformedResult: T[] = this.transformQueryResult<T>(result);
      
      const queryResult: QueryResult<T> = {
        success: true,
        data: transformedResult,
        error: null
      };

      // Cache with longer TTL for phase data
      await this.cache.set(cacheKey, queryResult, params, 30 * 60 * 1000); // 30 minutes
      
      return queryResult;
      
    } catch (error) {
      const errorResult: QueryResult<T> = {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : String(error)
      };
      
      return errorResult;
    }
  }

  /**
   * Transform SQL.js result to usable format
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
   * Estimate query result size for progress tracking
   */
  private estimateQueryResultSize(result: QueryResult<any>): number {
    if (!result.success || !result.data) return 0;
    
    try {
      const jsonString = JSON.stringify(result.data);
      return new Blob([jsonString]).size;
    } catch {
      // Fallback estimation
      return result.data.length * 100; // Rough estimate
    }
  }

  /**
   * Load data on-demand based on user queries
   */
  public async loadOnDemand<T = any>(
    query: string,
    params: QueryParameter[] = []
  ): Promise<QueryResult<T>> {
    // Try cache first
    const cached = await this.cache.get<QueryResult<T>>(query, params);
    if (cached) {
      return cached;
    }

    // Execute fresh query
    return this.executeAndCache<T>(query, params, 'on-demand');
  }

  /**
   * Check if critical data is loaded
   */
  public isCriticalDataLoaded(): boolean {
    return this.loadingPhases[0]?.isComplete || false;
  }

  /**
   * Check if important data is loaded
   */
  public isImportantDataLoaded(): boolean {
    return this.loadingPhases[1]?.isComplete || false;
  }

  /**
   * Get current loading stats
   */
  public getStats(): LoadingStats {
    return { ...this.stats };
  }

  /**
   * Add progress listener
   */
  public addProgressListener(listener: (stats: LoadingStats) => void): void {
    this.listeners.push(listener);
  }

  /**
   * Remove progress listener
   */
  public removeProgressListener(listener: (stats: LoadingStats) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Notify all listeners of progress updates
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.stats);
      } catch (error) {
        console.error('[ProgressiveDbLoader] Listener error:', error);
      }
    });
  }

  /**
   * Warm up cache with critical queries
   */
  public async warmUpCache(): Promise<void> {
    if (!this.isCriticalDataLoaded()) {
      console.warn('[ProgressiveDbLoader] Critical data not loaded yet, skipping warm-up');
      return;
    }

    const criticalQueries = [
      { query: 'critical:SELECT name, architect, city, year FROM architecture ORDER BY id LIMIT 100' },
      { query: 'critical:SELECT DISTINCT architect FROM architecture WHERE architect IS NOT NULL LIMIT 50' },
      { query: 'critical:SELECT DISTINCT city FROM architecture WHERE city IS NOT NULL LIMIT 30' },
    ];

    await this.cache.warmUp(criticalQueries);
  }

  /**
   * Get cache statistics
   */
  public getCacheStats() {
    return this.cache.getStats();
  }

  /**
   * Clear all caches
   */
  public async clearCache(): Promise<void> {
    await this.cache.clear();
  }
}

export default ProgressiveDbLoader;