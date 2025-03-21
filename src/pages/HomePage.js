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
  Paper
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

const HomePage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [recentWorks, setRecentWorks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentWorks = async () => {
      try {
        const response = await fetch('/api/architecture?limit=6');
        const data = await response.json();
        setRecentWorks(data.data);
      } catch (error) {
        console.error('Error fetching recent works:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentWorks();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      window.location.href = `/architecture?search=${encodeURIComponent(searchTerm)}`;
    }
  };

  return (
    <Container maxWidth="lg">
      <Box
        sx={{
          pt: 8,
          pb: 6,
          textAlign: 'center',
        }}
      >
        <Typography
          component="h1"
          variant="h2"
          align="center"
          color="text.primary"
          gutterBottom
        >
          建築データベース
        </Typography>
        <Typography variant="h5" align="center" color="text.secondary" paragraph>
          日本の建築作品と建築家を検索・閲覧できるデータベース
        </Typography>

        <Box 
          component="form" 
          onSubmit={handleSearch}
          sx={{ 
            mt: 4,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            maxWidth: 600,
            mx: 'auto'
          }}
        >
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
      </Box>

      <Box sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          最近の建築作品
        </Typography>
        <Grid container spacing={4}>
          {loading ? (
            <Typography>読み込み中...</Typography>
          ) : (
            recentWorks.map((work) => (
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
                      <Typography gutterBottom variant="h5" component="h2">
                        {work.title}
                      </Typography>
                      <Typography color="text.secondary">
                        {work.architect || '不明'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {work.year && work.year !== 0 ? work.year : '不明'} | {work.prefecture || '不明'} | {work.category || '不明'}
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Button 
            variant="outlined" 
            color="primary" 
            component={RouterLink} 
            to="/architecture"
          >
            すべての作品を見る
          </Button>
        </Box>
      </Box>

      <Grid container spacing={4} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
          <Paper
            sx={{
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
            }}
          >
            <Typography variant="h5" gutterBottom>
              建築作品
            </Typography>
            <Typography paragraph>
              日本全国から14,000件以上の建築作品情報を閲覧できます。地域、年代、カテゴリーなどで検索可能です。
            </Typography>
            <Button 
              variant="contained" 
              color="primary" 
              component={RouterLink} 
              to="/architecture"
              sx={{ mt: 'auto', alignSelf: 'flex-start' }}
            >
              作品を探す
            </Button>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper
            sx={{
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
            }}
          >
            <Typography variant="h5" gutterBottom>
              建築家
            </Typography>
            <Typography paragraph>
              2,900人以上の建築家情報を収録。経歴、作品リスト、所属事務所などの情報を確認できます。
            </Typography>
            <Button 
              variant="contained" 
              color="primary" 
              component={RouterLink} 
              to="/architects"
              sx={{ mt: 'auto', alignSelf: 'flex-start' }}
            >
              建築家を探す
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default HomePage; 