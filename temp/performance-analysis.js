/**
 * Comprehensive Performance Analysis for Japanese Architecture Database
 * DEVELOPER Agent - Technical Performance Assessment
 */

const { test, expect, chromium, firefox, webkit } = require('@playwright/test');

const SITE_URL = 'https://bob-takuya.github.io/archi-site/';

// Performance thresholds based on industry standards
const PERFORMANCE_THRESHOLDS = {
  // Core Web Vitals
  LCP: 2500,          // Largest Contentful Paint (Good: <2.5s)
  FID: 100,           // First Input Delay (Good: <100ms)
  CLS: 0.1,           // Cumulative Layout Shift (Good: <0.1)
  
  // Additional metrics
  FCP: 1800,          // First Contentful Paint (Good: <1.8s)
  FMP: 2000,          // First Meaningful Paint
  TTI: 3800,          // Time to Interactive (Good: <3.8s)
  
  // Custom metrics
  DATABASE_LOAD: 5000,     // Database loading time
  SEARCH_RESPONSE: 500,    // Search response time
  NAVIGATION: 300,         // Navigation response time
  MAP_LOAD: 8000,         // Map component loading
  
  // Memory usage (MB)
  MEMORY_BASELINE: 50,
  MEMORY_MAX: 200,
  
  // Bundle sizes (KB)
  JS_BUNDLE_MAX: 1000,
  CSS_BUNDLE_MAX: 200
};

// Test different network conditions
const NETWORK_CONDITIONS = {
  'fast-3g': { downloadThroughput: 1.5 * 1024 * 1024, uploadThroughput: 750 * 1024, latency: 40 },
  'slow-3g': { downloadThroughput: 500 * 1024, uploadThroughput: 500 * 1024, latency: 400 },
  'wifi': { downloadThroughput: 50 * 1024 * 1024, uploadThroughput: 10 * 1024 * 1024, latency: 10 }
};

// Device configurations for mobile testing
const DEVICES = [
  { name: 'iPhone 12', width: 390, height: 844, deviceScaleFactor: 3 },
  { name: 'iPad Pro', width: 1024, height: 1366, deviceScaleFactor: 2 },
  { name: 'Desktop', width: 1920, height: 1080, deviceScaleFactor: 1 }
];

async function runPerformanceAnalysis() {
  console.log('🚀 Starting Comprehensive Performance Analysis...\n');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const results = {
    coreWebVitals: {},
    loadingPerformance: {},
    userExperienceMetrics: {},
    mobilePerformance: {},
    accessibilityMetrics: {},
    databasePerformance: {},
    recommendations: []
  };
  
  try {
    console.log('📊 Testing Core Web Vitals...');
    results.coreWebVitals = await testCoreWebVitals(page);
    
    console.log('⚡ Testing Loading Performance...');
    results.loadingPerformance = await testLoadingPerformance(page);
    
    console.log('👤 Testing User Experience Metrics...');
    results.userExperienceMetrics = await testUserExperience(page);
    
    console.log('📱 Testing Mobile Performance...');
    results.mobilePerformance = await testMobilePerformance(browser);
    
    console.log('♿ Testing Accessibility Performance...');
    results.accessibilityMetrics = await testAccessibilityPerformance(page);
    
    console.log('🗄️ Testing Database Performance...');
    results.databasePerformance = await testDatabasePerformance(page);
    
    console.log('🔍 Generating Recommendations...');
    results.recommendations = generateRecommendations(results);
    
    console.log('\n📋 PERFORMANCE ANALYSIS COMPLETE\n');
    generateReport(results);
    
  } catch (error) {
    console.error('❌ Performance analysis failed:', error);
  } finally {
    await browser.close();
  }
}

async function testCoreWebVitals(page) {
  const startTime = Date.now();
  
  // Navigate to homepage and measure Core Web Vitals
  await page.goto(SITE_URL, { waitUntil: 'networkidle' });
  
  // Inject Web Vitals measurement script
  const webVitals = await page.evaluate(() => {
    return new Promise((resolve) => {
      const vitals = {};
      
      // Measure LCP
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        vitals.LCP = entries[entries.length - 1].startTime;
      }).observe({ entryTypes: ['largest-contentful-paint'] });
      
      // Measure FID
      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          vitals.FID = entry.processingStart - entry.startTime;
        }
      }).observe({ entryTypes: ['first-input'] });
      
      // Measure CLS
      let cumulativeLayoutShift = 0;
      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (!entry.hadRecentInput) {
            cumulativeLayoutShift += entry.value;
          }
        }
        vitals.CLS = cumulativeLayoutShift;
      }).observe({ entryTypes: ['layout-shift'] });
      
      // Get paint metrics
      const paintMetrics = performance.getEntriesByType('paint');
      vitals.FCP = paintMetrics.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0;
      
      // Get navigation timing
      const navigation = performance.getEntriesByType('navigation')[0];
      vitals.domContentLoaded = navigation.domContentLoadedEventEnd - navigation.navigationStart;
      vitals.loadComplete = navigation.loadEventEnd - navigation.navigationStart;
      vitals.timeToInteractive = navigation.domInteractive - navigation.navigationStart;
      
      setTimeout(() => resolve(vitals), 3000);
    });
  });
  
  const totalTime = Date.now() - startTime;
  
  return {
    ...webVitals,
    totalMeasurementTime: totalTime,
    scores: {
      LCP: webVitals.LCP < PERFORMANCE_THRESHOLDS.LCP ? 'GOOD' : webVitals.LCP < 4000 ? 'NEEDS_IMPROVEMENT' : 'POOR',
      FID: webVitals.FID < PERFORMANCE_THRESHOLDS.FID ? 'GOOD' : webVitals.FID < 300 ? 'NEEDS_IMPROVEMENT' : 'POOR',
      CLS: webVitals.CLS < PERFORMANCE_THRESHOLDS.CLS ? 'GOOD' : webVitals.CLS < 0.25 ? 'NEEDS_IMPROVEMENT' : 'POOR'
    }
  };
}

async function testLoadingPerformance(page) {
  const metrics = {};
  
  // Test initial page load
  const loadStart = Date.now();
  await page.goto(SITE_URL, { waitUntil: 'domcontentloaded' });
  metrics.domContentLoaded = Date.now() - loadStart;
  
  // Wait for network idle
  const networkIdleStart = Date.now();
  await page.waitForLoadState('networkidle');
  metrics.networkIdle = Date.now() - networkIdleStart;
  
  // Test resource loading
  const resources = await page.evaluate(() => {
    const entries = performance.getEntriesByType('resource');
    return entries.map(entry => ({
      name: entry.name,
      type: entry.initiatorType,
      size: entry.transferSize,
      duration: entry.duration
    }));
  });
  
  // Analyze bundle sizes
  const bundles = {
    javascript: resources.filter(r => r.type === 'script').reduce((sum, r) => sum + r.size, 0),
    css: resources.filter(r => r.type === 'link' && r.name.includes('.css')).reduce((sum, r) => sum + r.size, 0),
    images: resources.filter(r => r.type === 'img').reduce((sum, r) => sum + r.size, 0),
    total: resources.reduce((sum, r) => sum + r.size, 0)
  };
  
  return {
    ...metrics,
    resources: resources.length,
    bundles,
    largestResources: resources.sort((a, b) => b.size - a.size).slice(0, 5)
  };
}

async function testUserExperience(page) {
  await page.goto(SITE_URL);
  
  // Test search functionality performance
  const searchStart = Date.now();
  await page.fill('[data-testid="search-input"], input[type="search"], input[placeholder*="検索"]', '東京');
  await page.waitForTimeout(500); // Wait for search results
  const searchTime = Date.now() - searchStart;
  
  // Test navigation performance
  const navStart = Date.now();
  await page.click('a[href*="architecture"], nav a:first-child');
  await page.waitForLoadState('domcontentloaded');
  const navTime = Date.now() - navStart;
  
  // Test scroll performance
  const scrollStart = Date.now();
  await page.evaluate(() => {
    window.scrollTo(0, window.innerHeight * 3);
  });
  await page.waitForTimeout(1000);
  const scrollTime = Date.now() - scrollStart;
  
  return {
    searchResponseTime: searchTime,
    navigationTime: navTime,
    scrollPerformance: scrollTime,
    interactionScores: {
      search: searchTime < PERFORMANCE_THRESHOLDS.SEARCH_RESPONSE ? 'EXCELLENT' : 'NEEDS_IMPROVEMENT',
      navigation: navTime < PERFORMANCE_THRESHOLDS.NAVIGATION ? 'EXCELLENT' : 'NEEDS_IMPROVEMENT'
    }
  };
}

async function testMobilePerformance(browser) {
  const mobileResults = {};
  
  for (const device of DEVICES) {
    const context = await browser.newContext({
      viewport: { width: device.width, height: device.height },
      deviceScaleFactor: device.deviceScaleFactor,
      isMobile: device.width < 768
    });
    
    const page = await context.newPage();
    
    const startTime = Date.now();
    await page.goto(SITE_URL, { waitUntil: 'networkidle' });
    const loadTime = Date.now() - startTime;
    
    // Test touch interaction
    const touchStart = Date.now();
    await page.tap('button, a').catch(() => {}); // Tap first interactive element
    const touchTime = Date.now() - touchStart;
    
    // Measure memory usage
    const memoryMetrics = await page.evaluate(() => {
      return {
        usedJSHeapSize: performance.memory?.usedJSHeapSize || 0,
        totalJSHeapSize: performance.memory?.totalJSHeapSize || 0,
        jsHeapSizeLimit: performance.memory?.jsHeapSizeLimit || 0
      };
    });
    
    mobileResults[device.name] = {
      loadTime,
      touchResponseTime: touchTime,
      memoryUsage: Math.round(memoryMetrics.usedJSHeapSize / 1024 / 1024), // MB
      score: loadTime < 3000 ? 'EXCELLENT' : loadTime < 5000 ? 'GOOD' : 'POOR'
    };
    
    await context.close();
  }
  
  return mobileResults;
}

async function testAccessibilityPerformance(page) {
  await page.goto(SITE_URL);
  
  // Test keyboard navigation
  const keyboardStart = Date.now();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  const keyboardTime = Date.now() - keyboardStart;
  
  // Test screen reader compatibility
  const landmarks = await page.locator('[role="main"], [role="navigation"], [role="banner"]').count();
  const headings = await page.locator('h1, h2, h3, h4, h5, h6').count();
  const altTexts = await page.locator('img[alt]').count();
  const totalImages = await page.locator('img').count();
  
  return {
    keyboardNavigationTime: keyboardTime,
    accessibilityElements: {
      landmarks,
      headings,
      altTextCoverage: totalImages > 0 ? (altTexts / totalImages * 100).toFixed(1) : 100
    },
    accessibilityScore: landmarks >= 2 && headings >= 3 && (altTexts / totalImages) > 0.9 ? 'EXCELLENT' : 'GOOD'
  };
}

async function testDatabasePerformance(page) {
  await page.goto(SITE_URL);
  
  // Wait for database to load
  const dbStart = Date.now();
  await page.waitForSelector('[data-testid="architecture-list"], .architecture-card, .MuiCard-root', { timeout: 10000 });
  const dbLoadTime = Date.now() - dbStart;
  
  // Test search performance with database
  const searchStart = Date.now();
  await page.fill('input[type="search"], [data-testid="search-input"]', '隈研吾');
  await page.waitForTimeout(1000);
  const searchTime = Date.now() - searchStart;
  
  // Count loaded records
  const recordCount = await page.locator('.architecture-card, .MuiCard-root').count();
  
  return {
    databaseLoadTime: dbLoadTime,
    searchPerformance: searchTime,
    recordsLoaded: recordCount,
    performanceGrade: dbLoadTime < PERFORMANCE_THRESHOLDS.DATABASE_LOAD ? 'EXCELLENT' : 'NEEDS_IMPROVEMENT'
  };
}

function generateRecommendations(results) {
  const recommendations = [];
  
  // Core Web Vitals recommendations
  if (results.coreWebVitals.scores.LCP !== 'GOOD') {
    recommendations.push({
      category: 'Core Web Vitals',
      priority: 'HIGH',
      issue: 'Largest Contentful Paint optimization needed',
      solution: 'Implement image lazy loading, optimize bundle size, use CDN for images'
    });
  }
  
  if (results.coreWebVitals.scores.CLS !== 'GOOD') {
    recommendations.push({
      category: 'Core Web Vitals',
      priority: 'MEDIUM',
      issue: 'Cumulative Layout Shift detected',
      solution: 'Add size attributes to images, reserve space for dynamic content'
    });
  }
  
  // Bundle size recommendations
  if (results.loadingPerformance.bundles.javascript > PERFORMANCE_THRESHOLDS.JS_BUNDLE_MAX * 1024) {
    recommendations.push({
      category: 'Bundle Optimization',
      priority: 'HIGH',
      issue: 'JavaScript bundle size too large',
      solution: 'Implement code splitting, tree shaking, and dynamic imports'
    });
  }
  
  // Mobile performance recommendations
  const mobileIssues = Object.entries(results.mobilePerformance).filter(([_, metrics]) => metrics.score !== 'EXCELLENT');
  if (mobileIssues.length > 0) {
    recommendations.push({
      category: 'Mobile Performance',
      priority: 'HIGH',
      issue: 'Mobile performance optimization needed',
      solution: 'Optimize for mobile viewports, implement touch-friendly interactions, reduce bundle size'
    });
  }
  
  // Database performance recommendations
  if (results.databasePerformance.performanceGrade !== 'EXCELLENT') {
    recommendations.push({
      category: 'Database Performance',
      priority: 'MEDIUM',
      issue: 'Database loading time could be improved',
      solution: 'Implement progressive loading, chunked data fetching, and caching strategies'
    });
  }
  
  return recommendations;
}

function generateReport(results) {
  console.log('\n📊 COMPREHENSIVE PERFORMANCE ANALYSIS REPORT\n');
  console.log('=' .repeat(60));
  
  console.log('\n🎯 CORE WEB VITALS');
  console.log(`LCP: ${results.coreWebVitals.LCP?.toFixed(0)}ms (${results.coreWebVitals.scores.LCP})`);
  console.log(`FID: ${results.coreWebVitals.FID?.toFixed(0)}ms (${results.coreWebVitals.scores.FID})`);
  console.log(`CLS: ${results.coreWebVitals.CLS?.toFixed(3)} (${results.coreWebVitals.scores.CLS})`);
  console.log(`FCP: ${results.coreWebVitals.FCP?.toFixed(0)}ms`);
  
  console.log('\n⚡ LOADING PERFORMANCE');
  console.log(`DOM Content Loaded: ${results.loadingPerformance.domContentLoaded}ms`);
  console.log(`Network Idle: ${results.loadingPerformance.networkIdle}ms`);
  console.log(`Resources Loaded: ${results.loadingPerformance.resources}`);
  console.log(`JavaScript Bundle: ${(results.loadingPerformance.bundles.javascript / 1024).toFixed(1)}KB`);
  console.log(`CSS Bundle: ${(results.loadingPerformance.bundles.css / 1024).toFixed(1)}KB`);
  console.log(`Total Bundle: ${(results.loadingPerformance.bundles.total / 1024).toFixed(1)}KB`);
  
  console.log('\n👤 USER EXPERIENCE');
  console.log(`Search Response: ${results.userExperienceMetrics.searchResponseTime}ms`);
  console.log(`Navigation Time: ${results.userExperienceMetrics.navigationTime}ms`);
  console.log(`Scroll Performance: ${results.userExperienceMetrics.scrollPerformance}ms`);
  
  console.log('\n📱 MOBILE PERFORMANCE');
  Object.entries(results.mobilePerformance).forEach(([device, metrics]) => {
    console.log(`${device}: ${metrics.loadTime}ms (${metrics.score}) - Memory: ${metrics.memoryUsage}MB`);
  });
  
  console.log('\n♿ ACCESSIBILITY');
  console.log(`Landmarks: ${results.accessibilityMetrics.accessibilityElements.landmarks}`);
  console.log(`Headings: ${results.accessibilityMetrics.accessibilityElements.headings}`);
  console.log(`Alt Text Coverage: ${results.accessibilityMetrics.accessibilityElements.altTextCoverage}%`);
  
  console.log('\n🗄️ DATABASE PERFORMANCE');
  console.log(`Database Load Time: ${results.databasePerformance.databaseLoadTime}ms`);
  console.log(`Search Performance: ${results.databasePerformance.searchPerformance}ms`);
  console.log(`Records Loaded: ${results.databasePerformance.recordsLoaded}`);
  console.log(`Performance Grade: ${results.databasePerformance.performanceGrade}`);
  
  console.log('\n🔧 RECOMMENDATIONS');
  results.recommendations.forEach((rec, index) => {
    console.log(`${index + 1}. [${rec.priority}] ${rec.category}: ${rec.issue}`);
    console.log(`   Solution: ${rec.solution}\n`);
  });
  
  console.log('=' .repeat(60));
  
  // Calculate overall performance score
  const scores = [
    results.coreWebVitals.scores.LCP === 'GOOD' ? 100 : results.coreWebVitals.scores.LCP === 'NEEDS_IMPROVEMENT' ? 75 : 50,
    results.coreWebVitals.scores.FID === 'GOOD' ? 100 : results.coreWebVitals.scores.FID === 'NEEDS_IMPROVEMENT' ? 75 : 50,
    results.coreWebVitals.scores.CLS === 'GOOD' ? 100 : results.coreWebVitals.scores.CLS === 'NEEDS_IMPROVEMENT' ? 75 : 50,
    results.loadingPerformance.domContentLoaded < 2000 ? 100 : 75,
    Object.values(results.mobilePerformance).every(m => m.score === 'EXCELLENT') ? 100 : 75,
    results.databasePerformance.performanceGrade === 'EXCELLENT' ? 100 : 75
  ];
  
  const overallScore = Math.round(scores.reduce((a, b) => a + b) / scores.length);
  
  console.log(`\n🏆 OVERALL PERFORMANCE SCORE: ${overallScore}/100`);
  
  if (overallScore >= 90) {
    console.log('🎉 EXCELLENT - Production ready with outstanding performance');
  } else if (overallScore >= 75) {
    console.log('✅ GOOD - Production ready with room for optimization');
  } else {
    console.log('⚠️ NEEDS IMPROVEMENT - Performance optimization required');
  }
  
  console.log('\n📋 ANALYSIS COMPLETE');
}

// Run the analysis
runPerformanceAnalysis().catch(console.error);