# ⚠️ CRITICAL ERROR PREVENTION GUIDE ⚠️

## The Two Critical Errors That Must Never Happen Again

### 1. "問題が発生しました" Error Message
This error appears when the ErrorBoundary component catches an unhandled React error.

### 2. Eternal Loading State
The page shows a loading spinner forever and never displays content.

## Root Causes and Prevention

### Database Loading Issues
**PROBLEM**: SimpleDatabaseLoader was trying to initialize a 12MB SQLite database on every page load, causing 10+ minute loading times.

**SOLUTION**: 
- Removed SimpleDatabaseLoader from App.tsx
- Now using JSON-based services (FastArchitectureService) that load data on-demand
- **NEVER** block the entire app startup with database initialization

### Service Error Handling
**PROBLEM**: Services were throwing errors when data files were missing, triggering the ErrorBoundary.

**SOLUTION**:
```typescript
// ❌ BAD - Throws error
async loadData() {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to load'); // This triggers ErrorBoundary!
  }
}

// ✅ GOOD - Returns empty data
async loadData() {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return { items: [] }; // Return empty data instead
    }
    return await response.json();
  } catch (error) {
    console.error('Load failed:', error);
    return { items: [] }; // Always provide fallback
  }
}
```

### Loading State Management
**PROBLEM**: Loading states not properly reset in finally blocks, causing eternal loading.

**SOLUTION**:
```typescript
// ❌ BAD - Loading might stay true forever
async fetchData() {
  setLoading(true);
  try {
    const data = await api.getData();
    setData(data);
    setLoading(false);
  } catch (error) {
    setError(error);
    // Loading is still true! Eternal loading state!
  }
}

// ✅ GOOD - Loading always set to false
async fetchData() {
  setLoading(true);
  try {
    const data = await api.getData();
    setData(data);
  } catch (error) {
    setError(error);
    setData([]); // Provide fallback data
  } finally {
    setLoading(false); // ALWAYS reset loading state
  }
}
```

### React Hook Dependencies
**PROBLEM**: Circular dependencies in useCallback hooks causing reference errors.

**SOLUTION**:
```typescript
// ❌ BAD - Circular dependency
const handleOptimizedSearch = useCallback((value) => {
  addToRecentSearches(value);
  handleSearch(value);
}, [addToRecentSearches]); // Missing handleSearch dependency!

// ✅ GOOD - All dependencies included
const handleOptimizedSearch = useCallback((value) => {
  addToRecentSearches(value);
  handleSearch(value);
}, [addToRecentSearches, handleSearch]);
```

## Critical Files to Watch

1. **src/App.tsx**
   - DO NOT re-add SimpleDatabaseLoader
   - Keep app initialization lightweight

2. **src/services/api/FastArchitectureService.ts**
   - MUST handle all errors gracefully
   - MUST return empty data on failure
   - NEVER throw errors in initialize()

3. **src/pages/ArchitecturePage.tsx**
   - MUST use try-catch-finally for all async operations
   - MUST reset loading states in finally blocks

4. **src/pages/ArchitectsPage.tsx**
   - Uses RealArchitectService (JSON-based)
   - DO NOT switch back to database services

5. **src/components/ErrorBoundary.tsx**
   - Shows "問題が発生しました" on errors
   - Only triggers on unhandled React errors

## Testing Checklist

Before deploying, verify:
- [ ] No database initialization on app startup
- [ ] All services return empty data on failure (not throw errors)
- [ ] All async functions have try-catch-finally blocks
- [ ] Loading states are reset in finally blocks
- [ ] No circular dependencies in React hooks
- [ ] Test with missing data files (should show empty state, not error)
- [ ] Test slow network (should eventually load or timeout gracefully)

## Emergency Fixes

If errors occur in production:

1. **Check browser console** for specific error messages
2. **Check network tab** for failed requests
3. **Common fixes**:
   - Clear browser cache
   - Check if data files exist in /archi-site/data/
   - Verify GitHub Pages deployment completed
   - Check for JavaScript syntax errors in recent commits

## Remember

**The goal is resilience**: The app should gracefully handle missing data, network failures, and other issues without showing error messages or hanging forever. Always provide fallback behavior instead of crashing.