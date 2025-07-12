/**
 * Enhanced ArchitectsPage with FacetedSearch integration
 * Phase 2 SOW implementation for sophisticated architect filtering
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  CardActionArea,
  Chip,
  CircularProgress,
  Pagination,
  Paper,
  Alert,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import PersonIcon from '@mui/icons-material/Person';
import CakeIcon from '@mui/icons-material/Cake';
import PublicIcon from '@mui/icons-material/Public';
import SchoolIcon from '@mui/icons-material/School';
import CategoryIcon from '@mui/icons-material/Category';

import FacetedSearch from '../components/search/FacetedSearch';
import type { SearchFacets, ActiveFacets } from '../components/search/FacetedSearch';
import { ArchitectService } from '../services/db';
import type { Architect, ArchitectsResponse } from '../types/architect';

const ITEMS_PER_PAGE = 12;
const DEBOUNCE_DELAY = 300;

interface SearchState {
  query: string;
  facets: ActiveFacets;
  page: number;
  loading: boolean;
}

const ArchitectsPageWithFacetedSearch: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  
  // Core state
  const [searchState, setSearchState] = useState<SearchState>({
    query: '',
    facets: {},
    page: 1,
    loading: true
  });
  
  const [architects, setArchitects] = useState<Architect[]>([]);
  const [searchFacets, setSearchFacets] = useState<SearchFacets>({
    prefectures: [],
    architects: [],
    decades: [],
    categories: [],
    materials: [],
    styles: [],
    yearRange: {
      min: 1800,
      max: new Date().getFullYear(),
      selectedMin: 1800,
      selectedMax: new Date().getFullYear(),
      step: 1,
      unit: '年'
    },
    popular: []
  });
  
  const [totalResults, setTotalResults] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  // Performance optimization refs
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const lastSearchRef = useRef<string>('');
  const lastFacetsRef = useRef<ActiveFacets>({});

  // Load initial facets and URL parameters
  useEffect(() => {
    loadInitialState();
  }, []);

  // Handle URL parameter changes
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlQuery = params.get('search') || '';
    const urlPage = parseInt(params.get('page') || '1');
    
    // Parse facets from URL
    const urlFacets: ActiveFacets = {};
    
    const prefectures = params.get('prefectures');
    if (prefectures) urlFacets.prefectures = prefectures.split(',');
    
    const architects = params.get('architects');
    if (architects) urlFacets.architects = architects.split(',');
    
    const categories = params.get('categories');
    if (categories) urlFacets.categories = categories.split(',');
    
    const styles = params.get('styles');
    if (styles) urlFacets.styles = styles.split(',');
    
    const yearRange = params.get('yearRange');
    if (yearRange) {
      const [min, max] = yearRange.split('-').map(Number);
      if (!isNaN(min) && !isNaN(max)) {
        urlFacets.yearRange = [min, max];
      }
    }

    setSearchState(prev => ({
      ...prev,
      query: urlQuery,
      facets: urlFacets,
      page: urlPage
    }));
  }, [location.search]);

  // Perform search when state changes
  useEffect(() => {
    if (shouldPerformSearch()) {
      performSearch();
    }
  }, [searchState.query, searchState.facets, searchState.page]);

  const loadInitialState = async () => {
    try {
      const facets = await ArchitectService.getArchitectFacets();
      setSearchFacets(facets);
      setError(null);
    } catch (err) {
      console.error('Failed to load initial facets:', err);
      setError('検索フィルターの読み込みに失敗しました');
    }
  };

  const shouldPerformSearch = (): boolean => {
    const currentSearch = JSON.stringify({
      query: searchState.query,
      facets: searchState.facets,
      page: searchState.page
    });
    
    const lastSearch = JSON.stringify({
      query: lastSearchRef.current,
      facets: lastFacetsRef.current,
      page: searchState.page
    });
    
    return currentSearch !== lastSearch;
  };

  const performSearch = useCallback(async () => {
    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce search for performance
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        setSearchState(prev => ({ ...prev, loading: true }));
        setError(null);

        // Perform faceted search
        const searchResults = await ArchitectService.searchArchitectsWithFacets(
          searchState.query,
          searchState.facets,
          searchState.page,
          ITEMS_PER_PAGE
        );

        // Update facets with new counts based on current search
        const updatedFacets = await ArchitectService.getArchitectFacets(searchState.facets);

        setArchitects(searchResults.results);
        setTotalResults(searchResults.total);
        setTotalPages(searchResults.totalPages);
        setSearchFacets(updatedFacets);

        // Update refs for next comparison
        lastSearchRef.current = searchState.query;
        lastFacetsRef.current = { ...searchState.facets };

        // Update URL without triggering navigation
        updateURL();

      } catch (err) {
        console.error('Search failed:', err);
        setError('検索に失敗しました。もう一度お試しください。');
        setArchitects([]);
        setTotalResults(0);
        setTotalPages(0);
      } finally {
        setSearchState(prev => ({ ...prev, loading: false }));
      }
    }, DEBOUNCE_DELAY);
  }, [searchState.query, searchState.facets, searchState.page]);

  const updateURL = () => {
    const params = new URLSearchParams();
    
    if (searchState.query) {
      params.set('search', searchState.query);
    }
    
    if (searchState.page > 1) {
      params.set('page', searchState.page.toString());
    }
    
    // Add facet parameters
    if (searchState.facets.prefectures?.length) {
      params.set('prefectures', searchState.facets.prefectures.join(','));
    }
    
    if (searchState.facets.architects?.length) {
      params.set('architects', searchState.facets.architects.join(','));
    }
    
    if (searchState.facets.categories?.length) {
      params.set('categories', searchState.facets.categories.join(','));
    }
    
    if (searchState.facets.styles?.length) {
      params.set('styles', searchState.facets.styles.join(','));
    }
    
    if (searchState.facets.yearRange) {
      const [min, max] = searchState.facets.yearRange;
      params.set('yearRange', `${min}-${max}`);
    }

    const newURL = params.toString() ? `?${params.toString()}` : '';
    if (newURL !== location.search) {
      navigate(newURL, { replace: true });
    }
  };

  const handleSearch = useCallback((query: string, facets: ActiveFacets) => {
    setSearchState(prev => ({
      ...prev,
      query,
      facets,
      page: 1 // Reset to first page when search changes
    }));
  }, []);

  const handleFacetsChange = useCallback((facets: ActiveFacets) => {
    setSearchState(prev => ({
      ...prev,
      facets,
      page: 1 // Reset to first page when facets change
    }));
  }, []);

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setSearchState(prev => ({
      ...prev,
      page: value
    }));
    
    // Scroll to top on page change
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getArchitectDisplayName = (architect: Architect): string => {
    return architect.ZAT_ARCHITECT || architect.ZAR_NAME || '不明';
  };

  const getArchitectYears = (architect: Architect): string => {
    const birth = architect.ZAT_BIRTHYEAR || '?';
    const death = architect.ZAT_DEATHYEAR || '現在';
    return `${birth}-${death}`;
  };

  const getArchitectTags = (architect: Architect): string[] => {
    const tags: string[] = [];
    
    if (architect.ZAT_NATIONALITY) tags.push(architect.ZAT_NATIONALITY);
    if (architect.ZAT_CATEGORY) tags.push(architect.ZAT_CATEGORY);
    if (architect.ZAT_SCHOOL) tags.push(architect.ZAT_SCHOOL);
    
    return tags;
  };

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          建築家一覧
        </Typography>
        <Typography variant="body1" color="text.secondary">
          世界の著名な建築家を検索・絞り込みできます
        </Typography>
      </Box>

      {/* Faceted Search Interface */}
      <Box sx={{ mb: 4 }}>
        <FacetedSearch
          onSearch={handleSearch}
          onFacetsChange={handleFacetsChange}
          facets={searchFacets}
          loading={searchState.loading}
          resultCount={totalResults}
          placeholder="建築家名、国籍、カテゴリー、学校で検索..."
          showResultCount={true}
          mobileBreakpoint={960}
          maxVisibleFacets={6}
        />
      </Box>

      {/* Search Results */}
      <Box>
        {searchState.loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress size={48} />
          </Box>
        ) : (
          <>
            {/* Results Grid */}
            {architects.length === 0 ? (
              <Paper elevation={1} sx={{ p: 6, textAlign: 'center' }}>
                <PersonIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  建築家が見つかりませんでした
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  検索条件を変更してもう一度お試しください
                </Typography>
              </Paper>
            ) : (
              <Grid container spacing={3}>
                {architects.map((architect, index) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={architect.ZAT_ID || architect.Z_PK || index}>
                    <Card 
                      sx={{ 
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: theme.shadows[8],
                        },
                      }}
                      elevation={2}
                    >
                      <CardActionArea 
                        component={RouterLink} 
                        to={`/architects/${architect.ZAT_ID || architect.Z_PK}`}
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
                                {architect.ZAT_NATIONALITY || '不明'}
                              </Typography>
                            </Box>
                            
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                              <CakeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                              <Typography variant="body2" color="text.secondary">
                                {getArchitectYears(architect)}
                              </Typography>
                            </Box>
                            
                            {architect.ZAT_CATEGORY && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                <CategoryIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                <Typography variant="body2" color="text.secondary">
                                  {architect.ZAT_CATEGORY}
                                </Typography>
                              </Box>
                            )}
                            
                            {architect.ZAT_SCHOOL && (
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
                                  {architect.ZAT_SCHOOL}
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
                          </Box>
                        </CardContent>
                      </CardActionArea>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
            
            {/* Pagination */}
            {totalPages > 1 && (
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                mt: 6,
                py: 2
              }}>
                <Pagination 
                  count={totalPages} 
                  page={searchState.page} 
                  onChange={handlePageChange} 
                  color="primary"
                  size={isMobile ? 'medium' : 'large'}
                  showFirstButton
                  showLastButton
                  sx={{
                    '& .MuiPaginationItem-root': {
                      minWidth: isMobile ? 32 : 40,
                      height: isMobile ? 32 : 40,
                    }
                  }}
                />
              </Box>
            )}
          </>
        )}
      </Box>
    </Container>
  );
};

export default ArchitectsPageWithFacetedSearch;