/**
 * Query Optimizer Module
 * 
 * This module provides functions for optimizing SQL queries and caching results
 * for improved performance in client-side database operations.
 */

// Cache for storing query results with TTL (Time To Live)
interface CacheEntry {
  value: any;
  expires: number; // Expiration timestamp
}

const queryCache: Record<string, CacheEntry> = {};

/**
 * Generate a unique cache key from a query and its parameters
 * @param query SQL query string
 * @param params Query parameters
 * @returns Unique cache key string
 */
export const generateCacheKey = (query: string, params: any[]): string => {
  // Clean the query by removing extra whitespace to improve cache hits
  const normalizedQuery = query.replace(/\s+/g, ' ').trim();
  return `${normalizedQuery}:${JSON.stringify(params)}`;
};

/**
 * Get cached query result if available and not expired
 * @param cacheKey Cache key
 * @returns Cached result or undefined if not found/expired
 */
export const getCachedQueryResult = (cacheKey: string): any | undefined => {
  const cached = queryCache[cacheKey];
  if (!cached) return undefined;

  // Check if entry has expired
  if (cached.expires < Date.now()) {
    delete queryCache[cacheKey];
    return undefined;
  }

  return cached.value;
};

/**
 * Cache query result with specified TTL
 * @param cacheKey Cache key
 * @param value Result value to cache
 * @param ttl Time to live in seconds
 */
export const cacheQueryResult = (cacheKey: string, value: any, ttl: number): void => {
  queryCache[cacheKey] = {
    value,
    expires: Date.now() + (ttl * 1000) // Convert seconds to milliseconds
  };
};

/**
 * Normalize named parameters to positional parameters
 * @param query SQL query with named parameters
 * @param params Object with named parameters
 * @returns Object with normalized query and positional parameters
 */
export const normalizeQueryParams = (
  query: string,
  params: Record<string, any>
): { query: string; params: any[] } => {
  let normalizedQuery = query;
  const positionalParams: any[] = [];

  // Replace named parameters with positional parameters
  Object.keys(params).forEach(key => {
    const paramRegex = new RegExp(`:${key}\\b`, 'g');
    normalizedQuery = normalizedQuery.replace(paramRegex, '?');
    positionalParams.push(params[key]);
  });

  return {
    query: normalizedQuery,
    params: positionalParams
  };
};

/**
 * Optimize SQL query for better performance
 * @param query Original SQL query
 * @returns Optimized SQL query
 */
export const optimizeQuery = (query: string): string => {
  let optimized = query.trim();

  // Add query optimization rules here as needed
  
  // Ensure consistent capitalization for keywords
  const keywords = ['SELECT', 'FROM', 'WHERE', 'ORDER BY', 'GROUP BY', 'LIMIT', 'OFFSET', 'JOIN'];
  keywords.forEach(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    optimized = optimized.replace(regex, keyword);
  });
  
  // Optimize for new indexes
  
  // Force the search index for common filtering patterns
  if (optimized.toLowerCase().includes('where') && 
      optimized.toLowerCase().includes('zar_prefecture') && 
      optimized.toLowerCase().includes('zar_category') &&
      !optimized.includes('INDEXED BY')) {
    optimized = optimized.replace(
      /FROM\s+ZCDARCHITECTURE\b/i,
      'FROM ZCDARCHITECTURE INDEXED BY idx_zcdarchitecture_search'
    );
  }
  
  // Force year-based index for year filters
  else if (optimized.toLowerCase().includes('where') && 
      optimized.toLowerCase().includes('zar_year') &&
      !optimized.includes('INDEXED BY')) {
    optimized = optimized.replace(
      /FROM\s+ZCDARCHITECTURE\b/i,
      'FROM ZCDARCHITECTURE INDEXED BY idx_zcdarchitecture_year'
    );
  }
  
  // Force geographic index for map queries
  else if (optimized.toLowerCase().includes('where') && 
      optimized.toLowerCase().includes('zar_latitude') && 
      optimized.toLowerCase().includes('zar_longitude') &&
      !optimized.includes('INDEXED BY')) {
    optimized = optimized.replace(
      /FROM\s+ZCDARCHITECTURE\b/i,
      'FROM ZCDARCHITECTURE INDEXED BY idx_zcdarchitecture_geo'
    );
  }
  
  // Force tag index for tag searches
  else if (optimized.toLowerCase().includes('where') && 
      optimized.toLowerCase().includes('zar_tag') &&
      !optimized.includes('INDEXED BY')) {
    optimized = optimized.replace(
      /FROM\s+ZCDARCHITECTURE\b/i,
      'FROM ZCDARCHITECTURE INDEXED BY idx_zcdarchitecture_tag'
    );
  }
  
  // Architect name searches
  if (optimized.toLowerCase().includes('where') && 
      optimized.toLowerCase().includes('zat_architect') &&
      !optimized.includes('INDEXED BY')) {
    optimized = optimized.replace(
      /FROM\s+ZCDARCHITECT\b/i,
      'FROM ZCDARCHITECT INDEXED BY idx_zcdarchitect_name'
    );
  }
  
  // Optimize COUNT queries by using COUNT(1) instead of COUNT(*)
  if (optimized.includes('COUNT(*)')) {
    optimized = optimized.replace(/COUNT\(\*\)/gi, 'COUNT(1)');
  }
  
  // Add LIMIT to prevent excessive rows if missing for SELECT queries
  if (!optimized.toLowerCase().includes('limit') && 
      optimized.toLowerCase().startsWith('select') && 
      !optimized.toLowerCase().includes('count(')) {
    optimized += ' LIMIT 1000';
  }

  return optimized;
}

/**
 * Analyze query for cacheability and determine appropriate TTL
 * @param query SQL query string
 * @returns TTL in seconds (0 means don't cache)
 */
export const analyzeQueryCaching = (query: string): number => {
  const queryLower = query.toLowerCase();
  
  // Don't cache queries with potential side effects
  if (queryLower.includes('insert') || 
      queryLower.includes('update') || 
      queryLower.includes('delete')) {
    return 0;
  }
  
  // Cache reference data that rarely changes for longer periods
  if (queryLower.includes('distinct zar_prefecture') || 
      queryLower.includes('distinct zar_category') ||
      queryLower.includes('distinct zat_nationality') ||
      queryLower.includes('distinct zat_school')) {
    return 7200; // 2 hours
  }

  // Cache tag data for a moderate time
  if (queryLower.includes('zar_tag') && !queryLower.includes('where')) {
    return 1800; // 30 minutes
  }
  
  // Cache specific architect or architecture detail queries
  if ((queryLower.includes('where z_pk =') || queryLower.includes('where z_pk=')) &&
      (queryLower.includes('zcdarchitect') || queryLower.includes('zcdarchitecture'))) {
    return 900; // 15 minutes
  }
  
  // Cache list views with sorting and filtering for a moderate time
  if (queryLower.includes('limit') && 
      queryLower.includes('offset') &&
      queryLower.includes('order by')) {
    return 300; // 5 minutes
  }

  // Cache map data queries (these could have geographic constraints)
  if (queryLower.includes('zar_latitude') && queryLower.includes('zar_longitude')) {
    return 180; // 3 minutes
  }
  
  // Default caching time for other select queries
  if (queryLower.includes('select')) {
    return 60; // 1 minute
  }
  
  // Don't cache by default
  return 0;
}