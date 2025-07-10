/**
 * Performance Optimizer - Central orchestrator for all performance enhancements
 * Integrates all optimization strategies for the Japanese Architecture Database
 */

import ProgressiveDbLoader from './ProgressiveDbLoader';
import CacheService from './CacheService';

interface OptimizationConfig {
  enableVirtualScrolling: boolean;
  enableProgressiveLoading: boolean;
  enableAdvancedCaching: boolean;
  enableServiceWorker: boolean;
  enablePerformanceMonitoring: boolean;
  cacheWarmupQueries: string[];
  virtualScrollItemHeight: number;
  virtualScrollOverscan: number;
}

interface PerformanceMetrics {
  cacheHitRatio: number;
  averageQueryTime: number;
  memoryUsage: number;
  loadingProgress: number;
  isOptimized: boolean;
}

class PerformanceOptimizer {
  private static instance: PerformanceOptimizer;
  private config: OptimizationConfig;
  private dbLoader: ProgressiveDbLoader;
  private cacheService: CacheService;
  private isInitialized = false;
  private metrics: PerformanceMetrics = {
    cacheHitRatio: 0,
    averageQueryTime: 0,
    memoryUsage: 0,
    loadingProgress: 0,
    isOptimized: false,
  };

  private constructor() {
    this.config = this.getDefaultConfig();
    this.dbLoader = ProgressiveDbLoader.getInstance();
    this.cacheService = CacheService.getInstance();
  }

  public static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer();
    }
    return PerformanceOptimizer.instance;
  }

  /**
   * Initialize all performance optimizations
   */
  public async initialize(customConfig?: Partial<OptimizationConfig>): Promise<void> {
    if (this.isInitialized) {
      console.log('[PerformanceOptimizer] Already initialized');
      return;
    }

    console.log('[PerformanceOptimizer] Starting performance optimization initialization...');

    // Merge custom config with defaults
    if (customConfig) {
      this.config = { ...this.config, ...customConfig };
    }

    try {
      // Initialize progressive database loading
      if (this.config.enableProgressiveLoading) {
        await this.initializeProgressiveLoading();
      }

      // Initialize advanced caching
      if (this.config.enableAdvancedCaching) {
        await this.initializeAdvancedCaching();
      }

      // Register service worker
      if (this.config.enableServiceWorker) {
        await this.initializeServiceWorker();
      }

      // Start performance monitoring
      if (this.config.enablePerformanceMonitoring) {
        this.startPerformanceMonitoring();
      }

      this.isInitialized = true;
      this.metrics.isOptimized = true;

      console.log('[PerformanceOptimizer] Performance optimization initialization completed');

    } catch (error) {
      console.error('[PerformanceOptimizer] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Initialize progressive database loading
   */
  private async initializeProgressiveLoading(): Promise<void> {
    console.log('[PerformanceOptimizer] Initializing progressive database loading...');

    // Add progress listener
    this.dbLoader.addProgressListener((stats) => {
      this.metrics.loadingProgress = stats.totalProgress;
      console.log(`[PerformanceOptimizer] Loading progress: ${stats.totalProgress.toFixed(1)}%`);
    });

    // Start progressive loading
    await this.dbLoader.startLoading();

    // Warm up cache after critical data is loaded
    if (this.dbLoader.isCriticalDataLoaded()) {
      await this.dbLoader.warmUpCache();
    }
  }

  /**
   * Initialize advanced caching system
   */
  private async initializeAdvancedCaching(): Promise<void> {
    console.log('[PerformanceOptimizer] Initializing advanced caching...');

    // Warm up cache with critical queries
    if (this.config.cacheWarmupQueries.length > 0) {
      const warmupQueries = this.config.cacheWarmupQueries.map(query => ({ query }));
      await this.cacheService.warmUp(warmupQueries);
    }

    // Monitor cache performance
    setInterval(() => {
      const stats = this.cacheService.getStats();
      this.metrics.cacheHitRatio = stats.hitRatio;
    }, 30000); // Every 30 seconds
  }

  /**
   * Initialize service worker for offline functionality
   */
  private async initializeServiceWorker(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      console.warn('[PerformanceOptimizer] Service Worker not supported');
      return;
    }

    try {
      console.log('[PerformanceOptimizer] Registering service worker...');

      const registration = await navigator.serviceWorker.register('/sw-performance.js');
      
      registration.addEventListener('updatefound', () => {
        console.log('[PerformanceOptimizer] Service worker update found');
      });

      // Message channel for communication with SW
      if (registration.active) {
        this.setupServiceWorkerCommunication(registration);
      }

      console.log('[PerformanceOptimizer] Service worker registered successfully');

    } catch (error) {
      console.error('[PerformanceOptimizer] Service worker registration failed:', error);
    }
  }

  /**
   * Setup communication with service worker
   */
  private setupServiceWorkerCommunication(registration: ServiceWorkerRegistration): void {
    const messageChannel = new MessageChannel();
    
    messageChannel.port1.onmessage = (event) => {
      const { type, data } = event.data;
      
      switch (type) {
        case 'CACHE_STATS':
          console.log('[PerformanceOptimizer] Service worker cache stats:', data);
          break;
        default:
          console.log('[PerformanceOptimizer] SW message:', type, data);
      }
    };

    // Send warm-up URLs to service worker
    registration.active?.postMessage({
      type: 'CACHE_WARM_UP',
      payload: { urls: this.config.cacheWarmupQueries }
    }, [messageChannel.port2]);
  }

  /**
   * Start performance monitoring
   */
  private startPerformanceMonitoring(): void {
    console.log('[PerformanceOptimizer] Starting performance monitoring...');

    // Monitor memory usage
    if ('memory' in performance) {
      setInterval(() => {
        const memInfo = (performance as any).memory;
        this.metrics.memoryUsage = memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit;
        
        // Warn if memory usage is high
        if (this.metrics.memoryUsage > 0.8) {
          console.warn('[PerformanceOptimizer] High memory usage detected:', 
            `${(this.metrics.memoryUsage * 100).toFixed(1)}%`);
        }
      }, 60000); // Every minute
    }

    // Monitor query performance
    setInterval(async () => {
      const start = performance.now();
      
      try {
        // Sample query to measure database performance
        await this.dbLoader.loadOnDemand('SELECT COUNT(*) as count FROM architecture LIMIT 1');
        this.metrics.averageQueryTime = performance.now() - start;
      } catch (error) {
        console.warn('[PerformanceOptimizer] Query performance test failed:', error);
      }
    }, 120000); // Every 2 minutes
  }

  /**
   * Get virtual scrolling configuration
   */
  public getVirtualScrollConfig() {
    return {
      enabled: this.config.enableVirtualScrolling,
      itemHeight: this.config.virtualScrollItemHeight,
      overscan: this.config.virtualScrollOverscan,
    };
  }

  /**
   * Optimize search query with debouncing and caching
   */
  public async optimizedSearch<T>(
    query: string,
    params: any[] = [],
    searchFn: () => Promise<T>
  ): Promise<T> {
    // Use cached query if available
    return this.cacheService.cachedQuery(
      `search:${query}`,
      searchFn,
      params,
      5 * 60 * 1000 // 5 minutes TTL for search results
    );
  }

  /**
   * Optimize database query with progressive loading and caching
   */
  public async optimizedQuery<T>(
    query: string,
    params: any[] = []
  ): Promise<T> {
    // Check if critical data is loaded
    if (!this.dbLoader.isCriticalDataLoaded() && this.isHighPriorityQuery(query)) {
      console.warn('[PerformanceOptimizer] Critical data not loaded yet, query may be slow');
    }

    // Use progressive loader for on-demand queries
    const result = await this.dbLoader.loadOnDemand<T>(query, params);
    
    if (!result.success) {
      throw new Error(result.error || 'Query failed');
    }
    
    return result.data as T;
  }

  /**
   * Check if query is high priority
   */
  private isHighPriorityQuery(query: string): boolean {
    const highPriorityPatterns = [
      /SELECT.*FROM architecture.*LIMIT/i,
      /SELECT.*FROM architect/i,
      /SELECT DISTINCT/i,
    ];
    
    return highPriorityPatterns.some(pattern => pattern.test(query));
  }

  /**
   * Get current performance metrics
   */
  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Clear all caches (useful for debugging or memory management)
   */
  public async clearCaches(): Promise<void> {
    console.log('[PerformanceOptimizer] Clearing all caches...');
    
    // Clear application caches
    await this.cacheService.clear();
    await this.dbLoader.clearCache();
    
    // Clear service worker caches
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'CLEAR_CACHE'
      });
    }
    
    console.log('[PerformanceOptimizer] All caches cleared');
  }

  /**
   * Get optimization recommendations based on current metrics
   */
  public getOptimizationRecommendations(): string[] {
    const recommendations: string[] = [];
    
    if (this.metrics.cacheHitRatio < 0.5) {
      recommendations.push('キャッシュヒット率が低いです。よく使用されるクエリをウォームアップすることを検討してください。');
    }
    
    if (this.metrics.memoryUsage > 0.7) {
      recommendations.push('メモリ使用量が高いです。キャッシュサイズの削減を検討してください。');
    }
    
    if (this.metrics.averageQueryTime > 100) {
      recommendations.push('クエリの実行時間が長いです。インデックスの最適化を検討してください。');
    }
    
    if (this.metrics.loadingProgress < 100) {
      recommendations.push('データベースの読み込みが完了していません。クリティカルなデータの優先読み込みを確認してください。');
    }
    
    return recommendations;
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<OptimizationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('[PerformanceOptimizer] Configuration updated:', newConfig);
  }

  /**
   * Get default configuration
   */
  private getDefaultConfig(): OptimizationConfig {
    return {
      enableVirtualScrolling: true,
      enableProgressiveLoading: true,
      enableAdvancedCaching: true,
      enableServiceWorker: true,
      enablePerformanceMonitoring: true,
      cacheWarmupQueries: [
        'SELECT name, architect, city, year FROM architecture ORDER BY id LIMIT 50',
        'SELECT DISTINCT architect FROM architecture WHERE architect IS NOT NULL LIMIT 30',
        'SELECT DISTINCT city FROM architecture WHERE city IS NOT NULL LIMIT 20',
      ],
      virtualScrollItemHeight: 200,
      virtualScrollOverscan: 5,
    };
  }

  /**
   * Export performance report
   */
  public exportPerformanceReport(): string {
    const report = {
      timestamp: new Date().toISOString(),
      isOptimized: this.metrics.isOptimized,
      metrics: this.metrics,
      config: this.config,
      recommendations: this.getOptimizationRecommendations(),
      cacheStats: this.cacheService.getStats(),
      dbStats: this.dbLoader.getStats(),
    };
    
    return JSON.stringify(report, null, 2);
  }
}

export default PerformanceOptimizer;
export type { OptimizationConfig, PerformanceMetrics };