/**
 * Search service for unified search functionality across the database
 * This provides a centralized way to search across multiple data types
 */

import { executeQuery } from './DatabaseLoader';
import { getCachedQuery, generateCacheKey } from './DatabaseCache';
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
      const searchTermFormatted = `%${searchTerm}%`;
      
      try {
        // Search architectures
        const architectures = await executeQuery<Architecture>(`
          SELECT 
            Z_PK as id,
            ZAR_TITLE as name,
            ZAR_PREFECTURE as city,
            ZAR_YEAR as completedYear,
            ZAR_ARCHITECT as architectName,
            'architecture' as type
          FROM ZCDARCHITECTURE
          WHERE (
            ZAR_TITLE LIKE ? OR 
            ZAR_ADDRESS LIKE ? OR 
            ZAR_PREFECTURE LIKE ? OR
            ZAR_DESCRIPTION LIKE ?
          )
          AND ZAR_TAG NOT LIKE '%の追加建築%'
          ORDER BY 
            CASE 
              WHEN ZAR_TITLE LIKE ? THEN 1
              WHEN ZAR_TITLE LIKE ? THEN 2
              ELSE 3
            END
          LIMIT ?
        `, [
          searchTermFormatted, 
          searchTermFormatted, 
          searchTermFormatted,
          searchTermFormatted,
          `${searchTerm}%`,  // Starts with (higher priority)
          `%${searchTerm}%`, // Contains
          limit
        ], false); // Don't use cache for individual queries, only the final result

        // Search architects
        const architects = await executeQuery<Architect>(`
          SELECT 
            Z_PK as id,
            ZAT_ARCHITECT as name,
            ZAT_OFFICE as office,
            'architect' as type
          FROM ZCDARCHITECT
          WHERE ZAT_ARCHITECT LIKE ? OR ZAT_OFFICE LIKE ?
          ORDER BY 
            CASE 
              WHEN ZAT_ARCHITECT LIKE ? THEN 1
              WHEN ZAT_ARCHITECT LIKE ? THEN 2
              ELSE 3
            END
          LIMIT ?
        `, [
          searchTermFormatted,
          searchTermFormatted,
          `${searchTerm}%`,  // Starts with (higher priority)
          `%${searchTerm}%`, // Contains
          limit
        ], false);

        // Search prefectures
        const prefectures = await executeQuery<{ name: string, count: number }>(`
          SELECT 
            ZAR_PREFECTURE as name,
            COUNT(*) as count
          FROM ZCDARCHITECTURE
          WHERE ZAR_PREFECTURE LIKE ?
            AND ZAR_PREFECTURE IS NOT NULL
            AND ZAR_PREFECTURE != ''
            AND ZAR_TAG NOT LIKE '%の追加建築%'
          GROUP BY ZAR_PREFECTURE
          ORDER BY 
            CASE 
              WHEN ZAR_PREFECTURE LIKE ? THEN 1
              WHEN ZAR_PREFECTURE LIKE ? THEN 2
              ELSE 3
            END,
            count DESC
          LIMIT ?
        `, [
          searchTermFormatted,
          `${searchTerm}%`,  // Starts with (higher priority)
          `%${searchTerm}%`, // Contains
          limit
        ], false);

        // Search categories
        const categories = await executeQuery<{ name: string, count: number }>(`
          SELECT 
            ZAR_CATEGORY as name,
            COUNT(*) as count
          FROM ZCDARCHITECTURE
          WHERE (ZAR_CATEGORY LIKE ? OR ZAR_BIGCATEGORY LIKE ?)
            AND ZAR_CATEGORY IS NOT NULL
            AND ZAR_CATEGORY != ''
            AND ZAR_TAG NOT LIKE '%の追加建築%'
          GROUP BY ZAR_CATEGORY
          ORDER BY 
            CASE 
              WHEN ZAR_CATEGORY LIKE ? THEN 1
              WHEN ZAR_CATEGORY LIKE ? THEN 2
              ELSE 3
            END,
            count DESC
          LIMIT ?
        `, [
          searchTermFormatted,
          searchTermFormatted,
          `${searchTerm}%`,  // Starts with (higher priority)
          `%${searchTerm}%`, // Contains
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
      try {
        // Get total count
        const totalResult = await executeQuery<{ total: number }>(`
          SELECT COUNT(*) as total
          FROM ZCDARCHITECTURE
          WHERE (
            ZAR_TITLE LIKE ? OR
            ZAR_ARCHITECT LIKE ? OR
            ZAR_ADDRESS LIKE ? OR
            ZAR_PREFECTURE LIKE ? OR
            ZAR_DESCRIPTION LIKE ? OR
            ZAR_TAG LIKE ?
          )
          AND ZAR_TAG NOT LIKE '%の追加建築%'
        `, [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm], false);

        const total = totalResult[0]?.total || 0;

        // Get paginated results
        const items = await executeQuery<Architecture>(`
          SELECT 
            Z_PK as id,
            ZAR_TITLE as name,
            ZAR_PREFECTURE as city,
            ZAR_YEAR as completedYear,
            ZAR_ARCHITECT as architectName,
            ZAR_ADDRESS as location
          FROM ZCDARCHITECTURE
          WHERE (
            ZAR_TITLE LIKE ? OR
            ZAR_ARCHITECT LIKE ? OR
            ZAR_ADDRESS LIKE ? OR
            ZAR_PREFECTURE LIKE ? OR
            ZAR_DESCRIPTION LIKE ? OR
            ZAR_TAG LIKE ?
          )
          AND ZAR_TAG NOT LIKE '%の追加建築%'
          ORDER BY
            CASE 
              WHEN ZAR_TITLE LIKE ? THEN 1
              WHEN ZAR_ARCHITECT LIKE ? THEN 2
              WHEN ZAR_PREFECTURE LIKE ? THEN 3
              ELSE 4
            END,
            ZAR_YEAR DESC
          LIMIT ? OFFSET ?
        `, [
          searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm,
          `${term}%`, `${term}%`, `${term}%`, // Starts with pattern for relevance sorting
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