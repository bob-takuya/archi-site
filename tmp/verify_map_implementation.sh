#!/bin/bash

# Map View Implementation Verification Script
# Created by COORDINATOR_MAP_001

echo "🔍 Verifying Map View Implementation..."
echo "=================================="

# Check if MapWithClustering component exists
if [ -f "src/components/MapWithClustering.tsx" ]; then
    echo "✅ MapWithClustering component found"
else
    echo "❌ MapWithClustering component missing"
    exit 1
fi

# Check if ArchitecturePage has been updated
if grep -q "MapWithClustering" "src/pages/ArchitecturePage.tsx"; then
    echo "✅ ArchitecturePage updated to use MapWithClustering"
else
    echo "❌ ArchitecturePage not updated"
    exit 1
fi

# Check dependencies
if grep -q "leaflet.markercluster" "package.json"; then
    echo "✅ Marker clustering dependency installed"
else
    echo "❌ Missing leaflet.markercluster dependency"
    exit 1
fi

# Check TypeScript compilation
echo ""
echo "🔧 Checking TypeScript compilation..."
npx tsc --noEmit src/components/MapWithClustering.tsx 2>&1 | grep -E "(error|Error)" && echo "❌ TypeScript errors found" || echo "✅ TypeScript compilation clean"

echo ""
echo "=================================="
echo "✨ Map View Implementation Verification Complete!"
echo ""
echo "Next steps:"
echo "1. Run: npm run dev"
echo "2. Navigate to: http://localhost:5173/architecture"
echo "3. Click the Map View toggle button"
echo "4. Test filtering and interactions"
echo ""
echo "To run E2E tests:"
echo "cp tmp/map-view.e2e.spec.ts e2e/"
echo "npm run test:e2e -- map-view.e2e.spec.ts"