"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_router_dom_1 = require("react-router-dom");
const material_1 = require("@mui/material");
const Event_1 = __importDefault(require("@mui/icons-material/Event"));
const LocationOn_1 = __importDefault(require("@mui/icons-material/LocationOn"));
/**
 * 建築作品のリストを表示するコンポーネント
 */
const ArchitectureList = ({ architectures, compact = false }) => {
    if (!architectures || architectures.length === 0) {
        return ((0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "body2", color: "text.secondary", children: "\u767B\u9332\u3055\u308C\u3066\u3044\u308B\u4F5C\u54C1\u306F\u3042\u308A\u307E\u305B\u3093\u3002" }));
    }
    return ((0, jsx_runtime_1.jsx)(material_1.Grid, { container: true, spacing: compact ? 2 : 3, children: architectures.map((architecture) => ((0, jsx_runtime_1.jsx)(material_1.Grid, { item: true, xs: 12, sm: 6, md: compact ? 6 : 4, children: (0, jsx_runtime_1.jsx)(material_1.Card, { sx: {
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s',
                    '&:hover': {
                        transform: 'scale(1.02)',
                    },
                }, children: (0, jsx_runtime_1.jsx)(material_1.CardActionArea, { component: react_router_dom_1.Link, to: `/architecture/${architecture.id}`, sx: { flexGrow: 1 }, children: (0, jsx_runtime_1.jsxs)(material_1.CardContent, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, { gutterBottom: true, variant: "h6", component: "h2", children: architecture.name }), architecture.completedYear > 0 && ((0, jsx_runtime_1.jsxs)(material_1.Box, { sx: { display: 'flex', alignItems: 'center', mb: 1 }, children: [(0, jsx_runtime_1.jsx)(Event_1.default, { fontSize: "small", sx: { mr: 1, color: 'text.secondary' } }), (0, jsx_runtime_1.jsxs)(material_1.Typography, { variant: "body2", color: "text.secondary", children: [architecture.completedYear, "\u5E74"] })] })), (architecture.city || architecture.location) && ((0, jsx_runtime_1.jsxs)(material_1.Box, { sx: { display: 'flex', alignItems: 'center', mb: 1 }, children: [(0, jsx_runtime_1.jsx)(LocationOn_1.default, { fontSize: "small", sx: { mr: 1, color: 'text.secondary' } }), (0, jsx_runtime_1.jsxs)(material_1.Typography, { variant: "body2", color: "text.secondary", children: [architecture.city ? architecture.city : '', architecture.city && architecture.location ? ' / ' : '', architecture.location ? architecture.location : ''] })] })), architecture.tag && ((0, jsx_runtime_1.jsx)(material_1.Box, { sx: { display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }, children: architecture.tag.split(',')
                                    .filter(tag => tag.trim() !== '' && !tag.includes('の追加建築'))
                                    .map((tag, idx) => ((0, jsx_runtime_1.jsx)(material_1.Chip, { label: tag.trim(), size: "small", color: "secondary", variant: "outlined", sx: { height: '20px', fontSize: '0.65rem' } }, idx))) }))] }) }) }) }, architecture.id))) }));
};
exports.default = ArchitectureList;
