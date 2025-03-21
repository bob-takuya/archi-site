import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  CircularProgress,
  Chip,
  Card,
  CardContent,
  CardActionArea,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import MapIcon from '@mui/icons-material/Map';

const MapPage = () => {
  const [loading, setLoading] = useState(true);
  const [works, setWorks] = useState([]);
  const [prefectures, setPrefectures] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({
    prefecture: '',
    category: '',
    yearFrom: '',
    yearTo: '',
    architect: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedWork, setSelectedWork] = useState(null);
  const [showWorkDetails, setShowWorkDetails] = useState(false);

  useEffect(() => {
    fetchPrefectures();
    fetchCategories();
    fetchWorks();
  }, []);

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
      let url = '/api/architecture?limit=1000';
      
      if (Object.values(filters).some(val => val)) {
        url = '/api/filter?';
        Object.entries(filters).forEach(([key, value]) => {
          if (value) {
            url += `&${key}=${encodeURIComponent(value)}`;
          }
        });
        url += '&limit=1000';
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      // 位置情報がある作品のみをフィルター
      const worksWithLocation = data.data.filter(
        work => work.latitude && work.longitude && work.latitude !== 0 && work.longitude !== 0
      );
      
      setWorks(worksWithLocation);
    } catch (error) {
      console.error('Error fetching works:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };

  const applyFilters = () => {
    fetchWorks();
  };

  const clearFilters = () => {
    setFilters({
      prefecture: '',
      category: '',
      yearFrom: '',
      yearTo: '',
      architect: ''
    });
  };

  const handleWorkClick = (work) => {
    setSelectedWork(work);
    setShowWorkDetails(true);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        建築地図
      </Typography>

      <Paper sx={{ p: 3, mb: 4 }}>
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

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <MapIcon sx={{ mr: 1 }} />
          <Typography variant="body2" color="text.secondary">
            マップ上に表示された作品: {works.length}件
          </Typography>
        </Box>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ height: 600, bgcolor: 'grey.200', position: 'relative', borderRadius: 1 }}>
          <Box sx={{ 
            position: 'absolute', 
            top: '50%', 
            left: '50%', 
            transform: 'translate(-50%, -50%)', 
            textAlign: 'center' 
          }}>
            <Typography variant="h6" gutterBottom>
              地図表示エリア
            </Typography>
            <Typography variant="body2" color="text.secondary">
              実際の実装ではGoogle MapsなどのAPIを使用します
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              マップ上に{works.length}件の建築作品が表示されます
            </Typography>
          </Box>

          {/* マップの下に作品一覧を表示 */}
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              検索結果一覧
            </Typography>
            <Grid container spacing={2}>
              {works.slice(0, 6).map((work) => (
                <Grid item key={work.id} xs={12} sm={6} md={4}>
                  <Card 
                    sx={{ 
                      height: '100%', 
                      display: 'flex', 
                      flexDirection: 'column',
                      cursor: 'pointer',
                      '&:hover': {
                        boxShadow: 6,
                      },
                    }}
                    onClick={() => handleWorkClick(work)}
                  >
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography gutterBottom variant="subtitle1" component="h3">
                        {work.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {work.architect || '不明'} | {work.year || '不明'} | {work.prefecture || '不明'}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
            {works.length > 6 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <Button 
                  variant="outlined" 
                  component={RouterLink} 
                  to="/architecture"
                >
                  すべての作品を見る
                </Button>
              </Box>
            )}
          </Box>
        </Box>
      )}

      {/* 作品詳細ドロワー */}
      <Drawer
        anchor="right"
        open={showWorkDetails}
        onClose={() => setShowWorkDetails(false)}
      >
        <Box sx={{ width: 350, p: 3 }}>
          {selectedWork && (
            <>
              <Typography variant="h6" gutterBottom>
                {selectedWork.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {selectedWork.title_eng}
              </Typography>
              
              <Divider sx={{ my: 2 }} />
              
              <List dense>
                <ListItem>
                  <ListItemText 
                    primary="建築家" 
                    secondary={selectedWork.architect || '不明'} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="カテゴリー" 
                    secondary={selectedWork.category || '不明'} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="竣工年" 
                    secondary={selectedWork.year || '不明'} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="住所" 
                    secondary={selectedWork.address || '不明'} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="緯度 / 経度" 
                    secondary={`${selectedWork.latitude}, ${selectedWork.longitude}`} 
                  />
                </ListItem>
              </List>
              
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                <Button 
                  variant="contained" 
                  component={RouterLink} 
                  to={`/architecture/${selectedWork.id}`}
                >
                  詳細を見る
                </Button>
              </Box>
            </>
          )}
        </Box>
      </Drawer>
    </Container>
  );
};

export default MapPage; 