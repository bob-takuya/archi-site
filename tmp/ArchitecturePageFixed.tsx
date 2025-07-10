// Key changes for map integration (DEVELOPER_MAP_001 implementation)
// This shows the critical sections that need to be updated in ArchitecturePage.tsx

// 1. Import the new MapWithClustering component instead of Map
import MapWithClustering from '../components/MapWithClustering';

// 2. Update the map rendering section (lines 526-548) with:
{viewMode === 'map' ? (
  <Paper sx={{ height: '600px', overflow: 'hidden', position: 'relative' }}>
    <MapWithClustering
      markers={architectures
        .filter(arch => arch.latitude && arch.longitude)
        .map(arch => ({
          id: arch.id,
          position: [arch.latitude, arch.longitude] as [number, number],
          title: arch.title,
          architect: arch.architect,
          year: arch.year,
          category: arch.category,
          tags: arch.tags,
          address: arch.address
        }))}
      center={
        // Auto-center based on filtered results
        activeFilters.some(f => f.type === '地域') 
          ? undefined // Let map auto-center on filtered markers
          : architectures.filter(a => a.latitude && a.longitude).length > 0
            ? undefined // Auto-center on all markers
            : [35.6762, 139.6503] as [number, number] // Tokyo default
      }
      zoom={
        // Adjust zoom based on filter context
        activeFilters.some(f => f.type === '地域') 
          ? 10 // Zoom in more for regional filters
          : activeFilters.length > 0 
            ? 8 // Medium zoom for other filters
            : 6 // Wide view for all results
      }
      height="600px"
      onMarkerClick={(markerId) => {
        navigate(`/architecture/${markerId}`);
      }}
    />
  </Paper>
) : (
  // ... existing grid view code
)}

// 3. Add map-specific styles
const mapStyles = {
  mapContainer: {
    height: '600px',
    overflow: 'hidden',
    position: 'relative' as const,
    '& .leaflet-container': {
      height: '100%',
      width: '100%',
      cursor: 'grab',
      '&:active': {
        cursor: 'grabbing'
      }
    },
    '& .marker-cluster': {
      backgroundColor: 'rgba(25, 118, 210, 0.6)',
      '& div': {
        backgroundColor: 'rgba(25, 118, 210, 0.8)',
        color: 'white',
        fontWeight: 'bold'
      }
    },
    '& .marker-cluster-small': {
      backgroundColor: 'rgba(25, 118, 210, 0.6)',
    },
    '& .marker-cluster-medium': {
      backgroundColor: 'rgba(255, 152, 0, 0.6)',
      '& div': {
        backgroundColor: 'rgba(255, 152, 0, 0.8)'
      }
    },
    '& .marker-cluster-large': {
      backgroundColor: 'rgba(244, 67, 54, 0.6)',
      '& div': {
        backgroundColor: 'rgba(244, 67, 54, 0.8)'
      }
    }
  }
};

// 4. Update items per page logic (line 87)
const itemsPerPage = viewMode === 'grid' ? 12 : 100; // Load more items for map view

// 5. Add loading state improvements for map view
{loading && viewMode === 'map' && (
  <Box sx={{ 
    height: '600px', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center',
    backgroundColor: '#f5f5f5'
  }}>
    <CircularProgress size={60} />
  </Box>
)}

// 6. Update the fetchArchitectures to handle map-specific requirements
const fetchArchitectures = async (page: number, search = '', sort = sortBy) => {
  setLoading(true);
  try {
    // For map view, we might want to fetch more items or all items
    const mapItemsPerPage = viewMode === 'map' ? 100 : itemsPerPage;
    
    let result;
    // ... existing fetch logic but use mapItemsPerPage
  } catch (error) {
    console.error('Error fetching architectures:', error);
  } finally {
    setLoading(false);
  }
};

// 7. Add view mode persistence to URL
useEffect(() => {
  const queryParams = new URLSearchParams(location.search);
  const savedViewMode = queryParams.get('view');
  if (savedViewMode === 'map' || savedViewMode === 'grid') {
    setViewMode(savedViewMode);
  }
}, [location.search]);

const handleViewModeChange = (event: any, newMode: 'grid' | 'map' | null) => {
  if (newMode) {
    setViewMode(newMode);
    const queryParams = new URLSearchParams(location.search);
    queryParams.set('view', newMode);
    navigate({ search: queryParams.toString() });
    
    // Reload data if switching to map view to get more items
    if (newMode === 'map') {
      const searchTerm = searchValue?.value || searchInputValue;
      fetchArchitectures(currentPage, searchTerm, sortBy);
    }
  }
};