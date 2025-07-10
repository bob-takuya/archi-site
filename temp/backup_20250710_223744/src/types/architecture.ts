/**
 * 建築作品に関する型定義
 */

/**
 * 建築作品の基本情報 (Actual database schema)
 */
export interface Architecture {
  Z_PK: number;
  ZAR_TITLE: string;
  ZAR_ARCHITECT?: string;
  ZAR_ARCHITECT1?: string;
  ZAR_ARCHITECT2?: string;
  ZAR_ARCHITECT3?: string;
  ZAR_ARCHITECT4?: string;
  ZAR_ARCHITECT_ENG?: string;
  ZAR_YEAR?: number;
  ZAR_MONTH?: number;
  ZAR_ADDRESS?: string;
  ZAR_PREFECTURE?: string;
  ZAR_AREA?: string;
  ZAR_LATITUDE?: number;
  ZAR_LONGITUDE?: number;
  ZAR_CATEGORY?: string;
  ZAR_BIGCATEGORY?: string;
  ZAR_DESCRIPTION?: string;
  ZAR_IMAGE_URL?: string;
  ZAR_URL?: string;
  ZAR_ID?: string;
  
  // Legacy compatibility properties (for backward compatibility)
  ZAW_ID?: number;
  ZAW_NAME?: string;
  ZAW_ARCHITECT?: string;
  ZAW_YEAR?: number;
  ZAW_ADDRESS?: string;
  ZAW_PREFECTURE?: string;
  ZAW_LAT?: number;
  ZAW_LNG?: number;
}

/**
 * 建築作品一覧のレスポンス型
 */
export interface ArchitectureResponse {
  results: Architecture[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * タグ情報
 */
export interface Tag {
  TAG_ID: number;
  TAG_NAME: string;
  TAG_COUNT: number;
}

/**
 * 地図の表示範囲
 */
export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

/**
 * 建築作品のフィルターオプション
 */
export interface ArchitectureFilterOptions {
  searchTerm?: string;
  tags?: string[];
  architect?: string;
  location?: string;
  prefecture?: string;
  yearFrom?: number;
  yearTo?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}