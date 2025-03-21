import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';

// ブラウザコンソールにデバッグメッセージを出力
console.log('React アプリケーションを初期化中...');

// React 18の新しいcreateRootメソッドを使用
const container = document.getElementById('root');
const root = createRoot(container);

// BrowserRouterでbaseNameを設定（GitHubページでのパスに対応）
const baseName = window.location.hostname === 'localhost' ? '/' : '/Archi-site';

try {
  root.render(
    <React.StrictMode>
      <BrowserRouter basename={baseName}>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  );
  console.log('React アプリケーションのレンダリングが成功しました');
} catch (error) {
  console.error('React アプリケーションのレンダリング中にエラーが発生しました:', error);
} 