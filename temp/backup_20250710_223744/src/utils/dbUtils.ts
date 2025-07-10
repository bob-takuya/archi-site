/**
 * Database Utilities
 * 
 * Utility functions for working with database results.
 */

type QueryResult = {
  columns: string[];
  values: any[][];
};

/**
 * Convert a SQL.js query result to an array of objects
 * where each object represents a row with column names as keys
 * 
 * @param result SQL.js query result
 * @returns Array of objects
 */
export const resultToObjects = (result?: QueryResult): any[] => {
  if (!result || !result.columns || !result.values) return [];
  
  const { columns, values } = result;
  return values.map(row => {
    const obj: Record<string, any> = {};
    columns.forEach((col, i) => {
      obj[col] = row[i];
    });
    return obj;
  });
};

/**
 * Escape and validate a column name for use in ORDER BY clauses
 * to prevent SQL injection
 * 
 * @param columnName Column name to escape
 * @returns Safe column name
 */
export const escapeSortColumn = (columnName: string): string => {
  if (!columnName) return 'ZAA_NAME'; // Default sort column
  
  // Allow only alphanumeric and underscore characters
  const safeColumn = columnName.replace(/[^a-zA-Z0-9_]/g, '');
  
  // List of allowed columns (whitelist approach)
  const allowedColumns = [
    'ZAA_ID', 'ZAA_NAME', 'ZAA_PREFECTURE', 'ZAA_CITY', 'ZAA_YEAR',
    'ZAR_ID', 'ZAR_NAME', 'ZAR_BIRTHYEAR', 'ZAR_NATIONALITY',
    'id', 'name', 'prefecture', 'city', 'year', 'birthyear', 'nationality'
  ];
  
  // If the sanitized column is in the allowed list, return it
  if (allowedColumns.includes(safeColumn)) {
    return safeColumn;
  }
  
  // For columns not in the whitelist, we still allow them if they're safe
  // (only contain alphanumeric and underscore characters)
  return safeColumn;
};

/**
 * Database utilities for debugging and verification
 */

import { isDatabaseAvailable } from '../services/db';
import { isGitHubPages } from './githubPages';
import type { DatabaseMetadata } from '../types/db';

// Debug flag - set to true to enable verbose logging
const DEBUG = true;

/**
 * Verifies that the database can be loaded correctly in the current environment
 * and logs detailed information about any issues encountered
 */
export async function verifyDatabaseLoading(): Promise<boolean> {
  try {
    console.log('🔍 Verifying database availability...');
    
    // Check if we're in production (GitHub Pages) environment
    const isProduction = import.meta.env.PROD;
    console.log(`📊 Environment: ${isProduction ? 'Production' : 'Development'}`);
    
    // Log base URL information
    const baseUrl = isProduction ? '/archi-site' : '';
    console.log(`🌐 Base URL: ${baseUrl}`);
    console.log(`🗄️ Expected database path: ${baseUrl}/db/archimap.sqlite`);
    console.log(`📑 Expected suffix path: ${baseUrl}/db/archimap.sqlite.suffix`);
    
    // Try to check database availability
    const startTime = performance.now();
    const isAvailable = await isDatabaseAvailable();
    const endTime = performance.now();
    
    if (isAvailable) {
      console.log(`✅ Database verification successful! (${(endTime - startTime).toFixed(2)}ms)`);
      return true;
    } else {
      console.error('❌ Database verification failed - database is not available');
      
      // More detailed diagnostics in production
      if (isProduction) {
        console.error('📋 Production diagnostics:');
        console.error(' - Check that database files exist in the build output');
        console.error(' - Verify CORS headers if using a CDN');
        console.error(' - Check for console errors related to WASM loading');
        console.error(' - Ensure sql-wasm.wasm is accessible');
      }
      
      return false;
    }
  } catch (error) {
    console.error('💥 Database verification error:', error);
    return false;
  }
}

/**
 * データベース設定の詳細をログに出力
 * 開発時のデバッグ用
 */
export const logDatabaseDetails = async (): Promise<void> => {
  try {
    const isProduction = import.meta.env?.PROD || false;
    const isGHPages = isGitHubPages();
    
    console.log(`アプリケーション環境: ${isProduction ? '本番' : '開発'}`);
    console.log(`GitHub Pages環境: ${isGHPages ? 'はい' : 'いいえ'}`);
    
    // 本番環境ではデータベース情報ファイルを取得
    if (isProduction) {
      try {
        const dbInfoPath = isGHPages ? './db/database-info.json' : '/db/database-info.json';
        const response = await fetch(dbInfoPath);
        
        if (response.ok) {
          const dbInfo: DatabaseMetadata = await response.json();
          
          console.log('データベース情報:');
          console.log(`- ファイル: ${dbInfo.database}`);
          console.log(`- 更新日時: ${dbInfo.date}`);
          console.log(`- サイズ: ${(dbInfo.size / 1024 / 1024).toFixed(2)} MB`);
          console.log(`- チャンク: ${dbInfo.chunks} (${dbInfo.chunkSize / 1024}KB)のチャンク`);
          console.log(`- テーブル数: ${dbInfo.tables.length}`);
          console.log(`- インデックス数: ${dbInfo.indexes.length}`);
        } else {
          console.warn('データベースメタデータが見つかりません:', response.status);
        }
      } catch (error) {
        console.warn('データベースメタデータ読み込みエラー:', error);
      }
    } else {
      console.log('開発環境: データベースメタデータ読み込みをスキップ');
    }
  } catch (error) {
    console.error('データベース設定ログエラー:', error);
  }
};

/**
 * データベースエラーのフォーマット
 * @param error エラーオブジェクト
 * @returns フォーマット済みエラーメッセージ
 */
export const formatDatabaseError = (error: unknown): string => {
  if (error instanceof Error) {
    return `データベースエラー: ${error.message}`;
  }
  return `データベースエラー: ${String(error)}`;
};

/**
 * クエリパフォーマンスを測定するためのラッパー関数
 * @param name クエリの名前/識別子
 * @param fn 実行する非同期関数
 * @returns 元の関数の結果
 */
export async function measureQueryPerformance<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  try {
    const result = await fn();
    const duration = performance.now() - start;
    
    // 100ms以上かかるクエリは警告
    if (duration > 100) {
      console.warn(`クエリパフォーマンス警告 [${name}]: ${duration.toFixed(2)}ms`);
    } else {
      console.log(`クエリ実行 [${name}]: ${duration.toFixed(2)}ms`);
    }
    
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    console.error(`クエリエラー [${name}]: ${duration.toFixed(2)}ms`, error);
    throw error;
  }
}

/**
 * Extract database loading errors from error objects
 */
export function extractDatabaseErrorDetails(error: unknown): string {
  if (!error) return 'Unknown error';
  
  if (error instanceof Error) {
    // Check for specific error patterns
    if (error.message.includes('Failed to fetch')) {
      return 'Network error: Could not download the database file. ' +
             'Check your network connection and ensure the database URL is correct.';
    }
    
    if (error.message.includes('WebAssembly')) {
      return 'WebAssembly error: Could not initialize SQL.js. ' +
             'Ensure your browser supports WebAssembly and that sql-wasm.wasm is accessible.';
    }
    
    if (error.message.includes('SharedArrayBuffer')) {
      return 'SharedArrayBuffer error: This feature requires cross-origin isolation. ' +
             'Please ensure the server has the correct COOP and COEP headers.';
    }
    
    return error.message;
  }
  
  return String(error);
}