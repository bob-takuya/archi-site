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
  Tooltip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ArchitectureIcon from '@mui/icons-material/AccountBalance';
import PeopleIcon from '@mui/icons-material/People';
import MapIcon from '@mui/icons-material/Map';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import RefreshIcon from '@mui/icons-material/Refresh';
import { getAllArchitectures } from '../services/db/ArchitectureService';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';

interface ArchitectureWork {
  ZAW_ID: number;
  ZAW_NAME: string;
  ZAW_ARCHITECT?: string;
  ZAW_YEAR?: number;
  ZAW_ADDRESS?: string;
}

const HomePage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [recentWorks, setRecentWorks] = useState<ArchitectureWork[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isDbReady, setIsDbReady] = useState<boolean>(false);

  useEffect(() => {
    const fetchRecentWorks = async (): Promise<void> => {
      try {
        setLoading(true);
        setError(null);
        console.log('最近の建築作品を取得中...');
        const data = await getAllArchitectures(1, 6);
        setRecentWorks(data.items);
        setIsDbReady(true);
        console.log('建築作品の取得に成功しました', data);
      } catch (error: any) {
        console.error('建築作品の取得に失敗:', error);
        setError(error.message || 'データベースからの読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchRecentWorks();
  }, []);

  const handleSearch = (e: React.FormEvent): void => {
    e.preventDefault();
    if (searchTerm.trim()) {
      window.location.href = `/architecture?search=${encodeURIComponent(searchTerm)}`;
    }
  };

  return (
    <Container maxWidth="lg">
      {/* Hero Section */}
      <Fade in={true} timeout={1000}>
        <Box
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
            {isDbReady ? (
              <Fade in={true} timeout={1500}>
                <Box 
                  component="form" 
                  onSubmit={handleSearch}
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
            ) : (
              <LoadingSkeleton variant="hero" />
            )}
          </Box>
        </Box>
      </Fade>

      {/* Recent Works Section */}
      <Box sx={{ py: 4 }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 3 
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <TrendingUpIcon color="primary" />
            <Typography variant="h4" fontWeight="bold">
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
                <Button 
                  size="small" 
                  variant="outlined" 
                  sx={{ ml: 2 }} 
                  component={RouterLink} 
                  to="/db-explorer"
                >
                  診断ツールを開く
                </Button>
              </Box>
            </Alert>
          </Fade>
        )}

        {loading ? (
          <LoadingSkeleton variant="card" count={6} />
        ) : recentWorks.length > 0 ? (
          <Fade in={true} timeout={800}>
            <Grid container spacing={4}>
              {recentWorks.map((work, index) => (
                <Grid item key={work.ZAW_ID} xs={12} sm={6} md={4}>
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
                        to={`/architecture/${work.ZAW_ID}`}
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
                            {work.ZAW_NAME}
                          </Typography>
                          
                          <Stack spacing={1}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <PeopleIcon fontSize="small" color="secondary" />
                              <Typography variant="body2" color="text.secondary">
                                {work.ZAW_ARCHITECT || '建築家不明'}
                              </Typography>
                            </Box>
                            
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <MapIcon fontSize="small" color="secondary" />
                              <Typography variant="body2" color="text.secondary">
                                {work.ZAW_ADDRESS || '場所不明'} • {work.ZAW_YEAR && work.ZAW_YEAR !== 0 ? work.ZAW_YEAR + '年' : '年代不明'}
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
        <Box sx={{ mb: 6 }}>
          <Typography 
            variant="h4" 
            align="center" 
            gutterBottom 
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