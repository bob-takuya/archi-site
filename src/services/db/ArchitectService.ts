/**
 * Architect database service
 * Client-side implementation using SQL.js and sql.js-httpvfs
 */

import { getResultsArray, getSingleResult } from './ClientDatabaseService';
import type { Architect, ArchitectsResponse, Tag } from '../../types/architect';

/**
 * IDによる建築家の取得
 * @param id 建築家ID
 * @returns 建築家情報
 */
export const getArchitectById = async (id: number): Promise<Architect | undefined> => {
  return getSingleResult<Architect>(
    `SELECT * FROM ZCDARCHITECT WHERE ZAT_ID = ?`,
    [id]
  );
};

/**
 * 建築家一覧の取得（ページング付き）
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
  sortBy: string = 'ZAT_ARCHITECT',
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
  
  // 検索条件の構築
  let whereClause = '1=1';
  const params: any[] = [];
  
  // キーワード検索
  if (searchTerm) {
    whereClause += ' AND (ZAT_ARCHITECT LIKE ? OR ZAT_ARCHITECT_JP LIKE ? OR ZAT_ARCHITECT_EN LIKE ?)';
    params.push(`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`);
  }
  
  // その他のフィルター条件
  if (options.nationality) {
    whereClause += ' AND ZAT_NATIONALITY = ?';
    params.push(options.nationality);
  }
  
  if (options.category) {
    whereClause += ' AND ZAT_CATEGORY = ?';
    params.push(options.category);
  }
  
  if (options.school) {
    whereClause += ' AND ZAT_SCHOOL = ?';
    params.push(options.school);
  }
  
  if (options.birthYearFrom) {
    whereClause += ' AND ZAT_BIRTHYEAR >= ?';
    params.push(options.birthYearFrom);
  }
  
  if (options.birthYearTo) {
    whereClause += ' AND ZAT_BIRTHYEAR <= ?';
    params.push(options.birthYearTo);
  }
  
  if (options.deathYear) {
    whereClause += ' AND ZAT_DEATHYEAR = ?';
    params.push(options.deathYear);
  }
  
  // タグによるフィルタリング（現在無効 - テーブルが存在しないため）
  let joinClause = '';
  // Note: ZCDTAG and ZCDARCHITECT_TAG tables don't exist in current database
  // Tag filtering disabled until proper tag tables are available
  if (tags && tags.length > 0) {
    console.warn('⚠️ Tag filtering requested but tag tables (ZCDTAG, ZCDARCHITECT_TAG) not available in database');
    // Fallback: search in architect fields for tag-like terms
    const tagSearchTerms = tags.join(' ');
    if (tagSearchTerms) {
      whereClause += ' AND (ZAT_CATEGORY LIKE ? OR ZAT_SCHOOL LIKE ? OR ZAT_NATIONALITY LIKE ?)';
      params.push(`%${tagSearchTerms}%`, `%${tagSearchTerms}%`, `%${tagSearchTerms}%`);
    }
  }
  
  // 総件数のクエリ
  const countQuery = `
    SELECT COUNT(DISTINCT ZCDARCHITECT.ZAT_ID) as total
    FROM ZCDARCHITECT
    ${joinClause}
    WHERE ${whereClause}
  `;
  
  // データ取得クエリ
  const dataQuery = `
    SELECT DISTINCT ZCDARCHITECT.*
    FROM ZCDARCHITECT
    ${joinClause}
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
    const architects = await getResultsArray<Architect>(dataQuery, dataParams);
    
    return {
      results: architects,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  } catch (error) {
    console.error('建築家データ取得エラー:', error);
    throw error;
  }
};

/**
 * 建築家タグの取得
 * @returns タグ一覧
 */
export const getArchitectTags = async (): Promise<Tag[]> => {
  try {
    // ZCDTAG table doesn't exist, so we'll generate tags from architect data
    console.warn('⚠️ ZCDTAG table not available, generating tags from architect fields');
    
    const results = await getResultsArray<{TAG_NAME: string; TAG_COUNT: number}>(`
      SELECT 
        COALESCE(ZAT_NATIONALITY, '不明') as TAG_NAME,
        COUNT(*) as TAG_COUNT
      FROM ZCDARCHITECT 
      WHERE ZAT_NATIONALITY IS NOT NULL AND ZAT_NATIONALITY != ''
      GROUP BY ZAT_NATIONALITY
      
      UNION ALL
      
      SELECT 
        COALESCE(ZAT_CATEGORY, '不明') as TAG_NAME,
        COUNT(*) as TAG_COUNT
      FROM ZCDARCHITECT 
      WHERE ZAT_CATEGORY IS NOT NULL AND ZAT_CATEGORY != ''
      GROUP BY ZAT_CATEGORY
      
      UNION ALL
      
      SELECT 
        COALESCE(ZAT_SCHOOL, '不明') as TAG_NAME,
        COUNT(*) as TAG_COUNT
      FROM ZCDARCHITECT 
      WHERE ZAT_SCHOOL IS NOT NULL AND ZAT_SCHOOL != ''
      GROUP BY ZAT_SCHOOL
      
      ORDER BY TAG_COUNT DESC, TAG_NAME
      LIMIT 50
    `);
    
    // Transform to Tag format
    return results.map((row, index) => ({
      TAG_ID: index + 1,
      TAG_NAME: row.TAG_NAME,
      TAG_COUNT: row.TAG_COUNT
    }));
  } catch (error) {
    console.error('タグ取得エラー:', error);
    return [];
  }
};