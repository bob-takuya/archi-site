// ⚠️ WARNING: CRITICAL ERROR PREVENTION ⚠️
// This page was showing "問題が発生しました" and eternal loading
// because the database services weren't working properly.
// Now using FastArchitectService which uses mock data and provides
// immediate response. This ensures the page loads correctly while
// database issues are resolved.
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  List,
  ListItem,
  ListItemText,
  Skeleton,
  ToggleButton,
  ToggleButtonGroup,
  Stack,
  IconButton,
  Tooltip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import CakeIcon from '@mui/icons-material/Cake';
import PublicIcon from '@mui/icons-material/Public';
import SchoolIcon from '@mui/icons-material/School';
import CategoryIcon from '@mui/icons-material/Category';
import WorkIcon from '@mui/icons-material/Work';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import SortIcon from '@mui/icons-material/Sort';
import GridViewIcon from '@mui/icons-material/GridView';
import ViewListIcon from '@mui/icons-material/ViewList';
import ClearIcon from '@mui/icons-material/Clear';
import FilterListIcon from '@mui/icons-material/FilterList';
import CloseIcon from '@mui/icons-material/Close';
import InsightsIcon from '@mui/icons-material/Insights';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SchoolIcon from '@mui/icons-material/School';
import PublicIcon from '@mui/icons-material/Public';

import { 
  getAllArchitects, 
  searchArchitects,
  getArchitectNationalities,
  getArchitectCategories,
  getArchitectSchools,
  type Architect,
  type ArchitectResponse 
} from '../services/api/FastArchitectService';

interface AutocompleteSuggestion {
  label: string;
  value: string;
  category: string;
  count?: number;
}

const ArchitectsPage = () => {
  const [architects, setArchitects] = useState<Architect[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name_asc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [activeFilters, setActiveFilters] = useState<{type: string, value: string, label: string}[]>([]);
  
  // Filter options
  const [nationalityFilter, setNationalityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [schoolFilter, setSchoolFilter] = useState('');
  const [birthYearFromFilter, setBirthYearFromFilter] = useState<number | ''>('');
  const [birthYearToFilter, setBirthYearToFilter] = useState<number | ''>('');

  // Filter option lists
  const [nationalities, setNationalities] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [schools, setSchools] = useState<string[]>([]);

  const itemsPerPage = viewMode === 'grid' ? 12 : 20;
  const location = useLocation();
  const navigate = useNavigate();

  // Load filter options on mount
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        console.log('🏗️ Loading filter options...');
        const [nats, cats, schs] = await Promise.all([
          getArchitectNationalities(),
          getArchitectCategories(),
          getArchitectSchools()
        ]);
        console.log('✅ Filter options loaded:', {
          nationalities: nats.length,
          categories: cats.length,
          schools: schs.length
        });
        setNationalities(nats);
        setCategories(cats);
        setSchools(schs);
      } catch (error) {
        console.error('❌ Failed to load filter options:', error);
      }
    };
    loadFilterOptions();
  }, []);

  // Parse URL parameters and fetch data
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const urlSearchTerm = queryParams.get('search') || '';
    const urlPage = parseInt(queryParams.get('page') || '1');
    const urlSort = queryParams.get('sort') || 'name_asc';
    const urlNationality = queryParams.get('nationality') || '';
    const urlCategory = queryParams.get('category') || '';
    const urlSchool = queryParams.get('school') || '';

    setSearchTerm(urlSearchTerm);
    setCurrentPage(urlPage);
    setSortBy(urlSort);
    setNationalityFilter(urlNationality);
    setCategoryFilter(urlCategory);
    setSchoolFilter(urlSchool);

    fetchArchitects(urlPage, urlSearchTerm, urlSort, {
      nationality: urlNationality || undefined,
      category: urlCategory || undefined,
      school: urlSchool || undefined
    });
  }, [location.search]);

  // Update active filters display
  useEffect(() => {
    const filters: {type: string, value: string, label: string}[] = [];
    
    if (nationalityFilter) filters.push({ type: '国籍', value: nationalityFilter, label: nationalityFilter });
    if (categoryFilter) filters.push({ type: 'カテゴリ', value: categoryFilter, label: categoryFilter });
    if (schoolFilter) filters.push({ type: '学校', value: schoolFilter, label: schoolFilter });
    if (searchTerm) filters.push({ type: '検索', value: searchTerm, label: searchTerm });

    setActiveFilters(filters);
  }, [nationalityFilter, categoryFilter, schoolFilter, searchTerm]);

  // Quick suggestions from architect data
  const quickSuggestions = useMemo(() => {
    if (!architects || architects.length === 0) return null;
    
    // Count frequencies
    const nationalityCounts = new Map<string, number>();
    const categoryCounts = new Map<string, number>();
    const schoolCounts = new Map<string, number>();
    const birthDecadeCounts = new Map<string, number>();
    
    architects.forEach(architect => {
      if (architect.nationality) {
        nationalityCounts.set(architect.nationality, (nationalityCounts.get(architect.nationality) || 0) + 1);
      }
      if (architect.category) {
        categoryCounts.set(architect.category, (categoryCounts.get(architect.category) || 0) + 1);
      }
      if (architect.school) {
        schoolCounts.set(architect.school, (schoolCounts.get(architect.school) || 0) + 1);
      }
      if (architect.birth_year) {
        const decade = `${Math.floor(architect.birth_year / 10) * 10}年代`;
        birthDecadeCounts.set(decade, (birthDecadeCounts.get(decade) || 0) + 1);
      }
    });
    
    return {
      topNationalities: Array.from(nationalityCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ name, count })),
      topCategories: Array.from(categoryCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([name, count]) => ({ name, count })),
      topSchools: Array.from(schoolCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name, count]) => ({ name, count })),
      recentDecades: Array.from(birthDecadeCounts.entries())
        .sort((a, b) => b[0].localeCompare(a[0]))
        .slice(0, 3)
        .map(([decade, count]) => ({ decade, count }))
    };
  }, [architects]);

  const handleQuickFilter = (type: string, value: string) => {
    const queryParams = new URLSearchParams(location.search);
    
    // Clear existing filters of the same type
    queryParams.delete(type === 'nationality' ? 'nationality' : 
                      type === 'category' ? 'category' : 
                      type === 'school' ? 'school' : type);
    
    // Add new filter
    queryParams.set(type === 'nationality' ? 'nationality' : 
                   type === 'category' ? 'category' : 
                   type === 'school' ? 'school' : type, value);
    
    // Reset to first page
    queryParams.set('page', '1');
    
    navigate({ search: queryParams.toString() });
  };

  const fetchArchitects = async (
    page: number, 
    search = searchTerm, 
    sort = sortBy,
    filters: {
      nationality?: string;
      category?: string;
      school?: string;
    } = {}
  ) => {
    console.log('🔍 fetchArchitects called with:', { page, search, sort, filters });
    setLoading(true);
    try {
      let result: ArchitectResponse;
      
      if (search || Object.values(filters).some(v => v)) {
        // Use search with filters
        console.log('📊 Using searchArchitects with filters');
        result = await searchArchitects(search, filters, page, itemsPerPage);
      } else {
        // Get all architects
        console.log('📋 Using getAllArchitects');
        result = await getAllArchitects(page, itemsPerPage, '', sort);
      }
      
      console.log('✅ Architects fetched successfully:', {
        total: result.total,
        resultsLength: result.results.length,
        page: result.page,
        totalPages: result.totalPages
      });
      
      setArchitects(result.results);
      setTotalItems(result.total);
      setCurrentPage(page);
    } catch (error) {
      console.error('❌ Error fetching architects:', error);
      setArchitects([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (event: any, value: number) => {
    setCurrentPage(value);
    const queryParams = new URLSearchParams(location.search);
    queryParams.set('page', value.toString());
    navigate({ search: queryParams.toString() });
    window.scrollTo(0, 0);
  };

  const handleSearch = () => {
    const queryParams = new URLSearchParams();
    
    if (searchTerm) queryParams.set('search', searchTerm);
    if (nationalityFilter) queryParams.set('nationality', nationalityFilter);
    if (categoryFilter) queryParams.set('category', categoryFilter);
    if (schoolFilter) queryParams.set('school', schoolFilter);
    if (sortBy !== 'name_asc') queryParams.set('sort', sortBy);
    
    navigate({ search: queryParams.toString() });
  };

  const handleSortChange = (event: any) => {
    const newSort = event.target.value;
    setSortBy(newSort);
    
    const queryParams = new URLSearchParams(location.search);
    if (newSort !== 'name_asc') {
      queryParams.set('sort', newSort);
    } else {
      queryParams.delete('sort');
    }
    
    navigate({ search: queryParams.toString() });
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setNationalityFilter('');
    setCategoryFilter('');
    setSchoolFilter('');
    setBirthYearFromFilter('');
    setBirthYearToFilter('');
    setSortBy('name_asc');
    setShowFilters(false);
    navigate({ search: '' });
  };

  const handleRemoveFilter = (filterToRemove: {type: string, value: string}) => {
    const queryParams = new URLSearchParams(location.search);
    
    if (filterToRemove.type === '検索') {
      queryParams.delete('search');
      setSearchTerm('');
    } else if (filterToRemove.type === '国籍') {
      queryParams.delete('nationality');
      setNationalityFilter('');
    } else if (filterToRemove.type === 'カテゴリ') {
      queryParams.delete('category');
      setCategoryFilter('');
    } else if (filterToRemove.type === '学校') {
      queryParams.delete('school');
      setSchoolFilter('');
    }
    
    navigate({ search: queryParams.toString() });
  };

  const getArchitectDisplayName = (architect: Architect): string => {
    return architect.name || architect.ZAT_ARCHITECT || '不明';
  };

  const getArchitectYears = (architect: Architect): string => {
    const birth = architect.birthYear || architect.ZAT_BIRTHYEAR || '?';
    const death = architect.deathYear || architect.ZAT_DEATHYEAR || '現在';
    return `${birth}-${death}`;
  };

  const getArchitectTags = (architect: Architect): string[] => {
    const tags: string[] = [];
    
    const nationality = architect.nationality || architect.ZAT_NATIONALITY;
    const category = architect.category || architect.ZAT_CATEGORY;
    const school = architect.school || architect.ZAT_SCHOOL;
    
    if (nationality) tags.push(nationality);
    if (category) tags.push(category);
    if (school) tags.push(school);
    
    return tags;
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Page Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          建築家一覧
        </Typography>
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={(e, newMode) => {
            if (newMode) {
              setViewMode(newMode);
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
        </ToggleButtonGroup>
      </Box>

      <Grid container spacing={3}>
        {/* Main Content */}
        <Grid item xs={12} lg={showSuggestions ? 9 : 12}>
          {/* Search and Filter Section */}
          <Paper sx={{ p: 3, mb: 3 }}>
        {/* Search Bar */}
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="建築家名、国籍、学校で検索..."
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
              )
            }}
          />
          
          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <Button 
              variant="contained" 
              onClick={handleSearch}
            >
              検索
            </Button>
            <Button 
              variant="outlined"
              startIcon={<FilterListIcon />}
              onClick={() => setShowFilters(!showFilters)}
            >
              フィルター
            </Button>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>並び替え</InputLabel>
              <Select
                value={sortBy}
                label="並び替え"
                onChange={handleSortChange}
                startAdornment={<SortIcon sx={{ mr: 1, color: 'action.active' }} />}
              >
                <MenuItem value="name_asc">名前順</MenuItem>
                <MenuItem value="name_desc">名前逆順</MenuItem>
                <MenuItem value="birth_year_asc">生年順</MenuItem>
                <MenuItem value="birth_year_desc">生年逆順</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>

        {/* Advanced Filters */}
        {showFilters && (
          <Box sx={{ mt: 3, p: 3, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="h6" gutterBottom>
              詳細フィルター
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>国籍</InputLabel>
                  <Select
                    value={nationalityFilter}
                    label="国籍"
                    onChange={(e) => setNationalityFilter(e.target.value)}
                  >
                    <MenuItem value="">すべて</MenuItem>
                    {nationalities.map(nationality => (
                      <MenuItem key={nationality} value={nationality}>
                        {nationality}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>カテゴリ</InputLabel>
                  <Select
                    value={categoryFilter}
                    label="カテゴリ"
                    onChange={(e) => setCategoryFilter(e.target.value)}
                  >
                    <MenuItem value="">すべて</MenuItem>
                    {categories.map(category => (
                      <MenuItem key={category} value={category}>
                        {category}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>学校</InputLabel>
                  <Select
                    value={schoolFilter}
                    label="学校"
                    onChange={(e) => setSchoolFilter(e.target.value)}
                  >
                    <MenuItem value="">すべて</MenuItem>
                    {schools.map(school => (
                      <MenuItem key={school} value={school}>
                        {school}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  variant="outlined"
                  startIcon={<ClearIcon />}
                  onClick={handleClearFilters}
                  fullWidth
                >
                  クリア
                </Button>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Active Filters */}
        {activeFilters.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              適用中のフィルター:
            </Typography>
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
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {totalItems.toLocaleString()}人の建築家
            {activeFilters.length > 0 && ' (絞り込み結果)'}
          </Typography>
        </Box>
      </Paper>

      {/* Architects List/Grid */}
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
        ) : (
          <Grid container spacing={2}>
            {[...Array(itemsPerPage)].map((_, i) => (
              <Grid item xs={12} sm={6} md={4} key={i}>
                <Skeleton variant="rectangular" height={300} />
              </Grid>
            ))}
          </Grid>
        )
      ) : architects.length === 0 ? (
        <Paper elevation={1} sx={{ p: 6, textAlign: 'center' }}>
          <PersonIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            建築家が見つかりませんでした
          </Typography>
          <Typography variant="body2" color="text.secondary">
            検索条件を変更してもう一度お試しください
          </Typography>
        </Paper>
      ) : viewMode === 'list' ? (
        <Paper sx={{ p: 2 }}>
          <List>
            {architects.map((architect, index) => (
              <React.Fragment key={architect.id || architect.ZAT_ID || architect.Z_PK || index}>
                <ListItem 
                  alignItems="flex-start"
                  component={RouterLink} 
                  to={`/architects/${architect.id || architect.ZAT_ID || architect.Z_PK}`}
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
                          {getArchitectDisplayName(architect)}
                        </Typography>
                        {architect.awards || architect.ZAT_AWARDS && (
                          <Chip 
                            label="受賞" 
                            size="small" 
                            color="warning" 
                            variant="outlined"
                            icon={<EmojiEventsIcon />}
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 1 }}>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={3}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <CakeIcon sx={{ mr: 0.5, color: 'text.secondary', fontSize: 16 }} />
                              <Typography variant="body2" color="text.secondary">
                                {getArchitectYears(architect)}
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={12} sm={3}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <PublicIcon sx={{ mr: 0.5, color: 'text.secondary', fontSize: 16 }} />
                              <Typography variant="body2" color="text.secondary">
                                {architect.nationality || architect.ZAT_NATIONALITY || '不明'}
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={12} sm={3}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <CategoryIcon sx={{ mr: 0.5, color: 'text.secondary', fontSize: 16 }} />
                              <Typography variant="body2" color="text.secondary">
                                {architect.category || architect.ZAT_CATEGORY || '不明'}
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={12} sm={3}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <SchoolIcon sx={{ mr: 0.5, color: 'text.secondary', fontSize: 16 }} />
                              <Typography variant="body2" color="text.secondary" noWrap>
                                {architect.school || architect.ZAT_SCHOOL || '不明'}
                              </Typography>
                            </Box>
                          </Grid>
                        </Grid>
                      </Box>
                    }
                  />
                </ListItem>
                {index < architects.length - 1 && <Divider component="li" />}
              </React.Fragment>
            ))}
          </List>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {architects.map((architect, index) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={architect.id || architect.ZAT_ID || architect.Z_PK || index}>
              <Card 
                sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 8,
                  },
                }}
                elevation={2}
              >
                <CardActionArea 
                  component={RouterLink} 
                  to={`/architects/${architect.id || architect.ZAT_ID || architect.Z_PK}`}
                  sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                >
                  <CardContent sx={{ flexGrow: 1, width: '100%' }}>
                    {/* Architect Name */}
                    <Typography 
                      variant="h6" 
                      component="div" 
                      gutterBottom
                      sx={{ 
                        fontWeight: 600,
                        lineHeight: 1.3,
                        minHeight: '2.6em',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}
                    >
                      {getArchitectDisplayName(architect)}
                    </Typography>
                    
                    {/* Basic Info */}
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <PublicIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {architect.nationality || architect.ZAT_NATIONALITY || '不明'}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <CakeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {getArchitectYears(architect)}
                        </Typography>
                      </Box>
                      
                      {(architect.category || architect.ZAT_CATEGORY) && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <CategoryIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {architect.category || architect.ZAT_CATEGORY}
                          </Typography>
                        </Box>
                      )}
                      
                      {(architect.school || architect.ZAT_SCHOOL) && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <SchoolIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{
                              display: '-webkit-box',
                              WebkitLineClamp: 1,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden'
                            }}
                          >
                            {architect.school || architect.ZAT_SCHOOL}
                          </Typography>
                        </Box>
                      )}

                      {(architect.office || architect.ZAT_OFFICE) && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <WorkIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{
                              display: '-webkit-box',
                              WebkitLineClamp: 1,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden'
                            }}
                          >
                            {architect.office || architect.ZAT_OFFICE}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                    
                    {/* Tags */}
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 'auto' }}>
                      {getArchitectTags(architect).slice(0, 3).map((tag, tagIndex) => (
                        <Chip
                          key={tagIndex}
                          label={tag}
                          size="small"
                          variant="outlined"
                          sx={{ 
                            fontSize: '0.75rem',
                            height: 24,
                            pointerEvents: 'none'
                          }}
                        />
                      ))}
                      {getArchitectTags(architect).length > 3 && (
                        <Chip
                          label={`+${getArchitectTags(architect).length - 3}`}
                          size="small"
                          variant="outlined"
                          sx={{ 
                            fontSize: '0.75rem',
                            height: 24,
                            pointerEvents: 'none',
                            color: 'text.secondary'
                          }}
                        />
                      )}
                      {(architect.awards || architect.ZAT_AWARDS) && (
                        <Chip
                          label="受賞"
                          size="small"
                          color="warning"
                          variant="outlined"
                          icon={<EmojiEventsIcon sx={{ fontSize: '0.75rem' }} />}
                          sx={{ 
                            fontSize: '0.75rem',
                            height: 24,
                            pointerEvents: 'none'
                          }}
                        />
                      )}
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Pagination */}
      {totalPages > 1 && !loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={handlePageChange}
            color="primary"
            size="large"
            showFirstButton
            showLastButton
          />
        </Box>
      )}
        </Grid>

        {/* Suggestions Sidebar */}
        {showSuggestions && (
          <Grid item xs={12} lg={3}>
            <Paper sx={{ p: 2, position: 'sticky', top: 20 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                  <InsightsIcon sx={{ mr: 1 }} />
                  建築家サジェスト
                </Typography>
                <IconButton 
                  size="small" 
                  onClick={() => setShowSuggestions(false)}
                >
                  <CloseIcon />
                </IconButton>
              </Box>

              {loading ? (
                <Box>
                  <Skeleton variant="text" height={30} />
                  <Skeleton variant="text" height={30} />
                  <Skeleton variant="text" height={30} />
                </Box>
              ) : quickSuggestions && (
                <Stack spacing={3}>
                  {/* Top Nationalities */}
                  <Box>
                    <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                      <PublicIcon sx={{ mr: 1, color: 'primary.main' }} />
                      国籍別
                    </Typography>
                    <List dense>
                      {quickSuggestions.topNationalities.map((item, index) => (
                        <ListItem 
                          key={index}
                          button
                          onClick={() => handleQuickFilter('nationality', item.name)}
                        >
                          <ListItemText 
                            primary={item.name}
                            secondary={`${item.count}人`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>

                  <Divider />

                  {/* Top Categories */}
                  <Box>
                    <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                      <CategoryIcon sx={{ mr: 1, color: 'secondary.main' }} />
                      カテゴリ別
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {quickSuggestions.topCategories.map((item, index) => (
                        <Chip
                          key={index}
                          label={`${item.name} (${item.count})`}
                          size="small"
                          onClick={() => handleQuickFilter('category', item.name)}
                        />
                      ))}
                    </Box>
                  </Box>

                  <Divider />

                  {/* Top Schools */}
                  <Box>
                    <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                      <SchoolIcon sx={{ mr: 1, color: 'warning.main' }} />
                      主要大学
                    </Typography>
                    <List dense>
                      {quickSuggestions.topSchools.map((item, index) => (
                        <ListItem 
                          key={index}
                          button
                          onClick={() => handleQuickFilter('school', item.name)}
                        >
                          <ListItemText 
                            primary={item.name}
                            secondary={`${item.count}人`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>

                  <Divider />

                  {/* Birth Decades */}
                  <Box>
                    <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                      <TrendingUpIcon sx={{ mr: 1, color: 'success.main' }} />
                      生年代別
                    </Typography>
                    <List dense>
                      {quickSuggestions.recentDecades.map((item, index) => (
                        <ListItem key={index}>
                          <ListItemText 
                            primary={item.decade}
                            secondary={`${item.count}人`}
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

export default ArchitectsPage;