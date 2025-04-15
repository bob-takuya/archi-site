import React from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import './index.css';
import App from './App';

// ブラウザコンソールにデバッグメッセージを出力
console.log('React アプリケーションを初期化中...', process.env.NODE_ENV);
console.log('DOM root element:', document.getElementById('root'));

// React 18の新しいcreateRootメソッドを使用
const container = document.getElementById('root');
if (!container) {
  console.error('root要素が見つかりません。HTMLに<div id="root"></div>が存在するか確認してください。');
  throw new Error('Failed to find the root element');
}
const root = createRoot(container);

// GitHub Pages対応のためBrowserRouterからHashRouterに変更
// HashRouterではbasenameは不要（URLのハッシュ部分を使用するため）
console.log('Using HashRouter for GitHub Pages compatibility');

try {
  root.render(
    <React.StrictMode>
      <HashRouter>
        <App />
      </HashRouter>
    </React.StrictMode>
  );
  console.log('React アプリケーションのレンダリングが成功しました');
} catch (error) {
  console.error('React アプリケーションのレンダリング中にエラーが発生しました:', error);
}