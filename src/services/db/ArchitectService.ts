/**
 * Architect database service
 * Client-side implementation using SQL.js and sql.js-httpvfs
 */

import { getResultsArray, getSingleResult } from './ClientDatabaseService';
import type { Architect, ArchitectsResponse, Tag } from '../../types/architect';
import type { SearchFacets, FacetCount, RangeFacet, ActiveFacets } from '../../components/search/FacetedSearch';

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

/**
 * ファセット検索用のメタデータを取得
 * @returns ファセット情報
 */
export const getArchitectFacets = async (activeFacets?: ActiveFacets): Promise<SearchFacets> => {
  try {
    // Build base query with applied filters
    let baseWhereClause = '1=1';
    const baseParams: any[] = [];

    // Apply active facets for cross-filtering
    if (activeFacets) {
      if (activeFacets.prefectures && Array.isArray(activeFacets.prefectures) && activeFacets.prefectures.length > 0) {
        baseWhereClause += ` AND ZAT_NATIONALITY IN (${activeFacets.prefectures.map(() => '?').join(',')})`;
        baseParams.push(...activeFacets.prefectures);
      }
      
      if (activeFacets.architects && Array.isArray(activeFacets.architects) && activeFacets.architects.length > 0) {
        baseWhereClause += ` AND ZAT_ARCHITECT IN (${activeFacets.architects.map(() => '?').join(',')})`;
        baseParams.push(...activeFacets.architects);
      }
      
      if (activeFacets.categories && Array.isArray(activeFacets.categories) && activeFacets.categories.length > 0) {
        baseWhereClause += ` AND ZAT_CATEGORY IN (${activeFacets.categories.map(() => '?').join(',')})`;
        baseParams.push(...activeFacets.categories);
      }
      
      if (activeFacets.styles && Array.isArray(activeFacets.styles) && activeFacets.styles.length > 0) {
        baseWhereClause += ` AND ZAT_SCHOOL IN (${activeFacets.styles.map(() => '?').join(',')})`;
        baseParams.push(...activeFacets.styles);
      }
      
      if (activeFacets.yearRange && Array.isArray(activeFacets.yearRange)) {
        const [minYear, maxYear] = activeFacets.yearRange;
        if (minYear > 0) {
          baseWhereClause += ' AND ZAT_BIRTHYEAR >= ?';
          baseParams.push(minYear);
        }
        if (maxYear > 0) {
          baseWhereClause += ' AND ZAT_BIRTHYEAR <= ?';
          baseParams.push(maxYear);
        }
      }
    }

    // Get nationality facets
    const prefecturesFacets = await getResultsArray<{value: string; count: number}>(`
      SELECT ZAT_NATIONALITY as value, COUNT(*) as count
      FROM ZCDARCHITECT 
      WHERE ${baseWhereClause} AND ZAT_NATIONALITY IS NOT NULL AND ZAT_NATIONALITY != ''
      GROUP BY ZAT_NATIONALITY
      ORDER BY count DESC
      LIMIT 20
    `, baseParams);

    // Get architect name facets (top architects by work count)
    const architectsFacets = await getResultsArray<{value: string; count: number}>(`
      SELECT ZAT_ARCHITECT as value, 1 as count
      FROM ZCDARCHITECT 
      WHERE ${baseWhereClause} AND ZAT_ARCHITECT IS NOT NULL
      GROUP BY ZAT_ARCHITECT
      ORDER BY ZAT_ARCHITECT
      LIMIT 50
    `, baseParams);

    // Get category facets
    const categoriesFacets = await getResultsArray<{value: string; count: number}>(`
      SELECT ZAT_CATEGORY as value, COUNT(*) as count
      FROM ZCDARCHITECT 
      WHERE ${baseWhereClause} AND ZAT_CATEGORY IS NOT NULL AND ZAT_CATEGORY != ''
      GROUP BY ZAT_CATEGORY
      ORDER BY count DESC
      LIMIT 15
    `, baseParams);

    // Get school/style facets
    const stylesFacets = await getResultsArray<{value: string; count: number}>(`
      SELECT ZAT_SCHOOL as value, COUNT(*) as count
      FROM ZCDARCHITECT 
      WHERE ${baseWhereClause} AND ZAT_SCHOOL IS NOT NULL AND ZAT_SCHOOL != ''
      GROUP BY ZAT_SCHOOL
      ORDER BY count DESC
      LIMIT 20
    `, baseParams);

    // Get year range
    const yearRangeResult = await getSingleResult<{min_year: number; max_year: number}>(`
      SELECT 
        MIN(ZAT_BIRTHYEAR) as min_year,
        MAX(ZAT_BIRTHYEAR) as max_year
      FROM ZCDARCHITECT 
      WHERE ${baseWhereClause} AND ZAT_BIRTHYEAR > 0
    `, baseParams);

    const minYear = yearRangeResult?.min_year || 1800;
    const maxYear = yearRangeResult?.max_year || new Date().getFullYear();

    // Convert to facet format
    const convertToFacetCounts = (data: Array<{value: string; count: number}>, selectedValues: string[] = []): FacetCount[] => {
      return data.map(item => ({
        value: item.value,
        label: item.value,
        count: item.count,
        selected: selectedValues.includes(item.value)
      }));
    };

    const activeYearRange = activeFacets?.yearRange as [number, number] || [minYear, maxYear];

    return {
      prefectures: convertToFacetCounts(
        prefecturesFacets, 
        activeFacets?.prefectures as string[] || []
      ),
      architects: convertToFacetCounts(
        architectsFacets, 
        activeFacets?.architects as string[] || []
      ),
      decades: [], // Not implemented for architects
      categories: convertToFacetCounts(
        categoriesFacets, 
        activeFacets?.categories as string[] || []
      ),
      materials: [], // Not applicable for architects
      styles: convertToFacetCounts(
        stylesFacets, 
        activeFacets?.styles as string[] || []
      ),
      yearRange: {
        min: minYear,
        max: maxYear,
        selectedMin: activeYearRange[0],
        selectedMax: activeYearRange[1],
        step: 1,
        unit: '年'
      },
      popular: [] // Not implemented
    };
  } catch (error) {
    console.error('ファセット取得エラー:', error);
    return {
      prefectures: [],
      architects: [],
      decades: [],
      categories: [],
      materials: [],
      styles: [],
      yearRange: {
        min: 1800,
        max: new Date().getFullYear(),
        selectedMin: 1800,
        selectedMax: new Date().getFullYear(),
        step: 1,
        unit: '年'
      },
      popular: []
    };
  }
};

/**
 * ファセット検索を実行
 * @param query 検索クエリ
 * @param facets アクティブなファセット
 * @param page ページ番号
 * @param limit 1ページあたりの件数
 * @returns 検索結果
 */
export const searchArchitectsWithFacets = async (
  query: string = '',
  facets: ActiveFacets = {},
  page: number = 1,
  limit: number = 12
): Promise<ArchitectsResponse> => {
  const offset = (page - 1) * limit;
  
  // Build search conditions
  let whereClause = '1=1';
  const params: any[] = [];
  
  // Text search
  if (query.trim()) {
    whereClause += ' AND (ZAT_ARCHITECT LIKE ? OR ZAT_ARCHITECT_JP LIKE ? OR ZAT_ARCHITECT_EN LIKE ? OR ZAT_NATIONALITY LIKE ? OR ZAT_CATEGORY LIKE ? OR ZAT_SCHOOL LIKE ?)';
    const searchTerm = `%${query.trim()}%`;
    params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
  }
  
  // Apply facet filters
  if (facets.prefectures && Array.isArray(facets.prefectures) && facets.prefectures.length > 0) {
    whereClause += ` AND ZAT_NATIONALITY IN (${facets.prefectures.map(() => '?').join(',')})`;
    params.push(...facets.prefectures);
  }
  
  if (facets.architects && Array.isArray(facets.architects) && facets.architects.length > 0) {
    whereClause += ` AND ZAT_ARCHITECT IN (${facets.architects.map(() => '?').join(',')})`;
    params.push(...facets.architects);
  }
  
  if (facets.categories && Array.isArray(facets.categories) && facets.categories.length > 0) {
    whereClause += ` AND ZAT_CATEGORY IN (${facets.categories.map(() => '?').join(',')})`;
    params.push(...facets.categories);
  }
  
  if (facets.styles && Array.isArray(facets.styles) && facets.styles.length > 0) {
    whereClause += ` AND ZAT_SCHOOL IN (${facets.styles.map(() => '?').join(',')})`;
    params.push(...facets.styles);
  }
  
  if (facets.yearRange && Array.isArray(facets.yearRange)) {
    const [minYear, maxYear] = facets.yearRange;
    if (minYear > 0) {
      whereClause += ' AND ZAT_BIRTHYEAR >= ?';
      params.push(minYear);
    }
    if (maxYear > 0) {
      whereClause += ' AND ZAT_BIRTHYEAR <= ?';
      params.push(maxYear);
    }
  }
  
  // Get total count
  const countQuery = `
    SELECT COUNT(*) as total
    FROM ZCDARCHITECT
    WHERE ${whereClause}
  `;
  
  // Get data
  const dataQuery = `
    SELECT *
    FROM ZCDARCHITECT
    WHERE ${whereClause}
    ORDER BY ZAT_ARCHITECT ASC
    LIMIT ? OFFSET ?
  `;
  
  const dataParams = [...params, limit, offset];
  
  try {
    const countResult = await getSingleResult<{ total: number }>(countQuery, params);
    const total = countResult?.total || 0;
    
    const architects = await getResultsArray<Architect>(dataQuery, dataParams);
    
    return {
      results: architects,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  } catch (error) {
    console.error('ファセット検索エラー:', error);
    throw error;
  }
};