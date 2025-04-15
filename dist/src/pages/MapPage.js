"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const react_1 = __importStar(require("react"));
const react_router_dom_1 = require("react-router-dom");
const material_1 = require("@mui/material");
const FilterList_1 = __importDefault(require("@mui/icons-material/FilterList"));
const Map_1 = __importDefault(require("@mui/icons-material/Map"));
const DbService_1 = require("../services/DbService");
const Map_2 = __importDefault(require("../components/Map"));
const MapPage = () => {
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [works, setWorks] = (0, react_1.useState)([]);
    const [allWorks, setAllWorks] = (0, react_1.useState)([]);
    const [filters, setFilters] = (0, react_1.useState)({
        yearFrom: '',
        yearTo: '',
    });
    const [showFilters, setShowFilters] = (0, react_1.useState)(false);
    const [selectedWork, setSelectedWork] = (0, react_1.useState)(null);
    const [showWorkDetails, setShowWorkDetails] = (0, react_1.useState)(false);
    (0, react_1.useEffect)(() => {
        fetchWorks();
    }, []);
    // ランダムな年代の範囲を生成する関数
    const generateRandomTimeframe = (works) => {
        if (!works || works.length === 0)
            return { from: 0, to: 0 };
        // 有効な年代の作品をフィルタリング
        const validWorks = works.filter(work => work.completedYear > 0);
        if (validWorks.length === 0)
            return { from: 0, to: 0 };
        // 全ての年代をソート
        const years = validWorks.map(work => work.completedYear).sort((a, b) => a - b);
        // 最小年と最大年を取得
        const minYear = years[0];
        const maxYear = years[years.length - 1];
        // 100年程度の範囲をランダムに選択（または利用可能な範囲の半分程度）
        const range = Math.min(100, Math.floor((maxYear - minYear) / 2));
        // 開始年をランダムに選択（全範囲の中で）
        const startYearIndex = Math.floor(Math.random() * (years.length - Math.floor(years.length / 4)));
        const startYear = years[startYearIndex];
        // 最大でも開始年+範囲、または最大年のいずれか小さい方を終了年とする
        const endYear = Math.min(startYear + range, maxYear);
        return { from: startYear, to: endYear };
    };
    const fetchWorks = () => __awaiter(void 0, void 0, void 0, function* () {
        setLoading(true);
        try {
            // ブラウザ内SQLiteを使用してデータを取得
            const data = yield (0, DbService_1.getMapArchitectures)();
            setAllWorks(data);
            // 初回読み込み時はランダムな年代フィルターを適用
            if (!filters.yearFrom && !filters.yearTo) {
                const randomTimeframe = generateRandomTimeframe(data);
                setFilters({
                    yearFrom: randomTimeframe.from.toString(),
                    yearTo: randomTimeframe.to.toString()
                });
                // フィルター適用
                const filteredData = data.filter(work => work.completedYear >= randomTimeframe.from &&
                    work.completedYear <= randomTimeframe.to);
                setWorks(filteredData);
            }
            else {
                // フィルターによる絞り込み（クライアント側で実行）
                let filteredWorks = data;
                if (filters.yearFrom) {
                    filteredWorks = filteredWorks.filter(work => work.completedYear >= parseInt(filters.yearFrom));
                }
                if (filters.yearTo) {
                    filteredWorks = filteredWorks.filter(work => work.completedYear <= parseInt(filters.yearTo));
                }
                setWorks(filteredWorks);
            }
        }
        catch (error) {
            console.error('Error fetching works:', error);
        }
        finally {
            setLoading(false);
        }
    });
    const handleFilterChange = (event) => {
        const { name, value } = event.target;
        setFilters(Object.assign(Object.assign({}, filters), { [name]: value }));
    };
    const applyFilters = () => {
        setLoading(true);
        let filteredWorks = allWorks;
        if (filters.yearFrom) {
            filteredWorks = filteredWorks.filter(work => work.completedYear >= parseInt(filters.yearFrom));
        }
        if (filters.yearTo) {
            filteredWorks = filteredWorks.filter(work => work.completedYear <= parseInt(filters.yearTo));
        }
        setWorks(filteredWorks);
        setLoading(false);
    };
    const clearFilters = () => {
        setFilters({
            yearFrom: '',
            yearTo: '',
        });
        // すべての作品を表示（制限をつけずに表示）
        setWorks(allWorks);
    };
    const handleWorkClick = (work) => {
        setSelectedWork(work);
        setShowWorkDetails(true);
    };
    return ((0, jsx_runtime_1.jsxs)(material_1.Container, { maxWidth: "lg", sx: { py: 4 }, children: [(0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "h4", component: "h1", gutterBottom: true, children: "\u5EFA\u7BC9\u5730\u56F3" }), (0, jsx_runtime_1.jsxs)(material_1.Paper, { sx: { p: 3, mb: 4 }, children: [(0, jsx_runtime_1.jsx)(material_1.Button, { startIcon: (0, jsx_runtime_1.jsx)(FilterList_1.default, {}), onClick: () => setShowFilters(!showFilters), sx: { mb: 2 }, children: showFilters ? 'フィルターを閉じる' : 'フィルターを表示' }), showFilters && ((0, jsx_runtime_1.jsx)(material_1.Box, { sx: { mb: 2 }, children: (0, jsx_runtime_1.jsxs)(material_1.Grid, { container: true, spacing: 2, children: [(0, jsx_runtime_1.jsx)(material_1.Grid, { item: true, xs: 12, sm: 6, md: 4, children: (0, jsx_runtime_1.jsx)(material_1.TextField, { fullWidth: true, label: "\u5E74\u4EE3\uFF08\u304B\u3089\uFF09", name: "yearFrom", type: "number", value: filters.yearFrom, onChange: handleFilterChange }) }), (0, jsx_runtime_1.jsx)(material_1.Grid, { item: true, xs: 12, sm: 6, md: 4, children: (0, jsx_runtime_1.jsx)(material_1.TextField, { fullWidth: true, label: "\u5E74\u4EE3\uFF08\u307E\u3067\uFF09", name: "yearTo", type: "number", value: filters.yearTo, onChange: handleFilterChange }) }), (0, jsx_runtime_1.jsx)(material_1.Grid, { item: true, xs: 12, md: 4, children: (0, jsx_runtime_1.jsxs)(material_1.Box, { sx: { display: 'flex', gap: 1, height: '100%' }, children: [(0, jsx_runtime_1.jsx)(material_1.Button, { variant: "contained", color: "primary", onClick: applyFilters, sx: { flexGrow: 1 }, children: "\u30D5\u30A3\u30EB\u30BF\u30FC\u9069\u7528" }), (0, jsx_runtime_1.jsx)(material_1.Button, { variant: "outlined", onClick: clearFilters, sx: { flexGrow: 1 }, children: "\u30AF\u30EA\u30A2" })] }) })] }) })), (0, jsx_runtime_1.jsxs)(material_1.Box, { sx: { display: 'flex', alignItems: 'center', mb: 2 }, children: [(0, jsx_runtime_1.jsx)(Map_1.default, { sx: { mr: 1 } }), (0, jsx_runtime_1.jsxs)(material_1.Typography, { variant: "body2", color: "text.secondary", children: ["\u30DE\u30C3\u30D7\u4E0A\u306B\u8868\u793A\u3055\u308C\u305F\u4F5C\u54C1: ", works.length, "\u4EF6 ", filters.yearFrom && filters.yearTo && `(${filters.yearFrom}年〜${filters.yearTo}年)`] })] })] }), loading ? ((0, jsx_runtime_1.jsx)(material_1.Box, { sx: { display: 'flex', justifyContent: 'center', py: 4 }, children: (0, jsx_runtime_1.jsx)(material_1.CircularProgress, {}) })) : ((0, jsx_runtime_1.jsxs)(material_1.Box, { sx: { height: 600, bgcolor: 'grey.200', position: 'relative', borderRadius: 1 }, children: [(0, jsx_runtime_1.jsx)(Map_2.default, { markers: works, height: "600px", zoom: 5, center: [35.6762, 139.6503] }), (0, jsx_runtime_1.jsxs)(material_1.Box, { sx: { position: 'absolute', top: 16, right: 16, width: 320, maxHeight: 568, overflow: 'auto', bgcolor: 'background.paper', borderRadius: 1, boxShadow: 3, p: 2, zIndex: 1000 }, children: [(0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "h6", gutterBottom: true, children: "\u4F5C\u54C1\u30EA\u30B9\u30C8" }), works.length === 0 ? ((0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "body2", children: "\u6761\u4EF6\u306B\u4E00\u81F4\u3059\u308B\u4F5C\u54C1\u306F\u3042\u308A\u307E\u305B\u3093" })) : ((0, jsx_runtime_1.jsx)(material_1.List, { dense: true, children: works.map((work) => ((0, jsx_runtime_1.jsxs)(react_1.default.Fragment, { children: [(0, jsx_runtime_1.jsx)(material_1.ListItem, { onClick: () => handleWorkClick(work), sx: {
                                                cursor: 'pointer',
                                                bgcolor: selectedWork && selectedWork.id === work.id ? 'action.selected' : 'transparent',
                                                '&:hover': { bgcolor: 'action.hover' }
                                            }, children: (0, jsx_runtime_1.jsx)(material_1.ListItemText, { primary: work.name, secondary: (0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [work.architectName && (0, jsx_runtime_1.jsxs)("span", { children: [work.architectName, (0, jsx_runtime_1.jsx)("br", {})] }), work.completedYear > 0 && `${work.completedYear}年 | `, work.city || ''] }) }) }), (0, jsx_runtime_1.jsx)(material_1.Divider, { component: "li" })] }, work.id))) }))] })] })), (0, jsx_runtime_1.jsx)(material_1.Drawer, { anchor: "right", open: showWorkDetails, onClose: () => setShowWorkDetails(false), children: selectedWork && ((0, jsx_runtime_1.jsxs)(material_1.Box, { sx: { width: 350, p: 3 }, children: [(0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "h5", gutterBottom: true, children: selectedWork.name }), (0, jsx_runtime_1.jsxs)(material_1.Box, { sx: { mb: 3 }, children: [selectedWork.architectName && ((0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "subtitle1", color: "text.secondary", children: selectedWork.architectName })), (0, jsx_runtime_1.jsxs)(material_1.Typography, { variant: "body2", children: [selectedWork.completedYear > 0 && `${selectedWork.completedYear}年`, selectedWork.city && ` | ${selectedWork.city}`] }), selectedWork.location && ((0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "body2", sx: { mt: 1 }, children: selectedWork.location }))] }), (0, jsx_runtime_1.jsx)(material_1.Box, { sx: { mb: 3, height: 200 }, children: (0, jsx_runtime_1.jsx)(Map_2.default, { singleMarker: selectedWork, height: "200px", zoom: 15, center: [selectedWork.latitude, selectedWork.longitude] }) }), (0, jsx_runtime_1.jsxs)(material_1.Box, { sx: { display: 'flex', justifyContent: 'space-between', mt: 4 }, children: [(0, jsx_runtime_1.jsx)(material_1.Button, { variant: "outlined", onClick: () => setShowWorkDetails(false), children: "\u9589\u3058\u308B" }), (0, jsx_runtime_1.jsx)(material_1.Button, { variant: "contained", component: react_router_dom_1.Link, to: `/architecture/${selectedWork.id}`, children: "\u8A73\u7D30\u3092\u898B\u308B" })] })] })) })] }));
};
exports.default = MapPage;
