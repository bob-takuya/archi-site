import React, { useState, useEffect } from 'react';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  CardActionArea,
  TextField,
  Button,
  Box,
  Pagination,
  CircularProgress,
  Chip,
  Paper,
  IconButton,
  InputAdornment,
  Popover,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import SortIcon from '@mui/icons-material/Sort';
import PersonIcon from '@mui/icons-material/Person';
import BusinessIcon from '@mui/icons-material/Business';
import CakeIcon from '@mui/icons-material/Cake';
import PublicIcon from '@mui/icons-material/Public';
import CategoryIcon from '@mui/icons-material/Category';
import SchoolIcon from '@mui/icons-material/School';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { getAllArchitects, getArchitectTags } from '../services/DbService';

const ArchitectsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);

  // 状態変数
  const [architects, setArchitects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState(queryParams.get('search') || '');
  const [selectedTags, setSelectedTags] = useState(queryParams.get('tags') ? queryParams.get('tags').split(',') : []);
  const [availableTags, setAvailableTags] = useState([]);
  const [sortBy, setSortBy] = useState(queryParams.get('sortBy') || 'name');
  const [sortOrder, setSortOrder] = useState(queryParams.get('sortOrder') || 'asc');
  
  // タグ選択用の状態
  const [tagAnchorEl, setTagAnchorEl] = useState(null);
  const [selectedTagCategory, setSelectedTagCategory] = useState(null);
  const [yearAnchorEl, setYearAnchorEl] = useState(null);
  const [currentTagForYear, setCurrentTagForYear] = useState('');
  const [tagsYears, setTagsYears] = useState({});
  
  // 新しいフィルターパラメータ
  const [nationality, setNationality] = useState(queryParams.get('nationality') || '');
  const [category, setCategory] = useState(queryParams.get('category') || '');
  const [school, setSchool] = useState(queryParams.get('school') || '');
  const [birthYearFrom, setBirthYearFrom] = useState(queryParams.get('birthyear_from') || '');
  const [birthYearTo, setBirthYearTo] = useState(queryParams.get('birthyear_to') || '');
  const [deathYear, setDeathYear] = useState(queryParams.get('deathyear') || '');

  // タグをロード
  useEffect(() => {
    const loadTags = async () => {
      try {
        const tags = await getArchitectTags();
        setAvailableTags(tags);
      } catch (error) {
        console.error('タグ取得エラー:', error);
      }
    };
    
    loadTags();
  }, []);

  // 建築家データ読み込み
  useEffect(() => {
    const loadArchitects = async () => {
      setLoading(true);
      try {
        // クエリパラメータの取得
        const page = parseInt(queryParams.get('page')) || 1;
        const search = queryParams.get('search') || '';
        const tags = queryParams.get('tags') ? queryParams.get('tags').split(',') : [];
        const sort = queryParams.get('sortBy') || 'name';
        const order = queryParams.get('sortOrder') || 'asc';
        
        // 新しいフィルターの取得
        const nat = queryParams.get('nationality') || '';
        const cat = queryParams.get('category') || '';
        const sch = queryParams.get('school') || '';
        const birthFrom = queryParams.get('birthyear_from') || 0;
        const birthTo = queryParams.get('birthyear_to') || 0;
        const death = queryParams.get('deathyear') || 0;
        
        // 状態を更新
        setCurrentPage(page);
        setSearchTerm(search);
        setSelectedTags(tags);
        setSortBy(sort);
        setSortOrder(order);
        setNationality(nat);
        setCategory(cat);
        setSchool(sch);
        setBirthYearFrom(birthFrom);
        setBirthYearTo(birthTo);
        setDeathYear(death);
        
        // APIを呼び出してデータを取得
        const result = await getAllArchitects(
          page, 
          12, // 1ページあたりの表示数
          search,
          tags,
          sort,
          order,
          nat,
          cat,
          sch,
          birthFrom,
          birthTo,
          death
        );
        
        setArchitects(result.items || []);
        setTotalPages(result.totalPages || 0);
      } catch (error) {
        console.error('建築家取得エラー:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadArchitects();
  }, [location.search]);

  // 検索実行時の処理
  const handleSearch = (e) => {
    if (e) e.preventDefault();
    
    const params = new URLSearchParams();
    if (searchTerm) params.append('search', searchTerm);
    if (selectedTags.length > 0) params.append('tags', selectedTags.join(','));
    if (sortBy !== 'name') params.append('sortBy', sortBy);
    if (sortOrder !== 'asc') params.append('sortOrder', sortOrder);
    if (nationality) params.append('nationality', nationality);
    if (category) params.append('category', category);
    if (school) params.append('school', school);
    if (birthYearFrom) params.append('birthyear_from', birthYearFrom);
    if (birthYearTo) params.append('birthyear_to', birthYearTo);
    if (deathYear) params.append('deathyear', deathYear);
    
    // ページは1に戻す
    params.append('page', 1);
    
    navigate(`/architects?${params.toString()}`);
  };

  // ページ変更時の処理
  const handlePageChange = (event, value) => {
    const params = new URLSearchParams(location.search);
    params.set('page', value);
    navigate(`/architects?${params.toString()}`);
  };

  // 検索フィールド変更の処理
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  // タグ選択時の処理
  const handleTagSelect = (event, newTags) => {
    setSelectedTags(newTags);
    
    // タグが変更されたらURLを更新
    const params = new URLSearchParams(location.search);
    if (newTags.length > 0) {
      params.set('tags', newTags.join(','));
    } else {
      params.delete('tags');
    }
    params.set('page', 1);
    navigate(`/architects?${params.toString()}`);
  };

  // 年度タグの表示
  const handleYearMenuOpen = (event, tag) => {
    setYearAnchorEl(event.currentTarget);
    setCurrentTagForYear(tag);
    
    // 年度情報（村野藤吾賞のような受賞年の選択肢）をセット
    // 実際のアプリケーションでは、APIから取得するか、予め定義した値を使用
    setTagsYears(prev => ({
      ...prev,
      [tag]: ['2020年', '2016年', '2015年', '2014年', '2013年', '2012年', '2011年']
    }));
  };

  // 年度選択ポップオーバーを閉じる
  const handleYearMenuClose = () => {
    setYearAnchorEl(null);
    setCurrentTagForYear('');
  };

  // 特定の年度を選択
  const handleYearSelect = (year) => {
    if (year) {
      const tagValue = `${currentTagForYear}${year}`;
      
      // タグを更新
      if (!selectedTags.includes(tagValue)) {
        const newTags = selectedTags.filter(tag => tag !== currentTagForYear);
        newTags.push(tagValue);
        setSelectedTags(newTags);
        
        // URLを更新
        const params = new URLSearchParams(location.search);
        params.set('tags', newTags.join(','));
        params.set('page', 1);
        navigate(`/architects?${params.toString()}`);
      }
    } else {
      // 「指定なし」を選択した場合、基本タグのみ表示
      if (!selectedTags.includes(currentTagForYear)) {
        const newTags = [...selectedTags, currentTagForYear];
        setSelectedTags(newTags);
        
        // URLを更新
        const params = new URLSearchParams(location.search);
        params.set('tags', newTags.join(','));
        params.set('page', 1);
        navigate(`/architects?${params.toString()}`);
      }
    }
    
    handleYearMenuClose();
  };

  // 並び替え選択時の処理
  const handleSortChange = (event) => {
    const sortValue = event.target.value;
    let newSortBy, newSortOrder;
    
    // sortValueからsortByとsortOrderを取得（例: "name_asc" → sortBy: "name", sortOrder: "asc"）
    const [by, order] = sortValue.split('_');
    newSortBy = by;
    newSortOrder = order;
    
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    
    // URLを更新
    const params = new URLSearchParams(location.search);
    params.set('sortBy', newSortBy);
    params.set('sortOrder', newSortOrder);
    navigate(`/architects?${params.toString()}`);
  };

  // 建築家カードのタグクリック処理
  const handleArchitectTagClick = (tagType, value, event) => {
    event.preventDefault();
    event.stopPropagation();
    
    let params = new URLSearchParams();
    
    switch (tagType) {
      case 'nationality':
        params.set('nationality', value);
        break;
      case 'birthYear':
        params.set('birthyear_from', value);
        params.set('birthyear_to', value);
        break;
      case 'deathYear':
        params.set('deathyear', value);
        break;
      case 'office':
        params.set('search', value);
        break;
      default:
        return;
    }
    
    // ソート順を維持
    if (sortBy !== 'name') params.set('sortBy', sortBy);
    if (sortOrder !== 'asc') params.set('sortOrder', sortOrder);
    
    params.set('page', 1);
    navigate(`/architects?${params.toString()}`);
  };

  // 検索フィールドクリア
  const handleClearSearch = () => {
    setSearchTerm('');
  };

  // 全フィルタークリア
  const handleClearAllFilters = () => {
    setSearchTerm('');
    setSelectedTags([]);
    setSortBy('name');
    setSortOrder('asc');
    setNationality('');
    setCategory('');
    setSchool('');
    setBirthYearFrom('');
    setBirthYearTo('');
    setDeathYear('');
    navigate('/architects');
  };

  // タグアイコンの取得
  const getTagIcon = (tagType) => {
    switch (tagType) {
      case 'nationality':
        return <PublicIcon fontSize="small" />;
      case 'birth':
        return <CakeIcon fontSize="small" />;
      case 'death':
        return <PersonIcon fontSize="small" />;
      case 'category':
        return <CategoryIcon fontSize="small" />;
      case 'school':
        return <SchoolIcon fontSize="small" />;
      default:
        return null;
    }
  };

  // タグリストの取得（カテゴリ別）
  const getTagsByCategory = (category) => {
    switch (category) {
      case 'nationality':
        return availableTags
          .filter(tag => tag.startsWith('nationality:'))
          .map(tag => tag.substring(12));
      case 'birth':
        return availableTags
          .filter(tag => tag.startsWith('born:'))
          .map(tag => tag.substring(5));
      case 'death':
        return availableTags
          .filter(tag => tag.startsWith('died:'))
          .map(tag => tag.substring(5));
      case 'category':
        return availableTags
          .filter(tag => tag.startsWith('category:'))
          .map(tag => tag.substring(9));
      case 'school':
        return availableTags
          .filter(tag => tag.startsWith('school:'))
          .map(tag => tag.substring(7));
      default:
        return [];
    }
  };

  // 現在の検索条件を表示するコンポーネント
  const CurrentSearchInfo = () => {
    const hasFilters = searchTerm || nationality || category || school || birthYearFrom || birthYearTo || deathYear || selectedTags.length > 0;
    
    if (!hasFilters) return null;
    
    return (
      <Box sx={{ mt: 2, mb: 3, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {searchTerm && (
          <Chip 
            label={`検索: ${searchTerm}`} 
            onDelete={() => {
              setSearchTerm('');
              const params = new URLSearchParams(location.search);
              params.delete('search');
              navigate(`/architects?${params.toString()}`);
            }}
            color="primary"
            variant="outlined"
          />
        )}
        
        {nationality && (
          <Chip 
            icon={<PublicIcon />}
            label={`国籍: ${nationality}`} 
            onDelete={() => {
              setNationality('');
              const params = new URLSearchParams(location.search);
              params.delete('nationality');
              navigate(`/architects?${params.toString()}`);
            }}
            color="primary"
            variant="outlined"
          />
        )}
        
        {(birthYearFrom || birthYearTo) && (
          <Chip 
            icon={<CakeIcon />}
            label={`生年: ${birthYearFrom}${birthYearTo && birthYearFrom !== birthYearTo ? `-${birthYearTo}` : ''}`} 
            onDelete={() => {
              setBirthYearFrom('');
              setBirthYearTo('');
              const params = new URLSearchParams(location.search);
              params.delete('birthyear_from');
              params.delete('birthyear_to');
              navigate(`/architects?${params.toString()}`);
            }}
            color="primary"
            variant="outlined"
          />
        )}
        
        {deathYear && (
          <Chip 
            icon={<PersonIcon />}
            label={`没年: ${deathYear}`} 
            onDelete={() => {
              setDeathYear('');
              const params = new URLSearchParams(location.search);
              params.delete('deathyear');
              navigate(`/architects?${params.toString()}`);
            }}
            color="primary"
            variant="outlined"
          />
        )}
        
        {category && (
          <Chip 
            icon={<CategoryIcon />}
            label={`カテゴリー: ${category}`} 
            onDelete={() => {
              setCategory('');
              const params = new URLSearchParams(location.search);
              params.delete('category');
              navigate(`/architects?${params.toString()}`);
            }}
            color="primary"
            variant="outlined"
          />
        )}
        
        {school && (
          <Chip 
            icon={<SchoolIcon />}
            label={`学校: ${school}`} 
            onDelete={() => {
              setSchool('');
              const params = new URLSearchParams(location.search);
              params.delete('school');
              navigate(`/architects?${params.toString()}`);
            }}
            color="primary"
            variant="outlined"
          />
        )}
        
        {selectedTags.map(tag => (
          <Chip 
            key={tag}
            icon={tag.startsWith('nationality:') ? <PublicIcon /> : 
                 tag.startsWith('born:') ? <CakeIcon /> :
                 tag.startsWith('died:') ? <PersonIcon /> :
                 tag.startsWith('category:') ? <CategoryIcon /> :
                 tag.startsWith('school:') ? <SchoolIcon /> : null}
            label={tag}
            onDelete={() => {
              const newTags = selectedTags.filter(t => t !== tag);
              setSelectedTags(newTags);
              const params = new URLSearchParams(location.search);
              if (newTags.length > 0) {
                params.set('tags', newTags.join(','));
              } else {
                params.delete('tags');
              }
              navigate(`/architects?${params.toString()}`);
            }}
            color="primary"
            variant="outlined"
          />
        ))}
        
        {hasFilters && (
          <Chip 
            label="全てクリア" 
            onClick={handleClearAllFilters}
            color="secondary"
          />
        )}
      </Box>
    );
  };

  // ソート値の取得
  const getSortValue = () => {
    return `${sortBy}_${sortOrder}`;
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        建築家一覧
      </Typography>
      
      {/* 検索と絞り込みセクション - 建築作品ページと同じレイアウト */}
      <Paper sx={{ p: 3, mb: 4 }}>
        {/* 検索バーとボタン */}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 3 }}>
          <TextField
            fullWidth
            label="建築家名、住所、建築家で検索"
            value={searchTerm}
            onChange={handleSearchChange}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <Button 
            variant="contained" 
            onClick={handleSearch}
            sx={{ minWidth: '120px' }}
          >
            検索
          </Button>
        </Box>
        
        {/* タグ選択と並び替え */}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, mb: 3, alignItems: 'flex-start' }}>
          {/* タグ選択 */}
          <Autocomplete
            multiple
            id="tags-selector"
            options={availableTags}
            value={selectedTags}
            onChange={handleTagSelect}
            renderInput={(params) => (
              <TextField
                {...params}
                variant="outlined"
                label="タグで絞り込み"
                placeholder="タグを選択"
              />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => {
                // このタグが「村野藤吾賞」のような特別なタグかチェック
                const isAwardTag = option === '村野藤吾賞';
                const hasYear = selectedTags.some(tag => tag.startsWith(option) && tag !== option);
                // タグが年度選択可能かチェック（村野藤吾賞の場合など）
                const isExpandable = isAwardTag || option === 'category:村野藤吾賞';
                
                return (
                  <Chip
                    key={option}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {option}
                        {isExpandable && (
                          <ArrowDropDownIcon fontSize="small" />
                        )}
                      </Box>
                    }
                    {...getTagProps({ index })}
                    color={hasYear ? "primary" : "default"}
                    variant="outlined"
                    onClick={(event) => {
                      if (isExpandable) {
                        // クリックイベントが伝播してタグが削除されるのを防止
                        event.stopPropagation();
                        handleYearMenuOpen(event, option);
                      }
                    }}
                    onDelete={(event) => {
                      // 削除イベントはそのまま通過させる
                      getTagProps({ index }).onDelete(event);
                    }}
                  />
                );
              })
            }
            sx={{ flex: 2 }}
          />
          
          {/* 並び替え */}
          <FormControl sx={{ minWidth: 200, flex: 1 }}>
            <InputLabel id="sort-select-label">並び替え</InputLabel>
            <Select
              labelId="sort-select-label"
              id="sort-select"
              value={getSortValue()}
              label="並び替え"
              onChange={handleSortChange}
              startAdornment={
                <InputAdornment position="start">
                  <SortIcon />
                </InputAdornment>
              }
            >
              <MenuItem value="birthYear_desc">年代（新しい順）</MenuItem>
              <MenuItem value="birthYear_asc">年代（古い順）</MenuItem>
              <MenuItem value="name_asc">名前（昇順）</MenuItem>
              <MenuItem value="name_desc">名前（降順）</MenuItem>
            </Select>
          </FormControl>
        </Box>
        
        {/* クリアボタン */}
        {(searchTerm || selectedTags.length > 0) && (
          <Button 
            variant="outlined" 
            color="secondary" 
            onClick={handleClearAllFilters}
            startIcon={<ClearIcon />}
          >
            検索条件をクリア
          </Button>
        )}
      </Paper>

      {/* タグ年度選択ポップオーバー */}
      <Popover
        open={Boolean(yearAnchorEl)}
        anchorEl={yearAnchorEl}
        onClose={handleYearMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
      >
        <Box sx={{ p: 2, maxHeight: 300, width: '250px', overflowY: 'auto' }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            {currentTagForYear} の選択:
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <MenuItem onClick={() => handleYearSelect('')}>
              指定なし
            </MenuItem>
            {tagsYears[currentTagForYear]?.map((year) => (
              <MenuItem 
                key={year} 
                onClick={() => handleYearSelect(year)}
                selected={selectedTags.includes(`${currentTagForYear}${year}`)}
              >
                {year}
              </MenuItem>
            ))}
          </Box>
        </Box>
      </Popover>
      
      {/* 現在の検索条件表示 */}
      <CurrentSearchInfo />
      
      {/* 検索結果と件数表示 */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
            {!loading && architects.length > 0 ? `${architects.length}件` : '0件'}
          </Typography>
        </Box>
      </Box>

      {/* ローディング表示 */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* 建築家リスト */}
          <Grid container spacing={3}>
            {architects.map((architect) => (
              <Grid item key={architect.id} xs={12} sm={6} md={4}>
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
                  <CardActionArea 
                    component={RouterLink} 
                    to={`/architects/${architect.id}`}
                    sx={{ flexGrow: 1 }}
                  >
                    <CardContent>
                      <Typography gutterBottom variant="h6" component="h2">
                        {architect.name}
                      </Typography>
                      
                      {architect.nationality && (
                        <Box 
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            mb: 1,
                            '&:hover': { textDecoration: 'underline' }
                          }}
                          onClick={(e) => handleArchitectTagClick('nationality', architect.nationality, e)}
                        >
                          <PublicIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {architect.nationality}
                          </Typography>
                        </Box>
                      )}
                      
                      {(architect.birthYear > 0 || architect.deathYear > 0) && (
                        <Box 
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            mb: 1,
                            '&:hover': { textDecoration: 'underline' }
                          }}
                          onClick={(e) => architect.birthYear > 0 && handleArchitectTagClick('birthYear', architect.birthYear, e)}
                        >
                          <CakeIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {architect.birthYear > 0 ? `${architect.birthYear}年` : '?'} 
                            {architect.deathYear > 0 ? ` - ${architect.deathYear}年` : ''}
                          </Typography>
                        </Box>
                      )}
                      
                      {architect.office && (
                        <Box 
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'center',
                            '&:hover': { textDecoration: 'underline' }
                          }}
                          onClick={(e) => handleArchitectTagClick('office', architect.office, e)}
                        >
                          <BusinessIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {architect.office}
                          </Typography>
                        </Box>
                      )}
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* ページネーション */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination 
                count={totalPages} 
                page={currentPage} 
                onChange={handlePageChange} 
                color="primary" 
              />
            </Box>
          )}
        </>
      )}
    </Container>
  );
};

export default ArchitectsPage; 