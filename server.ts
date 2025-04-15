import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import cors from 'cors';
import * as DbService from './src/services/DbService';

// Express アプリケーション設定
const app = express();
const PORT = process.env.PORT || 3000;

// メモリ使用状況をモニタリングする関数
const monitorMemory = () => {
  const memoryUsage = process.memoryUsage();
  console.log(`Memory usage: RSS=${Math.round(memoryUsage.rss / 1024 / 1024)}MB, Heap=${Math.round(memoryUsage.heapUsed / 1024 / 1024)}/${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`);
  
  // RSS が 400MB を超えたら明示的にガベージコレクションを試行
  if (memoryUsage.rss > 400 * 1024 * 1024 && global.gc) {
    console.log('High memory usage detected. Running garbage collection...');
    try {
      global.gc();
      console.log('Garbage collection completed.');
    } catch (e) {
      console.error('Failed to run garbage collection:', e);
    }
  }
};

// 定期的にメモリ使用状況をチェック
const memoryCheckInterval = setInterval(monitorMemory, 30000); // 30秒ごとにチェック

// ヘッダー送信エラーを防止するミドルウェア
app.use((req, res, next) => {
  const originalSend = res.send;
  res.send = function(...args) {
    if (res.headersSent) {
      console.warn('Headers already sent, preventing duplicate send');
      return this;
    }
    return originalSend.apply(this, args);
  };
  next();
});

// リクエスト処理のメモリ最適化ミドルウェア
app.use((req: Request, res: Response, next: NextFunction) => {
  // レスポンス送信後のクリーンアップ
  res.on('finish', () => {
    // 大きなレスポンスデータの参照を解放
    if ((req as any).largeData) {
      (req as any).largeData = null;
    }
    
    // 現在のリクエスト/レスポンスでヒープが増加した場合はGCを提案
    if (process.memoryUsage().heapUsed > 300 * 1024 * 1024 && global.gc) {
      try {
        global.gc();
      } catch (e) {
        // GCの失敗は無視する
      }
    }
  });
  
  next();
});

// CSRFトークン保護を回避するミドルウェア（開発環境用）
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// ミドルウェア
app.use(cors());
app.use(express.json());

// APIルート定義
const apiRouter = express.Router();

// メモリ使用量の多いルートを最適化するヘルパー関数
const optimizeQuery = async <T>(
  req: Request,
  dataFetcher: () => Promise<T>,
): Promise<T> => {
  try {
    // クエリ前のメモリ使用量をチェック
    const memBefore = process.memoryUsage().heapUsed;
    
    // データ取得を実行
    const result = await dataFetcher();
    
    // クエリ後のメモリ使用量をチェック
    const memAfter = process.memoryUsage().heapUsed;
    const memDiff = (memAfter - memBefore) / 1024 / 1024;
    
    // メモリ使用量が著しく増加した場合はログに記録
    if (memDiff > 50) { // 50MB以上増加
      console.warn(`High memory increase (${memDiff.toFixed(2)}MB) detected for ${req.path}`);
      
      // ガベージコレクションを提案
      if (global.gc) {
        try {
          global.gc();
        } catch (e) {
          // GCの失敗は無視
        }
      }
    }
    
    return result;
  } catch (error) {
    throw error;
  }
};

// 建築作品の取得（ページネーション付き）
apiRouter.get('/architecture', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 12;
    const searchTerm = req.query.searchTerm as string || '';
    const selectedTags = (req.query.tags as string || '').split(',').filter(tag => tag);
    const sortBy = req.query.sortBy as string || 'name';
    const sortOrder = req.query.sortOrder as string || 'asc';
    const architect = req.query.architect as string || '';
    const location = req.query.location as string || '';
    const yearFrom = parseInt(req.query.yearFrom as string) || 0;
    const yearTo = parseInt(req.query.yearTo as string) || 0;

    const result = await optimizeQuery(req, () => 
      DbService.getAllArchitectures(
        page,
        limit,
        searchTerm,
        sortBy
      )
    );

    res.json(result);
  } catch (error) {
    console.error('Error getting architecture:', error);
    res.status(500).json({ error: 'Failed to fetch architecture list' });
  }
});

// 建築作品の詳細取得
apiRouter.get('/architecture/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid ID parameter' });
    }

    const architecture = await optimizeQuery(req, () => DbService.getArchitectureById(id));
    if (!architecture) {
      return res.status(404).json({ error: 'Architecture not found' });
    }

    res.json(architecture);
  } catch (error) {
    console.error('Error getting architecture details:', error);
    res.status(500).json({ error: 'Failed to fetch architecture details' });
  }
});

// 建築作品のタグ取得
apiRouter.get('/architecture-tags', async (req: Request, res: Response) => {
  try {
    const tags = await optimizeQuery(req, () => DbService.getAllTags());
    res.json(tags);
  } catch (error) {
    console.error('Error getting architecture tags:', error);
    res.status(500).json({ error: 'Failed to fetch architecture tags' });
  }
});

// 建築家の詳細取得
apiRouter.get('/architects/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const architect = await optimizeQuery(req, () => DbService.getArchitectById(id));
    
    if (!architect) {
      return res.status(404).json({ error: 'Architect not found' });
    }
    
    res.json(architect);
  } catch (error) {
    console.error('Error fetching architect details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /architects - 建築家の一覧を取得
apiRouter.get('/architects', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 12;
    const searchTerm = req.query.search as string || '';
    const selectedTags = req.query.tags ? (req.query.tags as string).split(',') : [];
    const sortBy = req.query.sortBy as string || 'name';
    const sortOrder = req.query.sortOrder as string || 'asc';
    
    // 新しい検索パラメータ
    const nationality = req.query.nationality as string || '';
    const category = req.query.category as string || '';
    const school = req.query.school as string || '';
    const birthYearFrom = parseInt(req.query.birthyear_from as string) || 0;
    const birthYearTo = parseInt(req.query.birthyear_to as string) || 0;
    const deathYear = parseInt(req.query.deathyear as string) || 0;
    
    const result = await optimizeQuery(req, () => 
      DbService.getAllArchitects(
        page, 
        limit, 
        searchTerm, 
        selectedTags, 
        sortBy, 
        sortOrder,
        nationality,
        category,
        school,
        birthYearFrom,
        birthYearTo,
        deathYear
      )
    );
    res.json(result);
  } catch (error) {
    console.error('Error fetching architects:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 建築家のタグ取得
apiRouter.get('/architect-tags', async (req: Request, res: Response) => {
  try {
    const tags = await optimizeQuery(req, () => DbService.getArchitectTags());
    res.json(tags);
  } catch (error) {
    console.error('Error fetching architect tags:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 建築家のフィルタ値取得（この設定は /api/architects/:id と競合するので /filter/ を先に明示）
apiRouter.get('/architect-filter-values/:category', async (req: Request, res: Response) => {
  try {
    const category = req.params.category;
    console.log(`フィルタ値取得リクエスト受信: カテゴリ=${category}`);
    
    // 独自にクエリを実行する
    const query = `
      SELECT DISTINCT ZAR_${category.toUpperCase()} as value 
      FROM ZCDARCHITECT 
      WHERE ZAR_${category.toUpperCase()} != ''
    `;
    
    const values = await optimizeQuery(req, () => DbService.queryDatabase(query));
    
    // 安全に型チェックを行う
    const filterValues = Array.isArray(values) ? values : [];
    console.log(`フィルタ値取得成功: カテゴリ=${category}, 件数=${filterValues.length}`);
    console.log(`取得したフィルタ値の一部:`, filterValues.slice(0, 5));
    
    res.json(values);
  } catch (error) {
    console.error(`Error fetching filter values for ${req.params.category}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// APIルートをマウント
app.use('/api', apiRouter);

// 静的ファイルの提供（APIルートの後に配置）
app.use(express.static(path.join(__dirname, '../dist')));

// サーバー起動（先に定義しておく）
const server = app.listen(PORT, () => {
  console.log(`サーバーが起動しました: http://localhost:${PORT}`);
  console.log(`メモリ制限を回避するための最適化が有効になっています`);
  monitorMemory(); // 初回のメモリ使用状況をログに記録
});

// アプリケーション終了時にデータベース接続を閉じる
process.on('SIGINT', () => {
  clearInterval(memoryCheckInterval);
  DbService.closeDatabase();
  console.log('データベース接続を閉じました');
  server.close(() => {
    console.log('サーバーを停止しました');
    process.exit(0);
  });
});

// フロントエンドのルーティング（すべてのAPIルートの後に配置する）
app.get('*', (req: Request, res: Response) => {
  console.log(`フロントエンドルートへのアクセス: ${req.url}`);
  // SPA向けのファイル送信（headersSentをチェック）
  if (!res.headersSent) {
    res.sendFile(path.join(__dirname, '../dist', 'index.html'));
  }
}); 