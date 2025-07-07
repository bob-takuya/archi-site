// Import sql.js directly instead of sql.js-httpvfs due to GitHub Pages GZIP compression issues
import initSqlJs from 'sql.js';

// Determine the base path for assets
const BASE_PATH = import.meta.env.PROD ? '/archi-site' : '';

// Database URLs for sql.js
const DATABASE_URL = `${BASE_PATH}/db/archimap.sqlite`;

// Debug logging
console.log('🔧 Environment debug info:');
console.log('  - import.meta.env.PROD:', import.meta.env.PROD);
console.log('  - BASE_PATH:', BASE_PATH);
console.log('  - DATABASE_URL:', DATABASE_URL);

// SQL.js database instance and initialization state
let database: any = null;
let SQL: any = null;
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
  if (database && SQL) {
    return DatabaseStatus.READY;
  }
  if (isInitializing) {
    return DatabaseStatus.INITIALIZING;
  }
  return DatabaseStatus.NOT_INITIALIZED;
};

/**
 * Connection speed detection for better error messages
 */
const detectConnectionSpeed = async (): Promise<'fast' | 'slow' | 'very-slow'> => {
  try {
    const startTime = Date.now();
    const response = await fetch(`${BASE_PATH}/images/shinkenchiku-favicon.ico`, { 
      method: 'HEAD',
      cache: 'no-cache'
    });
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    if (duration < 100) return 'fast';
    if (duration < 500) return 'slow';
    return 'very-slow';
  } catch {
    return 'very-slow';
  }
};

/**
 * データベース接続を初期化する（直接sql.js方式でGitHub Pages対応）
 * @returns データベースインスタンス
 */
export const initDatabase = async (): Promise<any> => {
  // 既に初期化済みならそのインスタンスを返す
  if (database && SQL) {
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
      console.log('🚀 データベース初期化を開始（直接sql.js使用でGitHub Pages GZIP対応）...');
      
      // Check connection speed for better error messages
      const connectionSpeed = await detectConnectionSpeed();
      console.log(`🌐 Connection speed detected: ${connectionSpeed}`);
      
      // Test database file accessibility
      console.log('🗄️ Testing database file accessibility...');
      try {
        const dbResponse = await fetch(DATABASE_URL, { method: 'HEAD' });
        console.log('  - Database file status:', dbResponse.status, dbResponse.statusText);
        
        if (!dbResponse.ok) {
          throw new Error(`Database file not accessible: ${dbResponse.status} ${dbResponse.statusText} at ${DATABASE_URL}`);
        }
        
        // Get database file size for debugging (this will be compressed size from GitHub Pages)
        const contentLength = dbResponse.headers.get('content-length');
        if (contentLength) {
          const sizeInMB = parseInt(contentLength) / (1024 * 1024);
          console.log(`  - Database file size (compressed): ${sizeInMB.toFixed(2)} MB`);
        }
        
        console.log('✅ Database file is accessible');
      } catch (dbAccessError) {
        console.error('❌ Database file accessibility check failed:', dbAccessError);
        throw new Error(`Database file not accessible: ${dbAccessError.message}`);
      }
      
      console.log('📦 sql.js を初期化中...');
      
      // Initialize SQL.js with WASM
      const wasmUrl = `${BASE_PATH}/sql-wasm.wasm`;
      
      console.log('🔧 WASM URL:', wasmUrl);
      
      // Test WASM file accessibility
      console.log('🔍 Testing WASM file accessibility...');
      try {
        const wasmResponse = await fetch(wasmUrl, { method: 'HEAD' });
        console.log('  - WASM file status:', wasmResponse.status, wasmResponse.statusText);
        
        if (!wasmResponse.ok) {
          throw new Error(`WASM file not accessible: ${wasmResponse.status} ${wasmResponse.statusText} at ${wasmUrl}`);
        }
        
        console.log('✅ WASM file is accessible');
      } catch (accessError) {
        console.error('❌ WASM file accessibility check failed:', accessError);
        throw new Error(`WASM file not accessible: ${accessError.message}`);
      }
      
      // Initialize SQL.js with explicit WASM URL
      console.log('🔧 Initializing SQL.js...');
      SQL = await initSqlJs({
        locateFile: (file: string) => {
          console.log(`🔍 Looking for file: ${file}`);
          if (file === 'sql-wasm.wasm') {
            return wasmUrl;
          }
          return file;
        }
      });
      
      console.log('✅ SQL.js initialized successfully');
      
      // Download database file with progress tracking
      console.log('📥 Downloading database file...');
      const dbResponse = await fetch(DATABASE_URL);
      
      if (!dbResponse.ok) {
        throw new Error(`Failed to download database: ${dbResponse.status} ${dbResponse.statusText}`);
      }
      
      // GitHub Pages automatically decompresses GZIP, so we get the raw SQLite file
      const dbArrayBuffer = await dbResponse.arrayBuffer();
      console.log(`✅ Database downloaded: ${(dbArrayBuffer.byteLength / 1024 / 1024).toFixed(2)} MB (uncompressed)`);
      
      // Create database from the downloaded data
      console.log('🗄️ Creating database from downloaded data...');
      database = new SQL.Database(new Uint8Array(dbArrayBuffer));
      console.log('✅ Database created successfully');
      
      // Test database with simple queries
      console.log('🔍 Testing database functionality...');
      
      // Get SQLite version
      const versionResult = database.exec('SELECT sqlite_version()');
      if (versionResult.length > 0) {
        console.log(`🔍 SQLite バージョン: ${versionResult[0].values[0][0]}`);
      }
      
      // Check tables
      const tablesResult = database.exec("SELECT name FROM sqlite_master WHERE type='table'");
      if (tablesResult.length > 0) {
        console.log(`📋 利用可能なテーブル数: ${tablesResult[0].values.length}`);
        console.log(`📋 テーブル一覧: ${tablesResult[0].values.map(row => row[0]).join(', ')}`);
        
        // Count architecture data
        try {
          const countResult = database.exec("SELECT COUNT(*) FROM ZCDARCHITECTURE");
          if (countResult.length > 0) {
            console.log(`🏢 建築データ件数: ${countResult[0].values[0][0]} 件`);
          }
        } catch (e) {
          console.log('📋 Architecture table structure checking...');
        }
      }
      
      return database;
    } catch (error) {
      console.error('❌ データベース初期化エラー:', error);
      database = null;
      SQL = null;
      
      // Enhanced error messages based on connection speed and error type
      if (error instanceof Error) {
        const connectionSpeed = await detectConnectionSpeed().catch(() => 'unknown');
        let enhancedMessage = error.message;
        
        if (error.message.includes('timeout')) {
          if (connectionSpeed === 'very-slow') {
            enhancedMessage += '\n\n📡 接続速度が非常に遅いため、データベースの初期化に時間がかかっています。WiFiやより高速な接続をお試しください。';
          } else if (connectionSpeed === 'slow') {
            enhancedMessage += '\n\n📡 接続速度が遅いため、データベースの初期化に時間がかかっています。';
          }
        } else if (error.message.includes('fetch') || error.message.includes('network')) {
          enhancedMessage += '\n\n🌐 ネットワーク接続に問題があります。接続状態を確認してください。';
        }
        
        const enhancedError = new Error(enhancedMessage);
        enhancedError.name = error.name;
        throw enhancedError;
      }
      
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
): Promise<any[]> => {
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
  result: any[]
): T[] => {
  if (!result || result.length === 0) {
    return [];
  }
  
  const { columns, values } = result[0];
  
  return values.map((row: any[]) => {
    const obj: Record<string, any> = {};
    columns.forEach((col: string, i: number) => {
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