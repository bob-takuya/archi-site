/**
 * Code Splitting Configuration - SOW Phase 2 Performance Optimization
 * Implements intelligent code splitting for improved load times
 */

import { lazy, ComponentType } from 'react';

// Bundle analysis and optimization utilities
interface BundleChunk {
  name: string;
  size: number;
  modules: string[];
  priority: 'high' | 'medium' | 'low';
  preload?: boolean;
}

interface LoadingConfig {
  fallback: ComponentType;
  errorBoundary?: ComponentType<{ error: Error; retry: () => void }>;
  timeout?: number;
  retryAttempts?: number;
}

class CodeSplittingManager {
  private static instance: CodeSplittingManager;
  private loadedChunks = new Set<string>();
  private failedChunks = new Set<string>();
  private preloadQueue: string[] = [];
  private retryCount = new Map<string, number>();
  
  private constructor() {
    this.setupIntersectionObserver();
    this.setupNetworkInfoOptimization();
  }

  public static getInstance(): CodeSplittingManager {
    if (!CodeSplittingManager.instance) {
      CodeSplittingManager.instance = new CodeSplittingManager();
    }
    return CodeSplittingManager.instance;
  }

  /**
   * Create lazy component with enhanced loading strategy
   */
  public createLazyComponent<T extends ComponentType<any>>(
    importFn: () => Promise<{ default: T }>,
    chunkName: string,
    config: LoadingConfig = {}
  ): ComponentType<any> {
    const { timeout = 10000, retryAttempts = 3 } = config;

    return lazy(() => {
      return new Promise<{ default: T }>((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error(`Chunk ${chunkName} loading timeout`));
        }, timeout);

        const loadWithRetry = async (attempt = 1): Promise<{ default: T }> => {
          try {
            const module = await importFn();
            clearTimeout(timeoutId);
            this.loadedChunks.add(chunkName);
            this.failedChunks.delete(chunkName);
            return module;
          } catch (error) {
            console.warn(`Failed to load chunk ${chunkName}, attempt ${attempt}`, error);
            
            if (attempt < retryAttempts) {
              // Exponential backoff
              const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
              await new Promise(resolve => setTimeout(resolve, delay));
              return loadWithRetry(attempt + 1);
            } else {
              clearTimeout(timeoutId);
              this.failedChunks.add(chunkName);
              this.retryCount.set(chunkName, attempt);
              throw error;
            }
          }
        };

        loadWithRetry().then(resolve).catch(reject);
      });
    });
  }

  /**
   * Preload chunks based on user behavior and network conditions
   */
  public preloadChunk(chunkName: string, importFn: () => Promise<any>): void {
    if (this.loadedChunks.has(chunkName) || this.preloadQueue.includes(chunkName)) {
      return;
    }

    // Check network conditions
    const connection = (navigator as any).connection;
    if (connection && (connection.effectiveType === 'slow-2g' || connection.saveData)) {
      console.log(`Skipping preload of ${chunkName} due to slow connection`);
      return;
    }

    this.preloadQueue.push(chunkName);

    // Use requestIdleCallback for non-blocking preload
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => this.executePreload(chunkName, importFn));
    } else {
      setTimeout(() => this.executePreload(chunkName, importFn), 100);
    }
  }

  /**
   * Execute preload with error handling
   */
  private async executePreload(chunkName: string, importFn: () => Promise<any>): Promise<void> {
    try {
      await importFn();
      this.loadedChunks.add(chunkName);
      console.log(`Successfully preloaded chunk: ${chunkName}`);
    } catch (error) {
      console.warn(`Failed to preload chunk: ${chunkName}`, error);
    } finally {
      this.preloadQueue = this.preloadQueue.filter(name => name !== chunkName);
    }
  }

  /**
   * Setup intersection observer for predictive loading
   */
  private setupIntersectionObserver(): void {
    if (!('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const element = entry.target as HTMLElement;
            const preloadChunk = element.dataset.preloadChunk;
            
            if (preloadChunk && !this.loadedChunks.has(preloadChunk)) {
              this.triggerPredictivePreload(preloadChunk);
            }
          }
        });
      },
      { rootMargin: '50px' }
    );

    // Observe elements with preload hints
    document.querySelectorAll('[data-preload-chunk]').forEach((el) => {
      observer.observe(el);
    });
  }

  /**
   * Setup network-aware optimization
   */
  private setupNetworkInfoOptimization(): void {
    const connection = (navigator as any).connection;
    if (!connection) return;

    const updateNetworkStrategy = () => {
      const { effectiveType, downlink, saveData } = connection;
      
      console.log('Network conditions:', { effectiveType, downlink, saveData });
      
      // Adjust preloading strategy based on network
      if (saveData || effectiveType === 'slow-2g') {
        this.preloadQueue = []; // Clear preload queue on slow connections
      }
    };

    connection.addEventListener('change', updateNetworkStrategy);
    updateNetworkStrategy(); // Initial check
  }

  /**
   * Trigger predictive preload based on user behavior
   */
  private triggerPredictivePreload(chunkName: string): void {
    // This would be expanded with specific chunk loading logic
    console.log(`Predictive preload triggered for: ${chunkName}`);
  }

  /**
   * Get loading statistics
   */
  public getStats() {
    return {
      loadedChunks: Array.from(this.loadedChunks),
      failedChunks: Array.from(this.failedChunks),
      preloadQueue: [...this.preloadQueue],
      retryCount: Object.fromEntries(this.retryCount)
    };
  }
}

// Lazy component definitions with optimized loading
const manager = CodeSplittingManager.getInstance();

// High priority components (load immediately)
export const VirtualizedArchitectsList = manager.createLazyComponent(
  () => import('../components/VirtualizedArchitectsList'),
  'virtualized-list',
  { timeout: 5000, retryAttempts: 3 }
);

export const ArchitectsPerformanceMonitor = manager.createLazyComponent(
  () => import('../components/ArchitectsPerformanceMonitor'),
  'performance-monitor',
  { timeout: 5000, retryAttempts: 2 }
);

// Medium priority components (preload on interaction)
export const AdvancedFilterSystem = manager.createLazyComponent(
  () => import('../components/AdvancedFilterSystem'),
  'advanced-filters',
  { timeout: 8000, retryAttempts: 2 }
);

export const ArchitectPortfolioVisualization = manager.createLazyComponent(
  () => import('../components/ArchitectPortfolioVisualization'),
  'portfolio-viz',
  { timeout: 10000, retryAttempts: 2 }
);

// Low priority components (load on demand)
export const DataExportSystem = manager.createLazyComponent(
  () => import('../components/DataExportSystem'),
  'data-export',
  { timeout: 10000, retryAttempts: 1 }
);

export const ArchitectureAnalyticsDashboard = manager.createLazyComponent(
  () => import('../components/ArchitectureAnalyticsDashboard'),
  'analytics-dashboard',
  { timeout: 15000, retryAttempts: 1 }
);

// Route-based lazy loading
export const OptimizedArchitectsPage = manager.createLazyComponent(
  () => import('../pages/OptimizedArchitectsPage'),
  'architects-page',
  { timeout: 8000, retryAttempts: 3 }
);

export const ArchitectSinglePage = manager.createLazyComponent(
  () => import('../pages/ArchitectSinglePage'),
  'architect-detail',
  { timeout: 8000, retryAttempts: 2 }
);

export const AnalyticsPage = manager.createLazyComponent(
  () => import('../pages/AnalyticsPage'),
  'analytics-page',
  { timeout: 10000, retryAttempts: 1 }
);

// Preloading strategies
export const preloadStrategies = {
  /**
   * Preload components likely to be used next
   */
  preloadArchitectDetails: () => {
    manager.preloadChunk('architect-detail', () => import('../pages/ArchitectSinglePage'));
  },

  /**
   * Preload analytics when user shows interest in data
   */
  preloadAnalytics: () => {
    manager.preloadChunk('analytics-dashboard', () => import('../components/ArchitectureAnalyticsDashboard'));
    manager.preloadChunk('analytics-page', () => import('../pages/AnalyticsPage'));
  },

  /**
   * Preload advanced features for power users
   */
  preloadAdvancedFeatures: () => {
    manager.preloadChunk('advanced-filters', () => import('../components/AdvancedFilterSystem'));
    manager.preloadChunk('data-export', () => import('../components/DataExportSystem'));
  },

  /**
   * Preload all critical components
   */
  preloadCritical: () => {
    manager.preloadChunk('virtualized-list', () => import('../components/VirtualizedArchitectsList'));
    manager.preloadChunk('performance-monitor', () => import('../components/ArchitectsPerformanceMonitor'));
  }
};

// Bundle size optimization utilities
export const bundleOptimization = {
  /**
   * Tree-shake unused imports
   */
  getMinimalImports: (features: string[]) => {
    const importMap = {
      'virtualized-list': () => import('../components/VirtualizedArchitectsList'),
      'performance-monitor': () => import('../components/ArchitectsPerformanceMonitor'),
      'advanced-filters': () => import('../components/AdvancedFilterSystem'),
      'analytics': () => import('../components/ArchitectureAnalyticsDashboard'),
    };

    return features.reduce((imports, feature) => {
      if (importMap[feature]) {
        imports[feature] = importMap[feature];
      }
      return imports;
    }, {} as Record<string, () => Promise<any>>);
  },

  /**
   * Get bundle size analysis
   */
  analyzeBundleSize: () => {
    const stats = manager.getStats();
    return {
      loadedChunks: stats.loadedChunks.length,
      failedChunks: stats.failedChunks.length,
      preloadQueue: stats.preloadQueue.length,
      estimatedSizeReduction: stats.loadedChunks.length * 0.3 // Rough estimate
    };
  }
};

// Performance monitoring
export const performanceTracking = {
  /**
   * Track chunk loading performance
   */
  trackChunkLoad: (chunkName: string, loadTime: number) => {
    console.log(`Chunk ${chunkName} loaded in ${loadTime}ms`);
    
    // Send to analytics if available
    if ('gtag' in window) {
      (window as any).gtag('event', 'chunk_load', {
        chunk_name: chunkName,
        load_time: loadTime,
        custom_parameter: 'performance_optimization'
      });
    }
  },

  /**
   * Monitor bundle size impact
   */
  monitorBundleImpact: () => {
    const stats = manager.getStats();
    const impact = {
      totalChunks: stats.loadedChunks.length + stats.failedChunks.length,
      successRate: stats.loadedChunks.length / (stats.loadedChunks.length + stats.failedChunks.length),
      preloadEfficiency: stats.preloadQueue.length
    };

    console.log('Bundle impact analysis:', impact);
    return impact;
  }
};

export default manager;