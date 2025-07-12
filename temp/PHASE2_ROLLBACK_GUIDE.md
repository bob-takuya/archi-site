# SOW Phase 2 Rollback Guide

This guide provides step-by-step instructions to rollback the Phase 2 enhancements and restore the original ArchitectsPage functionality.

## Overview

Phase 2 introduced the following enhancements:
- TouchOptimizedSearchBar integration (already included in FacetedSearch)
- Virtual scrolling for large datasets
- Progressive image loading with blur placeholders
- Performance monitoring and caching
- Enhanced mobile optimizations

## Modified Files

The following files were modified or created during Phase 2 implementation:

### Modified Files:
1. `/src/App.tsx` - Added route for EnhancedArchitectsPage

### Files That Remain Unchanged:
1. `/src/pages/ArchitectsPage.tsx` - Original page remains untouched for backward compatibility

### New Files Created:
1. `/src/pages/EnhancedArchitectsPage.tsx` - New enhanced architects page
2. `/temp/EnhancedProgressiveImage.tsx` - Progressive image component
3. `/tests/e2e/phase2-integration.spec.ts` - E2E test suite

## Rollback Steps

### Step 1: Revert App.tsx

```bash
# Revert routing changes
git checkout -- src/App.tsx
```

### Step 2: Remove New Files

```bash
# Remove the enhanced architects page
rm src/pages/EnhancedArchitectsPage.tsx

# Remove the E2E test suite
rm tests/e2e/phase2-integration.spec.ts

# Remove temporary progressive image component
rm temp/EnhancedProgressiveImage.tsx
```

### Step 3: Alternative - Manual Reversion

If git checkout is not available or you need manual reversion:

#### Revert App.tsx changes
Remove these lines:
```typescript
// Lazy load the enhanced architects page for better performance
const EnhancedArchitectsPage = lazy(() => import('./pages/EnhancedArchitectsPage'));
```

And remove this route:
```typescript
<Route path="/architects/enhanced" element={<EnhancedArchitectsPage />} />
```

### Step 4: Clear Build Cache

```bash
# Clear build artifacts
rm -rf dist/
rm -rf node_modules/.vite/

# Reinstall dependencies if needed
npm install

# Rebuild the application
npm run build
```

### Step 5: Verify Rollback

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:5173/#/architects`

3. Verify:
   - Original ArchitectsPage is displayed
   - FacetedSearch is working as before
   - No Phase 2 enhancements are visible
   - No console errors

## Git Commands for Complete Rollback

If you committed the Phase 2 changes, use these commands:

```bash
# View commit history
git log --oneline

# Find the commit hash before Phase 2 changes
# Then revert to that commit
git revert <commit-hash>

# Or create a new branch from before Phase 2
git checkout -b rollback-phase2 <commit-hash-before-phase2>
```

## Partial Rollback Options

If you want to keep some Phase 2 features but rollback others:

### Keep TouchOptimizedSearchBar
- This is already integrated in FacetedSearch, no changes needed

### Keep Virtual Scrolling
- Keep the VirtualizedArchitectsList import
- Only use it for large datasets (>100 items)

### Keep Progressive Images
- Copy EnhancedProgressiveImage.tsx to src/components/
- Update import paths accordingly

### Keep Performance Monitoring
- Keep PerformanceMonitor and CacheService imports
- Configure to only show in development mode

## Testing After Rollback

Run the existing test suite to ensure functionality:

```bash
# Run unit tests
npm test

# Run E2E tests (excluding phase2-integration.spec.ts)
npm run test:e2e -- --grep -v "Phase 2"
```

## Troubleshooting

### Issue: Import errors after rollback
**Solution**: Clear node_modules and reinstall
```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue: Build errors
**Solution**: Clear all caches
```bash
npm run clean
npm cache clean --force
npm install
npm run build
```

### Issue: Browser cache showing old version
**Solution**: Hard refresh
- Chrome/Edge: Ctrl+Shift+R (Cmd+Shift+R on Mac)
- Firefox: Ctrl+F5 (Cmd+Shift+R on Mac)
- Safari: Cmd+Option+R

## Support

If you encounter issues during rollback:
1. Check git status for uncommitted changes
2. Review error messages in console
3. Verify all Phase 2 files have been removed
4. Ensure dependencies are correctly installed

## Summary

The rollback process is straightforward:
1. Revert App.tsx (the only modified file)
2. Delete the new files created for Phase 2
3. Clear caches and rebuild
4. Verify the application works as before

Total rollback time: ~3 minutes