import { createDbWorker } from 'sql.js-httpvfs';
import type { WorkerHttpvfs } from 'sql.js-httpvfs';

// Determine the base path for assets
const BASE_PATH = import.meta.env.PROD ? '/archi-site' : '';

// Database URLs for sql.js-httpvfs
const DATABASE_URL = `${BASE_PATH}/db/archimap.sqlite`;

// Debug logging
console.log('🔧 Environment debug info:');
console.log('  - import.meta.env.PROD:', import.meta.env.PROD);
console.log('  - BASE_PATH:', BASE_PATH);
console.log('  - DATABASE_URL:', DATABASE_URL);

// Worker instance for sql.js-httpvfs
let worker: WorkerHttpvfs | null = null;
let isInitializing = false;
let initPromise: Promise<WorkerHttpvfs> | null = null;

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
  if (worker) {
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
 * データベース接続を初期化する（sql.js-httpvfs方式）
 * @returns WorkerHttpvfsインスタンス
 */
export const initDatabase = async (): Promise<WorkerHttpvfs> => {
  // 既に初期化済みならそのインスタンスを返す
  if (worker) {
    return worker;
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
      console.log('🚀 データベース初期化を開始（sql.js-httpvfs使用）...');
      
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
        
        // Get database file size for debugging
        const contentLength = dbResponse.headers.get('content-length');
        if (contentLength) {
          const sizeInMB = parseInt(contentLength) / (1024 * 1024);
          console.log(`  - Database file size: ${sizeInMB.toFixed(2)} MB`);
        }
        
        console.log('✅ Database file is accessible');
      } catch (dbAccessError) {
        console.error('❌ Database file accessibility check failed:', dbAccessError);
        throw new Error(`Database file not accessible: ${dbAccessError.message}`);
      }
      
      console.log('📦 sql.js-httpvfs worker を初期化中...');
      console.log(`📍 Database URL: ${DATABASE_URL}`);
      
      // sql.js-httpvfs worker を作成
      // Use worker files from public directory (not node_modules)
      const workerUrl = `${BASE_PATH}/sqlite.worker.js`;
      const wasmUrl = `${BASE_PATH}/sql-wasm.wasm`;
      
      // Additional debug logging for worker URLs
      console.log('🔧 Worker file URLs:');
      console.log('  - workerUrl:', workerUrl);
      console.log('  - wasmUrl:', wasmUrl);
      
      // Test worker file accessibility before creating worker
      console.log('🔍 Testing worker file accessibility...');
      try {
        const workerResponse = await fetch(workerUrl, { method: 'HEAD' });
        const wasmResponse = await fetch(wasmUrl, { method: 'HEAD' });
        
        console.log('  - Worker file status:', workerResponse.status, workerResponse.statusText);
        console.log('  - WASM file status:', wasmResponse.status, wasmResponse.statusText);
        
        if (!workerResponse.ok) {
          throw new Error(`Worker file not accessible: ${workerResponse.status} ${workerResponse.statusText} at ${workerUrl}`);
        }
        
        if (!wasmResponse.ok) {
          throw new Error(`WASM file not accessible: ${wasmResponse.status} ${wasmResponse.statusText} at ${wasmUrl}`);
        }
        
        console.log('✅ All worker files are accessible');
      } catch (accessError) {
        console.error('❌ Worker file accessibility check failed:', accessError);
        throw new Error(`Worker files not accessible: ${accessError.message}`);
      }
      
      // Enhanced configuration for sql.js-httpvfs
      const config = {
        from: 'inline' as const,
        config: {
          serverMode: 'full' as const,
          url: DATABASE_URL,
          requestChunkSize: 4096, // Use standard SQLite page size
          cacheSizeKiB: 2048, // 2MB cache
          filename: 'archimap.sqlite',
          debug: import.meta.env.DEV // Enable debug in development
        }
      };
      
      console.log('🔧 Worker config:', config);
      console.log('🔧 Worker URL:', workerUrl);
      console.log('🔧 WASM URL:', wasmUrl);
      
      // Create worker with timeout and limited bytes to read for initial test
      const workerInitTimeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Worker initialization timeout after 30 seconds')), 30000)
      );
      
      const maxBytesToRead = 50 * 1024 * 1024; // 50MB limit for safety
      
      const workerInit = createDbWorker(
        [config],
        workerUrl,
        wasmUrl,
        maxBytesToRead
      );
      
      worker = await Promise.race([workerInit, workerInitTimeout]);
      console.log('✅ sql.js-httpvfs worker 初期化完了');
      
      // テスト用のシンプルなクエリを実行
      const testResult = await worker.db.exec('SELECT sqlite_version()');
      console.log(`🔍 SQLite バージョン: ${testResult[0]?.values[0][0]}`);
      
      // 簡単なテーブル存在確認
      const tablesResult = await worker.db.exec("SELECT name FROM sqlite_master WHERE type='table'");
      if (tablesResult.length > 0) {
        console.log(`📋 利用可能なテーブル数: ${tablesResult[0].values.length}`);
        
        // 建築データの件数確認
        try {
          const countResult = await worker.db.exec("SELECT COUNT(*) FROM ZCDARCHITECTURE");
          if (countResult.length > 0) {
            console.log(`🏢 建築データ件数: ${countResult[0].values[0][0]} 件`);
          }
        } catch (e) {
          console.log('📋 テーブル構造確認中...');
        }
      }
      
      return worker;
    } catch (error) {
      console.error('❌ データベース初期化エラー:', error);
      worker = null;
      
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
    if (!worker) {
      await initDatabase();
    }
    
    // クエリの実行
    if (!worker) {
      throw new Error('データベースが初期化されていません');
    }
    
    const result = await worker.db.exec(query, params);
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