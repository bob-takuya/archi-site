# Exact Code Changes for Architects Tab Fix

## File: src/pages/ArchitectsPage.tsx

### Change 1: Line 167 - Fix result property access
```diff
- setArchitects(result.items);
+ setArchitects(result.results);
```

### Change 2: Lines 151-164 - Fix service call parameters
Replace the entire service call block:

**BEFORE:**
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

**AFTER:**
```typescript
const result = await ArchitectService.getAllArchitects(
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
);
```

### Change 3: Lines 662-667 - Fix field name access
**BEFORE:**
```typescript
<Typography variant="h6" component="div" gutterBottom>
  {architect.name}
</Typography>
<Typography variant="body2" color="text.secondary" gutterBottom>
  {architect.nationality} • {architect.birthYear || '?'}-{architect.deathYear || '現在'}
</Typography>
```

**AFTER:**
```typescript
<Typography variant="h6" component="div" gutterBottom>
  {architect.ZAR_NAME}
</Typography>
<Typography variant="body2" color="text.secondary" gutterBottom>
  {architect.ZAR_NATIONALITY} • {architect.ZAR_BIRTHYEAR || '?'}-{architect.ZAR_DEATHYEAR || '現在'}
</Typography>
```

### Change 4: Lines 669-677 - Remove or fix tags section
**BEFORE:**
```typescript
<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
  {architect.tags && architect.tags.map((tag) => (
    <Chip
      key={tag}
      label={tag}
      size="small"
      variant="outlined"
      sx={{ pointerEvents: 'none' }}
    />
  ))}
</Box>
```

**AFTER (temporary fix - remove tags display):**
```typescript
{/* TODO: Implement proper tag fetching and display */}
```

## Optional: Add Debug Logging

Add after line 167 for debugging:
```typescript
console.log('🔍 Debug - Received result:', result);
console.log('🔍 Debug - Architects array:', result.results);
console.log('🔍 Debug - First architect:', result.results?.[0]);
```

## File Locations
- **Main file**: `/Users/homeserver/ai-creative-team/archi-site/src/pages/ArchitectsPage.tsx`
- **Backup recommended**: Create backup before changes

## Verification Steps
1. Save file after changes
2. Restart development server if needed
3. Open browser developer console
4. Navigate to architects tab
5. Verify no JavaScript errors
6. Check that architect cards display with correct names and info
7. Test search functionality

## Expected Result
- Architects tab loads successfully
- Architect cards display with correct Japanese names
- Nationality and birth/death years show correctly
- Search and filtering work properly
- No JavaScript errors in console