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
import { getAllArchitectures } from '../services/api/FastArchitectureService';
import MapComponent from '../components/Map';

interface Work {
  id: number;
  name: string;
  architectName?: string;
  completedYear: number;
  city?: string;
  location: string;
  latitude: number;
  longitude: number;
}

interface Filters {
  yearFrom: string;
  yearTo: string;
}

interface TimeframeResult {
  from: number;
  to: number;
}

const MapPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [works, setWorks] = useState<Work[]>([]);
  const [allWorks, setAllWorks] = useState<Work[]>([]);
  const [filters, setFilters] = useState<Filters>({
    yearFrom: '',
    yearTo: '',
  });
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [selectedWork, setSelectedWork] = useState<Work | null>(null);
  const [showWorkDetails, setShowWorkDetails] = useState<boolean>(false);

  useEffect(() => {
    fetchWorks();
  }, []);

  // ランダムな年代の範囲を生成する関数
  const generateRandomTimeframe = (works: Work[]): TimeframeResult => {
    if (!works || works.length === 0) return { from: 0, to: 0 };
    
    // 有効な年代の作品をフィルタリング
    const validWorks = works.filter(work => work.completedYear > 0);
    if (validWorks.length === 0) return { from: 0, to: 0 };
    
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

  const fetchWorks = async (): Promise<void> => {
    setLoading(true);
    try {
      // FastArchitectureServiceを使用してデータを取得
      const response = await getAllArchitectures(1, 1000); // Load first 1000 items for map
      
      // Transform data to map format
      const mapData = response.results
        .filter(item => item.latitude && item.longitude)
        .map(item => ({
          id: item.id,
          name: item.title,
          architectName: item.architect,
          completedYear: item.year || 0,
          city: item.prefecture,
          location: item.address || '',
          latitude: item.latitude,
          longitude: item.longitude
        }));
      
      setAllWorks(mapData);
      
      // 初回読み込み時はランダムな年代フィルターを適用
      if (!filters.yearFrom && !filters.yearTo) {
        const randomTimeframe = generateRandomTimeframe(mapData);
        setFilters({
          yearFrom: randomTimeframe.from.toString(),
          yearTo: randomTimeframe.to.toString()
        });
        
        // フィルター適用
        const filteredData = mapData.filter(work => 
          work.completedYear >= randomTimeframe.from && 
          work.completedYear <= randomTimeframe.to
        );
        
        setWorks(filteredData);
      } else {
        // フィルターによる絞り込み（クライアント側で実行）
        let filteredWorks = mapData;
        
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

  const handleFilterChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = event.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };

  const applyFilters = (): void => {
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

  const clearFilters = (): void => {
    setFilters({
      yearFrom: '',
      yearTo: '',
    });
    
    // すべての作品を表示（制限をつけずに表示）
    setWorks(allWorks);
  };

  const handleWorkClick = (work: Work): void => {
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
            center={[35.6762, 139.6503]}
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
                      onClick={() => handleWorkClick(work)}
                      sx={{ 
                        cursor: 'pointer', 
                        bgcolor: selectedWork && selectedWork.id === work.id ? 'action.selected' : 'transparent',
                        '&:hover': { bgcolor: 'action.hover' } 
                      }}
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
                center={[selectedWork.latitude, selectedWork.longitude]}
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