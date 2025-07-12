/**
 * 建築家に関する型定義
 */

/**
 * 建築家の基本情報
 */
export interface Architect {
  ZAT_ID?: number;
  Z_PK?: number; // Primary key
  ZAT_ARCHITECT: string; // Main name
  ZAT_ARCHITECT_JP?: string; // Japanese reading
  ZAT_ARCHITECT_EN?: string; // English name
  ZAT_BIRTHYEAR?: number;
  ZAT_BIRTHMONTH?: number;
  ZAT_BIRTHDAY?: number;
  ZAT_DEATHYEAR?: number;
  ZAT_DEATHMONTH?: number;
  ZAT_DEATHDAY?: number;
  ZAT_BIRTHPLACE?: string;
  ZAT_NATIONALITY?: string;
  ZAT_CATEGORY?: string;
  ZAT_SCHOOL?: string;
  ZAT_OFFICE?: string;
  ZAT_BIO?: string;
  ZAT_MAINWORKS?: string;
  ZAT_AWARDS?: string;
  ZAT_IMAGE?: string;
  ZAT_CREATED?: string;
  ZAT_MODIFIED?: string;
  // Legacy compatibility
  ZAR_ID?: number;
  ZAR_NAME?: string;
}

/**
 * 建築家一覧のレスポンス型
 */
export interface ArchitectsResponse {
  results: Architect[];
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
 * 建築家のフィルターオプション
 */
export interface ArchitectFilterOptions {
  searchTerm?: string;
  tags?: string[];
  nationality?: string;
  category?: string;
  school?: string;
  birthYearFrom?: number;
  birthYearTo?: number;
  deathYear?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
