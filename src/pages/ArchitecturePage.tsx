import React, { useState, useEffect } from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Box, 
  Grid, 
  Paper, 
  Card,
  CardContent,
  CardActionArea,
  TextField,
  Button,
  Pagination,
  CircularProgress,
  Chip,
  InputAdornment,
  Alert,
  Autocomplete,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Popover
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import SortIcon from '@mui/icons-material/Sort';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { getAllArchitectures, searchArchitectures } from '../services/api/FastArchitectureService';
// TODO: Import getAllTags and getYearsForTag when available

const ArchitecturePage = () => {
  const [architectures, setArchitectures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [tagQuery, setTagQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedTagsWithYears, setSelectedTagsWithYears] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [sortBy, setSortBy] = useState('year_desc');
  const [tagYearsMap, setTagYearsMap] = useState({});
  const [yearAnchorEl, setYearAnchorEl] = useState(null);
  const [currentTagForYear, setCurrentTagForYear] = useState('');
  const [tagsYears, setTagsYears] = useState({});
  const itemsPerPage = 12;
  const location = useLocation();
  const navigate = useNavigate();

  // タグリストの初期ロード
  useEffect(() => {
    const fetchTags = async () => {
      try {
        // const allTags = await getAllTags(); // TODO: Implement
        const allTags = [];
        setAvailableTags(allTags);
      } catch (error) {
        console.error('タグ取得エラー:', error);
      }
    };
    fetchTags();
  }, []);

  useEffect(() => {
    // URLからクエリパラメータを解析
    const queryParams = new URLSearchParams(location.search);
    const tag = queryParams.get('tag');
    const search = queryParams.get('search');
    const year = queryParams.get('year');
    const prefecture = queryParams.get('prefecture');
    const category = queryParams.get('category');
    const architect = queryParams.get('architect');
    const sort = queryParams.get('sort');
    
    // 並び替えの設定
    if (sort) {
      setSortBy(sort);
    }
    
    // タグが複数ある場合（カンマ区切り）
    if (tag) {
      const tags = tag.split(',').map(t => t.trim()).filter(t => t);
      const baseTags = new Set();
      const tagWithYears = [];
      
      // タグを解析して年度を含むタグと基本タグに分ける
      tags.forEach(t => {
        const yearMatch = t.match(/\d{4}年\d{1,2}月号?/);
        if (yearMatch) {
          const baseTag = t.replace(yearMatch[0], '').trim();
          if (baseTag) {
            baseTags.add(baseTag);
            tagWithYears.push(t);
          }
        } else {
          baseTags.add(t);
        }
      });
      
      setSelectedTags(Array.from(baseTags));
      setSelectedTagsWithYears(tagWithYears);
      setTagQuery(tag);
      setSearchTerm(`tag:${tag}`);
      fetchArchitectures(1, `tag:${tag}`, sort || sortBy);
    } else if (year) {
      setSearchTerm(`year:${year}`);
      fetchArchitectures(1, `year:${year}`, sort || sortBy);
    } else if (prefecture) {
      setSearchTerm(`prefecture:${prefecture}`);
      fetchArchitectures(1, `prefecture:${prefecture}`, sort || sortBy);
    } else if (category) {
      setSearchTerm(`category:${category}`);
      fetchArchitectures(1, `category:${category}`, sort || sortBy);
    } else if (architect) {
      setSearchTerm(`architect:${architect}`);
      fetchArchitectures(1, `architect:${architect}`, sort || sortBy);
    } else if (search) {
      setSearchTerm(search);
      fetchArchitectures(1, search, sort || sortBy);
    } else {
      fetchArchitectures(1, searchTerm, sort || sortBy);
    }
  }, [location.search]);

  const fetchArchitectures = async (page, search = searchTerm, sort = sortBy) => {
    setLoading(true);
    try {
      const result = await getAllArchitectures(page, itemsPerPage, search, sort);
      setArchitectures(result.results);
      setTotalItems(result.total);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error fetching architectures:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
    fetchArchitectures(value, searchTerm, sortBy);
    window.scrollTo(0, 0);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  // タグの年度選択ポップオーバーを開く
  const handleYearMenuOpen = async (event, tag) => {
    setYearAnchorEl(event.currentTarget);
    setCurrentTagForYear(tag);
    
    // 年度情報を取得（既に取得済みでも再度取得して最新の状態を保持）
    try {
      // const years = await getYearsForTag(tag); // TODO: Implement
      const years = [];
      setTagsYears(prev => ({
        ...prev,
        [tag]: years
      }));
    } catch (error) {
      console.error(`Failed to get years for tag ${tag}:`, error);
    }
  };

  // 年度選択ポップオーバーを閉じる
  const handleYearMenuClose = () => {
    setYearAnchorEl(null);
    setCurrentTagForYear('');
  };

  // 特定のタグの年度を選択
  const handleYearSelect = (year) => {
    const tagWithYear = year ? `${currentTagForYear}${year}` : currentTagForYear;
    
    let newTagsWithYears = [...selectedTagsWithYears];
    const existingIndex = newTagsWithYears.findIndex(t => 
      t.startsWith(currentTagForYear) && (t === currentTagForYear || 
        t.match(new RegExp(`^${currentTagForYear}\\d{4}年\\d{1,2}月号?`)) ||
        t.match(new RegExp(`^${currentTagForYear}\\d{4}年度?`)) ||
        t.match(new RegExp(`^${currentTagForYear}第\\d+回`)) ||
        t.match(new RegExp(`^${currentTagForYear}\\(\\d{4}\\)`))
      )
    );
    
    if (existingIndex >= 0) {
      if (year) {
        // 既存のタグを新しい年度つきのタグに置き換え
        newTagsWithYears[existingIndex] = tagWithYear;
      } else {
        // 年度なしのタグなら削除（基本タグのみを表示）
        newTagsWithYears.splice(existingIndex, 1);
      }
    } else if (year) {
      // 新しい年度つきのタグを追加
      newTagsWithYears.push(tagWithYear);
    }
    
    setSelectedTagsWithYears(newTagsWithYears);
    handleYearMenuClose();
    
    // 選択したタグで即時検索
    const allTags = [...selectedTags];
    if (!allTags.includes(currentTagForYear)) {
      allTags.push(currentTagForYear);
    }
    
    const tagQueryString = [...allTags, ...newTagsWithYears]
      .filter((tag, index, self) => 
        // 重複排除と、年度付きタグと同じベースタグを持つ基本タグを除外
        self.indexOf(tag) === index && 
        !newTagsWithYears.some(t => t !== tag && t.startsWith(tag))
      )
      .join(',');
    
    setTagQuery(tagQueryString);
    const searchTermValue = `tag:${tagQueryString}`;
    setSearchTerm(searchTermValue);
    
    // 検索実行と URL 更新
    fetchArchitectures(1, searchTermValue, sortBy);
    const queryParams = new URLSearchParams();
    queryParams.set('tag', tagQueryString);
    if (sortBy !== 'year_desc') {
      queryParams.set('sort', sortBy);
    }
    navigate({ search: queryParams.toString() });
  };

  // タグ選択時の処理
  const handleTagSelect = (event, newTags) => {
    // 選択解除されたタグを特定
    const removedTags = selectedTags.filter(tag => !newTags.includes(tag));
    
    // 選択解除されたタグに関連する年度付きタグも削除
    let newTagsWithYears = [...selectedTagsWithYears].filter(tag => 
      !removedTags.some(removedTag => tag.startsWith(removedTag))
    );
    
    // 新しく選択されたタグを特定
    const addedTags = newTags.filter(tag => !selectedTags.includes(tag));
    
    // 新しく選択されたタグについて、年度情報を取得
    if (addedTags.length > 0) {
      addedTags.forEach(async (tag) => {
        if (!tagsYears[tag]) {
          try {
            // const years = await getYearsForTag(tag); // TODO: Implement
      const years = [];
            setTagsYears(prev => ({
              ...prev,
              [tag]: years
            }));
            
            // 年度情報が1つだけある場合は自動的に選択
            if (years && years.length === 1) {
              const tagWithYear = `${tag}${years[0]}`;
              newTagsWithYears.push(tagWithYear);
            }
          } catch (error) {
            console.error(`Failed to get years for tag ${tag}:`, error);
          }
        }
      });
    }
    
    setSelectedTags(newTags);
    setSelectedTagsWithYears(newTagsWithYears);
    
    // 即時検索を実行
    if (newTags.length > 0 || newTagsWithYears.length > 0) {
      const tagQueryString = [...newTags, ...newTagsWithYears]
        .filter((tag, index, self) => 
          // 重複排除と、年度付きタグと同じベースタグを持つ基本タグを除外
          self.indexOf(tag) === index && 
          !newTagsWithYears.some(t => t !== tag && t.startsWith(tag))
        )
        .join(',');
      
      setTagQuery(tagQueryString);
      const searchTermValue = `tag:${tagQueryString}`;
      setSearchTerm(searchTermValue);
      
      // 検索実行と URL 更新
      fetchArchitectures(1, searchTermValue, sortBy);
      const queryParams = new URLSearchParams();
      queryParams.set('tag', tagQueryString);
      if (sortBy !== 'year_desc') {
        queryParams.set('sort', sortBy);
      }
      navigate({ search: queryParams.toString() });
    } else {
      handleClearSearch();
    }
  };

  // 並び替え選択時の処理
  const handleSortChange = (event) => {
    const newSortBy = event.target.value;
    setSortBy(newSortBy);
    
    // 現在の検索条件で並び替えた結果を取得
    fetchArchitectures(currentPage, searchTerm, newSortBy);
    
    // URLを更新（現在のクエリパラメータを保持しつつ、sortを追加）
    const queryParams = new URLSearchParams(location.search);
    queryParams.set('sort', newSortBy);
    navigate({ search: queryParams.toString() });
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchArchitectures(1, searchTerm, sortBy);
    
    // URLを更新
    const queryParams = new URLSearchParams();
    
    // 並び替えの設定
    if (sortBy !== 'year_desc') {
      queryParams.set('sort', sortBy);
    }
    
    // 特殊な検索形式を処理
    if (searchTerm.startsWith('tag:')) {
      // タグ検索の場合はtagパラメータを設定
      const tagValue = searchTerm.substring(4).trim();
      queryParams.set('tag', tagValue);
    } else if (searchTerm.startsWith('year:')) {
      const yearValue = searchTerm.substring(5).trim();
      queryParams.set('year', yearValue);
    } else if (searchTerm.startsWith('prefecture:')) {
      const prefectureValue = searchTerm.substring(11).trim();
      queryParams.set('prefecture', prefectureValue);
    } else if (searchTerm.startsWith('category:')) {
      const categoryValue = searchTerm.substring(9).trim();
      queryParams.set('category', categoryValue);
    } else if (searchTerm.startsWith('architect:')) {
      const architectValue = searchTerm.substring(10).trim();
      queryParams.set('architect', architectValue);
    } else if (searchTerm) {
      // 通常検索の場合はsearchパラメータを設定
      queryParams.set('search', searchTerm);
    }
    
    navigate({ search: queryParams.toString() });
  };

  const handleClearSearch = () => {
    setTagQuery('');
    setSearchTerm('');
    setSelectedTags([]);
    setSelectedTagsWithYears([]);
    setCurrentPage(1);
    fetchArchitectures(1, '', sortBy);
    
    // URLから検索パラメータを削除（並び替えは保持）
    const queryParams = new URLSearchParams();
    if (sortBy !== 'year_desc') {
      queryParams.set('sort', sortBy);
    }
    navigate({ search: queryParams.toString() });
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        建築作品一覧
      </Typography>

      <Paper sx={{ p: 3, mb: 4 }}>
        {/* 検索バーとボタン */}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 3 }}>
          <TextField
            fullWidth
            label="建築作品名、住所、建築家で検索"
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
                // このタグに関連する年度付きタグがあるか確認
                const hasYear = selectedTagsWithYears.some(tag => tag.startsWith(option) && tag !== option);
                // このタグに利用可能な年度情報があるか確認
                const isExpandable = Boolean(tagsYears[option] && tagsYears[option].length > 0);
                // 選択されている年度付きタグを取得
                const selectedYear = selectedTagsWithYears.find(tag => tag.startsWith(option) && tag !== option);
                // 選択された年度の表示文字列（見やすさを考慮）
                let yearDisplay = '';
                if (selectedYear) {
                  const yearPart = selectedYear.substring(option.length);
                  
                  // 年度情報の表示を整形
                  if (yearPart.match(/\d{4}年\d{1,2}月号?/)) {
                    // 年月号パターン（例：2014年7月号 → '14年7月号）
                    yearDisplay = yearPart.replace(/^(\d{4})/, (_, year) => `'${year.substring(2)}`);
                  } else if (yearPart.match(/\d{4}年度?/)) {
                    // 年度パターン（例：2018年 → '18年）
                    yearDisplay = yearPart.replace(/^(\d{4})/, (_, year) => `'${year.substring(2)}`);
                  } else if (yearPart.match(/第\d+回/)) {
                    // 回次パターン（そのまま表示）
                    yearDisplay = yearPart;
                  } else if (yearPart.match(/\(\d{4}\)/)) {
                    // カッコ内年度パターン（例：(2018) → '18）
                    yearDisplay = yearPart.replace(/\((\d{4})\)/, (_, year) => `'${year.substring(2)}`);
                  } else {
                    // その他（そのまま表示）
                    yearDisplay = yearPart;
                  }
                }
                
                return (
                  <Chip
                    key={option}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {option}
                        {selectedYear && (
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
                            {yearDisplay}
                          </Typography>
                        )}
                        {isExpandable && (
                          <ArrowDropDownIcon fontSize="small" />
                        )}
                      </Box>
                    }
                    {...getTagProps({ index })}
                    color={hasYear ? "primary" : "default"}
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
                        textOverflow: 'ellipsis'
                      }
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
              value={sortBy}
              label="並び替え"
              onChange={handleSortChange}
              startAdornment={
                <InputAdornment position="start">
                  <SortIcon />
                </InputAdornment>
              }
            >
              <MenuItem value="year_desc">年代（新しい順）</MenuItem>
              <MenuItem value="year_asc">年代（古い順）</MenuItem>
              <MenuItem value="name_asc">名前（昇順）</MenuItem>
              <MenuItem value="name_desc">名前（降順）</MenuItem>
              <MenuItem value="architect_asc">建築家（昇順）</MenuItem>
              <MenuItem value="architect_desc">建築家（降順）</MenuItem>
            </Select>
          </FormControl>
        </Box>
        
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
              <Chip
                label="指定なし"
                onClick={() => handleYearSelect('')}
                variant="outlined"
                size="small"
                color={
                  selectedTags.includes(currentTagForYear) && 
                  !selectedTagsWithYears.some(t => t.startsWith(currentTagForYear) && t !== currentTagForYear) 
                    ? "primary" : "default"
                }
              />
              {tagsYears[currentTagForYear]?.map(year => {
                // 年度のタイプを判定（年月号、年度、回次など）して適したラベルを表示
                let label = year;
                let color: "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" = "default";
                
                if (selectedTagsWithYears.some(t => t === `${currentTagForYear}${year}`)) {
                  color = "primary";
                }
                
                return (
                  <Chip
                    key={year}
                    label={label}
                    onClick={() => handleYearSelect(year)}
                    variant="outlined"
                    size="small"
                    color={color}
                    sx={{ 
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: '100%'
                    }}
                  />
                );
              })}
            </Box>
          </Box>
        </Popover>
        
        {/* 選択中のタグ表示 */}
        {(tagQuery || searchTerm) && (
          <Box sx={{ mb: 3 }}>
            <Alert 
              severity="info" 
              action={
                <Button color="inherit" size="small" onClick={handleClearSearch}>
                  クリア
                </Button>
              }
            >
              {tagQuery ? `タグ「${tagQuery}」で絞り込み中` : `「${searchTerm}」で検索中`}
            </Alert>
          </Box>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {totalItems} 件の建築作品
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
          {architectures.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6">
                建築作品が見つかりませんでした
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                検索条件を変更してお試しください
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {architectures.map((architecture) => (
                <Grid item key={architecture.Z_PK} xs={12} sm={6} md={4} lg={3}>
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
                      to={`/architecture/${architecture.Z_PK}`}
                      sx={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'flex-start',
                        height: '100%',
                      }}
                    >
                      <CardContent sx={{ width: '100%', flexGrow: 1 }}>
                        <Typography gutterBottom variant="h6" component="h2">
                          {architecture.ZAR_TITLE}
                        </Typography>
                        
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
                          {architecture.ZAR_ARCHITECT && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <PersonIcon fontSize="small" color="action" />
                              <Typography variant="body2" color="text.secondary">
                                {architecture.ZAR_ARCHITECT}
                              </Typography>
                            </Box>
                          )}
                          
                          {architecture.ZAR_ADDRESS && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <LocationOnIcon fontSize="small" color="action" />
                              <Typography variant="body2" color="text.secondary">
                                {architecture.ZAR_ADDRESS}
                              </Typography>
                            </Box>
                          )}
                          
                          {architecture.ZAR_YEAR && architecture.ZAR_YEAR > 0 && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <CalendarTodayIcon fontSize="small" color="action" />
                              <Typography variant="body2" color="text.secondary">
                                {architecture.ZAR_YEAR}年
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}

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

export default ArchitecturePage; 