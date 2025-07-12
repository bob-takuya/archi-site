/**
 * Architects Tab Performance Analysis Test
 * 
 * This Playwright test monitors performance bottlenecks that might cause
 * the architects tab to appear stuck in loading state.
 */

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

test.describe('Architects Tab Performance Analysis', () => {
  let performanceMetrics = {};
  let consoleLogs = [];
  let networkRequests = [];
  let errors = [];

  test.beforeEach(async ({ page }) => {
    // Reset metrics
    performanceMetrics = {};
    consoleLogs = [];
    networkRequests = [];
    errors = [];

    // Capture console logs for debugging
    page.on('console', msg => {
      const logEntry = {
        type: msg.type(),
        text: msg.text(),
        timestamp: Date.now()
      };
      consoleLogs.push(logEntry);
      
      if (msg.type() === 'error') {
        errors.push(logEntry);
      }
    });

    // Monitor network requests
    page.on('request', request => {
      networkRequests.push({
        url: request.url(),
        method: request.method(),
        startTime: Date.now(),
        resourceType: request.resourceType()
      });
    });

    page.on('response', response => {
      const request = networkRequests.find(req => req.url === response.url());
      if (request) {
        request.endTime = Date.now();
        request.duration = request.endTime - request.startTime;
        request.status = response.status();
        request.size = response.headers()['content-length'];
      }
    });

    // Capture JavaScript errors
    page.on('pageerror', error => {
      errors.push({
        type: 'javascript',
        message: error.message,
        stack: error.stack,
        timestamp: Date.now()
      });
    });
  });

  test('Monitor architects tab loading performance', async ({ page }) => {
    console.log('🔍 Starting architects tab performance analysis...');

    // Start performance tracing
    await page.tracing.start({
      path: path.join(__dirname, 'architects_performance_trace.json'),
      screenshots: true
    });

    // Navigate to the site
    const startTime = Date.now();
    console.log('📍 Navigating to architects page...');
    
    await page.goto('http://localhost:5173/architects', { 
      waitUntil: 'networkidle',
      timeout: 60000 
    });

    const navigationTime = Date.now() - startTime;
    performanceMetrics.navigationTime = navigationTime;
    console.log(`⏱️ Navigation completed in ${navigationTime}ms`);

    // Inject performance monitoring script
    const performanceScript = fs.readFileSync(
      path.join(__dirname, 'performance_analysis_architects_tab.js'), 
      'utf8'
    );
    await page.evaluate(performanceScript);

    // Wait for database initialization to complete
    console.log('🗄️ Waiting for database initialization...');
    
    try {
      await page.waitForFunction(() => {
        return window.PerformanceAnalysisAgent && 
               window.performanceAnalysisReport?.databasePerformance?.initSuccess;
      }, { timeout: 30000 });
      
      console.log('✅ Database initialization detected');
    } catch (error) {
      console.warn('⚠️ Database initialization timeout, continuing analysis...');
    }

    // Monitor for loading indicators
    console.log('🔄 Checking for loading indicators...');
    
    const loadingIndicator = page.locator('[role="progressbar"], .MuiCircularProgress-root, text="読み込み中"');
    const hasLoadingIndicator = await loadingIndicator.isVisible().catch(() => false);
    
    if (hasLoadingIndicator) {
      console.log('🔄 Loading indicator found, waiting for completion...');
      
      // Wait for loading to complete or timeout after 30 seconds
      await Promise.race([
        loadingIndicator.waitFor({ state: 'hidden', timeout: 30000 }),
        page.waitForTimeout(30000)
      ]).catch(() => {
        console.warn('⚠️ Loading indicator timeout');
      });
    }

    // Check if architects list is loaded
    console.log('🏗️ Checking for architects list...');
    
    const architectsList = page.locator('[data-testid="architect-card"], .MuiCard-root');
    const architectsCount = await architectsList.count();
    
    performanceMetrics.architectsLoaded = architectsCount;
    console.log(`📊 Found ${architectsCount} architect cards`);

    // Measure key performance metrics
    console.log('📊 Collecting performance metrics...');
    
    const performanceData = await page.evaluate(() => {
      return new Promise((resolve) => {
        const metrics = {
          // Core Web Vitals
          fcp: null,
          lcp: null,
          cls: null,
          fid: null,
          
          // Custom metrics
          domContentLoaded: null,
          loadComplete: null,
          
          // Database metrics
          databaseInit: null,
          
          // Memory usage
          memoryUsage: null,
          
          // Performance entries
          performanceEntries: []
        };

        // Get paint metrics
        const paintEntries = performance.getEntriesByType('paint');
        for (const entry of paintEntries) {
          if (entry.name === 'first-contentful-paint') {
            metrics.fcp = entry.startTime;
          }
        }

        // Get LCP if available
        if ('PerformanceObserver' in window) {
          const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            metrics.lcp = lastEntry.startTime;
          });
          
          try {
            lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
          } catch (e) {
            console.warn('LCP observer not supported');
          }
        }

        // Get navigation metrics
        const navEntries = performance.getEntriesByType('navigation');
        if (navEntries.length > 0) {
          const nav = navEntries[0];
          metrics.domContentLoaded = nav.domContentLoadedEventEnd - nav.navigationStart;
          metrics.loadComplete = nav.loadEventEnd - nav.navigationStart;
        }

        // Get memory usage if available
        if ('memory' in performance) {
          metrics.memoryUsage = {
            used: performance.memory.usedJSHeapSize,
            total: performance.memory.totalJSHeapSize,
            limit: performance.memory.jsHeapSizeLimit
          };
        }

        // Get all performance entries
        metrics.performanceEntries = performance.getEntries().map(entry => ({
          name: entry.name,
          type: entry.entryType,
          startTime: entry.startTime,
          duration: entry.duration
        }));

        // Get database initialization time if available
        if (window.performanceAnalysisReport) {
          metrics.databaseInit = window.performanceAnalysisReport.databasePerformance.initTime;
        }

        setTimeout(() => resolve(metrics), 1000);
      });
    });

    performanceMetrics = { ...performanceMetrics, ...performanceData };

    // Analyze database queries
    console.log('🗄️ Analyzing database operations...');
    
    const dbOperations = consoleLogs.filter(log => 
      log.text.includes('建築家データ取得') || 
      log.text.includes('データベース') ||
      log.text.includes('クエリ') ||
      log.text.includes('Database')
    );

    performanceMetrics.databaseOperations = dbOperations.length;

    // Check for memory leaks
    console.log('🧠 Checking for memory issues...');
    
    const memoryLeaks = await page.evaluate(() => {
      if (window.performanceAnalysisReport) {
        return window.performanceAnalysisReport.memoryAnalysis.possibleLeaks;
      }
      return 0;
    });

    performanceMetrics.memoryLeaks = memoryLeaks;

    // Analyze long tasks
    console.log('⏱️ Analyzing long running tasks...');
    
    const longTasks = await page.evaluate(() => {
      if (window.performanceAnalysisReport) {
        return window.performanceAnalysisReport.summary.longTasksCount;
      }
      return 0;
    });

    performanceMetrics.longTasks = longTasks;

    // Test search functionality performance
    console.log('🔍 Testing search performance...');
    
    const searchInput = page.locator('input[placeholder*="検索"], input[label*="検索"]');
    if (await searchInput.isVisible().catch(() => false)) {
      const searchStartTime = Date.now();
      await searchInput.fill('安藤');
      await page.waitForTimeout(2000); // Wait for search to process
      
      const searchTime = Date.now() - searchStartTime;
      performanceMetrics.searchTime = searchTime;
      console.log(`🔍 Search completed in ${searchTime}ms`);
    }

    // Stop tracing
    await page.tracing.stop();

    // Analyze network requests
    console.log('🌐 Analyzing network performance...');
    
    const slowRequests = networkRequests.filter(req => req.duration > 1000);
    const failedRequests = networkRequests.filter(req => req.status >= 400);
    const databaseRequests = networkRequests.filter(req => 
      req.url.includes('.sqlite') || req.url.includes('db/')
    );

    performanceMetrics.networkAnalysis = {
      totalRequests: networkRequests.length,
      slowRequests: slowRequests.length,
      failedRequests: failedRequests.length,
      databaseRequests: databaseRequests.length,
      avgRequestTime: networkRequests.length > 0 
        ? networkRequests.reduce((sum, req) => sum + (req.duration || 0), 0) / networkRequests.length 
        : 0
    };

    // Generate final performance report
    const finalReport = await page.evaluate(() => {
      if (window.generatePerformanceReport) {
        return window.generatePerformanceReport();
      }
      return null;
    });

    // Combine all metrics
    const completeReport = {
      timestamp: new Date().toISOString(),
      testMetrics: performanceMetrics,
      performanceAnalysis: finalReport,
      consoleLogs: consoleLogs.slice(-50), // Last 50 logs
      errors: errors,
      networkRequests: networkRequests,
      recommendations: []
    };

    // Generate recommendations
    if (performanceMetrics.navigationTime > 5000) {
      completeReport.recommendations.push({
        priority: 'high',
        issue: 'Slow page navigation',
        details: `Navigation took ${performanceMetrics.navigationTime}ms`,
        solution: 'Optimize initial bundle size and critical resource loading'
      });
    }

    if (performanceMetrics.databaseInit && performanceMetrics.databaseInit > 10000) {
      completeReport.recommendations.push({
        priority: 'high',
        issue: 'Slow database initialization',
        details: `Database init took ${performanceMetrics.databaseInit}ms`,
        solution: 'Consider chunked loading or background initialization'
      });
    }

    if (performanceMetrics.longTasks > 5) {
      completeReport.recommendations.push({
        priority: 'medium',
        issue: 'Multiple long tasks detected',
        details: `Found ${performanceMetrics.longTasks} long tasks`,
        solution: 'Break down large operations into smaller chunks'
      });
    }

    if (performanceMetrics.memoryLeaks > 0) {
      completeReport.recommendations.push({
        priority: 'high',
        issue: 'Potential memory leaks detected',
        details: `Found ${performanceMetrics.memoryLeaks} potential leaks`,
        solution: 'Review useEffect dependencies and cleanup functions'
      });
    }

    if (performanceMetrics.networkAnalysis.slowRequests > 0) {
      completeReport.recommendations.push({
        priority: 'medium',
        issue: 'Slow network requests',
        details: `Found ${performanceMetrics.networkAnalysis.slowRequests} slow requests`,
        solution: 'Optimize database queries and implement request caching'
      });
    }

    if (errors.length > 0) {
      completeReport.recommendations.push({
        priority: 'high',
        issue: 'JavaScript errors detected',
        details: `Found ${errors.length} errors`,
        solution: 'Fix JavaScript errors that may cause loading issues'
      });
    }

    // Save the complete report
    const reportPath = path.join(__dirname, 'architects_performance_report.json');
    fs.writeFileSync(reportPath, JSON.stringify(completeReport, null, 2));

    console.log('📊 Performance analysis complete!');
    console.log(`📄 Report saved to: ${reportPath}`);
    console.log('📊 Summary:');
    console.log(`  - Navigation time: ${performanceMetrics.navigationTime}ms`);
    console.log(`  - Architects loaded: ${performanceMetrics.architectsLoaded}`);
    console.log(`  - Database operations: ${performanceMetrics.databaseOperations}`);
    console.log(`  - Long tasks: ${performanceMetrics.longTasks}`);
    console.log(`  - Memory leaks: ${performanceMetrics.memoryLeaks}`);
    console.log(`  - Network requests: ${performanceMetrics.networkAnalysis.totalRequests}`);
    console.log(`  - Errors: ${errors.length}`);
    console.log(`  - Recommendations: ${completeReport.recommendations.length}`);

    // Assertions to ensure the page loads properly
    expect(performanceMetrics.architectsLoaded).toBeGreaterThan(0);
    expect(errors.filter(e => e.type === 'javascript').length).toBe(0);
    expect(performanceMetrics.navigationTime).toBeLessThan(30000); // Should load within 30 seconds
  });

  test('Monitor specific loading bottlenecks', async ({ page }) => {
    console.log('🔍 Analyzing specific loading bottlenecks...');

    // Navigate to architects page
    await page.goto('http://localhost:5173/architects');

    // Check for stuck loading indicators
    const loadingSpinner = page.locator('.MuiCircularProgress-root');
    
    if (await loadingSpinner.isVisible().catch(() => false)) {
      console.log('🔄 Loading spinner detected, monitoring...');
      
      // Wait up to 30 seconds for loading to complete
      const loadingStart = Date.now();
      
      try {
        await loadingSpinner.waitFor({ state: 'hidden', timeout: 30000 });
        const loadingDuration = Date.now() - loadingStart;
        console.log(`✅ Loading completed in ${loadingDuration}ms`);
      } catch (error) {
        const stuckDuration = Date.now() - loadingStart;
        console.error(`❌ Loading appears stuck after ${stuckDuration}ms`);
        
        // Take screenshot of stuck state
        await page.screenshot({ 
          path: path.join(__dirname, 'stuck_loading_state.png'),
          fullPage: true 
        });
        
        // Check for specific error patterns
        const errorMessages = await page.locator('text=エラー, text=Error, [role="alert"]').all();
        if (errorMessages.length > 0) {
          console.log('❌ Error messages found on page');
        }
        
        // Check database connection status
        const dbStatus = await page.evaluate(() => {
          if (window.ArchitectService) {
            return 'service_available';
          }
          return 'service_unavailable';
        });
        
        console.log(`🗄️ Database service status: ${dbStatus}`);
        
        throw new Error(`Loading stuck for ${stuckDuration}ms`);
      }
    }

    // Verify data actually loaded
    await expect(page.locator('[data-testid="architect-card"], .MuiCard-root')).toHaveCount({ min: 1 });
  });

  test('Memory usage monitoring during architects tab usage', async ({ page }) => {
    console.log('🧠 Monitoring memory usage during architects tab usage...');

    await page.goto('http://localhost:5173/architects');

    // Monitor memory usage over time
    const memoryReadings = [];
    
    for (let i = 0; i < 10; i++) {
      const memoryUsage = await page.evaluate(() => {
        if ('memory' in performance) {
          return {
            used: performance.memory.usedJSHeapSize,
            total: performance.memory.totalJSHeapSize,
            timestamp: Date.now()
          };
        }
        return null;
      });
      
      if (memoryUsage) {
        memoryReadings.push(memoryUsage);
        console.log(`🧠 Memory usage ${i + 1}: ${(memoryUsage.used / 1024 / 1024).toFixed(2)}MB`);
      }
      
      // Interact with the page to trigger potential leaks
      if (i < 5) {
        const searchInput = page.locator('input[placeholder*="検索"]');
        if (await searchInput.isVisible().catch(() => false)) {
          await searchInput.fill(`test${i}`);
          await page.waitForTimeout(1000);
        }
      }
      
      await page.waitForTimeout(2000);
    }

    // Analyze memory growth
    if (memoryReadings.length > 1) {
      const initialMemory = memoryReadings[0].used;
      const finalMemory = memoryReadings[memoryReadings.length - 1].used;
      const memoryGrowth = finalMemory - initialMemory;
      
      console.log(`📈 Memory growth: ${(memoryGrowth / 1024 / 1024).toFixed(2)}MB`);
      
      // Flag significant memory growth as potential leak
      if (memoryGrowth > 10 * 1024 * 1024) { // 10MB growth
        console.warn('⚠️ Significant memory growth detected, potential memory leak');
      }
    }

    // Save memory analysis
    const memoryReport = {
      readings: memoryReadings,
      analysis: {
        totalGrowth: memoryReadings.length > 1 
          ? memoryReadings[memoryReadings.length - 1].used - memoryReadings[0].used 
          : 0,
        peakUsage: Math.max(...memoryReadings.map(r => r.used)),
        averageUsage: memoryReadings.reduce((sum, r) => sum + r.used, 0) / memoryReadings.length
      }
    };

    fs.writeFileSync(
      path.join(__dirname, 'memory_analysis_report.json'),
      JSON.stringify(memoryReport, null, 2)
    );

    console.log('🧠 Memory analysis complete');
  });
});

test.afterAll(async () => {
  console.log('📊 Performance analysis test suite completed');
  console.log('📁 Generated files:');
  console.log('  - architects_performance_trace.json (Performance trace)');
  console.log('  - architects_performance_report.json (Complete analysis)');
  console.log('  - memory_analysis_report.json (Memory usage analysis)');
  console.log('  - stuck_loading_state.png (Screenshot if loading stuck)');
});