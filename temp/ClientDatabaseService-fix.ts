// Dynamic imports will be used inside functions

// Determine the base path for assets (always use /archi-site for database files)
const BASE_PATH = '/archi-site';

// Database configuration (will try sql.js-httpvfs first, fallback to direct sql.js)
const DATABASE_CONFIG = {
  from: "jsonconfig",
  configUrl: `${BASE_PATH}/db/database-info.json`
};

// Fallback direct database URL
const DATABASE_URL = `${BASE_PATH}/db/archimap.sqlite`;

// Debug logging
console.log('🔧 Environment debug info:');
console.log('  - import.meta.env.PROD:', import.meta.env.PROD);
console.log('  - BASE_PATH:', BASE_PATH);
console.log('  - Database config URL:', DATABASE_CONFIG.configUrl);

// Database instance and initialization state (supports both sql.js-httpvfs and direct sql.js)
let worker: any = null;
let database: any = null;
let isInitializing = false;
let initPromise: Promise<any> | null = null;
let useChunked = true; // Will be set to false if chunked loading fails

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
  if (worker || database) {
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
 * Try chunked database loading with sql.js-httpvfs
 */
async function tryChunkedLoading(): Promise<any> {
  console.log('🚀 Attempting chunked database loading with sql.js-httpvfs...');
  
  // FIX: Skip chunked loading for architects page due to bundling issue
  if (window.location.hash.includes('/architects')) {
    console.warn('⚠️ Skipping chunked loading for architects page due to known bundling issue');
    throw new Error('Chunked loading disabled for architects page');
  }
  
  try {
    // Dynamic import of sql.js-httpvfs
    // FIX: Add error handling for module import
    let createDbWorker;
    try {
      const module = await import('sql.js-httpvfs');
      createDbWorker = module.createDbWorker;
      
      // FIX: Verify the function exists and is not minified incorrectly
      if (typeof createDbWorker !== 'function') {
        console.error('createDbWorker is not a function, module keys:', Object.keys(module));
        throw new Error('sql.js-httpvfs module loaded but createDbWorker is not a function');
      }
    } catch (importError) {
      console.error('Failed to import sql.js-httpvfs:', importError);
      throw new Error(`Module import failed: ${importError.message}`);
    }
    
    // Test database config file accessibility
    console.log('🗄️ Testing database config file accessibility...');
    console.log(`🔗 Config URL: ${DATABASE_CONFIG.configUrl}`);
    const configResponse = await fetch(DATABASE_CONFIG.configUrl, { method: 'HEAD' });
    
    if (!configResponse.ok) {
      throw new Error(`Database config not accessible: ${configResponse.status} ${configResponse.statusText}`);
    }
    
    console.log('✅ Database config is accessible');
    
    // Create worker with proper configuration for GitHub Pages
    const workerUrl = new URL(`${BASE_PATH}/sqlite.worker.js`, window.location.origin);
    const wasmUrl = new URL(`${BASE_PATH}/sql-wasm.wasm`, window.location.origin);
    
    console.log('🔧 Worker URL:', workerUrl.toString());
    console.log('🔧 WASM URL:', wasmUrl.toString());
    
    // Use proper inline configuration format for sql.js-httpvfs
    const dbConfig = [{
      from: "inline",
      config: {
        serverMode: "full",
        url: `${BASE_PATH}/db/archimap.sqlite`,
        requestChunkSize: 65536
      },
      // Add fileLength at top level to help with GitHub Pages compression issues
      fileLength: 12730368
    }];
    
    console.log('🔧 Using inline config:', JSON.stringify(dbConfig, null, 2));
    
    // Initialize sql.js-httpvfs worker with proper configuration format
    // FIX: Add try-catch specifically for createDbWorker call
    try {
      worker = await createDbWorker(dbConfig, workerUrl.toString(), wasmUrl.toString());
    } catch (workerError) {
      console.error('createDbWorker failed:', workerError);
      // Check for the specific "ge is not a function" error
      if (workerError.message && workerError.message.includes('is not a function')) {
        throw new Error('Bundling issue detected: minified function name conflict');
      }
      throw workerError;
    }
    
    console.log('✅ sql.js-httpvfs worker initialized successfully');
    
    // Test database functionality
    const versionResult = await worker.db.exec('SELECT sqlite_version()');
    if (versionResult && versionResult.length > 0) {
      console.log(`🔍 SQLite バージョン: ${versionResult[0].values[0][0]}`);
    }
    
    const tablesResult = await worker.db.exec("SELECT name FROM sqlite_master WHERE type='table'");
    if (tablesResult && tablesResult.length > 0) {
      console.log(`📋 利用可能なテーブル数: ${tablesResult[0].values.length}`);
      console.log(`📋 テーブル一覧: ${tablesResult[0].values.map((row: any) => row[0]).join(', ')}`);
      
      try {
        const countResult = await worker.db.exec("SELECT COUNT(*) FROM ZCDARCHITECTURE");
        if (countResult && countResult.length > 0) {
          console.log(`🏢 建築データ件数: ${countResult[0].values[0][0]} 件 (チャンク読み込み)`);
        }
      } catch (e) {
        console.log('📋 Architecture table structure checking...');
      }
    }
    
    return worker;
  } catch (error) {
    console.warn('⚠️ Chunked loading failed, will try direct loading:', error.message);
    throw error;
  }
}

/**
 * Fallback to direct sql.js loading
 */
async function tryDirectLoading(): Promise<any> {
  console.log('🚀 Fallback: Using direct sql.js loading...');
  
  try {
    // Dynamic import of sql.js
    console.log('📦 Importing sql.js...');
    const sqljs = await import('sql.js');
    console.log('📦 sql.js imported:', typeof sqljs, Object.keys(sqljs));
    
    // sql.js exports as default in ES modules
    const initSqlJs = sqljs.default || sqljs;
    
    if (typeof initSqlJs !== 'function') {
      // Try to find the init function in the module
      if (sqljs.initSqlJs && typeof sqljs.initSqlJs === 'function') {
        console.log('📦 Found initSqlJs as named export');
        const SQL = await sqljs.initSqlJs({
          locateFile: (file: string) => {
            if (file === 'sql-wasm.wasm') {
              return `${BASE_PATH}/sql-wasm.wasm`;
            }
            return file;
          }
        });
        database = new SQL.Database();
        return database;
      }
      console.error('❌ Unable to find initSqlJs function in:', sqljs);
      throw new Error('sql.js import failed - no initialization function found');
    }
    
    console.log('📦 initSqlJs function found:', typeof initSqlJs);
    
    // Test database file accessibility
    console.log('🗄️ Testing database file accessibility...');
    console.log(`🔗 Database URL: ${DATABASE_URL}`);
    const dbResponse = await fetch(DATABASE_URL, { method: 'HEAD' });
    
    if (!dbResponse.ok) {
      throw new Error(`Database file not accessible: ${dbResponse.status} ${dbResponse.statusText}`);
    }
    
    const contentLength = dbResponse.headers.get('content-length');
    if (contentLength) {
      const sizeInMB = parseInt(contentLength) / (1024 * 1024);
      console.log(`📁 Database file size: ${sizeInMB.toFixed(2)} MB`);
    }
    
    console.log('✅ Database file is accessible');
    
    // Initialize SQL.js with WASM
    const wasmUrl = `${BASE_PATH}/sql-wasm.wasm`;
    
    const SQL = await initSqlJs({
      locateFile: (file: string) => {
        if (file === 'sql-wasm.wasm') {
          return wasmUrl;
        }
        return file;
      }
    });
    
    console.log('✅ SQL.js initialized successfully');
    
    // Download database file
    console.log('📥 Downloading database file...');
    const dbResponse2 = await fetch(DATABASE_URL);
    
    if (!dbResponse2.ok) {
      throw new Error(`Failed to download database: ${dbResponse2.status} ${dbResponse2.statusText}`);
    }
    
    const dbArrayBuffer = await dbResponse2.arrayBuffer();
    console.log(`✅ Database downloaded: ${(dbArrayBuffer.byteLength / 1024 / 1024).toFixed(2)} MB (uncompressed)`);
    
    // Create database from the downloaded data
    database = new SQL.Database(new Uint8Array(dbArrayBuffer));
    console.log('✅ Database created successfully');
    
    // Test database functionality
    const versionResult = database.exec('SELECT sqlite_version()');
    if (versionResult.length > 0) {
      console.log(`🔍 SQLite バージョン: ${versionResult[0].values[0][0]}`);
    }
    
    const tablesResult = database.exec("SELECT name FROM sqlite_master WHERE type='table'");
    if (tablesResult.length > 0) {
      console.log(`📋 利用可能なテーブル数: ${tablesResult[0].values.length}`);
      console.log(`📋 テーブル一覧: ${tablesResult[0].values.map(row => row[0]).join(', ')}`);
      
      try {
        const countResult = database.exec("SELECT COUNT(*) FROM ZCDARCHITECTURE");
        if (countResult.length > 0) {
          console.log(`🏢 建築データ件数: ${countResult[0].values[0][0]} 件 (直接読み込み)`);
        }
      } catch (e) {
        console.log('📋 Architecture table structure checking...');
      }
      
      // FIX: Also check ZCDARCHITECT table
      try {
        const architectCount = database.exec("SELECT COUNT(*) FROM ZCDARCHITECT");
        if (architectCount.length > 0) {
          console.log(`👤 建築家データ件数: ${architectCount[0].values[0][0]} 件 (直接読み込み)`);
        }
      } catch (e) {
        console.log('📋 Architect table structure checking...');
      }
    }
    
    return database;
  } catch (error) {
    console.error('❌ Direct loading also failed:', error.message);
    throw error;
  }
}

/**
 * データベース接続を初期化する（チャンク読み込み優先、直接読み込みフォールバック）
 * @returns データベースワーカーまたはインスタンス
 */
export const initDatabase = async (): Promise<any> => {
  // 既に初期化済みならそのインスタンスを返す
  if (worker || database) {
    return worker || database;
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
      console.log('🚀 データベース初期化を開始（チャンク読み込み優先、直接読み込みフォールバック）...');
      
      // Check connection speed for better error messages
      const connectionSpeed = await detectConnectionSpeed();
      console.log(`🌐 Connection speed detected: ${connectionSpeed}`);
      
      // FIX: Check if we should skip chunked loading
      const shouldSkipChunked = window.location.hash.includes('/architects') || !useChunked;
      
      if (!shouldSkipChunked) {
        try {
          // Try chunked loading first
          const result = await tryChunkedLoading();
          console.log('🎉 チャンク読み込みが成功しました！');
          return result;
        } catch (chunkedError) {
          console.warn('⚠️ チャンク読み込みに失敗、直接読み込みにフォールバック:', chunkedError.message);
          useChunked = false;
        }
      } else {
        console.log('📋 Skipping chunked loading, going directly to SQL.js');
      }
      
      // Fallback to direct loading
      const result = await tryDirectLoading();
      console.log('🎉 直接読み込みが成功しました！');
      return result;
      
    } catch (error) {
      console.error('❌ データベース初期化エラー:', error);
      worker = null;
      database = null;
      
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
        } else if (error.message.includes('GZIP') || error.message.includes('compression')) {
          enhancedMessage += '\n\n📦 GZIP圧縮の問題が検出されました。データベースファイルの設定を確認中...';
        } else if (error.message.includes('is not a function')) {
          enhancedMessage += '\n\n🔧 モジュールのバンドリングに問題があります。直接読み込みモードに切り替えてください。';
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
    if (!worker && !database) {
      await initDatabase();
    }
    
    // クエリの実行
    if (worker) {
      // Use sql.js-httpvfs worker
      const result = await worker.db.exec(query, params);
      return result;
    } else if (database) {
      // Use direct sql.js database
      const result = database.exec(query, params);
      return result;
    } else {
      throw new Error('データベースが初期化されていません');
    }
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