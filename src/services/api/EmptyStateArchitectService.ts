/**
 * Empty State Architect Service
 * Shows proper empty states with clear error messages when database is unavailable
 * Complies with "No Realistic Dummy Data Policy"
 */

export interface Architect {
  id: number;
  name: string;
  nameJp?: string;
  nameEn?: string;
  birthYear?: number;
  deathYear?: number;
  nationality?: string;
  category?: string;
  school?: string;
  office?: string;
  bio?: string;
  mainWorks?: string;
  awards?: string;
  imageUrl?: string;
  // Legacy field mapping for compatibility
  ZAT_ID?: number;
  Z_PK?: number;
  ZAT_ARCHITECT?: string;
  ZAT_ARCHITECT_JP?: string;
  ZAT_ARCHITECT_EN?: string;
  ZAT_BIRTHYEAR?: number;
  ZAT_DEATHYEAR?: number;
  ZAT_NATIONALITY?: string;
  ZAT_CATEGORY?: string;
  ZAT_SCHOOL?: string;
  ZAT_OFFICE?: string;
  ZAT_BIO?: string;
  ZAT_MAINWORKS?: string;
  ZAT_AWARDS?: string;
  ZAT_IMAGE?: string;
}

export interface ArchitectResponse {
  results: Architect[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  error?: string;
  message?: string;
}

/**
 * Error to throw when database services are unavailable
 */
export class DatabaseUnavailableError extends Error {
  constructor(message: string = 'データベースサービスが利用できません') {
    super(message);
    this.name = 'DatabaseUnavailableError';
  }
}

/**
 * Get all architects - returns empty state with clear error message
 */
export const getAllArchitects = async (
  page: number = 1,
  limit: number = 12,
  searchTerm: string = '',
  sortBy: string = 'name_asc'
): Promise<ArchitectResponse> => {
  console.warn('⚠️ EmptyStateArchitectService: Database is not available');
  
  return {
    results: [],
    total: 0,
    page: 1,
    limit,
    totalPages: 0,
    error: 'DATABASE_UNAVAILABLE',
    message: 'データベースサービスが利用できません。サーバーが起動していない可能性があります。'
  };
};

/**
 * Search architects - returns empty state with clear error message
 */
export const searchArchitects = async (
  searchTerm: string = '',
  filters: {
    nationality?: string;
    category?: string;
    school?: string;
    birthYearFrom?: number;
    birthYearTo?: number;
  } = {},
  page: number = 1,
  limit: number = 12
): Promise<ArchitectResponse> => {
  console.warn('⚠️ EmptyStateArchitectService: Search not available - database is offline');
  
  return {
    results: [],
    total: 0,
    page: 1,
    limit,
    totalPages: 0,
    error: 'DATABASE_UNAVAILABLE',
    message: 'データベースサービスが利用できません。検索機能を使用するにはサーバーを起動してください。'
  };
};

/**
 * Get architect by ID - returns null with clear error message
 */
export const getArchitectById = async (id: number): Promise<Architect | null> => {
  console.warn('⚠️ EmptyStateArchitectService: Architect lookup not available - database is offline');
  throw new DatabaseUnavailableError('建築家の詳細情報を取得できません。データベースサービスが利用できません。');
};

/**
 * Get unique nationalities for filter options - returns empty array
 */
export const getArchitectNationalities = async (): Promise<string[]> => {
  console.warn('⚠️ EmptyStateArchitectService: Nationalities not available - database is offline');
  return [];
};

/**
 * Get unique categories for filter options - returns empty array
 */
export const getArchitectCategories = async (): Promise<string[]> => {
  console.warn('⚠️ EmptyStateArchitectService: Categories not available - database is offline');
  return [];
};

/**
 * Get unique schools for filter options - returns empty array
 */
export const getArchitectSchools = async (): Promise<string[]> => {
  console.warn('⚠️ EmptyStateArchitectService: Schools not available - database is offline');
  return [];
};