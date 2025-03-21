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
  ButtonGroup,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Card,
  CardContent,
  CardActionArea,
  Tooltip,
  Link
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import BusinessIcon from '@mui/icons-material/Business';
import SchoolIcon from '@mui/icons-material/School';
import PersonIcon from '@mui/icons-material/Person';
import WorkIcon from '@mui/icons-material/Work';
import PublicIcon from '@mui/icons-material/Public';
import LanguageIcon from '@mui/icons-material/Language';
import SearchIcon from '@mui/icons-material/Search';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import LinkIcon from '@mui/icons-material/Link';
import CakeIcon from '@mui/icons-material/Cake';
import CategoryIcon from '@mui/icons-material/Category';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import { getArchitectById, getAllArchitects } from '../services/DbService';
import MapComponent from '../components/Map';
import ArchitectureList from '../components/ArchitectureList';

// Wikipediaアイコンコンポーネント
const WikipediaIcon = () => (
  <Box
    component="span"
    sx={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 24,
      height: 24,
    }}
  >
    <Typography
      variant="caption"
      component="span"
      sx={{
        fontFamily: 'serif',
        fontWeight: 'bold',
        fontSize: '16px',
      }}
    >
      W
    </Typography>
  </Box>
);

const ArchitectSinglePage = () => {
  const { id } = useParams();
  const [architect, setArchitect] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [teacherInfo, setTeacherInfo] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchArchitect = async () => {
      setLoading(true);
      try {
        const data = await getArchitectById(parseInt(id));
        if (!data) {
          setError('建築家情報が見つかりませんでした。');
          setLoading(false);
          return;
        }
        setArchitect(data);
        
        // 教師情報を取得
        const teachers = [];
        if (data.teacher1) {
          const teacherInfo = { name: data.teacher1, id: null };
          try {
            // 教師の名前からIDを検索する処理（実装は省略）
            // 実際のデータベースクエリに置き換える必要があります
            teacherInfo.id = await findArchitectIdByName(data.teacher1);
          } catch (err) {
            console.error('教師情報の取得に失敗:', err);
          }
          teachers.push(teacherInfo);
        }
        
        if (data.teacher2) {
          const teacherInfo = { name: data.teacher2, id: null };
          try {
            teacherInfo.id = await findArchitectIdByName(data.teacher2);
          } catch (err) {
            console.error('教師情報の取得に失敗:', err);
          }
          teachers.push(teacherInfo);
        }
        
        if (data.teacher3) {
          const teacherInfo = { name: data.teacher3, id: null };
          try {
            teacherInfo.id = await findArchitectIdByName(data.teacher3);
          } catch (err) {
            console.error('教師情報の取得に失敗:', err);
          }
          teachers.push(teacherInfo);
        }
        
        setTeacherInfo(teachers);
      } catch (err) {
        console.error('建築家データ取得エラー:', err);
        setError('建築家情報の読み込み中にエラーが発生しました。');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchArchitect();
    }
  }, [id]);

  // 建築家名からIDを検索する関数（実際のアプリでは適切に実装する必要があります）
  const findArchitectIdByName = async (name) => {
    // この関数は、既存の建築家データベースから名前でIDを検索する処理を実装します
    // 例: SELECT id FROM architects WHERE name = ?
    // サンプルとしてnullを返しています
    return null;
  };

  // 学校・学部情報をフォーマットする関数
  const formatEducation = () => {
    if (!architect) return null;
    
    const education = [];
    
    if (architect.school) {
      let eduStr = architect.school;
      if (architect.faculty) {
        eduStr += ` ${architect.faculty}`;
      }
      education.push(eduStr);
    }
    
    if (architect.schoolAbroad) {
      education.push(architect.schoolAbroad);
    }
    
    return education.length > 0 ? education.join('、') : null;
  };

  // 教師情報をフォーマットする関数
  const formatTeachers = () => {
    if (!teacherInfo || teacherInfo.length === 0) return null;
    
    return teacherInfo.map((teacher, index) => (
      <span key={index}>
        {index > 0 && '、'}
        {teacher.id ? (
          <Link component={RouterLink} to={`/architects/${teacher.id}`} color="inherit" underline="hover">
            {teacher.name}
          </Link>
        ) : (
          teacher.name
        )}
      </span>
    ));
  };

  // タグをクリックしたときの処理
  const handleTagClick = (tagType, value) => {
    if (!value) return;
    
    let searchParam = '';
    
    switch (tagType) {
      case 'nationality':
        searchParam = `nationality=${encodeURIComponent(value)}`;
        break;
      case 'born':
        searchParam = `birthyear_from=${encodeURIComponent(value)}&birthyear_to=${encodeURIComponent(value)}`;
        break;
      case 'died':
        searchParam = `deathyear=${encodeURIComponent(value)}`;
        break;
      case 'category':
        searchParam = `category=${encodeURIComponent(value)}`;
        break;
      default:
        return;
    }
    
    navigate(`/architects?${searchParam}`);
  };

  // Google検索とWikipediaのURL生成
  const getGoogleSearchUrl = (architectName, nationality) => {
    const searchQuery = `${architectName} ${nationality || ''} 建築家`;
    return `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
  };

  const getWikipediaSearchUrl = (architectName) => {
    return `https://ja.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(architectName)}`;
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error || !architect) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" color="error" gutterBottom>
            エラー
          </Typography>
          <Typography paragraph>
            {error || '建築家情報が見つかりませんでした。'}
          </Typography>
          <Button 
            variant="outlined" 
            startIcon={<ArrowBackIcon />} 
            onClick={() => navigate(-1)}
          >
            戻る
          </Button>
        </Paper>
      </Container>
    );
  }

  // 作品からタグを収集し、重複を除去
  const allTags = new Set();
  if (architect.works) {
    architect.works.forEach(work => {
      if (work.tag) {
        const tags = work.tag.split(',');
        tags.forEach(tag => {
          const trimmedTag = tag.trim();
          if (trimmedTag && !trimmedTag.includes('の追加建築')) {
            allTags.add(trimmedTag);
          }
        });
      }
    });
  }

  // 建築家固有のタグを生成
  const architectTags = [];
  if (architect.nationality) {
    architectTags.push(`nationality:${architect.nationality}`);
  }
  if (architect.birthYear > 0) {
    // 10年単位の年代を計算
    const decade = Math.floor(architect.birthYear / 10) * 10;
    architectTags.push(`born:${decade}s`);
  }
  if (architect.deathYear > 0) {
    architectTags.push(`died:${architect.deathYear}`);
  }
  if (architect.category) {
    architectTags.push(`category:${architect.category}`);
  }
  if (architect.school) {
    architectTags.push(`school:${architect.school}`);
  }

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
          {architect.name || '不明'}
        </Typography>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, my: 3 }}>
          {/* 建築家固有のタグを表示 */}
          {architect.nationality && (
            <Chip 
              icon={<PublicIcon />} 
              label={`nationality:${architect.nationality}`} 
              variant="outlined" 
              onClick={() => handleTagClick('nationality', architect.nationality)}
              clickable
            />
          )}
          {architect.birthYear > 0 && (
            <Chip 
              icon={<CakeIcon />} 
              label={`born:${Math.floor(architect.birthYear / 10) * 10}s`} 
              variant="outlined" 
              onClick={() => handleTagClick('born', Math.floor(architect.birthYear / 10) * 10)}
              clickable
            />
          )}
          {architect.deathYear > 0 && (
            <Chip 
              icon={<PersonOffIcon />} 
              label={`died:${architect.deathYear}`} 
              variant="outlined" 
              onClick={() => handleTagClick('died', architect.deathYear)}
              clickable
            />
          )}
          {architect.category && (
            <Chip 
              icon={<CategoryIcon />} 
              label={`category:${architect.category}`} 
              variant="outlined" 
              onClick={() => handleTagClick('category', architect.category)}
              clickable
            />
          )}
          {architect.office && (
            <Chip 
              icon={<BusinessIcon />} 
              label={architect.office} 
              variant="outlined" 
            />
          )}
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* リンクボタングループ - 区切り線の下に配置 */}
        <Box sx={{ mb: 3, display: 'flex', flexDirection: 'row', gap: 1 }}>
          {/* 事務所/建築家のホームページURLがある場合はボタンを表示 */}
          {architect.website && (
            <Tooltip title="公式ホームページ">
              <Button
                href={architect.website.startsWith('http') ? architect.website : `http://${architect.website}`}
                target="_blank"
                rel="noopener noreferrer"
                startIcon={<LinkIcon />}
                variant="contained"
                size="small"
                sx={{ 
                  backgroundColor: '#4caf50', 
                  color: '#ffffff',
                  '&:hover': { 
                    backgroundColor: '#388e3c',
                  }
                }}
              >
                ホームページ
              </Button>
            </Tooltip>
          )}
          
          <Tooltip title="Google検索">
            <Button
              href={getGoogleSearchUrl(architect.name, architect.nationality)}
              target="_blank"
              rel="noopener noreferrer"
              startIcon={<SearchIcon />}
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
              検索
            </Button>
          </Tooltip>
          
          <Tooltip title="Wikipediaで検索">
            <Button
              href={getWikipediaSearchUrl(architect.name)}
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

        <TableContainer component={Paper} variant="outlined" sx={{ mb: 4 }}>
          <Table>
            <TableBody>
              {architect.nationality && (
                <TableRow>
                  <TableCell component="th" sx={{ width: '30%', bgcolor: 'rgba(0, 0, 0, 0.03)' }}>
                    <Typography variant="subtitle2">国籍</Typography>
                  </TableCell>
                  <TableCell>{architect.nationality}</TableCell>
                </TableRow>
              )}
              
              {(architect.birthYear > 0 || architect.deathYear > 0) && (
                <TableRow>
                  <TableCell component="th" sx={{ width: '30%', bgcolor: 'rgba(0, 0, 0, 0.03)' }}>
                    <Typography variant="subtitle2">生年 - 没年</Typography>
                  </TableCell>
                  <TableCell>
                    {architect.birthYear > 0 ? `${architect.birthYear}年` : '不明'} 
                    {architect.deathYear > 0 ? ` - ${architect.deathYear}年` : ''}
                  </TableCell>
                </TableRow>
              )}

              {architect.office && (
                <TableRow>
                  <TableCell component="th" sx={{ width: '30%', bgcolor: 'rgba(0, 0, 0, 0.03)' }}>
                    <Typography variant="subtitle2">事務所</Typography>
                  </TableCell>
                  <TableCell>{architect.office}</TableCell>
                </TableRow>
              )}

              {architect.prefecture && (
                <TableRow>
                  <TableCell component="th" sx={{ width: '30%', bgcolor: 'rgba(0, 0, 0, 0.03)' }}>
                    <Typography variant="subtitle2">拠点</Typography>
                  </TableCell>
                  <TableCell>{architect.prefecture}</TableCell>
                </TableRow>
              )}
              
              {architect.nameEn && (
                <TableRow>
                  <TableCell component="th" sx={{ width: '30%', bgcolor: 'rgba(0, 0, 0, 0.03)' }}>
                    <Typography variant="subtitle2">英語表記</Typography>
                  </TableCell>
                  <TableCell>{architect.nameEn}</TableCell>
                </TableRow>
              )}

              {/* 教育背景 */}
              {(architect.school || architect.faculty || architect.schoolAbroad) && (
                <TableRow>
                  <TableCell component="th" sx={{ width: '30%', bgcolor: 'rgba(0, 0, 0, 0.03)' }}>
                    <Typography variant="subtitle2">教育背景</Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <SchoolIcon sx={{ mr: 1, fontSize: '1rem', color: 'text.secondary' }} />
                      <Typography variant="body2">{formatEducation()}</Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}

              {/* 師事した建築家 */}
              {(architect.teacher1 || architect.teacher2 || architect.teacher3) && (
                <TableRow>
                  <TableCell component="th" sx={{ width: '30%', bgcolor: 'rgba(0, 0, 0, 0.03)' }}>
                    <Typography variant="subtitle2">師事した建築家</Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {formatTeachers()}
                    </Box>
                  </TableCell>
                </TableRow>
              )}

              {/* カテゴリー */}
              {architect.category && (
                <TableRow>
                  <TableCell component="th" sx={{ width: '30%', bgcolor: 'rgba(0, 0, 0, 0.03)' }}>
                    <Typography variant="subtitle2">カテゴリー</Typography>
                  </TableCell>
                  <TableCell>{architect.category}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* 受賞歴・選定タグの表示 */}
        {allTags.size > 0 && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              受賞歴・選定
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              {Array.from(allTags).map((tag, index) => (
                <Chip 
                  key={index}
                  icon={<EmojiEventsIcon />}
                  label={tag}
                  onClick={() => handleTagClick('category', tag)}
                  clickable
                  color="secondary"
                  variant="outlined"
                  size="small"
                />
              ))}
            </Box>
          </Box>
        )}

        {architect.bio && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              経歴
            </Typography>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
              {architect.bio}
            </Typography>
          </Box>
        )}

        {architect.works && architect.works.length > 0 && (
          <>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                作品マップ
              </Typography>
              {architect.works.some(work => work.latitude && work.longitude) ? (
                <Box sx={{ height: '400px', width: '100%', mb: 3, border: '1px solid #eee', borderRadius: '4px', overflow: 'hidden' }}>
                  <MapComponent 
                    markers={architect.works.filter(work => work.latitude && work.longitude)}
                    zoom={5}
                  />
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  位置情報が登録されている作品がありません。
                </Typography>
              )}
            </Box>

            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                代表作品
              </Typography>
              <ArchitectureList architectures={architect.works} />
            </Box>
          </>
        )}
      </Paper>
    </Container>
  );
};

export default ArchitectSinglePage; 