/**
 * Detailed Technical Performance Analysis
 * Focus on specific user experience metrics and technical bottlenecks
 */

const { chromium } = require('playwright');

const SITE_URL = 'https://bob-takuya.github.io/archi-site/';

async function runDetailedAnalysis() {
  console.log('🔍 Starting Detailed Technical Analysis...\n');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Enable performance tracking
  await page.addInitScript(() => {
    window.performanceMetrics = {
      navigationStart: performance.now(),
      measurements: []
    };
    
    // Track resource loading
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        window.performanceMetrics.measurements.push({
          name: entry.name,
          type: entry.entryType,
          startTime: entry.startTime,
          duration: entry.duration,
          transferSize: entry.transferSize || 0
        });
      }
    });
    observer.observe({ entryTypes: ['resource', 'navigation', 'paint'] });
  });
  
  try {
    console.log('📊 1. Testing Initial Page Load Performance...');
    const loadMetrics = await testInitialLoad(page);
    
    console.log('🗄️ 2. Testing Database Loading Performance...');
    const dbMetrics = await testDatabasePerformance(page);
    
    console.log('🔍 3. Testing Search Functionality Performance...');
    const searchMetrics = await testSearchPerformance(page);
    
    console.log('🗺️ 4. Testing Map Functionality Performance...');
    const mapMetrics = await testMapPerformance(page);
    
    console.log('📱 5. Testing Mobile Responsiveness...');
    const mobileMetrics = await testMobileResponsiveness(page);
    
    console.log('♿ 6. Testing Accessibility Implementation...');
    const accessibilityMetrics = await testAccessibilityImplementation(page);
    
    console.log('🌐 7. Testing Cross-Browser Compatibility...');
    const compatibilityMetrics = await testCrossBrowserCompatibility(browser);
    
    console.log('📦 8. Analyzing Bundle and Asset Optimization...');
    const bundleMetrics = await analyzeBundleOptimization(page);
    
    const report = {
      loadMetrics,
      dbMetrics,
      searchMetrics,
      mapMetrics,
      mobileMetrics,
      accessibilityMetrics,
      compatibilityMetrics,
      bundleMetrics
    };
    
    generateDetailedReport(report);
    
  } catch (error) {
    console.error('❌ Analysis failed:', error);
  } finally {
    await browser.close();
  }
}

async function testInitialLoad(page) {
  const startTime = Date.now();
  
  // Navigate and capture timing
  await page.goto(SITE_URL, { waitUntil: 'domcontentloaded' });
  const domContentLoaded = Date.now() - startTime;
  
  // Wait for visual completeness
  const visualStart = Date.now();
  await page.waitForLoadState('networkidle');
  const visualComplete = Date.now() - visualStart;
  
  // Get detailed timing information
  const timingData = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0];
    const paint = performance.getEntriesByType('paint');
    
    return {
      dns: nav.domainLookupEnd - nav.domainLookupStart,
      tcp: nav.connectEnd - nav.connectStart,
      request: nav.responseStart - nav.requestStart,
      response: nav.responseEnd - nav.responseStart,
      domProcessing: nav.domContentLoadedEventStart - nav.responseEnd,
      firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
      firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0
    };
  });
  
  // Check for render blocking resources
  const renderBlocking = await page.evaluate(() => {
    const resources = performance.getEntriesByType('resource');
    return resources
      .filter(r => r.renderBlockingStatus === 'blocking' || (r.name.includes('.css') && r.startTime < 100))
      .map(r => ({ name: r.name, duration: r.duration, size: r.transferSize }));
  });
  
  return {
    domContentLoaded,
    visualComplete,
    timing: timingData,
    renderBlocking,
    score: domContentLoaded < 1000 ? 'EXCELLENT' : domContentLoaded < 2000 ? 'GOOD' : 'NEEDS_IMPROVEMENT'
  };
}

async function testDatabasePerformance(page) {
  await page.goto(SITE_URL);
  
  // Test database loading
  const dbStart = Date.now();
  
  // Wait for database indicators
  try {
    await page.waitForSelector('.MuiCard-root, [data-testid="architecture-card"], .architecture-item', { timeout: 10000 });
    const dbLoadTime = Date.now() - dbStart;
    
    // Count loaded records
    const recordCount = await page.locator('.MuiCard-root, [data-testid="architecture-card"], .architecture-item').count();
    
    // Test pagination performance
    const paginationStart = Date.now();
    try {
      await page.click('[data-testid="next-page"], .MuiPagination-root button:last-child');
      await page.waitForTimeout(1000);
      const paginationTime = Date.now() - paginationStart;
      
      return {
        loadTime: dbLoadTime,
        recordsLoaded: recordCount,
        paginationTime,
        performance: dbLoadTime < 3000 ? 'EXCELLENT' : dbLoadTime < 5000 ? 'GOOD' : 'POOR'
      };
    } catch {
      return {
        loadTime: dbLoadTime,
        recordsLoaded: recordCount,
        paginationTime: null,
        performance: dbLoadTime < 3000 ? 'EXCELLENT' : dbLoadTime < 5000 ? 'GOOD' : 'POOR'
      };
    }
  } catch (error) {
    return {
      loadTime: Date.now() - dbStart,
      recordsLoaded: 0,
      error: 'Database loading failed',
      performance: 'FAILED'
    };
  }
}

async function testSearchPerformance(page) {
  await page.goto(SITE_URL);
  
  // Test different search scenarios
  const searchTests = [
    { query: '東京', description: 'Japanese location search' },
    { query: '隈研吾', description: 'Architect name search' },
    { query: '建築', description: 'General architecture term' },
    { query: '住宅', description: 'Building type search' }
  ];
  
  const results = [];
  
  for (const test of searchTests) {
    try {
      // Find search input
      const searchInput = await page.locator('input[type="search"], [data-testid="search-input"], input[placeholder*="検索"]').first();
      
      if (await searchInput.count() > 0) {
        const startTime = Date.now();
        
        await searchInput.fill(test.query);
        await page.waitForTimeout(500); // Wait for search to process
        
        const responseTime = Date.now() - startTime;
        const resultCount = await page.locator('.MuiCard-root, [data-testid="search-result"]').count();
        
        results.push({
          query: test.query,
          description: test.description,
          responseTime,
          resultCount,
          performance: responseTime < 500 ? 'EXCELLENT' : responseTime < 1000 ? 'GOOD' : 'SLOW'
        });
        
        // Clear search for next test
        await searchInput.fill('');
        await page.waitForTimeout(200);
      }
    } catch (error) {
      results.push({
        query: test.query,
        description: test.description,
        error: error.message,
        performance: 'FAILED'
      });
    }
  }
  
  const averageTime = results.reduce((sum, r) => sum + (r.responseTime || 0), 0) / results.length;
  
  return {
    tests: results,
    averageResponseTime: averageTime,
    overallPerformance: averageTime < 500 ? 'EXCELLENT' : averageTime < 1000 ? 'GOOD' : 'NEEDS_IMPROVEMENT'
  };
}

async function testMapPerformance(page) {
  try {
    await page.goto(SITE_URL + '#/map');
    
    const mapStart = Date.now();
    
    // Wait for map container
    await page.waitForSelector('.leaflet-container, [data-testid="map-container"], #map', { timeout: 10000 });
    const mapLoadTime = Date.now() - mapStart;
    
    // Test map interaction
    const interactionStart = Date.now();
    const mapContainer = page.locator('.leaflet-container').first();
    
    if (await mapContainer.count() > 0) {
      // Test zoom and pan
      await page.mouse.wheel(0, -100); // Zoom in
      await page.waitForTimeout(200);
      await page.mouse.move(400, 300);
      await page.mouse.down();
      await page.mouse.move(450, 350);
      await page.mouse.up();
      await page.waitForTimeout(200);
    }
    
    const interactionTime = Date.now() - interactionStart;
    
    // Check for markers
    const markerCount = await page.locator('.leaflet-marker-icon, .marker').count();
    
    return {
      loadTime: mapLoadTime,
      interactionTime,
      markerCount,
      performance: mapLoadTime < 3000 ? 'EXCELLENT' : mapLoadTime < 5000 ? 'GOOD' : 'SLOW'
    };
    
  } catch (error) {
    return {
      loadTime: null,
      error: error.message,
      performance: 'FAILED'
    };
  }
}

async function testMobileResponsiveness(page) {
  const viewports = [
    { name: 'iPhone SE', width: 375, height: 667 },
    { name: 'iPhone 12', width: 390, height: 844 },
    { name: 'iPad', width: 768, height: 1024 },
    { name: 'iPad Pro', width: 1024, height: 1366 }
  ];
  
  const results = [];
  
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.goto(SITE_URL);
    
    const startTime = Date.now();
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    // Check for mobile-specific elements
    const hasMobileMenu = await page.locator('[data-testid="mobile-menu"], .mobile-menu, .MuiDrawer-root').count() > 0;
    const hasResponsiveGrid = await page.locator('.MuiGrid-container').count() > 0;
    
    // Test touch interactions
    const touchStart = Date.now();
    try {
      await page.tap('button, a, .MuiCard-root').catch(() => {});
      const touchTime = Date.now() - touchStart;
      
      results.push({
        device: viewport.name,
        viewport: `${viewport.width}x${viewport.height}`,
        loadTime,
        touchResponseTime: touchTime,
        hasMobileMenu,
        hasResponsiveGrid,
        performance: loadTime < 2000 ? 'EXCELLENT' : loadTime < 3000 ? 'GOOD' : 'SLOW'
      });
    } catch (error) {
      results.push({
        device: viewport.name,
        viewport: `${viewport.width}x${viewport.height}`,
        loadTime,
        error: error.message,
        performance: 'FAILED'
      });
    }
  }
  
  return results;
}

async function testAccessibilityImplementation(page) {
  await page.goto(SITE_URL);
  
  // Check semantic structure
  const landmarks = {
    main: await page.locator('[role="main"], main').count(),
    navigation: await page.locator('[role="navigation"], nav').count(),
    banner: await page.locator('[role="banner"], header').count(),
    contentinfo: await page.locator('[role="contentinfo"], footer').count()
  };
  
  // Check heading structure
  const headings = {
    h1: await page.locator('h1').count(),
    h2: await page.locator('h2').count(),
    h3: await page.locator('h3').count(),
    total: await page.locator('h1, h2, h3, h4, h5, h6').count()
  };
  
  // Check form accessibility
  const forms = {
    labeledInputs: await page.locator('input[aria-label], input[aria-labelledby], label input').count(),
    totalInputs: await page.locator('input').count()
  };
  
  // Check image accessibility
  const images = {
    withAlt: await page.locator('img[alt]').count(),
    total: await page.locator('img').count()
  };
  
  // Test keyboard navigation
  const keyboardStart = Date.now();
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press('Tab');
    await page.waitForTimeout(100);
  }
  const keyboardTime = Date.now() - keyboardStart;
  
  // Check focus indicators
  const focusIndicators = await page.evaluate(() => {
    const focusableElements = document.querySelectorAll('button, a, input, [tabindex="0"]');
    let visibleFocusCount = 0;
    
    focusableElements.forEach(el => {
      el.focus();
      const styles = getComputedStyle(el, ':focus');
      if (styles.outline !== 'none' || styles.boxShadow !== 'none') {
        visibleFocusCount++;
      }
    });
    
    return {
      total: focusableElements.length,
      withVisibleFocus: visibleFocusCount
    };
  });
  
  const accessibilityScore = (
    (landmarks.main > 0 ? 20 : 0) +
    (landmarks.navigation > 0 ? 20 : 0) +
    (headings.h1 > 0 ? 20 : 0) +
    (images.total === 0 ? 20 : (images.withAlt / images.total) * 20) +
    (forms.totalInputs === 0 ? 20 : (forms.labeledInputs / forms.totalInputs) * 20)
  );
  
  return {
    landmarks,
    headings,
    forms,
    images,
    keyboardNavigationTime: keyboardTime,
    focusIndicators,
    score: accessibilityScore,
    grade: accessibilityScore >= 90 ? 'EXCELLENT' : accessibilityScore >= 70 ? 'GOOD' : 'NEEDS_IMPROVEMENT'
  };
}

async function testCrossBrowserCompatibility(browser) {
  const browsers = [
    { name: 'Chromium', engine: chromium },
    // Note: Firefox and WebKit would need separate imports
  ];
  
  const results = [];
  
  for (const browserInfo of browsers) {
    try {
      const context = await browser.newContext();
      const page = await context.newPage();
      
      const startTime = Date.now();
      await page.goto(SITE_URL);
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;
      
      // Check for JavaScript errors
      const errors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });
      
      // Test basic functionality
      const functionalityTest = await page.evaluate(() => {
        return {
          reactLoaded: !!window.React || !!document.querySelector('[data-reactroot]'),
          muiLoaded: !!document.querySelector('.MuiThemeProvider-root, .MuiCssBaseline-root'),
          routerWorking: !!window.location.hash
        };
      });
      
      await context.close();
      
      results.push({
        browser: browserInfo.name,
        loadTime,
        errors: errors.slice(0, 5), // Limit error reporting
        functionality: functionalityTest,
        compatible: loadTime < 5000 && errors.length < 3
      });
      
    } catch (error) {
      results.push({
        browser: browserInfo.name,
        error: error.message,
        compatible: false
      });
    }
  }
  
  return results;
}

async function analyzeBundleOptimization(page) {
  await page.goto(SITE_URL);
  
  // Get resource loading information
  const resources = await page.evaluate(() => {
    const entries = performance.getEntriesByType('resource');
    return entries.map(entry => ({
      name: entry.name,
      type: entry.initiatorType,
      size: entry.transferSize || 0,
      duration: entry.duration,
      cached: entry.transferSize === 0 && entry.decodedBodySize > 0
    }));
  });
  
  // Analyze bundle composition
  const analysis = {
    javascript: resources.filter(r => r.name.includes('.js')),
    css: resources.filter(r => r.name.includes('.css')),
    images: resources.filter(r => r.type === 'img'),
    fonts: resources.filter(r => r.name.includes('.woff') || r.name.includes('.ttf')),
    other: resources.filter(r => !r.name.includes('.js') && !r.name.includes('.css') && r.type !== 'img')
  };
  
  const totalSize = resources.reduce((sum, r) => sum + r.size, 0);
  const cachedResources = resources.filter(r => r.cached).length;
  
  // Check for optimization opportunities
  const optimizations = [];
  
  if (analysis.javascript.reduce((sum, r) => sum + r.size, 0) > 500 * 1024) {
    optimizations.push('JavaScript bundle size could be reduced with code splitting');
  }
  
  if (analysis.images.some(img => img.size > 100 * 1024)) {
    optimizations.push('Large images detected - consider image optimization');
  }
  
  if (cachedResources / resources.length < 0.3) {
    optimizations.push('Low cache utilization - improve caching strategy');
  }
  
  return {
    resources: resources.length,
    totalSize: Math.round(totalSize / 1024), // KB
    breakdown: {
      javascript: Math.round(analysis.javascript.reduce((sum, r) => sum + r.size, 0) / 1024),
      css: Math.round(analysis.css.reduce((sum, r) => sum + r.size, 0) / 1024),
      images: Math.round(analysis.images.reduce((sum, r) => sum + r.size, 0) / 1024),
      other: Math.round(analysis.other.reduce((sum, r) => sum + r.size, 0) / 1024)
    },
    cacheUtilization: Math.round((cachedResources / resources.length) * 100),
    optimizations,
    grade: totalSize < 1024 * 1024 ? 'EXCELLENT' : totalSize < 2048 * 1024 ? 'GOOD' : 'NEEDS_OPTIMIZATION'
  };
}

function generateDetailedReport(report) {
  console.log('\n📊 DETAILED TECHNICAL PERFORMANCE ANALYSIS REPORT');
  console.log('=' .repeat(80));
  
  console.log('\n🚀 1. INITIAL PAGE LOAD PERFORMANCE');
  console.log(`   DOM Content Loaded: ${report.loadMetrics.domContentLoaded}ms (${report.loadMetrics.score})`);
  console.log(`   Visual Complete: ${report.loadMetrics.visualComplete}ms`);
  console.log(`   DNS Lookup: ${report.loadMetrics.timing.dns.toFixed(1)}ms`);
  console.log(`   TCP Connection: ${report.loadMetrics.timing.tcp.toFixed(1)}ms`);
  console.log(`   First Paint: ${report.loadMetrics.timing.firstPaint.toFixed(1)}ms`);
  console.log(`   First Contentful Paint: ${report.loadMetrics.timing.firstContentfulPaint.toFixed(1)}ms`);
  if (report.loadMetrics.renderBlocking.length > 0) {
    console.log(`   Render Blocking Resources: ${report.loadMetrics.renderBlocking.length}`);
  }
  
  console.log('\n🗄️ 2. DATABASE PERFORMANCE');
  console.log(`   Load Time: ${report.dbMetrics.loadTime}ms (${report.dbMetrics.performance})`);
  console.log(`   Records Loaded: ${report.dbMetrics.recordsLoaded}`);
  if (report.dbMetrics.paginationTime) {
    console.log(`   Pagination Response: ${report.dbMetrics.paginationTime}ms`);
  }
  
  console.log('\n🔍 3. SEARCH FUNCTIONALITY PERFORMANCE');
  console.log(`   Average Response Time: ${report.searchMetrics.averageResponseTime.toFixed(0)}ms (${report.searchMetrics.overallPerformance})`);
  report.searchMetrics.tests.forEach(test => {
    if (test.responseTime) {
      console.log(`   "${test.query}": ${test.responseTime}ms → ${test.resultCount} results`);
    }
  });
  
  console.log('\n🗺️ 4. MAP FUNCTIONALITY PERFORMANCE');
  if (report.mapMetrics.loadTime) {
    console.log(`   Map Load Time: ${report.mapMetrics.loadTime}ms (${report.mapMetrics.performance})`);
    console.log(`   Interaction Response: ${report.mapMetrics.interactionTime}ms`);
    console.log(`   Markers Loaded: ${report.mapMetrics.markerCount}`);
  } else {
    console.log(`   Map Loading: ${report.mapMetrics.performance} - ${report.mapMetrics.error}`);
  }
  
  console.log('\n📱 5. MOBILE RESPONSIVENESS');
  report.mobileMetrics.forEach(device => {
    console.log(`   ${device.device} (${device.viewport}): ${device.loadTime}ms (${device.performance})`);
    if (device.touchResponseTime) {
      console.log(`     Touch Response: ${device.touchResponseTime}ms`);
    }
    console.log(`     Mobile Features: Menu=${device.hasMobileMenu}, Grid=${device.hasResponsiveGrid}`);
  });
  
  console.log('\n♿ 6. ACCESSIBILITY IMPLEMENTATION');
  console.log(`   Accessibility Score: ${report.accessibilityMetrics.score.toFixed(0)}/100 (${report.accessibilityMetrics.grade})`);
  console.log(`   Landmarks: Main=${report.accessibilityMetrics.landmarks.main}, Nav=${report.accessibilityMetrics.landmarks.navigation}`);
  console.log(`   Headings: H1=${report.accessibilityMetrics.headings.h1}, H2=${report.accessibilityMetrics.headings.h2}, Total=${report.accessibilityMetrics.headings.total}`);
  console.log(`   Images: ${report.accessibilityMetrics.images.withAlt}/${report.accessibilityMetrics.images.total} with alt text`);
  console.log(`   Keyboard Navigation: ${report.accessibilityMetrics.keyboardNavigationTime}ms`);
  console.log(`   Focus Indicators: ${report.accessibilityMetrics.focusIndicators.withVisibleFocus}/${report.accessibilityMetrics.focusIndicators.total} visible`);
  
  console.log('\n🌐 7. CROSS-BROWSER COMPATIBILITY');
  report.compatibilityMetrics.forEach(browser => {
    console.log(`   ${browser.browser}: ${browser.compatible ? '✅ Compatible' : '❌ Issues detected'}`);
    if (browser.loadTime) {
      console.log(`     Load Time: ${browser.loadTime}ms`);
      console.log(`     React: ${browser.functionality.reactLoaded ? '✅' : '❌'}, MUI: ${browser.functionality.muiLoaded ? '✅' : '❌'}, Router: ${browser.functionality.routerWorking ? '✅' : '❌'}`);
    }
    if (browser.errors && browser.errors.length > 0) {
      console.log(`     Errors: ${browser.errors.length} detected`);
    }
  });
  
  console.log('\n📦 8. BUNDLE AND ASSET OPTIMIZATION');
  console.log(`   Total Bundle Size: ${report.bundleMetrics.totalSize}KB (${report.bundleMetrics.grade})`);
  console.log(`   JavaScript: ${report.bundleMetrics.breakdown.javascript}KB`);
  console.log(`   CSS: ${report.bundleMetrics.breakdown.css}KB`);
  console.log(`   Images: ${report.bundleMetrics.breakdown.images}KB`);
  console.log(`   Cache Utilization: ${report.bundleMetrics.cacheUtilization}%`);
  console.log(`   Resources Loaded: ${report.bundleMetrics.resources}`);
  
  if (report.bundleMetrics.optimizations.length > 0) {
    console.log('\n🔧 OPTIMIZATION OPPORTUNITIES:');
    report.bundleMetrics.optimizations.forEach((opt, index) => {
      console.log(`   ${index + 1}. ${opt}`);
    });
  }
  
  // Calculate overall technical score
  const scores = [
    report.loadMetrics.score === 'EXCELLENT' ? 100 : report.loadMetrics.score === 'GOOD' ? 80 : 60,
    report.dbMetrics.performance === 'EXCELLENT' ? 100 : report.dbMetrics.performance === 'GOOD' ? 80 : 60,
    report.searchMetrics.overallPerformance === 'EXCELLENT' ? 100 : report.searchMetrics.overallPerformance === 'GOOD' ? 80 : 60,
    report.mapMetrics.performance === 'EXCELLENT' ? 100 : report.mapMetrics.performance === 'GOOD' ? 80 : 40,
    report.mobileMetrics.every(m => m.performance === 'EXCELLENT') ? 100 : 80,
    report.accessibilityMetrics.score,
    report.compatibilityMetrics.every(b => b.compatible) ? 100 : 70,
    report.bundleMetrics.grade === 'EXCELLENT' ? 100 : report.bundleMetrics.grade === 'GOOD' ? 80 : 60
  ];
  
  const overallScore = Math.round(scores.reduce((a, b) => a + b) / scores.length);
  
  console.log('\n' + '=' .repeat(80));
  console.log(`🏆 OVERALL TECHNICAL PERFORMANCE SCORE: ${overallScore}/100`);
  
  if (overallScore >= 90) {
    console.log('🎉 EXCELLENT - Outstanding technical implementation');
  } else if (overallScore >= 80) {
    console.log('✅ VERY GOOD - Solid technical foundation with minor optimization opportunities');
  } else if (overallScore >= 70) {
    console.log('👍 GOOD - Functional with room for performance improvements');
  } else {
    console.log('⚠️ NEEDS IMPROVEMENT - Significant optimization required');
  }
  
  console.log('\n📋 TECHNICAL ANALYSIS COMPLETE');
  console.log('=' .repeat(80));
}

// Run the detailed analysis
runDetailedAnalysis().catch(console.error);