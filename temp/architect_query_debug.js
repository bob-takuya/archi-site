/**
 * ArchitectService SQL Query Debug Tool
 * 
 * This tool analyzes and debugs the specific SQL queries used in ArchitectService
 * to identify why they return no results.
 */

// Import necessary functions (simulated for analysis)
const DEBUG_QUERIES = {
  // Query 1: Basic count query used in getAllArchitects
  count_query: `
    SELECT COUNT(DISTINCT ZCDARCHITECT.ZAR_ID) as total
    FROM ZCDARCHITECT
    WHERE 1=1
  `,
  
  // Query 2: Basic data query used in getAllArchitects
  data_query: `
    SELECT DISTINCT ZCDARCHITECT.*
    FROM ZCDARCHITECT
    WHERE 1=1
    ORDER BY ZAR_NAME ASC
    LIMIT 12 OFFSET 0
  `,
  
  // Query 3: getArchitectById query
  by_id_query: `
    SELECT * FROM ZCDARCHITECT WHERE ZAR_ID = ?
  `,
  
  // Query 4: Tag generation query from getArchitectTags
  tags_query: `
    SELECT 
      COALESCE(ZAR_NATIONALITY, '不明') as TAG_NAME,
      COUNT(*) as TAG_COUNT
    FROM ZCDARCHITECT 
    WHERE ZAR_NATIONALITY IS NOT NULL AND ZAR_NATIONALITY != ''
    GROUP BY ZAR_NATIONALITY
    
    UNION ALL
    
    SELECT 
      COALESCE(ZAR_CATEGORY, '不明') as TAG_NAME,
      COUNT(*) as TAG_COUNT
    FROM ZCDARCHITECT 
    WHERE ZAR_CATEGORY IS NOT NULL AND ZAR_CATEGORY != ''
    GROUP BY ZAR_CATEGORY
    
    UNION ALL
    
    SELECT 
      COALESCE(ZAR_SCHOOL, '不明') as TAG_NAME,
      COUNT(*) as TAG_COUNT
    FROM ZCDARCHITECT 
    WHERE ZAR_SCHOOL IS NOT NULL AND ZAR_SCHOOL != ''
    GROUP BY ZAR_SCHOOL
    
    ORDER BY TAG_COUNT DESC, TAG_NAME
    LIMIT 50
  `
};

/**
 * Potential issues identified in the ArchitectService queries
 */
const POTENTIAL_ISSUES = {
  1: {
    title: "Table Name Case Sensitivity",
    description: "SQLite may be case-sensitive depending on configuration. The table name 'ZCDARCHITECT' might not match the actual table name.",
    test_queries: [
      "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%architect%'",
      "SELECT name FROM sqlite_master WHERE type='table' AND LOWER(name) = 'zcdarchitect'"
    ]
  },
  
  2: {
    title: "Column Name Case Sensitivity", 
    description: "Column names like 'ZAR_ID', 'ZAR_NAME' might not match actual column names in the database.",
    test_queries: [
      "PRAGMA table_info(ZCDARCHITECT)",
      "SELECT sql FROM sqlite_master WHERE type='table' AND name='ZCDARCHITECT'"
    ]
  },
  
  3: {
    title: "Empty Table",
    description: "The ZCDARCHITECT table might exist but contain no data.",
    test_queries: [
      "SELECT COUNT(*) FROM ZCDARCHITECT"
    ]
  },
  
  4: {
    title: "Parameter Binding Issues",
    description: "Parameter binding might not be working correctly with the sql.js-httpvfs implementation.",
    test_queries: [
      "SELECT * FROM ZCDARCHITECT LIMIT 1",
      "SELECT ZAR_ID FROM ZCDARCHITECT WHERE ZAR_ID = 1"
    ]
  },
  
  5: {
    title: "DISTINCT and Aggregation Issues",
    description: "The use of DISTINCT with aggregation might be causing issues.",
    test_queries: [
      "SELECT COUNT(*) as total FROM ZCDARCHITECT WHERE 1=1",
      "SELECT COUNT(ZAR_ID) as total FROM ZCDARCHITECT WHERE 1=1"
    ]
  },
  
  6: {
    title: "Database Connection Issues",
    description: "The database might not be properly initialized or connected.",
    test_queries: [
      "SELECT sqlite_version()",
      "SELECT name FROM sqlite_master WHERE type='table'"
    ]
  }
};

/**
 * Simplified queries for testing
 */
const SIMPLIFIED_QUERIES = {
  // Most basic query possible
  basic_select: "SELECT 1 as test",
  
  // Check if table exists
  table_exists: "SELECT name FROM sqlite_master WHERE type='table' AND name='ZCDARCHITECT'",
  
  // Check table structure
  table_structure: "PRAGMA table_info(ZCDARCHITECT)",
  
  // Count rows without any conditions
  simple_count: "SELECT COUNT(*) as count FROM ZCDARCHITECT",
  
  // Get first few rows without any conditions
  simple_select: "SELECT * FROM ZCDARCHITECT LIMIT 3",
  
  // Test specific columns
  test_columns: "SELECT ZAR_ID, ZAR_NAME FROM ZCDARCHITECT LIMIT 1"
};

/**
 * Analysis recommendations
 */
const ANALYSIS_STEPS = [
  {
    step: 1,
    title: "Verify Database Connection",
    action: "Test basic SQL functionality with 'SELECT 1'",
    expected: "Should return a single row with value 1"
  },
  {
    step: 2,
    title: "Check Table Existence",
    action: "Query sqlite_master to list all tables",
    expected: "Should show ZCDARCHITECT in the list"
  },
  {
    step: 3,
    title: "Verify Table Structure",
    action: "Use PRAGMA table_info to check column names and types",
    expected: "Should show columns matching the TypeScript interface"
  },
  {
    step: 4,
    title: "Test Data Existence",
    action: "Simple COUNT(*) without any WHERE conditions",
    expected: "Should return a number > 0 if data exists"
  },
  {
    step: 5,
    title: "Test Basic SELECT",
    action: "SELECT * FROM ZCDARCHITECT LIMIT 3",
    expected: "Should return sample data if table has records"
  },
  {
    step: 6,
    title: "Test Parameter Binding",
    action: "Test queries with ? parameters",
    expected: "Should work with sql.js parameter binding"
  }
];

/**
 * Console output for debugging
 */
console.log('🔍 ArchitectService SQL Query Debug Analysis');
console.log('='.repeat(50));

console.log('\n📋 Original Queries from ArchitectService:');
Object.entries(DEBUG_QUERIES).forEach(([name, query]) => {
  console.log(`\n${name.toUpperCase()}:`);
  console.log(query.trim());
});

console.log('\n🚨 Potential Issues to Investigate:');
Object.entries(POTENTIAL_ISSUES).forEach(([id, issue]) => {
  console.log(`\n${id}. ${issue.title}`);
  console.log(`   ${issue.description}`);
  console.log(`   Test queries:`);
  issue.test_queries.forEach(query => {
    console.log(`   - ${query}`);
  });
});

console.log('\n🧪 Simplified Test Queries:');
Object.entries(SIMPLIFIED_QUERIES).forEach(([name, query]) => {
  console.log(`\n${name}: ${query}`);
});

console.log('\n📝 Recommended Analysis Steps:');
ANALYSIS_STEPS.forEach(step => {
  console.log(`\n${step.step}. ${step.title}`);
  console.log(`   Action: ${step.action}`);
  console.log(`   Expected: ${step.expected}`);
});

console.log('\n💡 Common SQL.js Issues to Check:');
console.log('- Parameter binding: Use ? instead of $1, $2');
console.log('- Case sensitivity: Check if table/column names match exactly');
console.log('- Database initialization: Ensure database is loaded before queries');
console.log('- Result processing: Check if resultsToObjects() is working correctly');
console.log('- Worker vs direct mode: Different APIs for sql.js-httpvfs vs sql.js');

export { 
  DEBUG_QUERIES, 
  POTENTIAL_ISSUES, 
  SIMPLIFIED_QUERIES, 
  ANALYSIS_STEPS 
};