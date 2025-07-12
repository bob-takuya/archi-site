#!/usr/bin/env node

/**
 * Automated Fix Application Script for ArchitectService SQL Issues
 * 
 * This script applies all the necessary fixes to resolve the SQL query issues
 * in the ArchitectService and ArchitectsPage components.
 */

import fs from 'fs';
import path from 'path';

const PROJECT_ROOT = '/Users/homeserver/ai-creative-team/archi-site';

const fixes = [
  {
    file: 'src/pages/ArchitectsPage.tsx',
    description: 'Fix API call signature and response handling',
    changes: [
      {
        search: `const result = await ArchitectService.getAllArchitects(
          page,
          10, // itemsPerPage
          search,
          tags,
          sort,
          order,
          nat,
          cat,
          sch,
          birthFrom ? parseInt(birthFrom) : 0,
          birthTo ? parseInt(birthTo) : 0,
          death ? parseInt(death) : 0
        );`,
        replace: `const result = await ArchitectService.getAllArchitects(
          page,
          10, // itemsPerPage
          search,
          tags,
          sort,
          order,
          {
            nationality: nat,
            category: cat,
            school: sch,
            birthYearFrom: birthFrom ? parseInt(birthFrom) : undefined,
            birthYearTo: birthTo ? parseInt(birthTo) : undefined,
            deathYear: death ? parseInt(death) : undefined
          }
        );`
      },
      {
        search: `setArchitects(result.items);`,
        replace: `setArchitects(result.results);`
      },
      {
        search: `ZAT_NATIONALITY`,
        replace: `ZAR_NATIONALITY`,
        global: true
      },
      {
        search: `ZAT_CATEGORY`,
        replace: `ZAR_CATEGORY`,
        global: true
      },
      {
        search: `ZAT_SCHOOL`,
        replace: `ZAR_SCHOOL`,
        global: true
      },
      {
        search: `ZAT_BIRTHYEAR`,
        replace: `ZAR_BIRTHYEAR`,
        global: true
      },
      {
        search: `ZAT_DEATHYEAR`,
        replace: `ZAR_DEATHYEAR`,
        global: true
      },
      {
        search: `key={architect.id}`,
        replace: `key={architect.ZAR_ID}`
      },
      {
        search: `{architect.name}`,
        replace: `{architect.ZAR_NAME}`
      },
      {
        search: `{architect.nationality} • {architect.birthYear || '?'}-{architect.deathYear || '現在'}`,
        replace: `{architect.ZAR_NATIONALITY} • {architect.ZAR_BIRTHYEAR || '?'}-{architect.ZAR_DEATHYEAR || '現在'}`
      },
      {
        search: `to={\`/architects/\${architect.id}\`}`,
        replace: `to={\`/architects/\${architect.ZAR_ID}\`}`
      }
    ]
  },
  {
    file: 'src/services/db/ArchitectService.ts',
    description: 'Add debug logging to getAllArchitects',
    changes: [
      {
        search: `// データ取得クエリ
    const dataQuery = \`
      SELECT DISTINCT ZCDARCHITECT.*
      FROM ZCDARCHITECT
      \${joinClause}
      WHERE \${whereClause}
      ORDER BY \${sortBy} \${sortOrder === 'desc' ? 'DESC' : 'ASC'}
      LIMIT ? OFFSET ?
    \`;`,
        replace: `// データ取得クエリ
    const dataQuery = \`
      SELECT DISTINCT ZCDARCHITECT.*
      FROM ZCDARCHITECT
      \${joinClause}
      WHERE \${whereClause}
      ORDER BY \${sortBy} \${sortOrder === 'desc' ? 'DESC' : 'ASC'}
      LIMIT ? OFFSET ?
    \`;
    
    // Debug logging
    console.log('🔍 SQL Debug - Count Query:', countQuery);
    console.log('🔍 SQL Debug - Count Parameters:', params);
    console.log('🔍 SQL Debug - Data Query:', dataQuery);
    console.log('🔍 SQL Debug - Data Parameters:', dataParams);`
      },
      {
        search: `} catch (error) {
    console.error('建築家データ取得エラー:', error);
    throw error;
  }`,
        replace: `} catch (error) {
    console.error('📊 SQL Error Details:', {
      error: error.message,
      countQuery,
      dataQuery,
      params,
      dataParams
    });
    console.error('建築家データ取得エラー:', error);
    throw error;
  }`
      }
    ]
  }
];

function applyFix(fix) {
  const filePath = path.join(PROJECT_ROOT, fix.file);
  
  console.log(`\n🔧 Applying fixes to ${fix.file}...`);
  console.log(`📝 ${fix.description}`);
  
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    return false;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  let changesMade = 0;
  
  for (const change of fix.changes) {
    const flags = change.global ? 'g' : '';
    const regex = new RegExp(escapeRegExp(change.search), flags);
    
    if (content.includes(change.search)) {
      content = content.replace(regex, change.replace);
      changesMade++;
      console.log(`  ✅ Applied change: ${change.search.substring(0, 50)}...`);
    } else {
      console.log(`  ⚠️  Search pattern not found: ${change.search.substring(0, 50)}...`);
    }
  }
  
  if (changesMade > 0) {
    // Create backup
    const backupPath = `${filePath}.backup`;
    fs.copyFileSync(filePath, backupPath);
    console.log(`  💾 Backup created: ${backupPath}`);
    
    // Write fixed content
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  ✅ ${changesMade} changes applied successfully!`);
    return true;
  } else {
    console.log(`  ℹ️  No changes were needed`);
    return false;
  }
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function createTestScript() {
  const testScript = `
// SQL Debugging Test Script
// Run this in the browser console to test the fixes

async function testArchitectServiceFixes() {
  console.log('🧪 Testing ArchitectService fixes...');
  
  try {
    // Import services
    const { executeQuery, resultsToObjects } = await import('./src/services/db/ClientDatabaseService.js');
    const { getAllArchitects } = await import('./src/services/db/ArchitectService.js');
    
    // Test 1: Basic database connection
    console.log('1. Testing database connection...');
    const basicResult = await executeQuery('SELECT 1 as test');
    console.log('✅ Database connection:', resultsToObjects(basicResult));
    
    // Test 2: Check table exists
    console.log('2. Checking ZCDARCHITECT table...');
    const tableResult = await executeQuery("SELECT name FROM sqlite_master WHERE type='table' AND name='ZCDARCHITECT'");
    console.log('✅ Table exists:', resultsToObjects(tableResult));
    
    // Test 3: Count records
    console.log('3. Counting records...');
    const countResult = await executeQuery('SELECT COUNT(*) as count FROM ZCDARCHITECT');
    console.log('✅ Record count:', resultsToObjects(countResult));
    
    // Test 4: Test getAllArchitects
    console.log('4. Testing getAllArchitects...');
    const architectsResult = await getAllArchitects(1, 5);
    console.log('✅ getAllArchitects result:', architectsResult);
    
    console.log('🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testArchitectServiceFixes();
`;

  const testPath = path.join(PROJECT_ROOT, 'temp', 'test_fixes.js');
  fs.writeFileSync(testPath, testScript, 'utf8');
  console.log(`\n📋 Test script created: ${testPath}`);
  console.log('Run this script in the browser console to test the fixes.');
}

function main() {
  console.log('🚀 ArchitectService SQL Fixes Application Script');
  console.log('=' * 50);
  
  let totalFixes = 0;
  
  for (const fix of fixes) {
    if (applyFix(fix)) {
      totalFixes++;
    }
  }
  
  createTestScript();
  
  console.log(`\n🎉 Fix application complete!`);
  console.log(`📊 Files modified: ${totalFixes}/${fixes.length}`);
  console.log(`\n📝 Next steps:`);
  console.log(`1. Test the application in the browser`);
  console.log(`2. Open browser console and check for SQL debug logs`);
  console.log(`3. Run the test script: temp/test_fixes.js`);
  console.log(`4. If issues persist, use temp/test_architect_queries.html`);
  
  if (totalFixes === 0) {
    console.log(`\n⚠️  No fixes were applied. This could mean:`);
    console.log(`- Files have already been fixed`);
    console.log(`- Search patterns need to be updated`);
    console.log(`- Files are in a different location`);
  }
}

main();