import { createDbWorker } from 'sql.js-httpvfs';
import type { Database, QueryExecResult } from 'sql.js';

// Determine the base path for assets
const BASE_PATH = import.meta.env.PROD ? '/archi-site' : '';

// データベース設定
const DB_CONFIG = {
  from: 'chunks', // Use chunks for better performance
  config: {
    serverMode: 'full',
    requestChunkSize: 4 * 1024 * 1024, // 4MB chunks
    url: `${BASE_PATH}/db/archimap.sqlite`,
    suffixUrl: `${BASE_PATH}/db/archimap.sqlite.suffix`,
  },
};

// Worker URL
const WORKER_URL = `${BASE_PATH}/sqlite.worker.js`;
const WASM_URL = `${BASE_PATH}/sql-wasm.wasm`;

// シングルトンインスタンス
let dbWorker: any = null;
let isInitializing = false;
let initPromise: Promise<any> | null = null;

/**
 * データベース接続の状態
 */
export enum DatabaseStatus {
  NOT_INITIALIZED = 'not_initialized',
  INITIALIZING = 'initializing',
  READY = 'ready',
  ERROR = 'error',
}

/**
 * データベース接続の現在の状態を返す
 */
export const getDatabaseStatus = (): DatabaseStatus => {
  if (dbWorker) {
    return DatabaseStatus.READY;
  }
  if (isInitializing) {
    return DatabaseStatus.INITIALIZING;
  }
  return DatabaseStatus.NOT_INITIALIZED;
};

/**
 * データベース接続を初期化する
 * @returns データベースワーカーのインスタンス
 */
export const initDatabase = async (): Promise<any> => {
  // 既に初期化済みならそのインスタンスを返す
  if (dbWorker) {
    return dbWorker;
  }
  
  // 初期化中なら既存のプロミスを返す
  if (initPromise) {
    return initPromise;
  }
  
  // 初期化フラグを設定
  isInitializing = true;
  
  try {
    // Get actual server response size (compressed if applicable)
    try {
      const headResponse = await fetch(`${BASE_PATH}/db/archimap.sqlite`, { method: 'HEAD' });
      if (headResponse.ok) {
        const contentLength = headResponse.headers.get('content-length');
        if (contentLength) {
          console.log(`Database size from server headers: ${contentLength} bytes`);
        }
      }
      
      const dbInfoResponse = await fetch(`${BASE_PATH}/db/database-info.json`);
      if (dbInfoResponse.ok) {
        const dbInfo = await dbInfoResponse.json();
        console.log(`Database info - uncompressed size: ${dbInfo.size} bytes`);
      }
    } catch (error) {
      console.warn('Could not fetch database size info:', error);
    }

    // Use config without explicit size for compressed files
    const configForCompressed = {
      ...DB_CONFIG,
      config: {
        ...DB_CONFIG.config,
        requestChunkSize: 1024 * 1024, // 1MB chunks for better compatibility
        // Don't specify size - let sql.js-httpvfs handle compressed files
      }
    };

    // 初期化プロミスを作成
    initPromise = createDbWorker(
      [configForCompressed as any],
      WORKER_URL,
      WASM_URL
    );
    
    // データベースワーカーを取得
    dbWorker = await initPromise;
    console.log('データベース接続を確立しました');
    
    // テスト用のシンプルなクエリを実行
    const testResult = await dbWorker.db.exec('SELECT sqlite_version()');
    console.log(`SQLite バージョン: ${testResult[0]?.values[0][0]}`);
    
    return dbWorker;
  } catch (error) {
    console.error('データベース初期化エラー:', error);
    throw error;
  } finally {
    isInitializing = false;
    initPromise = null;
  }
};

/**
 * SQLクエリを実行する
 * @param query 実行するSQLクエリ
 * @param params バインドパラメータ（オプション）
 * @returns クエリ結果
 */
export const executeQuery = async <T = any>(
  query: string,
  params: any[] = []
): Promise<QueryExecResult[]> => {
  try {
    // データベース初期化を確認
    if (!dbWorker) {
      await initDatabase();
    }
    
    // クエリの実行
    const result = await dbWorker.db.exec(query, params);
    return result;
  } catch (error) {
    console.error('クエリ実行エラー:', error);
    throw error;
  }
};

/**
 * クエリ結果をJavaScriptオブジェクトの配列に変換する
 * @param result クエリ実行結果
 * @returns オブジェクトの配列
 */
export const resultsToObjects = <T = Record<string, any>>(
  result: QueryExecResult[]
): T[] => {
  if (!result || result.length === 0) {
    return [];
  }
  
  const { columns, values } = result[0];
  
  return values.map(row => {
    const obj: Record<string, any> = {};
    columns.forEach((col, i) => {
      obj[col] = row[i];
    });
    return obj as T;
  });
};

/**
 * 単一の結果オブジェクトを取得する
 * @param query 実行するSQLクエリ
 * @param params バインドパラメータ（オプション）
 * @returns 単一のオブジェクト、または undefined
 */
export const getSingleResult = async <T = Record<string, any>>(
  query: string,
  params: any[] = []
): Promise<T | undefined> => {
  const results = await executeQuery<T>(query, params);
  const objects = resultsToObjects<T>(results);
  return objects[0];
};

/**
 * 結果の配列を取得する
 * @param query 実行するSQLクエリ
 * @param params バインドパラメータ（オプション）
 * @returns オブジェクトの配列
 */
export const getResultsArray = async <T = Record<string, any>>(
  query: string,
  params: any[] = []
): Promise<T[]> => {
  const results = await executeQuery<T>(query, params);
  return resultsToObjects<T>(results);
};