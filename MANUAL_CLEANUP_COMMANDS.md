# Manual Cleanup Commands for Archi-Site

Execute these commands step-by-step to safely clean up naming violations:

## 1. Create Backup First
```bash
cd /Users/homeserver/ai-creative-team/archi-site
tar -czf ../archi-site-backup-$(date +%Y%m%d-%H%M%S).tar.gz . --exclude='node_modules' --exclude='dist' --exclude='.git'
```

## 2. Rename Component Files
```bash
# Rename search interface
mv src/components/EnhancedSearchInterface.tsx src/components/SearchInterface.tsx

# Rename interactive map
mv src/components/EnhancedInteractiveMap.tsx src/components/InteractiveMap.tsx
```

## 3. Remove Old Duplicate Files
```bash
# Remove old architecture page (keeping Enhanced version)
rm -f src/pages/ArchitecturePage.tsx

# Remove old cache service (keeping Enhanced version)
rm -f src/services/CacheService.ts
```

## 4. Rename Enhanced Files to Standard Names
```bash
# Rename architecture page
mv src/pages/ArchitecturePageEnhanced.tsx src/pages/ArchitecturePage.tsx

# Rename cache service
mv src/services/CacheServiceEnhanced.ts src/services/CacheService.ts
```

## 5. Update Component Internal Names
```bash
# Fix SearchInterface internal references
sed -i '' 's/EnhancedSearchInterface/SearchInterface/g' src/components/SearchInterface.tsx

# Fix InteractiveMap internal references
sed -i '' 's/EnhancedInteractiveMap/InteractiveMap/g' src/components/InteractiveMap.tsx

# Fix ArchitecturePage internal references
sed -i '' 's/const ArchitecturePageEnhanced/const ArchitecturePage/g' src/pages/ArchitecturePage.tsx
sed -i '' 's/export default ArchitecturePageEnhanced/export default ArchitecturePage/g' src/pages/ArchitecturePage.tsx

# Fix CacheService internal references (if needed)
sed -i '' 's/class EnhancedCacheService/class CacheService/g' src/services/CacheService.ts
sed -i '' 's/export default EnhancedCacheService/export default CacheService/g' src/services/CacheService.ts
```

## 6. Update Import Statements
```bash
# Update App.tsx
sed -i '' "s/from '\.\/pages\/ArchitecturePageEnhanced'/from '.\/pages\/ArchitecturePage'/g" src/App.tsx

# Update AnalyticsPage.tsx
sed -i '' "s/from '\.\.\/components\/EnhancedInteractiveMap'/from '..\/components\/InteractiveMap'/g" src/pages/AnalyticsPage.tsx
sed -i '' 's/EnhancedInteractiveMap/InteractiveMap/g' src/pages/AnalyticsPage.tsx

# Update PerformanceOptimizer.ts
sed -i '' "s/from '\.\/CacheServiceEnhanced'/from '.\/CacheService'/g" src/services/PerformanceOptimizer.ts
sed -i '' 's/EnhancedCacheService/CacheService/g' src/services/PerformanceOptimizer.ts

# Update ProgressiveDbLoader.ts
sed -i '' "s/from '\.\/CacheServiceEnhanced'/from '.\/CacheService'/g" src/services/ProgressiveDbLoader.ts
sed -i '' 's/EnhancedCacheService/CacheService/g' src/services/ProgressiveDbLoader.ts
```

## 7. Handle Public Files
```bash
# Rename service worker (check if sw.js exists first)
if [ -f public/sw.js ]; then
  mv public/sw-enhanced.js public/sw-enhanced.backup.js
else
  mv public/sw-enhanced.js public/sw.js
fi

# Rename headers file (check if _headers exists first)
if [ -f public/_headers ]; then
  mv public/_headers_enhanced public/_headers_enhanced.backup
else
  mv public/_headers_enhanced public/_headers
fi
```

## 8. Clean Dist Directory
```bash
rm -f dist/sw-enhanced.js
rm -f dist/_headers_enhanced
```

## 9. Verify No Violations Remain
```bash
find src public -name "*[Ee]nhanced*" -o -name "*[Uu]pdated*" | grep -v node_modules | grep -v dist
```

## 10. Test Build
```bash
npm run build
```

## Rollback Commands (if needed)
```bash
cd /Users/homeserver/ai-creative-team
rm -rf archi-site
tar -xzf archi-site-backup-[YOUR-TIMESTAMP].tar.gz
```