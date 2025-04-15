"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_router_dom_1 = require("react-router-dom");
const material_1 = require("@mui/material");
const react_router_dom_2 = require("react-router-dom");
const Search_1 = __importDefault(require("@mui/icons-material/Search"));
const Public_1 = __importDefault(require("@mui/icons-material/Public"));
const SortByAlpha_1 = __importDefault(require("@mui/icons-material/SortByAlpha"));
const CalendarMonth_1 = __importDefault(require("@mui/icons-material/CalendarMonth"));
const ArrowDropDown_1 = __importDefault(require("@mui/icons-material/ArrowDropDown"));
const DbService_1 = require("../services/DbService");
const ArchitectsPage = () => {
    var _a;
    console.log("ArchitectsPage コンポーネントがレンダリングされました");
    // 状態変数
    const [architects, setArchitects] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [totalPages, setTotalPages] = (0, react_1.useState)(0);
    const [totalItems, setTotalItems] = (0, react_1.useState)(0);
    const [currentPage, setCurrentPage] = (0, react_1.useState)(1);
    const [searchTerm, setSearchTerm] = (0, react_1.useState)('');
    const [selectedTags, setSelectedTags] = (0, react_1.useState)([]);
    const [selectedTagsWithYears, setSelectedTagsWithYears] = (0, react_1.useState)([]);
    const [availableTags, setAvailableTags] = (0, react_1.useState)([]);
    const [sortBy, setSortBy] = (0, react_1.useState)('name');
    const [sortOrder, setSortOrder] = (0, react_1.useState)('asc');
    // タグ選択用の状態
    const [yearAnchorEl, setYearAnchorEl] = (0, react_1.useState)(null);
    const [currentTagForYear, setCurrentTagForYear] = (0, react_1.useState)('');
    const [tagsYears, setTagsYears] = (0, react_1.useState)({});
    // 新しいフィルターパラメータ
    const [nationality, setNationality] = (0, react_1.useState)('');
    const [category, setCategory] = (0, react_1.useState)('');
    const [school, setSchool] = (0, react_1.useState)('');
    const [birthYearFrom, setBirthYearFrom] = (0, react_1.useState)('');
    const [birthYearTo, setBirthYearTo] = (0, react_1.useState)('');
    const [deathYear, setDeathYear] = (0, react_1.useState)('');
    const navigate = (0, react_router_dom_1.useNavigate)();
    const location = (0, react_router_dom_1.useLocation)();
    const queryParams = new URLSearchParams(location.search);
    // デバッグ: タグメニュー状態の監視
    (0, react_1.useEffect)(() => {
        console.log("tagMenuAnchorEl 状態変更:", Boolean(yearAnchorEl));
    }, [yearAnchorEl]);
    // 並び替えオプション
    const sortOptions = [
        { value: 'name', label: '名前順', icon: (0, jsx_runtime_1.jsx)(SortByAlpha_1.default, {}) },
        { value: 'birthYear', label: '生年順', icon: (0, jsx_runtime_1.jsx)(CalendarMonth_1.default, {}) },
        { value: 'nationality', label: '国籍順', icon: (0, jsx_runtime_1.jsx)(Public_1.default, {}) }
    ];
    // タグの読み込み
    (0, react_1.useEffect)(() => {
        console.log("タグ読み込みのuseEffectが実行されました");
        const loadTags = () => __awaiter(void 0, void 0, void 0, function* () {
            try {
                console.log("建築家タグ取得開始");
                const tags = yield (0, DbService_1.getArchitectTags)();
                console.log("取得した建築家タグ:", tags);
                // タグを日本語のベースタグに変換
                const baseTags = ['国籍', 'カテゴリー', '学校', '生年', '没年'];
                setAvailableTags(baseTags);
            }
            catch (error) {
                console.error('タグ取得エラー:', error);
            }
        });
        loadTags();
    }, []);
    // 建築家データ読み込み
    (0, react_1.useEffect)(() => {
        console.log("建築家データ読み込みのuseEffectが実行されました", location.search);
        const loadArchitects = () => __awaiter(void 0, void 0, void 0, function* () {
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
                const result = yield (0, DbService_1.getAllArchitects)(page, 10, // itemsPerPage
                search, tags, sort, order, nat, cat, sch, birthFrom ? parseInt(birthFrom) : 0, birthTo ? parseInt(birthTo) : 0, death ? parseInt(death) : 0);
                console.log("取得した建築家データ:", result);
                setArchitects(result.items);
                setTotalPages(result.totalPages);
                setTotalItems(result.total);
            }
            catch (error) {
                console.error('建築家データ取得エラー:', error);
            }
            finally {
                setLoading(false);
            }
        });
        loadArchitects();
    }, [location.search]);
    // タグの年度取得関数
    const getYearsForArchitectTag = (tag) => __awaiter(void 0, void 0, void 0, function* () {
        console.log(`${tag}の年度取得開始`);
        let query = '';
        if (tag === '国籍') {
            query = `SELECT DISTINCT ZAT_NATIONALITY as value FROM ZCDARCHITECT WHERE ZAT_NATIONALITY != '' ORDER BY ZAT_NATIONALITY`;
        }
        else if (tag === 'カテゴリー') {
            query = `SELECT DISTINCT ZAT_CATEGORY as value FROM ZCDARCHITECT WHERE ZAT_CATEGORY != '' ORDER BY ZAT_CATEGORY`;
        }
        else if (tag === '学校') {
            query = `SELECT DISTINCT ZAT_SCHOOL as value FROM ZCDARCHITECT WHERE ZAT_SCHOOL != '' ORDER BY ZAT_SCHOOL`;
        }
        else if (tag === '生年') {
            query = `SELECT DISTINCT ZAT_BIRTHYEAR as value FROM ZCDARCHITECT WHERE ZAT_BIRTHYEAR > 0 ORDER BY ZAT_BIRTHYEAR DESC`;
        }
        else if (tag === '没年') {
            query = `SELECT DISTINCT ZAT_DEATHYEAR as value FROM ZCDARCHITECT WHERE ZAT_DEATHYEAR > 0 ORDER BY ZAT_DEATHYEAR DESC`;
        }
        if (!query)
            return [];
        try {
            // DbWorkerを使用して直接クエリを実行
            const db = yield (0, DbService_1.getDbWorker)();
            if (!db) {
                console.error('DBWorkerが初期化されていません');
                return [];
            }
            const results = yield db.exec(query, []);
            if (!results || !results[0] || !results[0].values) {
                return [];
            }
            // 結果を文字列配列に変換
            return results[0].values.map(item => String(item[0])).filter(Boolean);
        }
        catch (error) {
            console.error(`${tag}の値取得エラー:`, error);
            return [];
        }
    });
    // 年度メニューを開く
    const handleYearMenuOpen = (event, tag) => __awaiter(void 0, void 0, void 0, function* () {
        console.log(`${tag}の年度メニューを開く`, event.currentTarget);
        setYearAnchorEl(event.currentTarget);
        setCurrentTagForYear(tag);
        // 年度情報を取得（既に取得済みでない場合）
        if (!tagsYears[tag]) {
            try {
                const years = yield getYearsForArchitectTag(tag);
                console.log(`取得した${tag}の年度:`, years);
                setTagsYears(prev => (Object.assign(Object.assign({}, prev), { [tag]: years })));
            }
            catch (error) {
                console.error(`${tag}の年度取得エラー:`, error);
            }
        }
    });
    // 年度メニューを閉じる
    const handleYearMenuClose = () => {
        console.log("年度メニューを閉じる");
        setYearAnchorEl(null);
        setCurrentTagForYear('');
    };
    // 年度を選択
    const handleYearSelect = (year) => {
        console.log(`年度選択: ${year} (タグ: ${currentTagForYear})`);
        if (currentTagForYear === '国籍') {
            setNationality(year);
        }
        else if (currentTagForYear === 'カテゴリー') {
            setCategory(year);
        }
        else if (currentTagForYear === '学校') {
            setSchool(year);
        }
        else if (currentTagForYear === '生年') {
            setBirthYearFrom(year);
        }
        else if (currentTagForYear === '没年') {
            setDeathYear(year);
        }
        handleYearMenuClose();
        updateUrlAndSearch();
    };
    // タグ選択時の処理
    const handleTagSelect = (event, newTags) => {
        console.log(`タグ選択変更:`, newTags);
        setSelectedTags(newTags);
        // 選択解除されたタグに関連するフィルターをリセット
        const removedTags = selectedTags.filter(tag => !newTags.includes(tag));
        for (const tag of removedTags) {
            if (tag === '国籍') {
                setNationality('');
            }
            else if (tag === 'カテゴリー') {
                setCategory('');
            }
            else if (tag === '学校') {
                setSchool('');
            }
            else if (tag === '生年') {
                setBirthYearFrom('');
                setBirthYearTo('');
            }
            else if (tag === '没年') {
                setDeathYear('');
            }
        }
        // 新しく選択されたタグについて、年度情報を取得
        const addedTags = newTags.filter(tag => !selectedTags.includes(tag));
        if (addedTags.length > 0) {
            addedTags.forEach((tag) => __awaiter(void 0, void 0, void 0, function* () {
                if (!tagsYears[tag]) {
                    try {
                        const years = yield getYearsForArchitectTag(tag);
                        setTagsYears(prev => (Object.assign(Object.assign({}, prev), { [tag]: years })));
                    }
                    catch (error) {
                        console.error(`${tag}の年度取得エラー:`, error);
                    }
                }
            }));
        }
        updateUrlAndSearch();
    };
    // 並び替え変更
    const handleSortChange = (sortValue) => {
        console.log(`並び替え変更: ${sortValue}`);
        // 同じ並び替え方法をクリックした場合は昇順/降順を切り替え
        if (sortBy === sortValue) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        }
        else {
            setSortBy(sortValue);
            setSortOrder('asc');
        }
        updateUrlAndSearch();
    };
    // ページ変更
    const handlePageChange = (event, value) => {
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
        if (currentPage > 1)
            newQueryParams.set('page', currentPage.toString());
        if (searchTerm)
            newQueryParams.set('search', searchTerm);
        if (selectedTags.length > 0)
            newQueryParams.set('tags', selectedTags.join(','));
        if (sortBy !== 'name')
            newQueryParams.set('sortBy', sortBy);
        if (sortOrder !== 'asc')
            newQueryParams.set('sortOrder', sortOrder);
        if (nationality)
            newQueryParams.set('nationality', nationality);
        if (category)
            newQueryParams.set('category', category);
        if (school)
            newQueryParams.set('school', school);
        if (birthYearFrom)
            newQueryParams.set('birthYearFrom', birthYearFrom);
        if (birthYearTo)
            newQueryParams.set('birthYearTo', birthYearTo);
        if (deathYear)
            newQueryParams.set('deathYear', deathYear);
        console.log("新しいURLパラメータ:", newQueryParams.toString());
        navigate({ search: newQueryParams.toString() });
    };
    // 現在のフィルター情報を表示
    const CurrentFilters = () => {
        const activeFilters = [];
        if (nationality)
            activeFilters.push({ label: `国籍: ${nationality}`, onDelete: () => { setNationality(''); updateUrlAndSearch(); } });
        if (birthYearFrom)
            activeFilters.push({ label: `生年: ${birthYearFrom}`, onDelete: () => { setBirthYearFrom(''); updateUrlAndSearch(); } });
        if (deathYear)
            activeFilters.push({ label: `没年: ${deathYear}`, onDelete: () => { setDeathYear(''); updateUrlAndSearch(); } });
        if (category)
            activeFilters.push({ label: `カテゴリー: ${category}`, onDelete: () => { setCategory(''); updateUrlAndSearch(); } });
        if (school)
            activeFilters.push({ label: `学校: ${school}`, onDelete: () => { setSchool(''); updateUrlAndSearch(); } });
        if (activeFilters.length === 0 && !searchTerm && selectedTags.length === 0)
            return null;
        return ((0, jsx_runtime_1.jsx)(material_1.Box, { sx: { mb: 3 }, children: (0, jsx_runtime_1.jsx)(material_1.Alert, { severity: "info", action: (0, jsx_runtime_1.jsx)(material_1.Button, { color: "inherit", size: "small", onClick: handleClearSearch, children: "\u30AF\u30EA\u30A2" }), children: activeFilters.length > 0
                    ? `フィルター: ${activeFilters.map(f => f.label).join(', ')}`
                    : searchTerm
                        ? `「${searchTerm}」で検索中`
                        : selectedTags.length > 0
                            ? `タグ「${selectedTags.join(', ')}」で絞り込み中`
                            : '' }) }));
    };
    return ((0, jsx_runtime_1.jsxs)(material_1.Container, { maxWidth: "lg", sx: { py: 4 }, children: [(0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "h4", component: "h1", gutterBottom: true, children: "\u5EFA\u7BC9\u5BB6\u4E00\u89A7" }), (0, jsx_runtime_1.jsxs)(material_1.Paper, { sx: { p: 3, mb: 4 }, children: [(0, jsx_runtime_1.jsxs)(material_1.Box, { sx: { display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 3 }, children: [(0, jsx_runtime_1.jsx)(material_1.TextField, { fullWidth: true, label: "\u5EFA\u7BC9\u5BB6\u540D\u3001\u56FD\u7C4D\u3001\u30AB\u30C6\u30B4\u30EA\u30FC\u3067\u691C\u7D22", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), onKeyPress: (e) => e.key === 'Enter' && handleSearch(), InputProps: {
                                    startAdornment: ((0, jsx_runtime_1.jsx)(material_1.InputAdornment, { position: "start", children: (0, jsx_runtime_1.jsx)(Search_1.default, {}) })),
                                } }), (0, jsx_runtime_1.jsx)(material_1.Button, { variant: "contained", onClick: handleSearch, sx: { minWidth: '120px' }, children: "\u691C\u7D22" })] }), (0, jsx_runtime_1.jsxs)(material_1.Box, { sx: { display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, mb: 3, alignItems: 'flex-start' }, children: [(0, jsx_runtime_1.jsx)(material_1.Autocomplete, { multiple: true, id: "tags-selector", options: availableTags, value: selectedTags, onChange: handleTagSelect, fullWidth: true, renderInput: (params) => ((0, jsx_runtime_1.jsx)(material_1.TextField, Object.assign({}, params, { variant: "outlined", label: "\u30BF\u30B0\u3067\u7D5E\u308A\u8FBC\u307F", placeholder: "\u30BF\u30B0\u3092\u9078\u629E" }))), renderTags: (value, getTagProps) => value.map((option, index) => {
                                    // このタグに利用可能な年度情報があるか確認
                                    const isExpandable = Boolean(tagsYears[option] && tagsYears[option].length > 0);
                                    // このタグに対して選択されている値
                                    let selectedValue = '';
                                    if (option === '国籍')
                                        selectedValue = nationality;
                                    else if (option === 'カテゴリー')
                                        selectedValue = category;
                                    else if (option === '学校')
                                        selectedValue = school;
                                    else if (option === '生年')
                                        selectedValue = birthYearFrom;
                                    else if (option === '没年')
                                        selectedValue = deathYear;
                                    return ((0, jsx_runtime_1.jsx)(material_1.Chip, Object.assign({ label: (0, jsx_runtime_1.jsxs)(material_1.Box, { sx: { display: 'flex', alignItems: 'center' }, children: [option, selectedValue && ((0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "caption", sx: {
                                                        ml: 0.5,
                                                        fontWeight: 'bold',
                                                        backgroundColor: 'rgba(0, 0, 0, 0.08)',
                                                        borderRadius: '4px',
                                                        px: 0.5,
                                                        py: 0.2
                                                    }, children: selectedValue })), isExpandable && ((0, jsx_runtime_1.jsx)(ArrowDropDown_1.default, { fontSize: "small" }))] }) }, getTagProps({ index }), { color: selectedValue ? "primary" : "default", variant: "outlined", onClick: (event) => {
                                            // クリックイベントが伝播してタグが削除されるのを防止
                                            event.stopPropagation();
                                            handleYearMenuOpen(event, option);
                                        }, onDelete: (event) => {
                                            // 削除イベントはそのまま通過させる
                                            getTagProps({ index }).onDelete(event);
                                        }, sx: {
                                            maxWidth: '100%',
                                            '& .MuiChip-label': {
                                                overflow: 'hidden',
                                                whiteSpace: 'nowrap',
                                            }
                                        } }), option));
                                }) }), (0, jsx_runtime_1.jsxs)(material_1.FormControl, { sx: { minWidth: 200 }, children: [(0, jsx_runtime_1.jsx)(material_1.InputLabel, { id: "sort-select-label", children: "\u4E26\u3073\u66FF\u3048" }), (0, jsx_runtime_1.jsxs)(material_1.Select, { labelId: "sort-select-label", value: `${sortBy}_${sortOrder}`, label: "\u4E26\u3073\u66FF\u3048", onChange: (e) => {
                                            const [newSortBy, newSortOrder] = e.target.value.split('_');
                                            setSortBy(newSortBy);
                                            setSortOrder(newSortOrder);
                                            updateUrlAndSearch();
                                        }, children: [(0, jsx_runtime_1.jsx)(material_1.MenuItem, { value: "name_asc", children: "\u540D\u524D (\u6607\u9806)" }), (0, jsx_runtime_1.jsx)(material_1.MenuItem, { value: "name_desc", children: "\u540D\u524D (\u964D\u9806)" }), (0, jsx_runtime_1.jsx)(material_1.MenuItem, { value: "birthYear_asc", children: "\u751F\u5E74 (\u6607\u9806)" }), (0, jsx_runtime_1.jsx)(material_1.MenuItem, { value: "birthYear_desc", children: "\u751F\u5E74 (\u964D\u9806)" }), (0, jsx_runtime_1.jsx)(material_1.MenuItem, { value: "nationality_asc", children: "\u56FD\u7C4D (\u6607\u9806)" }), (0, jsx_runtime_1.jsx)(material_1.MenuItem, { value: "nationality_desc", children: "\u56FD\u7C4D (\u964D\u9806)" })] })] })] }), (0, jsx_runtime_1.jsx)(material_1.Popover, { open: Boolean(yearAnchorEl), anchorEl: yearAnchorEl, onClose: handleYearMenuClose, anchorOrigin: {
                            vertical: 'bottom',
                            horizontal: 'left',
                        }, transformOrigin: {
                            vertical: 'top',
                            horizontal: 'left',
                        }, children: (0, jsx_runtime_1.jsxs)(material_1.Box, { sx: { p: 2, width: 300, maxHeight: 400, overflow: 'auto' }, children: [(0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "subtitle1", gutterBottom: true, children: currentTagForYear === '国籍' ? '国籍を選択' :
                                        currentTagForYear === 'カテゴリー' ? 'カテゴリーを選択' :
                                            currentTagForYear === '学校' ? '学校を選択' :
                                                currentTagForYear === '生年' ? '生年を選択' :
                                                    currentTagForYear === '没年' ? '没年を選択' : 'タグ値を選択' }), (0, jsx_runtime_1.jsxs)(material_1.Box, { sx: { display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }, children: [(0, jsx_runtime_1.jsx)(material_1.Chip, { label: "\u6307\u5B9A\u306A\u3057", onClick: () => handleYearSelect(''), variant: "outlined", size: "small", sx: { mb: 1 } }), (_a = tagsYears[currentTagForYear]) === null || _a === void 0 ? void 0 : _a.map(year => ((0, jsx_runtime_1.jsx)(material_1.Chip, { label: year, onClick: () => handleYearSelect(year), variant: "outlined", size: "small", color: (currentTagForYear === '国籍' && year === nationality) ||
                                                (currentTagForYear === 'カテゴリー' && year === category) ||
                                                (currentTagForYear === '学校' && year === school) ||
                                                (currentTagForYear === '生年' && year === birthYearFrom) ||
                                                (currentTagForYear === '没年' && year === deathYear)
                                                ? "primary"
                                                : "default", sx: {
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                maxWidth: '100%'
                                            } }, year)))] })] }) }), (0, jsx_runtime_1.jsx)(CurrentFilters, {}), (0, jsx_runtime_1.jsxs)(material_1.Box, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }, children: [(0, jsx_runtime_1.jsxs)(material_1.Typography, { variant: "body2", color: "text.secondary", children: [totalItems, "\u4EBA\u306E\u5EFA\u7BC9\u5BB6"] }), totalPages > 1 && ((0, jsx_runtime_1.jsx)(material_1.Pagination, { count: totalPages, page: currentPage, onChange: handlePageChange, color: "primary", size: "small" }))] })] }), loading ? ((0, jsx_runtime_1.jsx)(material_1.Box, { sx: { display: 'flex', justifyContent: 'center', py: 4 }, children: (0, jsx_runtime_1.jsx)(material_1.CircularProgress, {}) })) : ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [architects.length === 0 ? ((0, jsx_runtime_1.jsxs)(material_1.Box, { sx: { textAlign: 'center', py: 4 }, children: [(0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "h6", children: "\u5EFA\u7BC9\u5BB6\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093\u3067\u3057\u305F" }), (0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "body2", color: "text.secondary", sx: { mt: 1 }, children: "\u691C\u7D22\u6761\u4EF6\u3092\u5909\u66F4\u3057\u3066\u304A\u8A66\u3057\u304F\u3060\u3055\u3044" })] })) : ((0, jsx_runtime_1.jsx)(material_1.Grid, { container: true, spacing: 3, children: architects.map((architect) => ((0, jsx_runtime_1.jsx)(material_1.Grid, { item: true, xs: 12, sm: 6, md: 4, children: (0, jsx_runtime_1.jsx)(material_1.Card, { sx: {
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    transition: 'transform 0.2s',
                                    '&:hover': {
                                        transform: 'scale(1.02)',
                                    },
                                }, children: (0, jsx_runtime_1.jsx)(material_1.CardActionArea, { component: react_router_dom_2.Link, to: `/architects/${architect.id}`, children: (0, jsx_runtime_1.jsxs)(material_1.CardContent, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "h6", component: "div", gutterBottom: true, children: architect.name }), (0, jsx_runtime_1.jsxs)(material_1.Typography, { variant: "body2", color: "text.secondary", gutterBottom: true, children: [architect.nationality, " \u2022 ", architect.birthYear || '?', "-", architect.deathYear || '現在'] }), (0, jsx_runtime_1.jsx)(material_1.Box, { sx: { display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }, children: architect.tags && architect.tags.map((tag) => ((0, jsx_runtime_1.jsx)(material_1.Chip, { label: tag, size: "small", variant: "outlined", sx: { pointerEvents: 'none' } }, tag))) })] }) }) }) }, architect.id))) })), totalPages > 1 && ((0, jsx_runtime_1.jsx)(material_1.Box, { sx: { display: 'flex', justifyContent: 'center', mt: 4 }, children: (0, jsx_runtime_1.jsx)(material_1.Pagination, { count: totalPages, page: currentPage, onChange: handlePageChange, color: "primary" }) }))] }))] }));
};
exports.default = ArchitectsPage;
