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
const Search_1 = __importDefault(require("@mui/icons-material/Search"));
const Person_1 = __importDefault(require("@mui/icons-material/Person"));
const LocationOn_1 = __importDefault(require("@mui/icons-material/LocationOn"));
const CalendarToday_1 = __importDefault(require("@mui/icons-material/CalendarToday"));
const Sort_1 = __importDefault(require("@mui/icons-material/Sort"));
const ArrowDropDown_1 = __importDefault(require("@mui/icons-material/ArrowDropDown"));
const DbService_1 = require("../services/DbService");
const ArchitecturePage = () => {
    var _a;
    const [architectures, setArchitectures] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [totalItems, setTotalItems] = (0, react_1.useState)(0);
    const [currentPage, setCurrentPage] = (0, react_1.useState)(1);
    const [searchTerm, setSearchTerm] = (0, react_1.useState)('');
    const [tagQuery, setTagQuery] = (0, react_1.useState)('');
    const [selectedTags, setSelectedTags] = (0, react_1.useState)([]);
    const [selectedTagsWithYears, setSelectedTagsWithYears] = (0, react_1.useState)([]);
    const [availableTags, setAvailableTags] = (0, react_1.useState)([]);
    const [sortBy, setSortBy] = (0, react_1.useState)('year_desc');
    const [tagYearsMap, setTagYearsMap] = (0, react_1.useState)({});
    const [yearAnchorEl, setYearAnchorEl] = (0, react_1.useState)(null);
    const [currentTagForYear, setCurrentTagForYear] = (0, react_1.useState)('');
    const [tagsYears, setTagsYears] = (0, react_1.useState)({});
    const itemsPerPage = 12;
    const location = (0, react_router_dom_1.useLocation)();
    const navigate = (0, react_router_dom_1.useNavigate)();
    // タグリストの初期ロード
    (0, react_1.useEffect)(() => {
        const fetchTags = () => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const allTags = yield (0, DbService_1.getAllTags)();
                setAvailableTags(allTags);
            }
            catch (error) {
                console.error('タグ取得エラー:', error);
            }
        });
        fetchTags();
    }, []);
    (0, react_1.useEffect)(() => {
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
                }
                else {
                    baseTags.add(t);
                }
            });
            setSelectedTags(Array.from(baseTags));
            setSelectedTagsWithYears(tagWithYears);
            setTagQuery(tag);
            setSearchTerm(`tag:${tag}`);
            fetchArchitectures(1, `tag:${tag}`, sort || sortBy);
        }
        else if (year) {
            setSearchTerm(`year:${year}`);
            fetchArchitectures(1, `year:${year}`, sort || sortBy);
        }
        else if (prefecture) {
            setSearchTerm(`prefecture:${prefecture}`);
            fetchArchitectures(1, `prefecture:${prefecture}`, sort || sortBy);
        }
        else if (category) {
            setSearchTerm(`category:${category}`);
            fetchArchitectures(1, `category:${category}`, sort || sortBy);
        }
        else if (architect) {
            setSearchTerm(`architect:${architect}`);
            fetchArchitectures(1, `architect:${architect}`, sort || sortBy);
        }
        else if (search) {
            setSearchTerm(search);
            fetchArchitectures(1, search, sort || sortBy);
        }
        else {
            fetchArchitectures(1, searchTerm, sort || sortBy);
        }
    }, [location.search]);
    const fetchArchitectures = (page_1, ...args_1) => __awaiter(void 0, [page_1, ...args_1], void 0, function* (page, search = searchTerm, sort = sortBy) {
        setLoading(true);
        try {
            const result = yield (0, DbService_1.getAllArchitectures)(page, itemsPerPage, search, sort);
            setArchitectures(result.items);
            setTotalItems(result.total);
            setCurrentPage(page);
        }
        catch (error) {
            console.error('Error fetching architectures:', error);
        }
        finally {
            setLoading(false);
        }
    });
    const handlePageChange = (event, value) => {
        setCurrentPage(value);
        fetchArchitectures(value, searchTerm, sortBy);
        window.scrollTo(0, 0);
    };
    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
    };
    // タグの年度選択ポップオーバーを開く
    const handleYearMenuOpen = (event, tag) => __awaiter(void 0, void 0, void 0, function* () {
        setYearAnchorEl(event.currentTarget);
        setCurrentTagForYear(tag);
        // 年度情報を取得（既に取得済みでも再度取得して最新の状態を保持）
        try {
            const years = yield (0, DbService_1.getYearsForTag)(tag);
            setTagsYears(prev => (Object.assign(Object.assign({}, prev), { [tag]: years })));
        }
        catch (error) {
            console.error(`Failed to get years for tag ${tag}:`, error);
        }
    });
    // 年度選択ポップオーバーを閉じる
    const handleYearMenuClose = () => {
        setYearAnchorEl(null);
        setCurrentTagForYear('');
    };
    // 特定のタグの年度を選択
    const handleYearSelect = (year) => {
        const tagWithYear = year ? `${currentTagForYear}${year}` : currentTagForYear;
        let newTagsWithYears = [...selectedTagsWithYears];
        const existingIndex = newTagsWithYears.findIndex(t => t.startsWith(currentTagForYear) && (t === currentTagForYear ||
            t.match(new RegExp(`^${currentTagForYear}\\d{4}年\\d{1,2}月号?`)) ||
            t.match(new RegExp(`^${currentTagForYear}\\d{4}年度?`)) ||
            t.match(new RegExp(`^${currentTagForYear}第\\d+回`)) ||
            t.match(new RegExp(`^${currentTagForYear}\\(\\d{4}\\)`))));
        if (existingIndex >= 0) {
            if (year) {
                // 既存のタグを新しい年度つきのタグに置き換え
                newTagsWithYears[existingIndex] = tagWithYear;
            }
            else {
                // 年度なしのタグなら削除（基本タグのみを表示）
                newTagsWithYears.splice(existingIndex, 1);
            }
        }
        else if (year) {
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
            !newTagsWithYears.some(t => t !== tag && t.startsWith(tag)))
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
        let newTagsWithYears = [...selectedTagsWithYears].filter(tag => !removedTags.some(removedTag => tag.startsWith(removedTag)));
        // 新しく選択されたタグを特定
        const addedTags = newTags.filter(tag => !selectedTags.includes(tag));
        // 新しく選択されたタグについて、年度情報を取得
        if (addedTags.length > 0) {
            addedTags.forEach((tag) => __awaiter(void 0, void 0, void 0, function* () {
                if (!tagsYears[tag]) {
                    try {
                        const years = yield (0, DbService_1.getYearsForTag)(tag);
                        setTagsYears(prev => (Object.assign(Object.assign({}, prev), { [tag]: years })));
                        // 年度情報が1つだけある場合は自動的に選択
                        if (years && years.length === 1) {
                            const tagWithYear = `${tag}${years[0]}`;
                            newTagsWithYears.push(tagWithYear);
                        }
                    }
                    catch (error) {
                        console.error(`Failed to get years for tag ${tag}:`, error);
                    }
                }
            }));
        }
        setSelectedTags(newTags);
        setSelectedTagsWithYears(newTagsWithYears);
        // 即時検索を実行
        if (newTags.length > 0 || newTagsWithYears.length > 0) {
            const tagQueryString = [...newTags, ...newTagsWithYears]
                .filter((tag, index, self) => 
            // 重複排除と、年度付きタグと同じベースタグを持つ基本タグを除外
            self.indexOf(tag) === index &&
                !newTagsWithYears.some(t => t !== tag && t.startsWith(tag)))
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
        }
        else {
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
        }
        else if (searchTerm.startsWith('year:')) {
            const yearValue = searchTerm.substring(5).trim();
            queryParams.set('year', yearValue);
        }
        else if (searchTerm.startsWith('prefecture:')) {
            const prefectureValue = searchTerm.substring(11).trim();
            queryParams.set('prefecture', prefectureValue);
        }
        else if (searchTerm.startsWith('category:')) {
            const categoryValue = searchTerm.substring(9).trim();
            queryParams.set('category', categoryValue);
        }
        else if (searchTerm.startsWith('architect:')) {
            const architectValue = searchTerm.substring(10).trim();
            queryParams.set('architect', architectValue);
        }
        else if (searchTerm) {
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
    return ((0, jsx_runtime_1.jsxs)(material_1.Container, { maxWidth: "lg", sx: { py: 4 }, children: [(0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "h4", component: "h1", gutterBottom: true, children: "\u5EFA\u7BC9\u4F5C\u54C1\u4E00\u89A7" }), (0, jsx_runtime_1.jsxs)(material_1.Paper, { sx: { p: 3, mb: 4 }, children: [(0, jsx_runtime_1.jsxs)(material_1.Box, { sx: { display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 3 }, children: [(0, jsx_runtime_1.jsx)(material_1.TextField, { fullWidth: true, label: "\u5EFA\u7BC9\u4F5C\u54C1\u540D\u3001\u4F4F\u6240\u3001\u5EFA\u7BC9\u5BB6\u3067\u691C\u7D22", value: searchTerm, onChange: handleSearchChange, onKeyPress: (e) => e.key === 'Enter' && handleSearch(), InputProps: {
                                    startAdornment: ((0, jsx_runtime_1.jsx)(material_1.InputAdornment, { position: "start", children: (0, jsx_runtime_1.jsx)(Search_1.default, {}) })),
                                } }), (0, jsx_runtime_1.jsx)(material_1.Button, { variant: "contained", onClick: handleSearch, sx: { minWidth: '120px' }, children: "\u691C\u7D22" })] }), (0, jsx_runtime_1.jsxs)(material_1.Box, { sx: { display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, mb: 3, alignItems: 'flex-start' }, children: [(0, jsx_runtime_1.jsx)(material_1.Autocomplete, { multiple: true, id: "tags-selector", options: availableTags, value: selectedTags, onChange: handleTagSelect, renderInput: (params) => ((0, jsx_runtime_1.jsx)(material_1.TextField, Object.assign({}, params, { variant: "outlined", label: "\u30BF\u30B0\u3067\u7D5E\u308A\u8FBC\u307F", placeholder: "\u30BF\u30B0\u3092\u9078\u629E" }))), renderTags: (value, getTagProps) => value.map((option, index) => {
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
                                        }
                                        else if (yearPart.match(/\d{4}年度?/)) {
                                            // 年度パターン（例：2018年 → '18年）
                                            yearDisplay = yearPart.replace(/^(\d{4})/, (_, year) => `'${year.substring(2)}`);
                                        }
                                        else if (yearPart.match(/第\d+回/)) {
                                            // 回次パターン（そのまま表示）
                                            yearDisplay = yearPart;
                                        }
                                        else if (yearPart.match(/\(\d{4}\)/)) {
                                            // カッコ内年度パターン（例：(2018) → '18）
                                            yearDisplay = yearPart.replace(/\((\d{4})\)/, (_, year) => `'${year.substring(2)}`);
                                        }
                                        else {
                                            // その他（そのまま表示）
                                            yearDisplay = yearPart;
                                        }
                                    }
                                    return ((0, jsx_runtime_1.jsx)(material_1.Chip, Object.assign({ label: (0, jsx_runtime_1.jsxs)(material_1.Box, { sx: { display: 'flex', alignItems: 'center' }, children: [option, selectedYear && ((0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "caption", sx: {
                                                        ml: 0.5,
                                                        fontWeight: 'bold',
                                                        backgroundColor: 'rgba(0, 0, 0, 0.08)',
                                                        borderRadius: '4px',
                                                        px: 0.5,
                                                        py: 0.2
                                                    }, children: yearDisplay })), isExpandable && ((0, jsx_runtime_1.jsx)(ArrowDropDown_1.default, { fontSize: "small" }))] }) }, getTagProps({ index }), { color: hasYear ? "primary" : "default", variant: "outlined", onClick: (event) => {
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
                                                textOverflow: 'ellipsis'
                                            }
                                        } }), option));
                                }), sx: { flex: 2 } }), (0, jsx_runtime_1.jsxs)(material_1.FormControl, { sx: { minWidth: 200, flex: 1 }, children: [(0, jsx_runtime_1.jsx)(material_1.InputLabel, { id: "sort-select-label", children: "\u4E26\u3073\u66FF\u3048" }), (0, jsx_runtime_1.jsxs)(material_1.Select, { labelId: "sort-select-label", id: "sort-select", value: sortBy, label: "\u4E26\u3073\u66FF\u3048", onChange: handleSortChange, startAdornment: (0, jsx_runtime_1.jsx)(material_1.InputAdornment, { position: "start", children: (0, jsx_runtime_1.jsx)(Sort_1.default, {}) }), children: [(0, jsx_runtime_1.jsx)(material_1.MenuItem, { value: "year_desc", children: "\u5E74\u4EE3\uFF08\u65B0\u3057\u3044\u9806\uFF09" }), (0, jsx_runtime_1.jsx)(material_1.MenuItem, { value: "year_asc", children: "\u5E74\u4EE3\uFF08\u53E4\u3044\u9806\uFF09" }), (0, jsx_runtime_1.jsx)(material_1.MenuItem, { value: "name_asc", children: "\u540D\u524D\uFF08\u6607\u9806\uFF09" }), (0, jsx_runtime_1.jsx)(material_1.MenuItem, { value: "name_desc", children: "\u540D\u524D\uFF08\u964D\u9806\uFF09" }), (0, jsx_runtime_1.jsx)(material_1.MenuItem, { value: "architect_asc", children: "\u5EFA\u7BC9\u5BB6\uFF08\u6607\u9806\uFF09" }), (0, jsx_runtime_1.jsx)(material_1.MenuItem, { value: "architect_desc", children: "\u5EFA\u7BC9\u5BB6\uFF08\u964D\u9806\uFF09" })] })] })] }), (0, jsx_runtime_1.jsx)(material_1.Popover, { open: Boolean(yearAnchorEl), anchorEl: yearAnchorEl, onClose: handleYearMenuClose, anchorOrigin: {
                            vertical: 'bottom',
                            horizontal: 'left',
                        }, children: (0, jsx_runtime_1.jsxs)(material_1.Box, { sx: { p: 2, maxHeight: 300, width: '250px', overflowY: 'auto' }, children: [(0, jsx_runtime_1.jsxs)(material_1.Typography, { variant: "subtitle2", sx: { mb: 1 }, children: [currentTagForYear, " \u306E\u9078\u629E:"] }), (0, jsx_runtime_1.jsxs)(material_1.Box, { sx: { display: 'flex', flexDirection: 'column', gap: 1 }, children: [(0, jsx_runtime_1.jsx)(material_1.Chip, { label: "\u6307\u5B9A\u306A\u3057", onClick: () => handleYearSelect(''), variant: "outlined", size: "small", color: selectedTags.includes(currentTagForYear) &&
                                                !selectedTagsWithYears.some(t => t.startsWith(currentTagForYear) && t !== currentTagForYear)
                                                ? "primary" : "default" }), (_a = tagsYears[currentTagForYear]) === null || _a === void 0 ? void 0 : _a.map(year => {
                                            // 年度のタイプを判定（年月号、年度、回次など）して適したラベルを表示
                                            let label = year;
                                            let color = "default";
                                            if (selectedTagsWithYears.some(t => t === `${currentTagForYear}${year}`)) {
                                                color = "primary";
                                            }
                                            return ((0, jsx_runtime_1.jsx)(material_1.Chip, { label: label, onClick: () => handleYearSelect(year), variant: "outlined", size: "small", color: color, sx: {
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    maxWidth: '100%'
                                                } }, year));
                                        })] })] }) }), (tagQuery || searchTerm) && ((0, jsx_runtime_1.jsx)(material_1.Box, { sx: { mb: 3 }, children: (0, jsx_runtime_1.jsx)(material_1.Alert, { severity: "info", action: (0, jsx_runtime_1.jsx)(material_1.Button, { color: "inherit", size: "small", onClick: handleClearSearch, children: "\u30AF\u30EA\u30A2" }), children: tagQuery ? `タグ「${tagQuery}」で絞り込み中` : `「${searchTerm}」で検索中` }) })), (0, jsx_runtime_1.jsxs)(material_1.Box, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }, children: [(0, jsx_runtime_1.jsxs)(material_1.Typography, { variant: "body2", color: "text.secondary", children: [totalItems, " \u4EF6\u306E\u5EFA\u7BC9\u4F5C\u54C1"] }), totalPages > 1 && ((0, jsx_runtime_1.jsx)(material_1.Pagination, { count: totalPages, page: currentPage, onChange: handlePageChange, color: "primary", size: "small" }))] })] }), loading ? ((0, jsx_runtime_1.jsx)(material_1.Box, { sx: { display: 'flex', justifyContent: 'center', py: 4 }, children: (0, jsx_runtime_1.jsx)(material_1.CircularProgress, {}) })) : ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [architectures.length === 0 ? ((0, jsx_runtime_1.jsxs)(material_1.Box, { sx: { textAlign: 'center', py: 4 }, children: [(0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "h6", children: "\u5EFA\u7BC9\u4F5C\u54C1\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093\u3067\u3057\u305F" }), (0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "body2", color: "text.secondary", sx: { mt: 1 }, children: "\u691C\u7D22\u6761\u4EF6\u3092\u5909\u66F4\u3057\u3066\u304A\u8A66\u3057\u304F\u3060\u3055\u3044" })] })) : ((0, jsx_runtime_1.jsx)(material_1.Grid, { container: true, spacing: 3, children: architectures.map((architecture) => ((0, jsx_runtime_1.jsx)(material_1.Grid, { item: true, xs: 12, sm: 6, md: 4, lg: 3, children: (0, jsx_runtime_1.jsx)(material_1.Card, { sx: {
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    transition: 'transform 0.2s',
                                    '&:hover': {
                                        transform: 'scale(1.02)',
                                    },
                                }, children: (0, jsx_runtime_1.jsx)(material_1.CardActionArea, { component: react_router_dom_1.Link, to: `/architecture/${architecture.id}`, sx: {
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'flex-start',
                                        height: '100%',
                                    }, children: (0, jsx_runtime_1.jsxs)(material_1.CardContent, { sx: { width: '100%', flexGrow: 1 }, children: [(0, jsx_runtime_1.jsx)(material_1.Typography, { gutterBottom: true, variant: "h6", component: "h2", children: architecture.name }), (0, jsx_runtime_1.jsxs)(material_1.Box, { sx: { display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }, children: [architecture.architectName && ((0, jsx_runtime_1.jsxs)(material_1.Box, { sx: { display: 'flex', alignItems: 'center', gap: 1 }, children: [(0, jsx_runtime_1.jsx)(Person_1.default, { fontSize: "small", color: "action" }), (0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "body2", color: "text.secondary", children: architecture.architectName })] })), architecture.city && ((0, jsx_runtime_1.jsxs)(material_1.Box, { sx: { display: 'flex', alignItems: 'center', gap: 1 }, children: [(0, jsx_runtime_1.jsx)(LocationOn_1.default, { fontSize: "small", color: "action" }), (0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "body2", color: "text.secondary", children: architecture.city })] })), architecture.completedYear > 0 && ((0, jsx_runtime_1.jsxs)(material_1.Box, { sx: { display: 'flex', alignItems: 'center', gap: 1 }, children: [(0, jsx_runtime_1.jsx)(CalendarToday_1.default, { fontSize: "small", color: "action" }), (0, jsx_runtime_1.jsxs)(material_1.Typography, { variant: "body2", color: "text.secondary", children: [architecture.completedYear, "\u5E74"] })] }))] })] }) }) }) }, architecture.id))) })), totalPages > 1 && ((0, jsx_runtime_1.jsx)(material_1.Box, { sx: { display: 'flex', justifyContent: 'center', mt: 4 }, children: (0, jsx_runtime_1.jsx)(material_1.Pagination, { count: totalPages, page: currentPage, onChange: handlePageChange, color: "primary" }) }))] }))] }));
};
exports.default = ArchitecturePage;
