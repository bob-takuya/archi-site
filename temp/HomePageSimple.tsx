import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  CardActionArea,
  TextField,
  Button,
  Box,
  Container,
  Paper,
  CircularProgress,
  Alert,
  Snackbar,
  Fade,
  Chip,
  Stack,
  Divider,
  IconButton,
  Tooltip,
  LinearProgress
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ArchitectureIcon from '@mui/icons-material/AccountBalance';
import PeopleIcon from '@mui/icons-material/People';
import MapIcon from '@mui/icons-material/Map';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import RefreshIcon from '@mui/icons-material/Refresh';
import { executeSimpleQuery, isSimpleDatabaseReady, isSimpleDatabaseLoading, initSimpleDatabase } from '../services/db/SimpleDatabase';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';

interface ArchitectureWork {
  Z_PK: number;
  ZAR_TITLE: string;
  ZAR_ARCHITECT?: string;
  ZAR_YEAR?: number;
  ZAR_ADDRESS?: string;
}

const HomePageSimple: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [recentWorks, setRecentWorks] = useState<ArchitectureWork[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [dbStatus, setDbStatus] = useState<{
    status: string;
    message: string;
    count?: number;
  }>({ status: 'initializing', message: 'データベースを初期化中...' });

  useEffect(() => {
    // Listen for database status events
    const handleStatusUpdate = (event: CustomEvent) => {
      const { status, message, count } = event.detail;
      setDbStatus({ status, message, count });
      
      if (status === 'ready') {
        fetchRecentWorks();
      } else if (status === 'error') {
        setError(message);
        setLoading(false);
      }
    };
    
    window.addEventListener('database-status', handleStatusUpdate as EventListener);
    
    // Initialize database
    const initDb = async () => {
      try {
        await initSimpleDatabase();
      } catch (error: any) {
        setError(error.message);
        setLoading(false);
      }
    };
    
    initDb();
    
    return () => {
      window.removeEventListener('database-status', handleStatusUpdate as EventListener);
    };
  }, []);

  const fetchRecentWorks = async (): Promise<void> => {
    try {
      console.log('最近の建築作品を取得中...');
      
      const data = await executeSimpleQuery<ArchitectureWork>(
        'SELECT * FROM ZCDARCHITECTURE ORDER BY ZAR_YEAR DESC, Z_PK DESC LIMIT 6'
      );
      
      setRecentWorks(data || []);
      console.log('建築作品の取得に成功しました', data.length, '件');
    } catch (error: any) {
      console.error('建築作品の取得に失敗:', error);
      setError('データベースからの読み込みに失敗しました: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent): void => {
    e.preventDefault();
    if (searchTerm.trim()) {
      window.location.href = `#/architecture?search=${encodeURIComponent(searchTerm)}`;
    }
  };
  
  const handleRetry = () => {
    setError(null);
    setLoading(true);
    window.location.reload();
  };

  return (
    <Container maxWidth="lg">
      {/* Hero Section */}
      <Box sx={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        borderRadius: 2,
        p: 6,
        mb: 4,
        mt: 2,
        textAlign: 'center'
      }}>
        <Typography variant="h2" component="h1" gutterBottom sx={{ 
          fontWeight: 'bold',
          mb: 2
        }}>
          建築データベース
        </Typography>
        <Typography variant="h6" sx={{ 
          mb: 4,
          opacity: 0.9 
        }}>
          日本の建築作品と建築家を検索・閲覧できる
          包括的なデータベース
        </Typography>
        
        {/* Statistics */}
        <Stack direction="row" spacing={4} justifyContent="center" sx={{ mb: 4 }}>
          <Chip 
            icon={<ArchitectureIcon />} 
            label={`${dbStatus.count?.toLocaleString() || '14,000+'} 建築作品`}
            sx={{ 
              backgroundColor: 'rgba(255,255,255,0.2)', 
              color: 'white',
              '& .MuiChip-icon': { color: 'white' }
            }}
          />
          <Chip 
            icon={<PeopleIcon />} 
            label="2,900+ 建築家"
            sx={{ 
              backgroundColor: 'rgba(255,255,255,0.2)', 
              color: 'white',
              '& .MuiChip-icon': { color: 'white' }
            }}
          />
          <Chip 
            icon={<MapIcon />} 
            label="47 都道府県"
            sx={{ 
              backgroundColor: 'rgba(255,255,255,0.2)', 
              color: 'white',
              '& .MuiChip-icon': { color: 'white' }
            }}
          />
        </Stack>

        {/* Search Bar */}
        <Paper 
          component="form" 
          onSubmit={handleSearch}
          sx={{ 
            p: '2px 4px', 
            display: 'flex', 
            alignItems: 'center',
            maxWidth: 600,
            mx: 'auto'
          }}
        >
          <TextField
            fullWidth
            variant="outlined"
            placeholder="建築作品名、建築家、住所で検索"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              sx: { 
                '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                pl: 2
              }
            }}
          />
          <Button 
            type="submit" 
            variant="contained" 
            startIcon={<SearchIcon />}
            sx={{ 
              borderRadius: '0 4px 4px 0',
              px: 3,
              py: 1.5
            }}
          >
            検索
          </Button>
        </Paper>
      </Box>

      {/* Database Status */}
      {(loading || dbStatus.status !== 'ready') && (
        <Paper sx={{ p: 3, mb: 4, textAlign: 'center' }}>
          {dbStatus.status === 'error' ? (
            <Alert severity="error" action={
              <Button color="inherit" size="small" onClick={handleRetry}>
                再試行
              </Button>
            }>
              {dbStatus.message}
            </Alert>
          ) : (
            <Box>
              <CircularProgress sx={{ mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                {dbStatus.message}
              </Typography>
              {dbStatus.status === 'downloading' && (
                <Typography variant="body2" color="text.secondary">
                  {dbStatus.count ? `${dbStatus.count}件の建築データを読み込み中です` : '14,000件の建築データを読み込み中です'}
                </Typography>
              )}
            </Box>
          )}
        </Paper>
      )}

      {/* Error Alert */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 4 }}
          action={
            <IconButton
              color="inherit"
              size="small"
              onClick={handleRetry}
            >
              <RefreshIcon />
            </IconButton>
          }
        >
          {error}
        </Alert>
      )}

      {/* Recent Works Section */}
      {!loading && recentWorks.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <TrendingUpIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h4" component="h2">
              最近の建築作品
            </Typography>
            <Box sx={{ ml: 'auto' }}>
              <Button 
                component={RouterLink} 
                to="/architecture"
                variant="outlined"
              >
                すべての作品を見る
              </Button>
            </Box>
          </Box>

          <Grid container spacing={3}>
            {recentWorks.map((work) => (
              <Grid item key={work.Z_PK} xs={12} sm={6} md={4}>
                <Card sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'scale(1.02)',
                  },
                }}>
                  <CardActionArea 
                    component={RouterLink} 
                    to={`/architecture/${work.Z_PK}`}
                    sx={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'flex-start',
                      height: '100%',
                    }}
                  >
                    <CardContent sx={{ width: '100%', flexGrow: 1 }}>
                      <Typography gutterBottom variant="h6" component="h3">
                        {work.ZAR_TITLE}
                      </Typography>
                      
                      <Stack spacing={1}>
                        {work.ZAR_ARCHITECT && (
                          <Typography variant="body2" color="text.secondary">
                            <strong>{work.ZAR_ARCHITECT}</strong>
                          </Typography>
                        )}
                        
                        {work.ZAR_ADDRESS && (
                          <Typography variant="body2" color="text.secondary">
                            {work.ZAR_ADDRESS}
                          </Typography>
                        )}
                        
                        {work.ZAR_YEAR && work.ZAR_YEAR > 0 && (
                          <Typography variant="body2" color="primary">
                            {work.ZAR_YEAR}年
                          </Typography>
                        )}
                      </Stack>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Loading Skeleton */}
      {loading && !error && (
        <LoadingSkeleton />
      )}

      {/* Database Features Section */}
      <Divider sx={{ my: 6 }} />
      
      <Typography variant="h4" component="h2" gutterBottom sx={{ mb: 4, textAlign: 'center' }}>
        データベースの特徴
      </Typography>
      
      <Grid container spacing={4}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center', height: '100%' }}>
            <ArchitectureIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              建築作品
            </Typography>
            <Typography variant="body2" color="text.secondary">
              日本全国の14,000件以上の建築作品情報を収録。
              最新の作品から歴史的建造物まで幅広くカバー。
            </Typography>
            <Button 
              component={RouterLink} 
              to="/architecture"
              variant="contained" 
              sx={{ mt: 2 }}
            >
              作品を見る
            </Button>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center', height: '100%' }}>
            <PeopleIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              建築家
            </Typography>
            <Typography variant="body2" color="text.secondary">
              作品詳細、経歴、受賞歴など、
              建築家の包括的な情報を提供。
            </Typography>
            <Button 
              component={RouterLink} 
              to="/architects"
              variant="contained" 
              sx={{ mt: 2 }}
            >
              建築家を見る
            </Button>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center', height: '100%' }}>
            <MapIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              マップ表示
            </Typography>
            <Typography variant="body2" color="text.secondary">
              地図上で建築作品の位置を確認。
              エリア別の建築を効率的に探索。
            </Typography>
            <Button 
              component={RouterLink} 
              to="/map"
              variant="contained" 
              sx={{ mt: 2 }}
            >
              マップを見る
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default HomePageSimple;