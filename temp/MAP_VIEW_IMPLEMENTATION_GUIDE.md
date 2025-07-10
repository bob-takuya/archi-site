# Map View Implementation Guide

## Overview
This guide provides step-by-step instructions for implementing the map view integration into the Architecture page, based on the architectural design document.

## Prerequisites
1. Install required dependencies:
```bash
npm install leaflet@1.7.1 leaflet.markercluster@1.5.3
npm install --save-dev @types/leaflet @types/leaflet.markercluster
```

## Implementation Steps

### Step 1: Update Map Component
Replace the existing Map.tsx with the enhanced version:

```bash
# Backup the original
cp src/components/Map.tsx src/components/Map.tsx.backup

# Copy the enhanced version
cp temp/EnhancedMap.tsx src/components/Map.tsx
```

Update imports in the new Map.tsx:
- Change `EnhancedMap` to `Map` in the export statement
- Ensure all paths are correct

### Step 2: Add Map Styles
Create enhanced map styles:

```bash
# Add to existing map.css or create new file
cat temp/enhanced-map.css >> src/styles/map.css
```

### Step 3: Update ArchitecturePage Component

#### 3.1 Add New Imports
```typescript
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import { Fade, Zoom } from '@mui/material';
```

#### 3.2 Update State Management
Add view mode to the existing state:
```typescript
const [viewMode, setViewMode] = useState<'grid' | 'list' | 'map'>('grid');
const [mapLoading, setMapLoading] = useState(false);
```

#### 3.3 Modify Items Per Page Logic
Update the itemsPerPage calculation:
```typescript
const itemsPerPage = useMemo(() => {
  switch (viewMode) {
    case 'list':
      return 20;
    case 'map':
      return 100; // Load more for map view
    default:
      return 12;
  }
}, [viewMode]);
```

#### 3.4 Add View Mode Toggle
Replace the existing toggle buttons section with:
```typescript
<ToggleButtonGroup
  value={viewMode}
  exclusive
  onChange={handleViewModeChange}
  size="small"
  aria-label="表示モード"
>
  <ToggleButton value="grid" aria-label="グリッドビュー">
    <Tooltip title="グリッドビュー">
      <ViewModuleIcon />
    </Tooltip>
  </ToggleButton>
  <ToggleButton value="list" aria-label="リストビュー">
    <Tooltip title="リストビュー">
      <ViewListIcon />
    </Tooltip>
  </ToggleButton>
  <ToggleButton value="map" aria-label="マップビュー">
    <Tooltip title="マップビュー">
      <MapIcon />
    </Tooltip>
  </ToggleButton>
</ToggleButtonGroup>
```

#### 3.5 Add View Mode Handler
```typescript
const handleViewModeChange = (event: React.MouseEvent<HTMLElement>, newMode: string | null) => {
  if (newMode && newMode !== viewMode) {
    setViewMode(newMode as 'grid' | 'list' | 'map');
    localStorage.setItem('preferredViewMode', newMode);
    
    // If switching to map view for the first time, load more data
    if (newMode === 'map' && architectures.length < 100) {
      const searchTerm = searchValue?.value || searchInputValue;
      fetchArchitectures(1, searchTerm, sortBy);
    }
  }
};
```

#### 3.6 Update Map Integration
Replace the existing map section in the render with:
```typescript
{viewMode === 'map' ? (
  <Fade in={true} timeout={500}>
    <Paper sx={{ height: '600px', overflow: 'hidden', position: 'relative' }}>
      <Map
        markers={architectures
          .filter(arch => arch.latitude && arch.longitude)
          .map(arch => ({
            id: arch.id,
            position: [arch.latitude, arch.longitude],
            title: arch.title,
            architect: arch.architect,
            year: arch.year,
            category: arch.category,
            tags: arch.tags,
            address: arch.address,
            markerType: arch.tags ? 'award' : 'default',
          }))}
        center={
          architectures.filter(a => a.latitude && a.longitude).length > 0
            ? undefined
            : [35.6762, 139.6503]
        }
        zoom={activeFilters.length > 0 ? 8 : 6}
        height="600px"
        showClusters={true}
        loading={mapLoading}
      />
    </Paper>
  </Fade>
) : (
  // Existing grid/list view code
)}
```

### Step 4: Add List View Support (Optional Enhancement)
Add list view rendering alongside grid view:

```typescript
{viewMode === 'list' ? (
  // List view card with horizontal layout
  <Card>
    <CardActionArea component={RouterLink} to={`/architecture/${architecture.id}`}>
      <CardContent sx={{ display: 'flex', gap: 2 }}>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h6" component="h2" gutterBottom>
            {architecture.title}
          </Typography>
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            {/* Horizontal layout of details */}
          </Box>
        </Box>
        {architecture.tags && (
          <Chip 
            icon={<EmojiEventsIcon />}
            label={architecture.tags} 
            size="small" 
            color="warning" 
            variant="outlined"
          />
        )}
      </CardContent>
    </CardActionArea>
  </Card>
) : (
  // Existing grid view card
)}
```

### Step 5: Hide Insights Panel in Map View
Update the insights panel visibility:
```typescript
{showInsights && viewMode !== 'map' && (
  <Grid item xs={12} lg={3}>
    {/* Research insights sidebar */}
  </Grid>
)}
```

### Step 6: Performance Optimizations

#### 6.1 Add Debounce Utility
```typescript
const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};
```

#### 6.2 Optimize Map Data Loading
```typescript
// Only load map data when in map view
useEffect(() => {
  if (viewMode === 'map' && architectures.length < 100) {
    // Load more data for better map experience
    const searchTerm = searchValue?.value || searchInputValue;
    fetchArchitectures(1, searchTerm, sortBy);
  }
}, [viewMode]);
```

### Step 7: Testing

#### 7.1 Unit Tests
Create tests for view mode switching:
```typescript
// tests/architecture-page-map.test.tsx
describe('Architecture Page Map View', () => {
  test('switches between view modes', async () => {
    render(<ArchitecturePage />);
    
    // Test view mode toggle
    const mapButton = screen.getByLabelText('マップビュー');
    fireEvent.click(mapButton);
    
    expect(screen.getByTestId('map-container')).toBeInTheDocument();
  });
  
  test('preserves filters when switching views', () => {
    // Test filter persistence
  });
});
```

#### 7.2 E2E Tests
```typescript
// tests/e2e/map-view.spec.ts
test('Map view functionality', async ({ page }) => {
  await page.goto('/architecture');
  
  // Switch to map view
  await page.click('[aria-label="マップビュー"]');
  
  // Wait for map to load
  await page.waitForSelector('.leaflet-container');
  
  // Test marker interaction
  await page.click('.custom-map-marker');
  await expect(page.locator('.leaflet-popup')).toBeVisible();
});
```

### Step 8: Deployment Checklist

- [ ] Install all dependencies
- [ ] Update Map component
- [ ] Add enhanced styles
- [ ] Update ArchitecturePage
- [ ] Test view mode switching
- [ ] Test filter synchronization
- [ ] Test map marker interactions
- [ ] Verify performance with large datasets
- [ ] Check mobile responsiveness
- [ ] Update documentation

### Step 9: Monitoring Setup

Add analytics tracking:
```typescript
// Track view mode usage
const trackViewModeChange = (mode: string) => {
  if (window.gtag) {
    window.gtag('event', 'view_mode_change', {
      event_category: 'Architecture Page',
      event_label: mode,
    });
  }
};
```

### Step 10: Future Enhancements

1. **Advanced Clustering**: Implement custom cluster icons based on building types
2. **Heat Map Layer**: Add density visualization option
3. **3D Buildings**: Integrate with Mapbox GL for 3D visualization
4. **Save Map State**: Remember zoom level and center position
5. **Export Features**: Allow users to export visible map data

## Troubleshooting

### Common Issues

1. **Map not loading**: Check if Leaflet CSS is imported
2. **Markers not appearing**: Verify latitude/longitude data
3. **Performance issues**: Implement marker virtualization
4. **Mobile layout problems**: Test responsive breakpoints

### Performance Tips

1. Use marker clustering for > 100 markers
2. Implement viewport-based loading
3. Cache map tiles in service worker
4. Lazy load map component
5. Optimize marker icons

## Conclusion

This implementation guide provides a complete path to integrating map view into the Architecture page. The phased approach ensures each component is properly tested before moving forward.