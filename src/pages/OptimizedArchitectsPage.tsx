/**
 * Optimized Architects Page - SOW Phase 2 Performance Implementation
 * Integrates virtual scrolling, intelligent caching, and performance monitoring
 */

import React, { useState, useEffect, useCallback, useMemo, useRef, Suspense, lazy } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Box, 
  TextField,
  InputAdornment,
  Button,
  CircularProgress,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Autocomplete,
  Popover,
  Alert,
  Skeleton,
  useTheme,
  useMediaQuery,
  Fab,
  IconButton,
  Tooltip
} from '@mui/material';

import SearchIcon from '@mui/icons-material/Search';
import TuneIcon from '@mui/icons-material/Tune';
import SpeedIcon from '@mui/icons-material/Speed';
import RefreshIcon from '@mui/icons-material/Refresh';
import ClearIcon from '@mui/icons-material/Clear';

// Lazy load heavy components
const VirtualizedArchitectsList = lazy(() => import('../components/VirtualizedArchitectsList'));
const ArchitectsPerformanceMonitor = lazy(() => import('../components/ArchitectsPerformanceMonitor'));

// Services
import OptimizedArchitectService from '../services/OptimizedArchitectService';
import { useDebounce } from '../hooks/useDebounce';
import type { Architect, ArchitectsResponse } from '../types/architect';

// Performance optimized with React.memo
const OptimizedArchitectsPage: React.FC = React.memo(() => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Core state
  const [architects, setArchitects] = useState<Architect[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searching, setSearching] = useState<boolean>(false);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [error, setError] = useState<string>('');
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<string>('asc');
  
  // Advanced filters
  const [nationality, setNationality] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [school, setSchool] = useState<string>('');
  const [birthYearFrom, setBirthYearFrom] = useState<string>('');
  const [birthYearTo, setBirthYearTo] = useState<string>('');
  const [deathYear, setDeathYear] = useState<string>('');
  
  // UI state
  const [showPerformanceMonitor, setShowPerformanceMonitor] = useState<boolean>(false);
  const [filtersExpanded, setFiltersExpanded] = useState<boolean>(false);
  const [virtualScrollHeight, setVirtualScrollHeight] = useState<number>(600);
  
  // Tag selection state
  const [yearAnchorEl, setYearAnchorEl] = useState<HTMLElement | null>(null);
  const [currentTagForYear, setCurrentTagForYear] = useState<string>('');
  const [tagsYears, setTagsYears] = useState<Record<string, string[]>>({});

  // Service instance
  const optimizedService = useMemo(() => OptimizedArchitectService.getInstance(), []);

  // Parse URL parameters
  const queryParams = useMemo(() => new URLSearchParams(location.search), [location.search]);

  // Memoized filter values
  const filterOptions = useMemo(() => ({
    nationality,
    category,
    school,
    birthYearFrom: birthYearFrom ? parseInt(birthYearFrom) : undefined,
    birthYearTo: birthYearTo ? parseInt(birthYearTo) : undefined,
    deathYear: deathYear ? parseInt(deathYear) : undefined
  }), [nationality, category, school, birthYearFrom, birthYearTo, deathYear]);

  // Calculate container height for virtual scrolling
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const availableHeight = window.innerHeight - rect.top - 100; // 100px for padding/pagination
        setVirtualScrollHeight(Math.max(400, Math.min(800, availableHeight)));
      }
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  // Load architects data with performance optimization
  const loadArchitects = useCallback(async (forceRefresh = false) => {
    if (!forceRefresh && searching) return;
    
    const isNewSearch = debouncedSearchTerm !== searchTerm;
    setSearching(isNewSearch);
    setLoading(currentPage === 1 || forceRefresh);
    setError('');

    try {
      const result = await optimizedService.getAllArchitects(
        currentPage,
        isMobile ? 6 : 12, // Adaptive page size
        debouncedSearchTerm,
        selectedTags,
        sortBy,
        sortOrder,
        nationality,
        category,
        school,
        filterOptions.birthYearFrom,
        filterOptions.birthYearTo,
        filterOptions.deathYear
      );

      setArchitects(result.items || result.results || []);
      setTotalPages(result.totalPages);
      setTotalItems(result.total);
      
    } catch (error) {
      console.error('建築家データ取得エラー:', error);
      setError('データの取得に失敗しました。もう一度お試しください。');
      setArchitects([]);
    } finally {
      setLoading(false);
      setSearching(false);
    }
  }, [
    currentPage,
    debouncedSearchTerm,
    selectedTags,
    sortBy,
    sortOrder,
    filterOptions,
    optimizedService,
    isMobile,
    searching,
    searchTerm,
    nationality,
    category,
    school
  ]);

  // Load initial data and URL parameters
  useEffect(() => {
    // Parse URL parameters
    const page = parseInt(queryParams.get('page') || '1');
    const search = queryParams.get('search') || '';
    const tags = queryParams.get('tags') ? queryParams.get('tags')!.split(',') : [];
    const sort = queryParams.get('sortBy') || 'name';
    const order = queryParams.get('sortOrder') || 'asc';
    
    // Set state from URL
    setCurrentPage(page);
    setSearchTerm(search);
    setSelectedTags(tags);
    setSortBy(sort);
    setSortOrder(order);
    setNationality(queryParams.get('nationality') || '');
    setCategory(queryParams.get('category') || '');
    setSchool(queryParams.get('school') || '');
    setBirthYearFrom(queryParams.get('birthYearFrom') || '');
    setBirthYearTo(queryParams.get('birthYearTo') || '');
    setDeathYear(queryParams.get('deathYear') || '');
    
    // Load available tags
    const baseTags = ['国籍', 'カテゴリー', '学校', '生年', '没年'];
    setAvailableTags(baseTags);
  }, [queryParams]);

  // Load data when dependencies change
  useEffect(() => {
    loadArchitects();
  }, [loadArchitects]);

  // Optimized search handler
  const handleSearch = useCallback(() => {
    setCurrentPage(1);
    updateUrlAndNavigate();
  }, []);

  // Clear search with performance optimization
  const handleClearSearch = useCallback(() => {
    setSearchTerm('');
    setSelectedTags([]);
    setNationality('');
    setCategory('');
    setSchool('');
    setBirthYearFrom('');
    setBirthYearTo('');
    setDeathYear('');
    setCurrentPage(1);
    
    // Clear URL params
    navigate({ search: '' });
  }, [navigate]);

  // Optimized page change handler
  const handlePageChange = useCallback((event: React.ChangeEvent<unknown>, value: number) => {
    setCurrentPage(value);
    
    const newParams = new URLSearchParams(location.search);
    newParams.set('page', value.toString());
    navigate({ search: newParams.toString() });
    
    // Scroll to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.search, navigate]);

  // Update URL and navigate
  const updateUrlAndNavigate = useCallback(() => {
    const newQueryParams = new URLSearchParams();
    
    if (currentPage > 1) newQueryParams.set('page', currentPage.toString());
    if (searchTerm) newQueryParams.set('search', searchTerm);
    if (selectedTags.length > 0) newQueryParams.set('tags', selectedTags.join(','));
    if (sortBy !== 'name') newQueryParams.set('sortBy', sortBy);
    if (sortOrder !== 'asc') newQueryParams.set('sortOrder', sortOrder);
    if (nationality) newQueryParams.set('nationality', nationality);
    if (category) newQueryParams.set('category', category);
    if (school) newQueryParams.set('school', school);
    if (birthYearFrom) newQueryParams.set('birthYearFrom', birthYearFrom);
    if (birthYearTo) newQueryParams.set('birthYearTo', birthYearTo);
    if (deathYear) newQueryParams.set('deathYear', deathYear);
    
    navigate({ search: newQueryParams.toString() });
  }, [currentPage, searchTerm, selectedTags, sortBy, sortOrder, nationality, category, school, birthYearFrom, birthYearTo, deathYear, navigate]);

  // Optimized sort handler
  const handleSortChange = useCallback((event: any) => {
    const [newSortBy, newSortOrder] = event.target.value.split('_');
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    setCurrentPage(1);
    updateUrlAndNavigate();
  }, [updateUrlAndNavigate]);

  // Force refresh handler
  const handleForceRefresh = useCallback(() => {
    loadArchitects(true);
  }, [loadArchitects]);

  // Performance monitor toggle
  const handleTogglePerformanceMonitor = useCallback(() => {
    setShowPerformanceMonitor(prev => !prev);
  }, []);

  // Architect click handler
  const handleArchitectClick = useCallback((architect: Architect) => {
    // Prefetch related data or trigger analytics
    console.log('Architect clicked:', architect.ZAT_ARCHITECT);
  }, []);

  // Current filters component
  const CurrentFilters = useMemo(() => {
    const activeFilters = [];
    
    if (nationality) activeFilters.push({ label: `国籍: ${nationality}`, onDelete: () => { setNationality(''); updateUrlAndNavigate(); } });
    if (birthYearFrom) activeFilters.push({ label: `生年: ${birthYearFrom}`, onDelete: () => { setBirthYearFrom(''); updateUrlAndNavigate(); } });
    if (deathYear) activeFilters.push({ label: `没年: ${deathYear}`, onDelete: () => { setDeathYear(''); updateUrlAndNavigate(); } });
    if (category) activeFilters.push({ label: `カテゴリー: ${category}`, onDelete: () => { setCategory(''); updateUrlAndNavigate(); } });
    if (school) activeFilters.push({ label: `学校: ${school}`, onDelete: () => { setSchool(''); updateUrlAndNavigate(); } });
    
    if (activeFilters.length === 0 && !searchTerm && selectedTags.length === 0) return null;
    
    return (
      <Box sx={{ mb: 3 }}>
        <Alert 
          severity="info" 
          action={
            <Button color="inherit" size="small" onClick={handleClearSearch}>
              クリア
            </Button>
          }
        >
          {activeFilters.length > 0 
            ? `フィルター: ${activeFilters.map(f => f.label).join(', ')}` 
            : searchTerm 
              ? `「${searchTerm}」で検索中` 
              : selectedTags.length > 0 
                ? `タグ「${selectedTags.join(', ')}」で絞り込み中`
                : ''}
        </Alert>
      </Box>
    );
  }, [nationality, birthYearFrom, deathYear, category, school, searchTerm, selectedTags, handleClearSearch, updateUrlAndNavigate]);

  // Loading skeleton
  const LoadingSkeleton = useMemo(() => (
    <Box sx={{ mt: 2 }}>
      {Array.from({ length: 6 }).map((_, index) => (
        <Box key={index} sx={{ mb: 2 }}>
          <Skeleton variant="rectangular" height={160} sx={{ borderRadius: 1 }} />
        </Box>
      ))}
    </Box>
  ), []);

  return (
    <Container maxWidth="lg" sx={{ py: 2 }} ref={containerRef}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" component="h1">
          建築家一覧
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="パフォーマンス監視">
            <IconButton 
              onClick={handleTogglePerformanceMonitor}
              color={showPerformanceMonitor ? 'primary' : 'default'}
            >
              <SpeedIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="更新">
            <IconButton onClick={handleForceRefresh} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Performance Monitor */}
      <Suspense fallback={<CircularProgress size={20} />}>
        <ArchitectsPerformanceMonitor 
          visible={showPerformanceMonitor}
          onToggleVisibility={setShowPerformanceMonitor}
        />
      </Suspense>

      {/* Search and Filters */}
      <Paper sx={{ p: 3, mb: 4 }}>
        {/* Search Bar */}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 3 }}>
          <TextField
            fullWidth
            label="建築家名、国籍、カテゴリーで検索"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton onClick={() => setSearchTerm('')} size="small">
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Button 
            variant="contained" 
            onClick={handleSearch}
            disabled={searching}
            sx={{ minWidth: '120px' }}
          >
            {searching ? <CircularProgress size={20} /> : '検索'}
          </Button>
        </Box>
        
        {/* Tags and Sort */}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, mb: 3, alignItems: 'flex-start' }}>
          {/* Tags */}
          <Autocomplete
            multiple
            id="tags-selector"
            options={availableTags}
            value={selectedTags}
            onChange={(event, newTags) => setSelectedTags(newTags)}
            fullWidth
            renderInput={(params) => (
              <TextField
                {...params}
                variant="outlined"
                label="タグで絞り込み"
                placeholder="タグを選択"
              />
            )}
          />
          
          {/* Sort */}
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel id="sort-select-label">並び替え</InputLabel>
            <Select
              labelId="sort-select-label"
              value={`${sortBy}_${sortOrder}`}
              label="並び替え"
              onChange={handleSortChange}
            >
              <MenuItem value="name_asc">名前 (昇順)</MenuItem>
              <MenuItem value="name_desc">名前 (降順)</MenuItem>
              <MenuItem value="birthYear_asc">生年 (昇順)</MenuItem>
              <MenuItem value="birthYear_desc">生年 (降順)</MenuItem>
              <MenuItem value="nationality_asc">国籍 (昇順)</MenuItem>
              <MenuItem value="nationality_desc">国籍 (降順)</MenuItem>
            </Select>
          </FormControl>
        </Box>
        
        {/* Current Filters */}
        {CurrentFilters}

        {/* Results Summary */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {totalItems.toLocaleString()}人の建築家
            {searching && ' (検索中...)'}
          </Typography>
          {totalPages > 1 && (
            <Pagination 
              count={totalPages} 
              page={currentPage} 
              onChange={handlePageChange} 
              color="primary"
              size="small"
              disabled={loading}
            />
          )}
        </Box>
      </Paper>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Main Content */}
      {loading && currentPage === 1 ? (
        LoadingSkeleton
      ) : architects.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6">
            建築家が見つかりませんでした
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            検索条件を変更してお試しください
          </Typography>
        </Box>
      ) : (
        <Box sx={{ mb: 4 }}>
          <Suspense fallback={LoadingSkeleton}>
            <VirtualizedArchitectsList
              architects={architects}
              height={virtualScrollHeight}
              onItemClick={handleArchitectClick}
              loading={loading}
              loadingCount={isMobile ? 6 : 12}
            />
          </Suspense>
        </Box>
      )}
      
      {/* Bottom Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination 
            count={totalPages} 
            page={currentPage} 
            onChange={handlePageChange} 
            color="primary"
            disabled={loading}
            showFirstButton
            showLastButton
          />
        </Box>
      )}

      {/* Floating Performance Button for Mobile */}
      {isMobile && (
        <Fab
          color="primary"
          size="small"
          onClick={handleTogglePerformanceMonitor}
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            zIndex: 1000,
          }}
        >
          <SpeedIcon />
        </Fab>
      )}
    </Container>
  );
});

OptimizedArchitectsPage.displayName = 'OptimizedArchitectsPage';

export default OptimizedArchitectsPage;