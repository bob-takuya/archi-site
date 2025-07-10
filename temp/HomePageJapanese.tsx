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
  Fade,
  Chip,
  Stack,
  Divider,
  IconButton,
  Tooltip,
  LinearProgress,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Search as SearchIcon,
  Architecture as ArchitectureIcon,
  People as PeopleIcon,
  Map as MapIcon,
  TrendingUp as TrendingUpIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  Info as InfoIcon,
  Star as StarIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  Visibility as ViewIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import CategoryGrid from '../components/CategoryGrid';
import BreadcrumbNavigation from '../components/BreadcrumbNavigation';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';

interface ArchitectureWork {
  id: number;
  title: string;
  architect?: string;
  year?: number;
  address?: string;
  category?: string;
  style?: string;
  visits?: number;
  rating?: number;
}

interface QuickStats {
  totalArchitectures: number;
  totalArchitects: number;
  categories: number;
  regions: number;
  recentlyAdded: number;
  mostViewed: string;
}

const HomePageJapanese: React.FC = () => {
  const theme = useTheme();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [recentWorks, setRecentWorks] = useState<ArchitectureWork[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isDbReady, setIsDbReady] = useState<boolean>(false);
  const [quickStats, setQuickStats] = useState<QuickStats | null>(null);
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
    
    // Fast JSON loading with timeout
    const emergencyTimeout = setTimeout(() => {
      console.warn('緊急タイムアウト: 30秒後にデータなしでアプリをレンダリングします');
      setLoading(false);
      setIsDbReady(false);
      setError('データの読み込みがタイムアウトしました（30秒）。ネットワーク接続を確認してください。');
    }, 30000);

    const fetchData = async (): Promise<void> => {
      try {
        setLoading(true);
        setError(null);
        console.log('日本建築データベースからデータを取得中...');
        
        // Use fast JSON-based service
        const { getAllArchitectures } = await import('../services/api/FastArchitectureService');
        
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('データの読み込みがタイムアウトしました（30秒）。ネットワーク接続を確認してください。')), 30000);
        });
        
        const dataPromise = getAllArchitectures(1, 8);
        const data = await Promise.race([dataPromise, timeoutPromise]) as any;
        
        clearTimeout(emergencyTimeout);
        setRecentWorks(data.results || []);
        
        // Set quick stats (mock data for now)
        setQuickStats({
          totalArchitectures: 14200,
          totalArchitects: 2900,
          categories: 8,
          regions: 47,
          recentlyAdded: 156,
          mostViewed: '東京駅'
        });
        
        setIsDbReady(true);
        console.log('日本建築データの取得に成功しました', data);
      } catch (error: any) {
        console.error('建築データの取得に失敗:', error);
        clearTimeout(emergencyTimeout);
        
        let errorMessage = error.message || 'データベースからの読み込みに失敗しました';
        
        if (error.message?.includes('timeout')) {
          errorMessage += ' インターネット接続が遅い可能性があります。しばらく待ってからページを再読み込みしてください。';
        } else if (error.message?.includes('fetch')) {
          errorMessage += ' ネットワーク接続を確認してください。';
        }
        
        setError(errorMessage);
        setIsDbReady(false);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
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
      {/* Breadcrumb Navigation */}
      <BreadcrumbNavigation variant="compact" showHome={false} />
      
      {/* Hero Section with Japanese Design */}
      <Fade in={true} timeout={1000}>
        <Box
          component="section"
          role="banner"
          aria-labelledby="main-heading"
          sx={{
            pt: 6,
            pb: 8,
            textAlign: 'center',
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
            borderRadius: 2,
            mb: 6,
            position: 'relative',
            overflow: 'hidden',
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
          }}
        >
          {/* Traditional Pattern Background */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              opacity: 0.05,
              background: 'url("data:image/svg+xml,%3Csvg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="%23000" fill-opacity="1" fill-rule="evenodd"%3E%3Cpath d="M0 0h40v40H0z" fill="none"/%3E%3Cpath d="M20 0L0 20v20h40V20z"/%3E%3C/g%3E%3C/svg%3E")',
            }}
          />
          
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Typography
              component="h1"
              variant="h1"
              align="center"
              gutterBottom
              id="main-heading"
              sx={{
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
                mb: 3,
                fontWeight: 700,
              }}
            >
              日本建築データベース
            </Typography>
            
            <Typography 
              variant="h5" 
              align="center" 
              color="text.secondary" 
              paragraph
              sx={{ 
                mb: 4, 
                maxWidth: 700, 
                mx: 'auto', 
                lineHeight: 1.6,
                fontWeight: 400,
              }}
            >
              日本全国の建築作品と建築家の情報を探索・閲覧できる
              <br />
              包括的なデータベースシステム
            </Typography>

            {/* Comprehensive Quick Stats */}
            {quickStats && (
              <Fade in={true} timeout={1200}>
                <Grid container spacing={2} justifyContent="center" sx={{ mb: 4, maxWidth: 800, mx: 'auto' }}>
                  <Grid item xs={6} sm={3}>
                    <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: alpha(theme.palette.primary.main, 0.05) }}>
                      <ArchitectureIcon color="primary" sx={{ mb: 1 }} />
                      <Typography variant="h6" fontWeight="bold" color="primary.main">
                        {quickStats.totalArchitectures.toLocaleString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        建築作品
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: alpha(theme.palette.secondary.main, 0.05) }}>
                      <PeopleIcon color="secondary" sx={{ mb: 1 }} />
                      <Typography variant="h6" fontWeight="bold" color="secondary.main">
                        {quickStats.totalArchitects.toLocaleString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        建築家
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: alpha(theme.palette.info.main, 0.05) }}>
                      <FilterIcon color="info" sx={{ mb: 1 }} />
                      <Typography variant="h6" fontWeight="bold" color="info.main">
                        {quickStats.categories}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        カテゴリー
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: alpha(theme.palette.success.main, 0.05) }}>
                      <LocationIcon color="success" sx={{ mb: 1 }} />
                      <Typography variant="h6" fontWeight="bold" color="success.main">
                        {quickStats.regions}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        都道府県
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </Fade>
            )}

            {/* Enhanced Search Section */}
            <Fade in={true} timeout={1500}>
              <Paper 
                elevation={3} 
                sx={{ 
                  p: 3, 
                  maxWidth: 700, 
                  mx: 'auto', 
                  backgroundColor: 'background.paper',
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
                }}
              >
                <Typography variant="h6" gutterBottom align="center" sx={{ mb: 2 }}>
                  建築作品・建築家を検索
                </Typography>
                <Box 
                  component="form" 
                  onSubmit={handleSearch}
                  role="search"
                  aria-label="建築作品検索"
                  sx={{ 
                    display: 'flex',
                    gap: 2,
                    alignItems: 'center',
                  }}
                >
                  <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="建築作品名、建築家名、住所、スタイルなどで検索"
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
                      px: 4,
                      py: 1.5,
                      minWidth: 120,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    検索
                  </Button>
                </Box>
                
                {/* Quick Search Suggestions */}
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    人気の検索キーワード:
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {['安藤忠雄', '伊東豊雄', '隅研吾', 'モダン建築', '伝統建築', '住宅', '美術館'].map((keyword) => (
                      <Chip
                        key={keyword}
                        label={keyword}
                        size="small"
                        clickable
                        onClick={() => setSearchTerm(keyword)}
                        sx={{ 
                          fontSize: '0.75rem',
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.primary.main, 0.1),
                          },
                        }}
                      />
                    ))}
                  </Stack>
                </Box>
              </Paper>
            </Fade>
            
            {/* Loading State */}
            {!isDbReady && loading && (
              <Box sx={{ mt: 4, maxWidth: 600, mx: 'auto' }}>
                {downloadProgress ? (
                  <Paper sx={{ p: 3, background: 'rgba(255, 255, 255, 0.95)', borderRadius: 2 }}>
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
                      <Box>📈 {formatSpeed(downloadProgress.speed)}</Box>
                      <Box>⏱️ ETA: {formatTime(downloadProgress.eta)}</Box>
                    </Stack>
                    <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic', color: 'text.secondary' }}>
                      最適化されたデータを読み込み中です。通常1-3秒で完了します。
                    </Typography>
                  </Paper>
                ) : (
                  <Paper sx={{ p: 3, background: 'rgba(255, 255, 255, 0.95)', borderRadius: 2 }}>
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

      {/* Category Grid - Primary Navigation Method for Japanese Users */}
      {!loading && (
        <CategoryGrid 
          title="カテゴリー別に探す" 
          subtitle="日本の建築作品をカテゴリーから探索してみましょう" 
          maxItems={6}
        />
      )}

      <Divider sx={{ my: 6 }} />

      {/* Recent Works Section with Enhanced Information Display */}
      <Box component="section" aria-labelledby="recent-works-heading" sx={{ py: 4 }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 4 
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <TrendingUpIcon color="primary" sx={{ fontSize: '2rem' }} />
            <Box>
              <Typography variant="h3" fontWeight="bold" id="recent-works-heading" component="h2">
                最新の建築作品
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                新しく登録された註目の作品をご紹介
              </Typography>
            </Box>
          </Box>
          
          {isDbReady && (
            <Tooltip title="リフレッシュ">
              <IconButton 
                onClick={() => window.location.reload()}
                color="primary"
                size="large"
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
                mb: 4,
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
          <LoadingSkeleton variant="card" count={8} />
        ) : recentWorks && recentWorks.length > 0 ? (
          <Fade in={true} timeout={800}>
            <Grid container spacing={3}>
              {recentWorks.map((work, index) => (
                <Grid item key={work.id} xs={12} sm={6} md={4} lg={3}>
                  <Fade in={true} timeout={1000 + index * 200}>
                    <Card 
                      sx={{ 
                        height: '100%', 
                        display: 'flex', 
                        flexDirection: 'column',
                        transition: 'all 0.3s ease-in-out',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: `0 12px 32px ${alpha(theme.palette.primary.main, 0.2)}`,
                        },
                      }}
                    >
                      <CardActionArea 
                        component={RouterLink} 
                        to={`/architecture/${work.id}`}
                        sx={{ height: '100%' }}
                      >
                        <CardContent sx={{ 
                          flexGrow: 1, 
                          p: 3,
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                        }}>
                          {/* Title */}
                          <Typography 
                            gutterBottom 
                            variant="h6" 
                            component="h3"
                            sx={{ 
                              fontWeight: 600,
                              color: 'text.primary',
                              mb: 2,
                              lineHeight: 1.4,
                              flexGrow: 1,
                            }}
                          >
                            {work.title}
                          </Typography>
                          
                          {/* Comprehensive Information Display */}
                          <Stack spacing={1.5} sx={{ mt: 'auto' }}>
                            {/* Architect */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <PeopleIcon fontSize="small" color="secondary" />
                              <Typography variant="body2" color="text.secondary" fontWeight={500}>
                                {work.architect || '建築家不明'}
                              </Typography>
                            </Box>
                            
                            {/* Location and Year */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <LocationIcon fontSize="small" color="info" />
                              <Typography variant="body2" color="text.secondary">
                                {work.address || '場所不明'}
                              </Typography>
                            </Box>
                            
                            {work.year && work.year !== 0 && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <CalendarIcon fontSize="small" color="success" />
                                <Typography variant="body2" color="text.secondary">
                                  {work.year}年竣工
                                </Typography>
                              </Box>
                            )}
                            
                            {/* Additional metadata */}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                              {work.category && (
                                <Chip
                                  label={work.category}
                                  size="small"
                                  variant="outlined"
                                  sx={{ fontSize: '0.7rem' }}
                                />
                              )}
                              
                              {work.visits && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <ViewIcon fontSize="small" sx={{ color: 'text.disabled' }} />
                                  <Typography variant="caption" color="text.disabled">
                                    {work.visits.toLocaleString()}
                                  </Typography>
                                </Box>
                              )}
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
            background: `linear-gradient(135deg, ${alpha(theme.palette.background.elevated, 0.8)} 0%, ${alpha(theme.palette.background.paper, 0.9)} 100%)`,
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
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
              <Button 
                variant="contained" 
                color="primary" 
                component={RouterLink} 
                to="/architecture"
                size="large"
                sx={{
                  px: 6,
                  py: 2,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                }}
              >
                すべての建築作品を見る
              </Button>
            </Box>
          </Fade>
        )}
      </Box>

      <Divider sx={{ my: 6 }} />

      {/* Enhanced Feature Information with Japanese Information Density */}
      <Fade in={true} timeout={1400}>
        <Box component="section" aria-labelledby="features-heading" sx={{ mb: 6 }}>
          <Typography 
            variant="h3" 
            align="center" 
            gutterBottom 
            id="features-heading"
            component="h2"
            sx={{ mb: 6, fontWeight: 'bold', color: 'primary.main' }}
          >
            データベースの特徴と機能
          </Typography>
          
          <Grid container spacing={4}>
            {/* Architecture Database Feature */}
            <Grid item xs={12} md={4}>
              <Card
                sx={{
                  height: '100%',
                  background: 'linear-gradient(135deg, #8D6E63 0%, #A1887F 100%)',
                  color: 'white',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <CardContent sx={{ p: 4, height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', mr: 2, width: 56, height: 56 }}>
                      <ArchitectureIcon sx={{ fontSize: '2rem' }} />
                    </Avatar>
                    <Typography variant="h4" fontWeight="bold">
                      建築作品
                    </Typography>
                  </Box>
                  
                  <Typography paragraph sx={{ mb: 3, opacity: 0.95, lineHeight: 1.7 }}>
                    日本全国から14,000件以上の建築作品情報を収録。地域、年代、カテゴリー、建築家、建築スタイルなどの詳細検索が可能です。
                  </Typography>
                  
                  {/* Detailed Features List */}
                  <List dense sx={{ color: 'white', mb: 3 }}>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon sx={{ color: 'white', minWidth: 30 }}>
                        <InfoIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="詳細な建築情報と写真" 
                        primaryTypographyProps={{ fontSize: '0.875rem' }}
                      />
                    </ListItem>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon sx={{ color: 'white', minWidth: 30 }}>
                        <LocationIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="正確な位置情報とアクセス" 
                        primaryTypographyProps={{ fontSize: '0.875rem' }}
                      />
                    </ListItem>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon sx={{ color: 'white', minWidth: 30 }}>
                        <CalendarIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="竣工年、設計年の詳細" 
                        primaryTypographyProps={{ fontSize: '0.875rem' }}
                      />
                    </ListItem>
                  </List>
                  
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
            
            {/* Architects Database Feature */}
            <Grid item xs={12} md={4}>
              <Card
                sx={{
                  height: '100%',
                  background: 'linear-gradient(135deg, #D2691E 0%, #F4A460 100%)',
                  color: 'white',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <CardContent sx={{ p: 4, height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', mr: 2, width: 56, height: 56 }}>
                      <PeopleIcon sx={{ fontSize: '2rem' }} />
                    </Avatar>
                    <Typography variant="h4" fontWeight="bold">
                      建築家
                    </Typography>
                  </Box>
                  
                  <Typography paragraph sx={{ mb: 3, opacity: 0.95, lineHeight: 1.7 }}>
                    2,900人以上の建築家情報を収録。経歴、代表作品、所属事務所、受賞歴などの詳細情報を確認できます。
                  </Typography>
                  
                  <List dense sx={{ color: 'white', mb: 3 }}>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon sx={{ color: 'white', minWidth: 30 }}>
                        <StarIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="代表作品と受賞歴" 
                        primaryTypographyProps={{ fontSize: '0.875rem' }}
                      />
                    </ListItem>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon sx={{ color: 'white', minWidth: 30 }}>
                        <InfoIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="経歴と所属事務所" 
                        primaryTypographyProps={{ fontSize: '0.875rem' }}
                      />
                    </ListItem>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon sx={{ color: 'white', minWidth: 30 }}>
                        <ArchitectureIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="建築スタイルと理念" 
                        primaryTypographyProps={{ fontSize: '0.875rem' }}
                      />
                    </ListItem>
                  </List>
                  
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
            
            {/* Map and Research Feature */}
            <Grid item xs={12} md={4}>
              <Card
                sx={{
                  height: '100%',
                  background: 'linear-gradient(135deg, #CD5C5C 0%, #F08080 100%)',
                  color: 'white',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <CardContent sx={{ p: 4, height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', mr: 2, width: 56, height: 56 }}>
                      <MapIcon sx={{ fontSize: '2rem' }} />
                    </Avatar>
                    <Typography variant="h4" fontWeight="bold">
                      マップ機能
                    </Typography>
                  </Box>
                  
                  <Typography paragraph sx={{ mb: 3, opacity: 0.95, lineHeight: 1.7 }}>
                    建築作品を地図上で視覚的に探索。位置情報をもとに周辺の建築作品や関連施設を発見できます。
                  </Typography>
                  
                  <List dense sx={{ color: 'white', mb: 3 }}>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon sx={{ color: 'white', minWidth: 30 }}>
                        <LocationIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="インタラクティブマップ" 
                        primaryTypographyProps={{ fontSize: '0.875rem' }}
                      />
                    </ListItem>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon sx={{ color: 'white', minWidth: 30 }}>
                        <FilterIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="エリア別フィルタリング" 
                        primaryTypographyProps={{ fontSize: '0.875rem' }}
                      />
                    </ListItem>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon sx={{ color: 'white', minWidth: 30 }}>
                        <AnalyticsIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="統計データと分析" 
                        primaryTypographyProps={{ fontSize: '0.875rem' }}
                      />
                    </ListItem>
                  </List>
                  
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

export default HomePageJapanese;