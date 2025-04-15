"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importDefault(require("react"));
const client_1 = require("react-dom/client");
const react_router_dom_1 = require("react-router-dom");
require("./index.css");
const App_1 = __importDefault(require("./App"));
// ブラウザコンソールにデバッグメッセージを出力
console.log('React アプリケーションを初期化中...', process.env.NODE_ENV);
console.log('DOM root element:', document.getElementById('root'));
// React 18の新しいcreateRootメソッドを使用
const container = document.getElementById('root');
if (!container) {
    console.error('root要素が見つかりません。HTMLに<div id="root"></div>が存在するか確認してください。');
    throw new Error('Failed to find the root element');
}
const root = (0, client_1.createRoot)(container);
// BrowserRouterでbaseNameを設定（GitHubページでのパスに対応）
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const baseName = isLocalhost ? '/' : '/Archi-site';
console.log('Using basename:', baseName, 'on host:', window.location.hostname);
try {
    root.render((0, jsx_runtime_1.jsx)(react_1.default.StrictMode, { children: (0, jsx_runtime_1.jsx)(react_router_dom_1.BrowserRouter, { basename: baseName, children: (0, jsx_runtime_1.jsx)(App_1.default, {}) }) }));
    console.log('React アプリケーションのレンダリングが成功しました');
}
catch (error) {
    console.error('React アプリケーションのレンダリング中にエラーが発生しました:', error);
}
