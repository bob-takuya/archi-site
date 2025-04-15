/**
 * 建築家に関する型定義
 */

/**
 * 建築家の基本情報
 */
export interface Architect {
  ZAR_ID: number;
  ZAR_NAME: string;
  ZAR_KANA?: string;
  ZAR_NAMEENG?: string;
  ZAR_BIRTHYEAR?: number;
  ZAR_DEATHYEAR?: number;
  ZAR_BIRTHPLACE?: string;
  ZAR_NATIONALITY?: string;
  ZAR_CATEGORY?: string;
  ZAR_SCHOOL?: string;
  ZAR_OFFICE?: string;
  ZAR_BIO?: string;
  ZAR_MAINWORKS?: string;
  ZAR_AWARDS?: string;
  ZAR_IMAGE?: string;
  ZAR_CREATED?: string;
  ZAR_MODIFIED?: string;
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
