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
const ArrowBack_1 = __importDefault(require("@mui/icons-material/ArrowBack"));
const LocationOn_1 = __importDefault(require("@mui/icons-material/LocationOn"));
const CalendarToday_1 = __importDefault(require("@mui/icons-material/CalendarToday"));
const Category_1 = __importDefault(require("@mui/icons-material/Category"));
const Person_1 = __importDefault(require("@mui/icons-material/Person"));
const EmojiEvents_1 = __importDefault(require("@mui/icons-material/EmojiEvents"));
const ImageSearch_1 = __importDefault(require("@mui/icons-material/ImageSearch"));
const LanguageOutlined_1 = __importDefault(require("@mui/icons-material/LanguageOutlined"));
const DbService_1 = require("../services/DbService");
const Map_1 = __importDefault(require("../components/Map"));
const ArchitectureSinglePage = () => {
    const { id } = (0, react_router_dom_1.useParams)();
    const [work, setWork] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [error, setError] = (0, react_1.useState)(null);
    const navigate = (0, react_router_dom_1.useNavigate)();
    (0, react_1.useEffect)(() => {
        const fetchWork = () => __awaiter(void 0, void 0, void 0, function* () {
            setLoading(true);
            try {
                const data = yield (0, DbService_1.getArchitectureById)(id);
                if (!data) {
                    throw new Error('建築作品の取得に失敗しました');
                }
                setWork(data);
            }
            catch (error) {
                console.error('Error fetching work:', error);
                setError(error.message);
            }
            finally {
                setLoading(false);
            }
        });
        fetchWork();
    }, [id]);
    if (loading) {
        return ((0, jsx_runtime_1.jsx)(material_1.Box, { sx: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }, children: (0, jsx_runtime_1.jsx)(material_1.CircularProgress, {}) }));
    }
    if (error) {
        return ((0, jsx_runtime_1.jsxs)(material_1.Container, { children: [(0, jsx_runtime_1.jsxs)(material_1.Typography, { variant: "h5", color: "error", sx: { textAlign: 'center', my: 4 }, children: ["\u30A8\u30E9\u30FC\u304C\u767A\u751F\u3057\u307E\u3057\u305F: ", error] }), (0, jsx_runtime_1.jsx)(material_1.Button, { variant: "contained", component: react_router_dom_1.Link, to: "/architecture", startIcon: (0, jsx_runtime_1.jsx)(ArrowBack_1.default, {}), children: "\u5EFA\u7BC9\u4F5C\u54C1\u4E00\u89A7\u306B\u623B\u308B" })] }));
    }
    if (!work) {
        return ((0, jsx_runtime_1.jsxs)(material_1.Container, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "h5", sx: { textAlign: 'center', my: 4 }, children: "\u5EFA\u7BC9\u4F5C\u54C1\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093\u3067\u3057\u305F" }), (0, jsx_runtime_1.jsx)(material_1.Button, { variant: "contained", component: react_router_dom_1.Link, to: "/architecture", startIcon: (0, jsx_runtime_1.jsx)(ArrowBack_1.default, {}), children: "\u5EFA\u7BC9\u4F5C\u54C1\u4E00\u89A7\u306B\u623B\u308B" })] }));
    }
    // タグ文字列を配列に変換
    const tags = work.tag
        ? work.tag.split(',')
            .filter(tag => tag.trim() !== '' && !tag.includes('の追加建築'))
        : [];
    // 新建築の年月情報を抽出（例：新建築2014年7月号 -> 2014年7月号）
    const shinkenchikuInfo = tags.find(tag => tag.includes('新建築'));
    const shinkenchikuLabel = shinkenchikuInfo ? shinkenchikuInfo.replace('新建築', '') : '';
    // タグクリック時の処理（将来的には同じタグの建築物一覧に遷移）
    const handleTagClick = (tag) => {
        console.log(`タグがクリックされました: ${tag}`);
        // 同じタグを持つ建築物の検索ページに遷移する実装を追加
        navigate(`/architecture?tag=${encodeURIComponent(tag)}`);
    };
    // Google画像検索とWikipediaのURL生成
    const getGoogleImageSearchUrl = (workName, architect) => {
        const searchQuery = `${workName} ${(architect === null || architect === void 0 ? void 0 : architect.name) || ''} 建築`;
        return `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}&tbm=isch`;
    };
    const getWikipediaSearchUrl = (workName) => {
        return `https://ja.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(workName)}`;
    };
    return ((0, jsx_runtime_1.jsxs)(material_1.Container, { maxWidth: "lg", sx: { py: 4 }, children: [(0, jsx_runtime_1.jsx)(material_1.Button, { variant: "outlined", component: react_router_dom_1.Link, to: "/architecture", startIcon: (0, jsx_runtime_1.jsx)(ArrowBack_1.default, {}), sx: { mb: 3 }, children: "\u5EFA\u7BC9\u4F5C\u54C1\u4E00\u89A7\u306B\u623B\u308B" }), (0, jsx_runtime_1.jsxs)(material_1.Paper, { sx: { p: 3, mb: 4 }, children: [(0, jsx_runtime_1.jsxs)(material_1.Box, { sx: { mb: 2 }, children: [(0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "h4", component: "h1", gutterBottom: true, children: work.name || '無題' }), work.location && ((0, jsx_runtime_1.jsxs)(material_1.Typography, { variant: "subtitle1", color: "text.secondary", gutterBottom: true, children: [(0, jsx_runtime_1.jsx)(LocationOn_1.default, { fontSize: "small", sx: { verticalAlign: 'middle', mr: 0.5 } }), work.location] })), (0, jsx_runtime_1.jsxs)(material_1.Box, { sx: { display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }, children: [work.completedYear !== 0 && ((0, jsx_runtime_1.jsx)(material_1.Chip, { icon: (0, jsx_runtime_1.jsx)(CalendarToday_1.default, {}), label: `${work.completedYear}年`, variant: "outlined", size: "small", onClick: () => navigate(`/architecture?year=${work.completedYear}`), clickable: true })), work.city && ((0, jsx_runtime_1.jsx)(material_1.Chip, { icon: (0, jsx_runtime_1.jsx)(LocationOn_1.default, {}), label: work.city, variant: "outlined", size: "small", onClick: () => navigate(`/architecture?prefecture=${encodeURIComponent(work.city)}`), clickable: true })), work.architect && work.architect.name && ((0, jsx_runtime_1.jsx)(material_1.Chip, { icon: (0, jsx_runtime_1.jsx)(Person_1.default, {}), label: work.architect.name, component: react_router_dom_1.Link, to: `/architects/${work.architect.id}`, clickable: true, color: "primary", size: "small" })), work.bigCategory && ((0, jsx_runtime_1.jsx)(material_1.Chip, { icon: (0, jsx_runtime_1.jsx)(Category_1.default, {}), label: work.bigCategory, variant: "outlined", size: "small", onClick: () => navigate(`/architecture?category=${encodeURIComponent(work.bigCategory)}`), clickable: true })), work.category && work.category !== work.bigCategory && ((0, jsx_runtime_1.jsx)(material_1.Chip, { icon: (0, jsx_runtime_1.jsx)(Category_1.default, {}), label: work.category, variant: "outlined", size: "small", onClick: () => navigate(`/architecture?category=${encodeURIComponent(work.category)}`), clickable: true }))] }), tags.length > 0 && ((0, jsx_runtime_1.jsx)(material_1.Box, { sx: { display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }, children: tags.map((tag, index) => ((0, jsx_runtime_1.jsx)(material_1.Chip, { icon: (0, jsx_runtime_1.jsx)(EmojiEvents_1.default, {}), label: tag, onClick: () => handleTagClick(tag), clickable: true, color: "secondary", variant: "outlined", size: "small" }, index))) }))] }), (0, jsx_runtime_1.jsx)(material_1.Divider, { sx: { my: 3 } }), (0, jsx_runtime_1.jsxs)(material_1.Box, { sx: { mb: 3, display: 'flex', flexDirection: 'row', gap: 1 }, children: [work.shinkenchikuUrl && ((0, jsx_runtime_1.jsx)(material_1.Tooltip, { title: "\u65B0\u5EFA\u7BC9\u30C7\u30FC\u30BF\u3067\u898B\u308B", children: (0, jsx_runtime_1.jsxs)(material_1.Button, { variant: "contained", href: work.shinkenchikuUrl, target: "_blank", rel: "noopener noreferrer", size: "small", sx: {
                                        backgroundColor: '#003366', // 紺色
                                        color: '#ffffff',
                                        '&:hover': {
                                            backgroundColor: '#002244',
                                        }
                                    }, children: [(0, jsx_runtime_1.jsx)(material_1.Box, { sx: {
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                mr: 0.5
                                            }, children: (0, jsx_runtime_1.jsx)("img", { src: "https://data.shinkenchiku.online/favicon.ico", alt: "\u65B0\u5EFA\u7BC9\u30C7\u30FC\u30BF", style: {
                                                    height: '16px',
                                                    width: 'auto',
                                                    marginRight: '4px'
                                                } }) }), shinkenchikuLabel && ((0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "caption", children: shinkenchikuLabel }))] }) })), (0, jsx_runtime_1.jsx)(material_1.Tooltip, { title: "Google\u753B\u50CF\u691C\u7D22", children: (0, jsx_runtime_1.jsx)(material_1.Button, { href: getGoogleImageSearchUrl(work.name, work.architect), target: "_blank", rel: "noopener noreferrer", startIcon: (0, jsx_runtime_1.jsx)(ImageSearch_1.default, {}), variant: "contained", size: "small", sx: {
                                        backgroundColor: '#4285F4',
                                        color: '#ffffff',
                                        '&:hover': {
                                            backgroundColor: '#3367D6',
                                        }
                                    }, children: "\u753B\u50CF" }) }), (0, jsx_runtime_1.jsx)(material_1.Tooltip, { title: "Wikipedia\u3067\u691C\u7D22", children: (0, jsx_runtime_1.jsx)(material_1.Button, { href: getWikipediaSearchUrl(work.name), target: "_blank", rel: "noopener noreferrer", startIcon: (0, jsx_runtime_1.jsx)(LanguageOutlined_1.default, {}), variant: "contained", size: "small", sx: {
                                        backgroundColor: '#333333',
                                        color: '#ffffff',
                                        '&:hover': {
                                            backgroundColor: '#222222',
                                        }
                                    }, children: "Wikipedia" }) })] }), work.description && ((0, jsx_runtime_1.jsxs)(material_1.Box, { sx: { mt: 3 }, children: [(0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "h6", gutterBottom: true, children: "\u6982\u8981" }), (0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "body1", paragraph: true, sx: { whiteSpace: 'pre-line' }, children: work.description })] })), work.latitude && work.longitude && ((0, jsx_runtime_1.jsxs)(material_1.Box, { sx: { mt: 3 }, children: [(0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "h6", gutterBottom: true, children: "\u4F4D\u7F6E\u60C5\u5831" }), (0, jsx_runtime_1.jsx)(material_1.Box, { sx: { height: '400px', width: '100%', mt: 2, border: '1px solid #eee', borderRadius: '4px', overflow: 'hidden' }, children: (0, jsx_runtime_1.jsx)(Map_1.default, { singleMarker: {
                                        id: work.id || 0,
                                        latitude: work.latitude,
                                        longitude: work.longitude,
                                        name: work.name,
                                        location: work.location
                                    }, center: [work.latitude, work.longitude], zoom: 15 }) })] }))] })] }));
};
exports.default = ArchitectureSinglePage;
