# Data Mapping Verification - Critical Fixes Implementation Guide

## 🚨 URGENT: Complete Data Display Failure Detected

**Primary Issue**: Field name prefix mismatch (ZAT_ vs ZAR_) and service interface mismatches are causing the ArchitectsPage to display no data despite having valid database content.

## Critical Issues Found

### 1. **CRITICAL**: Field Name Prefix Mismatch 
- **Problem**: ArchitectsPage uses `ZAT_` prefix but database and TypeScript interface use `ZAR_` prefix
- **Impact**: Database queries return wrong columns or fail entirely
- **Location**: ArchitectsPage.tsx lines 185-193

### 2. **CRITICAL**: Service Method Interface Mismatch
- **Problem**: ArchitectsPage calls `getAllArchitects` with wrong parameter structure
- **Impact**: Function calls fail with TypeScript errors
- **Location**: ArchitectsPage.tsx line 151

### 3. **HIGH**: Response Structure Mismatch
- **Problem**: ArchitectsPage expects `result.items` but service returns `result.results`
- **Impact**: UI shows empty list even with valid data
- **Location**: ArchitectsPage.tsx line 167

### 4. **HIGH**: UI Component Field Access Issues
- **Problem**: UI components access camelCase fields but database returns ZAR_ prefixed fields
- **Impact**: Display shows undefined values for all architect properties
- **Location**: ArchitectsPage.tsx lines 648, 663, 666, 669

## Immediate Fixes Required

### Fix #1: Correct Field Name Prefixes (Lines 185-193)

**CURRENT (WRONG):**
```typescript
if (tag === '国籍') {
  query = `SELECT DISTINCT ZAT_NATIONALITY as value FROM ZCDARCHITECT WHERE ZAT_NATIONALITY != '' ORDER BY ZAT_NATIONALITY`;
} else if (tag === 'カテゴリー') {
  query = `SELECT DISTINCT ZAT_CATEGORY as value FROM ZCDARCHITECT WHERE ZAT_CATEGORY != '' ORDER BY ZAT_CATEGORY`;
} else if (tag === '学校') {
  query = `SELECT DISTINCT ZAT_SCHOOL as value FROM ZCDARCHITECT WHERE ZAT_SCHOOL != '' ORDER BY ZAT_SCHOOL`;
} else if (tag === '生年') {
  query = `SELECT DISTINCT ZAT_BIRTHYEAR as value FROM ZCDARCHITECT WHERE ZAT_BIRTHYEAR > 0 ORDER BY ZAT_BIRTHYEAR DESC`;
} else if (tag === '没年') {
  query = `SELECT DISTINCT ZAT_DEATHYEAR as value FROM ZCDARCHITECT WHERE ZAT_DEATHYEAR > 0 ORDER BY ZAT_DEATHYEAR DESC`;
}
```

**CORRECTED:**
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

### Fix #2: Correct Service Method Call (Line 151)

**CURRENT (WRONG):**
```typescript
const result = await ArchitectService.getAllArchitects(
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
);
```

**CORRECTED:**
```typescript
const result = await ArchitectService.getAllArchitects(
  page,
  10, // limit
  search, // searchTerm
  tags,
  sort, // sortBy
  order, // sortOrder
  { // options object
    nationality: nat,
    category: cat,
    school: sch,
    birthYearFrom: birthFrom ? parseInt(birthFrom) : undefined,
    birthYearTo: birthTo ? parseInt(birthTo) : undefined,
    deathYear: death ? parseInt(death) : undefined
  }
);
```

### Fix #3: Correct Response Property Access (Line 167)

**CURRENT (WRONG):**
```typescript
setArchitects(result.items);
```

**CORRECTED:**
```typescript
setArchitects(result.results);
```

### Fix #4: UI Component Field Access (Lines 648, 663, 666, 669)

**CURRENT (WRONG):**
```typescript
<Grid item xs={12} sm={6} md={4} key={architect.id}>
  <Card>
    <CardActionArea component={RouterLink} to={`/architects/${architect.id}`}>
      <CardContent>
        <Typography variant="h6" component="div" gutterBottom>
          {architect.name}
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {architect.nationality} • {architect.birthYear || '?'}-{architect.deathYear || '現在'}
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
          {architect.tags && architect.tags.map((tag) => (
            <Chip key={tag} label={tag} size="small" variant="outlined" />
          ))}
        </Box>
      </CardContent>
    </CardActionArea>
  </Card>
</Grid>
```

**CORRECTED (Option 1 - Direct ZAR_ Access):**
```typescript
<Grid item xs={12} sm={6} md={4} key={architect.ZAR_ID}>
  <Card>
    <CardActionArea component={RouterLink} to={`/architects/${architect.ZAR_ID}`}>
      <CardContent>
        <Typography variant="h6" component="div" gutterBottom>
          {architect.ZAR_NAME}
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {architect.ZAR_NATIONALITY} • {architect.ZAR_BIRTHYEAR || '?'}-{architect.ZAR_DEATHYEAR || '現在'}
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
          {architect.ZAR_CATEGORY && (
            <Chip label={architect.ZAR_CATEGORY} size="small" variant="outlined" />
          )}
          {architect.ZAR_SCHOOL && (
            <Chip label={architect.ZAR_SCHOOL} size="small" variant="outlined" />
          )}
        </Box>
      </CardContent>
    </CardActionArea>
  </Card>
</Grid>
```

## Optional Enhancement: Data Mapping Layer

For better maintainability, create a mapping layer:

### Create `src/utils/architectMapper.ts`:
```typescript
import { Architect } from '../types/architect';

export interface MappedArchitect {
  id: number;
  name: string;
  kana?: string;
  nameEng?: string;
  birthYear?: number;
  deathYear?: number;
  birthPlace?: string;
  nationality?: string;
  category?: string;
  school?: string;
  office?: string;
  bio?: string;
  mainWorks?: string;
  awards?: string;
  image?: string;
  created?: string;
  modified?: string;
}

export function mapArchitectFromDatabase(dbArchitect: Architect): MappedArchitect {
  return {
    id: dbArchitect.ZAR_ID,
    name: dbArchitect.ZAR_NAME,
    kana: dbArchitect.ZAR_KANA,
    nameEng: dbArchitect.ZAR_NAMEENG,
    birthYear: dbArchitect.ZAR_BIRTHYEAR,
    deathYear: dbArchitect.ZAR_DEATHYEAR,
    birthPlace: dbArchitect.ZAR_BIRTHPLACE,
    nationality: dbArchitect.ZAR_NATIONALITY,
    category: dbArchitect.ZAR_CATEGORY,
    school: dbArchitect.ZAR_SCHOOL,
    office: dbArchitect.ZAR_OFFICE,
    bio: dbArchitect.ZAR_BIO,
    mainWorks: dbArchitect.ZAR_MAINWORKS,
    awards: dbArchitect.ZAR_AWARDS,
    image: dbArchitect.ZAR_IMAGE,
    created: dbArchitect.ZAR_CREATED,
    modified: dbArchitect.ZAR_MODIFIED
  };
}

export function mapArchitectsFromDatabase(dbArchitects: Architect[]): MappedArchitect[] {
  return dbArchitects.map(mapArchitectFromDatabase);
}
```

### Then update ArchitectsPage to use mapping:
```typescript
import { mapArchitectsFromDatabase } from '../utils/architectMapper';

// In the loadArchitects function:
const result = await ArchitectService.getAllArchitects(/* corrected parameters */);
const mappedArchitects = mapArchitectsFromDatabase(result.results);
setArchitects(mappedArchitects);
```

## Summary

**Immediate Action Required**: 
1. Fix ZAT_ → ZAR_ field prefixes (5 locations)
2. Fix service method call signature (1 location) 
3. Fix response property access (1 location)
4. Fix UI field access patterns (4+ locations)

**Estimated Fix Time**: 2-4 hours
**User Impact**: Complete restoration of architect data display
**Testing Required**: Verify architect list loads and displays correctly

These fixes will resolve the complete data display failure and restore full functionality to the ArchitectsPage.