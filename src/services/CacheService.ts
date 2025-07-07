/**
 * Cache Service for optimizing database queries
 * Implements an in-memory cache with TTL (Time To Live) support
 */

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class CacheService {
  private static instance: CacheService;
  private cache: Map<string, CacheItem<any>> = new Map();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds
  private readonly MAX_CACHE_SIZE = 100; // Maximum number of cached items

  private constructor() {
    // Start cache cleanup interval
    this.startCleanupInterval();
  }

  /**
   * Get the singleton instance of the CacheService
   */
  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  /**
   * Generate a cache key from query and parameters
   */
  private generateKey(query: string, params: any[] = []): string {
    const paramsString = params.length > 0 ? JSON.stringify(params) : '';
    return `${query}:${paramsString}`;
  }

  /**
   * Check if a cache item is still valid
   */
  private isValid<T>(item: CacheItem<T>): boolean {
    return Date.now() - item.timestamp < item.ttl;
  }

  /**
   * Get data from cache
   */
  public get<T>(query: string, params: any[] = []): T | null {
    const key = this.generateKey(query, params);
    const item = this.cache.get(key);

    if (!item) {
      return null;
    }

    if (!this.isValid(item)) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  /**
   * Set data in cache
   */
  public set<T>(query: string, data: T, params: any[] = [], ttl?: number): void {
    const key = this.generateKey(query, params);
    
    // If cache is at max size, remove oldest item
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.DEFAULT_TTL,
    };

    this.cache.set(key, item);
  }

  /**
   * Check if data exists in cache and is valid
   */
  public has(query: string, params: any[] = []): boolean {
    const key = this.generateKey(query, params);
    const item = this.cache.get(key);
    return item ? this.isValid(item) : false;
  }

  /**
   * Clear specific cache entry
   */
  public delete(query: string, params: any[] = []): boolean {
    const key = this.generateKey(query, params);
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  public clear(): void {
    this.cache.clear();
  }

  /**
   * Clear expired cache entries
   */
  public clearExpired(): number {
    let removedCount = 0;
    const now = Date.now();

    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp >= item.ttl) {
        this.cache.delete(key);
        removedCount++;
      }
    }

    return removedCount;
  }

  /**
   * Get cache statistics
   */
  public getStats(): {
    size: number;
    maxSize: number;
    hitRatio: number;
  } {
    return {
      size: this.cache.size,
      maxSize: this.MAX_CACHE_SIZE,
      hitRatio: 0, // Would need to track hits/misses for this
    };
  }

  /**
   * Start automatic cleanup of expired cache entries
   */
  private startCleanupInterval(): void {
    setInterval(() => {
      const removed = this.clearExpired();
      if (removed > 0) {
        console.log(`[CacheService] Cleaned up ${removed} expired cache entries`);
      }
    }, 60 * 1000); // Run every minute
  }

  /**
   * Cached wrapper for async functions
   */
  public async cachedQuery<T>(
    query: string,
    queryFn: () => Promise<T>,
    params: any[] = [],
    ttl?: number
  ): Promise<T> {
    // Check cache first
    const cached = this.get<T>(query, params);
    if (cached !== null) {
      console.log(`[CacheService] Cache hit for query: ${query.slice(0, 50)}...`);
      return cached;
    }

    // Execute query and cache result
    console.log(`[CacheService] Cache miss for query: ${query.slice(0, 50)}...`);
    const result = await queryFn();
    this.set(query, result, params, ttl);
    
    return result;
  }
}

export default CacheService;