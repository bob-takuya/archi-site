# Archi-Site Cleanup Summary

## 🎯 Objective
Remove all naming convention violations (files with "enhanced", "updated", etc.) while preserving functionality.

## 📋 What Will Be Done

### Files to Rename (4 total)
1. **Components** (2 files):
   - `EnhancedSearchInterface.tsx` → `SearchInterface.tsx`
   - `EnhancedInteractiveMap.tsx` → `InteractiveMap.tsx`

2. **Pages & Services** (2 files):
   - `ArchitecturePageEnhanced.tsx` → `ArchitecturePage.tsx` (replacing old version)
   - `CacheServiceEnhanced.ts` → `CacheService.ts` (replacing old version)

### Files to Remove (2 total)
- `src/pages/ArchitecturePage.tsx` (old version)
- `src/services/CacheService.ts` (old version)

### Files to Update (5 imports)
- `src/App.tsx` - Update ArchitecturePage import
- `src/pages/AnalyticsPage.tsx` - Update InteractiveMap import
- `src/services/PerformanceOptimizer.ts` - Update CacheService import
- `src/services/ProgressiveDbLoader.ts` - Update CacheService import
- All renamed files - Update internal component/class names

### Public Files (2 files)
- `public/sw-enhanced.js` → `public/sw.js`
- `public/_headers_enhanced` → `public/_headers`

## ✅ What Will Be Preserved
- ✅ Research page functionality (untouched)
- ✅ All application features
- ✅ Enhanced functionality from "Enhanced" versions
- ✅ Full backup before any changes

## 🚀 How to Execute

### Option 1: Automated Script
```bash
cd /Users/homeserver/ai-creative-team/archi-site
./cleanup-naming-violations.sh
```

### Option 2: Manual Commands
Follow the commands in `MANUAL_CLEANUP_COMMANDS.md`

## 🔄 Rollback Plan
If anything goes wrong:
```bash
cd /Users/homeserver/ai-creative-team
rm -rf archi-site
tar -xzf archi-site-backup-[timestamp].tar.gz
```

## 📊 Expected Result
- No more "enhanced", "updated", etc. in filenames
- All functionality preserved
- Clean, CLAUDE.md-compliant codebase
- Research page continues to work normally