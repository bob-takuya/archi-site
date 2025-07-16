/**
 * Real Architect Service - Uses actual SQLite database
 * Replaces FastArchitectService with real database integration
 */

import { getResultsArray, getSingleResult } from '../db/FixedDatabaseService';

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
  // Core database fields
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
}

/**
 * Get all architects with pagination and sorting
 */
export const getAllArchitects = async (
  page: number = 1,
  limit: number = 12,
  searchTerm: string = '',
  sortBy: string = 'name_asc'
): Promise<ArchitectResponse> => {
  console.log('🏗️ RealArchitectService.getAllArchitects called with:', { page, limit, searchTerm, sortBy });
  try {
    let whereClause = '';
    let orderClause = '';
    
    // Search filtering
    if (searchTerm) {
      const term = `%${searchTerm}%`;
      whereClause = `WHERE (
        ZAT_ARCHITECT LIKE '${term}' OR 
        ZAT_ARCHITECT_EN LIKE '${term}' OR 
        ZAT_NATIONALITY LIKE '${term}' OR 
        ZAT_CATEGORY LIKE '${term}' OR 
        ZAT_SCHOOL LIKE '${term}' OR
        ZAT_OFFICE LIKE '${term}'
      )`;
    }
    
    // Sorting
    switch (sortBy) {
      case 'name_asc':
        orderClause = 'ORDER BY ZAT_ARCHITECT ASC';
        break;
      case 'name_desc':
        orderClause = 'ORDER BY ZAT_ARCHITECT DESC';
        break;
      case 'birth_year_asc':
        orderClause = 'ORDER BY ZAT_BIRTHYEAR ASC';
        break;
      case 'birth_year_desc':
        orderClause = 'ORDER BY ZAT_BIRTHYEAR DESC';
        break;
      default:
        orderClause = 'ORDER BY ZAT_ARCHITECT ASC';
    }
    
    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM ZCDARCHITECT ${whereClause}`;
    console.log('📊 Count query:', countQuery);
    const countResult = await getSingleResult<{total: number}>(countQuery);
    console.log('📊 Count result:', countResult);
    const total = countResult?.total || 0;
    console.log('📊 Total architects found:', total);
    
    // Get paginated results
    const offset = (page - 1) * limit;
    const dataQuery = `
      SELECT 
        Z_PK,
        ZAT_ID,
        ZAT_ARCHITECT,
        ZAT_ARCHITECT_JP,
        ZAT_ARCHITECT_EN,
        ZAT_BIRTHYEAR,
        ZAT_DEATHYEAR,
        ZAT_NATIONALITY,
        ZAT_CATEGORY,
        ZAT_SCHOOL,
        ZAT_OFFICE,
        ZAT_DESCRIPTION,
        ZAT_WEBSITE
      FROM ZCDARCHITECT 
      ${whereClause}
      ${orderClause}
      LIMIT ${limit} OFFSET ${offset}
    `;
    
    const architects = await getResultsArray<Architect>(dataQuery);
    
    // Map database fields to interface
    const mappedArchitects = architects.map(architect => ({
      ...architect,
      id: architect.ZAT_ID || architect.Z_PK || 0,
      name: architect.ZAT_ARCHITECT || '',
      nameJp: architect.ZAT_ARCHITECT_JP,
      nameEn: architect.ZAT_ARCHITECT_EN,
      birthYear: architect.ZAT_BIRTHYEAR,
      deathYear: architect.ZAT_DEATHYEAR,
      nationality: architect.ZAT_NATIONALITY,
      category: architect.ZAT_CATEGORY,
      school: architect.ZAT_SCHOOL,
      office: architect.ZAT_OFFICE,
      bio: architect.ZAT_DESCRIPTION,
      mainWorks: undefined,
      awards: undefined,
      imageUrl: undefined
    }));
    
    return {
      results: mappedArchitects,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
    
  } catch (error) {
    console.error('❌ Error in RealArchitectService.getAllArchitects:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
};

/**
 * Search architects with filters
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
  try {
    const conditions: string[] = [];
    
    // Text search
    if (searchTerm) {
      const term = `%${searchTerm}%`;
      conditions.push(`(
        ZAT_ARCHITECT LIKE '${term}' OR 
        ZAT_ARCHITECT_EN LIKE '${term}' OR 
        ZAT_NATIONALITY LIKE '${term}' OR 
        ZAT_CATEGORY LIKE '${term}' OR 
        ZAT_SCHOOL LIKE '${term}' OR
        ZAT_OFFICE LIKE '${term}' OR
        ZAT_DESCRIPTION LIKE '${term}'
      )`);
    }
    
    // Apply filters
    if (filters.nationality) {
      conditions.push(`ZAT_NATIONALITY = '${filters.nationality}'`);
    }
    
    if (filters.category) {
      conditions.push(`ZAT_CATEGORY = '${filters.category}'`);
    }
    
    if (filters.school) {
      conditions.push(`ZAT_SCHOOL LIKE '%${filters.school}%'`);
    }
    
    if (filters.birthYearFrom) {
      conditions.push(`ZAT_BIRTHYEAR >= ${filters.birthYearFrom}`);
    }
    
    if (filters.birthYearTo) {
      conditions.push(`ZAT_BIRTHYEAR <= ${filters.birthYearTo}`);
    }
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM ZCDARCHITECT ${whereClause}`;
    const countResult = await getSingleResult<{total: number}>(countQuery);
    const total = countResult?.total || 0;
    
    // Get paginated results
    const offset = (page - 1) * limit;
    const dataQuery = `
      SELECT 
        Z_PK,
        ZAT_ID,
        ZAT_ARCHITECT,
        ZAT_ARCHITECT_JP,
        ZAT_ARCHITECT_EN,
        ZAT_BIRTHYEAR,
        ZAT_DEATHYEAR,
        ZAT_NATIONALITY,
        ZAT_CATEGORY,
        ZAT_SCHOOL,
        ZAT_OFFICE,
        ZAT_DESCRIPTION,
        ZAT_WEBSITE
      FROM ZCDARCHITECT 
      ${whereClause}
      ORDER BY ZAT_ARCHITECT ASC
      LIMIT ${limit} OFFSET ${offset}
    `;
    
    const architects = await getResultsArray<Architect>(dataQuery);
    
    // Map database fields to interface
    const mappedArchitects = architects.map(architect => ({
      ...architect,
      id: architect.ZAT_ID || architect.Z_PK || 0,
      name: architect.ZAT_ARCHITECT || '',
      nameJp: architect.ZAT_ARCHITECT_JP,
      nameEn: architect.ZAT_ARCHITECT_EN,
      birthYear: architect.ZAT_BIRTHYEAR,
      deathYear: architect.ZAT_DEATHYEAR,
      nationality: architect.ZAT_NATIONALITY,
      category: architect.ZAT_CATEGORY,
      school: architect.ZAT_SCHOOL,
      office: architect.ZAT_OFFICE,
      bio: architect.ZAT_DESCRIPTION,
      mainWorks: undefined,
      awards: undefined,
      imageUrl: undefined
    }));
    
    return {
      results: mappedArchitects,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
    
  } catch (error) {
    console.error('Error searching architects:', error);
    throw error;
  }
};

/**
 * Get architect by ID
 */
export const getArchitectById = async (id: number): Promise<Architect | null> => {
  try {
    const query = `
      SELECT 
        Z_PK,
        ZAT_ID,
        ZAT_ARCHITECT,
        ZAT_ARCHITECT_JP,
        ZAT_ARCHITECT_EN,
        ZAT_BIRTHYEAR,
        ZAT_DEATHYEAR,
        ZAT_NATIONALITY,
        ZAT_CATEGORY,
        ZAT_SCHOOL,
        ZAT_OFFICE,
        ZAT_DESCRIPTION,
        ZAT_WEBSITE
      FROM ZCDARCHITECT 
      WHERE ZAT_ID = ${id} OR Z_PK = ${id}
      LIMIT 1
    `;
    
    const architect = await getSingleResult<Architect>(query);
    
    if (!architect) {
      return null;
    }
    
    // Map database fields to interface
    return {
      ...architect,
      id: architect.ZAT_ID || architect.Z_PK || 0,
      name: architect.ZAT_ARCHITECT || '',
      nameJp: architect.ZAT_ARCHITECT_JP,
      nameEn: architect.ZAT_ARCHITECT_EN,
      birthYear: architect.ZAT_BIRTHYEAR,
      deathYear: architect.ZAT_DEATHYEAR,
      nationality: architect.ZAT_NATIONALITY,
      category: architect.ZAT_CATEGORY,
      school: architect.ZAT_SCHOOL,
      office: architect.ZAT_OFFICE,
      bio: architect.ZAT_DESCRIPTION,
      mainWorks: undefined,
      awards: undefined,
      imageUrl: undefined
    };
    
  } catch (error) {
    console.error('Error fetching architect by ID:', error);
    throw error;
  }
};

/**
 * Get unique nationalities for filter options
 */
export const getArchitectNationalities = async (): Promise<string[]> => {
  try {
    const query = `
      SELECT DISTINCT ZAT_NATIONALITY 
      FROM ZCDARCHITECT 
      WHERE ZAT_NATIONALITY IS NOT NULL AND ZAT_NATIONALITY != ''
      ORDER BY ZAT_NATIONALITY ASC
    `;
    
    const results = await getResultsArray<{ZAT_NATIONALITY: string}>(query);
    return results.map(row => row.ZAT_NATIONALITY);
  } catch (error) {
    console.error('Error fetching nationalities:', error);
    return [];
  }
};

/**
 * Get unique categories for filter options
 */
export const getArchitectCategories = async (): Promise<string[]> => {
  try {
    const query = `
      SELECT DISTINCT ZAT_CATEGORY 
      FROM ZCDARCHITECT 
      WHERE ZAT_CATEGORY IS NOT NULL AND ZAT_CATEGORY != ''
      ORDER BY ZAT_CATEGORY ASC
    `;
    
    const results = await getResultsArray<{ZAT_CATEGORY: string}>(query);
    return results.map(row => row.ZAT_CATEGORY);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
};

/**
 * Get unique schools for filter options
 */
export const getArchitectSchools = async (): Promise<string[]> => {
  try {
    const query = `
      SELECT DISTINCT ZAT_SCHOOL 
      FROM ZCDARCHITECT 
      WHERE ZAT_SCHOOL IS NOT NULL AND ZAT_SCHOOL != ''
      ORDER BY ZAT_SCHOOL ASC
    `;
    
    const results = await getResultsArray<{ZAT_SCHOOL: string}>(query);
    return results.map(row => row.ZAT_SCHOOL);
  } catch (error) {
    console.error('Error fetching schools:', error);
    return [];
  }
};