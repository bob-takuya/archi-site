const { chromium } = require('playwright');

async function testConfigFix() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  console.log('🔧 Testing Configuration Fix');
  console.log('============================');
  
  let hasServerModeError = false;
  let hasChunkedSuccess = false;
  
  // Capture console logs
  page.on('console', msg => {
    const text = msg.text();
    console.log(`Console ${msg.type()}: ${text}`);
    
    if (text.includes('serverMode')) {
      hasServerModeError = true;
    }
    if (text.includes('sql.js-httpvfs worker initialized successfully')) {
      hasChunkedSuccess = true;
    }
  });
  
  try {
    console.log('📍 Loading GitHub Pages site...');
    await page.goto('https://bob-takuya.github.io/archi-site/', { 
      waitUntil: 'networkidle', 
      timeout: 60000 
    });
    
    console.log('⏳ Waiting 60 seconds to check configuration...');
    await page.waitForTimeout(60000);
    
    console.log('\n📊 Configuration Test Results:');
    console.log(`ServerMode Error: ${hasServerModeError ? '❌ STILL PRESENT' : '✅ FIXED'}`);
    console.log(`Chunked Loading Success: ${hasChunkedSuccess ? '✅ WORKING' : '❌ NOT WORKING'}`);
    
    if (!hasServerModeError && hasChunkedSuccess) {
      console.log('🎉 SUCCESS! Configuration is fixed and chunked loading is working!');
      return true;
    } else if (!hasServerModeError) {
      console.log('⚠️  Configuration error is fixed but chunked loading not confirmed yet');
      return false;
    } else {
      console.log('❌ Configuration error still exists');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  } finally {
    await browser.close();
  }
}

testConfigFix().then(success => {
  console.log('\n🏁 Quick Test Result:', success ? 'Configuration FIXED!' : 'Configuration needs more work');
  process.exit(success ? 0 : 1);
});