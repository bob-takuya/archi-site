import { createDbWorker } from 'sql.js-httpvfs';
import type { Database, QueryExecResult } from 'sql.js';

// データベース設定
const DB_CONFIG = {
  from: 'cdn', // またはその他のソース
  config: {
    serverMode: 'full',
    requestChunkSize: 4096,
    url: './db/archimap.sqlite',
  },
};

// Worker URL
const WORKER_URL = './sql-wasm.js';
const WASM_URL = './sql-wasm.wasm';

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
    // 初期化プロミスを作成
    initPromise = createDbWorker(
      [DB_CONFIG as any],
      WORKER_URL,
      WASM_URL,
      () => console.log('データベースワーカーの準備完了')
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