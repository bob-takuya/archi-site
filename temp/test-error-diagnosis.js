const { chromium } = require('playwright');

async function testErrorDiagnosis() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  console.log('🔍 Testing for Application Errors');
  console.log('==================================');
  
  try {
    // Listen for console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('❌ Console Error:', msg.text());
      }
    });
    
    // Listen for page errors
    page.on('pageerror', error => {
      console.log('❌ Page Error:', error.message);
    });
    
    // Listen for failed requests
    page.on('requestfailed', request => {
      console.log('❌ Failed Request:', request.url(), request.failure().errorText);
    });
    
    console.log('\n1️⃣ Testing homepage...');
    await page.goto('http://localhost:3001/archi-site/', { 
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    await page.waitForTimeout(3000);
    
    // Check for error boundary messages
    const errorText = await page.evaluate(() => {
      const errorElements = document.querySelectorAll('[class*="error"], [id*="error"], .MuiAlert-root');
      const errorMessages = [];
      
      for (const element of errorElements) {
        if (element.textContent && element.textContent.trim()) {
          errorMessages.push(element.textContent.trim());
        }
      }
      
      // Check for specific Japanese error message
      const bodyText = document.body.textContent || '';
      if (bodyText.includes('アプリケーションで予期しないエラーが発生しました') || 
          bodyText.includes('予期しないエラー') ||
          bodyText.includes('お手数ですが、再読み込みをお試しください')) {
        errorMessages.push('Found Japanese error message in page');
      }
      
      return errorMessages;
    });
    
    if (errorText.length > 0) {
      console.log('❌ Found error messages on homepage:', errorText);
    } else {
      console.log('✅ Homepage loads without visible errors');
    }
    
    console.log('\n2️⃣ Testing architecture page...');
    await page.goto('http://localhost:3001/archi-site/#/architecture', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    await page.waitForTimeout(5000);
    
    const archErrorText = await page.evaluate(() => {
      const errorElements = document.querySelectorAll('[class*="error"], [id*="error"], .MuiAlert-root');
      const errorMessages = [];
      
      for (const element of errorElements) {
        if (element.textContent && element.textContent.trim()) {
          errorMessages.push(element.textContent.trim());
        }
      }
      
      const bodyText = document.body.textContent || '';
      if (bodyText.includes('アプリケーションで予期しないエラーが発生しました') || 
          bodyText.includes('予期しないエラー') ||
          bodyText.includes('お手数ですが、再読み込みをお試しください')) {
        errorMessages.push('Found Japanese error message in architecture page');
      }
      
      return errorMessages;
    });
    
    if (archErrorText.length > 0) {
      console.log('❌ Found error messages on architecture page:', archErrorText);
    } else {
      console.log('✅ Architecture page loads without visible errors');
    }
    
    console.log('\n3️⃣ Testing single architecture page...');
    await page.goto('http://localhost:3001/archi-site/#/architecture/1', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    await page.waitForTimeout(5000);
    
    const singleErrorText = await page.evaluate(() => {
      const errorElements = document.querySelectorAll('[class*="error"], [id*="error"], .MuiAlert-root');
      const errorMessages = [];
      
      for (const element of errorElements) {
        if (element.textContent && element.textContent.trim()) {
          errorMessages.push(element.textContent.trim());
        }
      }
      
      const bodyText = document.body.textContent || '';
      if (bodyText.includes('アプリケーションで予期しないエラーが発生しました') || 
          bodyText.includes('予期しないエラー') ||
          bodyText.includes('お手数ですが、再読み込みをお試しください')) {
        errorMessages.push('Found Japanese error message in single architecture page');
      }
      
      return errorMessages;
    });
    
    if (singleErrorText.length > 0) {
      console.log('❌ Found error messages on single architecture page:', singleErrorText);
    } else {
      console.log('✅ Single architecture page loads without visible errors');
    }
    
    console.log('\n4️⃣ Testing map page...');
    await page.goto('http://localhost:3001/archi-site/#/map', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    await page.waitForTimeout(5000);
    
    const mapErrorText = await page.evaluate(() => {
      const errorElements = document.querySelectorAll('[class*="error"], [id*="error"], .MuiAlert-root');
      const errorMessages = [];
      
      for (const element of errorElements) {
        if (element.textContent && element.textContent.trim()) {
          errorMessages.push(element.textContent.trim());
        }
      }
      
      const bodyText = document.body.textContent || '';
      if (bodyText.includes('アプリケーションで予期しないエラーが発生しました') || 
          bodyText.includes('予期しないエラー') ||
          bodyText.includes('お手数ですが、再読み込みをお試しください')) {
        errorMessages.push('Found Japanese error message in map page');
      }
      
      return errorMessages;
    });
    
    if (mapErrorText.length > 0) {
      console.log('❌ Found error messages on map page:', mapErrorText);
    } else {
      console.log('✅ Map page loads without visible errors');
    }
    
    // Take screenshot for debugging
    await page.screenshot({ 
      path: 'temp/error-diagnosis.png', 
      fullPage: true 
    });
    
    console.log('\n📸 Screenshot saved to temp/error-diagnosis.png');
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  } finally {
    await browser.close();
  }
}

testErrorDiagnosis();