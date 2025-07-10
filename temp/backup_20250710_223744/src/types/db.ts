/**
 * データベースに関する型定義
 */

import type { QueryExecResult } from 'sql.js';

/**
 * データベース設定オプション
 */
export interface DatabaseConfig {
  from: 'cdn' | 'local' | 'remote';
  config: {
    serverMode: 'full' | 'partial';
    requestChunkSize: number;
    url: string;
  };
}

/**
 * データベースワーカー
 */
export interface DbWorker {
  db: {
    exec: (query: string, params?: any[]) => Promise<QueryExecResult[]>;
  };
}

/**
 * データベースメタデータ
 */
export interface DatabaseMetadata {
  database: string;
  suffix: string;
  tables: string[];
  indexes: string[];
  size: number;
  chunkSize: number;
  chunks: number;
  date: string;
}

/**
 * クエリパラメータ
 */
export type QueryParams = (string | number | boolean | null)[];

/**
 * SQL.js-httpvfsのサフィックスファイル形式
 */
export interface SuffixFile {
  size: number;
  pageSize: number;
  chunkSize: number;
  url: string;
  chunkCount: number;
  version: number;
}