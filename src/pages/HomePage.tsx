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
// Import moved inside function to prevent module hanging
// import { getAllArchitectures } from '../services/db/ArchitectureService';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';

interface ArchitectureWork {
  id: number;
  title: string;
  architect?: string;
  year?: number;
  address?: string;
}

const HomePage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [recentWorks, setRecentWorks] = useState<ArchitectureWork[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isDbReady, setIsDbReady] = useState<boolean>(false);
  const [downloadProgress, setDownloadProgress] = useState<{
    progress: number;
    speed: number;
    eta: number;
    receivedLength: number;
    totalLength: number;
  } | null>(null);

  useEffect(() => {
    // Listen for database download progress events
    const handleProgressUpdate = (event: CustomEvent) => {
      const { progress, speed, eta, receivedLength, totalLength } = event.detail;
      setDownloadProgress({ progress, speed, eta, receivedLength, totalLength });
    };
    
    window.addEventListener('database-download-progress', handleProgressUpdate as EventListener);
    
    // Fast JSON loading - should complete in under 3 seconds
    const emergencyTimeout = setTimeout(() => {
      console.warn('Emergency timeout: forcing app to render without data after 30 seconds');
      setLoading(false);
      setIsDbReady(false);
      setError('データの読み込みがタイムアウトしました（30秒）。ネットワーク接続を確認してください。');
    }, 30000); // 30 seconds for fast JSON loading

    const fetchRecentWorks = async (): Promise<void> => {
      try {
        setLoading(true);
        setError(null);
        console.log('最近の建築作品を取得中...');
        
        // Use fast JSON-based service instead of SQLite
        const { getAllArchitectures } = await import('../services/api/FastArchitectureService');
        
        // Fast JSON loading timeout - should complete in under 3 seconds
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('データの読み込みがタイムアウトしました（30秒）。ネットワーク接続を確認してください。')), 30000);
        });
        
        const dataPromise = getAllArchitectures(1, 6);
        const data = await Promise.race([dataPromise, timeoutPromise]) as any;
        
        clearTimeout(emergencyTimeout);
        setRecentWorks(data.results || []);
        setIsDbReady(true);
        console.log('建築作品の取得に成功しました', data);
      } catch (error: any) {
        console.error('建築作品の取得に失敗:', error);
        clearTimeout(emergencyTimeout);
        
        // Enhanced error messages with actionable guidance
        let errorMessage = error.message || 'データベースからの読み込みに失敗しました';
        
        if (error.message?.includes('timeout')) {
          errorMessage += ' インターネット接続が遅い可能性があります。しばらく待ってからページを再読み込みしてください。';
        } else if (error.message?.includes('fetch')) {
          errorMessage += ' ネットワーク接続を確認してください。';
        }
        
        setError(errorMessage);
        // Don't block the UI - show emergency fallback
        setIsDbReady(false);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentWorks();
    
    return () => {
      clearTimeout(emergencyTimeout);
      window.removeEventListener('database-download-progress', handleProgressUpdate as EventListener);
    };
  }, []);

  const handleSearch = (e: React.FormEvent): void => {
    e.preventDefault();
    if (searchTerm.trim()) {
      window.location.href = `#/architecture?search=${encodeURIComponent(searchTerm)}`;
    }
  };
  
  const handleRetry = () => {
    setError(null);
    setLoading(true);
    setDownloadProgress(null);
    window.location.reload();
  };
  
  const formatSpeed = (speed: number): string => {
    if (speed < 1024) return `${Math.round(speed)} B/s`;
    if (speed < 1024 * 1024) return `${Math.round(speed / 1024)} KB/s`;
    return `${Math.round(speed / 1024 / 1024)} MB/s`;
  };
  
  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m ${Math.round(seconds % 60)}s`;
    return `${Math.round(seconds / 3600)}h ${Math.round((seconds % 3600) / 60)}m`;
  };

  return (
    <Container maxWidth="lg" data-testid="homepage-container">
      {/* Hero Section */}
      <Fade in={true} timeout={1000}>
        <Box
          component="section"
          role="banner"
          aria-labelledby="main-heading"
          sx={{
            pt: 8,
            pb: 6,
            textAlign: 'center',
            background: 'linear-gradient(135deg, #ECEFF4 0%, #D8DEE9 100%)',
            borderRadius: 3,
            mb: 6,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              opacity: 0.1,
              background: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(46, 52, 64, 0.1) 10px, rgba(46, 52, 64, 0.1) 20px)',
            }}
          />
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Typography
              component="h1"
              variant="h1"
              align="center"
              color="text.primary"
              gutterBottom
              id="main-heading"
              sx={{
                background: 'linear-gradient(135deg, #2E3440 0%, #4C566A 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
                mb: 2,
              }}
            >
              建築データベース
            </Typography>
            <Typography 
              variant="h5" 
              align="center" 
              color="text.secondary" 
              paragraph
              sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}
            >
              日本の建築作品と建築家を検索・閲覧できる
              <br />
              包括的なデータベース
            </Typography>

            {/* Quick Stats */}
            <Stack 
              direction="row" 
              spacing={3} 
              justifyContent="center" 
              sx={{ mb: 4 }}
            >
              <Chip 
                icon={<ArchitectureIcon />}
                label="14,000+ 建築作品"
                color="primary"
                variant="outlined"
              />
              <Chip 
                icon={<PeopleIcon />}
                label="2,900+ 建築家"
                color="secondary"
                variant="outlined"
              />
              <Chip 
                icon={<MapIcon />}
                label="全国対応"
                color="info"
                variant="outlined"
              />
            </Stack>

            {/* Search Section */}
            <Fade in={true} timeout={1500}>
              <Box 
                component="form" 
                onSubmit={handleSearch}
                role="search"
                aria-label="建築作品検索"
                sx={{ 
                  mt: 4,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  maxWidth: 600,
                  mx: 'auto',
                  gap: 2,
                }}
              >
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="建築作品、建築家、住所などで検索"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  inputProps={{
                    'aria-label': '建築作品検索',
                    'data-testid': 'search-input',
                    role: 'searchbox'
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'white',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    },
                  }}
                />
                <Button 
                  type="submit"
                  variant="contained" 
                  color="primary"
                  startIcon={<SearchIcon />}
                  size="large"
                  data-testid="search-button"
                  sx={{
                    px: 3,
                    py: 1.5,
                    minWidth: 120,
                  }}
                >
                  検索
                </Button>
              </Box>
            </Fade>
            {!isDbReady && loading && (
              <Box sx={{ mt: 4, maxWidth: 600, mx: 'auto' }}>
                {downloadProgress ? (
                  <Paper sx={{ p: 3, background: 'rgba(255, 255, 255, 0.9)', borderRadius: 2 }}>
                    <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
                      📦 大きなデータベースを読み込み中...
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <CircularProgress 
                          variant="determinate" 
                          value={downloadProgress.progress} 
                          size={24} 
                          sx={{ mr: 2 }}
                        />
                        <Typography variant="body2" color="text.secondary">
                          {downloadProgress.progress}% • {Math.round(downloadProgress.receivedLength / 1024 / 1024)} MB / {Math.round(downloadProgress.totalLength / 1024 / 1024)} MB
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={downloadProgress.progress} 
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>
                    <Stack direction="row" spacing={2} sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
                      <Box>📊 {formatSpeed(downloadProgress.speed)}</Box>
                      <Box>⏱️ ETA: {formatTime(downloadProgress.eta)}</Box>
                    </Stack>
                    <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic', color: 'text.secondary' }}>
                      最適化されたデータを読み込み中です。通常1-3秒で完了します。
                    </Typography>
                  </Paper>
                ) : (
                  <Paper sx={{ p: 3, background: 'rgba(255, 255, 255, 0.9)', borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                      <CircularProgress size={24} sx={{ mr: 2 }} />
                      <Typography variant="h6" sx={{ color: 'primary.main' }}>
                        データベースを初期化中...
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" align="center">
                      14,000件の建築作品データを読み込み中です
                      <br />
                      <em>最適化されたデータで高速読み込み中（1-3秒）</em>
                    </Typography>
                  </Paper>
                )}
              </Box>
            )}
          </Box>
        </Box>
      </Fade>

      {/* Recent Works Section */}
      <Box component="section" aria-labelledby="recent-works-heading" sx={{ py: 4 }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 3 
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <TrendingUpIcon color="primary" />
            <Typography variant="h4" fontWeight="bold" id="recent-works-heading" component="h2">
              最近の建築作品
            </Typography>
          </Box>
          
          {isDbReady && (
            <Tooltip title="リフレッシュ">
              <IconButton 
                onClick={() => window.location.reload()}
                color="primary"
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
        
        {error && (
          <Fade in={true}>
            <Alert 
              severity="error" 
              sx={{ 
                mb: 3,
                borderRadius: 2,
                '& .MuiAlert-message': {
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                }
              }}
            >
              <Box>
                {error}
                <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                  <Button 
                    size="small" 
                    variant="contained" 
                    color="primary"
                    onClick={handleRetry}
                    startIcon={<RefreshIcon />}
                  >
                    再試行
                  </Button>
                  <Button 
                    size="small" 
                    variant="outlined" 
                    component={RouterLink} 
                    to="/db-explorer"
                  >
                    診断ツールを開く
                  </Button>
                </Stack>
              </Box>
            </Alert>
          </Fade>
        )}

        {loading ? (
          <LoadingSkeleton variant="card" count={6} />
        ) : recentWorks && recentWorks.length > 0 ? (
          <Fade in={true} timeout={800}>
            <Grid container spacing={4}>
              {recentWorks.map((work, index) => (
                <Grid item key={work.id} xs={12} sm={6} md={4}>
                  <Fade in={true} timeout={1000 + index * 200}>
                    <Card 
                      sx={{ 
                        height: '100%', 
                        display: 'flex', 
                        flexDirection: 'column',
                        background: 'linear-gradient(135deg, #FFFFFF 0%, #F8F9FA 100%)',
                        border: '1px solid #E5E9F0',
                        '&:hover': {
                          '& .card-content': {
                            transform: 'translateY(-2px)',
                          },
                        },
                      }}
                    >
                      <CardActionArea 
                        component={RouterLink} 
                        to={`/architecture/${work.id}`}
                        sx={{ height: '100%' }}
                      >
                        <CardContent 
                          className="card-content"
                          sx={{ 
                            flexGrow: 1, 
                            transition: 'transform 0.3s ease-in-out',
                            p: 3,
                          }}
                        >
                          <Typography 
                            gutterBottom 
                            variant="h6" 
                            component="h3"
                            sx={{ 
                              fontWeight: 600,
                              color: 'text.primary',
                              mb: 2,
                              lineHeight: 1.3,
                            }}
                          >
                            {work.title}
                          </Typography>
                          
                          <Stack spacing={1}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <PeopleIcon fontSize="small" color="secondary" />
                              <Typography variant="body2" color="text.secondary">
                                {work.architect || '建築家不明'}
                              </Typography>
                            </Box>
                            
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <MapIcon fontSize="small" color="secondary" />
                              <Typography variant="body2" color="text.secondary">
                                {work.address || '場所不明'} • {work.year && work.year !== 0 ? work.year + '年' : '年代不明'}
                              </Typography>
                            </Box>
                          </Stack>
                        </CardContent>
                      </CardActionArea>
                    </Card>
                  </Fade>
                </Grid>
              ))}
            </Grid>
          </Fade>
        ) : (
          <Paper sx={{ 
            p: 6, 
            textAlign: 'center',
            background: 'linear-gradient(135deg, #F8F9FA 0%, #ECEFF4 100%)',
          }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              建築作品が見つかりませんでした
            </Typography>
            <Typography variant="body2" color="text.secondary">
              データベースの接続を確認してください
            </Typography>
          </Paper>
        )}
        
        {isDbReady && (
          <Fade in={true} timeout={1200}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Button 
                variant="outlined" 
                color="primary" 
                component={RouterLink} 
                to="/architecture"
                size="large"
                sx={{
                  px: 4,
                  py: 1.5,
                  borderWidth: 2,
                  '&:hover': {
                    borderWidth: 2,
                  },
                }}
              >
                すべての作品を見る
              </Button>
            </Box>
          </Fade>
        )}
      </Box>

      <Divider sx={{ my: 6 }} />

      {/* Feature Cards Section */}
      <Fade in={true} timeout={1400}>
        <Box component="section" aria-labelledby="features-heading" sx={{ mb: 6 }}>
          <Typography 
            variant="h4" 
            align="center" 
            gutterBottom 
            id="features-heading"
            component="h2"
            sx={{ mb: 4, fontWeight: 'bold' }}
          >
            データベースの特徴
          </Typography>
          
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  background: 'linear-gradient(135deg, #88C0D0 0%, #5E81AC 100%)',
                  color: 'white',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    top: -20,
                    right: -20,
                    opacity: 0.2,
                  }}
                >
                  <ArchitectureIcon sx={{ fontSize: 100 }} />
                </Box>
                <CardContent sx={{ position: 'relative', zIndex: 1, p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <ArchitectureIcon sx={{ mr: 2, fontSize: 32 }} />
                    <Typography variant="h5" fontWeight="bold">
                      建築作品
                    </Typography>
                  </Box>
                  <Typography paragraph sx={{ mb: 3, opacity: 0.9 }}>
                    日本全国から14,000件以上の建築作品情報を閲覧できます。地域、年代、カテゴリーなどで詳細検索が可能です。
                  </Typography>
                  <Button 
                    variant="contained" 
                    component={RouterLink} 
                    to="/architecture"
                    sx={{ 
                      mt: 'auto',
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      color: 'white',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.3)',
                      },
                    }}
                  >
                    作品を探す
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  background: 'linear-gradient(135deg, #D08770 0%, #BF616A 100%)',
                  color: 'white',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    top: -20,
                    right: -20,
                    opacity: 0.2,
                  }}
                >
                  <PeopleIcon sx={{ fontSize: 100 }} />
                </Box>
                <CardContent sx={{ position: 'relative', zIndex: 1, p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <PeopleIcon sx={{ mr: 2, fontSize: 32 }} />
                    <Typography variant="h5" fontWeight="bold">
                      建築家
                    </Typography>
                  </Box>
                  <Typography paragraph sx={{ mb: 3, opacity: 0.9 }}>
                    2,900人以上の建築家情報を収録。経歴、作品リスト、所属事務所などの詳細情報を確認できます。
                  </Typography>
                  <Button 
                    variant="contained" 
                    component={RouterLink} 
                    to="/architects"
                    sx={{ 
                      mt: 'auto',
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      color: 'white',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.3)',
                      },
                    }}
                  >
                    建築家を探す
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  background: 'linear-gradient(135deg, #A3BE8C 0%, #8CAF69 100%)',
                  color: 'white',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    top: -20,
                    right: -20,
                    opacity: 0.2,
                  }}
                >
                  <MapIcon sx={{ fontSize: 100 }} />
                </Box>
                <CardContent sx={{ position: 'relative', zIndex: 1, p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <MapIcon sx={{ mr: 2, fontSize: 32 }} />
                    <Typography variant="h5" fontWeight="bold">
                      マップ表示
                    </Typography>
                  </Box>
                  <Typography paragraph sx={{ mb: 3, opacity: 0.9 }}>
                    建築作品を地図上で視覚的に探索できます。位置情報をもとに周辺の建築作品を発見できます。
                  </Typography>
                  <Button 
                    variant="contained" 
                    component={RouterLink} 
                    to="/map"
                    sx={{ 
                      mt: 'auto',
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      color: 'white',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.3)',
                      },
                    }}
                  >
                    マップを開く
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </Fade>
    </Container>
  );
};

export default HomePage; 