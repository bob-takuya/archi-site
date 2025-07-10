const playwright = require('playwright');

(async () => {
  console.log('Testing production site for errors...');
  const browser = await playwright.chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Collect console errors
  const errors = [];
  const warnings = [];
  const logs = [];
  
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    
    if (type === 'error') {
      errors.push(text);
      console.error('Console Error:', text);
    } else if (type === 'warning') {
      warnings.push(text);
      console.warn('Console Warning:', text);
    } else {
      logs.push(text);
      console.log('Console Log:', text);
    }
  });

  // Collect network failures
  const failedRequests = [];
  page.on('requestfailed', request => {
    const failure = {
      url: request.url(),
      method: request.method(),
      failure: request.failure()
    };
    failedRequests.push(failure);
    console.error('Request Failed:', failure);
  });

  // Collect page errors
  page.on('pageerror', error => {
    console.error('Page Error:', error.message);
    errors.push(`Page Error: ${error.message}`);
  });

  try {
    console.log('Navigating to: https://bob-takuya.github.io/archi-site/');
    const response = await page.goto('https://bob-takuya.github.io/archi-site/', {
      waitUntil: 'networkidle',
      timeout: 60000
    });

    console.log('Response status:', response.status());
    
    // Wait for any dynamic content
    await page.waitForTimeout(5000);

    // Check for the error message
    const errorText = await page.textContent('body');
    if (errorText.includes('問題が発生しました')) {
      console.log('\n❌ ERROR MESSAGE FOUND: "問題が発生しました"');
      
      // Try to find the specific element showing the error
      const errorElement = await page.locator(':text("問題が発生しました")').first();
      if (errorElement) {
        const elementInfo = await errorElement.evaluate(el => {
          return {
            tagName: el.tagName,
            className: el.className,
            id: el.id,
            parentTag: el.parentElement?.tagName,
            parentClass: el.parentElement?.className
          };
        });
        console.log('Error element info:', elementInfo);
      }
    }

    // Take a screenshot
    await page.screenshot({ path: 'temp/production-error-state.png', fullPage: true });

    // Check for specific UI elements
    const hasSearchBar = await page.locator('input[type="search"], input[placeholder*="検索"], input[placeholder*="Search"]').count() > 0;
    const hasNavigation = await page.locator('nav, header').count() > 0;
    const hasContent = await page.locator('main, [role="main"], #main-content').count() > 0;

    console.log('\n=== PAGE STATE ===');
    console.log('Has search bar:', hasSearchBar);
    console.log('Has navigation:', hasNavigation);
    console.log('Has main content:', hasContent);

    console.log('\n=== SUMMARY ===');
    console.log(`Console Errors: ${errors.length}`);
    errors.forEach(err => console.log('  -', err));
    
    console.log(`\nFailed Requests: ${failedRequests.length}`);
    failedRequests.forEach(req => console.log('  -', req.url));

    // Check if React app loaded
    const reactRoot = await page.evaluate(() => {
      const root = document.getElementById('root');
      return {
        hasRoot: !!root,
        hasChildren: root ? root.children.length > 0 : false,
        innerHTML: root ? root.innerHTML.substring(0, 200) : null
      };
    });
    
    console.log('\n=== REACT APP STATE ===');
    console.log('Root element exists:', reactRoot.hasRoot);
    console.log('Root has children:', reactRoot.hasChildren);
    console.log('Root HTML preview:', reactRoot.innerHTML);

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await browser.close();
  }
})();