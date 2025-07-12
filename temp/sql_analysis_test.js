/**
 * SQL Query Analysis Test Script
 * 
 * This script tests the ArchitectService queries to identify why they return no results
 */

// Import the database service
import { executeQuery, resultsToObjects, initDatabase } from '../src/services/db/ClientDatabaseService.js';

/**
 * Main analysis function
 */
async function analyzeSQLQueries() {
  console.log('🔍 Starting SQL Query Analysis...\n');
  
  try {
    // Initialize database first
    console.log('1. Initializing database...');
    await initDatabase();
    console.log('✅ Database initialized\n');
    
    // Test 1: Check if ZCDARCHITECT table exists and structure
    console.log('2. Checking ZCDARCHITECT table structure...');
    const tableSchema = await executeQuery(`
      PRAGMA table_info(ZCDARCHITECT)
    `);
    
    if (!tableSchema || tableSchema.length === 0) {
      console.error('❌ ZCDARCHITECT table does not exist!');
      return;
    }
    
    const columns = resultsToObjects(tableSchema);
    console.log('✅ ZCDARCHITECT table exists with columns:');
    columns.forEach(col => {
      console.log(`   - ${col.name}: ${col.type} (nullable: ${col.notnull === 0})`);
    });
    console.log('');
    
    // Test 2: Check if table has any data
    console.log('3. Checking data count in ZCDARCHITECT...');
    const countResult = await executeQuery('SELECT COUNT(*) as count FROM ZCDARCHITECT');
    const count = resultsToObjects(countResult)[0]?.count || 0;
    console.log(`✅ ZCDARCHITECT table contains ${count} records\n`);
    
    if (count === 0) {
      console.error('❌ ZCDARCHITECT table is empty - no data to query!');
      return;
    }
    
    // Test 3: Test basic SELECT without filters
    console.log('4. Testing basic SELECT query...');
    const basicResult = await executeQuery('SELECT * FROM ZCDARCHITECT LIMIT 5');
    const basicData = resultsToObjects(basicResult);
    console.log(`✅ Basic SELECT returned ${basicData.length} records`);
    
    if (basicData.length > 0) {
      console.log('Sample data:');
      console.log(JSON.stringify(basicData[0], null, 2));
    }
    console.log('');
    
    // Test 4: Check specific column existence and content
    console.log('5. Checking specific columns used in queries...');
    const columnTests = [
      'ZAR_ID',
      'ZAR_NAME', 
      'ZAR_KANA',
      'ZAR_NAMEENG',
      'ZAR_NATIONALITY',
      'ZAR_CATEGORY',
      'ZAR_SCHOOL',
      'ZAR_BIRTHYEAR',
      'ZAR_DEATHYEAR'
    ];
    
    for (const column of columnTests) {
      try {
        const testResult = await executeQuery(`SELECT ${column}, COUNT(*) as count FROM ZCDARCHITECT WHERE ${column} IS NOT NULL GROUP BY ${column} LIMIT 3`);
        const testData = resultsToObjects(testResult);
        console.log(`   ✅ ${column}: ${testData.length} unique non-null values`);
        if (testData.length > 0) {
          console.log(`      Sample values: ${testData.map(row => row[column]).join(', ')}`);
        }
      } catch (error) {
        console.error(`   ❌ ${column}: Column does not exist or has issues`);
      }
    }
    console.log('');
    
    // Test 5: Test the exact query from getAllArchitects (simplified)
    console.log('6. Testing getAllArchitects base query...');
    const getAllQuery = `
      SELECT COUNT(DISTINCT ZCDARCHITECT.ZAR_ID) as total
      FROM ZCDARCHITECT
      WHERE 1=1
    `;
    
    try {
      const getAllResult = await executeQuery(getAllQuery);
      const getAllData = resultsToObjects(getAllResult);
      console.log(`✅ getAllArchitects count query returned: ${JSON.stringify(getAllData[0])}`);
    } catch (error) {
      console.error(`❌ getAllArchitects count query failed: ${error.message}`);
    }
    
    // Test 6: Test with LIMIT and OFFSET
    console.log('7. Testing data query with LIMIT and OFFSET...');
    const dataQuery = `
      SELECT DISTINCT ZCDARCHITECT.*
      FROM ZCDARCHITECT
      WHERE 1=1
      ORDER BY ZAR_NAME ASC
      LIMIT 12 OFFSET 0
    `;
    
    try {
      const dataResult = await executeQuery(dataQuery);
      const dataData = resultsToObjects(dataResult);
      console.log(`✅ Data query returned ${dataData.length} records`);
    } catch (error) {
      console.error(`❌ Data query failed: ${error.message}`);
    }
    
    // Test 7: Test getArchitectById query
    console.log('8. Testing getArchitectById query...');
    if (basicData.length > 0 && basicData[0].ZAR_ID) {
      const testId = basicData[0].ZAR_ID;
      try {
        const byIdResult = await executeQuery('SELECT * FROM ZCDARCHITECT WHERE ZAR_ID = ?', [testId]);
        const byIdData = resultsToObjects(byIdResult);
        console.log(`✅ getArchitectById(${testId}) returned ${byIdData.length} records`);
      } catch (error) {
        console.error(`❌ getArchitectById query failed: ${error.message}`);
      }
    } else {
      console.warn('⚠️ Cannot test getArchitectById - no sample data with ZAR_ID');
    }
    
    // Test 8: Test parameter binding
    console.log('9. Testing parameter binding...');
    try {
      const paramResult = await executeQuery(
        'SELECT COUNT(*) as count FROM ZCDARCHITECT WHERE ZAR_NAME LIKE ?', 
        ['%建築%']
      );
      const paramData = resultsToObjects(paramResult);
      console.log(`✅ Parameter binding test returned: ${JSON.stringify(paramData[0])}`);
    } catch (error) {
      console.error(`❌ Parameter binding test failed: ${error.message}`);
    }
    
    console.log('\n🎉 SQL Analysis Complete!');
    
  } catch (error) {
    console.error('❌ Analysis failed:', error);
  }
}

// Run the analysis
analyzeSQLQueries();