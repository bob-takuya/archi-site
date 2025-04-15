/**
 * Query Optimizer
 * 
 * This module provides utilities to optimize database queries,
 * including query caching, prepared statements, and parameter normalization.
 */

// In-memory query cache
const queryCache = new Map();

/**
 * Maximum size for the query cache (number of entries)
 */
const MAX_CACHE_SIZE = 200;

/**
 * Default TTL for cached queries (in milliseconds)
 * Default: 5 minutes
 */
const DEFAULT_CACHE_TTL = 5 * 60 * 1000;

/**
 * Generate a cache key from a query and its parameters
 * @param query SQL query string
 * @param params Query parameters
 */
const generateCacheKey = (query, params) => {
  // Normalize the query by removing extra whitespace
  const normalizedQuery = query.replace(/\s+/g, ' ').trim();
  
  // Include parameters in the cache key
  return `${normalizedQuery}:${JSON.stringify(params)}`;
};

/**
 * Store a query result in the cache
 * @param key Cache key
 * @param data Query result data
 * @param ttl Time-to-live in milliseconds (optional)
 */
const cacheQueryResult = (key, data, ttl = DEFAULT_CACHE_TTL) => {
  // If cache is too large, remove oldest entries
  if (queryCache.size >= MAX_CACHE_SIZE) {
    // Sort entries by timestamp (oldest first)
    const entries = Array.from(queryCache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp);
      
    // Remove oldest 20% of entries
    const entriesToRemove = Math.ceil(entries.length * 0.2);
    for (let i = 0; i < entriesToRemove; i++) {
      if (entries[i]) {
        queryCache.delete(entries[i][0]);
      }
    }
  }
  
  // Store result in cache with timestamp and TTL
  queryCache.set(key, {
    data,
    timestamp: Date.now(),
    ttl
  });
};

/**
 * Get a cached query result if available and not expired
 * @param key Cache key
 * @returns Cached data or undefined if not found or expired
 */
const getCachedQueryResult = (key) => {
  const cached = queryCache.get(key);
  
  if (!cached) {
    return undefined;
  }
  
  // Check if cache entry has expired
  const now = Date.now();
  if (now - cached.timestamp > cached.ttl) {
    // Remove expired entry
    queryCache.delete(key);
    return undefined;
  }
  
  return cached.data;
};

/**
 * Clear the entire query cache
 */
const clearCache = () => {
  queryCache.clear();
};

/**
 * Normalize query parameters by converting named parameters to positional ones
 * @param query SQL query with named parameters (:param)
 * @param params Named parameters object
 * @returns Object with normalized query and positional parameters array
 */
const normalizeQueryParams = (query, params) => {
  const positionalParams = [];
  let normalizedQuery = query;
  
  // Replace named parameters with ? placeholders and build params array
  Object.entries(params).forEach(([key, value]) => {
    const paramRegex = new RegExp(`:${key}\\b`, 'g');
    normalizedQuery = normalizedQuery.replace(paramRegex, '?');
    
    // Count occurrences to handle the same parameter used multiple times
    const occurrences = (query.match(paramRegex) || []).length;
    
    for (let i = 0; i < occurrences; i++) {
      positionalParams.push(value);
    }
  });
  
  return {
    query: normalizedQuery,
    params: positionalParams
  };
};

/**
 * Optimize a query by analyzing and potentially rewriting it
 * @param query SQL query string
 * @returns Optimized query string
 */
const optimizeQuery = (query) => {
  let optimizedQuery = query;
  
  // Add optimization techniques here:
  
  // 1. Ensure proper indexing hints for common queries
  if (query.includes('WHERE ZAR_TAG LIKE') && !query.includes('INDEXED BY')) {
    optimizedQuery = query.replace(
      /FROM\s+ZCDARCHITECTURE\b/i, 
      'FROM ZCDARCHITECTURE INDEXED BY IDX_ZAR_TAG'
    );
  }
  
  // 2. Force using indices for architect name lookups
  if (query.includes('WHERE ZAT_ARCHITECT =') && !query.includes('INDEXED BY')) {
    optimizedQuery = query.replace(
      /FROM\s+ZCDARCHITECT\b/i,
      'FROM ZCDARCHITECT INDEXED BY IDX_ZAT_ARCHITECT'
    );
  }
  
  // 3. Optimize COUNT queries by using COUNT(1) instead of COUNT(*)
  if (optimizedQuery.includes('COUNT(*)')) {
    optimizedQuery = optimizedQuery.replace(/COUNT\(\*\)/g, 'COUNT(1)');
  }
  
  // 4. Add LIMIT to prevent excessive rows if missing
  if (!optimizedQuery.includes('LIMIT') && 
      (optimizedQuery.includes('SELECT') && !optimizedQuery.includes('COUNT'))) {
    optimizedQuery += ' LIMIT 1000';
  }
  
  return optimizedQuery;
};

/**
 * Analyze a query and determine appropriate caching strategy
 * @param query SQL query string
 * @returns Recommended TTL in milliseconds, or 0 for no caching
 */
const analyzeQueryCaching = (query) => {
  const normalizedQuery = query.replace(/\s+/g, ' ').trim().toLowerCase();
  
  // Don't cache modification queries
  if (normalizedQuery.startsWith('insert') || 
      normalizedQuery.startsWith('update') || 
      normalizedQuery.startsWith('delete')) {
    return 0;
  }
  
  // Short TTL for queries that may change frequently
  if (normalizedQuery.includes('where zar_tag like') || 
      normalizedQuery.includes('order by') && normalizedQuery.includes('limit')) {
    return 60 * 1000; // 1 minute
  }
  
  // Medium TTL for filtered list queries
  if (normalizedQuery.includes('where') && normalizedQuery.includes('limit')) {
    return 5 * 60 * 1000; // 5 minutes
  }
  
  // Long TTL for reference data that rarely changes
  if (normalizedQuery.includes('distinct zat_nationality') || 
      normalizedQuery.includes('distinct zat_school') ||
      normalizedQuery.includes('distinct zar_tag')) {
    return 30 * 60 * 1000; // 30 minutes
  }
  
  // Default TTL for other SELECT queries
  if (normalizedQuery.startsWith('select')) {
    return DEFAULT_CACHE_TTL;
  }
  
  return 0; // No caching by default for non-SELECT queries
};

module.exports = {
  generateCacheKey,
  getCachedQueryResult,
  cacheQueryResult,
  clearCache,
  normalizeQueryParams,
  optimizeQuery,
  analyzeQueryCaching
};