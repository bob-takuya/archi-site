import initSqlJs, { Database, QueryExecResult } from 'sql.js';

// Determine the base path for assets
const BASE_PATH = import.meta.env.PROD ? '/archi-site' : '';

// WASM and database URLs
const WASM_URL = `${BASE_PATH}/sql-wasm.wasm`;
const DATABASE_URL = `${BASE_PATH}/db/archimap.sqlite`;

// シングルトンインスタンス
let database: Database | null = null;
let sqlJs: any = null;
let isInitializing = false;
let initPromise: Promise<Database> | null = null;

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
  if (database) {
    return DatabaseStatus.READY;
  }
  if (isInitializing) {
    return DatabaseStatus.INITIALIZING;
  }
  return DatabaseStatus.NOT_INITIALIZED;
};

/**
 * データベース接続を初期化する（完全ファイル読み込み方式）
 * @returns データベースインスタンス
 */
export const initDatabase = async (): Promise<Database> => {
  // 既に初期化済みならそのインスタンスを返す
  if (database) {
    return database;
  }
  
  // 初期化中なら既存のプロミスを返す
  if (initPromise) {
    return initPromise;
  }
  
  // 初期化フラグを設定
  isInitializing = true;
  
  // 初期化プロミスを作成
  initPromise = (async () => {
    try {
      console.log('🚀 データベース初期化を開始...');
      
      // SQL.js を初期化
      if (!sqlJs) {
        console.log('📦 SQL.js WASM を読み込み中...');
        sqlJs = await initSqlJs({
          locateFile: (file: string) => {
            if (file.endsWith('.wasm')) {
              return WASM_URL;
            }
            return file;
          }
        });
        console.log('✅ SQL.js WASM 読み込み完了');
      }
      
      // データベースファイルを直接読み込み
      console.log('💾 データベースファイルを読み込み中...');
      const response = await fetch(DATABASE_URL);
      
      if (!response.ok) {
        throw new Error(`データベースファイルの読み込みに失敗: ${response.status} ${response.statusText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const uintArray = new Uint8Array(arrayBuffer);
      
      console.log(`📊 データベースファイル読み込み完了: ${Math.round(arrayBuffer.byteLength / 1024 / 1024 * 100) / 100} MB`);
      
      // データベースを作成
      database = new sqlJs.Database(uintArray);
      console.log('✅ データベース接続を確立しました');
      
      // テスト用のシンプルなクエリを実行
      const testResult = database.exec('SELECT sqlite_version()');
      console.log(`🔍 SQLite バージョン: ${testResult[0]?.values[0][0]}`);
      
      // 簡単なテーブル存在確認
      const tablesResult = database.exec("SELECT name FROM sqlite_master WHERE type='table'");
      if (tablesResult.length > 0) {
        console.log(`📋 利用可能なテーブル数: ${tablesResult[0].values.length}`);
      }
      
      return database;
    } catch (error) {
      console.error('❌ データベース初期化エラー:', error);
      database = null;
      throw error;
    } finally {
      isInitializing = false;
      initPromise = null;
    }
  })();
  
  return initPromise;
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
    if (!database) {
      await initDatabase();
    }
    
    // クエリの実行
    if (!database) {
      throw new Error('データベースが初期化されていません');
    }
    
    const result = database.exec(query, params);
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