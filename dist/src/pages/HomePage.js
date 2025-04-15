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
const DbService_1 = require("../services/DbService");
const HomePage = () => {
    const [searchTerm, setSearchTerm] = (0, react_1.useState)('');
    const [recentWorks, setRecentWorks] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [error, setError] = (0, react_1.useState)(null);
    const [isDbReady, setIsDbReady] = (0, react_1.useState)(false);
    (0, react_1.useEffect)(() => {
        const fetchRecentWorks = () => __awaiter(void 0, void 0, void 0, function* () {
            try {
                setLoading(true);
                setError(null);
                console.log('最近の建築作品を取得中...');
                const data = yield (0, DbService_1.getAllArchitectures)(1, 6);
                setRecentWorks(data.items);
                setIsDbReady(true);
                console.log('建築作品の取得に成功しました', data);
            }
            catch (error) {
                console.error('建築作品の取得に失敗:', error);
                setError(error.message || 'データベースからの読み込みに失敗しました');
            }
            finally {
                setLoading(false);
            }
        });
        fetchRecentWorks();
    }, []);
    const handleSearch = (e) => {
        e.preventDefault();
        if (searchTerm.trim()) {
            window.location.href = `/architecture?search=${encodeURIComponent(searchTerm)}`;
        }
    };
    return ((0, jsx_runtime_1.jsxs)(material_1.Container, { maxWidth: "lg", children: [(0, jsx_runtime_1.jsxs)(material_1.Box, { sx: {
                    pt: 8,
                    pb: 6,
                    textAlign: 'center',
                }, children: [(0, jsx_runtime_1.jsx)(material_1.Typography, { component: "h1", variant: "h2", align: "center", color: "text.primary", gutterBottom: true, children: "\u5EFA\u7BC9\u30C7\u30FC\u30BF\u30D9\u30FC\u30B9" }), (0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "h5", align: "center", color: "text.secondary", paragraph: true, children: "\u65E5\u672C\u306E\u5EFA\u7BC9\u4F5C\u54C1\u3068\u5EFA\u7BC9\u5BB6\u3092\u691C\u7D22\u30FB\u95B2\u89A7\u3067\u304D\u308B\u30C7\u30FC\u30BF\u30D9\u30FC\u30B9" }), isDbReady && ((0, jsx_runtime_1.jsxs)(material_1.Box, { component: "form", onSubmit: handleSearch, sx: {
                            mt: 4,
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            maxWidth: 600,
                            mx: 'auto'
                        }, children: [(0, jsx_runtime_1.jsx)(material_1.TextField, { fullWidth: true, variant: "outlined", placeholder: "\u5EFA\u7BC9\u4F5C\u54C1\u3001\u5EFA\u7BC9\u5BB6\u3001\u4F4F\u6240\u306A\u3069\u3067\u691C\u7D22", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), sx: { mr: 1 } }), (0, jsx_runtime_1.jsx)(material_1.Button, { type: "submit", variant: "contained", color: "primary", startIcon: (0, jsx_runtime_1.jsx)(Search_1.default, {}), children: "\u691C\u7D22" })] }))] }), (0, jsx_runtime_1.jsxs)(material_1.Box, { sx: { py: 4 }, children: [(0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "h4", gutterBottom: true, children: "\u6700\u8FD1\u306E\u5EFA\u7BC9\u4F5C\u54C1" }), error && ((0, jsx_runtime_1.jsxs)(material_1.Alert, { severity: "error", sx: { mb: 3 }, children: [error, (0, jsx_runtime_1.jsx)(material_1.Button, { size: "small", variant: "outlined", sx: { ml: 2 }, component: react_router_dom_1.Link, to: "/db-explorer", children: "\u8A3A\u65AD\u30C4\u30FC\u30EB\u3092\u958B\u304F" })] })), (0, jsx_runtime_1.jsx)(material_1.Grid, { container: true, spacing: 4, children: loading ? ((0, jsx_runtime_1.jsxs)(material_1.Box, { sx: { display: 'flex', justifyContent: 'center', width: '100%', my: 4 }, children: [(0, jsx_runtime_1.jsx)(material_1.CircularProgress, {}), (0, jsx_runtime_1.jsx)(material_1.Typography, { sx: { ml: 2 }, children: "\u30C7\u30FC\u30BF\u30D9\u30FC\u30B9\u3092\u8AAD\u307F\u8FBC\u307F\u4E2D..." })] })) : recentWorks.length > 0 ? (recentWorks.map((work) => ((0, jsx_runtime_1.jsx)(material_1.Grid, { item: true, xs: 12, sm: 6, md: 4, children: (0, jsx_runtime_1.jsx)(material_1.Card, { sx: {
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    transition: 'transform 0.2s',
                                    '&:hover': {
                                        transform: 'scale(1.02)',
                                    },
                                }, children: (0, jsx_runtime_1.jsx)(material_1.CardActionArea, { component: react_router_dom_1.Link, to: `/architecture/${work.id}`, children: (0, jsx_runtime_1.jsxs)(material_1.CardContent, { sx: { flexGrow: 1 }, children: [(0, jsx_runtime_1.jsx)(material_1.Typography, { gutterBottom: true, variant: "h5", component: "h2", children: work.name }), (0, jsx_runtime_1.jsx)(material_1.Typography, { color: "text.secondary", children: work.architectName || '不明' }), (0, jsx_runtime_1.jsxs)(material_1.Typography, { variant: "body2", color: "text.secondary", children: [work.completedYear && work.completedYear !== 0 ? work.completedYear : '不明', " | ", work.city || '不明'] })] }) }) }) }, work.id)))) : ((0, jsx_runtime_1.jsx)(material_1.Box, { sx: { width: '100%', textAlign: 'center', my: 4 }, children: (0, jsx_runtime_1.jsx)(material_1.Typography, { children: "\u5EFA\u7BC9\u4F5C\u54C1\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093\u3067\u3057\u305F" }) })) }), isDbReady && ((0, jsx_runtime_1.jsx)(material_1.Box, { sx: { display: 'flex', justifyContent: 'center', mt: 4 }, children: (0, jsx_runtime_1.jsx)(material_1.Button, { variant: "outlined", color: "primary", component: react_router_dom_1.Link, to: "/architecture", children: "\u3059\u3079\u3066\u306E\u4F5C\u54C1\u3092\u898B\u308B" }) }))] }), (0, jsx_runtime_1.jsxs)(material_1.Grid, { container: true, spacing: 4, sx: { mt: 2 }, children: [(0, jsx_runtime_1.jsx)(material_1.Grid, { item: true, xs: 12, md: 6, children: (0, jsx_runtime_1.jsxs)(material_1.Paper, { sx: {
                                p: 3,
                                display: 'flex',
                                flexDirection: 'column',
                                height: '100%',
                            }, children: [(0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "h5", gutterBottom: true, children: "\u5EFA\u7BC9\u4F5C\u54C1" }), (0, jsx_runtime_1.jsx)(material_1.Typography, { paragraph: true, children: "\u65E5\u672C\u5168\u56FD\u304B\u308914,000\u4EF6\u4EE5\u4E0A\u306E\u5EFA\u7BC9\u4F5C\u54C1\u60C5\u5831\u3092\u95B2\u89A7\u3067\u304D\u307E\u3059\u3002\u5730\u57DF\u3001\u5E74\u4EE3\u3001\u30AB\u30C6\u30B4\u30EA\u30FC\u306A\u3069\u3067\u691C\u7D22\u53EF\u80FD\u3067\u3059\u3002" }), (0, jsx_runtime_1.jsx)(material_1.Button, { variant: "contained", color: "primary", component: react_router_dom_1.Link, to: "/architecture", sx: { mt: 'auto', alignSelf: 'flex-start' }, children: "\u4F5C\u54C1\u3092\u63A2\u3059" })] }) }), (0, jsx_runtime_1.jsx)(material_1.Grid, { item: true, xs: 12, md: 6, children: (0, jsx_runtime_1.jsxs)(material_1.Paper, { sx: {
                                p: 3,
                                display: 'flex',
                                flexDirection: 'column',
                                height: '100%',
                            }, children: [(0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "h5", gutterBottom: true, children: "\u5EFA\u7BC9\u5BB6" }), (0, jsx_runtime_1.jsx)(material_1.Typography, { paragraph: true, children: "2,900\u4EBA\u4EE5\u4E0A\u306E\u5EFA\u7BC9\u5BB6\u60C5\u5831\u3092\u53CE\u9332\u3002\u7D4C\u6B74\u3001\u4F5C\u54C1\u30EA\u30B9\u30C8\u3001\u6240\u5C5E\u4E8B\u52D9\u6240\u306A\u3069\u306E\u60C5\u5831\u3092\u78BA\u8A8D\u3067\u304D\u307E\u3059\u3002" }), (0, jsx_runtime_1.jsx)(material_1.Button, { variant: "contained", color: "primary", component: react_router_dom_1.Link, to: "/architects", sx: { mt: 'auto', alignSelf: 'flex-start' }, children: "\u5EFA\u7BC9\u5BB6\u3092\u63A2\u3059" })] }) })] })] }));
};
exports.default = HomePage;
