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
  Pagination,
  CircularProgress,
  Chip,
  Paper
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import BusinessIcon from '@mui/icons-material/Business';
import LocationOnIcon from '@mui/icons-material/LocationOn';

const ArchitectsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [architects, setArchitects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1'));

  useEffect(() => {
    fetchArchitects();
  }, [currentPage, searchParams]);

  const fetchArchitects = async () => {
    setLoading(true);
    try {
      let url = `/api/architects?page=${currentPage}&limit=12`;
      
      if (searchTerm) {
        url += `&search=${encodeURIComponent(searchTerm)}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      setArchitects(data.data);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('Error fetching architects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    setSearchParams({ search: searchTerm, page: '1' });
  };

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
    setSearchParams({ ...Object.fromEntries(searchParams), page: value.toString() });
  };

  const clearSearch = () => {
    setSearchTerm('');
    setCurrentPage(1);
    setSearchParams({ page: '1' });
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        建築家一覧
      </Typography>

      <Paper sx={{ p: 3, mb: 4 }}>
        <Box component="form" onSubmit={handleSearch} sx={{ display: 'flex', mb: 2 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="建築家、事務所名などで検索"
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

        {searchTerm && (
          <Box sx={{ mt: 2 }}>
            <Chip 
              label={`検索: ${searchTerm}`} 
              onDelete={clearSearch} 
            />
          </Box>
        )}
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : architects.length === 0 ? (
        <Typography variant="h6" sx={{ textAlign: 'center', py: 4 }}>
          条件に一致する建築家が見つかりませんでした。
        </Typography>
      ) : (
        <>
          <Grid container spacing={4}>
            {architects.map((architect) => (
              <Grid item key={architect.id} xs={12} sm={6} md={4}>
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
                  <CardActionArea component={RouterLink} to={`/architects/${architect.id}`}>
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography gutterBottom variant="h6" component="h2">
                        {architect.name || '不明'}
                      </Typography>
                      {architect.name_en && (
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {architect.name_en}
                        </Typography>
                      )}
                      <Box sx={{ mt: 2 }}>
                        {architect.office && (
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <BusinessIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                            <Typography variant="body2">{architect.office}</Typography>
                          </Box>
                        )}
                        {architect.prefecture && (
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <LocationOnIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                            <Typography variant="body2">{architect.prefecture}</Typography>
                          </Box>
                        )}
                        {architect.birth_year > 0 && (
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <PersonIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                            <Typography variant="body2">{architect.birth_year}年生まれ</Typography>
                          </Box>
                        )}
                      </Box>
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

export default ArchitectsPage; 