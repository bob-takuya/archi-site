import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Typography, Box, Container, Grid, Card, CardContent, CardActionArea,
         Button, TextField, InputAdornment, Chip, Popover, IconButton, 
         Menu, List, ListItem, ListItemText, ListItemIcon, FormControl, 
         InputLabel, Select, MenuItem, CircularProgress, Paper } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import SortIcon from '@mui/icons-material/Sort';
import PublicIcon from '@mui/icons-material/Public';
import BusinessIcon from '@mui/icons-material/Business';
import CakeIcon from '@mui/icons-material/Cake';
import PersonIcon from '@mui/icons-material/Person';
import CategoryIcon from '@mui/icons-material/Category';
import SchoolIcon from '@mui/icons-material/School';
import SortByAlphaIcon from '@mui/icons-material/SortByAlpha';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ClearIcon from '@mui/icons-material/Clear';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { getAllArchitects, getArchitectTags, getArchitectFilterValues } from '../services/DbService';
import { Architect, ArchitectsResponse, TagCategory } from '../types/architect';

interface SortOption {
  value: string;
  label: string;
  icon: React.ReactNode;
}

const ArchitectsPage: React.FC = () => {
  console.log("ArchitectsPage コンポーネントがレンダリングされました");
  
  // 状態変数
  const [architects, setArchitects] = useState<Architect[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<string>('asc');
  
  // タグ選択用の状態
  const [tagAnchorEl, setTagAnchorEl] = useState<HTMLElement | null>(null);
  const [yearAnchorEl, setYearAnchorEl] = useState<HTMLElement | null>(null);
  const [currentTagForYear, setCurrentTagForYear] = useState<string>('');
  const [tagsYears, setTagsYears] = useState<Record<string, string[]>>({});
  
  // 新しいフィルターパラメータ
  const [nationality, setNationality] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [school, setSchool] = useState<string>('');
  const [birthYearFrom, setBirthYearFrom] = useState<string>('');
  const [birthYearTo, setBirthYearTo] = useState<string>('');
  const [deathYear, setDeathYear] = useState<string>('');
  
  // タグメニューを開く
  const [tagMenuAnchorEl, setTagMenuAnchorEl] = useState<HTMLElement | null>(null);
  const [selectedTagCategory, setSelectedTagCategory] = useState<TagCategory | ''>('');
  const [tagFilterValues, setTagFilterValues] = useState<string[]>([]);
  const [isLoadingTagValues, setIsLoadingTagValues] = useState<boolean>(false);
  
  // 並び替えメニュー用の状態
  const [sortAnchorEl, setSortAnchorEl] = useState<HTMLElement | null>(null);
  
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  
  // デバッグ: タグメニュー状態の監視
  useEffect(() => {
    console.log("tagMenuAnchorEl 状態変更:", Boolean(tagMenuAnchorEl));
  }, [tagMenuAnchorEl]);
  
  // デバッグ: 選択されたタグカテゴリの監視
  useEffect(() => {
    console.log("selectedTagCategory 状態変更:", selectedTagCategory);
  }, [selectedTagCategory]);
  
  // デバッグ: タグフィルタ値の監視
  useEffect(() => {
    console.log("tagFilterValues 状態変更:", tagFilterValues);
  }, [tagFilterValues]);
  
  // 並び替えオプション
  const sortOptions: SortOption[] = [
    { value: 'name', label: '名前順', icon: <SortByAlphaIcon /> },
    { value: 'birthYear', label: '生年順', icon: <CalendarMonthIcon /> },
    { value: 'nationality', label: '国籍順', icon: <PublicIcon /> }
  ];

  // タグの読み込み
  useEffect(() => {
    console.log("タグ読み込みのuseEffectが実行されました");
    const loadTags = async () => {
      try {
        console.log("建築家タグ取得開始");
        const tags = await getArchitectTags();
        console.log("取得した建築家タグ:", tags);
        setAvailableTags(tags);
      } catch (error) {
        console.error('タグ取得エラー:', error);
      }
    };
    
    loadTags();
  }, []);

  // 建築家データ読み込み
  useEffect(() => {
    console.log("建築家データ読み込みのuseEffectが実行されました", location.search);
    const loadArchitects = async () => {
      setLoading(true);
      try {
        // クエリパラメータの取得
        const page = parseInt(queryParams.get('page') || '1');
        const search = queryParams.get('search') || '';
        const tags = queryParams.get('tags') ? queryParams.get('tags').split(',') : [];
        const sort = queryParams.get('sortBy') || 'name';
        const order = queryParams.get('sortOrder') || 'asc';
        
        // 新しいフィルターの取得
        const nat = queryParams.get('nationality') || '';
        const cat = queryParams.get('category') || '';
        const sch = queryParams.get('school') || '';
        const birthFrom = queryParams.get('birthYearFrom') || '';
        const birthTo = queryParams.get('birthYearTo') || '';
        const death = queryParams.get('deathYear') || '';
        
        console.log("URLから読み取ったパラメータ:", { page, search, tags, sort, order, nat, cat, sch, birthFrom, birthTo, death });
        
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
        
        // 建築家データを取得
        console.log("建築家データ取得開始:", { page, search, tags, sort, order, nat, cat, sch, birthFrom, birthTo, death });
        const result = await getAllArchitects(
          page,
          10, // itemsPerPage
          search,
          tags,
          sort,
          order,
          nat,
          cat,
          sch,
          birthFrom ? parseInt(birthFrom) : 0,
          birthTo ? parseInt(birthTo) : 0,
          death ? parseInt(death) : 0
        );
        
        console.log("取得した建築家データ:", result);
        setArchitects(result.items);
        setTotalPages(result.totalPages);
        setTotalItems(result.totalItems);
      } catch (error) {
        console.error('建築家データ取得エラー:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadArchitects();
  }, [location.search]);

  // タグカテゴリの値を取得
  const handleTagCategorySelect = async (category: TagCategory) => {
    console.log(`タグカテゴリ選択: ${category}`);
    setSelectedTagCategory(category);
    setIsLoadingTagValues(true);
    try {
      console.log(`${category}のフィルター値取得開始`);
      const values = await getArchitectFilterValues(category);
      console.log(`取得した${category}フィルター値:`, values);
      setTagFilterValues(values);
    } catch (error) {
      console.error(`${category}フィルター値取得エラー:`, error);
      setTagFilterValues([]);
    } finally {
      setIsLoadingTagValues(false);
    }
  };

  // タグ値を選択
  const handleTagValueSelect = (value: string) => {
    console.log(`タグ値選択: ${value} (カテゴリ: ${selectedTagCategory})`);
    if (!selectedTagCategory) return;
    
    switch (selectedTagCategory) {
      case 'nationality':
        setNationality(value);
        break;
      case 'birth':
        if (value) {
          const decade = parseInt(value);
          setBirthYearFrom(decade.toString());
          setBirthYearTo((decade + 9).toString());
        } else {
          setBirthYearFrom('');
          setBirthYearTo('');
        }
        break;
      case 'death':
        setDeathYear(value);
        break;
      case 'category':
        setCategory(value);
        break;
      case 'school':
        setSchool(value);
        break;
    }
    
    // タグメニューを閉じる
    setTagMenuAnchorEl(null);
    setSelectedTagCategory('');
    
    // URLを更新して検索を実行
    updateUrlAndSearch();
  };

  // URLを更新して検索を実行する
  const updateUrlAndSearch = () => {
    console.log("URLと検索を更新");
    const newQueryParams = new URLSearchParams();
    
    if (searchTerm) newQueryParams.set('search', searchTerm);
    if (selectedTags.length > 0) newQueryParams.set('tags', selectedTags.join(','));
    if (sortBy !== 'name') newQueryParams.set('sortBy', sortBy);
    if (sortOrder !== 'asc') newQueryParams.set('sortOrder', sortOrder);
    if (nationality) newQueryParams.set('nationality', nationality);
    if (category) newQueryParams.set('category', category);
    if (school) newQueryParams.set('school', school);
    if (birthYearFrom) newQueryParams.set('birthYearFrom', birthYearFrom);
    if (birthYearTo) newQueryParams.set('birthYearTo', birthYearTo);
    if (deathYear) newQueryParams.set('deathYear', deathYear);
    
    console.log("新しいURLパラメータ:", newQueryParams.toString());
    navigate({ search: newQueryParams.toString() });
  };

  // タグフィルターメニューを開く
  const handleTagMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    console.log("タグメニューを開く", event.currentTarget);
    setTagMenuAnchorEl(event.currentTarget);
  };

  // タグフィルターメニューを閉じる
  const handleTagMenuClose = () => {
    console.log("タグメニューを閉じる");
    setTagMenuAnchorEl(null);
    setSelectedTagCategory('');
  };

  // 現在のフィルター情報を表示するコンポーネント
  const CurrentSearchInfo = () => {
    const activeFilters = [];
    
    if (nationality) activeFilters.push({ label: `国籍: ${nationality}`, onDelete: () => { setNationality(''); updateUrlAndSearch(); } });
    if (birthYearFrom && birthYearTo) activeFilters.push({ label: `誕生年: ${birthYearFrom}〜${birthYearTo}`, onDelete: () => { setBirthYearFrom(''); setBirthYearTo(''); updateUrlAndSearch(); } });
    if (deathYear) activeFilters.push({ label: `没年: ${deathYear}`, onDelete: () => { setDeathYear(''); updateUrlAndSearch(); } });
    if (category) activeFilters.push({ label: `カテゴリー: ${category}`, onDelete: () => { setCategory(''); updateUrlAndSearch(); } });
    if (school) activeFilters.push({ label: `学校: ${school}`, onDelete: () => { setSchool(''); updateUrlAndSearch(); } });
    
    if (activeFilters.length === 0) return null;
    
    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2, mb: 2 }}>
        {activeFilters.map((filter, index) => (
          <Chip
            key={index}
            label={filter.label}
            onDelete={filter.onDelete}
            color="primary"
            variant="outlined"
            size="small"
          />
        ))}
        <Chip
          label="全てクリア"
          onClick={() => {
            setNationality('');
            setBirthYearFrom('');
            setBirthYearTo('');
            setDeathYear('');
            setCategory('');
            setSchool('');
            updateUrlAndSearch();
          }}
          color="secondary"
          size="small"
        />
      </Box>
    );
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        建築家一覧
      </Typography>
      
      {/* 検索バー */}
      <Paper 
        elevation={2} 
        component="form"
        sx={{ p: 2, mb: 3, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'center', gap: 2 }}
        onSubmit={(e) => {
          e.preventDefault();
          updateUrlAndSearch();
        }}
      >
        <TextField
          placeholder="建築家を検索..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          variant="outlined"
          fullWidth
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: searchTerm ? (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => {
                    setSearchTerm('');
                    updateUrlAndSearch();
                  }}
                  edge="end"
                  size="small"
                >
                  <ClearIcon />
                </IconButton>
              </InputAdornment>
            ) : null
          }}
        />
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<SortIcon />}
            onClick={(e) => setSortAnchorEl(e.currentTarget)}
            size="small"
          >
            並び替え
          </Button>
          
          <Button
            variant="outlined"
            onClick={handleTagMenuOpen}
            startIcon={<CategoryIcon />}
            size="small"
          >
            フィルター
          </Button>
        </Box>
      </Paper>
      
      {/* 並び替えメニュー */}
      <Menu
        anchorEl={sortAnchorEl}
        open={Boolean(sortAnchorEl)}
        onClose={() => setSortAnchorEl(null)}
      >
        {sortOptions.map((option) => (
          <MenuItem
            key={option.value}
            onClick={() => {
              let newOrder = 'asc';
              if (sortBy === option.value) {
                newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
              }
              setSortBy(option.value);
              setSortOrder(newOrder);
              setSortAnchorEl(null);
              updateUrlAndSearch();
            }}
            selected={sortBy === option.value}
          >
            <ListItemIcon>
              {option.icon}
            </ListItemIcon>
            <ListItemText>
              {option.label}
              {sortBy === option.value && (
                <span> ({sortOrder === 'asc' ? '昇順' : '降順'})</span>
              )}
            </ListItemText>
          </MenuItem>
        ))}
      </Menu>
      
      {/* タグフィルターメニュー */}
      <Popover
        anchorEl={tagMenuAnchorEl}
        open={Boolean(tagMenuAnchorEl)}
        onClose={handleTagMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        <Box sx={{ p: 2, width: 250 }}>
          {!selectedTagCategory ? (
            // タグカテゴリ選択
            <>
              <Typography variant="subtitle1" gutterBottom>
                フィルターを選択
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button
                  startIcon={<PublicIcon />}
                  onClick={() => handleTagCategorySelect('nationality')}
                  variant="outlined"
                  size="small"
                  fullWidth
                  sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
                >
                  国籍
                </Button>
                <Button
                  startIcon={<CakeIcon />}
                  onClick={() => handleTagCategorySelect('birth')}
                  variant="outlined"
                  size="small"
                  fullWidth
                  sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
                >
                  誕生年代
                </Button>
                <Button
                  startIcon={<PersonIcon />}
                  onClick={() => handleTagCategorySelect('death')}
                  variant="outlined"
                  size="small"
                  fullWidth
                  sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
                >
                  没年
                </Button>
                <Button
                  startIcon={<CategoryIcon />}
                  onClick={() => handleTagCategorySelect('category')}
                  variant="outlined"
                  size="small"
                  fullWidth
                  sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
                >
                  カテゴリー
                </Button>
                <Button
                  startIcon={<SchoolIcon />}
                  onClick={() => handleTagCategorySelect('school')}
                  variant="outlined"
                  size="small"
                  fullWidth
                  sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
                >
                  学校
                </Button>
              </Box>
            </>
          ) : (
            // タグ値選択
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <IconButton onClick={() => setSelectedTagCategory('')} size="small" sx={{ mr: 1 }}>
                  <ArrowDropDownIcon sx={{ transform: 'rotate(90deg)' }} />
                </IconButton>
                <Typography variant="subtitle1">
                  {selectedTagCategory === 'nationality' ? '国籍を選択' :
                   selectedTagCategory === 'birth' ? '誕生年代を選択' :
                   selectedTagCategory === 'death' ? '没年を選択' :
                   selectedTagCategory === 'category' ? 'カテゴリーを選択' :
                   '学校を選択'}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                <Chip
                  label="指定なし"
                  onClick={() => handleTagValueSelect('')}
                  variant="outlined"
                  size="small"
                  sx={{ mb: 1 }}
                />
                
                {isLoadingTagValues ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : (
                  <List dense sx={{ maxHeight: '300px', overflow: 'auto' }}>
                    {selectedTagCategory === 'birth' ? (
                      // 誕生年代の場合は10年単位で表示
                      Array.from({ length: 24 }, (_, i) => 1800 + i * 10).map((decade) => (
                        <MenuItem 
                          key={decade} 
                          onClick={() => handleTagValueSelect(decade.toString())}
                          selected={decade.toString() === birthYearFrom}
                        >
                          {`${decade}年代`}
                        </MenuItem>
                      ))
                    ) : tagFilterValues.length > 0 ? (
                      tagFilterValues.map((value) => (
                        <MenuItem 
                          key={value} 
                          onClick={() => handleTagValueSelect(value)}
                          selected={
                            (selectedTagCategory === 'nationality' && value === nationality) ||
                            (selectedTagCategory === 'death' && value === deathYear) ||
                            (selectedTagCategory === 'category' && value === category) ||
                            (selectedTagCategory === 'school' && value === school)
                          }
                        >
                          {value}
                        </MenuItem>
                      ))
                    ) : (
                      <ListItem>
                        <ListItemText primary="データがありません" />
                      </ListItem>
                    )}
                  </List>
                )}
              </Box>
            </>
          )}
        </Box>
      </Popover>
      
      {/* 現在のフィルター情報 */}
      <CurrentSearchInfo />
      
      {/* 建築家一覧 */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {totalItems}人の建築家が見つかりました（{currentPage}/{totalPages}ページ）
            </Typography>
          </Box>
          
          <Grid container spacing={3}>
            {architects.map((architect) => (
              <Grid item xs={12} sm={6} md={4} key={architect.id}>
                <Card elevation={2}>
                  <CardActionArea component={RouterLink} to={`/architects/${architect.id}`}>
                    <CardContent>
                      <Typography variant="h6" component="div" gutterBottom>
                        {architect.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {architect.nationality} • {architect.birthYear || '?'}-{architect.deathYear || '現在'}
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                        {architect.tags && architect.tags.map((tag) => (
                          <Chip
                            key={tag}
                            label={tag}
                            size="small"
                            variant="outlined"
                            sx={{ pointerEvents: 'none' }}
                          />
                        ))}
                      </Box>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
          
          {/* ページネーション */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  disabled={currentPage <= 1}
                  onClick={() => {
                    const newPage = currentPage - 1;
                    const newParams = new URLSearchParams(location.search);
                    newParams.set('page', newPage.toString());
                    navigate({ search: newParams.toString() });
                  }}
                >
                  前のページ
                </Button>
                
                <Button
                  variant="outlined"
                  disabled={currentPage >= totalPages}
                  onClick={() => {
                    const newPage = currentPage + 1;
                    const newParams = new URLSearchParams(location.search);
                    newParams.set('page', newPage.toString());
                    navigate({ search: newParams.toString() });
                  }}
                >
                  次のページ
                </Button>
              </Box>
            </Box>
          )}
        </>
      )}
    </Container>
  );
};

export default ArchitectsPage; 