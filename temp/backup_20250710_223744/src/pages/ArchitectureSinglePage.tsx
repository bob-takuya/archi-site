import React, { useState, useEffect } from 'react';
import { useParams, Link as RouterLink, useNavigate } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Box, 
  Grid, 
  Paper, 
  Chip,
  Divider,
  Button,
  CircularProgress,
  IconButton,
  Tooltip,
  ButtonGroup
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CategoryIcon from '@mui/icons-material/Category';
import PersonIcon from '@mui/icons-material/Person';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import ImageSearchIcon from '@mui/icons-material/ImageSearch';
import WikipediaIcon from '@mui/icons-material/LanguageOutlined';
import { getArchitectureById as getArchitectureByIdFast } from '../services/api/FastArchitectureService';
import MapComponent from '../components/Map';

const ArchitectureSinglePage = () => {
  const { id } = useParams();
  const [work, setWork] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchWork = async () => {
      setLoading(true);
      try {
        const data = await getArchitectureByIdFast(parseInt(id));
        if (!data) {
          throw new Error('建築作品が見つかりませんでした');
        }
        
        // Transform the data to match the expected format
        const transformedData = {
          id: data.id,
          name: data.title,
          location: data.address,
          completedYear: data.year || 0,
          latitude: data.latitude,
          longitude: data.longitude,
          architect: data.architect ? { 
            id: 0, // We don't have architect ID in JSON
            name: data.architect 
          } : null,
          city: data.prefecture || '', // Use prefecture field
          bigCategory: data.big_category || data.category,
          category: data.category,
          description: data.description,
          tag: data.tags || '', // Use tags field from JSON
          shinkenchikuUrl: data.shinkenchiku_url || '', // Use actual shinkenchiku URL
          contractor: data.contractor,
          structuralDesigner: data.structural_designer,
          landscapeDesigner: data.landscape_designer
        };
        
        setWork(transformedData);
      } catch (error) {
        console.error('Error fetching work:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchWork();
  }, [id]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container>
        <Typography variant="h5" color="error" sx={{ textAlign: 'center', my: 4 }}>
          エラーが発生しました: {error}
        </Typography>
        <Button
          variant="contained"
          component={RouterLink}
          to="/architecture"
          startIcon={<ArrowBackIcon />}
        >
          建築作品一覧に戻る
        </Button>
      </Container>
    );
  }

  if (!work) {
    return (
      <Container>
        <Typography variant="h5" sx={{ textAlign: 'center', my: 4 }}>
          建築作品が見つかりませんでした
        </Typography>
        <Button
          variant="contained"
          component={RouterLink}
          to="/architecture"
          startIcon={<ArrowBackIcon />}
        >
          建築作品一覧に戻る
        </Button>
      </Container>
    );
  }

  // タグ文字列を配列に変換
  const tags = work.tag 
    ? work.tag.split(',')
        .filter(tag => tag.trim() !== '' && !tag.includes('の追加建築'))
    : [];

  // 新建築の年月情報を抽出（例：新建築2014年7月号 -> 2014年7月号）
  const shinkenchikuInfo = tags.find(tag => tag.includes('新建築'));
  const shinkenchikuLabel = shinkenchikuInfo ? shinkenchikuInfo.replace('新建築', '') : '';

  // タグクリック時の処理
  const handleTagClick = (tag) => {
    console.log(`タグがクリックされました: ${tag}`);
    // tag: prefixを使用してタグ検索を実行
    navigate(`/architecture?search=tag:${encodeURIComponent(tag)}`);
  };

  // Google画像検索とWikipediaのURL生成
  const getGoogleImageSearchUrl = (workName, architect) => {
    const searchQuery = `${workName} ${architect?.name || ''} 建築`;
    return `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}&tbm=isch`;
  };

  const getWikipediaSearchUrl = (workName) => {
    return `https://ja.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(workName)}`;
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Button
        variant="outlined"
        component={RouterLink}
        to="/architecture"
        startIcon={<ArrowBackIcon />}
        sx={{ mb: 3 }}
      >
        建築作品一覧に戻る
      </Button>

      <Paper sx={{ p: 3, mb: 4 }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            {work.name || '無題'}
          </Typography>
          
          {work.location && (
            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
              <LocationOnIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
              {work.location}
            </Typography>
          )}

          {/* 基本情報タグ */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            {work.completedYear !== 0 && (
              <Chip 
                icon={<CalendarTodayIcon />} 
                label={`${work.completedYear}年`} 
                variant="outlined" 
                size="small"
                onClick={() => navigate(`/architecture?year=${work.completedYear}`)}
                clickable
              />
            )}
            {work.city && (
              <Chip 
                icon={<LocationOnIcon />} 
                label={work.city} 
                variant="outlined" 
                size="small"
                onClick={() => navigate(`/architecture?prefecture=${encodeURIComponent(work.city)}`)}
                clickable
              />
            )}
            {work.architect && work.architect.name && (
              <Chip 
                icon={<PersonIcon />} 
                label={work.architect.name} 
                component={RouterLink}
                to={`/architects/${work.architect.id}`}
                clickable
                color="primary"
                size="small"
              />
            )}
            {work.bigCategory && (
              <Chip 
                icon={<CategoryIcon />} 
                label={work.bigCategory} 
                variant="outlined" 
                size="small"
                onClick={() => navigate(`/architecture?category=${encodeURIComponent(work.bigCategory)}`)}
                clickable
              />
            )}
            {work.category && work.category !== work.bigCategory && (
              <Chip 
                icon={<CategoryIcon />} 
                label={work.category} 
                variant="outlined" 
                size="small"
                onClick={() => navigate(`/architecture?category=${encodeURIComponent(work.category)}`)}
                clickable
              />
            )}
          </Box>

          {/* 受賞歴・選定タグ */}
          {tags.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              {tags.map((tag, index) => (
                <Chip 
                  key={index}
                  icon={<EmojiEventsIcon />}
                  label={tag}
                  onClick={() => handleTagClick(tag)}
                  clickable
                  color="secondary"
                  variant="outlined"
                  size="small"
                />
              ))}
            </Box>
          )}
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* リンクボタングループ - 区切り線の下に移動 */}
        <Box sx={{ mb: 3, display: 'flex', flexDirection: 'row', gap: 1 }}>
          {/* 新建築リンクがある場合はボタンを表示 */}
          {work.shinkenchikuUrl && (
            <Tooltip title="新建築データで見る">
              <Button 
                variant="contained"
                href={work.shinkenchikuUrl} 
                target="_blank"
                rel="noopener noreferrer"
                size="small"
                sx={{ 
                  backgroundColor: '#003366', // 紺色
                  color: '#ffffff',
                  '&:hover': { 
                    backgroundColor: '#002244',
                  }
                }}
              >
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  justifyContent: 'center',
                  mr: 0.5
                }}>
                  <img
                    src="https://data.shinkenchiku.online/favicon.ico"
                    alt="新建築データ"
                    style={{
                      height: '16px',
                      width: 'auto',
                      marginRight: '4px'
                    }}
                  />
                </Box>
                {shinkenchikuLabel && (
                  <Typography variant="caption">
                    {shinkenchikuLabel}
                  </Typography>
                )}
              </Button>
            </Tooltip>
          )}
          
          <Tooltip title="Google画像検索">
            <Button
              href={getGoogleImageSearchUrl(work.name, work.architect)}
              target="_blank"
              rel="noopener noreferrer"
              startIcon={<ImageSearchIcon />}
              variant="contained"
              size="small"
              sx={{ 
                backgroundColor: '#4285F4', 
                color: '#ffffff',
                '&:hover': { 
                  backgroundColor: '#3367D6',
                }
              }}
            >
              画像
            </Button>
          </Tooltip>
          
          <Tooltip title="Wikipediaで検索">
            <Button
              href={getWikipediaSearchUrl(work.name)}
              target="_blank"
              rel="noopener noreferrer"
              startIcon={<WikipediaIcon />}
              variant="contained"
              size="small"
              sx={{ 
                backgroundColor: '#333333', 
                color: '#ffffff',
                '&:hover': { 
                  backgroundColor: '#222222',
                }
              }}
            >
              Wikipedia
            </Button>
          </Tooltip>
        </Box>

        {work.description && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              概要
            </Typography>
            <Typography variant="body1" paragraph sx={{ whiteSpace: 'pre-line' }}>
              {work.description}
            </Typography>
          </Box>
        )}

        {/* 建築関係者情報 */}
        {(work.contractor || work.structuralDesigner || work.landscapeDesigner) && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              建築関係者
            </Typography>
            <Grid container spacing={2}>
              {work.contractor && (
                <Grid item xs={12} sm={4}>
                  <Typography variant="subtitle2" color="text.secondary">
                    施工
                  </Typography>
                  <Typography variant="body2">
                    {work.contractor}
                  </Typography>
                </Grid>
              )}
              {work.structuralDesigner && (
                <Grid item xs={12} sm={4}>
                  <Typography variant="subtitle2" color="text.secondary">
                    構造設計
                  </Typography>
                  <Typography variant="body2">
                    {work.structuralDesigner}
                  </Typography>
                </Grid>
              )}
              {work.landscapeDesigner && (
                <Grid item xs={12} sm={4}>
                  <Typography variant="subtitle2" color="text.secondary">
                    ランドスケープ
                  </Typography>
                  <Typography variant="body2">
                    {work.landscapeDesigner}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Box>
        )}

        {work.latitude && work.longitude && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              位置情報
            </Typography>
            <Box sx={{ height: '400px', width: '100%', mt: 2, border: '1px solid #eee', borderRadius: '4px', overflow: 'hidden' }}>
              <MapComponent 
                singleMarker={{
                  id: work.id || 0,
                  latitude: work.latitude,
                  longitude: work.longitude,
                  name: work.name,
                  location: work.location
                }}
                center={[work.latitude, work.longitude]}
                zoom={15}
              />
            </Box>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default ArchitectureSinglePage; 