#!/bin/bash

# Archi-Site Cleanup Script - Remove Naming Convention Violations
# This script follows CLAUDE.md conventions to remove "enhanced", "updated" etc. from filenames

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting Archi-Site Cleanup...${NC}"

# Step 1: Create backup
echo -e "${YELLOW}Creating backup...${NC}"
BACKUP_NAME="archi-site-backup-$(date +%Y%m%d-%H%M%S).tar.gz"
cd /Users/homeserver/ai-creative-team/archi-site
tar -czf ../$BACKUP_NAME . --exclude='node_modules' --exclude='dist' --exclude='.git'
echo -e "${GREEN}Backup created: $BACKUP_NAME${NC}"

# Step 2: Rename component files
echo -e "${YELLOW}Renaming component files...${NC}"
if [ -f "src/components/EnhancedSearchInterface.tsx" ]; then
  mv src/components/EnhancedSearchInterface.tsx src/components/SearchInterface.tsx
  echo "✓ Renamed EnhancedSearchInterface.tsx to SearchInterface.tsx"
fi

if [ -f "src/components/EnhancedInteractiveMap.tsx" ]; then
  mv src/components/EnhancedInteractiveMap.tsx src/components/InteractiveMap.tsx
  echo "✓ Renamed EnhancedInteractiveMap.tsx to InteractiveMap.tsx"
fi

# Step 3: Remove old duplicates
echo -e "${YELLOW}Removing old duplicate files...${NC}"
if [ -f "src/pages/ArchitecturePage.tsx" ]; then
  rm -f src/pages/ArchitecturePage.tsx
  echo "✓ Removed old ArchitecturePage.tsx"
fi

if [ -f "src/services/CacheService.ts" ]; then
  rm -f src/services/CacheService.ts
  echo "✓ Removed old CacheService.ts"
fi

# Step 4: Rename the kept "Enhanced" files
echo -e "${YELLOW}Renaming Enhanced versions to standard names...${NC}"
if [ -f "src/pages/ArchitecturePageEnhanced.tsx" ]; then
  mv src/pages/ArchitecturePageEnhanced.tsx src/pages/ArchitecturePage.tsx
  echo "✓ Renamed ArchitecturePageEnhanced.tsx to ArchitecturePage.tsx"
fi

if [ -f "src/services/CacheServiceEnhanced.ts" ]; then
  mv src/services/CacheServiceEnhanced.ts src/services/CacheService.ts
  echo "✓ Renamed CacheServiceEnhanced.ts to CacheService.ts"
fi

# Step 5: Update imports and component names
echo -e "${YELLOW}Updating imports and component names...${NC}"

# Fix component internal names
if [ -f "src/components/SearchInterface.tsx" ]; then
  sed -i '' 's/EnhancedSearchInterface/SearchInterface/g' src/components/SearchInterface.tsx
  echo "✓ Updated SearchInterface component internals"
fi

if [ -f "src/components/InteractiveMap.tsx" ]; then
  sed -i '' 's/EnhancedInteractiveMap/InteractiveMap/g' src/components/InteractiveMap.tsx
  echo "✓ Updated InteractiveMap component internals"
fi

# Update AnalyticsPage import
if [ -f "src/pages/AnalyticsPage.tsx" ]; then
  sed -i '' "s/from '\.\.\/components\/EnhancedInteractiveMap'/from '..\/components\/InteractiveMap'/g" src/pages/AnalyticsPage.tsx
  sed -i '' 's/EnhancedInteractiveMap/InteractiveMap/g' src/pages/AnalyticsPage.tsx
  echo "✓ Updated AnalyticsPage imports"
fi

# Update App.tsx import
if [ -f "src/App.tsx" ]; then
  sed -i '' "s/from '\.\/pages\/ArchitecturePageEnhanced'/from '.\/pages\/ArchitecturePage'/g" src/App.tsx
  echo "✓ Updated App.tsx imports"
fi

# Update service imports
if [ -f "src/services/PerformanceOptimizer.ts" ]; then
  sed -i '' "s/from '\.\/CacheServiceEnhanced'/from '.\/CacheService'/g" src/services/PerformanceOptimizer.ts
  sed -i '' 's/EnhancedCacheService/CacheService/g' src/services/PerformanceOptimizer.ts
  echo "✓ Updated PerformanceOptimizer imports"
fi

if [ -f "src/services/ProgressiveDbLoader.ts" ]; then
  sed -i '' "s/from '\.\/CacheServiceEnhanced'/from '.\/CacheService'/g" src/services/ProgressiveDbLoader.ts
  sed -i '' 's/EnhancedCacheService/CacheService/g' src/services/ProgressiveDbLoader.ts
  echo "✓ Updated ProgressiveDbLoader imports"
fi

# Update ArchitecturePage component name
if [ -f "src/pages/ArchitecturePage.tsx" ]; then
  sed -i '' 's/const ArchitecturePageEnhanced/const ArchitecturePage/g' src/pages/ArchitecturePage.tsx
  sed -i '' 's/export default ArchitecturePageEnhanced/export default ArchitecturePage/g' src/pages/ArchitecturePage.tsx
  echo "✓ Updated ArchitecturePage component name"
fi

# Update CacheService class name if needed
if [ -f "src/services/CacheService.ts" ]; then
  sed -i '' 's/class EnhancedCacheService/class CacheService/g' src/services/CacheService.ts
  sed -i '' 's/export default EnhancedCacheService/export default CacheService/g' src/services/CacheService.ts
  sed -i '' 's/export { EnhancedCacheService }/export { CacheService }/g' src/services/CacheService.ts
  echo "✓ Updated CacheService class name"
fi

# Step 6: Handle public files
echo -e "${YELLOW}Handling public files...${NC}"
if [ -f "public/sw-enhanced.js" ]; then
  if [ -f "public/sw.js" ]; then
    echo -e "${YELLOW}Warning: public/sw.js exists. Creating backup of enhanced version${NC}"
    mv public/sw-enhanced.js public/sw-enhanced.backup.js
  else
    mv public/sw-enhanced.js public/sw.js
    echo "✓ Renamed sw-enhanced.js to sw.js"
  fi
fi

if [ -f "public/_headers_enhanced" ]; then
  if [ -f "public/_headers" ]; then
    echo -e "${YELLOW}Warning: public/_headers exists. Creating backup of enhanced version${NC}"
    mv public/_headers_enhanced public/_headers_enhanced.backup
  else
    mv public/_headers_enhanced public/_headers
    echo "✓ Renamed _headers_enhanced to _headers"
  fi
fi

# Step 7: Clean dist directory
echo -e "${YELLOW}Cleaning dist directory...${NC}"
if [ -f "dist/sw-enhanced.js" ]; then
  rm -f dist/sw-enhanced.js
  echo "✓ Removed dist/sw-enhanced.js"
fi

if [ -f "dist/_headers_enhanced" ]; then
  rm -f dist/_headers_enhanced
  echo "✓ Removed dist/_headers_enhanced"
fi

# Step 8: Final verification
echo -e "${YELLOW}Checking for remaining violations...${NC}"
VIOLATIONS=$(find src public -name "*[Ee]nhanced*" -o -name "*[Uu]pdated*" -o -name "*[Ii]mproved*" 2>/dev/null | grep -v node_modules | grep -v dist || true)

if [ -z "$VIOLATIONS" ]; then
  echo -e "${GREEN}✓ No naming violations found!${NC}"
else
  echo -e "${RED}Warning: Some violations remain:${NC}"
  echo "$VIOLATIONS"
fi

# Step 9: Test build
echo -e "${YELLOW}Running build to verify changes...${NC}"
if npm run build; then
  echo -e "${GREEN}✓ Build successful!${NC}"
else
  echo -e "${RED}Build failed! You may need to fix additional issues.${NC}"
  echo -e "${YELLOW}Backup is available at: ../$BACKUP_NAME${NC}"
  exit 1
fi

echo -e "${GREEN}Cleanup completed successfully!${NC}"
echo -e "${YELLOW}Backup saved as: ../$BACKUP_NAME${NC}"
echo ""
echo "Next steps:"
echo "1. Test the application thoroughly"
echo "2. Verify the Research page works correctly"
echo "3. Check that all features function as expected"
echo "4. If everything works, commit the changes"
echo ""
echo "To rollback if needed:"
echo "cd /Users/homeserver/ai-creative-team"
echo "rm -rf archi-site"
echo "tar -xzf $BACKUP_NAME"