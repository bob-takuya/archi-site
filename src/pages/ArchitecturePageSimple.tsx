import React, { useState, useEffect } from 'react';
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
  MenuItem
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import SortIcon from '@mui/icons-material/Sort';
import { getAllArchitectures } from '../services/db/ArchitectureServiceSimple';
import type { Architecture } from '../types/architecture';

const ArchitecturePageSimple = () => {
  const [architectures, setArchitectures] = useState<Architecture[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('year_desc');
  const itemsPerPage = 12;
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // URLからクエリパラメータを解析
    const queryParams = new URLSearchParams(location.search);
    const search = queryParams.get('search');
    const sort = queryParams.get('sort');
    
    if (sort) {
      setSortBy(sort);
    }
    
    if (search) {
      setSearchTerm(search);
      fetchArchitectures(1, search, sort || sortBy);
    } else {
      fetchArchitectures(1, searchTerm, sort || sortBy);
    }
  }, [location.search]);

  const fetchArchitectures = async (page: number, search = searchTerm, sort = sortBy) => {
    setLoading(true);
    try {
      const result = await getAllArchitectures(page, itemsPerPage, search, sort);
      setArchitectures(result.results);
      setTotalItems(result.total);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error fetching architectures:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setCurrentPage(value);
    fetchArchitectures(value, searchTerm, sortBy);
    window.scrollTo(0, 0);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleSortChange = (event: any) => {
    const newSortBy = event.target.value;
    setSortBy(newSortBy);
    
    fetchArchitectures(currentPage, searchTerm, newSortBy);
    
    const queryParams = new URLSearchParams(location.search);
    queryParams.set('sort', newSortBy);
    navigate({ search: queryParams.toString() });
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchArchitectures(1, searchTerm, sortBy);
    
    const queryParams = new URLSearchParams();
    
    if (sortBy !== 'year_desc') {
      queryParams.set('sort', sortBy);
    }
    
    if (searchTerm) {
      queryParams.set('search', searchTerm);
    }
    
    navigate({ search: queryParams.toString() });
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setCurrentPage(1);
    fetchArchitectures(1, '', sortBy);
    
    const queryParams = new URLSearchParams();
    if (sortBy !== 'year_desc') {
      queryParams.set('sort', sortBy);
    }
    navigate({ search: queryParams.toString() });
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        建築作品一覧
      </Typography>

      <Paper sx={{ p: 3, mb: 4 }}>
        {/* 検索バーとボタン */}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 3 }}>
          <TextField
            fullWidth
            label="建築作品名、住所、建築家で検索"
            value={searchTerm}
            onChange={handleSearchChange}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <Button 
            variant="contained" 
            onClick={handleSearch}
            sx={{ minWidth: '120px' }}
          >
            検索
          </Button>
        </Box>
        
        {/* 並び替え */}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, mb: 3, alignItems: 'flex-start' }}>
          <FormControl sx={{ minWidth: 200, flex: 1 }}>
            <InputLabel id="sort-select-label">並び替え</InputLabel>
            <Select
              labelId="sort-select-label"
              id="sort-select"
              value={sortBy}
              label="並び替え"
              onChange={handleSortChange}
              startAdornment={
                <InputAdornment position="start">
                  <SortIcon />
                </InputAdornment>
              }
            >
              <MenuItem value="year_desc">年代（新しい順）</MenuItem>
              <MenuItem value="year_asc">年代（古い順）</MenuItem>
              <MenuItem value="name_asc">名前（昇順）</MenuItem>
              <MenuItem value="name_desc">名前（降順）</MenuItem>
              <MenuItem value="architect_asc">建築家（昇順）</MenuItem>
              <MenuItem value="architect_desc">建築家（降順）</MenuItem>
            </Select>
          </FormControl>
        </Box>
        
        {/* 検索中の表示 */}
        {searchTerm && (
          <Box sx={{ mb: 3 }}>
            <Alert 
              severity="info" 
              action={
                <Button color="inherit" size="small" onClick={handleClearSearch}>
                  クリア
                </Button>
              }
            >
              「{searchTerm}」で検索中
            </Alert>
          </Box>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {totalItems.toLocaleString()} 件の建築作品
          </Typography>
          {totalPages > 1 && (
            <Pagination 
              count={totalPages} 
              page={currentPage} 
              onChange={handlePageChange} 
              color="primary"
              size="small"
            />
          )}
        </Box>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {architectures.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6">
                建築作品が見つかりませんでした
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                検索条件を変更してお試しください
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {architectures.map((architecture) => (
                <Grid item key={architecture.Z_PK} xs={12} sm={6} md={4} lg={3}>
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
                    <CardActionArea 
                      component={RouterLink} 
                      to={`/architecture/${architecture.Z_PK}`}
                      sx={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'flex-start',
                        height: '100%',
                      }}
                    >
                      <CardContent sx={{ width: '100%', flexGrow: 1 }}>
                        <Typography gutterBottom variant="h6" component="h2">
                          {architecture.ZAR_TITLE}
                        </Typography>
                        
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
                          {architecture.ZAR_ARCHITECT && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <PersonIcon fontSize="small" color="action" />
                              <Typography variant="body2" color="text.secondary">
                                {architecture.ZAR_ARCHITECT}
                              </Typography>
                            </Box>
                          )}
                          
                          {architecture.ZAR_ADDRESS && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <LocationOnIcon fontSize="small" color="action" />
                              <Typography variant="body2" color="text.secondary">
                                {architecture.ZAR_ADDRESS}
                              </Typography>
                            </Box>
                          )}
                          
                          {architecture.ZAR_YEAR && architecture.ZAR_YEAR > 0 && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <CalendarTodayIcon fontSize="small" color="action" />
                              <Typography variant="body2" color="text.secondary">
                                {architecture.ZAR_YEAR}年
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}

          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination 
                count={totalPages} 
                page={currentPage} 
                onChange={handlePageChange} 
                color="primary"
              />
            </Box>
          )}
        </>
      )}
    </Container>
  );
};

export default ArchitecturePageSimple;