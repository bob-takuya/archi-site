import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Box, 
  Grid, 
  Paper, 
  Card,
  CardContent,
  CardActionArea,
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
  Popover,
  Collapse,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Badge as MuiBadge,
  Tooltip,
  Drawer,
  Stack,
  Skeleton,
  ToggleButton,
  ToggleButtonGroup,
  Fade,
  Zoom
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import SortIcon from '@mui/icons-material/Sort';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import FilterListIcon from '@mui/icons-material/FilterList';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import CategoryIcon from '@mui/icons-material/Category';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import InsightsIcon from '@mui/icons-material/Insights';
import TagIcon from '@mui/icons-material/Tag';
import CloseIcon from '@mui/icons-material/Close';
import ClearIcon from '@mui/icons-material/Clear';
import GridViewIcon from '@mui/icons-material/GridView';
import MapIcon from '@mui/icons-material/Map';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import { 
  getAllArchitectures, 
  searchArchitectures, 
  getResearchAnalytics,
  ResearchAnalytics 
} from '../services/api/FastArchitectureService';
import EnhancedMap, { MapMarker, MapFilters } from '../components/EnhancedMap';

// Unified filter state interface
interface UnifiedFilterState {
  searchQuery: string;
  selectedArchitect?: string;
  selectedCategory?: string;
  selectedPrefecture?: string;
  yearRange?: [number, number];
  selectedTags: string[];
  sortBy: 'year_desc' | 'year_asc' | 'name_asc';
  viewMode: 'grid' | 'list' | 'map';
  currentPage: number;
  itemsPerPage: number;
  mapBounds?: L.LatLngBounds;
  mapZoom?: number;
  mapCenter?: [number, number];
  showClusters: boolean;
}

interface AutocompleteSuggestion {
  label: string;
  value: string;
  category: string;
  icon: string;
  count?: number;
}

const ArchitecturePageWithMap = () => {
  // State management
  const [architectures, setArchitectures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mapLoading, setMapLoading] = useState(false);
  const [researchLoading, setResearchLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [searchValue, setSearchValue] = useState<AutocompleteSuggestion | null>(null);
  const [searchInputValue, setSearchInputValue] = useState('');
  const [researchData, setResearchData] = useState<ResearchAnalytics | null>(null);
  const [showInsights, setShowInsights] = useState(true);
  const [activeFilters, setActiveFilters] = useState<{type: string, value: string, label: string}[]>([]);
  
  // Unified filter state
  const [filters, setFilters] = useState<UnifiedFilterState>({
    searchQuery: '',
    selectedTags: [],
    sortBy: 'year_desc',
    viewMode: 'grid',
    currentPage: 1,
    itemsPerPage: 12,
    showClusters: true,
  });

  const location = useLocation();
  const navigate = useNavigate();

  // Compute items per page based on view mode
  const itemsPerPage = useMemo(() => {
    switch (filters.viewMode) {
      case 'list':
        return 20;
      case 'map':
        return 100; // Load more for map view
      default:
        return 12;
    }
  }, [filters.viewMode]);

  // Save view preference to localStorage
  useEffect(() => {
    const savedViewMode = localStorage.getItem('preferredViewMode');
    if (savedViewMode && ['grid', 'list', 'map'].includes(savedViewMode)) {
      setFilters(prev => ({ ...prev, viewMode: savedViewMode as 'grid' | 'list' | 'map' }));
    }
  }, []);

  // Research data initial load
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setResearchLoading(true);
        const analytics = await getResearchAnalytics();
        setResearchData(analytics);
      } catch (error) {
        console.error('初期データ取得エラー:', error);
      } finally {
        setResearchLoading(false);
      }
    };
    fetchInitialData();
  }, []);
  
  // Create autocomplete suggestions from research data
  const autocompleteSuggestions = useMemo(() => {
    if (!researchData) return [];
    
    const suggestions: AutocompleteSuggestion[] = [];
    
    // Award suggestions
    researchData.awards.slice(0, 5).forEach(award => {
      suggestions.push({
        label: award.name,
        value: `tag:${award.name}`,
        category: '建築賞',
        icon: '🏆',
        count: award.count
      });
    });
    
    // Top architects
    researchData.architects.slice(0, 10).forEach(architect => {
      suggestions.push({
        label: architect.name,
        value: `architect:${architect.name}`,
        category: '建築家',
        icon: '👨‍💼',
        count: architect.projectCount
      });
    });
    
    // Popular categories
    researchData.buildingTypeEvolution.slice(0, 8).forEach(type => {
      suggestions.push({
        label: type.category,
        value: `category:${type.category}`,
        category: 'カテゴリ',
        icon: '🏛️',
        count: type.totalCount
      });
    });
    
    // Major prefectures
    researchData.regionalAnalysis.slice(0, 8).forEach(region => {
      suggestions.push({
        label: region.prefecture,
        value: `prefecture:${region.prefecture}`,
        category: '地域',
        icon: '📍',
        count: region.projectCount
      });
    });
    
    // Decades
    researchData.temporalAnalysis.forEach(period => {
      const year = period.decade.replace('年代', '');
      suggestions.push({
        label: period.decade,
        value: `year:${year}`,
        category: '年代',
        icon: '📅',
        count: period.projectCount
      });
    });
    
    return suggestions;
  }, [researchData]);

  // Quick insights from research data
  const quickInsights = useMemo(() => {
    if (!researchData) return null;
    
    return {
      topAwards: researchData.awards.slice(0, 3),
      topArchitects: researchData.architects.slice(0, 5),
      popularCategories: researchData.buildingTypeEvolution.slice(0, 5),
      recentTrends: researchData.temporalAnalysis.slice(-3).reverse()
    };
  }, [researchData]);

  // Parse URL parameters on mount and when location changes
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const filters: {type: string, value: string, label: string}[] = [];
    let searchTerm = '';
    
    // Parse all possible filters
    const filterTypes = [
      { param: 'tag', type: '賞/タグ', prefix: 'tag:' },
      { param: 'architect', type: '建築家', prefix: 'architect:' },
      { param: 'category', type: 'カテゴリ', prefix: 'category:' },
      { param: 'prefecture', type: '地域', prefix: 'prefecture:' },
      { param: 'year', type: '年', prefix: 'year:' }
    ];
    
    filterTypes.forEach(({ param, type, prefix }) => {
      const value = queryParams.get(param);
      if (value) {
        filters.push({ type, value, label: value });
        if (!searchTerm) {
          searchTerm = `${prefix}${value}`;
        }
      }
    });
    
    // Handle general search
    const search = queryParams.get('search');
    if (search && !searchTerm) {
      searchTerm = search;
      const suggestion = autocompleteSuggestions.find(s => s.value === search);
      if (suggestion) {
        setSearchValue(suggestion);
      } else {
        setSearchInputValue(search);
      }
    }
    
    const sort = queryParams.get('sort');
    if (sort) {
      setFilters(prev => ({ ...prev, sortBy: sort as any }));
    }
    
    setActiveFilters(filters);
    
    if (searchTerm || filters.length > 0) {
      fetchArchitectures(1, searchTerm || filters[0]?.prefix + filters[0]?.value, sort || filters.sortBy);
    } else {
      fetchArchitectures(1, '', sort || filters.sortBy);
    }
  }, [location.search, autocompleteSuggestions]);

  // Fetch architectures
  const fetchArchitectures = async (page: number, search = '', sort = filters.sortBy) => {
    setLoading(true);
    if (filters.viewMode === 'map') {
      setMapLoading(true);
    }
    
    try {
      let result;
      
      // Parse search query and call appropriate method
      if (!search || search.trim() === '') {
        result = await getAllArchitectures(page, itemsPerPage);
      } else if (search.startsWith('tag:')) {
        const tag = search.substring(4).trim();
        result = await searchArchitectures('', { tag }, page, itemsPerPage);
      } else if (search.startsWith('year:')) {
        const year = parseInt(search.substring(5).trim());
        result = await searchArchitectures('', { year }, page, itemsPerPage);
      } else if (search.startsWith('architect:')) {
        const architect = search.substring(10).trim();
        result = await searchArchitectures('', { architect }, page, itemsPerPage);
      } else if (search.startsWith('category:')) {
        const category = search.substring(9).trim();
        result = await searchArchitectures('', { category }, page, itemsPerPage);
      } else if (search.startsWith('prefecture:')) {
        const prefecture = search.substring(11).trim();
        result = await searchArchitectures(prefecture, {}, page, itemsPerPage);
      } else {
        result = await searchArchitectures(search, {}, page, itemsPerPage);
      }
      
      setArchitectures(result.results);
      setTotalItems(result.total);
      setFilters(prev => ({ ...prev, currentPage: page }));
    } catch (error) {
      console.error('Error fetching architectures:', error);
      setArchitectures([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
      setMapLoading(false);
    }
  };

  // Handle page change
  const handlePageChange = (event: any, value: number) => {
    setFilters(prev => ({ ...prev, currentPage: value }));
    const searchTerm = searchValue?.value || searchInputValue;
    fetchArchitectures(value, searchTerm, filters.sortBy);
    window.scrollTo(0, 0);
  };

  // Handle search
  const handleSearch = (value: AutocompleteSuggestion | null) => {
    setSearchValue(value);
    
    if (value) {
      const queryParams = new URLSearchParams();
      const [type, ...valueParts] = value.value.split(':');
      const searchValue = valueParts.join(':');
      
      if (type === 'tag') {
        queryParams.set('tag', searchValue);
      } else if (type === 'architect') {
        queryParams.set('architect', searchValue);
      } else if (type === 'category') {
        queryParams.set('category', searchValue);
      } else if (type === 'prefecture') {
        queryParams.set('prefecture', searchValue);
      } else if (type === 'year') {
        queryParams.set('year', searchValue);
      } else {
        queryParams.set('search', value.value);
      }
      
      if (filters.sortBy !== 'year_desc') {
        queryParams.set('sort', filters.sortBy);
      }
      
      navigate({ search: queryParams.toString() });
    } else if (searchInputValue) {
      const queryParams = new URLSearchParams();
      queryParams.set('search', searchInputValue);
      if (filters.sortBy !== 'year_desc') {
        queryParams.set('sort', filters.sortBy);
      }
      navigate({ search: queryParams.toString() });
    }
  };

  // Handle sort change
  const handleSortChange = (event: any) => {
    const newSort = event.target.value;
    setFilters(prev => ({ ...prev, sortBy: newSort }));
    
    const queryParams = new URLSearchParams(location.search);
    if (newSort !== 'year_desc') {
      queryParams.set('sort', newSort);
    } else {
      queryParams.delete('sort');
    }
    
    navigate({ search: queryParams.toString() });
  };

  // Handle view mode change
  const handleViewModeChange = (event: React.MouseEvent<HTMLElement>, newMode: string | null) => {
    if (newMode && newMode !== filters.viewMode) {
      setFilters(prev => ({ ...prev, viewMode: newMode as 'grid' | 'list' | 'map' }));
      localStorage.setItem('preferredViewMode', newMode);
      
      // If switching to map view for the first time, load more data
      if (newMode === 'map' && architectures.length < 100) {
        const searchTerm = searchValue?.value || searchInputValue;
        fetchArchitectures(1, searchTerm, filters.sortBy);
      }
    }
  };

  // Handle clear filters
  const handleClearFilters = () => {
    setSearchValue(null);
    setSearchInputValue('');
    setActiveFilters([]);
    setFilters(prev => ({ ...prev, sortBy: 'year_desc', currentPage: 1 }));
    navigate({ search: '' });
  };

  // Handle remove filter
  const handleRemoveFilter = (filterToRemove: {type: string, value: string}) => {
    const queryParams = new URLSearchParams(location.search);
    
    const filterTypes = ['tag', 'architect', 'category', 'prefecture', 'year'];
    filterTypes.forEach(type => {
      if (queryParams.get(type) === filterToRemove.value) {
        queryParams.delete(type);
      }
    });
    
    navigate({ search: queryParams.toString() });
  };

  // Handle quick filter
  const handleQuickFilter = (type: string, value: string) => {
    const queryParams = new URLSearchParams();
    
    if (type === 'award') {
      queryParams.set('tag', value);
    } else if (type === 'architect') {
      queryParams.set('architect', value);
    } else if (type === 'category') {
      queryParams.set('category', value);
    } else if (type === 'decade') {
      queryParams.set('year', value.replace('年代', ''));
    }
    
    if (filters.sortBy !== 'year_desc') {
      queryParams.set('sort', filters.sortBy);
    }
    
    navigate({ search: queryParams.toString() });
  };

  // Convert architectures to map markers
  const mapMarkers: MapMarker[] = useMemo(() => {
    return architectures
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
      }));
  }, [architectures]);

  // Map filters based on active filters
  const mapFilters: MapFilters = useMemo(() => {
    const filters: MapFilters = {};
    
    activeFilters.forEach(filter => {
      if (filter.type === 'カテゴリ') {
        filters.categories = [...(filters.categories || []), filter.value];
      } else if (filter.type === '賞/タグ') {
        filters.awards = [...(filters.awards || []), filter.value];
      } else if (filter.type === '建築家') {
        filters.architects = [...(filters.architects || []), filter.value];
      }
    });
    
    return filters;
  }, [activeFilters]);

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          建築作品一覧
        </Typography>
        <ToggleButtonGroup
          value={filters.viewMode}
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
      </Box>

      <Grid container spacing={3}>
        {/* Main Content */}
        <Grid item xs={12} lg={showInsights && filters.viewMode !== 'map' ? 9 : 12}>
          <Paper sx={{ p: 3, mb: 3 }}>
            {/* Enhanced Search Bar */}
            <Box sx={{ mb: 3 }}>
              <Autocomplete
                value={searchValue}
                onChange={(event, newValue) => setSearchValue(newValue)}
                inputValue={searchInputValue}
                onInputChange={(event, newInputValue) => setSearchInputValue(newInputValue)}
                options={autocompleteSuggestions}
                groupBy={(option) => option.category}
                getOptionLabel={(option) => option.label}
                renderOption={(props, option) => (
                  <Box component="li" {...props}>
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                      <Typography sx={{ mr: 1 }}>{option.icon}</Typography>
                      <Typography sx={{ flexGrow: 1 }}>{option.label}</Typography>
                      {option.count && (
                        <Chip label={`${option.count}件`} size="small" />
                      )}
                    </Box>
                  </Box>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="検索（建築賞、建築家、カテゴリ、地域、年代）"
                    placeholder="例: 日本建築学会賞、隈研吾、美術館、東京都、1990"
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
                sx={{ flexGrow: 1 }}
              />
              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <Button 
                  variant="contained" 
                  onClick={() => handleSearch(searchValue)}
                  disabled={!searchValue && !searchInputValue}
                >
                  検索
                </Button>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>並び替え</InputLabel>
                  <Select
                    value={filters.sortBy}
                    label="並び替え"
                    onChange={handleSortChange}
                    startAdornment={<SortIcon sx={{ mr: 1, color: 'action.active' }} />}
                  >
                    <MenuItem value="year_desc">新しい順</MenuItem>
                    <MenuItem value="year_asc">古い順</MenuItem>
                    <MenuItem value="name_asc">名前順</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Box>

            {/* Active Filters */}
            {activeFilters.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <FilterListIcon color="action" />
                  <Typography variant="body2" color="text.secondary">
                    絞り込み条件:
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {activeFilters.map((filter, index) => (
                    <Chip
                      key={index}
                      label={`${filter.type}: ${filter.label}`}
                      onDelete={() => handleRemoveFilter(filter)}
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                  <Button
                    size="small"
                    startIcon={<ClearIcon />}
                    onClick={handleClearFilters}
                  >
                    すべてクリア
                  </Button>
                </Box>
              </Box>
            )}

            {/* Results Summary */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {totalItems.toLocaleString()}件の建築作品
                {activeFilters.length > 0 && ' (絞り込み結果)'}
                {filters.viewMode === 'map' && mapMarkers.length < architectures.length && 
                  ` - ${mapMarkers.length}件を地図に表示`}
              </Typography>
            </Box>
          </Paper>

          {/* Content based on view mode */}
          {loading && filters.viewMode !== 'map' ? (
            <Grid container spacing={2}>
              {[...Array(itemsPerPage)].map((_, i) => (
                <Grid 
                  item 
                  xs={12} 
                  sm={filters.viewMode === 'list' ? 12 : 6} 
                  md={filters.viewMode === 'list' ? 12 : 4} 
                  key={i}
                >
                  <Skeleton variant="rectangular" height={filters.viewMode === 'list' ? 100 : 300} />
                </Grid>
              ))}
            </Grid>
          ) : filters.viewMode === 'map' ? (
            <Fade in={true} timeout={500}>
              <Paper sx={{ height: '600px', overflow: 'hidden', position: 'relative' }}>
                <EnhancedMap
                  markers={mapMarkers}
                  center={
                    architectures.filter(a => a.latitude && a.longitude).length > 0
                      ? undefined
                      : [35.6762, 139.6503]
                  }
                  zoom={activeFilters.length > 0 ? 8 : 6}
                  height="600px"
                  showClusters={filters.showClusters}
                  filters={mapFilters}
                  loading={mapLoading}
                  onMarkerClick={(marker) => {
                    // Optional: Update URL to show selected building
                    console.log('Marker clicked:', marker);
                  }}
                  onBoundsChange={(bounds, zoom) => {
                    // Optional: Load more data based on visible area
                    console.log('Map bounds changed:', bounds, zoom);
                  }}
                />
              </Paper>
            </Fade>
          ) : (
            <>
              <Grid container spacing={2}>
                {architectures.map((architecture) => (
                  <Grid 
                    item 
                    xs={12} 
                    sm={filters.viewMode === 'list' ? 12 : 6} 
                    md={filters.viewMode === 'list' ? 12 : 4} 
                    key={architecture.id}
                  >
                    {filters.viewMode === 'list' ? (
                      // List view card
                      <Card>
                        <CardActionArea component={RouterLink} to={`/architecture/${architecture.id}`}>
                          <CardContent sx={{ display: 'flex', gap: 2 }}>
                            <Box sx={{ flexGrow: 1 }}>
                              <Typography variant="h6" component="h2" gutterBottom>
                                {architecture.title}
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                                {architecture.architect && (
                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <PersonIcon sx={{ mr: 0.5, color: 'text.secondary', fontSize: 20 }} />
                                    <Typography variant="body2" color="text.secondary">
                                      {architecture.architect}
                                    </Typography>
                                  </Box>
                                )}
                                {architecture.year && (
                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <CalendarTodayIcon sx={{ mr: 0.5, color: 'text.secondary', fontSize: 20 }} />
                                    <Typography variant="body2" color="text.secondary">
                                      {architecture.year}年
                                    </Typography>
                                  </Box>
                                )}
                                {architecture.address && (
                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <LocationOnIcon sx={{ mr: 0.5, color: 'text.secondary', fontSize: 20 }} />
                                    <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 200 }}>
                                      {architecture.address}
                                    </Typography>
                                  </Box>
                                )}
                                {architecture.category && (
                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <CategoryIcon sx={{ mr: 0.5, color: 'text.secondary', fontSize: 20 }} />
                                    <Typography variant="body2" color="text.secondary">
                                      {architecture.category}
                                    </Typography>
                                  </Box>
                                )}
                              </Box>
                            </Box>
                            {architecture.tags && (
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Chip 
                                  icon={<EmojiEventsIcon />}
                                  label={architecture.tags} 
                                  size="small" 
                                  color="warning" 
                                  variant="outlined"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleQuickFilter('award', architecture.tags);
                                  }}
                                />
                              </Box>
                            )}
                          </CardContent>
                        </CardActionArea>
                      </Card>
                    ) : (
                      // Grid view card
                      <Card>
                        <CardActionArea component={RouterLink} to={`/architecture/${architecture.id}`}>
                          <CardContent>
                            <Typography variant="h6" component="h2" gutterBottom>
                              {architecture.title}
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                              {architecture.architect && (
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <PersonIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                                  <Typography variant="body2" color="text.secondary">
                                    {architecture.architect}
                                  </Typography>
                                </Box>
                              )}
                              {architecture.year && (
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <CalendarTodayIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                                  <Typography variant="body2" color="text.secondary">
                                    {architecture.year}年
                                  </Typography>
                                </Box>
                              )}
                              {architecture.address && (
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <LocationOnIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                                  <Typography variant="body2" color="text.secondary" noWrap>
                                    {architecture.address}
                                  </Typography>
                                </Box>
                              )}
                              {architecture.category && (
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <CategoryIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                                  <Typography variant="body2" color="text.secondary">
                                    {architecture.category}
                                  </Typography>
                                </Box>
                              )}
                              {architecture.tags && (
                                <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                                  <EmojiEventsIcon sx={{ mr: 1, color: 'warning.main', fontSize: 20 }} />
                                  <Chip 
                                    label={architecture.tags} 
                                    size="small" 
                                    color="warning" 
                                    variant="outlined"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      handleQuickFilter('award', architecture.tags);
                                    }}
                                  />
                                </Box>
                              )}
                            </Box>
                          </CardContent>
                        </CardActionArea>
                      </Card>
                    )}
                  </Grid>
                ))}
              </Grid>

              {/* Pagination */}
              {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                  <Pagination
                    count={totalPages}
                    page={filters.currentPage}
                    onChange={handlePageChange}
                    color="primary"
                    size="large"
                  />
                </Box>
              )}
            </>
          )}
        </Grid>

        {/* Research Insights Sidebar (hidden in map view) */}
        {showInsights && filters.viewMode !== 'map' && (
          <Grid item xs={12} lg={3}>
            <Paper sx={{ p: 2, position: 'sticky', top: 20 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                  <InsightsIcon sx={{ mr: 1 }} />
                  研究インサイト
                </Typography>
                <IconButton 
                  size="small" 
                  onClick={() => setShowInsights(false)}
                >
                  <CloseIcon />
                </IconButton>
              </Box>

              {researchLoading ? (
                <Box>
                  <Skeleton variant="text" height={30} />
                  <Skeleton variant="text" height={30} />
                  <Skeleton variant="text" height={30} />
                </Box>
              ) : quickInsights && (
                <Stack spacing={3}>
                  {/* Top Awards */}
                  <Box>
                    <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                      <EmojiEventsIcon sx={{ mr: 1, color: 'warning.main' }} />
                      主要建築賞
                    </Typography>
                    <List dense>
                      {quickInsights.topAwards.map((award, index) => (
                        <ListItem 
                          key={index}
                          button
                          onClick={() => handleQuickFilter('award', award.name)}
                        >
                          <ListItemText 
                            primary={award.name}
                            secondary={`${award.count}作品`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>

                  <Divider />

                  {/* Top Architects */}
                  <Box>
                    <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                      <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
                      注目建築家
                    </Typography>
                    <List dense>
                      {quickInsights.topArchitects.map((architect, index) => (
                        <ListItem 
                          key={index}
                          button
                          onClick={() => handleQuickFilter('architect', architect.name)}
                        >
                          <ListItemText 
                            primary={architect.name}
                            secondary={`${architect.projectCount}作品 (${architect.yearSpan.start}-${architect.yearSpan.end})`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>

                  <Divider />

                  {/* Popular Categories */}
                  <Box>
                    <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                      <CategoryIcon sx={{ mr: 1, color: 'secondary.main' }} />
                      人気カテゴリ
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {quickInsights.popularCategories.map((cat, index) => (
                        <Chip
                          key={index}
                          label={`${cat.category} (${cat.totalCount})`}
                          size="small"
                          onClick={() => handleQuickFilter('category', cat.category)}
                        />
                      ))}
                    </Box>
                  </Box>

                  <Divider />

                  {/* Recent Trends */}
                  <Box>
                    <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                      <TrendingUpIcon sx={{ mr: 1, color: 'success.main' }} />
                      時代トレンド
                    </Typography>
                    <List dense>
                      {quickInsights.recentTrends.map((trend, index) => (
                        <ListItem 
                          key={index}
                          button
                          onClick={() => handleQuickFilter('decade', trend.decade)}
                        >
                          <ListItemText 
                            primary={trend.decade}
                            secondary={`${trend.projectCount}件`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                </Stack>
              )}
            </Paper>
          </Grid>
        )}
      </Grid>
    </Container>
  );
};

export default ArchitecturePageWithMap;