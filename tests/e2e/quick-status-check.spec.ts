import { test, expect } from '@playwright/test';

const BASE_URL = 'https://bob-takuya.github.io/archi-site/';

test.describe('Quick Status Check', () => {
  test.setTimeout(30000);

  test('Check all pages current status', async ({ page }) => {
    console.log('\n🔍 COMPREHENSIVE FUNCTIONALITY CHECK\n');
    
    // Enable console logging
    page.on('console', msg => {
      if (msg.text().includes('database') || msg.text().includes('Database') || 
          msg.text().includes('architect') || msg.text().includes('error')) {
        console.log(`📝 Console: ${msg.text()}`);
      }
    });
    
    page.on('pageerror', error => {
      console.log(`❌ Page Error: ${error.message}`);
    });

    // 1. Homepage Check
    console.log('1️⃣ Testing Homepage...');
    await page.goto(BASE_URL);
    await page.waitForTimeout(2000);
    
    const homepageWorking = await page.locator('h1').count() > 0;
    const heroVisible = await page.locator('text=/日本の建築/').isVisible().catch(() => false);
    console.log(`   ✅ Homepage loads: ${homepageWorking}`);
    console.log(`   ✅ Hero content visible: ${heroVisible}`);
    
    // 2. Architecture Page Check
    console.log('\n2️⃣ Testing Architecture Page...');
    await page.goto(`${BASE_URL}#/architecture`);
    await page.waitForTimeout(3000);
    
    const architectureCards = await page.locator('.MuiCard-root').count();
    const architectureSearch = await page.locator('input[placeholder*="検索"]').isVisible().catch(() => false);
    console.log(`   ✅ Architecture cards found: ${architectureCards}`);
    console.log(`   ✅ Search box visible: ${architectureSearch}`);
    
    // 3. Architects Page Check (Main Focus)
    console.log('\n3️⃣ Testing Architects Page (CRITICAL)...');
    await page.goto(`${BASE_URL}#/architects`);
    await page.waitForTimeout(5000);
    
    // Get architect count text
    const architectCountElement = await page.locator('text=/\\d+人の建築家/').first();
    const architectCount = await architectCountElement.textContent().catch(() => 'Not found');
    console.log(`   📊 Architect count displayed: "${architectCount}"`);
    
    // Check for loading or error states
    const isLoading = await page.locator('text="検索中"').isVisible().catch(() => false);
    const hasError = await page.locator('text=/エラー|問題|利用できません/').isVisible().catch(() => false);
    const architectCards = await page.locator('.MuiCard-root').count();
    
    console.log(`   ✅ Is loading: ${isLoading}`);
    console.log(`   ❌ Has error: ${hasError}`);
    console.log(`   ✅ Architect cards found: ${architectCards}`);
    
    // Check page content
    const pageContent = await page.content();
    if (pageContent.includes('データベースサービスが利用できません')) {
      console.log('   ⚠️  Database service unavailable message shown');
    }
    if (pageContent.includes('0人の建築家')) {
      console.log('   ⚠️  Showing 0 architects - database not loading properly');
    }
    
    // 4. Map Page Check
    console.log('\n4️⃣ Testing Map Page...');
    await page.goto(`${BASE_URL}#/map`);
    await page.waitForTimeout(3000);
    
    const mapVisible = await page.locator('.leaflet-container').isVisible().catch(() => false);
    const mapMarkers = await page.locator('.leaflet-marker-icon').count();
    console.log(`   ✅ Map visible: ${mapVisible}`);
    console.log(`   ✅ Map markers: ${mapMarkers}`);
    
    // 5. Research Page Check
    console.log('\n5️⃣ Testing Research Page...');
    await page.goto(`${BASE_URL}#/research`);
    await page.waitForTimeout(2000);
    
    const researchTitle = await page.locator('h4:has-text("研究・分析ツール")').isVisible().catch(() => false);
    const analysisCards = await page.locator('.MuiCard-root').count();
    console.log(`   ✅ Research page loads: ${researchTitle}`);
    console.log(`   ✅ Analysis cards: ${analysisCards}`);
    
    // Summary
    console.log('\n📊 SUMMARY:');
    console.log('- Homepage: ' + (homepageWorking ? '✅ Working' : '❌ Not working'));
    console.log('- Architecture: ' + (architectureCards > 0 ? '✅ Working' : '❌ Not working'));
    console.log('- Architects: ' + (architectCount !== '0人の建築家' && architectCount !== 'Not found' ? '✅ Working' : '❌ NOT WORKING - Shows 0 architects'));
    console.log('- Map: ' + (mapVisible ? '✅ Working' : '❌ Not working'));
    console.log('- Research: ' + (researchTitle ? '✅ Working' : '❌ Not working'));
    
    // Final assertion
    if (architectCount === '0人の建築家') {
      throw new Error('Architects page still showing 0 architects - database connection not working');
    }
  });

  test('Database initialization check', async ({ page }) => {
    console.log('\n🔍 DATABASE INITIALIZATION CHECK\n');
    
    const messages: string[] = [];
    page.on('console', msg => {
      messages.push(msg.text());
    });
    
    await page.goto(`${BASE_URL}#/architects`);
    await page.waitForTimeout(10000); // Give database time to initialize
    
    // Check for database messages
    const dbMessages = messages.filter(m => 
      m.includes('database') || 
      m.includes('Database') ||
      m.includes('SQLite') ||
      m.includes('chunked') ||
      m.includes('architect')
    );
    
    console.log('Database-related console messages:');
    dbMessages.forEach(msg => console.log(`  - ${msg}`));
    
    // Check if database files are accessible
    const dbResponse = await page.request.get(`${BASE_URL}db/archimap.sqlite`, { failOnStatusCode: false });
    console.log(`\n✅ Database file accessible: ${dbResponse.ok()} (status: ${dbResponse.status()})`);
    
    const dbInfoResponse = await page.request.get(`${BASE_URL}db/database-info.json`, { failOnStatusCode: false });
    console.log(`✅ Database info accessible: ${dbInfoResponse.ok()} (status: ${dbInfoResponse.status()})`);
    
    if (dbInfoResponse.ok()) {
      const dbInfo = await dbInfoResponse.json();
      console.log(`✅ Database info:`, dbInfo);
    }
  });
});