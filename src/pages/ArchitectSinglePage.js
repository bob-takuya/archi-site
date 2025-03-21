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
  TableRow,
  Card,
  CardContent,
  CardActionArea
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import BusinessIcon from '@mui/icons-material/Business';
import SchoolIcon from '@mui/icons-material/School';
import PersonIcon from '@mui/icons-material/Person';
import WorkIcon from '@mui/icons-material/Work';
import PublicIcon from '@mui/icons-material/Public';

const ArchitectSinglePage = () => {
  const { id } = useParams();
  const [architect, setArchitect] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchArchitect = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/architects/${id}`);
        if (!response.ok) {
          throw new Error('建築家の取得に失敗しました');
        }
        const data = await response.json();
        setArchitect(data);
      } catch (error) {
        console.error('Error fetching architect:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchArchitect();
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
          to="/architects"
          startIcon={<ArrowBackIcon />}
        >
          建築家一覧に戻る
        </Button>
      </Container>
    );
  }

  if (!architect) {
    return (
      <Container>
        <Typography variant="h5" sx={{ textAlign: 'center', my: 4 }}>
          建築家が見つかりませんでした
        </Typography>
        <Button
          variant="contained"
          component={RouterLink}
          to="/architects"
          startIcon={<ArrowBackIcon />}
        >
          建築家一覧に戻る
        </Button>
      </Container>
    );
  }

  // 生年と没年の処理
  const birthYear = architect.ZAT_BIRTHYEAR > 0 ? architect.ZAT_BIRTHYEAR : null;
  const deathYear = architect.ZAT_DEATHYEAR > 0 ? architect.ZAT_DEATHYEAR : null;
  
  // 生年月日と没年月日の処理
  const formatDate = (year, month, day) => {
    if (!year || year <= 0) return null;
    
    let dateStr = `${year}年`;
    if (month && month > 0) dateStr += `${month}月`;
    if (day && day > 0) dateStr += `${day}日`;
    
    return dateStr;
  };
  
  const birthdate = formatDate(
    architect.ZAT_BIRTHYEAR, 
    architect.ZAT_BIRTHMONTH, 
    architect.ZAT_BIRTHDAY
  );
  
  const deathdate = formatDate(
    architect.ZAT_DEATHYEAR, 
    architect.ZAT_DEATHMONTH, 
    architect.ZAT_DEATHDAY
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Button
        variant="outlined"
        component={RouterLink}
        to="/architects"
        startIcon={<ArrowBackIcon />}
        sx={{ mb: 3 }}
      >
        建築家一覧に戻る
      </Button>

      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {architect.ZAT_ARCHITECT || '不明'}
        </Typography>
        {architect.ZAT_ARCHITECT_EN && (
          <Typography variant="h5" color="text.secondary" gutterBottom>
            {architect.ZAT_ARCHITECT_EN}
          </Typography>
        )}

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, my: 3 }}>
          {architect.ZAT_OFFICE && (
            <Chip 
              icon={<BusinessIcon />} 
              label={architect.ZAT_OFFICE} 
              variant="outlined" 
            />
          )}
          {architect.ZAT_PREFECTURE && (
            <Chip 
              icon={<LocationOnIcon />} 
              label={architect.ZAT_PREFECTURE} 
              variant="outlined" 
            />
          )}
          {architect.ZAT_NATIONALITY && (
            <Chip 
              icon={<PublicIcon />} 
              label={architect.ZAT_NATIONALITY} 
              variant="outlined" 
            />
          )}
          {birthdate && !deathdate && (
            <Chip 
              icon={<PersonIcon />} 
              label={birthdate} 
              variant="outlined" 
            />
          )}
          {birthdate && deathdate && (
            <Chip 
              icon={<PersonIcon />} 
              label={`${birthdate} - ${deathdate}`} 
              variant="outlined" 
            />
          )}
        </Box>

        <Divider sx={{ my: 3 }} />

        <TableContainer component={Paper} variant="outlined" sx={{ mb: 4 }}>
          <Table>
            <TableBody>
              {architect.ZAT_OFFICE && (
                <TableRow>
                  <TableCell component="th" sx={{ width: '30%', bgcolor: 'rgba(0, 0, 0, 0.03)' }}>
                    <Typography variant="subtitle2">事務所</Typography>
                  </TableCell>
                  <TableCell>
                    {architect.ZAT_OFFICE}
                    {architect.ZAT_OFFICE_EN && ` (${architect.ZAT_OFFICE_EN})`}
                  </TableCell>
                </TableRow>
              )}
              
              {(birthdate || deathdate) && (
                <TableRow>
                  <TableCell component="th" sx={{ width: '30%', bgcolor: 'rgba(0, 0, 0, 0.03)' }}>
                    <Typography variant="subtitle2">生年月日 - 没年月日</Typography>
                  </TableCell>
                  <TableCell>
                    {birthdate || '不明'} {deathdate ? `- ${deathdate}` : ''}
                  </TableCell>
                </TableRow>
              )}
              
              {architect.ZAT_PREFECTURE && (
                <TableRow>
                  <TableCell component="th" sx={{ width: '30%', bgcolor: 'rgba(0, 0, 0, 0.03)' }}>
                    <Typography variant="subtitle2">都道府県</Typography>
                  </TableCell>
                  <TableCell>{architect.ZAT_PREFECTURE}</TableCell>
                </TableRow>
              )}
              
              {architect.ZAT_NATIONALITY && (
                <TableRow>
                  <TableCell component="th" sx={{ width: '30%', bgcolor: 'rgba(0, 0, 0, 0.03)' }}>
                    <Typography variant="subtitle2">国籍</Typography>
                  </TableCell>
                  <TableCell>
                    {architect.ZAT_NATIONALITY}
                    {architect.ZAT_NATIONALITY_ENG && ` (${architect.ZAT_NATIONALITY_ENG})`}
                  </TableCell>
                </TableRow>
              )}
              
              {architect.ZAT_SCHOOL && (
                <TableRow>
                  <TableCell component="th" sx={{ width: '30%', bgcolor: 'rgba(0, 0, 0, 0.03)' }}>
                    <Typography variant="subtitle2">学歴</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography>{architect.ZAT_SCHOOL}</Typography>
                    {architect.ZAT_SCHOOL_ABROAD && (
                      <Typography variant="body2" sx={{ mt: 1 }}>{architect.ZAT_SCHOOL_ABROAD}</Typography>
                    )}
                  </TableCell>
                </TableRow>
              )}
              
              {(architect.ZAT_TEACHER1 || architect.ZAT_TEACHER2 || architect.ZAT_TEACHER3) && (
                <TableRow>
                  <TableCell component="th" sx={{ width: '30%', bgcolor: 'rgba(0, 0, 0, 0.03)' }}>
                    <Typography variant="subtitle2">師事</Typography>
                  </TableCell>
                  <TableCell>
                    {architect.ZAT_TEACHER1 && <Typography>{architect.ZAT_TEACHER1}</Typography>}
                    {architect.ZAT_TEACHER2 && <Typography>{architect.ZAT_TEACHER2}</Typography>}
                    {architect.ZAT_TEACHER3 && <Typography>{architect.ZAT_TEACHER3}</Typography>}
                  </TableCell>
                </TableRow>
              )}
              
              {(architect.ZAT_FROM_OFFICE1 || architect.ZAT_FROM_OFFICE2 || architect.ZAT_FROM_OFFICE3) && (
                <TableRow>
                  <TableCell component="th" sx={{ width: '30%', bgcolor: 'rgba(0, 0, 0, 0.03)' }}>
                    <Typography variant="subtitle2">出身事務所</Typography>
                  </TableCell>
                  <TableCell>
                    {architect.ZAT_FROM_OFFICE1 && <Typography>{architect.ZAT_FROM_OFFICE1}</Typography>}
                    {architect.ZAT_FROM_OFFICE2 && <Typography>{architect.ZAT_FROM_OFFICE2}</Typography>}
                    {architect.ZAT_FROM_OFFICE3 && <Typography>{architect.ZAT_FROM_OFFICE3}</Typography>}
                  </TableCell>
                </TableRow>
              )}
              
              {architect.ZAT_WEBSITE && (
                <TableRow>
                  <TableCell component="th" sx={{ width: '30%', bgcolor: 'rgba(0, 0, 0, 0.03)' }}>
                    <Typography variant="subtitle2">ウェブサイト</Typography>
                  </TableCell>
                  <TableCell>
                    <a href={architect.ZAT_WEBSITE} target="_blank" rel="noopener noreferrer">
                      {architect.ZAT_WEBSITE}
                    </a>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {architect.ZAT_DESCRIPTION && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              概要
            </Typography>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
              {architect.ZAT_DESCRIPTION}
            </Typography>
          </Box>
        )}

        {architect.works && architect.works.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              代表作
            </Typography>
            <Grid container spacing={3}>
              {architect.works.map((work) => (
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
                        <Typography gutterBottom variant="subtitle1" component="h3">
                          {work.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {work.year && work.year !== 0 ? work.year : '不明'} | {work.prefecture || '不明'} | {work.category || '不明'}
                        </Typography>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              ))}
            </Grid>
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Button 
                variant="outlined" 
                component={RouterLink} 
                to={`/architecture?architect=${encodeURIComponent(architect.ZAT_ARCHITECT)}`}
              >
                すべての作品を見る
              </Button>
            </Box>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default ArchitectSinglePage; 