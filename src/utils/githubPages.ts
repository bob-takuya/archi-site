/**
 * GitHub Pages redirection utility
 * 
 * This module handles the redirection mechanism used with GitHub Pages
 * for single-page applications. It works with the 404.html pattern
 * to support client-side routing in GitHub Pages.
 */

/**
 * Parse GitHub Pages redirect URL parameters
 * 
 * When a user directly accesses a route like /architects/123
 * GitHub Pages serves the 404.html which redirects to /?/architects/123
 * This function extracts the original path and redirects correctly
 */
export function handleGitHubPagesRedirect(): void {
  // Check if we're on a GitHub Pages redirect URL
  if (
    typeof window !== 'undefined' && // Check for browser environment
    window.location.search.includes('?/') // Detect GitHub Pages redirect pattern
  ) {
    // Extract the path from the search params
    const redirectedPath = window.location.search
      .substring(2) // Remove the '?/' prefix
      .replace(/~and~/g, '&'); // Replace encoded ampersands

    // Extract any hash fragment
    const hashFragment = window.location.hash;

    // Remove any search params after handling the redirect
    const cleanUrl = 
      window.location.origin + 
      window.location.pathname + 
      (hashFragment || '');

    // Use History API to replace the URL without reloading
    window.history.replaceState(
      null,
      document.title,
      cleanUrl + (hashFragment || '')
    );

    console.log('Handled GitHub Pages redirect for path:', redirectedPath);
  }
}

/**
 * GitHubページに関連するユーティリティ関数
 * GitHub Pagesで動作するSPAに必要な処理を提供
 */

/**
 * 実行環境がGitHub Pagesかどうかを判定
 * @returns GitHub Pages環境ならtrue
 */
export const isGitHubPages = (): boolean => {
  try {
    // GitHubページのURLパターンをチェック
    const hostname = window?.location?.hostname || '';
    return /github\.io$/.test(hostname);
  } catch (e) {
    console.error('環境チェックエラー:', e);
    return false;
  }
};

/**
 * GitHubページのベースURLを取得
 * @returns ベースURL（例: /archi-site）
 */
export const getBaseUrl = (): string => {
  if (!isGitHubPages()) {
    return '';
  }
  
  try {
    const pathname = window?.location?.pathname || '';
    // 最初のパスセグメントを取得（リポジトリ名）
    const firstPathSegment = pathname.split('/').filter(Boolean)[0];
    return firstPathSegment ? `/${firstPathSegment}` : '';
  } catch (e) {
    console.error('ベースURL取得エラー:', e);
    return '';
  }
};

/**
 * HashRouterで使用する相対パスを絶対パスに変換
 * @param relativePath 相対パス（例: architecture/123）
 * @returns ハッシュ付きのパス（例: /#/architecture/123）
 */
export const toHashPath = (relativePath: string): string => {
  // 先頭の/を除去
  const cleanPath = relativePath.startsWith('/') 
    ? relativePath.substring(1) 
    : relativePath;
  
  // #/プレフィックスを追加
  return `#/${cleanPath}`;
};

/**
 * アセットの絶対URLを取得（GitHub Pages環境では相対パスの解決が必要）
 * @param assetPath アセットへの相対パス
 * @returns 絶対パス
 */
export const getAssetUrl = (assetPath: string): string => {
  // 先頭の/を除去
  const cleanPath = assetPath.startsWith('/') 
    ? assetPath.substring(1) 
    : assetPath;
  
  // GitHub Pages環境ではベースパスを先頭に追加
  if (isGitHubPages()) {
    const baseUrl = getBaseUrl();
    return `${baseUrl}/${cleanPath}`;
  }
  
  // 開発環境では通常の相対パスを使用
  return `/${cleanPath}`;
};

/**
 * 現在のURL（ハッシュ部分含む）をコピーするための関数
 * シェア機能などで使用
 * @returns 成功時はtrue
 */
export const copyCurrentUrl = async (): Promise<boolean> => {
  try {
    // 現在のURLを取得
    const url = window.location.href;
    
    // Clipboard APIが利用可能ならそれを使用
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      return true;
    }
    
    // フォールバック: 一時的な要素を作成してコピー
    const textArea = document.createElement('textarea');
    textArea.value = url;
    textArea.style.position = 'fixed';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    
    return successful;
  } catch (err) {
    console.error('URL複製エラー:', err);
    return false;
  }
};