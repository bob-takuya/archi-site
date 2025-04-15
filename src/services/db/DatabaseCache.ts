/**
 * Database caching service
 * 
 * This module provides caching for frequently used database queries,
 * which helps improve performance on GitHub Pages by reducing database access.
 */

// Cache storage for different query types
interface QueryCache {
  [key: string]: {
    data: any;
    timestamp: number;
    ttl: number; // Time-to-live in milliseconds
  };
}

// Cache configuration
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes default TTL
const LONG_TTL = 30 * 60 * 1000; // 30 minutes for rarely changing data
const CACHE_ENABLED = true; // Global toggle for caching

// Initialize the cache store
const queryCache: QueryCache = {};

/**
 * Get a cached result or execute the query function and cache the result
 * 
 * @param cacheKey Unique key for this query
 * @param queryFn Function that executes the actual query
 * @param ttl Time-to-live in milliseconds (optional)
 * @returns Query result (either from cache or freshly executed)
 */
export async function getCachedQuery<T>(
  cacheKey: string,
  queryFn: () => Promise<T>,
  ttl = DEFAULT_TTL
): Promise<T> {
  // Skip cache if disabled
  if (!CACHE_ENABLED) {
    return queryFn();
  }

  const now = Date.now();
  const cachedItem = queryCache[cacheKey];

  // Return cached result if valid
  if (cachedItem && now - cachedItem.timestamp < cachedItem.ttl) {
    console.log(`🔵 Cache hit for: ${cacheKey}`);
    return cachedItem.data as T;
  }

  // Execute query and cache result
  console.log(`🟠 Cache miss for: ${cacheKey}`);
  const result = await queryFn();
  
  queryCache[cacheKey] = {
    data: result,
    timestamp: now,
    ttl
  };

  return result;
}

/**
 * Clear a specific item from the cache
 * 
 * @param cacheKey Key to clear from cache
 */
export function clearCacheItem(cacheKey: string): void {
  delete queryCache[cacheKey];
  console.log(`🗑️ Cleared cache for: ${cacheKey}`);
}

/**
 * Clear all items from the cache
 */
export function clearCache(): void {
  Object.keys(queryCache).forEach(key => {
    delete queryCache[key];
  });
  console.log('🧹 Cleared entire query cache');
}

/**
 * Generate a cache key from a query string and parameters
 * 
 * @param sql SQL query string
 * @param params Query parameters
 * @returns Cache key string
 */
export function generateCacheKey(sql: string, params: any[] = []): string {
  // Create a stable representation of the parameters
  const paramsStr = JSON.stringify(params);
  // Create a unique key based on query and parameters
  return `sql:${sql}|params:${paramsStr}`;
}

/**
 * Get cached query metrics
 * 
 * @returns Cache statistics
 */
export function getCacheMetrics(): { size: number, keys: string[] } {
  const keys = Object.keys(queryCache);
  return {
    size: keys.length,
    keys
  };
}