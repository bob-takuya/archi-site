import { getResultsArray, getSingleResult } from './ClientDatabaseService';
import type { Architecture, ArchitectureResponse, Tag } from '../../types/architecture';

/**
 * IDによる建築作品の取得
 * @param id 建築作品ID
 * @returns 建築作品情報
 */
export const getArchitectureById = async (id: number): Promise<Architecture | undefined> => {
  return getSingleResult<Architecture>(
    `SELECT * FROM ZCDARCHITECTURE WHERE Z_PK = ?`,
    [id]
  );
};

/**
 * 建築家による建築作品一覧の取得
 * @param architectId 建築家ID
 * @returns 建築作品一覧
 */
export const getArchitecturesByArchitect = async (architectId: number): Promise<Architecture[]> => {
  return getResultsArray<Architecture>(
    `SELECT * FROM ZCDARCHITECTURE 
     WHERE ZAR_ARCHITECT_NUM = ? 
     ORDER BY ZAR_YEAR DESC`,
    [architectId]
  );
};

/**
 * 建築作品一覧の取得（ページング付き）
 * @param page ページ番号（1から開始）
 * @param limit 1ページあたりの件数
 * @param searchTerm 検索キーワード（オプション）
 * @param sortBy ソート項目（オプション）
 * @param sortOrder ソート順（オプション）
 * @param options その他のフィルターオプション
 * @returns 建築作品一覧と総件数
 */
export const getAllArchitectures = async (
  page: number = 1,
  limit: number = 12,
  searchTerm: string = '',
  sortBy: string = 'ZAR_TITLE',
  sortOrder: string = 'asc',
  options: {
    tags?: string[];
    architect?: string;
    location?: string;
    prefecture?: string;
    yearFrom?: number;
    yearTo?: number;
  } = {}
): Promise<ArchitectureResponse> => {
  const offset = (page - 1) * limit;
  
  // 検索条件の構築
  let whereClause = '1=1';
  const params: any[] = [];
  
  // キーワード検索
  if (searchTerm) {
    whereClause += ' AND (ZAR_TITLE LIKE ? OR ZAR_ADDRESS LIKE ? OR ZAR_DESCRIPTION LIKE ? OR ZAR_ARCHITECT LIKE ?)';
    params.push(`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`);
  }
  
  // その他のフィルター条件
  if (options.architect) {
    whereClause += ' AND (ZAR_ARCHITECT LIKE ? OR ZAR_ARCHITECT_ENG LIKE ?)';
    params.push(`%${options.architect}%`, `%${options.architect}%`);
  }
  
  if (options.location) {
    whereClause += ' AND ZAR_ADDRESS LIKE ?';
    params.push(`%${options.location}%`);
  }
  
  if (options.prefecture) {
    whereClause += ' AND ZAR_PREFECTURE = ?';
    params.push(options.prefecture);
  }
  
  if (options.yearFrom) {
    whereClause += ' AND ZAR_YEAR >= ?';
    params.push(options.yearFrom);
  }
  
  if (options.yearTo) {
    whereClause += ' AND ZAR_YEAR <= ?';
    params.push(options.yearTo);
  }
  
  // Basic query without complex joins for now
  if (options.tags && options.tags.length > 0) {
    // For now, use tag column directly since we don't have separate tag tables
    whereClause += ' AND ZAR_TAG LIKE ?';
    params.push(`%${options.tags.join('%')}%`);
  }
  
  // 総件数のクエリ
  const countQuery = `
    SELECT COUNT(*) as total
    FROM ZCDARCHITECTURE
    WHERE ${whereClause}
  `;
  
  // データ取得クエリ
  const dataQuery = `
    SELECT *
    FROM ZCDARCHITECTURE
    WHERE ${whereClause}
    ORDER BY ${sortBy} ${sortOrder === 'desc' ? 'DESC' : 'ASC'}
    LIMIT ? OFFSET ?
  `;
  
  // パラメータにLIMITとOFFSETを追加
  const dataParams = [...params, limit, offset];
  
  try {
    // 総件数取得
    const countResult = await getSingleResult<{ total: number }>(countQuery, params);
    const total = countResult?.total || 0;
    
    // データ取得
    const architectures = await getResultsArray<Architecture>(dataQuery, dataParams);
    
    return {
      results: architectures,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  } catch (error) {
    console.error('建築作品データ取得エラー:', error);
    throw error;
  }
};

/**
 * 建築作品タグの取得
 * @returns タグ一覧
 */
export const getAllTags = async (): Promise<Tag[]> => {
  return getResultsArray<Tag>(`
    SELECT TAG_ID, TAG_NAME, COUNT(ARCHITECTURE_ID) as TAG_COUNT
    FROM ZCDTAG
    LEFT JOIN ZCDARCHITECTURE_TAG ON ZCDTAG.TAG_ID = ZCDARCHITECTURE_TAG.TAG_ID
    GROUP BY ZCDTAG.TAG_ID, ZCDTAG.TAG_NAME
    ORDER BY TAG_COUNT DESC, TAG_NAME
  `);
};

/**
 * 都道府県別の建築作品数の取得
 * @returns 都道府県と建築作品数の一覧
 */
export const getPrefectureCounts = async (): Promise<{ prefecture: string; count: number }[]> => {
  return getResultsArray<{ prefecture: string; count: number }>(`
    SELECT ZAR_PREFECTURE as prefecture, COUNT(*) as count
    FROM ZCDARCHITECTURE
    WHERE ZAR_PREFECTURE IS NOT NULL AND ZAR_PREFECTURE != ''
    GROUP BY ZAR_PREFECTURE
    ORDER BY count DESC
  `);
};

/**
 * 地図表示用の建築作品データ取得
 * @param bounds 地図の表示範囲（緯度・経度）
 * @param filters フィルター条件
 * @returns 地図表示用の建築作品一覧
 */
export const getArchitectureForMap = async (
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  },
  filters: {
    tags?: string[];
    architect?: string;
    yearFrom?: number;
    yearTo?: number;
    searchTerm?: string;
  } = {}
): Promise<Architecture[]> => {
  // 検索条件の構築
  let whereClause = `
    ZAR_LATITUDE BETWEEN ? AND ?
    AND ZAR_LONGITUDE BETWEEN ? AND ?
    AND ZAR_LATITUDE IS NOT NULL
    AND ZAR_LONGITUDE IS NOT NULL
  `;
  
  const params: any[] = [
    bounds.south,
    bounds.north,
    bounds.west,
    bounds.east
  ];
  
  // その他のフィルター条件
  if (filters.searchTerm) {
    whereClause += ' AND (ZAR_TITLE LIKE ? OR ZAR_ADDRESS LIKE ? OR ZAR_ARCHITECT LIKE ?)';
    params.push(
      `%${filters.searchTerm}%`,
      `%${filters.searchTerm}%`,
      `%${filters.searchTerm}%`
    );
  }
  
  if (filters.architect) {
    whereClause += ' AND (ZAR_ARCHITECT LIKE ? OR ZAR_ARCHITECT_ENG LIKE ?)';
    params.push(
      `%${filters.architect}%`,
      `%${filters.architect}%`
    );
  }
  
  if (filters.yearFrom) {
    whereClause += ' AND ZAR_YEAR >= ?';
    params.push(filters.yearFrom);
  }
  
  if (filters.yearTo) {
    whereClause += ' AND ZAR_YEAR <= ?';
    params.push(filters.yearTo);
  }
  
  // Simplified tag filtering
  if (filters.tags && filters.tags.length > 0) {
    whereClause += ' AND ZAR_TAG LIKE ?';
    params.push(`%${filters.tags.join('%')}%`);
  }
  
  // 結果を最大500件に制限（パフォーマンス対策）
  const query = `
    SELECT *
    FROM ZCDARCHITECTURE
    WHERE ${whereClause}
    LIMIT 500
  `;
  
  return getResultsArray<Architecture>(query, params);
};