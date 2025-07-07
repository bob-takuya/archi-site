const { chromium } = require('playwright');

async function testDatabaseLoading() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  console.log('Testing Database Loading and Data Availability...\n');
  
  // Track all network requests
  const networkRequests = [];
  page.on('request', request => {
    networkRequests.push({
      url: request.url(),
      method: request.method(),
      resourceType: request.resourceType()
    });
  });
  
  // Track responses
  const networkResponses = [];
  page.on('response', response => {
    networkResponses.push({
      url: response.url(),
      status: response.status(),
      contentType: response.headers()['content-type'] || 'unknown'
    });
  });
  
  // Track console messages
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push({
      type: msg.type(),
      text: msg.text()
    });
  });
  
  try {
    // Navigate to the site
    console.log('1. Navigating to site...');
    await page.goto('https://bob-takuya.github.io/archi-site/', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    // Wait for initial loading
    await page.waitForTimeout(5000);
    
    // Check for database files in network requests
    console.log('\n2. Checking for database file requests...');
    const dbRequests = networkRequests.filter(req => 
      req.url.includes('.db') || 
      req.url.includes('.sqlite') || 
      req.url.includes('database') ||
      req.url.includes('architecture') ||
      req.url.includes('data')
    );
    
    console.log(`   Found ${dbRequests.length} database-related requests:`);
    dbRequests.forEach(req => {
      const response = networkResponses.find(res => res.url === req.url);
      console.log(`   - ${req.method} ${req.url} (Status: ${response?.status || 'pending'})`);
    });
    
    // Check for successful database responses
    console.log('\n3. Checking database response status...');
    const dbResponses = networkResponses.filter(res => 
      res.url.includes('.db') || 
      res.url.includes('.sqlite') || 
      res.url.includes('database')
    );
    
    dbResponses.forEach(res => {
      console.log(`   - ${res.url}: ${res.status} (${res.contentType})`);
    });
    
    // Navigate to architecture page specifically
    console.log('\n4. Testing architecture page data loading...');
    await page.goto('https://bob-takuya.github.io/archi-site/architecture', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    // Wait for data to load
    await page.waitForTimeout(5000);
    
    // Check if there's any indication of data loading
    const dataLoadingCheck = await page.evaluate(() => {
      const body = document.body;
      const text = body.textContent || '';
      
      // Look for common database-related terms
      const hasDataTerms = [
        'building', 'architect', 'tokyo', 'japan', 'design', 'construction',
        '建築', '設計', '東京', '日本', '建物', '建築家'
      ].some(term => text.toLowerCase().includes(term.toLowerCase()));
      
      // Look for loading indicators
      const hasLoadingIndicators = [
        'loading', 'loading...', 'load', 'wait', 'pending',
        '読み込み中', '読み込み', '待機'
      ].some(term => text.toLowerCase().includes(term.toLowerCase()));
      
      // Look for error messages
      const hasErrorMessages = [
        'error', 'failed', 'not found', '404', 'cannot load',
        'エラー', '失敗', '見つかりません', '読み込めません'
      ].some(term => text.toLowerCase().includes(term.toLowerCase()));
      
      // Count elements that might contain data
      const listItems = document.querySelectorAll('li, .item, .card, .building, .architect');
      const images = document.querySelectorAll('img');
      const links = document.querySelectorAll('a');
      
      return {
        hasDataTerms,
        hasLoadingIndicators,
        hasErrorMessages,
        listItemsCount: listItems.length,
        imagesCount: images.length,
        linksCount: links.length,
        totalTextLength: text.length,
        sampleText: text.substring(0, 200) + '...'
      };
    });
    
    console.log('   Data loading analysis:');
    Object.entries(dataLoadingCheck).forEach(([key, value]) => {
      console.log(`   - ${key}: ${value}`);
    });
    
    // Check console for database-related messages
    console.log('\n5. Checking console messages for database activity...');
    const dbConsoleMessages = consoleMessages.filter(msg => 
      msg.text.toLowerCase().includes('database') ||
      msg.text.toLowerCase().includes('sqlite') ||
      msg.text.toLowerCase().includes('sql') ||
      msg.text.toLowerCase().includes('fetch') ||
      msg.text.toLowerCase().includes('load')
    );
    
    console.log(`   Found ${dbConsoleMessages.length} database-related console messages:`);
    dbConsoleMessages.forEach(msg => {
      console.log(`   - [${msg.type}] ${msg.text}`);
    });
    
    // Look for any fetch or API calls
    console.log('\n6. Checking for API/fetch calls...');
    const apiCalls = networkRequests.filter(req => 
      req.url.includes('api') || 
      req.resourceType === 'fetch' ||
      req.resourceType === 'xhr'
    );
    
    console.log(`   Found ${apiCalls.length} API/fetch calls:`);
    apiCalls.forEach(req => {
      const response = networkResponses.find(res => res.url === req.url);
      console.log(`   - ${req.method} ${req.url} (Status: ${response?.status || 'pending'})`);
    });
    
    // Check if the site is actually loading data vs showing empty state
    console.log('\n7. Final data availability assessment...');
    
    const finalAssessment = {
      hasDbRequests: dbRequests.length > 0,
      hasSuccessfulDbResponses: dbResponses.some(res => res.status === 200),
      hasDataContent: dataLoadingCheck.hasDataTerms,
      hasLoadingStates: dataLoadingCheck.hasLoadingIndicators,
      hasErrors: dataLoadingCheck.hasErrorMessages || consoleMessages.some(msg => msg.type === 'error'),
      contentRichness: dataLoadingCheck.totalTextLength > 1000,
      hasInteractiveElements: dataLoadingCheck.listItemsCount > 0 || dataLoadingCheck.imagesCount > 0
    };
    
    console.log('\n=== DATABASE LOADING ASSESSMENT ===');
    Object.entries(finalAssessment).forEach(([key, value]) => {
      const emoji = value ? '✅' : '❌';
      console.log(`${emoji} ${key}: ${value}`);
    });
    
    if (!finalAssessment.hasDbRequests && !finalAssessment.hasDataContent) {
      console.log('\n🔴 CRITICAL: No database activity detected!');
      console.log('Possible issues:');
      console.log('- Database file not deployed to GitHub Pages');
      console.log('- Incorrect database file path in code');
      console.log('- CORS restrictions preventing database access');
      console.log('- JavaScript errors preventing database initialization');
      console.log('- Using server-side database instead of client-side');
    } else if (finalAssessment.hasDbRequests && !finalAssessment.hasSuccessfulDbResponses) {
      console.log('\n🟡 WARNING: Database requests made but responses failed');
      console.log('Check HTTP status codes and CORS settings');
    } else if (finalAssessment.hasSuccessfulDbResponses && !finalAssessment.hasDataContent) {
      console.log('\n🟡 WARNING: Database loaded but no data rendered');
      console.log('Check JavaScript data processing and rendering logic');
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testDatabaseLoading().catch(console.error);