/**
 * Performance Analytics Service - SOW Phase 2 Performance Tracking
 * Comprehensive performance monitoring and analytics for architects tab
 */

interface PerformanceMetric {
  id: string;
  timestamp: number;
  type: 'load_time' | 'cache_hit' | 'scroll_fps' | 'memory_usage' | 'bundle_size' | 'user_interaction';
  value: number;
  metadata?: Record<string, any>;
  sessionId: string;
  userId?: string;
}

interface PerformanceTarget {
  metric: string;
  target: number;
  current: number;
  status: 'met' | 'warning' | 'critical';
  improvement?: number;
}

interface PerformanceReport {
  timestamp: number;
  sessionId: string;
  summary: {
    overallScore: number;
    targetsMetCount: number;
    totalTargets: number;
    criticalIssues: string[];
  };
  targets: PerformanceTarget[];
  recommendations: string[];
  trends: {
    metric: string;
    direction: 'improving' | 'degrading' | 'stable';
    changePercent: number;
  }[];
}

class PerformanceAnalyticsService {
  private static instance: PerformanceAnalyticsService;
  private metrics: PerformanceMetric[] = [];
  private sessionId: string;
  private readonly MAX_METRICS = 1000;
  private readonly TARGETS = {
    initialLoadTime: 2000, // 2 seconds
    cacheHitRate: 0.8, // 80%
    scrollFPS: 60, // 60fps
    memoryUsage: 0.7, // 70% of available memory
    bundleSize: 500 * 1024, // 500KB
    queryTime: 500 // 500ms
  };

  private performanceObserver?: PerformanceObserver;
  private fpsCounter: number = 0;
  private lastFrameTime: number = 0;
  private frameCount: number = 0;

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.initializePerformanceObserver();
    this.startFPSMonitoring();
    this.startMemoryMonitoring();
    this.setupNavigationTracking();
  }

  public static getInstance(): PerformanceAnalyticsService {
    if (!PerformanceAnalyticsService.instance) {
      PerformanceAnalyticsService.instance = new PerformanceAnalyticsService();
    }
    return PerformanceAnalyticsService.instance;
  }

  /**
   * Record a performance metric
   */
  public recordMetric(
    type: PerformanceMetric['type'],
    value: number,
    metadata?: Record<string, any>
  ): void {
    const metric: PerformanceMetric = {
      id: this.generateMetricId(),
      timestamp: Date.now(),
      type,
      value,
      metadata,
      sessionId: this.sessionId
    };

    this.metrics.push(metric);

    // Keep only recent metrics
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }

    // Real-time analysis for critical metrics
    this.analyzeMetricInRealTime(metric);

    console.log(`[PerformanceAnalytics] Recorded ${type}: ${value}`, metadata);
  }

  /**
   * Record load time with automatic categorization
   */
  public recordLoadTime(
    operation: string,
    startTime: number,
    endTime?: number,
    metadata?: Record<string, any>
  ): void {
    const loadTime = (endTime || performance.now()) - startTime;
    
    this.recordMetric('load_time', loadTime, {
      operation,
      ...metadata
    });

    // Check against targets
    if (operation === 'initial_load' && loadTime > this.TARGETS.initialLoadTime) {
      this.triggerPerformanceAlert('initial_load_slow', loadTime);
    }
  }

  /**
   * Record cache performance
   */
  public recordCacheHit(hit: boolean, query: string, responseTime: number): void {
    this.recordMetric('cache_hit', hit ? 1 : 0, {
      query: query.slice(0, 100), // Truncate for storage
      responseTime
    });

    // Calculate rolling cache hit rate
    const recentCacheMetrics = this.getRecentMetrics('cache_hit', 100);
    if (recentCacheMetrics.length >= 10) {
      const hitRate = recentCacheMetrics.reduce((sum, m) => sum + m.value, 0) / recentCacheMetrics.length;
      
      if (hitRate < this.TARGETS.cacheHitRate) {
        this.triggerPerformanceAlert('cache_hit_rate_low', hitRate);
      }
    }
  }

  /**
   * Record scroll performance
   */
  public recordScrollPerformance(fps: number, scrollDistance: number): void {
    this.recordMetric('scroll_fps', fps, {
      scrollDistance,
      timestamp: Date.now()
    });

    if (fps < this.TARGETS.scrollFPS * 0.8) { // 80% of target
      this.triggerPerformanceAlert('scroll_fps_low', fps);
    }
  }

  /**
   * Record user interaction timing
   */
  public recordUserInteraction(
    interaction: string,
    duration: number,
    success: boolean = true
  ): void {
    this.recordMetric('user_interaction', duration, {
      interaction,
      success,
      timestamp: Date.now()
    });
  }

  /**
   * Get comprehensive performance report
   */
  public generatePerformanceReport(): PerformanceReport {
    const targets = this.evaluateTargets();
    const trends = this.calculateTrends();
    const recommendations = this.generateRecommendations(targets);
    
    const targetsMetCount = targets.filter(t => t.status === 'met').length;
    const criticalIssues = targets
      .filter(t => t.status === 'critical')
      .map(t => `${t.metric}: ${t.current} (target: ${t.target})`);

    const overallScore = this.calculateOverallScore(targets);

    return {
      timestamp: Date.now(),
      sessionId: this.sessionId,
      summary: {
        overallScore,
        targetsMetCount,
        totalTargets: targets.length,
        criticalIssues
      },
      targets,
      recommendations,
      trends
    };
  }

  /**
   * Get real-time performance status
   */
  public getRealtimeStatus(): {
    status: 'excellent' | 'good' | 'fair' | 'poor';
    score: number;
    issues: string[];
  } {
    const recentMetrics = this.getRecentMetrics(undefined, 50);
    
    // Calculate scores for different metrics
    const loadTimeScore = this.calculateLoadTimeScore();
    const cacheScore = this.calculateCacheScore();
    const fpsScore = this.calculateFPSScore();
    const memoryScore = this.calculateMemoryScore();

    const scores = [loadTimeScore, cacheScore, fpsScore, memoryScore];
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;

    let status: 'excellent' | 'good' | 'fair' | 'poor';
    if (averageScore >= 0.9) status = 'excellent';
    else if (averageScore >= 0.7) status = 'good';
    else if (averageScore >= 0.5) status = 'fair';
    else status = 'poor';

    const issues = this.identifyCurrentIssues();

    return {
      status,
      score: averageScore,
      issues
    };
  }

  /**
   * Export analytics data for external analysis
   */
  public exportAnalyticsData(): {
    metadata: any;
    metrics: PerformanceMetric[];
    summary: any;
  } {
    return {
      metadata: {
        sessionId: this.sessionId,
        exportTimestamp: Date.now(),
        browserInfo: this.getBrowserInfo(),
        targets: this.TARGETS
      },
      metrics: [...this.metrics],
      summary: this.generatePerformanceReport()
    };
  }

  /**
   * Clear all metrics (useful for testing)
   */
  public clearMetrics(): void {
    this.metrics = [];
    console.log('[PerformanceAnalytics] Metrics cleared');
  }

  // Private helper methods

  /**
   * Initialize performance observer for automatic tracking
   */
  private initializePerformanceObserver(): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      this.performanceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        
        entries.forEach((entry) => {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            this.recordMetric('load_time', navEntry.loadEventEnd - navEntry.navigationStart, {
              operation: 'navigation',
              domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.navigationStart,
              firstPaint: navEntry.loadEventStart - navEntry.navigationStart
            });
          }
          
          if (entry.entryType === 'resource') {
            const resourceEntry = entry as PerformanceResourceTiming;
            if (resourceEntry.name.includes('chunk') || resourceEntry.name.includes('.js')) {
              this.recordMetric('bundle_size', resourceEntry.transferSize || 0, {
                resource: resourceEntry.name,
                duration: resourceEntry.duration
              });
            }
          }
        });
      });

      this.performanceObserver.observe({ entryTypes: ['navigation', 'resource', 'measure'] });
    } catch (error) {
      console.warn('[PerformanceAnalytics] Failed to initialize PerformanceObserver:', error);
    }
  }

  /**
   * Start FPS monitoring
   */
  private startFPSMonitoring(): void {
    const measureFPS = (timestamp: number) => {
      if (this.lastFrameTime) {
        this.frameCount++;
        
        // Calculate FPS every second
        if (timestamp - this.lastFrameTime >= 1000) {
          const fps = this.frameCount * 1000 / (timestamp - this.lastFrameTime);
          this.fpsCounter = fps;
          
          // Record if user is scrolling
          if (this.frameCount > 50) { // Only record if there was significant activity
            this.recordMetric('scroll_fps', fps, {
              frameCount: this.frameCount,
              duration: timestamp - this.lastFrameTime
            });
          }
          
          this.frameCount = 0;
          this.lastFrameTime = timestamp;
        }
      } else {
        this.lastFrameTime = timestamp;
      }
      
      requestAnimationFrame(measureFPS);
    };

    requestAnimationFrame(measureFPS);
  }

  /**
   * Start memory monitoring
   */
  private startMemoryMonitoring(): void {
    if (!('memory' in performance)) return;

    setInterval(() => {
      const memInfo = (performance as any).memory;
      const usage = memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit;
      
      this.recordMetric('memory_usage', usage, {
        usedJSHeapSize: memInfo.usedJSHeapSize,
        totalJSHeapSize: memInfo.totalJSHeapSize,
        jsHeapSizeLimit: memInfo.jsHeapSizeLimit
      });
    }, 10000); // Every 10 seconds
  }

  /**
   * Setup navigation tracking
   */
  private setupNavigationTracking(): void {
    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      this.recordMetric('user_interaction', 0, {
        interaction: 'visibility_change',
        hidden: document.hidden
      });
    });

    // Track user engagement
    let interactionCount = 0;
    ['click', 'scroll', 'keypress'].forEach(eventType => {
      document.addEventListener(eventType, () => {
        interactionCount++;
        
        // Record engagement every 10 interactions
        if (interactionCount % 10 === 0) {
          this.recordMetric('user_interaction', interactionCount, {
            interaction: 'engagement_burst',
            eventType
          });
        }
      }, { passive: true });
    });
  }

  /**
   * Analyze metric in real-time
   */
  private analyzeMetricInRealTime(metric: PerformanceMetric): void {
    // Check for immediate performance issues
    switch (metric.type) {
      case 'load_time':
        if (metric.value > 5000) { // 5 seconds
          console.warn(`[PerformanceAnalytics] Slow load detected: ${metric.value}ms`);
        }
        break;
      
      case 'memory_usage':
        if (metric.value > 0.9) { // 90% memory usage
          console.error(`[PerformanceAnalytics] High memory usage: ${(metric.value * 100).toFixed(1)}%`);
        }
        break;
      
      case 'scroll_fps':
        if (metric.value < 30) { // Less than 30 FPS
          console.warn(`[PerformanceAnalytics] Poor scroll performance: ${metric.value} FPS`);
        }
        break;
    }
  }

  /**
   * Trigger performance alert
   */
  private triggerPerformanceAlert(type: string, value: number): void {
    console.warn(`[PerformanceAnalytics] Alert: ${type} = ${value}`);
    
    // Could integrate with external alerting systems
    if ('gtag' in window) {
      (window as any).gtag('event', 'performance_alert', {
        alert_type: type,
        value: value,
        session_id: this.sessionId
      });
    }
  }

  /**
   * Get recent metrics by type
   */
  private getRecentMetrics(type?: PerformanceMetric['type'], count: number = 100): PerformanceMetric[] {
    let filtered = this.metrics;
    
    if (type) {
      filtered = this.metrics.filter(m => m.type === type);
    }
    
    return filtered.slice(-count);
  }

  /**
   * Evaluate performance targets
   */
  private evaluateTargets(): PerformanceTarget[] {
    const targets: PerformanceTarget[] = [];

    // Load time target
    const loadTimeMetrics = this.getRecentMetrics('load_time', 10);
    if (loadTimeMetrics.length > 0) {
      const avgLoadTime = loadTimeMetrics.reduce((sum, m) => sum + m.value, 0) / loadTimeMetrics.length;
      targets.push({
        metric: 'Initial Load Time',
        target: this.TARGETS.initialLoadTime,
        current: avgLoadTime,
        status: avgLoadTime <= this.TARGETS.initialLoadTime ? 'met' : 
                avgLoadTime <= this.TARGETS.initialLoadTime * 1.5 ? 'warning' : 'critical'
      });
    }

    // Cache hit rate target
    const cacheMetrics = this.getRecentMetrics('cache_hit', 50);
    if (cacheMetrics.length >= 10) {
      const hitRate = cacheMetrics.reduce((sum, m) => sum + m.value, 0) / cacheMetrics.length;
      targets.push({
        metric: 'Cache Hit Rate',
        target: this.TARGETS.cacheHitRate,
        current: hitRate,
        status: hitRate >= this.TARGETS.cacheHitRate ? 'met' :
                hitRate >= this.TARGETS.cacheHitRate * 0.8 ? 'warning' : 'critical'
      });
    }

    // FPS target
    const fpsMetrics = this.getRecentMetrics('scroll_fps', 10);
    if (fpsMetrics.length > 0) {
      const avgFPS = fpsMetrics.reduce((sum, m) => sum + m.value, 0) / fpsMetrics.length;
      targets.push({
        metric: 'Scroll Performance',
        target: this.TARGETS.scrollFPS,
        current: avgFPS,
        status: avgFPS >= this.TARGETS.scrollFPS * 0.9 ? 'met' :
                avgFPS >= this.TARGETS.scrollFPS * 0.7 ? 'warning' : 'critical'
      });
    }

    // Memory usage target
    const memoryMetrics = this.getRecentMetrics('memory_usage', 5);
    if (memoryMetrics.length > 0) {
      const avgMemory = memoryMetrics.reduce((sum, m) => sum + m.value, 0) / memoryMetrics.length;
      targets.push({
        metric: 'Memory Usage',
        target: this.TARGETS.memoryUsage,
        current: avgMemory,
        status: avgMemory <= this.TARGETS.memoryUsage ? 'met' :
                avgMemory <= this.TARGETS.memoryUsage * 1.2 ? 'warning' : 'critical'
      });
    }

    return targets;
  }

  /**
   * Calculate performance trends
   */
  private calculateTrends(): any[] {
    const trends = [];
    const metricTypes = ['load_time', 'cache_hit', 'scroll_fps', 'memory_usage'];

    metricTypes.forEach(type => {
      const recent = this.getRecentMetrics(type as any, 20);
      if (recent.length >= 10) {
        const firstHalf = recent.slice(0, Math.floor(recent.length / 2));
        const secondHalf = recent.slice(Math.floor(recent.length / 2));

        const firstAvg = firstHalf.reduce((sum, m) => sum + m.value, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((sum, m) => sum + m.value, 0) / secondHalf.length;

        const changePercent = ((secondAvg - firstAvg) / firstAvg) * 100;
        
        let direction: 'improving' | 'degrading' | 'stable';
        if (Math.abs(changePercent) < 5) direction = 'stable';
        else if (type === 'cache_hit' || type === 'scroll_fps') {
          direction = changePercent > 0 ? 'improving' : 'degrading';
        } else {
          direction = changePercent < 0 ? 'improving' : 'degrading';
        }

        trends.push({
          metric: type,
          direction,
          changePercent: Math.abs(changePercent)
        });
      }
    });

    return trends;
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(targets: PerformanceTarget[]): string[] {
    const recommendations: string[] = [];

    targets.forEach(target => {
      if (target.status === 'critical') {
        switch (target.metric) {
          case 'Initial Load Time':
            recommendations.push('初期ロード時間の最適化: バンドルサイズの削減、画像の最適化、CDNの使用を検討してください');
            break;
          case 'Cache Hit Rate':
            recommendations.push('キャッシュ戦略の改善: より長いTTL設定、予測的プリフェッチの実装を検討してください');
            break;
          case 'Scroll Performance':
            recommendations.push('スクロール性能の向上: 仮想スクロールの最適化、レンダリング負荷の軽減を検討してください');
            break;
          case 'Memory Usage':
            recommendations.push('メモリ使用量の削減: メモリリークの確認、不要なオブジェクトの解放を検討してください');
            break;
        }
      }
    });

    if (recommendations.length === 0) {
      recommendations.push('パフォーマンスは良好です。現在の最適化を維持してください。');
    }

    return recommendations;
  }

  /**
   * Calculate overall performance score
   */
  private calculateOverallScore(targets: PerformanceTarget[]): number {
    if (targets.length === 0) return 0;

    const scores = targets.map(target => {
      switch (target.status) {
        case 'met': return 1;
        case 'warning': return 0.6;
        case 'critical': return 0.2;
        default: return 0;
      }
    });

    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }

  // Score calculation methods
  private calculateLoadTimeScore(): number {
    const metrics = this.getRecentMetrics('load_time', 10);
    if (metrics.length === 0) return 1;
    
    const avgTime = metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length;
    return Math.max(0, Math.min(1, (this.TARGETS.initialLoadTime * 2 - avgTime) / this.TARGETS.initialLoadTime));
  }

  private calculateCacheScore(): number {
    const metrics = this.getRecentMetrics('cache_hit', 20);
    if (metrics.length === 0) return 1;
    
    const hitRate = metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length;
    return hitRate;
  }

  private calculateFPSScore(): number {
    const metrics = this.getRecentMetrics('scroll_fps', 10);
    if (metrics.length === 0) return 1;
    
    const avgFPS = metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length;
    return Math.min(1, avgFPS / this.TARGETS.scrollFPS);
  }

  private calculateMemoryScore(): number {
    const metrics = this.getRecentMetrics('memory_usage', 5);
    if (metrics.length === 0) return 1;
    
    const avgUsage = metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length;
    return Math.max(0, 1 - avgUsage);
  }

  private identifyCurrentIssues(): string[] {
    const issues: string[] = [];
    
    // Check recent performance
    const loadTime = this.calculateLoadTimeScore();
    const cache = this.calculateCacheScore();
    const fps = this.calculateFPSScore();
    const memory = this.calculateMemoryScore();

    if (loadTime < 0.5) issues.push('ロード時間が長すぎます');
    if (cache < 0.6) issues.push('キャッシュヒット率が低いです');
    if (fps < 0.7) issues.push('スクロールパフォーマンスが低下しています');
    if (memory < 0.3) issues.push('メモリ使用量が高すぎます');

    return issues;
  }

  private getBrowserInfo(): any {
    return {
      userAgent: navigator.userAgent,
      memory: (performance as any).memory ? {
        jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize
      } : null,
      connection: (navigator as any).connection ? {
        effectiveType: (navigator as any).connection.effectiveType,
        downlink: (navigator as any).connection.downlink,
        saveData: (navigator as any).connection.saveData
      } : null,
      hardwareConcurrency: navigator.hardwareConcurrency,
      deviceMemory: (navigator as any).deviceMemory
    };
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateMetricId(): string {
    return `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default PerformanceAnalyticsService;
export type { PerformanceMetric, PerformanceTarget, PerformanceReport };