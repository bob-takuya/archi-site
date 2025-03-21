import React, { useState, useEffect } from 'react';
import { useSearchParams, Link as RouterLink } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  CardActionArea,
  TextField,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  CircularProgress,
  Chip,
  Paper
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';

const ArchitecturePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1'));
  const [prefectures, setPrefectures] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({
    prefecture: searchParams.get('prefecture') || '',
    category: searchParams.get('category') || '',
    yearFrom: searchParams.get('yearFrom') || '',
    yearTo: searchParams.get('yearTo') || '',
    architect: searchParams.get('architect') || ''
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchPrefectures();
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchWorks();
  }, [currentPage, searchParams]);

  const fetchPrefectures = async () => {
    try {
      const response = await fetch('/api/prefectures');
      const data = await response.json();
      setPrefectures(data);
    } catch (error) {
      console.error('Error fetching prefectures:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchWorks = async () => {
    setLoading(true);
    try {
      let url = '/api/architecture?';
      
      if (searchTerm) {
        url += `&search=${encodeURIComponent(searchTerm)}`;
      }
      
      if (Object.values(filters).some(val => val)) {
        url = '/api/filter?';
        Object.entries(filters).forEach(([key, value]) => {
          if (value) {
            url += `&${key}=${encodeURIComponent(value)}`;
          }
        });
      }
      
      url += `&page=${currentPage}&limit=12`;
      
      const response = await fetch(url);
      const data = await response.json();
      setWorks(data.data);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('Error fetching works:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    updateSearchParams({ search: searchTerm, page: 1 });
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };

  const applyFilters = () => {
    setCurrentPage(1);
    updateSearchParams({ ...filters, page: 1, search: searchTerm });
  };

  const clearFilters = () => {
    setFilters({
      prefecture: '',
      category: '',
      yearFrom: '',
      yearTo: '',
      architect: ''
    });
    setSearchTerm('');
    setCurrentPage(1);
    updateSearchParams({ page: 1 });
  };

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
    updateSearchParams({ page: value });
  };

  const updateSearchParams = (params) => {
    const newParams = {};
    
    // Keep existing params
    searchParams.forEach((value, key) => {
      newParams[key] = value;
    });
    
    // Update with new params
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        newParams[key] = value;
      } else {
        delete newParams[key];
      }
    });
    
    setSearchParams(newParams);
  };

  const hasActiveFilters = () => {
    return Object.values(filters).some(val => val) || searchTerm;
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        建築作品一覧
      </Typography>

      <Paper sx={{ p: 3, mb: 4 }}>
        <Box component="form" onSubmit={handleSearch} sx={{ display: 'flex', mb: 2 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="建築作品、建築家、住所などで検索"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ mr: 1 }}
          />
          <Button 
            type="submit"
            variant="contained" 
            color="primary"
            startIcon={<SearchIcon />}
          >
            検索
          </Button>
        </Box>

        <Button 
          startIcon={<FilterListIcon />} 
          onClick={() => setShowFilters(!showFilters)}
          sx={{ mb: 2 }}
        >
          {showFilters ? 'フィルターを閉じる' : 'フィルターを表示'}
        </Button>

        {showFilters && (
          <Box sx={{ mb: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>都道府県</InputLabel>
                  <Select
                    name="prefecture"
                    value={filters.prefecture}
                    onChange={handleFilterChange}
                    label="都道府県"
                  >
                    <MenuItem value="">すべて</MenuItem>
                    {prefectures.map((prefecture) => (
                      <MenuItem key={prefecture} value={prefecture}>
                        {prefecture}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>カテゴリー</InputLabel>
                  <Select
                    name="category"
                    value={filters.category}
                    onChange={handleFilterChange}
                    label="カテゴリー"
                  >
                    <MenuItem value="">すべて</MenuItem>
                    {categories.map((category) => (
                      <MenuItem key={category} value={category}>
                        {category}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  fullWidth
                  label="年代（から）"
                  name="yearFrom"
                  type="number"
                  value={filters.yearFrom}
                  onChange={handleFilterChange}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  fullWidth
                  label="年代（まで）"
                  name="yearTo"
                  type="number"
                  value={filters.yearTo}
                  onChange={handleFilterChange}
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField
                  fullWidth
                  label="建築家"
                  name="architect"
                  value={filters.architect}
                  onChange={handleFilterChange}
                />
              </Grid>
            </Grid>
            <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
              <Button variant="contained" color="primary" onClick={applyFilters}>
                フィルター適用
              </Button>
              <Button variant="outlined" onClick={clearFilters}>
                クリア
              </Button>
            </Box>
          </Box>
        )}

        {hasActiveFilters() && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
            {searchTerm && (
              <Chip 
                label={`検索: ${searchTerm}`} 
                onDelete={() => {
                  setSearchTerm('');
                  updateSearchParams({ search: null });
                }} 
              />
            )}
            {filters.prefecture && (
              <Chip 
                label={`都道府県: ${filters.prefecture}`} 
                onDelete={() => {
                  setFilters({ ...filters, prefecture: '' });
                  updateSearchParams({ prefecture: null });
                }} 
              />
            )}
            {filters.category && (
              <Chip 
                label={`カテゴリー: ${filters.category}`} 
                onDelete={() => {
                  setFilters({ ...filters, category: '' });
                  updateSearchParams({ category: null });
                }} 
              />
            )}
            {filters.yearFrom && (
              <Chip 
                label={`${filters.yearFrom}年以降`} 
                onDelete={() => {
                  setFilters({ ...filters, yearFrom: '' });
                  updateSearchParams({ yearFrom: null });
                }} 
              />
            )}
            {filters.yearTo && (
              <Chip 
                label={`${filters.yearTo}年以前`} 
                onDelete={() => {
                  setFilters({ ...filters, yearTo: '' });
                  updateSearchParams({ yearTo: null });
                }} 
              />
            )}
            {filters.architect && (
              <Chip 
                label={`建築家: ${filters.architect}`} 
                onDelete={() => {
                  setFilters({ ...filters, architect: '' });
                  updateSearchParams({ architect: null });
                }} 
              />
            )}
          </Box>
        )}
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : works.length === 0 ? (
        <Typography variant="h6" sx={{ textAlign: 'center', py: 4 }}>
          条件に一致する建築作品が見つかりませんでした。
        </Typography>
      ) : (
        <>
          <Grid container spacing={4}>
            {works.map((work) => (
              <Grid item key={work.id} xs={12} sm={6} md={4}>
                <Card 
                  sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'scale(1.02)',
                    },
                  }}
                >
                  <CardActionArea component={RouterLink} to={`/architecture/${work.id}`}>
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography gutterBottom variant="h6" component="h2">
                        {work.title}
                      </Typography>
                      <Typography color="text.secondary">
                        {work.architect || '不明'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {work.year && work.year !== 0 ? work.year : '不明'} | {work.prefecture || '不明'} | {work.category || '不明'}
                      </Typography>
                      {work.address && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          {work.address}
                        </Typography>
                      )}
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Pagination 
              count={totalPages} 
              page={currentPage} 
              onChange={handlePageChange} 
              color="primary"
            />
          </Box>
        </>
      )}
    </Container>
  );
};

export default ArchitecturePage; 