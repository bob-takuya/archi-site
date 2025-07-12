/**
 * ArchitectService SQL Query Fixes
 * 
 * This file contains the exact fixes needed to resolve the SQL query issues
 * in ArchitectService and ArchitectsPage components.
 */

// ===== FIX 1: ArchitectsPage.tsx API Call (Lines 151-164) =====
// WRONG:
/*
const result = await ArchitectService.getAllArchitects(
  page,
  10, // itemsPerPage
  search,
  tags,
  sort,
  order,
  nat,    // Individual parameters - WRONG!
  cat,
  sch,
  birthFrom ? parseInt(birthFrom) : 0,
  birthTo ? parseInt(birthTo) : 0,
  death ? parseInt(death) : 0
);
*/

// CORRECT:
const result = await ArchitectService.getAllArchitects(
  page,
  10, // itemsPerPage
  search,
  tags,
  sort,
  order,
  {  // Options object - CORRECT!
    nationality: nat,
    category: cat,
    school: sch,
    birthYearFrom: birthFrom ? parseInt(birthFrom) : undefined,
    birthYearTo: birthTo ? parseInt(birthTo) : undefined,
    deathYear: death ? parseInt(death) : undefined
  }
);

// ===== FIX 2: ArchitectsPage.tsx Response Handling (Lines 167-169) =====
// WRONG:
/*
setArchitects(result.items);        // Property doesn't exist
setTotalPages(result.totalPages);   // Correct
setTotalItems(result.total);        // Correct
*/

// CORRECT:
setArchitects(result.results);      // Service returns 'results', not 'items'
setTotalPages(result.totalPages);   // Correct
setTotalItems(result.total);        // Correct

// ===== FIX 3: ArchitectsPage.tsx Column Names (Lines 185-193) =====
// WRONG (uses ZAT_ prefix):
/*
if (tag === '国籍') {
  query = `SELECT DISTINCT ZAT_NATIONALITY as value FROM ZCDARCHITECT WHERE ZAT_NATIONALITY != '' ORDER BY ZAT_NATIONALITY`;
} else if (tag === 'カテゴリー') {
  query = `SELECT DISTINCT ZAT_CATEGORY as value FROM ZCDARCHITECT WHERE ZAT_CATEGORY != '' ORDER BY ZAT_CATEGORY`;
}
// ... etc
*/

// CORRECT (uses ZAR_ prefix to match ArchitectService):
if (tag === '国籍') {
  query = `SELECT DISTINCT ZAR_NATIONALITY as value FROM ZCDARCHITECT WHERE ZAR_NATIONALITY != '' ORDER BY ZAR_NATIONALITY`;
} else if (tag === 'カテゴリー') {
  query = `SELECT DISTINCT ZAR_CATEGORY as value FROM ZCDARCHITECT WHERE ZAR_CATEGORY != '' ORDER BY ZAR_CATEGORY`;
} else if (tag === '学校') {
  query = `SELECT DISTINCT ZAR_SCHOOL as value FROM ZCDARCHITECT WHERE ZAR_SCHOOL != '' ORDER BY ZAR_SCHOOL`;
} else if (tag === '生年') {
  query = `SELECT DISTINCT ZAR_BIRTHYEAR as value FROM ZCDARCHITECT WHERE ZAR_BIRTHYEAR > 0 ORDER BY ZAR_BIRTHYEAR DESC`;
} else if (tag === '没年') {
  query = `SELECT DISTINCT ZAR_DEATHYEAR as value FROM ZCDARCHITECT WHERE ZAR_DEATHYEAR > 0 ORDER BY ZAR_DEATHYEAR DESC`;
}

// ===== FIX 4: Component Property Names (Line 648+) =====
// The component tries to access properties that don't match the Architect interface

// WRONG:
/*
<Grid item xs={12} sm={6} md={4} key={architect.id}>  // Should be ZAR_ID
  <Typography variant="h6" component="div" gutterBottom>
    {architect.name}  // Should be ZAR_NAME
  </Typography>
  <Typography variant="body2" color="text.secondary" gutterBottom>
    {architect.nationality} • {architect.birthYear}-{architect.deathYear}  // Wrong property names
  </Typography>
*/

// CORRECT:
<Grid item xs={12} sm={6} md={4} key={architect.ZAR_ID}>
  <Typography variant="h6" component="div" gutterBottom>
    {architect.ZAR_NAME}
  </Typography>
  <Typography variant="body2" color="text.secondary" gutterBottom>
    {architect.ZAR_NATIONALITY} • {architect.ZAR_BIRTHYEAR || '?'}-{architect.ZAR_DEATHYEAR || '現在'}
  </Typography>
  {/* Tags property doesn't exist in Architect interface - remove or create from category/school */}

// ===== FIX 5: Add Debug Logging =====
// Add these to ArchitectService.ts getAllArchitects function (after line 125):
console.log('🔍 SQL Debug - Count Query:', countQuery);
console.log('🔍 SQL Debug - Count Parameters:', params);
console.log('🔍 SQL Debug - Data Query:', dataQuery);
console.log('🔍 SQL Debug - Data Parameters:', dataParams);

// Add these to catch block (line 142):
console.error('📊 SQL Error Details:', {
  error: error.message,
  countQuery,
  dataQuery,
  params,
  dataParams
});

// ===== FIX 6: Import Statement Fix =====
// In ArchitectsPage.tsx line 38, fix the import:
// WRONG:
// import { ArchitectService, initDatabase, getResultsArray } from '../services/db';

// CORRECT:
import { getAllArchitects, getArchitectById, getArchitectTags } from '../services/db/ArchitectService';
import { getResultsArray } from '../services/db/ClientDatabaseService';

// Then update all calls:
// WRONG: ArchitectService.getAllArchitects(...)
// CORRECT: getAllArchitects(...)

// ===== TESTING QUERIES =====
// Use these simplified queries to test if the database connection works:

const testQueries = {
  // Test 1: Basic connection
  basic: "SELECT 1 as test",
  
  // Test 2: Check table exists
  tableExists: "SELECT name FROM sqlite_master WHERE type='table' AND name='ZCDARCHITECT'",
  
  // Test 3: Count all records
  countAll: "SELECT COUNT(*) as count FROM ZCDARCHITECT",
  
  // Test 4: Get sample data
  sampleData: "SELECT * FROM ZCDARCHITECT LIMIT 3",
  
  // Test 5: Test specific columns
  testColumns: "SELECT ZAR_ID, ZAR_NAME, ZAR_NATIONALITY FROM ZCDARCHITECT LIMIT 1"
};

// Execute these in browser console after importing ClientDatabaseService:
/*
import { executeQuery, resultsToObjects } from './src/services/db/ClientDatabaseService.js';

// Test each query
for (const [name, query] of Object.entries(testQueries)) {
  try {
    const result = await executeQuery(query);
    const data = resultsToObjects(result);
    console.log(`✅ ${name}:`, data);
  } catch (error) {
    console.error(`❌ ${name}:`, error.message);
  }
}
*/

export { testQueries };