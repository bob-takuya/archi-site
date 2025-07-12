/**
 * Architects Cache Service - SOW Phase 2 Performance Optimization
 * Specialized caching for architects data with 80% hit rate target
 */

import CacheService from './CacheService';
import type { Architect, ArchitectsResponse } from '../types/architect';

interface ArchitectsCacheStats {
  hitRate: number;
  totalQueries: number;
  hits: number;
  misses: number;
  predictiveHits: number;
  prefetchedQueries: number;
  averageResponseTime: number;
}

interface QueryPattern {
  query: string;
  frequency: number;
  lastUsed: number;
  params: any[];
  avgResponseTime: number;
}

interface PredictiveQuery {
  query: string;
  params: any[];
  priority: number;
  predictedAt: number;
}

class ArchitectsCacheService {
  private static instance: ArchitectsCacheService;
  private cacheService: CacheService;
  private queryPatterns: Map<string, QueryPattern> = new Map();
  private predictiveQueries: PredictiveQuery[] = [];
  private readonly TARGET_HIT_RATE = 0.8; // 80% target
  private readonly CACHE_TTL = 10 * 60 * 1000; // 10 minutes
  private readonly LONG_CACHE_TTL = 30 * 60 * 1000; // 30 minutes for static data
  private readonly MAX_PREDICTIVE_QUERIES = 50;
  
  private stats: ArchitectsCacheStats = {
    hitRate: 0,
    totalQueries: 0,
    hits: 0,
    misses: 0,
    predictiveHits: 0,
    prefetchedQueries: 0,
    averageResponseTime: 0,
  };

  private responseTimes: number[] = [];
  private isOptimizing = false;

  private constructor() {
    this.cacheService = CacheService.getInstance();
    this.startPredictiveOptimization();
    this.startPerformanceMonitoring();
  }

  public static getInstance(): ArchitectsCacheService {
    if (!ArchitectsCacheService.instance) {
      ArchitectsCacheService.instance = new ArchitectsCacheService();
    }
    return ArchitectsCacheService.instance;
  }

  /**
   * Get architects with intelligent caching and prefetching
   */
  public async getArchitects(
    page: number = 1,
    limit: number = 12,
    searchTerm: string = '',
    tags: string[] = [],
    sortBy: string = 'name',
    sortOrder: string = 'asc',
    options: any = {}
  ): Promise<ArchitectsResponse> {
    const startTime = performance.now();
    const queryKey = this.generateQueryKey('architects', {
      page, limit, searchTerm, tags, sortBy, sortOrder, ...options
    });

    this.stats.totalQueries++;
    this.recordQueryPattern(queryKey, { page, limit, searchTerm, tags, sortBy, sortOrder, ...options });

    try {
      // Try cache first
      const cached = await this.cacheService.get<ArchitectsResponse>(queryKey);
      if (cached) {
        this.stats.hits++;
        this.recordResponseTime(performance.now() - startTime);
        this.updateStats();
        
        // Trigger predictive prefetching in background
        this.triggerPredictivePrefetching({ page, limit, searchTerm, tags, sortBy, sortOrder, ...options });
        
        return cached;
      }

      // Cache miss - need to fetch data
      this.stats.misses++;
      this.updateStats();

      // If hit rate is below target, trigger optimization
      if (this.stats.hitRate < this.TARGET_HIT_RATE && !this.isOptimizing) {
        this.optimizeCache();
      }

      return null; // Indicate cache miss
    } catch (error) {
      console.error('[ArchitectsCacheService] Cache retrieval error:', error);
      this.stats.misses++;
      this.updateStats();
      return null;
    }
  }

  /**
   * Cache architects data with intelligent TTL
   */
  public async cacheArchitects(
    queryKey: string,
    data: ArchitectsResponse,
    isStaticData: boolean = false
  ): Promise<void> {
    const ttl = isStaticData ? this.LONG_CACHE_TTL : this.CACHE_TTL;
    
    try {
      await this.cacheService.set(queryKey, data, [], ttl);
    } catch (error) {
      console.error('[ArchitectsCacheService] Cache storage error:', error);
    }
  }

  /**
   * Get single architect with caching
   */
  public async getArchitect(id: number): Promise<Architect | null> {
    const startTime = performance.now();
    const queryKey = this.generateQueryKey('architect', { id });

    this.stats.totalQueries++;

    try {
      const cached = await this.cacheService.get<Architect>(queryKey);
      if (cached) {
        this.stats.hits++;
        this.recordResponseTime(performance.now() - startTime);
        this.updateStats();
        return cached;
      }

      this.stats.misses++;
      this.updateStats();
      return null;
    } catch (error) {
      console.error('[ArchitectsCacheService] Single architect cache error:', error);
      this.stats.misses++;
      this.updateStats();
      return null;
    }
  }

  /**
   * Cache single architect
   */
  public async cacheArchitect(id: number, architect: Architect): Promise<void> {
    const queryKey = this.generateQueryKey('architect', { id });
    
    try {
      await this.cacheService.set(queryKey, architect, [], this.LONG_CACHE_TTL);
    } catch (error) {
      console.error('[ArchitectsCacheService] Single architect cache storage error:', error);
    }
  }

  /**
   * Prefetch related data based on usage patterns
   */
  private async triggerPredictivePrefetching(currentParams: any): Promise<void> {
    if (this.predictiveQueries.length >= this.MAX_PREDICTIVE_QUERIES) {
      return;
    }

    const predictions = this.generatePredictiveQueries(currentParams);
    
    for (const prediction of predictions.slice(0, 5)) { // Limit to 5 predictions per trigger
      const queryKey = this.generateQueryKey('architects', prediction.params);
      
      // Check if not already cached
      const cached = await this.cacheService.get(queryKey);
      if (!cached) {
        this.predictiveQueries.push(prediction);
        // Note: Actual prefetching would be triggered by the component
        this.stats.prefetchedQueries++;
      }
    }
  }

  /**
   * Generate predictive queries based on patterns
   */
  private generatePredictiveQueries(currentParams: any): PredictiveQuery[] {
    const predictions: PredictiveQuery[] = [];
    
    // Predict next page
    if (currentParams.page > 1) {
      predictions.push({
        query: 'architects',
        params: { ...currentParams, page: currentParams.page + 1 },
        priority: 0.8,
        predictedAt: Date.now(),
      });
    }

    // Predict previous page
    if (currentParams.page > 1) {
      predictions.push({
        query: 'architects',
        params: { ...currentParams, page: currentParams.page - 1 },
        priority: 0.6,
        predictedAt: Date.now(),
      });
    }

    // Predict different sort orders for same search
    if (currentParams.searchTerm) {
      const sortVariations = [
        { sortBy: 'birthYear', sortOrder: 'desc' },
        { sortBy: 'nationality', sortOrder: 'asc' },
        { sortBy: 'name', sortOrder: 'desc' },
      ];

      for (const sortVar of sortVariations) {
        if (sortVar.sortBy !== currentParams.sortBy || sortVar.sortOrder !== currentParams.sortOrder) {
          predictions.push({
            query: 'architects',
            params: { ...currentParams, ...sortVar },
            priority: 0.4,
            predictedAt: Date.now(),
          });
        }
      }
    }

    // Predict popular filters based on patterns
    const popularTags = this.getPopularTagsFromPatterns();
    for (const tag of popularTags.slice(0, 3)) {
      predictions.push({
        query: 'architects',
        params: { ...currentParams, tags: [tag], page: 1 },
        priority: 0.3,
        predictedAt: Date.now(),
      });
    }

    return predictions.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Get popular tags from query patterns
   */
  private getPopularTagsFromPatterns(): string[] {
    const tagFrequency: Map<string, number> = new Map();
    
    for (const pattern of this.queryPatterns.values()) {
      if (pattern.params[0]?.tags) {
        for (const tag of pattern.params[0].tags) {
          tagFrequency.set(tag, (tagFrequency.get(tag) || 0) + pattern.frequency);
        }
      }
    }

    return Array.from(tagFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([tag]) => tag);
  }

  /**
   * Record query pattern for learning
   */
  private recordQueryPattern(queryKey: string, params: any): void {
    const existing = this.queryPatterns.get(queryKey);
    
    if (existing) {
      existing.frequency++;
      existing.lastUsed = Date.now();
    } else {
      this.queryPatterns.set(queryKey, {
        query: queryKey,
        frequency: 1,
        lastUsed: Date.now(),
        params: [params],
        avgResponseTime: 0,
      });
    }

    // Cleanup old patterns
    if (this.queryPatterns.size > 1000) {
      this.cleanupOldPatterns();
    }
  }

  /**
   * Cleanup old query patterns
   */
  private cleanupOldPatterns(): void {
    const cutoffTime = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days
    
    for (const [key, pattern] of this.queryPatterns.entries()) {
      if (pattern.lastUsed < cutoffTime && pattern.frequency < 5) {
        this.queryPatterns.delete(key);
      }
    }
  }

  /**
   * Record response time for analytics
   */
  private recordResponseTime(time: number): void {
    this.responseTimes.push(time);
    
    // Keep only last 100 response times
    if (this.responseTimes.length > 100) {
      this.responseTimes = this.responseTimes.slice(-100);
    }
    
    this.stats.averageResponseTime = this.responseTimes.reduce((sum, t) => sum + t, 0) / this.responseTimes.length;
  }

  /**
   * Update hit rate statistics
   */
  private updateStats(): void {
    this.stats.hitRate = this.stats.totalQueries > 0 
      ? this.stats.hits / this.stats.totalQueries 
      : 0;
  }

  /**
   * Optimize cache based on patterns
   */
  private async optimizeCache(): Promise<void> {
    if (this.isOptimizing) return;
    
    this.isOptimizing = true;
    console.log('[ArchitectsCacheService] Starting cache optimization...');

    try {
      // Warm up cache with most frequent queries
      const topPatterns = Array.from(this.queryPatterns.values())
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 20);

      for (const pattern of topPatterns) {
        // This would trigger actual data fetching in the component
        console.log(`[ArchitectsCacheService] Should warm up: ${pattern.query}`);
      }

    } finally {
      this.isOptimizing = false;
    }
  }

  /**
   * Start predictive optimization
   */
  private startPredictiveOptimization(): void {
    setInterval(() => {
      // Clean up old predictive queries
      const cutoff = Date.now() - (5 * 60 * 1000); // 5 minutes
      this.predictiveQueries = this.predictiveQueries.filter(
        query => query.predictedAt > cutoff
      );
    }, 60000); // Every minute
  }

  /**
   * Start performance monitoring
   */
  private startPerformanceMonitoring(): void {
    setInterval(() => {
      console.log('[ArchitectsCacheService] Performance Stats:', {
        hitRate: `${(this.stats.hitRate * 100).toFixed(1)}%`,
        totalQueries: this.stats.totalQueries,
        avgResponseTime: `${this.stats.averageResponseTime.toFixed(1)}ms`,
        prefetchedQueries: this.stats.prefetchedQueries,
        targetMet: this.stats.hitRate >= this.TARGET_HIT_RATE,
      });
    }, 2 * 60 * 1000); // Every 2 minutes
  }

  /**
   * Generate cache key
   */
  private generateQueryKey(type: string, params: any): string {
    return `architects:${type}:${JSON.stringify(params)}`;
  }

  /**
   * Get pending predictive queries for prefetching
   */
  public getPendingPredictiveQueries(): PredictiveQuery[] {
    return [...this.predictiveQueries].sort((a, b) => b.priority - a.priority);
  }

  /**
   * Mark predictive query as executed
   */
  public markPredictiveQueryExecuted(query: PredictiveQuery): void {
    this.predictiveQueries = this.predictiveQueries.filter(q => q !== query);
    this.stats.predictiveHits++;
  }

  /**
   * Get comprehensive cache statistics
   */
  public getStats(): ArchitectsCacheStats {
    return { ...this.stats };
  }

  /**
   * Get cache recommendations
   */
  public getRecommendations(): string[] {
    const recommendations: string[] = [];
    
    if (this.stats.hitRate < this.TARGET_HIT_RATE) {
      recommendations.push(`キャッシュヒット率が目標の${this.TARGET_HIT_RATE * 100}%を下回っています (現在: ${(this.stats.hitRate * 100).toFixed(1)}%)`);
    }
    
    if (this.stats.averageResponseTime > 50) {
      recommendations.push(`平均応答時間が高いです (${this.stats.averageResponseTime.toFixed(1)}ms)`);
    }
    
    if (this.predictiveQueries.length > this.MAX_PREDICTIVE_QUERIES * 0.8) {
      recommendations.push('予測クエリのキューが満杯に近づいています');
    }
    
    return recommendations;
  }

  /**
   * Clear cache with pattern preservation
   */
  public async clearCache(preservePatterns: boolean = true): Promise<void> {
    await this.cacheService.clear();
    
    if (!preservePatterns) {
      this.queryPatterns.clear();
      this.predictiveQueries = [];
    }
    
    // Reset stats but keep patterns for learning
    this.stats = {
      hitRate: 0,
      totalQueries: 0,
      hits: 0,
      misses: 0,
      predictiveHits: 0,
      prefetchedQueries: 0,
      averageResponseTime: 0,
    };
    
    this.responseTimes = [];
  }

  /**
   * Export analytics data
   */
  public exportAnalytics(): any {
    return {
      stats: this.stats,
      patterns: Array.from(this.queryPatterns.entries()),
      predictiveQueries: this.predictiveQueries,
      responseTimes: this.responseTimes,
      timestamp: new Date().toISOString(),
    };
  }
}

export default ArchitectsCacheService;
export type { ArchitectsCacheStats, QueryPattern, PredictiveQuery };