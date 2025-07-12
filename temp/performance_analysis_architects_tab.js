/**
 * Performance Analysis Agent - Architects Tab Loading Investigation
 * 
 * This script identifies performance bottlenecks that might cause the architects tab 
 * to appear stuck in loading state.
 * 
 * Focus Areas:
 * - Database loading performance
 * - Memory usage patterns
 * - CPU usage monitoring
 * - Main thread blocking operations
 * - Infinite loops or recursive calls
 * - Network resource loading
 */

console.log('🔍 Performance Analysis Agent - Starting Investigation...');

// Performance monitoring state
const performanceData = {
  dbInitTime: null,
  memoryUsage: [],
  cpuUsage: [],
  longTasks: [],
  networkRequests: [],
  errors: [],
  renderingMetrics: {},
  blockingOperations: []
};

/**
 * Monitor main thread blocking operations
 */
function monitorMainThreadBlocking() {
  console.log('📊 Setting up main thread blocking detection...');
  
  // Long task observer for detecting blocking operations
  if ('PerformanceObserver' in window) {
    try {
      const longTaskObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.duration > 50) { // Tasks over 50ms
            console.warn(`⚠️ Long task detected: ${entry.duration.toFixed(2)}ms`, entry);
            performanceData.longTasks.push({
              duration: entry.duration,
              startTime: entry.startTime,
              name: entry.name,
              source: entry.attribution?.[0]?.name || 'unknown'
            });
          }
        });
      });
      
      longTaskObserver.observe({ entryTypes: ['longtask'] });
      console.log('✅ Long task observer initialized');
    } catch (error) {
      console.warn('⚠️ Long task observer not supported:', error);
    }
  }
  
  // Detect synchronous blocking operations
  let lastFrameTime = performance.now();
  
  function frameCallback() {
    const now = performance.now();
    const frameDuration = now - lastFrameTime;
    
    if (frameDuration > 16.67) { // More than 60fps threshold
      performanceData.blockingOperations.push({
        frameDuration,
        timestamp: now,
        type: 'frame_blocking'
      });
      
      if (frameDuration > 100) {
        console.warn(`🚨 Severe frame blocking: ${frameDuration.toFixed(2)}ms`);
      }
    }
    
    lastFrameTime = now;
    requestAnimationFrame(frameCallback);
  }
  
  requestAnimationFrame(frameCallback);
}

/**
 * Monitor memory usage patterns
 */
function monitorMemoryUsage() {
  console.log('🧠 Starting memory usage monitoring...');
  
  function collectMemoryStats() {
    if ('memory' in performance) {
      const memInfo = performance.memory;
      const stats = {
        timestamp: Date.now(),
        usedJSHeapSize: memInfo.usedJSHeapSize,
        totalJSHeapSize: memInfo.totalJSHeapSize,
        jsHeapSizeLimit: memInfo.jsHeapSizeLimit,
        usagePercentage: (memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit) * 100
      };
      
      performanceData.memoryUsage.push(stats);
      
      if (stats.usagePercentage > 80) {
        console.warn(`🚨 High memory usage: ${stats.usagePercentage.toFixed(1)}%`);
      }
      
      // Check for memory leaks
      if (performanceData.memoryUsage.length > 1) {
        const previous = performanceData.memoryUsage[performanceData.memoryUsage.length - 2];
        const growth = stats.usedJSHeapSize - previous.usedJSHeapSize;
        if (growth > 1024 * 1024) { // 1MB growth
          console.warn(`📈 Potential memory leak detected: +${(growth / 1024 / 1024).toFixed(2)}MB`);
        }
      }
    }
  }
  
  collectMemoryStats();
  setInterval(collectMemoryStats, 1000); // Every second
}

/**
 * Monitor network requests and database operations
 */
function monitorNetworkAndDatabase() {
  console.log('🌐 Setting up network and database monitoring...');
  
  // Monitor fetch requests
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const startTime = performance.now();
    const url = args[0].toString();
    
    console.log(`🌐 Network request: ${url}`);
    
    try {
      const response = await originalFetch.apply(this, args);
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      performanceData.networkRequests.push({
        url,
        duration,
        status: response.status,
        size: response.headers.get('content-length'),
        timestamp: Date.now()
      });
      
      if (duration > 2000) {
        console.warn(`🐌 Slow network request: ${url} took ${duration.toFixed(2)}ms`);
      }
      
      return response;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      performanceData.errors.push({
        type: 'network',
        url,
        error: error.message,
        duration,
        timestamp: Date.now()
      });
      
      console.error(`❌ Network error: ${url}`, error);
      throw error;
    }
  };
  
  // Monitor database initialization
  if (window.ArchitectService) {
    console.log('🗄️ Database service found, monitoring initialization...');
    monitorDatabaseOperations();
  }
}

/**
 * Monitor database operations specifically
 */
function monitorDatabaseOperations() {
  console.log('🗄️ Monitoring database operations...');
  
  // Hook into console to catch database logs
  const originalConsoleLog = console.log;
  console.log = function(...args) {
    const message = args.join(' ');
    
    if (message.includes('データベース初期化')) {
      performanceData.dbInitTime = { start: Date.now() };
      console.log('⏱️ Database initialization started');
    }
    
    if (message.includes('データベース初期化が成功') || message.includes('初期化が成功')) {
      if (performanceData.dbInitTime) {
        performanceData.dbInitTime.end = Date.now();
        performanceData.dbInitTime.duration = performanceData.dbInitTime.end - performanceData.dbInitTime.start;
        console.log(`⏱️ Database initialization completed in ${performanceData.dbInitTime.duration}ms`);
      }
    }
    
    if (message.includes('建築家データ取得') || message.includes('Architect')) {
      console.log('🏗️ Architect data operation detected');
    }
    
    originalConsoleLog.apply(console, args);
  };
}

/**
 * Monitor for infinite loops by tracking function call patterns
 */
function detectInfiniteLoops() {
  console.log('🔄 Setting up infinite loop detection...');
  
  const functionCallCounts = new Map();
  const resetInterval = 5000; // Reset counts every 5 seconds
  
  // Override common React hooks that might cause infinite loops
  if (window.React) {
    const originalUseEffect = window.React.useEffect;
    if (originalUseEffect) {
      window.React.useEffect = function(effect, deps) {
        const caller = new Error().stack?.split('\n')[2] || 'unknown';
        const callKey = `useEffect_${caller}`;
        
        const count = functionCallCounts.get(callKey) || 0;
        functionCallCounts.set(callKey, count + 1);
        
        if (count > 100) {
          console.error(`🚨 Potential infinite useEffect loop detected: ${caller}`);
          performanceData.errors.push({
            type: 'infinite_loop',
            source: 'useEffect',
            caller,
            count,
            timestamp: Date.now()
          });
        }
        
        return originalUseEffect.call(this, effect, deps);
      };
    }
  }
  
  // Reset function call counts periodically
  setInterval(() => {
    functionCallCounts.clear();
  }, resetInterval);
}

/**
 * Monitor rendering performance
 */
function monitorRenderingPerformance() {
  console.log('🎨 Setting up rendering performance monitoring...');
  
  if ('PerformanceObserver' in window) {
    try {
      // Monitor paint events
      const paintObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          performanceData.renderingMetrics[entry.name] = entry.startTime;
          console.log(`🎨 ${entry.name}: ${entry.startTime.toFixed(2)}ms`);
        });
      });
      
      paintObserver.observe({ entryTypes: ['paint'] });
      
      // Monitor largest contentful paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        performanceData.renderingMetrics.largestContentfulPaint = lastEntry.startTime;
        console.log(`🎨 Largest Contentful Paint: ${lastEntry.startTime.toFixed(2)}ms`);
      });
      
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      
    } catch (error) {
      console.warn('⚠️ Performance observers not fully supported:', error);
    }
  }
}

/**
 * Analyze React component performance
 */
function analyzeReactPerformance() {
  console.log('⚛️ Setting up React performance analysis...');
  
  // Try to access React DevTools profiler
  if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    console.log('⚛️ React DevTools detected');
    
    // Hook into React fiber for performance insights
    const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
    if (hook.onCommitFiberRoot) {
      const originalOnCommit = hook.onCommitFiberRoot;
      hook.onCommitFiberRoot = function(rendererID, root, ...args) {
        console.log('⚛️ React commit detected', { rendererID, root });
        return originalOnCommit.call(this, rendererID, root, ...args);
      };
    }
  }
  
  // Monitor for excessive re-renders
  let renderCount = 0;
  const renderTimestamps = [];
  
  const observer = new MutationObserver((mutations) => {
    renderCount++;
    renderTimestamps.push(Date.now());
    
    // Check for excessive renders in short time period
    const now = Date.now();
    const recentRenders = renderTimestamps.filter(time => now - time < 1000);
    
    if (recentRenders.length > 50) {
      console.warn(`⚛️ Excessive renders detected: ${recentRenders.length} renders in 1 second`);
      performanceData.errors.push({
        type: 'excessive_renders',
        count: recentRenders.length,
        timestamp: now
      });
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: false
  });
}

/**
 * Generate performance report
 */
function generatePerformanceReport() {
  console.log('📊 Generating performance analysis report...');
  
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalErrors: performanceData.errors.length,
      longTasksCount: performanceData.longTasks.length,
      avgMemoryUsage: performanceData.memoryUsage.length > 0 
        ? performanceData.memoryUsage.reduce((sum, item) => sum + item.usagePercentage, 0) / performanceData.memoryUsage.length 
        : 0,
      slowNetworkRequests: performanceData.networkRequests.filter(req => req.duration > 1000).length,
      blockingOperationsCount: performanceData.blockingOperations.length
    },
    databasePerformance: {
      initTime: performanceData.dbInitTime?.duration || null,
      initSuccess: !!performanceData.dbInitTime?.end
    },
    memoryAnalysis: {
      peakUsage: performanceData.memoryUsage.length > 0 
        ? Math.max(...performanceData.memoryUsage.map(m => m.usagePercentage)) 
        : 0,
      memoryGrowth: performanceData.memoryUsage.length > 1 
        ? performanceData.memoryUsage[performanceData.memoryUsage.length - 1].usedJSHeapSize - performanceData.memoryUsage[0].usedJSHeapSize
        : 0,
      possibleLeaks: performanceData.memoryUsage.filter((m, i, arr) => 
        i > 0 && m.usedJSHeapSize - arr[i-1].usedJSHeapSize > 1024 * 1024
      ).length
    },
    networkAnalysis: {
      totalRequests: performanceData.networkRequests.length,
      slowRequests: performanceData.networkRequests.filter(req => req.duration > 1000),
      failedRequests: performanceData.networkRequests.filter(req => req.status >= 400),
      avgRequestTime: performanceData.networkRequests.length > 0 
        ? performanceData.networkRequests.reduce((sum, req) => sum + req.duration, 0) / performanceData.networkRequests.length 
        : 0
    },
    renderingAnalysis: {
      metrics: performanceData.renderingMetrics,
      longTasks: performanceData.longTasks.filter(task => task.duration > 100),
      blockingOperations: performanceData.blockingOperations.filter(op => op.frameDuration > 50)
    },
    errors: performanceData.errors,
    recommendations: []
  };
  
  // Generate recommendations based on findings
  if (report.summary.longTasksCount > 5) {
    report.recommendations.push({
      priority: 'high',
      issue: 'Multiple long tasks detected',
      solution: 'Consider breaking down large operations into smaller chunks or using Web Workers'
    });
  }
  
  if (report.memoryAnalysis.peakUsage > 80) {
    report.recommendations.push({
      priority: 'high',
      issue: 'High memory usage detected',
      solution: 'Investigate memory leaks and optimize data structures'
    });
  }
  
  if (report.databasePerformance.initTime > 5000) {
    report.recommendations.push({
      priority: 'medium',
      issue: 'Slow database initialization',
      solution: 'Consider using chunked loading or preloading database in background'
    });
  }
  
  if (report.networkAnalysis.slowRequests.length > 0) {
    report.recommendations.push({
      priority: 'medium',
      issue: 'Slow network requests detected',
      solution: 'Optimize database queries and consider request caching'
    });
  }
  
  if (report.renderingAnalysis.blockingOperations.length > 10) {
    report.recommendations.push({
      priority: 'high',
      issue: 'Frequent main thread blocking detected',
      solution: 'Use requestIdleCallback for non-critical operations and optimize render cycles'
    });
  }
  
  console.log('📊 Performance Analysis Report:', report);
  
  // Store report for later analysis
  if (typeof window !== 'undefined') {
    window.performanceAnalysisReport = report;
  }
  
  return report;
}

/**
 * Initialize performance monitoring
 */
function initializePerformanceMonitoring() {
  console.log('🚀 Initializing Performance Analysis Agent...');
  
  try {
    monitorMainThreadBlocking();
    monitorMemoryUsage();
    monitorNetworkAndDatabase();
    detectInfiniteLoops();
    monitorRenderingPerformance();
    analyzeReactPerformance();
    
    // Generate report after 30 seconds of monitoring
    setTimeout(() => {
      generatePerformanceReport();
    }, 30000);
    
    // Also generate report when page is about to unload
    window.addEventListener('beforeunload', () => {
      generatePerformanceReport();
    });
    
    console.log('✅ Performance Analysis Agent initialized successfully');
    
    // Provide manual report generation function
    window.generatePerformanceReport = generatePerformanceReport;
    
  } catch (error) {
    console.error('❌ Failed to initialize Performance Analysis Agent:', error);
  }
}

// Start monitoring immediately if DOM is ready, otherwise wait for DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializePerformanceMonitoring);
} else {
  initializePerformanceMonitoring();
}

// Export for manual usage
if (typeof window !== 'undefined') {
  window.PerformanceAnalysisAgent = {
    initialize: initializePerformanceMonitoring,
    generateReport: generatePerformanceReport,
    getData: () => performanceData
  };
}

console.log('🔍 Performance Analysis Agent script loaded. Use window.generatePerformanceReport() to get current analysis.');