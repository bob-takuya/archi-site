import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Box, 
  Grid, 
  Paper, 
  TextField,
  Button,
  Pagination,
  CircularProgress,
  Chip,
  InputAdornment,
  Alert,
  Autocomplete,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Fab,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import SortIcon from '@mui/icons-material/Sort';
import FilterListIcon from '@mui/icons-material/FilterList';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import TuneIcon from '@mui/icons-material/Tune';
import SpeedIcon from '@mui/icons-material/Speed';

// Optimized imports
import SearchBar from '../components/ui/SearchBar';
import VirtualizedList from '../components/VirtualizedList';
import ArchitectureCard from '../components/ArchitectureCard';
import PerformanceMonitor from '../components/PerformanceMonitor';
import PerformanceOptimizer from '../services/PerformanceOptimizer';

interface Architecture {
  id: number;
  name: string;
  architect: string;
  completedYear: number;
  city: string;
  location: string;
  tag: string;
  category: string;
  prefecture: string;
}

interface SearchFilters {
  search: string;
  architect: string;
  city: string;
  year: string;
  prefecture: string;
  category: string;
  tag: string;
  sort: string;
}

/**
 * Optimized Architecture Page with performance enhancements
 * - React.memo for component optimization
 * - Debounced search with 300ms delay
 * - Virtual scrolling for large result sets
 * - Progressive loading integration
 * - Advanced caching strategies
 * - Performance monitoring
 */
const ArchitecturePageOptimized: React.FC = React.memo(() => {
  const location = useLocation();
  const navigate = useNavigate();
  const [architectures, setArchitectures] = useState<Architecture[]>([]);
  const [filteredArchitectures, setFilteredArchitectures] = useState<Architecture[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [showPerformanceMonitor, setShowPerformanceMonitor] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState<SearchFilters>({
    search: '',
    architect: '',
    city: '',
    year: '',
    prefecture: '',
    category: '',
    tag: '',
    sort: 'id',
  });

  // Autocomplete options
  const [architects, setArchitects] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);

  // Performance optimizer
  const [optimizer] = useState(() => PerformanceOptimizer.getInstance());
  const [virtualScrollConfig, setVirtualScrollConfig] = useState({
    enabled: true,
    itemHeight: 280,
    overscan: 5,
  });

  // Constants
  const ITEMS_PER_PAGE = 24;
  const CONTAINER_HEIGHT = 600;

  // Initialize performance optimizations
  useEffect(() => {
    const initializeOptimizations = async () => {
      try {
        await optimizer.initialize({
          enableVirtualScrolling: true,
          enableProgressiveLoading: true,
          enableAdvancedCaching: true,
          cacheWarmupQueries: [
            'SELECT name, architect, city, completedYear, tag FROM architecture ORDER BY id LIMIT 100',
            'SELECT DISTINCT architect FROM architecture WHERE architect IS NOT NULL LIMIT 50',
            'SELECT DISTINCT city FROM architecture WHERE city IS NOT NULL LIMIT 30',
          ],
        });
        
        setVirtualScrollConfig(optimizer.getVirtualScrollConfig());
        console.log('Performance optimizations initialized');
      } catch (error) {
        console.error('Failed to initialize performance optimizations:', error);
      }
    };

    initializeOptimizations();
  }, [optimizer]);

  // Parse URL parameters
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const newFilters = {
      search: queryParams.get('search') || '',
      architect: queryParams.get('architect') || '',
      city: queryParams.get('city') || '',
      year: queryParams.get('year') || '',
      prefecture: queryParams.get('prefecture') || '',
      category: queryParams.get('category') || '',
      tag: queryParams.get('tag') || '',
      sort: queryParams.get('sort') || 'id',
    };
    
    setFilters(newFilters);
    setCurrentPage(parseInt(queryParams.get('page') || '1'));
  }, [location.search]);

  // Load initial data with progressive loading
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Use optimized query with caching
        const architecturesData = await optimizer.optimizedQuery<Architecture[]>(
          'SELECT * FROM architecture ORDER BY id LIMIT 500'
        );
        
        setArchitectures(architecturesData);
        
        // Load filter options in parallel
        const [architectsData, citiesData, categoriesData, tagsData] = await Promise.all([
          optimizer.optimizedQuery<{architect: string}[]>(
            'SELECT DISTINCT architect FROM architecture WHERE architect IS NOT NULL ORDER BY architect'
          ),
          optimizer.optimizedQuery<{city: string}[]>(
            'SELECT DISTINCT city FROM architecture WHERE city IS NOT NULL ORDER BY city'
          ),
          optimizer.optimizedQuery<{category: string}[]>(
            'SELECT DISTINCT category FROM architecture WHERE category IS NOT NULL ORDER BY category'
          ),
          optimizer.optimizedQuery<{tag: string}[]>(
            'SELECT DISTINCT tag FROM architecture WHERE tag IS NOT NULL ORDER BY tag LIMIT 50'
          ),
        ]);
        
        setArchitects(architectsData.map(item => item.architect));
        setCities(citiesData.map(item => item.city));
        setCategories(categoriesData.map(item => item.category));
        setTags(tagsData.map(item => item.tag));
        
      } catch (error) {
        console.error('Failed to load initial data:', error);
        setError('データの読み込みに失敗しました。');
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [optimizer]);

  // Optimized search with debouncing and caching
  const performSearch = useCallback(async (searchFilters: SearchFilters) => {
    setSearchLoading(true);
    
    try {
      let query = 'SELECT * FROM architecture WHERE 1=1';
      const params: any[] = [];
      
      // Build dynamic query based on filters
      if (searchFilters.search) {
        query += ' AND (name LIKE ? OR architect LIKE ? OR city LIKE ?)';
        const searchTerm = `%${searchFilters.search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }
      
      if (searchFilters.architect) {
        query += ' AND architect = ?';
        params.push(searchFilters.architect);
      }
      
      if (searchFilters.city) {
        query += ' AND city = ?';
        params.push(searchFilters.city);
      }
      
      if (searchFilters.year) {
        query += ' AND completedYear = ?';
        params.push(parseInt(searchFilters.year));
      }
      
      if (searchFilters.category) {
        query += ' AND category = ?';
        params.push(searchFilters.category);
      }
      
      if (searchFilters.tag) {
        query += ' AND tag LIKE ?';
        params.push(`%${searchFilters.tag}%`);
      }
      
      // Add sorting
      switch (searchFilters.sort) {
        case 'name':
          query += ' ORDER BY name ASC';
          break;
        case 'year':
          query += ' ORDER BY completedYear DESC';
          break;
        case 'architect':
          query += ' ORDER BY architect ASC';
          break;
        default:
          query += ' ORDER BY id ASC';
      }
      
      // Use optimized search with caching
      const results = await optimizer.optimizedSearch(
        query,
        params,
        () => optimizer.optimizedQuery<Architecture[]>(query, params)
      );
      
      setFilteredArchitectures(results);
      setTotalCount(results.length);
      setCurrentPage(1);
      
    } catch (error) {
      console.error('Search failed:', error);
      setError('検索に失敗しました。');
      setFilteredArchitectures([]);
    } finally {
      setSearchLoading(false);
    }
  }, [optimizer]);

  // Debounced search effect
  useEffect(() => {
    const hasActiveFilters = Object.values(filters).some(value => value !== '' && value !== 'id');
    
    if (hasActiveFilters) {
      performSearch(filters);
    } else {
      setFilteredArchitectures(architectures);
      setTotalCount(architectures.length);
    }
  }, [filters, architectures, performSearch]);

  // Update URL when filters change
  const updateURL = useCallback((newFilters: SearchFilters, page: number = 1) => {
    const queryParams = new URLSearchParams();
    
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value && value !== 'id') {
        queryParams.set(key, value);
      }
    });
    
    if (page > 1) {
      queryParams.set('page', page.toString());
    }
    
    const newURL = `${location.pathname}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    navigate(newURL, { replace: true });
  }, [location.pathname, navigate]);

  // Handle filter changes
  const handleFilterChange = useCallback((key: keyof SearchFilters, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    updateURL(newFilters);
  }, [filters, updateURL]);

  // Handle page change
  const handlePageChange = useCallback((_: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page);
    updateURL(filters, page);
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [filters, updateURL]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    const clearedFilters = {
      search: '',
      architect: '',
      city: '',
      year: '',
      prefecture: '',
      category: '',
      tag: '',
      sort: 'id',
    };
    setFilters(clearedFilters);
    updateURL(clearedFilters);
  }, [updateURL]);

  // Get current page items
  const currentItems = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredArchitectures.slice(startIndex, endIndex);
  }, [filteredArchitectures, currentPage]);

  // Virtualized list item renderer
  const renderArchitectureItem = useCallback((architecture: Architecture, index: number) => (
    <Box sx={{ p: 1, height: virtualScrollConfig.itemHeight }}>
      <ArchitectureCard
        architecture={architecture}
        compact={false}
      />
    </Box>
  ), [virtualScrollConfig.itemHeight]);

  // Handle virtual list scroll
  const handleVirtualScroll = useCallback((scrollTop: number) => {
    // Could implement infinite loading here
  }, []);

  if (loading) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>データを読み込み中...</Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          建築作品
        </Typography>
        <Tooltip title="パフォーマンス監視">
          <IconButton 
            onClick={() => setShowPerformanceMonitor(!showPerformanceMonitor)}
            color={showPerformanceMonitor ? 'primary' : 'default'}
          >
            <SpeedIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Performance Monitor */}
      {showPerformanceMonitor && (
        <Paper sx={{ mb: 3, p: 2 }}>
          <PerformanceMonitor />
        </Paper>
      )}

      {/* Search and Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          {/* Main Search */}
          <Grid item xs={12} md={6}>
            <SearchBar
              placeholder="建築名、建築家、都市で検索..."
              value={filters.search}
              onChange={(value) => handleFilterChange('search', value)}
              onSearch={(value) => handleFilterChange('search', value)}
              enableDebounce={true}
              debounceMs={300}
              loading={searchLoading}
              fullWidth
            />
          </Grid>

          {/* Architect Filter */}
          <Grid item xs={12} sm={6} md={3}>
            <Autocomplete
              options={architects}
              value={filters.architect}
              onChange={(_, value) => handleFilterChange('architect', value || '')}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="建築家"
                  variant="outlined"
                  size="small"
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              )}
              size="small"
            />
          </Grid>

          {/* City Filter */}
          <Grid item xs={12} sm={6} md={3}>
            <Autocomplete
              options={cities}
              value={filters.city}
              onChange={(_, value) => handleFilterChange('city', value || '')}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="都市"
                  variant="outlined"
                  size="small"
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationOnIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              )}
              size="small"
            />
          </Grid>

          {/* Year Filter */}
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              label="竣工年"
              value={filters.year}
              onChange={(e) => handleFilterChange('year', e.target.value)}
              variant="outlined"
              size="small"
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <CalendarTodayIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          {/* Sort */}
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>並び順</InputLabel>
              <Select
                value={filters.sort}
                onChange={(e) => handleFilterChange('sort', e.target.value)}
                label="並び順"
                startAdornment={<SortIcon sx={{ mr: 1 }} />}
              >
                <MenuItem value="id">登録順</MenuItem>
                <MenuItem value="name">名前順</MenuItem>
                <MenuItem value="year">竣工年順</MenuItem>
                <MenuItem value="architect">建築家順</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Clear Filters */}
          <Grid item xs={12} md={2}>
            <Button
              variant="outlined"
              onClick={clearFilters}
              startIcon={<FilterListIcon />}
              fullWidth
            >
              フィルタクリア
            </Button>
          </Grid>
        </Grid>

        {/* Active Filters */}
        {Object.entries(filters).some(([key, value]) => value && key !== 'sort') && (
          <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {Object.entries(filters).map(([key, value]) => {
              if (!value || key === 'sort') return null;
              
              return (
                <Chip
                  key={key}
                  label={`${getFilterLabel(key)}: ${value}`}
                  onDelete={() => handleFilterChange(key as keyof SearchFilters, '')}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              );
            })}
          </Box>
        )}
      </Paper>

      {/* Results Count */}
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="body1" color="text.secondary">
          {totalCount}件の建築作品が見つかりました
          {searchLoading && <CircularProgress size={16} sx={{ ml: 1 }} />}
        </Typography>
        
        {/* Performance metrics */}
        <Typography variant="body2" color="text.secondary">
          キャッシュヒット率: {(optimizer.getMetrics().cacheHitRatio * 100).toFixed(1)}%
        </Typography>
      </Box>

      {/* Results */}
      {currentItems.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            検索条件に一致する建築作品が見つかりませんでした
          </Typography>
          <Button onClick={clearFilters} sx={{ mt: 2 }}>
            フィルタをクリアして再検索
          </Button>
        </Paper>
      ) : (
        <>
          {/* Virtual Scrolling for large datasets */}
          {virtualScrollConfig.enabled && currentItems.length > 20 ? (
            <VirtualizedList
              items={currentItems}
              itemHeight={virtualScrollConfig.itemHeight}
              containerHeight={CONTAINER_HEIGHT}
              renderItem={renderArchitectureItem}
              overscan={virtualScrollConfig.overscan}
              onScroll={handleVirtualScroll}
            />
          ) : (
            /* Regular grid for smaller datasets */
            <Grid container spacing={3}>
              {currentItems.map((architecture) => (
                <Grid item key={architecture.id} xs={12} sm={6} md={4} lg={3}>
                  <ArchitectureCard architecture={architecture} />
                </Grid>
              ))}
            </Grid>
          )}

          {/* Pagination */}
          {Math.ceil(totalCount / ITEMS_PER_PAGE) > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={Math.ceil(totalCount / ITEMS_PER_PAGE)}
                page={currentPage}
                onChange={handlePageChange}
                color="primary"
                size="large"
                showFirstButton
                showLastButton
              />
            </Box>
          )}
        </>
      )}

      {/* Performance FAB */}
      <Fab
        color="secondary"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => {
          const report = optimizer.exportPerformanceReport();
          console.log('Performance Report:', report);
        }}
      >
        <TuneIcon />
      </Fab>
    </Container>
  );
});

// Helper function to get filter labels
function getFilterLabel(key: string): string {
  const labels: Record<string, string> = {
    search: '検索',
    architect: '建築家',
    city: '都市',
    year: '竣工年',
    prefecture: '都道府県',
    category: 'カテゴリ',
    tag: 'タグ',
  };
  return labels[key] || key;
}

ArchitecturePageOptimized.displayName = 'ArchitecturePageOptimized';

export default ArchitecturePageOptimized;