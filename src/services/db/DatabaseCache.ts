/**
 * Database caching service
 * 
 * This module provides caching for frequently used database queries,
 * which helps improve performance on GitHub Pages by reducing database access.
 */

// Cache storage for different query types
interface QueryCacheItem {
  data: any;
  timestamp: number;
  ttl: number; // Time-to-live in milliseconds
  lastAccessed: number; // For LRU eviction
  accessCount: number; // For frequency tracking
}

interface QueryCache {
  [key: string]: QueryCacheItem;
}

// Cache configuration
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes default TTL
const LONG_TTL = 30 * 60 * 1000; // 30 minutes for rarely changing data
const CACHE_ENABLED = true; // Global toggle for caching

// Memory management configuration
const MAX_CACHE_SIZE = 100; // Maximum number of cached items
const CLEANUP_THRESHOLD = 120; // Start cleanup when this many items
const MEMORY_CHECK_INTERVAL = 30 * 1000; // Check memory every 30 seconds

// Initialize the cache store
const queryCache: QueryCache = {};

// Initialize periodic cleanup
if (typeof window !== 'undefined') {
  setInterval(performCacheCleanup, MEMORY_CHECK_INTERVAL);
}

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
    // Update access tracking for LRU
    cachedItem.lastAccessed = now;
    cachedItem.accessCount++;
    console.log(`🔵 Cache hit for: ${cacheKey.substring(0, 50)}...`);
    return cachedItem.data as T;
  }

  // Execute query and cache result
  console.log(`🟠 Cache miss for: ${cacheKey.substring(0, 50)}...`);
  const result = await queryFn();
  
  // Check if we need to make room in cache
  if (Object.keys(queryCache).length >= CLEANUP_THRESHOLD) {
    performCacheCleanup();
  }
  
  queryCache[cacheKey] = {
    data: result,
    timestamp: now,
    ttl,
    lastAccessed: now,
    accessCount: 1
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
 * Perform cache cleanup by removing expired items and enforcing size limits
 */
function performCacheCleanup(): void {
  const now = Date.now();
  const keys = Object.keys(queryCache);
  const initialSize = keys.length;
  
  // Remove expired items first
  let expiredCount = 0;
  keys.forEach(key => {
    const item = queryCache[key];
    if (now - item.timestamp > item.ttl) {
      delete queryCache[key];
      expiredCount++;
    }
  });
  
  // If still over limit, remove least recently used items
  const remainingKeys = Object.keys(queryCache);
  if (remainingKeys.length > MAX_CACHE_SIZE) {
    // Sort by last accessed time (LRU) and access frequency
    const sortedKeys = remainingKeys.sort((a, b) => {
      const itemA = queryCache[a];
      const itemB = queryCache[b];
      
      // Primary sort: by last accessed (older first)
      const accessDiff = itemA.lastAccessed - itemB.lastAccessed;
      if (accessDiff !== 0) return accessDiff;
      
      // Secondary sort: by access count (less accessed first)
      return itemA.accessCount - itemB.accessCount;
    });
    
    // Remove excess items
    const itemsToRemove = remainingKeys.length - MAX_CACHE_SIZE;
    for (let i = 0; i < itemsToRemove; i++) {
      delete queryCache[sortedKeys[i]];
    }
    
    console.log(`🧹 Cache cleanup: removed ${expiredCount} expired + ${itemsToRemove} LRU items (${initialSize} → ${Object.keys(queryCache).length})`);
  } else if (expiredCount > 0) {
    console.log(`🧹 Cache cleanup: removed ${expiredCount} expired items (${initialSize} → ${Object.keys(queryCache).length})`);
  }
}

/**
 * Get memory usage estimate for the cache
 */
function getMemoryUsageEstimate(): number {
  let totalSize = 0;
  Object.values(queryCache).forEach(item => {
    try {
      // Rough estimate: JSON.stringify to estimate memory usage
      totalSize += JSON.stringify(item.data).length * 2; // UTF-16 characters
    } catch {
      // Fallback if data isn't serializable
      totalSize += 1000; // Assume 1KB per item
    }
  });
  return totalSize;
}

/**
 * Get cached query metrics
 * 
 * @returns Cache statistics
 */
export function getCacheMetrics(): { 
  size: number; 
  keys: string[];
  memoryUsage: number;
  hitRate?: number;
  oldestItem?: number;
  newestItem?: number;
} {
  const keys = Object.keys(queryCache);
  const now = Date.now();
  
  let oldest = Infinity;
  let newest = 0;
  
  keys.forEach(key => {
    const item = queryCache[key];
    oldest = Math.min(oldest, item.timestamp);
    newest = Math.max(newest, item.timestamp);
  });
  
  return {
    size: keys.length,
    keys: keys.slice(0, 10), // Only return first 10 keys to avoid console spam
    memoryUsage: getMemoryUsageEstimate(),
    oldestItem: oldest === Infinity ? undefined : now - oldest,
    newestItem: newest === 0 ? undefined : now - newest
  };
}

/**
 * Force immediate cache cleanup
 */
export function forceCleanup(): void {
  performCacheCleanup();
}

/**
 * Get cache configuration
 */
export function getCacheConfig() {
  return {
    maxSize: MAX_CACHE_SIZE,
    defaultTTL: DEFAULT_TTL,
    longTTL: LONG_TTL,
    cleanupThreshold: CLEANUP_THRESHOLD,
    enabled: CACHE_ENABLED
  };
}