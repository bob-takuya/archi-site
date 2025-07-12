/**
 * Architect database service - FIXED VERSION
 * Client-side implementation using SQL.js and sql.js-httpvfs
 */

import { getResultsArray, getSingleResult } from './ClientDatabaseService';
import type { Architect, ArchitectsResponse, Tag } from '../types/architect';

/**
 * IDによる建築家の取得
 * @param id 建築家ID
 * @returns 建築家情報
 */
export const getArchitectById = async (id: number): Promise<Architect | undefined> => {
  return getSingleResult<Architect>(
    `SELECT * FROM ZCDARCHITECT WHERE ZAR_ID = ?`,
    [id]
  );
};

/**
 * 建築家一覧の取得（ページング付き）- FIXED VERSION
 * @param page ページ番号（1から開始）
 * @param limit 1ページあたりの件数
 * @param searchTerm 検索キーワード（オプション）
 * @param tags タグフィルター（オプション）
 * @param sortBy ソート項目（オプション）
 * @param sortOrder ソート順（オプション）
 * @param options その他のフィルターオプション
 * @returns 建築家一覧と総件数
 */
export const getAllArchitects = async (
  page: number = 1,
  limit: number = 12,
  searchTerm: string = '',
  tags: string[] = [],
  sortBy: string = 'ZAR_NAME',
  sortOrder: string = 'asc',
  options: {
    nationality?: string;
    category?: string;
    school?: string;
    birthYearFrom?: number;
    birthYearTo?: number;
    deathYear?: number;
  } = {}
): Promise<ArchitectsResponse> => {
  const offset = (page - 1) * limit;
  
  console.log('getAllArchitects called with:', {
    page, limit, searchTerm, tags, sortBy, sortOrder, options
  });
  
  // 検索条件の構築
  let whereClause = '1=1';
  const params: any[] = [];
  
  // キーワード検索
  if (searchTerm) {
    whereClause += ' AND (ZAR_NAME LIKE ? OR ZAR_KANA LIKE ? OR ZAR_NAMEENG LIKE ? OR ZAR_NATIONALITY LIKE ? OR ZAR_CATEGORY LIKE ?)';
    const searchPattern = `%${searchTerm}%`;
    params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
  }
  
  // その他のフィルター条件
  if (options.nationality) {
    whereClause += ' AND ZAR_NATIONALITY = ?';
    params.push(options.nationality);
  }
  
  if (options.category) {
    whereClause += ' AND ZAR_CATEGORY = ?';
    params.push(options.category);
  }
  
  if (options.school) {
    whereClause += ' AND ZAR_SCHOOL = ?';
    params.push(options.school);
  }
  
  if (options.birthYearFrom) {
    whereClause += ' AND ZAR_BIRTHYEAR >= ?';
    params.push(options.birthYearFrom);
  }
  
  if (options.birthYearTo) {
    whereClause += ' AND ZAR_BIRTHYEAR <= ?';
    params.push(options.birthYearTo);
  }
  
  if (options.deathYear) {
    whereClause += ' AND ZAR_DEATHYEAR = ?';
    params.push(options.deathYear);
  }
  
  // タグによるフィルタリング（INNER JOIN使用）
  let joinClause = '';
  if (tags && tags.length > 0) {
    joinClause = `
      INNER JOIN ZCDARCHITECT_TAG ON ZCDARCHITECT.ZAR_ID = ZCDARCHITECT_TAG.ARCHITECT_ID
      INNER JOIN ZCDTAG ON ZCDARCHITECT_TAG.TAG_ID = ZCDTAG.TAG_ID
    `;
    whereClause += ' AND ZCDTAG.TAG_NAME IN (';
    whereClause += tags.map(() => '?').join(',');
    whereClause += ')';
    params.push(...tags);
  }
  
  // 総件数のクエリ
  const countQuery = `
    SELECT COUNT(DISTINCT ZCDARCHITECT.ZAR_ID) as total
    FROM ZCDARCHITECT
    ${joinClause}
    WHERE ${whereClause}
  `;
  
  // Valid sort columns mapping
  const validSortColumns: Record<string, string> = {
    'name': 'ZAR_NAME',
    'ZAR_NAME': 'ZAR_NAME',
    'birthYear': 'ZAR_BIRTHYEAR',
    'ZAR_BIRTHYEAR': 'ZAR_BIRTHYEAR',
    'nationality': 'ZAR_NATIONALITY',
    'ZAR_NATIONALITY': 'ZAR_NATIONALITY'
  };
  
  // Ensure valid sort column
  const actualSortBy = validSortColumns[sortBy] || 'ZAR_NAME';
  const actualSortOrder = sortOrder === 'desc' ? 'DESC' : 'ASC';
  
  // データ取得クエリ
  const dataQuery = `
    SELECT DISTINCT ZCDARCHITECT.*
    FROM ZCDARCHITECT
    ${joinClause}
    WHERE ${whereClause}
    ORDER BY ${actualSortBy} ${actualSortOrder}
    LIMIT ? OFFSET ?
  `;
  
  // パラメータにLIMITとOFFSETを追加
  const dataParams = [...params, limit, offset];
  
  console.log('Executing queries:', {
    countQuery,
    dataQuery,
    params,
    dataParams
  });
  
  try {
    // 総件数取得
    const countResult = await getSingleResult<{ total: number }>(countQuery, params);
    const total = countResult?.total || 0;
    
    console.log('Count result:', countResult);
    
    // データ取得
    const architects = await getResultsArray<Architect>(dataQuery, dataParams);
    
    console.log(`Retrieved ${architects.length} architects out of ${total} total`);
    
    // Fixed: Return with 'results' property as expected by ArchitectsResponse interface
    const response: ArchitectsResponse = {
      results: architects,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
    
    console.log('Final response:', response);
    
    return response;
  } catch (error) {
    console.error('建築家データ取得エラー:', error);
    
    // Return empty response on error instead of throwing
    return {
      results: [],
      total: 0,
      page,
      limit,
      totalPages: 0
    };
  }
};

/**
 * 建築家タグの取得
 * @returns タグ一覧
 */
export const getArchitectTags = async (): Promise<Tag[]> => {
  try {
    return await getResultsArray<Tag>(`
      SELECT TAG_ID, TAG_NAME, COUNT(ARCHITECT_ID) as TAG_COUNT
      FROM ZCDTAG
      LEFT JOIN ZCDARCHITECT_TAG ON ZCDTAG.TAG_ID = ZCDARCHITECT_TAG.TAG_ID
      GROUP BY ZCDTAG.TAG_ID, ZCDTAG.TAG_NAME
      ORDER BY TAG_COUNT DESC, TAG_NAME
    `);
  } catch (error) {
    console.error('タグ取得エラー:', error);
    return [];
  }
};

/**
 * Get distinct values for a specific architect field
 * @param field The database field to get distinct values for
 * @returns Array of distinct values
 */
export const getDistinctArchitectValues = async (field: string): Promise<string[]> => {
  // Validate field name to prevent SQL injection
  const validFields = ['ZAR_NATIONALITY', 'ZAR_CATEGORY', 'ZAR_SCHOOL', 'ZAR_BIRTHYEAR', 'ZAR_DEATHYEAR'];
  
  if (!validFields.includes(field)) {
    console.error('Invalid field name:', field);
    return [];
  }
  
  try {
    let query = '';
    if (field === 'ZAR_BIRTHYEAR' || field === 'ZAR_DEATHYEAR') {
      query = `SELECT DISTINCT ${field} as value FROM ZCDARCHITECT WHERE ${field} > 0 ORDER BY ${field} DESC`;
    } else {
      query = `SELECT DISTINCT ${field} as value FROM ZCDARCHITECT WHERE ${field} != '' ORDER BY ${field}`;
    }
    
    const results = await getResultsArray<{ value: string | number }>(query);
    return results.map(item => String(item.value)).filter(Boolean);
  } catch (error) {
    console.error(`Error getting distinct values for ${field}:`, error);
    return [];
  }
};