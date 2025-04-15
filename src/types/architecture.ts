/**
 * 建築作品に関する型定義
 */

/**
 * 建築作品の基本情報
 */
export interface Architecture {
  ZAW_ID: number;
  ZAW_NAME: string;
  ZAW_ARCHITECT?: string;
  ZAW_ARCHITECT_ID?: number;
  ZAW_YEAR?: number;
  ZAW_COMPLETION_YEAR?: number;
  ZAW_ADDRESS?: string;
  ZAW_PREFECTURE?: string;
  ZAW_CITY?: string;
  ZAW_LAT?: number;
  ZAW_LNG?: number;
  ZAW_STRUCTURE?: string;
  ZAW_SITE_AREA?: number;
  ZAW_BUILDING_AREA?: number;
  ZAW_TOTAL_FLOOR_AREA?: number;
  ZAW_DETAIL?: string;
  ZAW_MATERIAL?: string;
  ZAW_PROGRAM?: string;
  ZAW_IMAGE?: string;
  ZAW_STATUS?: string;
  ZAW_CREATED?: string;
  ZAW_MODIFIED?: string;
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