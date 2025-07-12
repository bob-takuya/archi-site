/**
 * Real-Time Architects Tab Diagnostics
 * 
 * Run this script in the browser console when the architects tab is loading
 * to get immediate insights into what's causing the performance issues.
 */

console.log('🔍 Real-Time Architects Tab Diagnostics Starting...');

// Global diagnostic state
window.architectsDiagnostics = {
  renderCount: 0,
  effectRuns: 0,
  stateUpdates: 0,
  memorySnapshots: [],
  networkRequests: [],
  errors: [],
  startTime: Date.now()
};

/**
 * Monitor React renders by hooking into React DevTools
 */
function monitorReactRenders() {
  console.log('🎯 Setting up React render monitoring...');
  
  // Hook into React DevTools if available
  if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
    
    if (hook.onCommitFiberRoot) {
      const originalOnCommit = hook.onCommitFiberRoot;
      hook.onCommitFiberRoot = function(rendererID, root, priorityLevel) {
        window.architectsDiagnostics.renderCount++;
        
        // Check for excessive renders
        if (window.architectsDiagnostics.renderCount > 10) {
          console.warn(`🚨 Excessive renders detected: ${window.architectsDiagnostics.renderCount} renders`);
          
          if (window.architectsDiagnostics.renderCount > 50) {
            console.error('🆘 INFINITE RENDER LOOP DETECTED! Stopping diagnostics...');
            return; // Stop monitoring to prevent browser crash
          }
        }
        
        return originalOnCommit.call(this, rendererID, root, priorityLevel);
      };
    }
  }
  
  // Monitor DOM mutations as proxy for renders
  const observer = new MutationObserver((mutations) => {
    if (mutations.length > 0) {
      window.architectsDiagnostics.renderCount++;
      
      // Log if we see rapid mutations
      if (window.architectsDiagnostics.renderCount % 10 === 0) {
        console.log(`📊 Render count: ${window.architectsDiagnostics.renderCount}`);
      }
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: false
  });
  
  return observer;
}

/**
 * Monitor useEffect executions
 */
function monitorUseEffectCalls() {
  console.log('🔄 Setting up useEffect monitoring...');
  
  // Hook into console.log to catch React logging
  const originalLog = console.log;
  console.log = function(...args) {
    const message = args.join(' ');
    
    if (message.includes('useEffect') || message.includes('建築家') || message.includes('タグ')) {
      window.architectsDiagnostics.effectRuns++;
      console.warn(`🔄 useEffect run detected #${window.architectsDiagnostics.effectRuns}: ${message}`);
      
      if (window.architectsDiagnostics.effectRuns > 20) {
        console.error('🚨 EXCESSIVE useEffect RUNS - Potential infinite loop!');
      }
    }
    
    originalLog.apply(console, args);
  };
}

/**
 * Monitor memory usage in real-time
 */
function monitorMemoryUsage() {
  console.log('🧠 Setting up memory monitoring...');
  
  function captureMemorySnapshot() {
    if ('memory' in performance) {
      const snapshot = {
        timestamp: Date.now(),
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit
      };
      
      window.architectsDiagnostics.memorySnapshots.push(snapshot);
      
      // Check for memory growth
      if (window.architectsDiagnostics.memorySnapshots.length > 1) {
        const previous = window.architectsDiagnostics.memorySnapshots[window.architectsDiagnostics.memorySnapshots.length - 2];
        const growth = snapshot.used - previous.used;
        
        if (growth > 1024 * 1024) { // 1MB growth
          console.warn(`📈 Memory growth detected: +${(growth / 1024 / 1024).toFixed(2)}MB`);
        }
        
        if (growth > 5 * 1024 * 1024) { // 5MB growth
          console.error(`🚨 RAPID MEMORY GROWTH: +${(growth / 1024 / 1024).toFixed(2)}MB`);
        }
      }
      
      console.log(`🧠 Memory: ${(snapshot.used / 1024 / 1024).toFixed(2)}MB used`);
    }
  }
  
  captureMemorySnapshot();
  return setInterval(captureMemorySnapshot, 2000); // Every 2 seconds
}

/**
 * Monitor network requests
 */
function monitorNetworkRequests() {
  console.log('🌐 Setting up network monitoring...');
  
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const url = args[0].toString();
    const startTime = Date.now();
    
    console.log(`🌐 Network request: ${url}`);
    
    try {
      const response = await originalFetch.apply(this, args);
      const duration = Date.now() - startTime;
      
      window.architectsDiagnostics.networkRequests.push({
        url,
        duration,
        status: response.status,
        timestamp: startTime
      });
      
      if (duration > 1000) {
        console.warn(`🐌 Slow request: ${url} took ${duration}ms`);
      }
      
      return response;
    } catch (error) {
      window.architectsDiagnostics.errors.push({
        type: 'network',
        url,
        error: error.message,
        timestamp: Date.now()
      });
      
      console.error(`❌ Network error: ${url}`, error);
      throw error;
    }
  };
}

/**
 * Monitor for stuck loading indicators
 */
function monitorLoadingState() {
  console.log('⏳ Setting up loading state monitoring...');
  
  function checkLoadingIndicators() {
    const spinners = document.querySelectorAll('.MuiCircularProgress-root, [role="progressbar"]');
    const loadingTexts = document.querySelectorAll('*:contains("読み込み中"), *:contains("Loading")');
    
    if (spinners.length > 0 || loadingTexts.length > 0) {
      const elapsed = Date.now() - window.architectsDiagnostics.startTime;
      
      if (elapsed > 10000) { // 10 seconds
        console.error(`🚨 LOADING STUCK: Indicators still visible after ${elapsed}ms`);
        
        // Take screenshot of current state
        if ('html2canvas' in window) {
          html2canvas(document.body).then(canvas => {
            console.log('📸 Loading state screenshot captured');
            window.architectsDiagnosticsScreenshot = canvas.toDataURL();
          });
        }
      } else if (elapsed > 5000) { // 5 seconds
        console.warn(`⏳ Long loading time: ${elapsed}ms`);
      }
    }
  }
  
  return setInterval(checkLoadingIndicators, 1000); // Every second
}

/**
 * Analyze current state and provide recommendations
 */
function analyzeAndRecommend() {
  console.log('📊 Analyzing current state...');
  
  const diagnostics = window.architectsDiagnostics;
  const elapsed = Date.now() - diagnostics.startTime;
  
  console.log('📊 DIAGNOSTICS SUMMARY:');
  console.log(`  ⏱️ Elapsed time: ${elapsed}ms`);
  console.log(`  🔄 Render count: ${diagnostics.renderCount}`);
  console.log(`  🎯 useEffect runs: ${diagnostics.effectRuns}`);
  console.log(`  🌐 Network requests: ${diagnostics.networkRequests.length}`);
  console.log(`  ❌ Errors: ${diagnostics.errors.length}`);
  
  // Memory analysis
  if (diagnostics.memorySnapshots.length > 1) {
    const first = diagnostics.memorySnapshots[0];
    const last = diagnostics.memorySnapshots[diagnostics.memorySnapshots.length - 1];
    const growth = last.used - first.used;
    console.log(`  🧠 Memory growth: ${(growth / 1024 / 1024).toFixed(2)}MB`);
  }
  
  // Identify issues
  const issues = [];
  
  if (diagnostics.renderCount > 20) {
    issues.push({
      severity: 'CRITICAL',
      issue: 'Excessive renders detected',
      likely_cause: 'useEffect without proper dependencies or infinite re-render loop',
      recommendation: 'Check useEffect dependency arrays in ArchitectsPage component'
    });
  }
  
  if (diagnostics.effectRuns > 15) {
    issues.push({
      severity: 'HIGH',
      issue: 'Excessive useEffect executions',
      likely_cause: 'Missing or incorrect dependency arrays',
      recommendation: 'Add proper dependency arrays to all useEffect hooks'
    });
  }
  
  if (diagnostics.memorySnapshots.length > 1) {
    const growth = diagnostics.memorySnapshots[diagnostics.memorySnapshots.length - 1].used - diagnostics.memorySnapshots[0].used;
    if (growth > 10 * 1024 * 1024) { // 10MB
      issues.push({
        severity: 'HIGH',
        issue: 'Rapid memory growth',
        likely_cause: 'Memory leak from uncleaned subscriptions or infinite loops',
        recommendation: 'Add cleanup functions to useEffect hooks'
      });
    }
  }
  
  if (elapsed > 10000 && diagnostics.networkRequests.length === 0) {
    issues.push({
      severity: 'HIGH',
      issue: 'No network activity detected but still loading',
      likely_cause: 'JavaScript execution stuck in infinite loop',
      recommendation: 'Check for infinite loops in component render logic'
    });
  }
  
  // Report findings
  if (issues.length > 0) {
    console.error('🚨 ISSUES DETECTED:');
    issues.forEach((issue, index) => {
      console.error(`  ${index + 1}. [${issue.severity}] ${issue.issue}`);
      console.error(`     Cause: ${issue.likely_cause}`);
      console.error(`     Fix: ${issue.recommendation}`);
    });
  } else {
    console.log('✅ No major issues detected in current analysis window');
  }
  
  return issues;
}

/**
 * Generate actionable fix suggestions
 */
function generateFixSuggestions() {
  console.log('💡 Generating fix suggestions...');
  
  const suggestions = [
    {
      problem: 'Infinite re-renders',
      solution: `
// Fix useEffect dependency arrays
useEffect(() => {
  loadArchitects();
}, []); // Add empty array for one-time execution

useEffect(() => {
  loadArchitects();
}, [searchTerm, filters]); // Add all dependencies`
    },
    {
      problem: 'Memory leaks',
      solution: `
// Add cleanup functions
useEffect(() => {
  const controller = new AbortController();
  
  loadData({ signal: controller.signal });
  
  return () => controller.abort(); // Cleanup
}, [dependencies]);`
    },
    {
      problem: 'Excessive state updates',
      solution: `
// Batch state updates
const updateFilters = useCallback((newFilters) => {
  setFilters(prev => ({ ...prev, ...newFilters }));
}, []);`
    }
  ];
  
  suggestions.forEach((suggestion, index) => {
    console.log(`💡 Fix ${index + 1}: ${suggestion.problem}`);
    console.log(suggestion.solution);
  });
}

// Initialize all monitoring
function startDiagnostics() {
  console.log('🚀 Starting comprehensive diagnostics...');
  
  const mutationObserver = monitorReactRenders();
  monitorUseEffectCalls();
  const memoryInterval = monitorMemoryUsage();
  monitorNetworkRequests();
  const loadingInterval = monitorLoadingState();
  
  // Analyze every 5 seconds
  const analysisInterval = setInterval(analyzeAndRecommend, 5000);
  
  // Stop diagnostics after 30 seconds to prevent infinite monitoring
  setTimeout(() => {
    console.log('⏹️ Stopping diagnostics after 30 seconds');
    mutationObserver.disconnect();
    clearInterval(memoryInterval);
    clearInterval(loadingInterval);
    clearInterval(analysisInterval);
    
    // Final analysis
    console.log('\n' + '='.repeat(50));
    console.log('📊 FINAL DIAGNOSTICS REPORT');
    console.log('='.repeat(50));
    analyzeAndRecommend();
    generateFixSuggestions();
    
    // Store results for later analysis
    window.finalArchitectsDiagnostics = window.architectsDiagnostics;
    console.log('💾 Diagnostics saved to window.finalArchitectsDiagnostics');
    
  }, 30000);
  
  console.log('✅ Diagnostics running... Will auto-stop in 30 seconds');
}

// Provide manual control functions
window.startArchitectsDiagnostics = startDiagnostics;
window.analyzeArchitectsState = analyzeAndRecommend;
window.getArchitectsDiagnostics = () => window.architectsDiagnostics;

// Auto-start if we're on the architects page
if (window.location.pathname.includes('architects')) {
  console.log('🎯 Architects page detected, starting diagnostics...');
  startDiagnostics();
} else {
  console.log('📋 Diagnostics ready. Navigate to architects page or run window.startArchitectsDiagnostics()');
}

// Usage instructions
console.log(`
🔍 ARCHITECTS TAB DIAGNOSTICS LOADED

Commands available:
- window.startArchitectsDiagnostics()  - Start monitoring
- window.analyzeArchitectsState()      - Get current analysis  
- window.getArchitectsDiagnostics()    - Get raw diagnostic data

The script will automatically analyze for:
✅ Infinite re-render loops
✅ Memory leaks
✅ useEffect issues
✅ Network bottlenecks
✅ Stuck loading states

Results will be logged to console with actionable fix suggestions.
`);

export default { startDiagnostics, analyzeAndRecommend };