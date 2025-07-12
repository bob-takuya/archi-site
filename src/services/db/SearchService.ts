/**
 * Search service for unified search functionality across the database
 * This provides a centralized way to search across multiple data types
 * with English-Japanese translation support for international accessibility
 */

import { executeQuery } from './DatabaseLoader';
import { getCachedQuery, generateCacheKey } from './DatabaseCache';
import { enhanceSearchTerms, createSearchPatterns, isEnglishTerm } from '../SearchTranslationService';
import type { Architecture } from '../../types/architecture';
import type { Architect } from '../../types/architect';
import type { SearchResult } from '../../types/search';

/**
 * Perform a global search across multiple tables
 * @param searchTerm The search term to look for
 * @param limit Maximum number of results per category
 * @returns Search results grouped by category
 */
export async function globalSearch(
  searchTerm: string, 
  limit = 5
): Promise<SearchResult> {
  if (!searchTerm || searchTerm.trim() === '') {
    return {
      architectures: [],
      architects: [],
      prefectures: [],
      categories: []
    };
  }

  // Generate cache key based on search term and limit
  const cacheKey = `globalSearch:${searchTerm}:${limit}`;
  
  // Use the cache for search results to improve GitHub Pages performance
  return getCachedQuery<SearchResult>(
    cacheKey,
    async () => {
      // Enhance search terms with translations for better international accessibility
      const enhancedTerms = enhanceSearchTerms(searchTerm);
      const searchPatterns = createSearchPatterns(searchTerm);
      
      console.log(`🔍 Search enhanced: "${searchTerm}" → [${enhancedTerms.join(', ')}] (${isEnglishTerm(searchTerm) ? 'EN→JP' : 'JP→EN'})`);
      
      try {
        // Build dynamic WHERE clause for enhanced search patterns
        const whereConditions = searchPatterns.map(() => 
          '(ZAR_TITLE LIKE ? OR ZAR_ADDRESS LIKE ? OR ZAR_PREFECTURE LIKE ? OR ZAR_DESCRIPTION LIKE ? OR ZAR_ARCHITECT LIKE ?)'
        ).join(' OR ');
        
        const whereParams: string[] = [];
        searchPatterns.forEach(pattern => {
          whereParams.push(pattern, pattern, pattern, pattern, pattern);
        });
        
        // Build relevance scoring for original term (higher priority)
        const originalPattern = `%${searchTerm}%`;
        const startsWithPattern = `${searchTerm}%`;
        
        // Search architectures with enhanced translation support
        const architectures = await executeQuery<Architecture>(`
          SELECT 
            Z_PK as id,
            ZAR_TITLE as name,
            ZAR_PREFECTURE as city,
            ZAR_YEAR as completedYear,
            ZAR_ARCHITECT as architectName,
            'architecture' as type
          FROM ZCDARCHITECTURE
          WHERE (${whereConditions})
          AND ZAR_TAG NOT LIKE '%の追加建築%'
          ORDER BY 
            CASE 
              WHEN ZAR_TITLE LIKE ? THEN 1        -- Original term in title (highest priority)
              WHEN ZAR_ARCHITECT LIKE ? THEN 2    -- Original term in architect name
              WHEN ZAR_TITLE LIKE ? THEN 3        -- Original term contains
              ELSE 4                               -- Translation matches (lower priority)
            END,
            ZAR_YEAR DESC
          LIMIT ?
        `, [
          ...whereParams,
          startsWithPattern,    // Original term starts with
          startsWithPattern,    // Original architect starts with
          originalPattern,      // Original term contains
          limit
        ], false); // Don't use cache for individual queries, only the final result

        // Search architects with translation support
        const architectWhereConditions = searchPatterns.map(() => 
          '(ZAT_ARCHITECT LIKE ? OR ZAT_OFFICE LIKE ?)'
        ).join(' OR ');
        
        const architectWhereParams: string[] = [];
        searchPatterns.forEach(pattern => {
          architectWhereParams.push(pattern, pattern);
        });
        
        const architects = await executeQuery<Architect>(`
          SELECT 
            Z_PK as id,
            ZAT_ARCHITECT as name,
            ZAT_OFFICE as office,
            'architect' as type
          FROM ZCDARCHITECT
          WHERE ${architectWhereConditions}
          ORDER BY 
            CASE 
              WHEN ZAT_ARCHITECT LIKE ? THEN 1     -- Original term starts with architect name
              WHEN ZAT_ARCHITECT LIKE ? THEN 2     -- Original term contains architect name
              WHEN ZAT_OFFICE LIKE ? THEN 3        -- Original term in office
              ELSE 4                                -- Translation matches
            END
          LIMIT ?
        `, [
          ...architectWhereParams,
          startsWithPattern,  // Original term starts with
          originalPattern,    // Original term contains
          originalPattern,    // Original term in office
          limit
        ], false);

        // Search prefectures with translation support
        const prefectureWhereConditions = searchPatterns.map(() => 'ZAR_PREFECTURE LIKE ?').join(' OR ');
        
        const prefectures = await executeQuery<{ name: string, count: number }>(`
          SELECT 
            ZAR_PREFECTURE as name,
            COUNT(*) as count
          FROM ZCDARCHITECTURE
          WHERE (${prefectureWhereConditions})
            AND ZAR_PREFECTURE IS NOT NULL
            AND ZAR_PREFECTURE != ''
            AND ZAR_TAG NOT LIKE '%の追加建築%'
          GROUP BY ZAR_PREFECTURE
          ORDER BY 
            CASE 
              WHEN ZAR_PREFECTURE LIKE ? THEN 1    -- Original term starts with
              WHEN ZAR_PREFECTURE LIKE ? THEN 2    -- Original term contains
              ELSE 3                                -- Translation matches
            END,
            count DESC
          LIMIT ?
        `, [
          ...searchPatterns,
          startsWithPattern,  // Original term starts with
          originalPattern,    // Original term contains
          limit
        ], false);

        // Search categories with translation support
        const categoryWhereConditions = searchPatterns.map(() => 
          '(ZAR_CATEGORY LIKE ? OR ZAR_BIGCATEGORY LIKE ?)'
        ).join(' OR ');
        
        const categoryWhereParams: string[] = [];
        searchPatterns.forEach(pattern => {
          categoryWhereParams.push(pattern, pattern);
        });

        const categories = await executeQuery<{ name: string, count: number }>(`
          SELECT 
            ZAR_CATEGORY as name,
            COUNT(*) as count
          FROM ZCDARCHITECTURE
          WHERE (${categoryWhereConditions})
            AND ZAR_CATEGORY IS NOT NULL
            AND ZAR_CATEGORY != ''
            AND ZAR_TAG NOT LIKE '%の追加建築%'
          GROUP BY ZAR_CATEGORY
          ORDER BY 
            CASE 
              WHEN ZAR_CATEGORY LIKE ? THEN 1      -- Original term starts with
              WHEN ZAR_CATEGORY LIKE ? THEN 2      -- Original term contains
              ELSE 3                                -- Translation matches
            END,
            count DESC
          LIMIT ?
        `, [
          ...categoryWhereParams,
          startsWithPattern,  // Original term starts with
          originalPattern,    // Original term contains
          limit
        ], false);

        return {
          architectures,
          architects,
          prefectures,
          categories
        };
      } catch (error) {
        console.error('Global search failed:', error);
        return {
          architectures: [],
          architects: [],
          prefectures: [],
          categories: []
        };
      }
    },
    60000 // Cache for 1 minute
  );
}

/**
 * Search for architectures with tag-based filtering
 * @param tag The tag to search for
 * @param page Page number
 * @param limit Results per page
 * @returns Architectures with the specified tag
 */
export async function searchByTag(
  tag: string,
  page = 1,
  limit = 20
): Promise<{ items: Architecture[], total: number, pages: number }> {
  const offset = (page - 1) * limit;
  
  // Generate cache key for this specific search
  const cacheKey = `tagSearch:${tag}:${page}:${limit}`;

  return getCachedQuery<{ items: Architecture[], total: number, pages: number }>(
    cacheKey,
    async () => {
      try {
        // Get total count
        const totalResult = await executeQuery<{ total: number }>(`
          SELECT COUNT(*) as total
          FROM ZCDARCHITECTURE
          WHERE ZAR_TAG LIKE ?
            AND ZAR_TAG NOT LIKE '%の追加建築%'
        `, [`%${tag}%`], false);

        const total = totalResult[0]?.total || 0;

        // Get paginated results
        const items = await executeQuery<Architecture>(`
          SELECT 
            Z_PK as id,
            ZAR_TITLE as name,
            ZAR_PREFECTURE as city,
            ZAR_YEAR as completedYear,
            ZAR_ARCHITECT as architectName
          FROM ZCDARCHITECTURE
          WHERE ZAR_TAG LIKE ?
            AND ZAR_TAG NOT LIKE '%の追加建築%'
          ORDER BY ZAR_YEAR DESC
          LIMIT ? OFFSET ?
        `, [`%${tag}%`, limit, offset], false);

        return {
          items,
          total,
          pages: Math.ceil(total / limit)
        };
      } catch (error) {
        console.error('Tag search failed:', error);
        return { items: [], total: 0, pages: 0 };
      }
    },
    120000 // Cache for 2 minutes
  );
}

/**
 * Get full-text search results across all important fields
 * @param term Search term
 * @param page Page number
 * @param limit Results per page
 * @returns Search results with pagination
 */
export async function fullTextSearch(
  term: string,
  page = 1,
  limit = 20
): Promise<{ items: Architecture[], total: number, pages: number }> {
  if (!term || term.trim() === '') {
    return { items: [], total: 0, pages: 0 };
  }

  const offset = (page - 1) * limit;
  const searchTerm = `%${term}%`;
  
  // Generate cache key for full text search
  const cacheKey = `fullTextSearch:${term}:${page}:${limit}`;

  return getCachedQuery<{ items: Architecture[], total: number, pages: number }>(
    cacheKey,
    async () => {
      // Enhance search terms with translations for full-text search
      const enhancedTerms = enhanceSearchTerms(term);
      const searchPatterns = createSearchPatterns(term);
      
      console.log(`🔍 Full-text search enhanced: "${term}" → [${enhancedTerms.join(', ')}]`);
      
      try {
        // Build dynamic WHERE clause for enhanced search patterns
        const whereConditions = searchPatterns.map(() => 
          '(ZAR_TITLE LIKE ? OR ZAR_ARCHITECT LIKE ? OR ZAR_ADDRESS LIKE ? OR ZAR_PREFECTURE LIKE ? OR ZAR_DESCRIPTION LIKE ? OR ZAR_TAG LIKE ?)'
        ).join(' OR ');
        
        const whereParams: string[] = [];
        searchPatterns.forEach(pattern => {
          whereParams.push(pattern, pattern, pattern, pattern, pattern, pattern);
        });
        
        // Build relevance scoring patterns
        const originalPattern = `%${term}%`;
        const startsWithPattern = `${term}%`;

        // Get total count with enhanced search
        const totalResult = await executeQuery<{ total: number }>(`
          SELECT COUNT(*) as total
          FROM ZCDARCHITECTURE
          WHERE (${whereConditions})
          AND ZAR_TAG NOT LIKE '%の追加建築%'
        `, whereParams, false);

        const total = totalResult[0]?.total || 0;

        // Get paginated results with enhanced search and relevance scoring
        const items = await executeQuery<Architecture>(`
          SELECT 
            Z_PK as id,
            ZAR_TITLE as name,
            ZAR_PREFECTURE as city,
            ZAR_YEAR as completedYear,
            ZAR_ARCHITECT as architectName,
            ZAR_ADDRESS as location
          FROM ZCDARCHITECTURE
          WHERE (${whereConditions})
          AND ZAR_TAG NOT LIKE '%の追加建築%'
          ORDER BY
            CASE 
              WHEN ZAR_TITLE LIKE ? THEN 1          -- Original term in title (highest priority)
              WHEN ZAR_ARCHITECT LIKE ? THEN 2      -- Original term in architect name
              WHEN ZAR_PREFECTURE LIKE ? THEN 3     -- Original term in prefecture
              WHEN ZAR_TITLE LIKE ? THEN 4          -- Original term contains in title
              ELSE 5                                 -- Translation matches (lower priority)
            END,
            ZAR_YEAR DESC
          LIMIT ? OFFSET ?
        `, [
          ...whereParams,
          startsWithPattern, startsWithPattern, startsWithPattern, // Starts with patterns for relevance
          originalPattern,   // Contains pattern for relevance
          limit, offset
        ], false);

        return {
          items,
          total,
          pages: Math.ceil(total / limit)
        };
      } catch (error) {
        console.error('Full-text search failed:', error);
        return { items: [], total: 0, pages: 0 };
      }
    },
    90000 // Cache for 1.5 minutes
  );
}