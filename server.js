const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// データベースの接続
const db = new sqlite3.Database('./Archimap_database.sqlite', (err) => {
  if (err) {
    console.error('データベース接続エラー:', err.message);
  } else {
    console.log('データベースに接続しました');
  }
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

// 建築作品の取得（ページネーション付き）
app.get('/api/architecture', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;
  const searchTerm = req.query.search || '';
  
  let query = `
    SELECT 
      Z_PK as id, 
      ZAR_TITLE as title, 
      ZAR_TITLE_ENG as title_eng,
      ZAR_ARCHITECT as architect,
      ZAR_ARCHITECT_ENG as architect_eng,
      ZAR_YEAR as year,
      ZAR_PREFECTURE as prefecture,
      ZAR_CATEGORY as category,
      ZAR_ADDRESS as address,
      ZAR_LATITUDE as latitude,
      ZAR_LONGITUDE as longitude
    FROM ZCDARCHITECTURE
  `;
  
  let countQuery = `SELECT COUNT(*) as total FROM ZCDARCHITECTURE`;
  
  if (searchTerm) {
    const searchCondition = `
      (ZAR_TITLE LIKE ? OR 
       ZAR_TITLE_ENG LIKE ? OR 
       ZAR_ARCHITECT LIKE ? OR 
       ZAR_ARCHITECT_ENG LIKE ? OR 
       ZAR_ADDRESS LIKE ? OR 
       ZAR_PREFECTURE LIKE ?)
    `;
    query += ` WHERE ${searchCondition}`;
    countQuery += ` WHERE ${searchCondition}`;
  }
  
  query += ` ORDER BY ZAR_YEAR DESC LIMIT ? OFFSET ?`;
  
  const searchParams = searchTerm 
    ? [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`]
    : [];
  
  db.get(countQuery, searchParams, (err, countRow) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    const params = [...searchParams, limit, offset];
    
    db.all(query, params, (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      res.json({
        total: countRow.total,
        page: page,
        limit: limit,
        totalPages: Math.ceil(countRow.total / limit),
        data: rows
      });
    });
  });
});

// 建築作品の詳細取得
app.get('/api/architecture/:id', (req, res) => {
  const id = req.params.id;
  
  const query = `
    SELECT * FROM ZCDARCHITECTURE
    WHERE Z_PK = ?
  `;
  
  db.get(query, [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!row) {
      return res.status(404).json({ error: '建築作品が見つかりません' });
    }
    
    res.json(row);
  });
});

// 建築家の取得（ページネーション付き）
app.get('/api/architects', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;
  const searchTerm = req.query.search || '';
  
  let query = `
    SELECT 
      Z_PK as id, 
      ZAT_ARCHITECT as name, 
      ZAT_ARCHITECT_EN as name_en,
      ZAT_OFFICE as office,
      ZAT_PREFECTURE as prefecture,
      ZAT_BIRTHYEAR as birth_year
    FROM ZCDARCHITECT
  `;
  
  let countQuery = `SELECT COUNT(*) as total FROM ZCDARCHITECT`;
  
  if (searchTerm) {
    const searchCondition = `
      (ZAT_ARCHITECT LIKE ? OR 
       ZAT_ARCHITECT_EN LIKE ? OR 
       ZAT_OFFICE LIKE ? OR 
       ZAT_PREFECTURE LIKE ?)
    `;
    query += ` WHERE ${searchCondition}`;
    countQuery += ` WHERE ${searchCondition}`;
  }
  
  query += ` ORDER BY ZAT_ARCHITECT LIMIT ? OFFSET ?`;
  
  const searchParams = searchTerm 
    ? [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`]
    : [];
  
  db.get(countQuery, searchParams, (err, countRow) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    const params = [...searchParams, limit, offset];
    
    db.all(query, params, (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      res.json({
        total: countRow.total,
        page: page,
        limit: limit,
        totalPages: Math.ceil(countRow.total / limit),
        data: rows
      });
    });
  });
});

// 建築家の詳細取得
app.get('/api/architects/:id', (req, res) => {
  const id = req.params.id;
  
  const query = `
    SELECT * FROM ZCDARCHITECT
    WHERE Z_PK = ?
  `;
  
  db.get(query, [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!row) {
      return res.status(404).json({ error: '建築家が見つかりません' });
    }
    
    // 建築家の作品も取得
    const worksQuery = `
      SELECT 
        Z_PK as id, 
        ZAR_TITLE as title, 
        ZAR_TITLE_ENG as title_eng,
        ZAR_YEAR as year,
        ZAR_PREFECTURE as prefecture,
        ZAR_CATEGORY as category
      FROM ZCDARCHITECTURE
      WHERE ZAR_ARCHITECT = ? OR ZAR_ARCHITECT1 = ? OR ZAR_ARCHITECT2 = ? OR ZAR_ARCHITECT3 = ? OR ZAR_ARCHITECT4 = ?
      ORDER BY ZAR_YEAR DESC
    `;
    
    db.all(worksQuery, [row.ZAT_ARCHITECT, row.ZAT_ARCHITECT, row.ZAT_ARCHITECT, row.ZAT_ARCHITECT, row.ZAT_ARCHITECT], (err, works) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      res.json({
        ...row,
        works: works
      });
    });
  });
});

// カテゴリー一覧の取得
app.get('/api/categories', (req, res) => {
  const query = `
    SELECT DISTINCT ZAR_CATEGORY as category
    FROM ZCDARCHITECTURE
    WHERE ZAR_CATEGORY IS NOT NULL AND ZAR_CATEGORY != ''
    ORDER BY ZAR_CATEGORY
  `;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    res.json(rows.map(row => row.category));
  });
});

// 都道府県一覧の取得
app.get('/api/prefectures', (req, res) => {
  const query = `
    SELECT DISTINCT ZAR_PREFECTURE as prefecture
    FROM ZCDARCHITECTURE
    WHERE ZAR_PREFECTURE IS NOT NULL AND ZAR_PREFECTURE != ''
    ORDER BY ZAR_PREFECTURE
  `;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    res.json(rows.map(row => row.prefecture));
  });
});

// フィルター付き建築作品の取得
app.get('/api/filter', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;
  
  const prefecture = req.query.prefecture;
  const category = req.query.category;
  const yearFrom = req.query.yearFrom;
  const yearTo = req.query.yearTo;
  const architect = req.query.architect;
  
  let query = `
    SELECT 
      Z_PK as id, 
      ZAR_TITLE as title, 
      ZAR_TITLE_ENG as title_eng,
      ZAR_ARCHITECT as architect,
      ZAR_ARCHITECT_ENG as architect_eng,
      ZAR_YEAR as year,
      ZAR_PREFECTURE as prefecture,
      ZAR_CATEGORY as category,
      ZAR_ADDRESS as address,
      ZAR_LATITUDE as latitude,
      ZAR_LONGITUDE as longitude
    FROM ZCDARCHITECTURE
    WHERE 1=1
  `;
  
  let countQuery = `SELECT COUNT(*) as total FROM ZCDARCHITECTURE WHERE 1=1`;
  
  const params = [];
  
  if (prefecture) {
    query += ` AND ZAR_PREFECTURE = ?`;
    countQuery += ` AND ZAR_PREFECTURE = ?`;
    params.push(prefecture);
  }
  
  if (category) {
    query += ` AND ZAR_CATEGORY = ?`;
    countQuery += ` AND ZAR_CATEGORY = ?`;
    params.push(category);
  }
  
  if (yearFrom) {
    query += ` AND ZAR_YEAR >= ?`;
    countQuery += ` AND ZAR_YEAR >= ?`;
    params.push(yearFrom);
  }
  
  if (yearTo) {
    query += ` AND ZAR_YEAR <= ?`;
    countQuery += ` AND ZAR_YEAR <= ?`;
    params.push(yearTo);
  }
  
  if (architect) {
    query += ` AND (ZAR_ARCHITECT LIKE ? OR ZAR_ARCHITECT1 LIKE ? OR ZAR_ARCHITECT2 LIKE ? OR ZAR_ARCHITECT3 LIKE ? OR ZAR_ARCHITECT4 LIKE ?)`;
    countQuery += ` AND (ZAR_ARCHITECT LIKE ? OR ZAR_ARCHITECT1 LIKE ? OR ZAR_ARCHITECT2 LIKE ? OR ZAR_ARCHITECT3 LIKE ? OR ZAR_ARCHITECT4 LIKE ?)`;
    params.push(`%${architect}%`, `%${architect}%`, `%${architect}%`, `%${architect}%`, `%${architect}%`);
  }
  
  query += ` ORDER BY ZAR_YEAR DESC LIMIT ? OFFSET ?`;
  
  db.get(countQuery, params, (err, countRow) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    const queryParams = [...params, limit, offset];
    
    db.all(query, queryParams, (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      res.json({
        total: countRow.total,
        page: page,
        limit: limit,
        totalPages: Math.ceil(countRow.total / limit),
        data: rows
      });
    });
  });
});

// フロントエンドのルーティング
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// サーバー起動
app.listen(PORT, () => {
  console.log(`サーバーが起動しました: http://localhost:${PORT}`);
});

// アプリケーション終了時にデータベース接続を閉じる
process.on('SIGINT', () => {
  db.close(() => {
    console.log('データベース接続を閉じました');
    process.exit(0);
  });
}); 