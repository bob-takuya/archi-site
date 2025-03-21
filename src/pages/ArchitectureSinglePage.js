import React, { useState, useEffect } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CategoryIcon from '@mui/icons-material/Category';
import PersonIcon from '@mui/icons-material/Person';

const ArchitectureSinglePage = () => {
  const { id } = useParams();
  const [work, setWork] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWork = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/architecture/${id}`);
        if (!response.ok) {
          throw new Error('建築作品の取得に失敗しました');
        }
        const data = await response.json();
        setWork(data);
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
        <Typography variant="h4" component="h1" gutterBottom>
          {work.ZAR_TITLE || '無題'}
        </Typography>
        {work.ZAR_TITLE_ENG && (
          <Typography variant="h5" color="text.secondary" gutterBottom>
            {work.ZAR_TITLE_ENG}
          </Typography>
        )}

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, my: 3 }}>
          {work.ZAR_YEAR !== 0 && (
            <Chip 
              icon={<CalendarTodayIcon />} 
              label={`${work.ZAR_YEAR}年`} 
              variant="outlined" 
            />
          )}
          {work.ZAR_PREFECTURE && (
            <Chip 
              icon={<LocationOnIcon />} 
              label={work.ZAR_PREFECTURE} 
              variant="outlined" 
            />
          )}
          {work.ZAR_CATEGORY && (
            <Chip 
              icon={<CategoryIcon />} 
              label={work.ZAR_CATEGORY} 
              variant="outlined" 
            />
          )}
          {work.ZAR_ARCHITECT && (
            <Chip 
              icon={<PersonIcon />} 
              label={work.ZAR_ARCHITECT} 
              component={RouterLink}
              to={`/architects?search=${encodeURIComponent(work.ZAR_ARCHITECT)}`}
              clickable
              color="primary"
            />
          )}
        </Box>

        <Divider sx={{ my: 3 }} />

        <TableContainer component={Paper} variant="outlined" sx={{ mb: 4 }}>
          <Table>
            <TableBody>
              {work.ZAR_ADDRESS && (
                <TableRow>
                  <TableCell component="th" sx={{ width: '30%', bgcolor: 'rgba(0, 0, 0, 0.03)' }}>
                    <Typography variant="subtitle2">住所</Typography>
                  </TableCell>
                  <TableCell>{work.ZAR_ADDRESS}</TableCell>
                </TableRow>
              )}
              
              {work.ZAR_ARCHITECT && (
                <TableRow>
                  <TableCell component="th" sx={{ width: '30%', bgcolor: 'rgba(0, 0, 0, 0.03)' }}>
                    <Typography variant="subtitle2">建築家</Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                      <Typography>
                        {work.ZAR_ARCHITECT}
                        {work.ZAR_ARCHITECT_ENG && ` (${work.ZAR_ARCHITECT_ENG})`}
                      </Typography>
                      {work.ZAR_ARCHITECT1 && (
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          {work.ZAR_ARCHITECT1}
                          {work.ZAR_ARCHITECT1_ENG && ` (${work.ZAR_ARCHITECT1_ENG})`}
                        </Typography>
                      )}
                      {work.ZAR_ARCHITECT2 && (
                        <Typography variant="body2">
                          {work.ZAR_ARCHITECT2}
                          {work.ZAR_ARCHITECT2_ENG && ` (${work.ZAR_ARCHITECT2_ENG})`}
                        </Typography>
                      )}
                      {work.ZAR_ARCHITECT3 && (
                        <Typography variant="body2">
                          {work.ZAR_ARCHITECT3}
                          {work.ZAR_ARCHITECT3_ENG && ` (${work.ZAR_ARCHITECT3_ENG})`}
                        </Typography>
                      )}
                      {work.ZAR_ARCHITECT4 && (
                        <Typography variant="body2">
                          {work.ZAR_ARCHITECT4}
                          {work.ZAR_ARCHITECT4_ENG && ` (${work.ZAR_ARCHITECT4_ENG})`}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              )}
              
              {work.ZAR_CATEGORY && (
                <TableRow>
                  <TableCell component="th" sx={{ width: '30%', bgcolor: 'rgba(0, 0, 0, 0.03)' }}>
                    <Typography variant="subtitle2">カテゴリー</Typography>
                  </TableCell>
                  <TableCell>
                    {work.ZAR_CATEGORY}
                    {work.ZAR_CATEGORY_ENG && ` (${work.ZAR_CATEGORY_ENG})`}
                  </TableCell>
                </TableRow>
              )}
              
              {work.ZAR_YEAR !== 0 && (
                <TableRow>
                  <TableCell component="th" sx={{ width: '30%', bgcolor: 'rgba(0, 0, 0, 0.03)' }}>
                    <Typography variant="subtitle2">竣工年</Typography>
                  </TableCell>
                  <TableCell>{work.ZAR_YEAR}年</TableCell>
                </TableRow>
              )}
              
              {work.ZAR_CONTRACTOR && (
                <TableRow>
                  <TableCell component="th" sx={{ width: '30%', bgcolor: 'rgba(0, 0, 0, 0.03)' }}>
                    <Typography variant="subtitle2">施工者</Typography>
                  </TableCell>
                  <TableCell>{work.ZAR_CONTRACTOR}</TableCell>
                </TableRow>
              )}
              
              {work.ZAR_STRUCTURAL_DESIGNER && (
                <TableRow>
                  <TableCell component="th" sx={{ width: '30%', bgcolor: 'rgba(0, 0, 0, 0.03)' }}>
                    <Typography variant="subtitle2">構造設計</Typography>
                  </TableCell>
                  <TableCell>{work.ZAR_STRUCTURAL_DESIGNER}</TableCell>
                </TableRow>
              )}
              
              {work.ZAR_LANDSCAPE_DESIGNER && (
                <TableRow>
                  <TableCell component="th" sx={{ width: '30%', bgcolor: 'rgba(0, 0, 0, 0.03)' }}>
                    <Typography variant="subtitle2">ランドスケープデザイン</Typography>
                  </TableCell>
                  <TableCell>{work.ZAR_LANDSCAPE_DESIGNER}</TableCell>
                </TableRow>
              )}
              
              {work.ZAR_URL && (
                <TableRow>
                  <TableCell component="th" sx={{ width: '30%', bgcolor: 'rgba(0, 0, 0, 0.03)' }}>
                    <Typography variant="subtitle2">関連URL</Typography>
                  </TableCell>
                  <TableCell>
                    <a href={work.ZAR_URL} target="_blank" rel="noopener noreferrer">
                      {work.ZAR_URL}
                    </a>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {work.ZAR_DESCRIPTION && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              説明
            </Typography>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
              {work.ZAR_DESCRIPTION}
            </Typography>
          </Box>
        )}

        {(work.ZAR_LATITUDE && work.ZAR_LONGITUDE) && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              地図
            </Typography>
            <Box sx={{ height: 400, bgcolor: 'grey.200', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Typography>
                位置情報: {work.ZAR_LATITUDE}, {work.ZAR_LONGITUDE}
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              * 地図の実装にはGoogle MapsなどのAPIを使用します
            </Typography>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default ArchitectureSinglePage; 