# ArchitectService SQL Query Debug Report

## Executive Summary

After analyzing the ArchitectService.ts and related components, I've identified several critical issues that could cause SQL queries to return no results. The problems range from table/column name mismatches to API inconsistencies and parameter binding issues.

## Critical Issues Identified

### 1. **Column Name Mismatch (HIGH PRIORITY)**

**Problem**: The ArchitectsPage.tsx component uses inconsistent column names compared to the ArchitectService.

**Evidence**:
- **ArchitectService.ts** (lines 185-193) uses column names like: `ZAT_NATIONALITY`, `ZAT_CATEGORY`, `ZAT_SCHOOL`, `ZAT_BIRTHYEAR`, `ZAT_DEATHYEAR`
- **ArchitectService.ts** main queries use: `ZAR_ID`, `ZAR_NAME`, `ZAR_KANA`, `ZAR_NAMEENG`, `ZAR_NATIONALITY`, etc.

**Issue**: Mixed column naming conventions suggest either:
1. Copy-paste errors in the ArchitectsPage.tsx component
2. Database schema inconsistencies
3. Wrong table being queried

### 2. **API Signature Mismatch (HIGH PRIORITY)**

**Problem**: The component is calling the service with parameters that don't match the expected signature.

**ArchitectsPage.tsx line 151-164**:
```typescript
const result = await ArchitectService.getAllArchitects(
  page,
  10, // itemsPerPage
  search,
  tags,
  sort,
  order,
  nat,    // nationality as 7th parameter
  cat,    // category as 8th parameter
  sch,    // school as 9th parameter
  birthFrom ? parseInt(birthFrom) : 0,
  birthTo ? parseInt(birthTo) : 0,
  death ? parseInt(death) : 0
);
```

**ArchitectService.ts signature (lines 32-46)**:
```typescript
export const getAllArchitects = async (
  page: number = 1,
  limit: number = 12,
  searchTerm: string = '',
  tags: string[] = [],
  sortBy: string = 'ZAR_NAME',
  sortOrder: string = 'asc',
  options: {           // 7th parameter is an object!
    nationality?: string;
    category?: string;
    school?: string;
    birthYearFrom?: number;
    birthYearTo?: number;
    deathYear?: number;
  } = {}
)
```

**Fix Required**: The component passes individual parameters, but the service expects an options object.

### 3. **Database Schema Issues (HIGH PRIORITY)**

**Problems**:
1. **Table Existence**: Need to verify `ZCDARCHITECT` table actually exists with correct case
2. **Column Names**: Mixed `ZAR_*` vs `ZAT_*` naming suggests schema confusion
3. **Data Presence**: Table might exist but be empty

### 4. **Parameter Binding Issues (MEDIUM PRIORITY)**

**Problem**: The service uses `?` parameter binding, but sql.js-httpvfs might have different requirements.

**Evidence**: Lines 357-358 in ClientDatabaseService.ts show different execution paths for worker vs direct database.

### 5. **SQL Query Logic Issues (MEDIUM PRIORITY)**

**Issues in getAllArchitects query construction**:
- Line 51: `WHERE 1=1` is correct but subsequent conditions might fail
- Line 95: Tag filtering is commented out due to missing tables
- Lines 106-121: Complex query with potential JOIN issues

## Specific Debugging Steps

### Step 1: Verify Database Schema
```sql
-- Check if table exists (case-sensitive)
SELECT name FROM sqlite_master WHERE type='table' AND name='ZCDARCHITECT';

-- Check actual column names
PRAGMA table_info(ZCDARCHITECT);

-- Verify data exists
SELECT COUNT(*) FROM ZCDARCHITECT;
```

### Step 2: Test Simplified Queries
```sql
-- Most basic query
SELECT * FROM ZCDARCHITECT LIMIT 3;

-- Test specific columns
SELECT ZAR_ID, ZAR_NAME FROM ZCDARCHITECT LIMIT 1;

-- Test the exact count query from getAllArchitects
SELECT COUNT(DISTINCT ZAR_ID) as total FROM ZCDARCHITECT WHERE 1=1;
```

### Step 3: Fix API Signature Mismatch

**In ArchitectsPage.tsx, replace lines 151-164 with**:
```typescript
const result = await ArchitectService.getAllArchitects(
  page,
  10, // itemsPerPage
  search,
  tags,
  sort,
  order,
  {  // Pass as options object
    nationality: nat,
    category: cat,
    school: sch,
    birthYearFrom: birthFrom ? parseInt(birthFrom) : undefined,
    birthYearTo: birthTo ? parseInt(birthTo) : undefined,
    deathYear: death ? parseInt(death) : undefined
  }
);
```

### Step 4: Fix Component Response Handling

**Problem**: Component expects different response format.
- Line 167: `result.items` but service returns `results`
- Line 168: `result.totalPages` but service returns `totalPages`

**Fix in ArchitectsPage.tsx lines 167-169**:
```typescript
setArchitects(result.results);  // Changed from result.items
setTotalPages(result.totalPages);
setTotalItems(result.total);
```

### Step 5: Fix Column Names in ArchitectsPage.tsx

**Replace lines 185-193 in ArchitectsPage.tsx**:
```typescript
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
```

## Testing Tools Created

1. **`/temp/test_architect_queries.html`**: Interactive browser-based debugging tool
2. **`/temp/architect_query_debug.js`**: Detailed analysis of potential issues
3. **`/temp/sql_analysis_test.js`**: Systematic query testing script

## Recommended Fix Priority

1. **IMMEDIATE**: Fix API signature mismatch in ArchitectsPage.tsx
2. **IMMEDIATE**: Fix response property names (items vs results)
3. **HIGH**: Fix column names (ZAT_* to ZAR_*)
4. **MEDIUM**: Verify database schema and data existence
5. **LOW**: Add better error handling and logging

## Console Testing Commands

To test the fixes, add these debug statements:

```typescript
// In ArchitectsPage.tsx, after line 150
console.log("🔍 Calling getAllArchitects with params:", {
  page, limit: 10, search, tags, sort, order, options: { nat, cat, sch, birthFrom, birthTo, death }
});

// In ArchitectService.ts, at the start of getAllArchitects
console.log("📊 getAllArchitects called with:", { page, limit, searchTerm, tags, sortBy, sortOrder, options });

// After the database queries
console.log("📈 Count query result:", countData);
console.log("📋 Data query result:", data);
```

## Root Cause Analysis

The primary issue is **API signature mismatch** - the component is calling the service incorrectly, which would cause parameter binding to fail and result in empty responses. Secondary issues include column name inconsistencies and potential database schema problems.

The good news is that most of these are code-level issues that can be fixed without database changes.