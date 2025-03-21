import { createDbWorker } from 'sql.js-httpvfs';

// 成功したDBWorker設定
const workerConfig = {
  from: 'inline',
  config: {
    serverMode: 'full', // 完全なファイルモード
    requestChunkSize: 4096,
    url: '/db/archimap.sqlite' // 完全なSQLiteファイル
  }
};

// DBWorkerのシングルトンインスタンス
let dbWorkerPromise = null;

/**
 * DBWorkerを初期化して返す
 * @returns {Promise<object>} DBWorkerインスタンス
 */
export const getDbWorker = async () => {
  if (!dbWorkerPromise) {
    console.log('DBWorker初期化を開始します...');
    try {
      // 最初の呼び出し時にのみDBWorkerを作成
      dbWorkerPromise = createDbWorker(
        [workerConfig],
        '/sqlite.worker.js', // ローカルのワーカーファイル
        '/sql-wasm.wasm'     // ローカルのWASMファイル
      );
      console.log('DBWorker初期化に成功しました');
    } catch (error) {
      console.error('DBWorker初期化エラー:', error);
      throw error;
    }
  }
  
  try {
    return (await dbWorkerPromise).db;
  } catch (error) {
    console.error('DBWorkerインスタンス取得エラー:', error);
    throw error;
  }
};

/**
 * SQLクエリを実行する
 * @param {string} query - SQLクエリ
 * @param {object} params - クエリパラメータ
 * @returns {Promise<Array>} クエリ結果
 */
export const executeQuery = async (query, params = {}) => {
  try {
    console.log(`SQLクエリを実行: ${query}`);
    const worker = await getDbWorker();
    const result = await worker.db.exec(query, params);
    console.log('SQLクエリ結果:', result);
    return result[0]?.values || [];
  } catch (error) {
    console.error('SQLクエリ実行エラー:', error);
    throw error;
  }
};

/**
 * 全ての建築作品を取得する
 * @param {number} page - ページ番号（1から開始）
 * @param {number} limit - 1ページあたりの件数
 * @param {string} search - 検索キーワード
 * @param {string} sort - 並び替え条件（デフォルトは年代の降順）
 * @returns {Promise<Array>} 建築作品のリスト
 */
export const getAllArchitectures = async (page = 1, limit = 10, search = '', sort = 'year_desc') => {
  const db = await getDbWorker();
  let offset = (page - 1) * limit;
  
  let whereClause = '';
  let params = [];
  
  // タグ検索対応 - tag:XXXの形式で検索された場合
  if (search.startsWith('tag:')) {
    const tagValue = search.substring(4).trim();
    // カンマ区切りで複数タグの場合
    if (tagValue.includes(',')) {
      const tags = tagValue.split(',').map(tag => tag.trim()).filter(tag => tag);
      const likeConditions = tags.map(() => `ZAR_TAG LIKE ?`).join(' OR ');
      whereClause = `WHERE (${likeConditions}) AND ZAR_TAG NOT LIKE '%の追加建築%'`;
      params = tags.map(tag => `%${tag}%`);
    } else {
      whereClause = `WHERE ZAR_TAG LIKE ? AND ZAR_TAG NOT LIKE '%の追加建築%'`;
      params = [`%${tagValue}%`];
    }
  }
  // 年での検索 - year:XXXの形式
  else if (search.startsWith('year:')) {
    const yearValue = search.substring(5).trim();
    whereClause = `WHERE ZAR_YEAR = ? AND ZAR_TAG NOT LIKE '%の追加建築%'`;
    params = [yearValue];
  }
  // 都道府県での検索 - prefecture:XXXの形式
  else if (search.startsWith('prefecture:')) {
    const prefectureValue = search.substring(11).trim();
    whereClause = `WHERE ZAR_PREFECTURE = ? AND ZAR_TAG NOT LIKE '%の追加建築%'`;
    params = [prefectureValue];
  }
  // カテゴリーでの検索 - category:XXXの形式
  else if (search.startsWith('category:')) {
    const categoryValue = search.substring(9).trim();
    const bigCategoryClause = `ZAR_BIGCATEGORY = ?`;
    const categoryClause = `ZAR_CATEGORY = ?`;
    whereClause = `WHERE (${bigCategoryClause} OR ${categoryClause}) AND ZAR_TAG NOT LIKE '%の追加建築%'`;
    params = [categoryValue, categoryValue];
  }
  // 建築家での検索 - architect:XXXの形式
  else if (search.startsWith('architect:')) {
    const architectValue = search.substring(10).trim();
    // カンマ区切りの場合に対応
    if (architectValue.includes(',')) {
      const architectNames = architectValue.split(',').map(name => name.trim());
      const likeConditions = architectNames.map(() => `ZAR_ARCHITECT LIKE ?`).join(' OR ');
      whereClause = `WHERE (${likeConditions}) AND ZAR_TAG NOT LIKE '%の追加建築%'`;
      params = architectNames.map(name => `%${name}%`);
    } else {
      whereClause = `WHERE ZAR_ARCHITECT LIKE ? AND ZAR_TAG NOT LIKE '%の追加建築%'`;
      params = [`%${architectValue}%`];
    }
  }
  // 通常検索
  else if (search) {
    whereClause = `WHERE (ZAR_TITLE LIKE ? OR ZAR_ADDRESS LIKE ? OR ZAR_PREFECTURE LIKE ? OR ZAR_ARCHITECT LIKE ?) AND ZAR_TAG NOT LIKE '%の追加建築%'`;
    params = [`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`];
  }
  else {
    whereClause = `WHERE ZAR_TAG NOT LIKE '%の追加建築%'`;
  }

  // 並び替え条件の設定
  let orderByClause = '';
  switch (sort) {
    case 'year_asc':
      orderByClause = 'ORDER BY ZAR_YEAR ASC';
      break;
    case 'name_asc':
      orderByClause = 'ORDER BY ZAR_TITLE ASC';
      break;
    case 'name_desc':
      orderByClause = 'ORDER BY ZAR_TITLE DESC';
      break;
    case 'architect_asc':
      orderByClause = 'ORDER BY ZAR_ARCHITECT ASC';
      break;
    case 'architect_desc':
      orderByClause = 'ORDER BY ZAR_ARCHITECT DESC';
      break;
    case 'year_desc':
    default:
      orderByClause = 'ORDER BY ZAR_YEAR DESC';
  }

  // トータルカウント取得
  const countQuery = `
    SELECT COUNT(*) as total
    FROM ZCDARCHITECTURE
    ${whereClause}
  `;
  
  try {
    const countResult = await db.exec(countQuery, params);
    if (!countResult || !countResult[0] || !countResult[0].values) {
      console.error('カウントクエリの結果が無効です:', countResult);
      return { items: [], total: 0, pages: 0 };
    }
    
    const total = countResult[0].values[0][0];
    
    // データ取得
    const query = `
      SELECT 
        Z_PK as id, 
        ZAR_TITLE as name, 
        ZAR_PREFECTURE as city, 
        ZAR_YEAR as completedYear,
        ZAR_ARCHITECT as architectName,
        ZAR_ADDRESS as location
      FROM ZCDARCHITECTURE
      ${whereClause}
      ${orderByClause}
      LIMIT ? OFFSET ?
    `;
    
    const results = await db.exec(query, [...params, limit, offset]);
    
    if (results && results[0]) {
      const items = results[0].values.map(row => {
        const columnMapping = results[0].columns;
        const item = {};
        
        // 各カラムの値をマッピング
        columnMapping.forEach((column, index) => {
          item[column] = row[index];
        });
        
        return item;
      });
      
      return {
        items,
        total,
        pages: Math.ceil(total / limit)
      };
    }
    
    return { items: [], total: 0, pages: 0 };
  } catch (error) {
    console.error('建築作品取得エラー:', error);
    return { items: [], total: 0, pages: 0 };
  }
};

/**
 * 建築作品の詳細を取得する
 * @param {number} id - 建築作品のID
 * @returns {Promise<object>} 建築作品の詳細
 */
export const getArchitectureById = async (id) => {
  try {
    const db = await getDbWorker();
    const query = `
      SELECT 
        ZCDARCHITECTURE.Z_PK as id,
        ZCDARCHITECTURE.ZAR_TITLE as name,
        ZCDARCHITECTURE.ZAR_ADDRESS as location,
        ZCDARCHITECTURE.ZAR_PREFECTURE as city,
        ZCDARCHITECTURE.ZAR_PREFECTURE as country,
        ZCDARCHITECTURE.ZAR_LATITUDE as latitude,
        ZCDARCHITECTURE.ZAR_LONGITUDE as longitude,
        ZCDARCHITECTURE.ZAR_YEAR as completedYear,
        ZCDARCHITECTURE.ZAR_DESCRIPTION as description,
        ZCDARCHITECTURE.ZAR_TAG as tag,
        ZCDARCHITECTURE.ZAR_SHINKENCHIKU_URL as shinkenchikuUrl,
        ZCDARCHITECTURE.ZAR_BIGCATEGORY as bigCategory,
        ZCDARCHITECTURE.ZAR_CATEGORY as category,
        ZCDARCHITECT.Z_PK as architectId,
        ZCDARCHITECT.ZAT_ARCHITECT as architectName
      FROM ZCDARCHITECTURE
      LEFT JOIN ZCDARCHITECT ON ZCDARCHITECTURE.ZAR_ARCHITECT = ZCDARCHITECT.ZAT_ARCHITECT
      WHERE ZCDARCHITECTURE.Z_PK = ?
    `;

    const results = await db.exec(query, [id]);
    if (!results || !results[0] || !results[0].values || results[0].values.length === 0) {
      return null;
    }

    const row = results[0].values[0];
    const columns = results[0].columns;
    const item = {};
    
    // 各カラムの値をマッピング
    columns.forEach((column, index) => {
      item[column] = row[index];
    });
    
    // タグから「の追加建築」を除外
    if (item.tag) {
      const tags = item.tag.split(',');
      const filteredTags = tags.filter(tag => !tag.includes('の追加建築'));
      item.tag = filteredTags.join(',');
    }
    
    // 建築家情報を構造化
    if (item.architectId && item.architectName) {
      item.architect = {
        id: item.architectId,
        name: item.architectName
      };
      
      // 個別のプロパティは削除
      delete item.architectId;
      delete item.architectName;
    } else {
      item.architect = { id: null, name: null };
    }
    
    return item;
  } catch (error) {
    console.error('建築詳細取得エラー:', error);
    return null;
  }
};

/**
 * 全ての建築家を取得する
 * @param {number} page - ページ番号（1から開始）
 * @param {number} limit - 1ページあたりの件数
 * @param {string} searchTerm - 検索キーワード
 * @param {Array} selectedTags - 選択されたタグのリスト
 * @param {string} sortBy - ソート対象カラム
 * @param {string} sortOrder - ソート順（asc/desc）
 * @param {string} nationality - 国籍フィルター
 * @param {string} category - カテゴリーフィルター
 * @param {string} school - 学校フィルター
 * @param {number} birthYearFrom - 生年範囲開始
 * @param {number} birthYearTo - 生年範囲終了
 * @param {number} deathYear - 没年フィルター
 * @returns {Promise<object>} 建築家のリスト、総数、ページ情報
 */
export const getAllArchitects = async (page = 1, limit = 10, searchTerm = '', selectedTags = [], sortBy = 'name', sortOrder = 'asc', nationality = '', category = '', school = '', birthYearFrom = 0, birthYearTo = 0, deathYear = 0) => {
  try {
    const db = await getDbWorker();
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        Z_PK as id,
        ZAT_ARCHITECT as name,
        ZAT_NATIONALITY as nationality,
        ZAT_BIRTHYEAR as birthYear,
        ZAT_DEATHYEAR as deathYear,
        ZAT_DESCRIPTION as bio,
        ZAT_OFFICE as office,
        ZAT_ARCHITECT_EN as nameEn,
        ZAT_PREFECTURE as prefecture,
        ZAT_WEBSITE as website,
        ZAT_CATEGORY as category,
        ZAT_SCHOOL as school
      FROM ZCDARCHITECT
      WHERE 1=1
    `;

    // 検索条件の設定
    const params = [];
    if (searchTerm) {
      query += ` AND (ZAT_ARCHITECT LIKE ? OR ZAT_OFFICE LIKE ? OR ZAT_ARCHITECT_EN LIKE ?)`;
      params.push(`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`);
    }

    // タグによる絞り込み（国籍、カテゴリー、学校など）
    if (selectedTags.length > 0) {
      for (const tag of selectedTags) {
        if (tag.startsWith('nationality:')) {
          const nationalityTag = tag.substring(12);
          if (!nationality) { // 既に直接のnationalityパラメータがある場合は上書きしない
            query += ` AND ZAT_NATIONALITY = ?`;
            params.push(nationalityTag);
          }
        } else if (tag.startsWith('born:')) {
          const decade = tag.substring(5).replace('s', '');
          if (birthYearFrom === 0 && birthYearTo === 0) {
            const startYear = parseInt(decade);
            const endYear = startYear + 9;
            query += ` AND ZAT_BIRTHYEAR >= ? AND ZAT_BIRTHYEAR <= ?`;
            params.push(startYear, endYear);
          }
        } else if (tag.startsWith('died:')) {
          const year = tag.substring(5);
          if (deathYear === 0) {
            query += ` AND ZAT_DEATHYEAR = ?`;
            params.push(parseInt(year));
          }
        } else if (tag.startsWith('category:')) {
          const categoryTag = tag.substring(9);
          if (!category) {
            query += ` AND ZAT_CATEGORY = ?`;
            params.push(categoryTag);
          }
        } else if (tag.startsWith('school:')) {
          const schoolTag = tag.substring(7);
          if (!school) {
            query += ` AND ZAT_SCHOOL = ?`;
            params.push(schoolTag);
          }
        }
      }
    }

    // 直接パラメータによる絞り込み
    if (nationality) {
      query += ` AND ZAT_NATIONALITY = ?`;
      params.push(nationality);
    }
    
    if (category) {
      query += ` AND ZAT_CATEGORY = ?`;
      params.push(category);
    }
    
    if (school) {
      query += ` AND ZAT_SCHOOL = ?`;
      params.push(school);
    }
    
    if (birthYearFrom > 0) {
      query += ` AND ZAT_BIRTHYEAR >= ?`;
      params.push(birthYearFrom);
    }
    
    if (birthYearTo > 0) {
      query += ` AND ZAT_BIRTHYEAR <= ?`;
      params.push(birthYearTo);
    }
    
    if (deathYear > 0) {
      query += ` AND ZAT_DEATHYEAR = ?`;
      params.push(deathYear);
    }

    // ソート順の設定
    let orderColumn = 'ZAT_ARCHITECT';
    if (sortBy === 'birthYear') {
      orderColumn = 'ZAT_BIRTHYEAR';
    } else if (sortBy === 'nationality') {
      orderColumn = 'ZAT_NATIONALITY';
    } else if (sortBy === 'office') {
      orderColumn = 'ZAT_OFFICE';
    }

    query += ` ORDER BY ${orderColumn} ${sortOrder === 'desc' ? 'DESC' : 'ASC'}`;

    // 総数のクエリ
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM ZCDARCHITECT 
      WHERE 1=1
      ${searchTerm ? ` AND (ZAT_ARCHITECT LIKE ? OR ZAT_OFFICE LIKE ? OR ZAT_ARCHITECT_EN LIKE ?)` : ''}
      ${nationality ? ` AND ZAT_NATIONALITY = ?` : ''}
      ${category ? ` AND ZAT_CATEGORY = ?` : ''}
      ${school ? ` AND ZAT_SCHOOL = ?` : ''}
      ${birthYearFrom > 0 ? ` AND ZAT_BIRTHYEAR >= ?` : ''}
      ${birthYearTo > 0 ? ` AND ZAT_BIRTHYEAR <= ?` : ''}
      ${deathYear > 0 ? ` AND ZAT_DEATHYEAR = ?` : ''}
    `;

    const countResult = await db.exec(countQuery, params);
    if (!countResult || !countResult[0] || !countResult[0].values) {
      console.error('カウントクエリの結果が無効です:', countResult);
      return { items: [], total: 0, page, totalPages: 0 };
    }
    
    const total = countResult[0].values[0][0];

    // ページネーション
    query += ` LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    // 建築家データ取得
    const results = await db.exec(query, params);
    
    if (results && results[0]) {
      const items = results[0].values.map(row => {
        const columnMapping = results[0].columns;
        const item = {};
        
        // 各カラムの値をマッピング
        columnMapping.forEach((column, index) => {
          item[column] = row[index];
        });
        
        return item;
      });
      
      return {
        items,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      };
    }
    
    return { items: [], total: 0, page, totalPages: 0 };
  } catch (error) {
    console.error('建築家取得エラー:', error);
    return { items: [], total: 0, page, totalPages: 0 };
  }
};

/**
 * 建築家の詳細を取得する
 * @param {number} id - 建築家のID
 * @returns {Promise<object>} 建築家の詳細
 */
export const getArchitectById = async (id) => {
  try {
    const db = await getDbWorker();
    
    // 建築家の基本情報を取得 - パラメータ化されたクエリを使用
    const architectQuery = `
      SELECT 
        Z_PK as id,
        ZAT_ARCHITECT as name,
        ZAT_NATIONALITY as nationality,
        ZAT_BIRTHYEAR as birthYear,
        ZAT_DEATHYEAR as deathYear,
        ZAT_DESCRIPTION as bio,
        ZAT_OFFICE as office,
        ZAT_ARCHITECT_EN as nameEn,
        ZAT_PREFECTURE as prefecture,
        ZAT_WEBSITE as website,
        ZAT_SCHOOL as school,
        ZAT_FACULTY as faculty,
        ZAT_SCHOOL_ABROAD as schoolAbroad,
        ZAT_TEACHER1 as teacher1,
        ZAT_TEACHER2 as teacher2,
        ZAT_TEACHER3 as teacher3,
        ZAT_CATEGORY as category
      FROM ZCDARCHITECT
      WHERE Z_PK = ?
    `;

    const architectResult = await db.exec(architectQuery, [id]);
    
    if (!architectResult || !architectResult[0] || !architectResult[0].values || architectResult[0].values.length === 0) {
      console.error('建築家データが見つかりません:', id);
      return null;
    }
    
    // 結果のマッピング
    const columnMapping = architectResult[0].columns;
    const rowData = architectResult[0].values[0];
    const architect = {};
    
    // カラム名と値をマッピング
    columnMapping.forEach((column, index) => {
      architect[column] = rowData[index];
    });
    
    // 建築家の作品を取得 - パラメータ化されたクエリを使用
    if (architect.name) {
      const worksQuery = `
        SELECT 
          Z_PK as id,
          ZAR_TITLE as name,
          ZAR_ADDRESS as location,
          ZAR_PREFECTURE as city,
          ZAR_YEAR as completedYear,
          ZAR_LATITUDE as latitude,
          ZAR_LONGITUDE as longitude,
          ZAR_TAG as tag
        FROM ZCDARCHITECTURE
        WHERE ZAR_ARCHITECT = ?
        ORDER BY ZAR_YEAR DESC
      `;
      
      const worksResult = await db.exec(worksQuery, [architect.name]);
      
      if (worksResult && worksResult[0] && worksResult[0].values) {
        const worksColumnMapping = worksResult[0].columns;
        
        architect.works = worksResult[0].values.map(row => {
          const work = {};
          worksColumnMapping.forEach((column, index) => {
            work[column] = row[index];
          });
          return work;
        });
      } else {
        architect.works = [];
      }
    } else {
      architect.works = [];
    }
    
    return architect;
  } catch (error) {
    console.error('建築家データ取得エラー:', error);
    throw new Error('建築家データの取得に失敗しました');
  }
};

/**
 * 地図に表示する建築作品を取得する
 * @returns {Promise<Array>} 位置情報を持つ建築作品のリスト
 */
export const getMapArchitectures = async () => {
  const query = `
    SELECT 
      ZCDARCHITECTURE.Z_PK as id,
      ZCDARCHITECTURE.ZAR_TITLE as name,
      ZCDARCHITECTURE.ZAR_ADDRESS as location,
      ZCDARCHITECTURE.ZAR_PREFECTURE as city,
      ZCDARCHITECTURE.ZAR_LATITUDE as latitude,
      ZCDARCHITECTURE.ZAR_LONGITUDE as longitude,
      ZCDARCHITECT.ZAT_ARCHITECT as architectName
    FROM ZCDARCHITECTURE
    LEFT JOIN ZCDARCHITECT ON ZCDARCHITECTURE.ZAR_ARCHITECT = ZCDARCHITECT.ZAT_ARCHITECT
    WHERE ZCDARCHITECTURE.ZAR_LATITUDE IS NOT NULL
    AND ZCDARCHITECTURE.ZAR_LONGITUDE IS NOT NULL
  `;

  const items = await executeQuery(query);
  
  return items.map(item => ({
    id: item[0],
    name: item[1],
    location: item[2],
    city: item[3],
    latitude: item[4],
    longitude: item[5],
    architectName: item[6]
  }));
};

/**
 * 全てのタグを取得する（年度情報を除外）
 * @returns {Promise<Array>} 年度を除いた一意のタグリスト
 */
export const getAllTags = async () => {
  try {
    const db = await getDbWorker();
    const query = `
      SELECT DISTINCT ZAR_TAG FROM ZCDARCHITECTURE 
      WHERE ZAR_TAG IS NOT NULL AND ZAR_TAG != ''
    `;
    
    const results = await db.exec(query);
    
    if (!results || !results[0] || !results[0].values) {
      return [];
    }
    
    // タグのフラット化とグループ化
    const baseTagsSet = new Set();
    const allTagsWithYears = [];
    
    results[0].values.forEach(row => {
      const tagsStr = row[0];
      if (tagsStr) {
        const tags = tagsStr.split(',');
        tags.forEach(tag => {
          const trimmedTag = tag.trim();
          if (trimmedTag && !trimmedTag.includes('の追加建築')) {
            // 年度情報を含むタグを収集
            allTagsWithYears.push(trimmedTag);
            
            // パターンを拡張：年度、月号、回次などを抽出
            // 1. 新建築YYYY年M月号 => 新建築
            // 2. XXX賞YYYY年 => XXX賞
            // 3. 第N回XXX賞 => XXX賞
            // 4. YYYY年度XXX賞 => XXX賞
            // 5. BCS賞(YYYY) => BCS賞
            let baseTag = trimmedTag;
            
            // 年月号パターン（新建築2014年7月号 -> 新建築）
            baseTag = baseTag.replace(/\d{4}年\d{1,2}月号?/, '').trim();
            
            // 年度パターン（村野藤吾賞2018年 -> 村野藤吾賞）
            baseTag = baseTag.replace(/\d{4}年度?/, '').trim();
            
            // 回次パターン（第10回JIA新人賞 -> JIA新人賞）
            baseTag = baseTag.replace(/第\d+回/, '').trim();
            
            // カッコ内年度パターン（BCS賞(2018) -> BCS賞）
            baseTag = baseTag.replace(/\(\d{4}\)/, '').trim();
            
            if (baseTag) {
              baseTagsSet.add(baseTag);
            } else {
              // 年度のみのタグまたはカテゴリー/年度のタグはそのまま
              baseTagsSet.add(trimmedTag);
            }
          }
        });
      }
    });
    
    return Array.from(baseTagsSet).sort();
  } catch (error) {
    console.error('タグ取得エラー:', error);
    return [];
  }
};

/**
 * 指定されたベースタグに対応する年度情報を取得する
 * @param {string} baseTag - 年度を除いたベースタグ
 * @returns {Promise<Array>} 該当するタグの年度リスト
 */
export const getYearsForTag = async (baseTag) => {
  try {
    const db = await getDbWorker();
    const query = `
      SELECT DISTINCT ZAR_TAG FROM ZCDARCHITECTURE 
      WHERE ZAR_TAG LIKE ? AND ZAR_TAG NOT LIKE '%の追加建築%'
    `;
    
    const results = await db.exec(query, [`%${baseTag}%`]);
    
    if (!results || !results[0] || !results[0].values) {
      return [];
    }
    
    const yearsSet = new Set();
    
    results[0].values.forEach(row => {
      const tagsStr = row[0];
      if (tagsStr) {
        const tags = tagsStr.split(',');
        tags.forEach(tag => {
          const trimmedTag = tag.trim();
          if (trimmedTag.includes(baseTag) && trimmedTag !== baseTag) {
            let suffix = '';
            
            // 年月号パターン
            const yearMonthMatch = trimmedTag.match(/(\d{4}年\d{1,2}月号?)/);
            if (yearMonthMatch) {
              suffix = yearMonthMatch[1];
            }
            // 年度パターン
            else if (trimmedTag.match(/\d{4}年度?/)) {
              suffix = trimmedTag.match(/(\d{4}年度?)/)[1];
            }
            // 回次パターン
            else if (trimmedTag.match(/第\d+回/)) {
              suffix = trimmedTag.match(/(第\d+回)/)[1];
            }
            // カッコ内年度パターン
            else if (trimmedTag.match(/\(\d{4}\)/)) {
              suffix = trimmedTag.match(/(\(\d{4}\))/)[1];
            }
            // その他の差分
            else {
              suffix = trimmedTag.replace(baseTag, '').trim();
            }
            
            if (suffix) {
              yearsSet.add(suffix);
            }
          }
        });
      }
    });
    
    // 年度情報を含むタグを整理して返す
    return Array.from(yearsSet).sort((a, b) => {
      // 年度情報を数値に変換して比較（新しい順）
      const yearA = a.match(/\d{4}/);
      const yearB = b.match(/\d{4}/);
      if (yearA && yearB) {
        return parseInt(yearB[0]) - parseInt(yearA[0]);
      }
      
      // 回次を数値に変換して比較（新しい順）
      const roundA = a.match(/第(\d+)回/);
      const roundB = b.match(/第(\d+)回/);
      if (roundA && roundB) {
        return parseInt(roundB[1]) - parseInt(roundA[1]);
      }
      
      return a.localeCompare(b);
    });
  } catch (error) {
    console.error('タグ年度取得エラー:', error);
    return [];
  }
};

/**
 * 建築家に関連するタグを取得する
 * @returns {Promise<Array>} ユニークなタグのリスト
 */
export const getArchitectTags = async () => {
  try {
    const tags = new Set();
    
    // 1. 国籍タグの取得
    const nationalityQuery = `SELECT DISTINCT ZAT_NATIONALITY FROM ZCDARCHITECT WHERE ZAT_NATIONALITY IS NOT NULL AND ZAT_NATIONALITY <> ''`;
    const nationalityResults = await queryDatabase(nationalityQuery);
    nationalityResults.forEach(row => {
      tags.add(`nationality:${row.ZAT_NATIONALITY}`);
    });
    
    // 2. カテゴリータグの取得
    const categoryQuery = `SELECT DISTINCT ZAT_CATEGORY FROM ZCDARCHITECT WHERE ZAT_CATEGORY IS NOT NULL AND ZAT_CATEGORY <> ''`;
    const categoryResults = await queryDatabase(categoryQuery);
    categoryResults.forEach(row => {
      tags.add(`category:${row.ZAT_CATEGORY}`);
    });
    
    // 3. 学校タグの取得
    const schoolQuery = `SELECT DISTINCT ZAT_SCHOOL FROM ZCDARCHITECT WHERE ZAT_SCHOOL IS NOT NULL AND ZAT_SCHOOL <> ''`;
    const schoolResults = await queryDatabase(schoolQuery);
    schoolResults.forEach(row => {
      tags.add(`school:${row.ZAT_SCHOOL}`);
    });
    
    // 4. 生年の10年単位のタグを生成
    const birthYearQuery = `SELECT DISTINCT ZAT_BIRTHYEAR FROM ZCDARCHITECT WHERE ZAT_BIRTHYEAR > 0`;
    const birthYearResults = await queryDatabase(birthYearQuery);
    const decades = new Set();
    birthYearResults.forEach(row => {
      const decade = Math.floor(row.ZAT_BIRTHYEAR / 10) * 10;
      decades.add(decade);
    });
    
    decades.forEach(decade => {
      tags.add(`born:${decade}s`);
    });
    
    // 5. 没年タグを生成
    const deathYearQuery = `SELECT DISTINCT ZAT_DEATHYEAR FROM ZCDARCHITECT WHERE ZAT_DEATHYEAR > 0`;
    const deathYearResults = await queryDatabase(deathYearQuery);
    deathYearResults.forEach(row => {
      tags.add(`died:${row.ZAT_DEATHYEAR}`);
    });
    
    return Array.from(tags).sort();
  } catch (error) {
    console.error('建築家タグ取得エラー:', error);
    return [];
  }
}; 