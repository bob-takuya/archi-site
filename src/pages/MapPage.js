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
import { getMapArchitectures } from '../services/DbService';
import MapComponent from '../components/Map';

const MapPage = () => {
  const [loading, setLoading] = useState(true);
  const [works, setWorks] = useState([]);
  const [allWorks, setAllWorks] = useState([]);
  const [filters, setFilters] = useState({
    yearFrom: '',
    yearTo: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedWork, setSelectedWork] = useState(null);
  const [showWorkDetails, setShowWorkDetails] = useState(false);

  useEffect(() => {
    fetchWorks();
  }, []);

  // ランダムな年代の範囲を生成する関数
  const generateRandomTimeframe = (works) => {
    if (!works || works.length === 0) return { from: '', to: '' };
    
    // 有効な年代の作品をフィルタリング
    const validWorks = works.filter(work => work.completedYear > 0);
    if (validWorks.length === 0) return { from: '', to: '' };
    
    // 全ての年代をソート
    const years = validWorks.map(work => work.completedYear).sort((a, b) => a - b);
    
    // 最小年と最大年を取得
    const minYear = years[0];
    const maxYear = years[years.length - 1];
    
    // 100年程度の範囲をランダムに選択（または利用可能な範囲の半分程度）
    const range = Math.min(100, Math.floor((maxYear - minYear) / 2));
    
    // 開始年をランダムに選択（全範囲の中で）
    const startYearIndex = Math.floor(Math.random() * (years.length - Math.floor(years.length / 4)));
    const startYear = years[startYearIndex];
    
    // 最大でも開始年+範囲、または最大年のいずれか小さい方を終了年とする
    const endYear = Math.min(startYear + range, maxYear);
    
    return { from: startYear, to: endYear };
  };

  const fetchWorks = async () => {
    setLoading(true);
    try {
      // ブラウザ内SQLiteを使用してデータを取得
      const data = await getMapArchitectures();
      setAllWorks(data);
      
      // 初回読み込み時はランダムな年代フィルターを適用
      if (!filters.yearFrom && !filters.yearTo) {
        const randomTimeframe = generateRandomTimeframe(data);
        setFilters({
          yearFrom: randomTimeframe.from,
          yearTo: randomTimeframe.to
        });
        
        // フィルター適用
        const filteredData = data.filter(work => 
          work.completedYear >= randomTimeframe.from && 
          work.completedYear <= randomTimeframe.to
        );
        
        setWorks(filteredData);
      } else {
        // フィルターによる絞り込み（クライアント側で実行）
        let filteredWorks = data;
        
        if (filters.yearFrom) {
          filteredWorks = filteredWorks.filter(work => work.completedYear >= parseInt(filters.yearFrom));
        }
        
        if (filters.yearTo) {
          filteredWorks = filteredWorks.filter(work => work.completedYear <= parseInt(filters.yearTo));
        }
        
        setWorks(filteredWorks);
      }
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
    setLoading(true);
    
    let filteredWorks = allWorks;
    
    if (filters.yearFrom) {
      filteredWorks = filteredWorks.filter(work => work.completedYear >= parseInt(filters.yearFrom));
    }
    
    if (filters.yearTo) {
      filteredWorks = filteredWorks.filter(work => work.completedYear <= parseInt(filters.yearTo));
    }
    
    setWorks(filteredWorks);
    setLoading(false);
  };

  const clearFilters = () => {
    setFilters({
      yearFrom: '',
      yearTo: '',
    });
    
    // すべての作品を表示（制限をつけずに表示）
    setWorks(allWorks);
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
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  label="年代（から）"
                  name="yearFrom"
                  type="number"
                  value={filters.yearFrom}
                  onChange={handleFilterChange}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  label="年代（まで）"
                  name="yearTo"
                  type="number"
                  value={filters.yearTo}
                  onChange={handleFilterChange}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', gap: 1, height: '100%' }}>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    onClick={applyFilters}
                    sx={{ flexGrow: 1 }}
                  >
                    フィルター適用
                  </Button>
                  <Button 
                    variant="outlined" 
                    onClick={clearFilters} 
                    sx={{ flexGrow: 1 }}
                  >
                    クリア
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <MapIcon sx={{ mr: 1 }} />
          <Typography variant="body2" color="text.secondary">
            マップ上に表示された作品: {works.length}件 {filters.yearFrom && filters.yearTo && `(${filters.yearFrom}年〜${filters.yearTo}年)`}
          </Typography>
        </Box>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ height: 600, bgcolor: 'grey.200', position: 'relative', borderRadius: 1 }}>
          <MapComponent 
            markers={works}
            height="600px"
            zoom={5}
          />
          <Box sx={{ position: 'absolute', top: 16, right: 16, width: 320, maxHeight: 568, overflow: 'auto', bgcolor: 'background.paper', borderRadius: 1, boxShadow: 3, p: 2, zIndex: 1000 }}>
            <Typography variant="h6" gutterBottom>
              作品リスト
            </Typography>
            {works.length === 0 ? (
              <Typography variant="body2">
                条件に一致する作品はありません
              </Typography>
            ) : (
              <List dense>
                {works.map((work) => (
                  <React.Fragment key={work.id}>
                    <ListItem 
                      button 
                      onClick={() => handleWorkClick(work)}
                      selected={selectedWork && selectedWork.id === work.id}
                    >
                      <ListItemText 
                        primary={work.name} 
                        secondary={
                          <>
                            {work.architectName && <span>{work.architectName}<br /></span>}
                            {work.completedYear > 0 && `${work.completedYear}年 | `}
                            {work.city || ''}
                          </>
                        } 
                      />
                    </ListItem>
                    <Divider component="li" />
                  </React.Fragment>
                ))}
              </List>
            )}
          </Box>
        </Box>
      )}

      <Drawer
        anchor="right"
        open={showWorkDetails}
        onClose={() => setShowWorkDetails(false)}
      >
        {selectedWork && (
          <Box sx={{ width: 350, p: 3 }}>
            <Typography variant="h5" gutterBottom>
              {selectedWork.name}
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              {selectedWork.architectName && (
                <Typography variant="subtitle1" color="text.secondary">
                  {selectedWork.architectName}
                </Typography>
              )}
              <Typography variant="body2">
                {selectedWork.completedYear > 0 && `${selectedWork.completedYear}年`}
                {selectedWork.city && ` | ${selectedWork.city}`}
              </Typography>
              {selectedWork.location && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {selectedWork.location}
                </Typography>
              )}
            </Box>
            
            <Box sx={{ mb: 3, height: 200 }}>
              <MapComponent 
                singleMarker={selectedWork}
                height="200px"
                zoom={15}
              />
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
              <Button 
                variant="outlined" 
                onClick={() => setShowWorkDetails(false)}
              >
                閉じる
              </Button>
              <Button 
                variant="contained" 
                component={RouterLink}
                to={`/architecture/${selectedWork.id}`}
              >
                詳細を見る
              </Button>
            </Box>
          </Box>
        )}
      </Drawer>
    </Container>
  );
};

export default MapPage; 