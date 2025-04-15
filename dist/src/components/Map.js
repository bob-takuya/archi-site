"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_leaflet_1 = require("react-leaflet");
const leaflet_1 = __importDefault(require("leaflet"));
require("leaflet/dist/leaflet.css");
const material_1 = require("@mui/material");
const react_router_dom_1 = require("react-router-dom");
require("../styles/map.css");
// Leaflet iconのデフォルト設定を修正
// @ts-ignore - Leafletのアイコン設定はTypeScriptの型定義と完全に一致しないため
delete leaflet_1.default.Icon.Default.prototype._getIconUrl;
leaflet_1.default.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});
/**
 * 地図コンポーネント
 * マーカーの配列を受け取り、地図上に表示する
 */
const Map = ({ markers = [], center, zoom = 13, height = '500px', singleMarker }) => {
    const [mapCenter, setMapCenter] = (0, react_1.useState)(center);
    // マーカーが1つの場合はそのマーカーを中心にする
    (0, react_1.useEffect)(() => {
        if (singleMarker && singleMarker.latitude && singleMarker.longitude) {
            setMapCenter([singleMarker.latitude, singleMarker.longitude]);
        }
        else if (center) {
            setMapCenter(center);
        }
    }, [singleMarker, center]);
    return ((0, jsx_runtime_1.jsx)("div", { style: { height, width: '100%', marginBottom: '20px' }, children: (0, jsx_runtime_1.jsxs)(react_leaflet_1.MapContainer, { center: mapCenter, zoom: zoom, style: { height: '100%', width: '100%' }, children: [(0, jsx_runtime_1.jsx)(react_leaflet_1.TileLayer, { attribution: '\u00A9 <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors', url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" }), markers.map((marker, index) => (marker.latitude && marker.longitude ? ((0, jsx_runtime_1.jsx)(react_leaflet_1.Marker, { position: [marker.latitude, marker.longitude], children: (0, jsx_runtime_1.jsxs)(react_leaflet_1.Popup, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "h6", children: marker.name }), (0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "body2", children: marker.location }), (0, jsx_runtime_1.jsx)(material_1.Button, { component: react_router_dom_1.Link, to: `/architecture/${marker.id}`, size: "small", variant: "outlined", sx: { mt: 1 }, children: "\u8A73\u7D30\u3092\u898B\u308B" })] }) }, `marker-${marker.id || index}`)) : null)), singleMarker && singleMarker.latitude && singleMarker.longitude && ((0, jsx_runtime_1.jsx)(react_leaflet_1.Marker, { position: [singleMarker.latitude, singleMarker.longitude], children: (0, jsx_runtime_1.jsxs)(react_leaflet_1.Popup, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "h6", children: singleMarker.name }), (0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "body2", children: singleMarker.location })] }) }))] }) }));
};
exports.default = Map;
