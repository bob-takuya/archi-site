import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  CardActionArea,
  TextField,
  InputAdornment,
  Chip,
  Button,
  CircularProgress,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Autocomplete,
  Popover,
  Alert
} from '@mui/material';

import { Link as RouterLink } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import SortIcon from '@mui/icons-material/Sort';
import PublicIcon from '@mui/icons-material/Public';
import CakeIcon from '@mui/icons-material/Cake';
import PersonIcon from '@mui/icons-material/Person';
import CategoryIcon from '@mui/icons-material/Category';
import SchoolIcon from '@mui/icons-material/School';
import SortByAlphaIcon from '@mui/icons-material/SortByAlpha';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { ArchitectService, initDatabase, getResultsArray } from '../services/db';
import { Architect, ArchitectsResponse, TagCategory } from '../types/architect';

// 並び替えオプションのインターフェース
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
  const [selectedTagsWithYears, setSelectedTagsWithYears] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<string>('asc');
  
  // タグ選択用の状態
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
  
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  
  // デバッグ: タグメニュー状態の監視
  useEffect(() => {
    console.log("tagMenuAnchorEl 状態変更:", Boolean(yearAnchorEl));
  }, [yearAnchorEl]);
  
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
        const tags = await ArchitectService.getArchitectTags();
        console.log("取得した建築家タグ:", tags);
        
        // タグを日本語のベースタグに変換
        const baseTags = ['国籍', 'カテゴリー', '学校', '生年', '没年'];
        setAvailableTags(baseTags);
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
        const result = await ArchitectService.getAllArchitects(
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
        setTotalItems(result.total);
      } catch (error) {
        console.error('建築家データ取得エラー:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadArchitects();
  }, [location.search]);

  // タグの年度取得関数
  const getYearsForArchitectTag = async (tag: string) => {
    console.log(`${tag}の年度取得開始`);
    let query = '';
    if (tag === '国籍') {
      query = `SELECT DISTINCT ZAT_NATIONALITY as value FROM ZCDARCHITECT WHERE ZAT_NATIONALITY != '' ORDER BY ZAT_NATIONALITY`;
    } else if (tag === 'カテゴリー') {
      query = `SELECT DISTINCT ZAT_CATEGORY as value FROM ZCDARCHITECT WHERE ZAT_CATEGORY != '' ORDER BY ZAT_CATEGORY`;
    } else if (tag === '学校') {
      query = `SELECT DISTINCT ZAT_SCHOOL as value FROM ZCDARCHITECT WHERE ZAT_SCHOOL != '' ORDER BY ZAT_SCHOOL`;
    } else if (tag === '生年') {
      query = `SELECT DISTINCT ZAT_BIRTHYEAR as value FROM ZCDARCHITECT WHERE ZAT_BIRTHYEAR > 0 ORDER BY ZAT_BIRTHYEAR DESC`;
    } else if (tag === '没年') {
      query = `SELECT DISTINCT ZAT_DEATHYEAR as value FROM ZCDARCHITECT WHERE ZAT_DEATHYEAR > 0 ORDER BY ZAT_DEATHYEAR DESC`;
    }
    
    if (!query) return [];
    
    try {
      // getResultsArrayを使用してクエリを実行
      const results = await getResultsArray<{ value: string | number }>(query);
      
      // 結果を文字列配列に変換
      return results.map(item => String(item.value)).filter(Boolean);
    } catch (error) {
      console.error(`${tag}の値取得エラー:`, error);
      return [];
    }
  };

  // 年度メニューを開く
  const handleYearMenuOpen = async (event: React.MouseEvent<HTMLElement>, tag: string) => {
    console.log(`${tag}の年度メニューを開く`, event.currentTarget);
    setYearAnchorEl(event.currentTarget);
    setCurrentTagForYear(tag);
    
    // 年度情報を取得（既に取得済みでない場合）
    if (!tagsYears[tag]) {
      try {
        const years = await getYearsForArchitectTag(tag);
        console.log(`取得した${tag}の年度:`, years);
        setTagsYears(prev => ({
          ...prev,
          [tag]: years
        }));
      } catch (error) {
        console.error(`${tag}の年度取得エラー:`, error);
      }
    }
  };

  // 年度メニューを閉じる
  const handleYearMenuClose = () => {
    console.log("年度メニューを閉じる");
    setYearAnchorEl(null);
    setCurrentTagForYear('');
  };

  // 年度を選択
  const handleYearSelect = (year: string) => {
    console.log(`年度選択: ${year} (タグ: ${currentTagForYear})`);
    
    if (currentTagForYear === '国籍') {
      setNationality(year);
    } else if (currentTagForYear === 'カテゴリー') {
      setCategory(year);
    } else if (currentTagForYear === '学校') {
      setSchool(year);
    } else if (currentTagForYear === '生年') {
      setBirthYearFrom(year);
    } else if (currentTagForYear === '没年') {
      setDeathYear(year);
    }
    
    handleYearMenuClose();
    updateUrlAndSearch();
  };

  // タグ選択時の処理
  const handleTagSelect = (event: React.SyntheticEvent, newTags: string[]) => {
    console.log(`タグ選択変更:`, newTags);
    setSelectedTags(newTags);
    
    // 選択解除されたタグに関連するフィルターをリセット
    const removedTags = selectedTags.filter(tag => !newTags.includes(tag));
    
    for (const tag of removedTags) {
      if (tag === '国籍') {
        setNationality('');
      } else if (tag === 'カテゴリー') {
        setCategory('');
      } else if (tag === '学校') {
        setSchool('');
      } else if (tag === '生年') {
        setBirthYearFrom('');
        setBirthYearTo('');
      } else if (tag === '没年') {
        setDeathYear('');
      }
    }
    
    // 新しく選択されたタグについて、年度情報を取得
    const addedTags = newTags.filter(tag => !selectedTags.includes(tag));
    
    if (addedTags.length > 0) {
      addedTags.forEach(async (tag) => {
        if (!tagsYears[tag]) {
          try {
            const years = await getYearsForArchitectTag(tag);
            setTagsYears(prev => ({
              ...prev,
              [tag]: years
            }));
          } catch (error) {
            console.error(`${tag}の年度取得エラー:`, error);
          }
        }
      });
    }
    
    updateUrlAndSearch();
  };

  // 並び替え変更
  const handleSortChange = (sortValue: string) => {
    console.log(`並び替え変更: ${sortValue}`);
    
    // 同じ並び替え方法をクリックした場合は昇順/降順を切り替え
    if (sortBy === sortValue) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(sortValue);
      setSortOrder('asc');
    }
    
    updateUrlAndSearch();
  };

  // ページ変更
  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    console.log(`ページ変更: ${value}`);
    setCurrentPage(value);
    
    const newParams = new URLSearchParams(location.search);
    newParams.set('page', value.toString());
    navigate({ search: newParams.toString() });
  };

  // 検索実行
  const handleSearch = () => {
    console.log(`検索実行: ${searchTerm}`);
    updateUrlAndSearch();
  };

  // 検索クリア
  const handleClearSearch = () => {
    console.log("検索条件をクリア");
    setSearchTerm('');
    setSelectedTags([]);
    setSelectedTagsWithYears([]);
    setNationality('');
    setCategory('');
    setSchool('');
    setBirthYearFrom('');
    setBirthYearTo('');
    setDeathYear('');
    setCurrentPage(1);
    
    // URLから検索パラメータを削除（並び替えは保持）
    const queryParams = new URLSearchParams();
    if (sortBy !== 'name') {
      queryParams.set('sortBy', sortBy);
    }
    if (sortOrder !== 'asc') {
      queryParams.set('sortOrder', sortOrder);
    }
    navigate({ search: queryParams.toString() });
  };

  // URLを更新して検索を実行する
  const updateUrlAndSearch = () => {
    console.log("URLと検索を更新");
    const newQueryParams = new URLSearchParams();
    
    if (currentPage > 1) newQueryParams.set('page', currentPage.toString());
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

  // 現在のフィルター情報を表示
  const CurrentFilters = () => {
    const activeFilters = [];
    
    if (nationality) activeFilters.push({ label: `国籍: ${nationality}`, onDelete: () => { setNationality(''); updateUrlAndSearch(); } });
    if (birthYearFrom) activeFilters.push({ label: `生年: ${birthYearFrom}`, onDelete: () => { setBirthYearFrom(''); updateUrlAndSearch(); } });
    if (deathYear) activeFilters.push({ label: `没年: ${deathYear}`, onDelete: () => { setDeathYear(''); updateUrlAndSearch(); } });
    if (category) activeFilters.push({ label: `カテゴリー: ${category}`, onDelete: () => { setCategory(''); updateUrlAndSearch(); } });
    if (school) activeFilters.push({ label: `学校: ${school}`, onDelete: () => { setSchool(''); updateUrlAndSearch(); } });
    
    if (activeFilters.length === 0 && !searchTerm && selectedTags.length === 0) return null;
    
    return (
      <Box sx={{ mb: 3 }}>
        <Alert 
          severity="info" 
          action={
            <Button color="inherit" size="small" onClick={handleClearSearch}>
              クリア
            </Button>
          }
        >
          {activeFilters.length > 0 
            ? `フィルター: ${activeFilters.map(f => f.label).join(', ')}` 
            : searchTerm 
              ? `「${searchTerm}」で検索中` 
              : selectedTags.length > 0 
                ? `タグ「${selectedTags.join(', ')}」で絞り込み中`
                : ''}
        </Alert>
      </Box>
    );
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        建築家一覧
      </Typography>

      <Paper sx={{ p: 3, mb: 4 }}>
        {/* 検索バーとボタン */}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 3 }}>
          <TextField
            fullWidth
            label="建築家名、国籍、カテゴリーで検索"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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
            fullWidth
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
                // このタグに利用可能な年度情報があるか確認
                const isExpandable = Boolean(tagsYears[option] && tagsYears[option].length > 0);
                
                // このタグに対して選択されている値
                let selectedValue = '';
                if (option === '国籍') selectedValue = nationality;
                else if (option === 'カテゴリー') selectedValue = category;
                else if (option === '学校') selectedValue = school;
                else if (option === '生年') selectedValue = birthYearFrom;
                else if (option === '没年') selectedValue = deathYear;
                
                return (
                  <Chip
                    key={option}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {option}
                        {selectedValue && (
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              ml: 0.5, 
                              fontWeight: 'bold',
                              backgroundColor: 'rgba(0, 0, 0, 0.08)',
                              borderRadius: '4px',
                              px: 0.5,
                              py: 0.2
                            }}
                          >
                            {selectedValue}
                          </Typography>
                        )}
                        {isExpandable && (
                          <ArrowDropDownIcon fontSize="small" />
                        )}
                      </Box>
                    }
                    {...getTagProps({ index })}
                    color={selectedValue ? "primary" : "default"}
                    variant="outlined"
                    onClick={(event) => {
                      // クリックイベントが伝播してタグが削除されるのを防止
                      event.stopPropagation();
                      handleYearMenuOpen(event, option);
                    }}
                    onDelete={(event) => {
                      // 削除イベントはそのまま通過させる
                      getTagProps({ index }).onDelete(event);
                    }}
                    sx={{
                      maxWidth: '100%',
                      '& .MuiChip-label': {
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                      }
                    }}
                  />
                );
              })
            }
          />
          
          {/* 並び替え */}
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel id="sort-select-label">並び替え</InputLabel>
            <Select
              labelId="sort-select-label"
              value={`${sortBy}_${sortOrder}`}
              label="並び替え"
              onChange={(e) => {
                const [newSortBy, newSortOrder] = e.target.value.split('_');
                setSortBy(newSortBy);
                setSortOrder(newSortOrder);
                updateUrlAndSearch();
              }}
            >
              <MenuItem value="name_asc">名前 (昇順)</MenuItem>
              <MenuItem value="name_desc">名前 (降順)</MenuItem>
              <MenuItem value="birthYear_asc">生年 (昇順)</MenuItem>
              <MenuItem value="birthYear_desc">生年 (降順)</MenuItem>
              <MenuItem value="nationality_asc">国籍 (昇順)</MenuItem>
              <MenuItem value="nationality_desc">国籍 (降順)</MenuItem>
            </Select>
          </FormControl>
        </Box>
        
        {/* 年度選択ポップオーバー */}
        <Popover
          open={Boolean(yearAnchorEl)}
          anchorEl={yearAnchorEl}
          onClose={handleYearMenuClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
        >
          <Box sx={{ p: 2, width: 300, maxHeight: 400, overflow: 'auto' }}>
            <Typography variant="subtitle1" gutterBottom>
              {currentTagForYear === '国籍' ? '国籍を選択' :
               currentTagForYear === 'カテゴリー' ? 'カテゴリーを選択' :
               currentTagForYear === '学校' ? '学校を選択' :
               currentTagForYear === '生年' ? '生年を選択' :
               currentTagForYear === '没年' ? '没年を選択' : 'タグ値を選択'}
            </Typography>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
              <Chip
                label="指定なし"
                onClick={() => handleYearSelect('')}
                variant="outlined"
                size="small"
                sx={{ mb: 1 }}
              />
              
              {tagsYears[currentTagForYear]?.map(year => (
                <Chip
                  key={year}
                  label={year}
                  onClick={() => handleYearSelect(year)}
                  variant="outlined"
                  size="small"
                  color={
                    (currentTagForYear === '国籍' && year === nationality) ||
                    (currentTagForYear === 'カテゴリー' && year === category) ||
                    (currentTagForYear === '学校' && year === school) ||
                    (currentTagForYear === '生年' && year === birthYearFrom) ||
                    (currentTagForYear === '没年' && year === deathYear)
                      ? "primary"
                      : "default"
                  }
                  sx={{ 
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '100%'
                  }}
                />
              ))}
            </Box>
          </Box>
        </Popover>
        
        {/* 選択中のフィルター表示 */}
        <CurrentFilters />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {totalItems}人の建築家
          </Typography>
          {totalPages > 1 && (
            <Pagination 
              count={totalPages} 
              page={currentPage} 
              onChange={handlePageChange} 
              color="primary"
              size="small"
            />
          )}
        </Box>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {architects.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6">
                建築家が見つかりませんでした
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                検索条件を変更してお試しください
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {architects.map((architect) => (
                <Grid item xs={12} sm={6} md={4} key={architect.id}>
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
          )}
          
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