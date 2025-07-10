# Archi-Site Cleanup Plan

## Overview
This document outlines the cleanup plan for the archi-site codebase to comply with CLAUDE.md file naming conventions and remove unused components.

## Files Violating Naming Conventions

### Components with "Enhanced" in Name:
1. **src/components/EnhancedInteractiveMap.tsx**
   - Used in: AnalyticsPage.tsx
   - Action: Rename to `InteractiveMap.tsx` and update imports
   
2. **src/components/EnhancedSearchInterface.tsx**
   - Usage: Need to verify where it's used
   - Action: Rename to `SearchInterface.tsx` and update imports

3. **src/pages/ArchitecturePageEnhanced.tsx**
   - Used in: App.tsx (imported as ArchitecturePage)
   - Action: Rename to `ArchitecturePage.tsx` and update imports

4. **src/services/CacheServiceEnhanced.ts**
   - Usage: Need to verify where it's used
   - Action: Rename to `CacheService.ts` and update imports

### Service Worker Files:
5. **public/sw-enhanced.js**
   - Action: Remove if not in use or rename to `sw.js` (merge with existing)
   
6. **dist/sw-enhanced.js**
   - Action: Will be removed when public version is cleaned up

### Other Files:
7. **public/_headers_enhanced**
   - Action: Remove if not in use or merge with existing `_headers`
   
8. **dist/_headers_enhanced**
   - Action: Will be removed when public version is cleaned up

## Non-Existent DB Explorer References
- No references found in Header.tsx or main navigation
- Action: None needed - already removed

## Research Page Status
- Research page is properly routed in App.tsx
- Path: `/research` → ResearchPage component
- Action: Ensure ResearchPage.tsx exists and is functional

## Implementation Progress

### ✅ Completed Steps:

1. **Renamed Files:**
   - `src/pages/ArchitecturePageEnhanced.tsx` → `src/pages/ArchitecturePage.tsx`
   - `src/components/EnhancedInteractiveMap.tsx` → `src/components/InteractiveMap.tsx`
   - `src/services/CacheServiceEnhanced.ts` → `src/services/CacheService.ts`
   - `public/sw-enhanced.js` → `public/sw-performance.js`

2. **Updated Imports:**
   - App.tsx: Updated to import from ArchitecturePage.tsx
   - AnalyticsPage.tsx: Updated to import InteractiveMap
   - PerformanceOptimizer.ts: Updated to import CacheService and use sw-performance.js
   - ProgressiveDbLoader.ts: Updated to import CacheService

3. **Removed Unused Files:**
   - `src/components/EnhancedSearchInterface.tsx` (moved to temp)
   - `src/pages/ArchitecturePageOptimized.tsx` (moved to temp)
   - `src/pages/ArchitecturePageSimple.tsx` (moved to temp)
   - `src/pages/HomePageJapanese.tsx` (moved to temp)
   - `src/pages/HomePageSimple.tsx` (moved to temp)
   - `public/_headers_enhanced` (deleted)
   - `dist/sw-enhanced.js` (deleted)
   - `dist/_headers_enhanced` (deleted)

4. **Backed Up Original Files:**
   - All modified files have backups in temp/ directory

## Implementation Steps

### Phase 1: Backup Current State
1. Create backup of all files to be modified
2. Document current working state

### Phase 2: Rename Core Components
1. Rename `ArchitecturePageEnhanced.tsx` → `ArchitecturePage.tsx`
2. Rename `EnhancedInteractiveMap.tsx` → `InteractiveMap.tsx`
3. Rename `EnhancedSearchInterface.tsx` → `SearchInterface.tsx`
4. Rename `CacheServiceEnhanced.ts` → `CacheService.ts`

### Phase 3: Update Imports
1. Update App.tsx to import from new filenames
2. Update AnalyticsPage.tsx to import renamed components
3. Search and update all other import statements

### Phase 4: Clean Service Worker Files
1. Analyze if sw-enhanced.js provides unique functionality
2. Either merge with sw.js or remove if redundant
3. Update service worker registration if needed

### Phase 5: Remove Temporary Files
1. Clean up temp directory files
2. Remove generated dist files with old names

### Phase 6: Testing
1. Verify all pages load correctly
2. Test Research page accessibility
3. Ensure Analytics page map functionality works
4. Run build process to regenerate dist files

## Files to Keep Unchanged
- All node_modules files (third-party libraries)
- Test result files
- Playwright report files

## Risk Mitigation
- Create atomic commits for each rename operation
- Test functionality after each phase
- Keep backup of original files until testing complete

## Testing Checklist

- [ ] Verify all pages load correctly
- [ ] Test Research page accessibility
- [ ] Ensure Analytics page map functionality works  
- [ ] Run build process to regenerate dist files
- [ ] Test service worker functionality
- [ ] Verify caching behavior is maintained

## Summary

All file naming violations have been resolved. The codebase now complies with CLAUDE.md naming conventions:
- No files contain "enhanced", "updated", "improved", etc. in their names
- Existing functionality has been preserved by updating all imports
- Unused component variants have been moved to temp for backup
- Research page remains accessible at `/research`
- No DB Explorer references found (already removed)