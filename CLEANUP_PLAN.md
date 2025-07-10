# Archi-Site Cleanup Plan

## Overview
This plan safely removes naming convention violations while preserving all functionality.

## Files to Rename

### Source Files
1. `src/components/EnhancedSearchInterface.tsx` → `src/components/SearchInterface.tsx`
   - Status: Simple rename (no existing file)
   
2. `src/components/EnhancedInteractiveMap.tsx` → `src/components/InteractiveMap.tsx`
   - Status: Simple rename (no existing file)
   
3. `src/pages/ArchitecturePageEnhanced.tsx` → Keep as is (see note)
   - Status: Enhanced version is actively used, original will be removed
   
4. `src/services/CacheServiceEnhanced.ts` → Keep as is (see note)
   - Status: Enhanced version has more features, original will be removed

### Public Files
5. `public/sw-enhanced.js` → `public/sw.js`
   - Status: Check if sw.js exists first
   
6. `public/_headers_enhanced` → `public/_headers`
   - Status: Check if _headers exists first

## Files to Update (imports)
- `src/App.tsx` - Update import from ArchitecturePageEnhanced
- `src/pages/AnalyticsPage.tsx` - Update import from EnhancedInteractiveMap
- `src/services/PerformanceOptimizer.ts` - Update import from CacheServiceEnhanced
- `src/services/ProgressiveDbLoader.ts` - Update import from CacheServiceEnhanced

## Files to Remove
- `src/pages/ArchitecturePage.tsx` - Old version replaced by Enhanced
- `src/services/CacheService.ts` - Old version replaced by Enhanced

## Cleanup Commands

```bash
# Step 1: Create backup
cd /Users/homeserver/ai-creative-team/archi-site
tar -czf ../archi-site-backup-$(date +%Y%m%d-%H%M%S).tar.gz .

# Step 2: Rename component files
mv src/components/EnhancedSearchInterface.tsx src/components/SearchInterface.tsx
mv src/components/EnhancedInteractiveMap.tsx src/components/InteractiveMap.tsx

# Step 3: Remove old duplicates
rm -f src/pages/ArchitecturePage.tsx
rm -f src/services/CacheService.ts

# Step 4: Rename the kept "Enhanced" files
mv src/pages/ArchitecturePageEnhanced.tsx src/pages/ArchitecturePage.tsx
mv src/services/CacheServiceEnhanced.ts src/services/CacheService.ts

# Step 5: Update imports
sed -i '' 's/EnhancedSearchInterface/SearchInterface/g' src/components/SearchInterface.tsx
sed -i '' 's/EnhancedInteractiveMap/InteractiveMap/g' src/components/InteractiveMap.tsx
sed -i '' "s/from '\.\.\/components\/EnhancedInteractiveMap'/from '..\/components\/InteractiveMap'/g" src/pages/AnalyticsPage.tsx
sed -i '' "s/from '\.\/pages\/ArchitecturePageEnhanced'/from '.\/pages\/ArchitecturePage'/g" src/App.tsx
sed -i '' "s/from '\.\/CacheServiceEnhanced'/from '.\/CacheService'/g" src/services/PerformanceOptimizer.ts src/services/ProgressiveDbLoader.ts
sed -i '' 's/const ArchitecturePageEnhanced/const ArchitecturePage/g' src/pages/ArchitecturePage.tsx
sed -i '' 's/export default ArchitecturePageEnhanced/export default ArchitecturePage/g' src/pages/ArchitecturePage.tsx

# Step 6: Handle public files
if [ -f public/sw.js ]; then
  echo "Warning: public/sw.js exists. Backing up enhanced version"
  mv public/sw-enhanced.js public/sw-enhanced.backup.js
else
  mv public/sw-enhanced.js public/sw.js
fi

if [ -f public/_headers ]; then
  echo "Warning: public/_headers exists. Backing up enhanced version"
  mv public/_headers_enhanced public/_headers_enhanced.backup
else
  mv public/_headers_enhanced public/_headers
fi

# Step 7: Clean dist directory
rm -f dist/sw-enhanced.js
rm -f dist/_headers_enhanced

# Step 8: Verify no remaining violations
echo "Checking for remaining violations..."
find src -name "*[Ee]nhanced*" -o -name "*[Uu]pdated*" | grep -v node_modules

# Step 9: Test build
npm run build

# Step 10: Run tests if available
if [ -f package.json ] && grep -q "\"test\"" package.json; then
  npm test
fi
```

## Verification Steps

1. Check that all imports resolve correctly
2. Verify the Research page loads properly
3. Test the Architecture page functionality
4. Ensure analytics page map visualization works
5. Verify caching functionality remains intact

## Rollback Plan

If issues arise, restore from backup:
```bash
cd /Users/homeserver/ai-creative-team
rm -rf archi-site
tar -xzf archi-site-backup-[timestamp].tar.gz
mv archi-site-backup archi-site
```