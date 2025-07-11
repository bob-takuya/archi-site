/**
 * Performance Monitoring Utilities
 * Tracks and analyzes application performance metrics for optimization
 */

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  type: 'timing' | 'counter' | 'gauge';
  tags?: Record<string, string>;
}

interface SearchPerformanceData {
  query: string;
  queryLength: number;
  resultCount: number;
  searchTime: number;
  cacheHit: boolean;
  timestamp: number;
}

interface MobilePerformanceData {
  touchTargetCompliance: number; // Percentage of compliant touch targets
  gestureRecognitionAccuracy: number; // Percentage of successful gestures
  mobileLoadTime: number; // Load time on mobile
  touchResponseTime: number; // Average touch response time
  timestamp: number;
}

interface DatabasePerformanceData {
  queryType: string;
  queryTime: number;
  resultSize: number;
  cacheHit: boolean;
  indexUsed: boolean;
  timestamp: number;
}

interface UserEngagementData {
  sessionDuration: number;
  pagesPerSession: number;
  bounceRate: number;
  bookmarkUsage: number;
  timestamp: number;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetric[] = [];
  private maxMetrics = 1000;
  private reportingInterval = 60000; // 1 minute
  private reportingTimer?: NodeJS.Timeout;
  
  // Performance thresholds
  private readonly thresholds = {
    searchResponseTime: 500, // ms
    databaseQueryTime: 200, // ms
    mapRenderTime: 1000, // ms
    mobileLoadTime: 2000, // ms
    touchResponseTime: 100, // ms
    cacheHitRate: 0.8 // 80%
  };
  
  // KPI targets
  private readonly targets = {
    touchTargetCompliance: 1.0, // 100%
    gestureRecognitionAccuracy: 0.95, // 95%
    searchTaskSuccessRate: 0.55, // 55% improvement target
    userEngagementIncrease: 0.4 // 40% increase target
  };
  
  constructor() {
    this.initializePerformanceObserver();
    this.startReporting();
  }
  
  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }
  
  /**
   * Initialize Performance Observer for Web Vitals
   */
  private initializePerformanceObserver(): void {
    if (typeof PerformanceObserver !== 'undefined') {
      // Observe Core Web Vitals
      try {
        const observer = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            this.recordMetric({
              name: entry.name,
              value: entry.duration || (entry as any).value || 0,
              timestamp: Date.now(),
              type: 'timing',
              tags: {
                entryType: entry.entryType,
                source: 'performance-observer'
              }
            });
          });
        });
        
        // Observe different entry types
        ['navigation', 'measure', 'paint', 'largest-contentful-paint'].forEach(type => {
          try {
            observer.observe({ entryTypes: [type] });
          } catch (e) {
            console.debug(`Performance observer type ${type} not supported`);
          }
        });
      } catch (error) {
        console.debug('PerformanceObserver not supported:', error);
      }
    }
  }
  
  /**
   * Record a performance metric
   */
  recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);
    
    // Limit metrics array size
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
    
    // Check for performance violations
    this.checkThresholds(metric);
  }
  
  /**
   * Track search performance
   */
  trackSearchPerformance(data: SearchPerformanceData): void {
    this.recordMetric({
      name: 'search_performance',
      value: data.searchTime,
      timestamp: data.timestamp,
      type: 'timing',
      tags: {
        queryLength: data.queryLength.toString(),
        resultCount: data.resultCount.toString(),
        cacheHit: data.cacheHit.toString()
      }
    });
    
    // Track search success/failure
    this.recordMetric({
      name: 'search_task_success',
      value: data.resultCount > 0 ? 1 : 0,
      timestamp: data.timestamp,
      type: 'counter',
      tags: {
        query: data.query.substring(0, 50) // Truncate for privacy
      }
    });
  }
  
  /**
   * Track mobile performance metrics
   */
  trackMobilePerformance(data: MobilePerformanceData): void {
    // Touch target compliance
    this.recordMetric({
      name: 'touch_target_compliance',
      value: data.touchTargetCompliance,
      timestamp: data.timestamp,
      type: 'gauge',
      tags: { device: 'mobile' }
    });
    
    // Gesture recognition accuracy
    this.recordMetric({
      name: 'gesture_recognition_accuracy',
      value: data.gestureRecognitionAccuracy,
      timestamp: data.timestamp,
      type: 'gauge',
      tags: { device: 'mobile' }
    });
    
    // Mobile load time
    this.recordMetric({
      name: 'mobile_load_time',
      value: data.mobileLoadTime,
      timestamp: data.timestamp,
      type: 'timing',
      tags: { device: 'mobile' }
    });
    
    // Touch response time
    this.recordMetric({
      name: 'touch_response_time',
      value: data.touchResponseTime,
      timestamp: data.timestamp,
      type: 'timing',
      tags: { device: 'mobile' }
    });
  }
  
  /**
   * Track database performance
   */
  trackDatabasePerformance(data: DatabasePerformanceData): void {
    this.recordMetric({
      name: 'database_query_time',
      value: data.queryTime,
      timestamp: data.timestamp,
      type: 'timing',
      tags: {
        queryType: data.queryType,
        cacheHit: data.cacheHit.toString(),
        indexUsed: data.indexUsed.toString(),
        resultSize: data.resultSize.toString()
      }
    });
  }
  
  /**
   * Track user engagement metrics
   */
  trackUserEngagement(data: UserEngagementData): void {
    this.recordMetric({
      name: 'session_duration',
      value: data.sessionDuration,
      timestamp: data.timestamp,
      type: 'timing'
    });
    
    this.recordMetric({
      name: 'pages_per_session',
      value: data.pagesPerSession,
      timestamp: data.timestamp,
      type: 'counter'
    });
    
    this.recordMetric({
      name: 'bounce_rate',
      value: data.bounceRate,
      timestamp: data.timestamp,
      type: 'gauge'
    });
    
    this.recordMetric({
      name: 'bookmark_usage',
      value: data.bookmarkUsage,
      timestamp: data.timestamp,
      type: 'counter'
    });
  }
  
  /**
   * Track user interaction timing
   */
  trackUserInteraction(action: string, duration: number): void {
    this.recordMetric({
      name: 'user_interaction',
      value: duration,
      timestamp: Date.now(),
      type: 'timing',
      tags: { action }
    });
    
    // Send to analytics if available
    if (typeof gtag !== 'undefined') {
      gtag('event', 'user_interaction', {
        action,
        duration,
        timestamp: Date.now()
      });
    }
  }
  
  /**
   * Check performance thresholds and alert on violations
   */
  private checkThresholds(metric: PerformanceMetric): void {
    let violated = false;
    let threshold = 0;
    
    switch (metric.name) {
      case 'search_performance':
        threshold = this.thresholds.searchResponseTime;
        violated = metric.value > threshold;
        break;
      
      case 'database_query_time':
        threshold = this.thresholds.databaseQueryTime;
        violated = metric.value > threshold;
        break;
      
      case 'mobile_load_time':
        threshold = this.thresholds.mobileLoadTime;
        violated = metric.value > threshold;
        break;
      
      case 'touch_response_time':
        threshold = this.thresholds.touchResponseTime;
        violated = metric.value > threshold;
        break;
    }
    
    if (violated) {
      console.warn(`Performance threshold violated: ${metric.name} = ${metric.value}ms (threshold: ${threshold}ms)`);
      
      // Report to monitoring service
      this.reportPerformanceViolation(metric, threshold);
    }
  }
  
  /**
   * Report performance violation to monitoring service
   */
  private reportPerformanceViolation(metric: PerformanceMetric, threshold: number): void {
    // This would typically send to a monitoring service like DataDog, NewRelic, etc.
    const violation = {
      metric: metric.name,
      value: metric.value,
      threshold,
      timestamp: metric.timestamp,
      tags: metric.tags,
      severity: this.calculateSeverity(metric.value, threshold)
    };
    
    // Log for now, replace with actual monitoring service call
    console.error('Performance violation:', violation);
  }
  
  /**
   * Calculate severity of performance violation
   */
  private calculateSeverity(value: number, threshold: number): 'low' | 'medium' | 'high' | 'critical' {
    const ratio = value / threshold;
    
    if (ratio < 1.2) return 'low';
    if (ratio < 1.5) return 'medium';
    if (ratio < 2.0) return 'high';
    return 'critical';
  }
  
  /**
   * Get performance summary
   */
  getPerformanceSummary(): {
    searchPerformance: { average: number; p95: number; violations: number };
    mobilePerformance: { touchCompliance: number; gestureAccuracy: number; loadTime: number };
    databasePerformance: { averageQueryTime: number; cacheHitRate: number };
    userEngagement: { averageSession: number; averagePages: number; bookmarkUsage: number };
  } {
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const recentMetrics = this.metrics.filter(m => m.timestamp > oneDayAgo);
    
    return {
      searchPerformance: this.calculateSearchMetrics(recentMetrics),
      mobilePerformance: this.calculateMobileMetrics(recentMetrics),
      databasePerformance: this.calculateDatabaseMetrics(recentMetrics),
      userEngagement: this.calculateEngagementMetrics(recentMetrics)
    };
  }
  
  /**
   * Calculate search performance metrics
   */
  private calculateSearchMetrics(metrics: PerformanceMetric[]): {
    average: number;
    p95: number;
    violations: number;
  } {
    const searchMetrics = metrics.filter(m => m.name === 'search_performance');
    
    if (searchMetrics.length === 0) {
      return { average: 0, p95: 0, violations: 0 };
    }
    
    const values = searchMetrics.map(m => m.value).sort((a, b) => a - b);
    const average = values.reduce((sum, val) => sum + val, 0) / values.length;
    const p95Index = Math.floor(values.length * 0.95);
    const p95 = values[p95Index] || 0;
    const violations = values.filter(v => v > this.thresholds.searchResponseTime).length;
    
    return { average, p95, violations };
  }
  
  /**
   * Calculate mobile performance metrics
   */
  private calculateMobileMetrics(metrics: PerformanceMetric[]): {
    touchCompliance: number;
    gestureAccuracy: number;
    loadTime: number;
  } {
    const touchMetrics = metrics.filter(m => m.name === 'touch_target_compliance');
    const gestureMetrics = metrics.filter(m => m.name === 'gesture_recognition_accuracy');
    const loadMetrics = metrics.filter(m => m.name === 'mobile_load_time');
    
    const touchCompliance = touchMetrics.length > 0 
      ? touchMetrics[touchMetrics.length - 1].value 
      : 0;
    
    const gestureAccuracy = gestureMetrics.length > 0 
      ? gestureMetrics[gestureMetrics.length - 1].value 
      : 0;
    
    const loadTime = loadMetrics.length > 0 
      ? loadMetrics.reduce((sum, m) => sum + m.value, 0) / loadMetrics.length 
      : 0;
    
    return { touchCompliance, gestureAccuracy, loadTime };
  }
  
  /**
   * Calculate database performance metrics
   */
  private calculateDatabaseMetrics(metrics: PerformanceMetric[]): {
    averageQueryTime: number;
    cacheHitRate: number;
  } {
    const dbMetrics = metrics.filter(m => m.name === 'database_query_time');
    
    if (dbMetrics.length === 0) {
      return { averageQueryTime: 0, cacheHitRate: 0 };
    }
    
    const averageQueryTime = dbMetrics.reduce((sum, m) => sum + m.value, 0) / dbMetrics.length;
    const cacheHits = dbMetrics.filter(m => m.tags?.cacheHit === 'true').length;
    const cacheHitRate = cacheHits / dbMetrics.length;
    
    return { averageQueryTime, cacheHitRate };
  }
  
  /**
   * Calculate user engagement metrics
   */
  private calculateEngagementMetrics(metrics: PerformanceMetric[]): {
    averageSession: number;
    averagePages: number;
    bookmarkUsage: number;
  } {
    const sessionMetrics = metrics.filter(m => m.name === 'session_duration');
    const pageMetrics = metrics.filter(m => m.name === 'pages_per_session');
    const bookmarkMetrics = metrics.filter(m => m.name === 'bookmark_usage');
    
    const averageSession = sessionMetrics.length > 0 
      ? sessionMetrics.reduce((sum, m) => sum + m.value, 0) / sessionMetrics.length 
      : 0;
    
    const averagePages = pageMetrics.length > 0 
      ? pageMetrics.reduce((sum, m) => sum + m.value, 0) / pageMetrics.length 
      : 0;
    
    const bookmarkUsage = bookmarkMetrics.reduce((sum, m) => sum + m.value, 0);
    
    return { averageSession, averagePages, bookmarkUsage };
  }
  
  /**
   * Start periodic reporting
   */
  private startReporting(): void {
    if (this.reportingTimer) {
      clearInterval(this.reportingTimer);
    }
    
    this.reportingTimer = setInterval(() => {
      this.generatePerformanceReport();
    }, this.reportingInterval);
  }
  
  /**
   * Generate and send performance report
   */
  private generatePerformanceReport(): void {
    const summary = this.getPerformanceSummary();
    
    // Log performance summary
    console.log('Performance Report:', {
      timestamp: new Date().toISOString(),
      summary,
      metricsCount: this.metrics.length
    });
    
    // Check against targets
    this.checkTargets(summary);
  }
  
  /**
   * Check performance against targets
   */
  private checkTargets(summary: any): void {
    const issues: string[] = [];
    
    // Check search performance target (45% task failure reduction)
    if (summary.searchPerformance.violations > 0) {
      issues.push(`Search performance violations: ${summary.searchPerformance.violations}`);
    }
    
    // Check mobile targets
    if (summary.mobilePerformance.touchCompliance < this.targets.touchTargetCompliance) {
      issues.push(`Touch target compliance below 100%: ${Math.round(summary.mobilePerformance.touchCompliance * 100)}%`);
    }
    
    if (summary.mobilePerformance.gestureAccuracy < this.targets.gestureRecognitionAccuracy) {
      issues.push(`Gesture recognition below 95%: ${Math.round(summary.mobilePerformance.gestureAccuracy * 100)}%`);
    }
    
    // Check database performance
    if (summary.databasePerformance.cacheHitRate < this.thresholds.cacheHitRate) {
      issues.push(`Cache hit rate below 80%: ${Math.round(summary.databasePerformance.cacheHitRate * 100)}%`);
    }
    
    if (issues.length > 0) {
      console.warn('Performance targets not met:', issues);
    }
  }
  
  /**
   * Export metrics data
   */
  exportMetrics(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      const header = 'name,value,timestamp,type,tags\n';
      const rows = this.metrics.map(m => 
        `${m.name},${m.value},${m.timestamp},${m.type},"${JSON.stringify(m.tags || {})}"`
      ).join('\n');
      return header + rows;
    }
    
    return JSON.stringify(this.metrics, null, 2);
  }
  
  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = [];
  }
  
  /**
   * Stop monitoring
   */
  stop(): void {
    if (this.reportingTimer) {
      clearInterval(this.reportingTimer);
      this.reportingTimer = undefined;
    }
  }
}

// Global performance monitoring instance
export const performanceMonitor = PerformanceMonitor.getInstance();

// Convenience functions for common use cases
export const trackSearch = (data: SearchPerformanceData) => 
  performanceMonitor.trackSearchPerformance(data);

export const trackMobile = (data: MobilePerformanceData) => 
  performanceMonitor.trackMobilePerformance(data);

export const trackDatabase = (data: DatabasePerformanceData) => 
  performanceMonitor.trackDatabasePerformance(data);

export const trackEngagement = (data: UserEngagementData) => 
  performanceMonitor.trackUserEngagement(data);

export const trackInteraction = (action: string, duration: number) => 
  performanceMonitor.trackUserInteraction(action, duration);

export default PerformanceMonitor;