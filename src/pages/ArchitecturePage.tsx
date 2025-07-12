import React, { useState, useEffect, useMemo } from 'react';
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
  ToggleButtonGroup
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
import ViewListIcon from '@mui/icons-material/ViewList';
import MapIcon from '@mui/icons-material/Map';
import { 
  getAllArchitectures, 
  searchArchitectures, 
  getResearchAnalytics,
  ResearchAnalytics 
} from '../services/api/FastArchitectureService';
import MapWithClustering from '../components/MapWithClustering';
import TouchOptimizedSearchBar from '../components/ui/TouchOptimizedSearchBar';
import { useGestureNavigation } from '../hooks/useGestureNavigation';

interface AutocompleteSuggestion {
  label: string;
  value: string;
  category: string;
  icon: string;
  count?: number;
  type?: 'recent' | 'trending' | 'suggestion';
}

const ArchitecturePageEnhanced = () => {
  const [architectures, setArchitectures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [researchLoading, setResearchLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchValue, setSearchValue] = useState<AutocompleteSuggestion | null>(null);
  const [searchInputValue, setSearchInputValue] = useState('');
  const [sortBy, setSortBy] = useState('year_desc');
  const [researchData, setResearchData] = useState<ResearchAnalytics | null>(null);
  const [showInsights, setShowInsights] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'map'>('grid');
  const [activeFilters, setActiveFilters] = useState<{type: string, value: string, label: string}[]>([]);
  const [recentSearches, setRecentSearches] = useState<AutocompleteSuggestion[]>([]);
  const [trendingSearches, setTrendingSearches] = useState<AutocompleteSuggestion[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const itemsPerPage = viewMode === 'grid' ? 12 : viewMode === 'list' ? 20 : 200; // Show more results on map to see spatial distribution
  const location = useLocation();
  const navigate = useNavigate();

  // Gesture navigation setup
  const { gestureRef } = useGestureNavigation({
    onSwipeLeft: () => {
      // Navigate to next page if available
      if (currentPage < Math.ceil(totalItems / itemsPerPage)) {
        handlePageChange(null, currentPage + 1);
      }
    },
    onSwipeRight: () => {
      // Navigate to previous page if available
      if (currentPage > 1) {
        handlePageChange(null, currentPage - 1);
      }
    },
    onSwipeUp: () => {
      // Switch view mode
      const modes: Array<'grid' | 'list' | 'map'> = ['grid', 'list', 'map'];
      const currentIndex = modes.indexOf(viewMode);
      const nextIndex = (currentIndex + 1) % modes.length;
      setViewMode(modes[nextIndex]);
    },
    onSwipeDown: () => {
      // Clear search or go back
      if (searchValue || searchInputValue || activeFilters.length > 0) {
        handleClearFilters();
      }
    }
  });

  // Recent searches management
  const addToRecentSearches = useCallback((search: AutocompleteSuggestion) => {
    setRecentSearches(prev => {
      const filtered = prev.filter(item => item.value !== search.value);
      return [search, ...filtered].slice(0, 5); // Keep only 5 recent searches
    });
    
    // Save to localStorage
    try {
      const updated = [search, ...recentSearches.filter(item => item.value !== search.value)].slice(0, 5);
      localStorage.setItem('archi-recent-searches', JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save recent searches to localStorage');
    }
  }, [recentSearches]);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('archi-recent-searches');
      if (saved) {
        setRecentSearches(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Failed to load recent searches from localStorage');
    }
  }, []);

  // Generate trending searches from research data
  useEffect(() => {
    if (researchData) {
      const trending: AutocompleteSuggestion[] = [
        ...researchData.architects.slice(0, 3).map(architect => ({
          label: architect.name,
          value: `architect:${architect.name}`,
          category: '建築家',
          icon: '👨‍🎨',
          count: architect.count,
          type: 'trending' as const
        })),
        ...researchData.regionalAnalysis.slice(0, 2).map(region => ({
          label: region.prefecture,
          value: `prefecture:${region.prefecture}`,
          category: '地域',
          icon: '📍',
          count: region.projectCount,
          type: 'trending' as const
        }))
      ];
      setTrendingSearches(trending);
    }
  }, [researchData]);

  // Enhanced search handling
  const handleOptimizedSearch = useCallback((value: AutocompleteSuggestion | null) => {
    if (value) {
      addToRecentSearches(value);
    }
    handleSearch(value);
  }, [addToRecentSearches, handleSearch]);

  // Enhanced input change with loading state
  const handleOptimizedInputChange = useCallback((value: string) => {
    setSearchLoading(true);
    setSearchInputValue(value);
    
    // Debounce search loading
    setTimeout(() => {
      setSearchLoading(false);
    }, 300);
  }, []);

  // Voice search handler
  const handleVoiceSearch = useCallback(() => {
    console.log('Voice search activated');
    // Voice search functionality is built into TouchOptimizedSearchBar
  }, []);

  // Camera search handler  
  const handleCameraSearch = useCallback(() => {
    console.log('Camera search activated');
    
    // Create file input for image selection
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.capture = 'environment'; // Use rear camera on mobile
    
    fileInput.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          // Basic image processing - extract text/metadata
          const imageUrl = URL.createObjectURL(file);
          
          // For now, show a placeholder message
          // In a real implementation, you would:
          // 1. Use OCR to extract text from the image
          // 2. Use computer vision to identify architectural elements
          // 3. Search based on extracted features
          
          const searchQuery = prompt(
            '画像が選択されました。検索キーワードを入力してください（将来的には自動認識されます）:'
          );
          
          if (searchQuery) {
            setSearchInputValue(searchQuery);
            handleOptimizedInputChange(searchQuery);
          }
          
          URL.revokeObjectURL(imageUrl);
        } catch (error) {
          console.error('Camera search error:', error);
          alert('画像の処理中にエラーが発生しました');
        }
      }
    };
    
    fileInput.click();
  }, [handleOptimizedInputChange]);

  // 研究データの初期ロード
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

  const fetchArchitectures = async (page: number, search = '', sort = sortBy) => {
    setLoading(true);
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
      setCurrentPage(page);
    } catch (error) {
      console.error('Error fetching architectures:', error);
      setArchitectures([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // URLからクエリパラメータを解析
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
      // Try to find matching suggestion
      const suggestion = autocompleteSuggestions.find(s => s.value === search);
      if (suggestion) {
        setSearchValue(suggestion);
      } else {
        setSearchInputValue(search);
      }
    }
    
    const sort = queryParams.get('sort');
    if (sort) {
      setSortBy(sort);
    }
    
    setActiveFilters(filters);
    
    if (searchTerm || filters.length > 0) {
      fetchArchitectures(1, searchTerm || filters[0]?.prefix + filters[0]?.value, sort || sortBy);
    } else {
      fetchArchitectures(1, '', sort || sortBy);
    }
  }, [location.search, autocompleteSuggestions, sortBy]);

  const handlePageChange = (event: any, value: number) => {
    setCurrentPage(value);
    const searchTerm = searchValue?.value || searchInputValue;
    fetchArchitectures(value, searchTerm, sortBy);
    window.scrollTo(0, 0);
  };

  const handleSearch = (value: AutocompleteSuggestion | null) => {
    setSearchValue(value);
    
    if (value) {
      // Update URL and fetch
      const queryParams = new URLSearchParams();
      
      // Parse the search type and value
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
      
      if (sortBy !== 'year_desc') {
        queryParams.set('sort', sortBy);
      }
      
      navigate({ search: queryParams.toString() });
    } else if (searchInputValue) {
      // Free text search
      const queryParams = new URLSearchParams();
      queryParams.set('search', searchInputValue);
      if (sortBy !== 'year_desc') {
        queryParams.set('sort', sortBy);
      }
      navigate({ search: queryParams.toString() });
    }
  };

  const handleSortChange = (event: any) => {
    const newSort = event.target.value;
    setSortBy(newSort);
    
    const queryParams = new URLSearchParams(location.search);
    if (newSort !== 'year_desc') {
      queryParams.set('sort', newSort);
    } else {
      queryParams.delete('sort');
    }
    
    navigate({ search: queryParams.toString() });
  };

  const handleClearFilters = () => {
    setSearchValue(null);
    setSearchInputValue('');
    setActiveFilters([]);
    setSortBy('year_desc');
    navigate({ search: '' });
  };

  const handleRemoveFilter = (filterToRemove: {type: string, value: string}) => {
    const queryParams = new URLSearchParams(location.search);
    
    // Find and remove the specific filter
    const filterTypes = ['tag', 'architect', 'category', 'prefecture', 'year'];
    filterTypes.forEach(type => {
      if (queryParams.get(type) === filterToRemove.value) {
        queryParams.delete(type);
      }
    });
    
    navigate({ search: queryParams.toString() });
  };

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
    
    if (sortBy !== 'year_desc') {
      queryParams.set('sort', sortBy);
    }
    
    navigate({ search: queryParams.toString() });
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }} ref={gestureRef}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          建築作品一覧
        </Typography>
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={(e, newMode) => {
          if (newMode) {
            setViewMode(newMode);
            // Reload data if switching to map view to get more items
            if (newMode === 'map') {
              const searchTerm = searchValue?.value || searchInputValue;
              fetchArchitectures(currentPage, searchTerm, sortBy);
            }
          }
        }}
          size="small"
        >
          <ToggleButton value="grid" aria-label="カードビュー">
            <Tooltip title="カードビュー">
              <GridViewIcon />
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
        <Grid item xs={12} lg={showInsights ? 9 : 12}>
          <Paper sx={{ p: 3, mb: 3 }}>
            {/* Touch-Optimized Search Bar */}
            <Box sx={{ mb: 3 }}>
              <TouchOptimizedSearchBar
                value={searchValue}
                onSearch={handleOptimizedSearch}
                onInputChange={handleOptimizedInputChange}
                inputValue={searchInputValue}
                suggestions={autocompleteSuggestions}
                loading={searchLoading}
                placeholder="建築作品、建築家、場所を検索..."
                onVoiceSearch={handleVoiceSearch}
                onCameraSearch={handleCameraSearch}
                recentSearches={recentSearches}
                trendingSearches={trendingSearches}
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
                    value={sortBy}
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
                {viewMode === 'map' && architectures.filter(a => a.latitude && a.longitude).length < architectures.length && 
                  ` - ${architectures.filter(a => a.latitude && a.longitude).length}件を地図に表示`}
              </Typography>
            </Box>
          </Paper>

          {/* Architecture List/Grid/Map */}
          {loading ? (
            viewMode === 'list' ? (
              <Paper sx={{ p: 2 }}>
                {[...Array(itemsPerPage)].map((_, i) => (
                  <Box key={i} sx={{ mb: 2 }}>
                    <Skeleton variant="text" height={40} />
                    <Skeleton variant="text" height={20} width="60%" />
                  </Box>
                ))}
              </Paper>
            ) : viewMode === 'grid' ? (
              <Grid container spacing={2}>
                {[...Array(itemsPerPage)].map((_, i) => (
                  <Grid item xs={12} sm={6} md={4} key={i}>
                    <Skeleton variant="rectangular" height={300} />
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Skeleton variant="rectangular" height={600} />
            )
          ) : viewMode === 'list' ? (
            <Paper sx={{ p: 2 }}>
              <List>
                {architectures.map((architecture, index) => (
                  <React.Fragment key={architecture.id}>
                    <ListItem 
                      alignItems="flex-start"
                      component={RouterLink} 
                      to={`/architecture/${architecture.id}`}
                      sx={{ 
                        textDecoration: 'none', 
                        color: 'inherit',
                        '&:hover': {
                          backgroundColor: 'action.hover'
                        }
                      }}
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="h6" component="span">
                              {architecture.title}
                            </Typography>
                            {architecture.tags && (
                              <Chip 
                                label={architecture.tags} 
                                size="small" 
                                color="warning" 
                                variant="outlined"
                                icon={<EmojiEventsIcon />}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleQuickFilter('award', architecture.tags);
                                }}
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box sx={{ mt: 1 }}>
                            <Grid container spacing={2}>
                              {architecture.architect && (
                                <Grid item xs={12} sm={4}>
                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <PersonIcon sx={{ mr: 0.5, color: 'text.secondary', fontSize: 16 }} />
                                    <Typography variant="body2" color="text.secondary">
                                      {architecture.architect}
                                    </Typography>
                                  </Box>
                                </Grid>
                              )}
                              {architecture.year && (
                                <Grid item xs={12} sm={2}>
                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <CalendarTodayIcon sx={{ mr: 0.5, color: 'text.secondary', fontSize: 16 }} />
                                    <Typography variant="body2" color="text.secondary">
                                      {architecture.year}年
                                    </Typography>
                                  </Box>
                                </Grid>
                              )}
                              {architecture.category && (
                                <Grid item xs={12} sm={3}>
                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <CategoryIcon sx={{ mr: 0.5, color: 'text.secondary', fontSize: 16 }} />
                                    <Typography variant="body2" color="text.secondary">
                                      {architecture.category}
                                    </Typography>
                                  </Box>
                                </Grid>
                              )}
                              {architecture.address && (
                                <Grid item xs={12} sm={3}>
                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <LocationOnIcon sx={{ mr: 0.5, color: 'text.secondary', fontSize: 16 }} />
                                    <Typography variant="body2" color="text.secondary" noWrap>
                                      {architecture.address}
                                    </Typography>
                                  </Box>
                                </Grid>
                              )}
                            </Grid>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < architectures.length - 1 && <Divider component="li" />}
                  </React.Fragment>
                ))}
              </List>
            </Paper>
          ) : viewMode === 'map' ? (
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
                  activeFilters.some(f => f.type === '地域')
                    ? undefined // Let map auto-center on filtered markers
                    : architectures.filter(a => a.latitude && a.longitude).length > 0
                      ? undefined // Auto-center on all markers
                      : [35.6762, 139.6503] as [number, number] // Tokyo default
                }
                zoom={
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
            <>
              <Grid container spacing={2}>
                {architectures.map((architecture) => (
                  <Grid 
                    item 
                    xs={12} 
                    sm={6} 
                    md={4} 
                    key={architecture.id}
                  >
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
                  </Grid>
                ))}
              </Grid>

              {/* Pagination */}
              {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                  <Pagination
                    count={totalPages}
                    page={currentPage}
                    onChange={handlePageChange}
                    color="primary"
                    size="large"
                  />
                </Box>
              )}
            </>
          )}
          
          {/* Pagination for list view */}
          {viewMode === 'list' && totalPages > 1 && !loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={handlePageChange}
                color="primary"
                size="large"
              />
            </Box>
          )}
        </Grid>

        {/* Research Insights Sidebar */}
        {showInsights && (
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

export default ArchitecturePageEnhanced;