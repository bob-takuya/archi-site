import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

// GitHub Pagesのために、リポジトリ名をbasename属性に設定
const root = createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter basename="/Archi-site">
    <App />
  </BrowserRouter>
); 