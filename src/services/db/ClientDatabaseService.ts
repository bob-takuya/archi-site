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
      
      // Check connection speed for better error messages
      const connectionSpeed = await detectConnectionSpeed();
      console.log(`🌐 Connection speed detected: ${connectionSpeed}`);
      
      // SQL.js を初期化（タイムアウト設定）
      if (!sqlJs) {
        console.log('📦 SQL.js WASM を読み込み中...');
        
        const wasmInitTimeout = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('WASM initialization timeout after 45 seconds')), 45000)
        );
        
        const wasmInit = initSqlJs({
          locateFile: (file: string) => {
            console.log(`🔍 ファイル要求: ${file}`);
            if (file.endsWith('.wasm')) {
              console.log(`📍 WASM URL: ${WASM_URL}`);
              return WASM_URL;
            }
            return file;
          }
        });
        
        sqlJs = await Promise.race([wasmInit, wasmInitTimeout]);
        console.log('✅ SQL.js WASM 読み込み完了');
      }
      
      // データベースファイルを段階的に読み込み
      console.log('💾 データベースファイルを読み込み中...');
      console.log(`📍 Database URL: ${DATABASE_URL}`);
      
      // Extended timeout for large database download (12.7MB + 1.2MB WASM)
      const dbFetchTimeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database fetch timeout after 120 seconds - Large file download may take longer on slow connections')), 120000)
      );
      
      // Implement exponential backoff retry logic
      const fetchWithRetry = async (url: string, options: RequestInit, maxRetries = 3) => {
        let lastError: Error | null = null;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            console.log(`🔄 Database fetch attempt ${attempt}/${maxRetries}`);
            const response = await fetch(url, options);
            if (response.ok) {
              return response;
            }
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          } catch (error) {
            lastError = error as Error;
            console.warn(`❌ Attempt ${attempt} failed:`, error);
            
            if (attempt < maxRetries) {
              const delay = Math.pow(2, attempt - 1) * 1000; // Exponential backoff
              console.log(`⏳ Retrying in ${delay}ms...`);
              await new Promise(resolve => setTimeout(resolve, delay));
            }
          }
        }
        
        throw lastError;
      };
      
      const dbFetch = fetchWithRetry(DATABASE_URL, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      const response = await Promise.race([dbFetch, dbFetchTimeout]);
      
      if (!response.ok) {
        throw new Error(`データベースファイルの読み込みに失敗: ${response.status} ${response.statusText}`);
      }
      
      const contentLength = response.headers.get('content-length');
      console.log(`📏 データベースサイズ: ${contentLength ? Math.round(parseInt(contentLength) / 1024 / 1024 * 100) / 100 : 'unknown'} MB`);
      
      // Enhanced progress reporting with time estimation
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body reader not available');
      }
      
      const chunks: Uint8Array[] = [];
      let receivedLength = 0;
      const totalLength = contentLength ? parseInt(contentLength) : 0;
      const startTime = Date.now();
      let lastProgressTime = startTime;
      
      // Dispatch progress events for UI updates
      const dispatchProgress = (progress: number, speed: number, eta: number) => {
        window.dispatchEvent(new CustomEvent('database-download-progress', {
          detail: { progress, speed, eta, receivedLength, totalLength }
        }));
      };
      
      console.log(`📦 Starting database download: ${Math.round(totalLength / 1024 / 1024)} MB`);
      
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        chunks.push(value);
        receivedLength += value.length;
        
        if (totalLength > 0) {
          const progress = Math.round((receivedLength / totalLength) * 100);
          const currentTime = Date.now();
          const elapsedTime = (currentTime - startTime) / 1000; // seconds
          const speed = receivedLength / elapsedTime; // bytes per second
          const remainingBytes = totalLength - receivedLength;
          const eta = remainingBytes / speed; // estimated time remaining in seconds
          
          // Update progress every 500ms or every MB
          if (currentTime - lastProgressTime > 500 || receivedLength % (1024 * 1024) < value.length) {
            console.log(`📥 Download progress: ${progress}% (${Math.round(receivedLength / 1024 / 1024)} MB) - ${Math.round(speed / 1024)} KB/s - ETA: ${Math.round(eta)}s`);
            dispatchProgress(progress, speed, eta);
            lastProgressTime = currentTime;
          }
        }
      }
      
      // Final progress update
      if (totalLength > 0) {
        dispatchProgress(100, 0, 0);
      }
      
      // Combine chunks
      const arrayBuffer = new Uint8Array(receivedLength);
      let position = 0;
      for (const chunk of chunks) {
        arrayBuffer.set(chunk, position);
        position += chunk.length;
      }
      
      console.log(`📊 データベースファイル読み込み完了: ${Math.round(receivedLength / 1024 / 1024 * 100) / 100} MB`);
      
      // データベースを作成
      console.log('🔧 SQLite データベースを初期化中...');
      database = new sqlJs.Database(arrayBuffer);
      console.log('✅ データベース接続を確立しました');
      
      // テスト用のシンプルなクエリを実行
      const testResult = database.exec('SELECT sqlite_version()');
      console.log(`🔍 SQLite バージョン: ${testResult[0]?.values[0][0]}`);
      
      // 簡単なテーブル存在確認
      const tablesResult = database.exec("SELECT name FROM sqlite_master WHERE type='table'");
      if (tablesResult.length > 0) {
        console.log(`📋 利用可能なテーブル数: ${tablesResult[0].values.length}`);
        
        // 建築データの件数確認
        try {
          const countResult = database.exec("SELECT COUNT(*) FROM ZCDARCHITECTURE");
          if (countResult.length > 0) {
            console.log(`🏢 建築データ件数: ${countResult[0].values[0][0]} 件`);
          }
        } catch (e) {
          console.log('📋 テーブル構造確認中...');
        }
      }
      
      return database;
    } catch (error) {
      console.error('❌ データベース初期化エラー:', error);
      database = null;
      
      // Enhanced error messages based on connection speed and error type
      if (error instanceof Error) {
        const connectionSpeed = await detectConnectionSpeed().catch(() => 'unknown');
        let enhancedMessage = error.message;
        
        if (error.message.includes('timeout')) {
          if (connectionSpeed === 'very-slow') {
            enhancedMessage += '\n\n📡 接続速度が非常に遅いため、ファイルのダウンロードに時間がかかっています。WiFiやより高速な接続をお試しください。';
          } else if (connectionSpeed === 'slow') {
            enhancedMessage += '\n\n📡 接続速度が遅いため、大きなファイルのダウンロードに時間がかかっています。';
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