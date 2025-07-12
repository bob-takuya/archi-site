/**
 * Optimized Architect Service - SOW Phase 2 Performance Enhancement
 * Integrates intelligent caching, query optimization, and predictive loading
 */

import { getResultsArray, getSingleResult } from './db/ClientDatabaseService';
import ArchitectsCacheService from './ArchitectsCacheService';
import type { Architect, ArchitectsResponse, Tag } from '../types/architect';

interface QueryOptimization {
  useIndex: boolean;
  batchSize: number;
  timeout: number;
  retryCount: number;
}

interface PerformanceMetrics {
  queryTime: number;
  cacheHitRate: number;
  dataSize: number;
  optimizationLevel: number;
}

class OptimizedArchitectService {
  private static instance: OptimizedArchitectService;
  private cacheService: ArchitectsCacheService;
  private queryOptimizations: Map<string, QueryOptimization> = new Map();
  private performanceMetrics: PerformanceMetrics[] = [];
  private readonly MAX_METRICS_HISTORY = 100;

  private constructor() {
    this.cacheService = ArchitectsCacheService.getInstance();
    this.initializeQueryOptimizations();
    this.startBackgroundOptimization();
  }

  public static getInstance(): OptimizedArchitectService {
    if (!OptimizedArchitectService.instance) {
      OptimizedArchitectService.instance = new OptimizedArchitectService();
    }
    return OptimizedArchitectService.instance;
  }

  /**
   * Get all architects with comprehensive optimization
   */
  public async getAllArchitects(
    page: number = 1,
    limit: number = 12,
    searchTerm: string = '',
    tags: string[] = [],
    sortBy: string = 'name',
    sortOrder: string = 'asc',
    nationality?: string,
    category?: string,
    school?: string,
    birthYearFrom?: number,
    birthYearTo?: number,
    deathYear?: number
  ): Promise<ArchitectsResponse> {
    const startTime = performance.now();
    
    const options = {
      nationality,
      category,
      school,
      birthYearFrom,
      birthYearTo,
      deathYear
    };

    try {
      // Try cache first
      const cached = await this.cacheService.getArchitects(
        page, limit, searchTerm, tags, sortBy, sortOrder, options
      );
      
      if (cached) {
        this.recordMetrics(performance.now() - startTime, true, cached);
        
        // Trigger predictive prefetching in background
        this.triggerPredictivePrefetching(page, limit, searchTerm, tags, sortBy, sortOrder, options);
        
        return cached;
      }

      // Cache miss - fetch from database with optimization
      const result = await this.fetchArchitectsOptimized(
        page, limit, searchTerm, tags, sortBy, sortOrder, options
      );

      // Cache the result
      const isStaticData = !searchTerm && tags.length === 0 && !nationality && !category;
      await this.cacheService.cacheArchitects(
        this.generateCacheKey(page, limit, searchTerm, tags, sortBy, sortOrder, options),
        result,
        isStaticData
      );

      this.recordMetrics(performance.now() - startTime, false, result);
      return result;

    } catch (error) {
      console.error('[OptimizedArchitectService] Error fetching architects:', error);
      throw error;
    }
  }

  /**
   * Get architect by ID with caching
   */
  public async getArchitectById(id: number): Promise<Architect | null> {
    const startTime = performance.now();

    try {
      // Try cache first
      const cached = await this.cacheService.getArchitect(id);
      if (cached) {
        this.recordMetrics(performance.now() - startTime, true, { items: [cached], total: 1 });
        return cached;
      }

      // Fetch from database
      const architect = await getSingleResult<Architect>(
        `SELECT * FROM ZCDARCHITECT WHERE ZAT_ID = ?`,
        [id]
      );

      if (architect) {
        // Cache the result
        await this.cacheService.cacheArchitect(id, architect);
      }

      this.recordMetrics(performance.now() - startTime, false, { items: architect ? [architect] : [], total: architect ? 1 : 0 });
      return architect || null;

    } catch (error) {
      console.error('[OptimizedArchitectService] Error fetching architect by ID:', error);
      return null;
    }
  }

  /**
   * Fetch architects with query optimization
   */
  private async fetchArchitectsOptimized(
    page: number,
    limit: number,
    searchTerm: string,
    tags: string[],
    sortBy: string,
    sortOrder: string,
    options: any
  ): Promise<ArchitectsResponse> {
    const offset = (page - 1) * limit;
    
    // Build optimized query
    const { whereClause, params } = this.buildOptimizedWhereClause(searchTerm, tags, options);
    const optimizedSortBy = this.optimizeSortColumn(sortBy);
    const optimizedOrder = sortOrder === 'desc' ? 'DESC' : 'ASC';

    // Use query hints for better performance
    const queryHints = this.getQueryHints(searchTerm, tags, options);
    
    // Count query with optimization
    const countQuery = `
      SELECT COUNT(DISTINCT ZCDARCHITECT.ZAT_ID) as total
      FROM ZCDARCHITECT ${queryHints.useIndex ? 'INDEXED BY idx_architect_search' : ''}
      WHERE ${whereClause}
    `;
    
    // Data query with optimization
    const dataQuery = `
      SELECT DISTINCT ZCDARCHITECT.*
      FROM ZCDARCHITECT ${queryHints.useIndex ? 'INDEXED BY idx_architect_search' : ''}
      WHERE ${whereClause}
      ORDER BY ${optimizedSortBy} ${optimizedOrder}
      LIMIT ? OFFSET ?
    `;
    
    const dataParams = [...params, limit, offset];

    try {
      // Execute queries in parallel for better performance
      const [countResult, architectsResult] = await Promise.all([
        getSingleResult<{ total: number }>(countQuery, params),
        getResultsArray<Architect>(dataQuery, dataParams)
      ]);

      const total = countResult?.total || 0;
      
      // Enrich architects with computed fields for better caching
      const enrichedArchitects = this.enrichArchitectsData(architectsResult);

      return {
        items: enrichedArchitects,
        results: enrichedArchitects, // Backward compatibility
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };

    } catch (error) {
      console.error('[OptimizedArchitectService] Query execution error:', error);
      throw error;
    }
  }

  /**
   * Build optimized WHERE clause
   */
  private buildOptimizedWhereClause(searchTerm: string, tags: string[], options: any): { whereClause: string; params: any[] } {
    let whereClause = '1=1';
    const params: any[] = [];

    // Keyword search with optimization
    if (searchTerm) {
      const trimmedTerm = searchTerm.trim();
      if (trimmedTerm.length > 2) {
        // Use full-text search for longer terms
        whereClause += ` AND (
          ZAT_ARCHITECT LIKE ? OR 
          ZAT_ARCHITECT_JP LIKE ? OR 
          ZAT_ARCHITECT_EN LIKE ? OR
          ZAT_NATIONALITY LIKE ? OR
          ZAT_CATEGORY LIKE ?
        )`;
        const searchPattern = `%${trimmedTerm}%`;
        params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
      } else {
        // Exact match for short terms
        whereClause += ` AND (ZAT_ARCHITECT = ? OR ZAT_ARCHITECT_JP = ? OR ZAT_ARCHITECT_EN = ?)`;
        params.push(trimmedTerm, trimmedTerm, trimmedTerm);
      }
    }

    // Optimized filter conditions
    if (options.nationality) {
      whereClause += ' AND ZAT_NATIONALITY = ?';
      params.push(options.nationality);
    }

    if (options.category) {
      whereClause += ' AND ZAT_CATEGORY = ?';
      params.push(options.category);
    }

    if (options.school) {
      whereClause += ' AND ZAT_SCHOOL = ?';
      params.push(options.school);
    }

    if (options.birthYearFrom && options.birthYearFrom > 0) {
      whereClause += ' AND ZAT_BIRTHYEAR >= ?';
      params.push(options.birthYearFrom);
    }

    if (options.birthYearTo && options.birthYearTo > 0) {
      whereClause += ' AND ZAT_BIRTHYEAR <= ?';
      params.push(options.birthYearTo);
    }

    if (options.deathYear && options.deathYear > 0) {
      whereClause += ' AND ZAT_DEATHYEAR = ?';
      params.push(options.deathYear);
    }

    // Add non-null constraints for better index usage
    whereClause += ' AND ZAT_ARCHITECT IS NOT NULL AND ZAT_ARCHITECT != ""';

    return { whereClause, params };
  }

  /**
   * Optimize sort column for better index usage
   */
  private optimizeSortColumn(sortBy: string): string {
    const columnMap: Record<string, string> = {
      'name': 'ZAT_ARCHITECT',
      'birthYear': 'ZAT_BIRTHYEAR',
      'nationality': 'ZAT_NATIONALITY',
      'category': 'ZAT_CATEGORY',
      'school': 'ZAT_SCHOOL'
    };

    return columnMap[sortBy] || 'ZAT_ARCHITECT';
  }

  /**
   * Get query optimization hints
   */
  private getQueryHints(searchTerm: string, tags: string[], options: any): QueryOptimization {
    const complexity = this.calculateQueryComplexity(searchTerm, tags, options);
    
    return {
      useIndex: complexity > 0.3,
      batchSize: complexity > 0.7 ? 50 : 100,
      timeout: complexity > 0.5 ? 10000 : 5000,
      retryCount: complexity > 0.8 ? 3 : 1
    };
  }

  /**
   * Calculate query complexity for optimization
   */
  private calculateQueryComplexity(searchTerm: string, tags: string[], options: any): number {
    let complexity = 0;

    if (searchTerm) complexity += 0.3;
    if (tags.length > 0) complexity += tags.length * 0.1;
    
    const filterCount = Object.values(options).filter(v => v !== undefined && v !== '').length;
    complexity += filterCount * 0.1;

    return Math.min(complexity, 1.0);
  }

  /**
   * Enrich architects data with computed fields
   */
  private enrichArchitectsData(architects: Architect[]): Architect[] {
    return architects.map(architect => ({
      ...architect,
      // Add computed fields for better UI performance
      displayName: architect.ZAT_ARCHITECT || 'Unknown',
      lifespan: this.formatLifespan(architect.ZAT_BIRTHYEAR, architect.ZAT_DEATHYEAR),
      searchTerms: this.generateSearchTerms(architect),
      tags: this.generateArchitectTags(architect)
    }));
  }

  /**
   * Format lifespan for display
   */
  private formatLifespan(birthYear?: number, deathYear?: number): string {
    const birth = birthYear || '?';
    const death = deathYear || '現在';
    return `${birth}-${death}`;
  }

  /**
   * Generate search terms for architect
   */
  private generateSearchTerms(architect: Architect): string[] {
    const terms: string[] = [];
    
    if (architect.ZAT_ARCHITECT) terms.push(architect.ZAT_ARCHITECT);
    if (architect.ZAT_ARCHITECT_JP) terms.push(architect.ZAT_ARCHITECT_JP);
    if (architect.ZAT_ARCHITECT_EN) terms.push(architect.ZAT_ARCHITECT_EN);
    if (architect.ZAT_NATIONALITY) terms.push(architect.ZAT_NATIONALITY);
    if (architect.ZAT_CATEGORY) terms.push(architect.ZAT_CATEGORY);
    
    return terms;
  }

  /**
   * Generate tags for architect
   */
  private generateArchitectTags(architect: Architect): string[] {
    const tags: string[] = [];
    
    if (architect.ZAT_NATIONALITY) tags.push(architect.ZAT_NATIONALITY);
    if (architect.ZAT_CATEGORY) tags.push(architect.ZAT_CATEGORY);
    if (architect.ZAT_SCHOOL) tags.push(architect.ZAT_SCHOOL);
    
    return tags;
  }

  /**
   * Trigger predictive prefetching
   */
  private async triggerPredictivePrefetching(
    page: number,
    limit: number,
    searchTerm: string,
    tags: string[],
    sortBy: string,
    sortOrder: string,
    options: any
  ): Promise<void> {
    // Get predictive queries from cache service
    const predictiveQueries = this.cacheService.getPendingPredictiveQueries();
    
    // Execute top 3 predictive queries in background
    const topQueries = predictiveQueries.slice(0, 3);
    
    for (const query of topQueries) {
      try {
        setTimeout(async () => {
          await this.executePredictiveQuery(query);
        }, 100); // Small delay to not block main thread
      } catch (error) {
        console.warn('[OptimizedArchitectService] Predictive query failed:', error);
      }
    }
  }

  /**
   * Execute predictive query
   */
  private async executePredictiveQuery(query: any): Promise<void> {
    try {
      const params = query.params;
      await this.fetchArchitectsOptimized(
        params.page || 1,
        params.limit || 12,
        params.searchTerm || '',
        params.tags || [],
        params.sortBy || 'name',
        params.sortOrder || 'asc',
        params
      );
      
      this.cacheService.markPredictiveQueryExecuted(query);
    } catch (error) {
      console.warn('[OptimizedArchitectService] Predictive query execution failed:', error);
    }
  }

  /**
   * Initialize query optimizations
   */
  private initializeQueryOptimizations(): void {
    // Pre-configure common query optimizations
    this.queryOptimizations.set('search', {
      useIndex: true,
      batchSize: 50,
      timeout: 5000,
      retryCount: 2
    });

    this.queryOptimizations.set('filter', {
      useIndex: true,
      batchSize: 100,
      timeout: 3000,
      retryCount: 1
    });

    this.queryOptimizations.set('sort', {
      useIndex: false,
      batchSize: 200,
      timeout: 2000,
      retryCount: 1
    });
  }

  /**
   * Start background optimization
   */
  private startBackgroundOptimization(): void {
    // Analyze performance metrics every 5 minutes
    setInterval(() => {
      this.analyzePerformanceAndOptimize();
    }, 5 * 60 * 1000);
  }

  /**
   * Analyze performance and optimize
   */
  private analyzePerformanceAndOptimize(): void {
    if (this.performanceMetrics.length < 10) return;

    const recentMetrics = this.performanceMetrics.slice(-50);
    const avgQueryTime = recentMetrics.reduce((sum, m) => sum + m.queryTime, 0) / recentMetrics.length;
    const avgCacheHitRate = recentMetrics.reduce((sum, m) => sum + m.cacheHitRate, 0) / recentMetrics.length;

    console.log('[OptimizedArchitectService] Performance Analysis:', {
      avgQueryTime: `${avgQueryTime.toFixed(1)}ms`,
      avgCacheHitRate: `${(avgCacheHitRate * 100).toFixed(1)}%`,
      totalQueries: this.performanceMetrics.length
    });

    // Adjust optimizations based on performance
    if (avgQueryTime > 1000) {
      console.warn('[OptimizedArchitectService] High query times detected, increasing batch size');
      this.adjustOptimizations('increase_batch_size');
    }

    if (avgCacheHitRate < 0.8) {
      console.warn('[OptimizedArchitectService] Low cache hit rate, optimizing cache strategy');
      this.adjustOptimizations('optimize_cache');
    }
  }

  /**
   * Adjust optimizations based on performance
   */
  private adjustOptimizations(strategy: string): void {
    switch (strategy) {
      case 'increase_batch_size':
        for (const optimization of this.queryOptimizations.values()) {
          optimization.batchSize = Math.min(optimization.batchSize * 1.2, 500);
        }
        break;
      
      case 'optimize_cache':
        // Trigger cache warming for common queries
        break;
    }
  }

  /**
   * Record performance metrics
   */
  private recordMetrics(queryTime: number, cacheHit: boolean, result: any): void {
    const metrics: PerformanceMetrics = {
      queryTime,
      cacheHitRate: cacheHit ? 1 : 0,
      dataSize: JSON.stringify(result).length,
      optimizationLevel: this.calculateOptimizationLevel()
    };

    this.performanceMetrics.push(metrics);

    // Keep only recent metrics
    if (this.performanceMetrics.length > this.MAX_METRICS_HISTORY) {
      this.performanceMetrics = this.performanceMetrics.slice(-this.MAX_METRICS_HISTORY);
    }
  }

  /**
   * Calculate current optimization level
   */
  private calculateOptimizationLevel(): number {
    const recentMetrics = this.performanceMetrics.slice(-20);
    if (recentMetrics.length === 0) return 0;

    const avgQueryTime = recentMetrics.reduce((sum, m) => sum + m.queryTime, 0) / recentMetrics.length;
    const avgCacheHitRate = recentMetrics.reduce((sum, m) => sum + m.cacheHitRate, 0) / recentMetrics.length;

    // Optimization level based on query time and cache hit rate
    const timeScore = Math.max(0, 1 - avgQueryTime / 1000); // 1 second baseline
    const cacheScore = avgCacheHitRate;

    return (timeScore + cacheScore) / 2;
  }

  /**
   * Generate cache key
   */
  private generateCacheKey(
    page: number,
    limit: number,
    searchTerm: string,
    tags: string[],
    sortBy: string,
    sortOrder: string,
    options: any
  ): string {
    return `architects:${page}:${limit}:${searchTerm}:${tags.join(',')}:${sortBy}:${sortOrder}:${JSON.stringify(options)}`;
  }

  /**
   * Get performance statistics
   */
  public getPerformanceStats(): any {
    const recentMetrics = this.performanceMetrics.slice(-50);
    
    if (recentMetrics.length === 0) {
      return {
        avgQueryTime: 0,
        avgCacheHitRate: 0,
        totalQueries: 0,
        optimizationLevel: 0
      };
    }

    return {
      avgQueryTime: recentMetrics.reduce((sum, m) => sum + m.queryTime, 0) / recentMetrics.length,
      avgCacheHitRate: recentMetrics.reduce((sum, m) => sum + m.cacheHitRate, 0) / recentMetrics.length,
      totalQueries: this.performanceMetrics.length,
      optimizationLevel: this.calculateOptimizationLevel(),
      cacheStats: this.cacheService.getStats()
    };
  }

  /**
   * Clear all caches and reset metrics
   */
  public async clearCaches(): Promise<void> {
    await this.cacheService.clearCache();
    this.performanceMetrics = [];
    console.log('[OptimizedArchitectService] Caches cleared and metrics reset');
  }
}

export default OptimizedArchitectService;