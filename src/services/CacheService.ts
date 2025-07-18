/**
 * Enhanced Cache Service with IndexedDB persistence
 * Implements multi-layer caching strategy:
 * 1. In-memory cache for fastest access
 * 2. IndexedDB for persistence across sessions
 * 3. Intelligent cache replacement algorithms
 */

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
  size?: number; // For memory management
}

interface CacheStats {
  memorySize: number;
  memoryMaxSize: number;
  indexedDbSize: number;
  hitRatio: number;
  hits: number;
  misses: number;
  totalQueries: number;
}

class CacheService {
  private static instance: CacheService;
  private memoryCache: Map<string, CacheItem<any>> = new Map();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MEMORY_MAX_SIZE = 50 * 1024 * 1024; // 50MB in memory
  private readonly MEMORY_MAX_ITEMS = 1000; // Maximum items in memory
  private readonly INDEXEDDB_MAX_SIZE = 200 * 1024 * 1024; // 200MB in IndexedDB
  
  // Performance metrics
  private stats: CacheStats = {
    memorySize: 0,
    memoryMaxSize: this.MEMORY_MAX_SIZE,
    indexedDbSize: 0,
    hitRatio: 0,
    hits: 0,
    misses: 0,
    totalQueries: 0,
  };
  
  private dbPromise: Promise<IDBDatabase> | null = null;
  private readonly DB_NAME = 'ArchiSiteCache';
  private readonly DB_VERSION = 1;
  private readonly STORE_NAME = 'queryCache';

  private constructor() {
    this.initIndexedDB();
    this.startCleanupInterval();
    this.startMetricsCollection();
  }

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return EnhancedCacheService.instance;
  }

  /**
   * Initialize IndexedDB for persistent caching
   */
  private async initIndexedDB(): Promise<void> {
    if (!('indexedDB' in window)) {
      console.warn('[CacheService] IndexedDB not supported, using memory-only cache');
      return;
    }

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);
      
      request.onerror = () => {
        console.error('[CacheService] Failed to open IndexedDB:', request.error);
        reject(request.error);
      };
      
      request.onsuccess = () => {
        resolve(request.result);
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          const store = db.createObjectStore(this.STORE_NAME, { keyPath: 'key' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('lastAccessed', 'lastAccessed', { unique: false });
        }
      };
    });
  }

  /**
   * Get database instance
   */
  private async getDB(): Promise<IDBDatabase | null> {
    if (!this.dbPromise) return null;
    
    try {
      return await this.dbPromise;
    } catch (error) {
      console.error('[CacheService] Failed to get DB:', error);
      return null;
    }
  }

  /**
   * Generate cache key with better collision resistance
   */
  private generateKey(query: string, params: any[] = []): string {
    const paramsString = params.length > 0 ? JSON.stringify(params) : '';
    // Use a simple hash for better key generation
    const combined = `${query}:${paramsString}`;
    return this.simpleHash(combined);
  }

  /**
   * Simple hash function for key generation
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `cache_${Math.abs(hash).toString(36)}`;
  }

  /**
   * Estimate object size in bytes
   */
  private estimateSize(obj: any): number {
    const str = JSON.stringify(obj);
    return new Blob([str]).size;
  }

  /**
   * Check if cache item is valid
   */
  private isValid<T>(item: CacheItem<T>): boolean {
    return Date.now() - item.timestamp < item.ttl;
  }

  /**
   * Get data from memory cache first, then IndexedDB
   */
  public async get<T>(query: string, params: any[] = []): Promise<T | null> {
    const key = this.generateKey(query, params);
    this.stats.totalQueries++;
    
    // Try memory cache first
    const memoryItem = this.memoryCache.get(key);
    if (memoryItem && this.isValid(memoryItem)) {
      memoryItem.accessCount++;
      memoryItem.lastAccessed = Date.now();
      this.stats.hits++;
      this.updateHitRatio();
      return memoryItem.data;
    }
    
    // Remove invalid item from memory
    if (memoryItem) {
      this.memoryCache.delete(key);
      this.updateMemoryStats();
    }
    
    // Try IndexedDB
    const dbItem = await this.getFromIndexedDB<T>(key);
    if (dbItem && this.isValid(dbItem)) {
      // Promote to memory cache
      this.setInMemory(key, dbItem.data, dbItem.ttl, dbItem.accessCount + 1);
      this.stats.hits++;
      this.updateHitRatio();
      return dbItem.data;
    }
    
    this.stats.misses++;
    this.updateHitRatio();
    return null;
  }

  /**
   * Set data in both memory and IndexedDB
   */
  public async set<T>(query: string, data: T, params: any[] = [], ttl?: number): Promise<void> {
    const key = this.generateKey(query, params);
    const finalTtl = ttl || this.DEFAULT_TTL;
    
    // Set in memory cache
    this.setInMemory(key, data, finalTtl);
    
    // Set in IndexedDB for persistence
    await this.setInIndexedDB(key, data, finalTtl);
  }

  /**
   * Set data in memory cache with intelligent eviction
   */
  private setInMemory<T>(key: string, data: T, ttl: number, accessCount = 1): void {
    const size = this.estimateSize(data);
    
    // Check if we need to evict items
    this.evictIfNecessary(size);
    
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      accessCount,
      lastAccessed: Date.now(),
      size,
    };
    
    this.memoryCache.set(key, item);
    this.updateMemoryStats();
  }

  /**
   * Intelligent cache eviction using LRU + LFU hybrid
   */
  private evictIfNecessary(newItemSize: number): void {
    // Check item count limit
    while (this.memoryCache.size >= this.MEMORY_MAX_ITEMS) {
      this.evictLeastUsed();
    }
    
    // Check memory size limit
    while (this.stats.memorySize + newItemSize > this.MEMORY_MAX_SIZE && this.memoryCache.size > 0) {
      this.evictLeastUsed();
    }
  }

  /**
   * Evict least recently and least frequently used item
   */
  private evictLeastUsed(): void {
    let leastUsedKey = '';
    let leastUsedScore = Infinity;
    
    for (const [key, item] of this.memoryCache.entries()) {
      // Combine recency and frequency (lower score = more likely to evict)
      const recencyScore = Date.now() - item.lastAccessed;
      const frequencyScore = 1 / (item.accessCount + 1);
      const combinedScore = recencyScore * frequencyScore;
      
      if (combinedScore < leastUsedScore) {
        leastUsedScore = combinedScore;
        leastUsedKey = key;
      }
    }
    
    if (leastUsedKey) {
      this.memoryCache.delete(leastUsedKey);
      this.updateMemoryStats();
    }
  }

  /**
   * Get data from IndexedDB
   */
  private async getFromIndexedDB<T>(key: string): Promise<CacheItem<T> | null> {
    const db = await this.getDB();
    if (!db) return null;
    
    return new Promise((resolve) => {
      const transaction = db.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.get(key);
      
      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          // Update access count in IndexedDB
          this.updateIndexedDBAccess(key, result.accessCount + 1);
          resolve({
            data: result.data,
            timestamp: result.timestamp,
            ttl: result.ttl,
            accessCount: result.accessCount,
            lastAccessed: Date.now(),
          });
        } else {
          resolve(null);
        }
      };
      
      request.onerror = () => {
        console.error('[CacheService] IndexedDB get error:', request.error);
        resolve(null);
      };
    });
  }

  /**
   * Set data in IndexedDB
   */
  private async setInIndexedDB<T>(key: string, data: T, ttl: number): Promise<void> {
    const db = await this.getDB();
    if (!db) return;
    
    const item = {
      key,
      data,
      timestamp: Date.now(),
      ttl,
      accessCount: 1,
      lastAccessed: Date.now(),
    };
    
    return new Promise((resolve) => {
      const transaction = db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.put(item);
      
      request.onsuccess = () => resolve();
      request.onerror = () => {
        console.error('[CacheService] IndexedDB set error:', request.error);
        resolve();
      };
    });
  }

  /**
   * Update access count in IndexedDB
   */
  private async updateIndexedDBAccess(key: string, accessCount: number): Promise<void> {
    const db = await this.getDB();
    if (!db) return;
    
    const transaction = db.transaction([this.STORE_NAME], 'readwrite');
    const store = transaction.objectStore(this.STORE_NAME);
    
    const getRequest = store.get(key);
    getRequest.onsuccess = () => {
      const item = getRequest.result;
      if (item) {
        item.accessCount = accessCount;
        item.lastAccessed = Date.now();
        store.put(item);
      }
    };
  }

  /**
   * Update memory statistics
   */
  private updateMemoryStats(): void {
    let totalSize = 0;
    for (const item of this.memoryCache.values()) {
      totalSize += item.size || 0;
    }
    this.stats.memorySize = totalSize;
  }

  /**
   * Update hit ratio
   */
  private updateHitRatio(): void {
    this.stats.hitRatio = this.stats.totalQueries > 0 
      ? this.stats.hits / this.stats.totalQueries 
      : 0;
  }

  /**
   * Clear expired entries from both memory and IndexedDB
   */
  public async clearExpired(): Promise<number> {
    let removedCount = 0;
    const now = Date.now();
    
    // Clear from memory
    for (const [key, item] of this.memoryCache.entries()) {
      if (now - item.timestamp >= item.ttl) {
        this.memoryCache.delete(key);
        removedCount++;
      }
    }
    
    // Clear from IndexedDB
    const db = await this.getDB();
    if (db) {
      const transaction = db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const index = store.index('timestamp');
      
      const range = IDBKeyRange.upperBound(now - this.DEFAULT_TTL);
      const request = index.openCursor(range);
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          removedCount++;
          cursor.continue();
        }
      };
    }
    
    this.updateMemoryStats();
    return removedCount;
  }

  /**
   * Clear all cache entries
   */
  public async clear(): Promise<void> {
    this.memoryCache.clear();
    this.updateMemoryStats();
    
    const db = await this.getDB();
    if (db) {
      const transaction = db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      store.clear();
    }
    
    // Reset stats
    this.stats.hits = 0;
    this.stats.misses = 0;
    this.stats.totalQueries = 0;
    this.stats.hitRatio = 0;
  }

  /**
   * Get comprehensive cache statistics
   */
  public getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Cached wrapper for async functions with enhanced features
   */
  public async cachedQuery<T>(
    query: string,
    queryFn: () => Promise<T>,
    params: any[] = [],
    ttl?: number
  ): Promise<T> {
    // Check cache first
    const cached = await this.get<T>(query, params);
    if (cached !== null) {
      console.log(`[CacheService] Cache hit for query: ${query.slice(0, 50)}...`);
      return cached;
    }

    // Execute query and cache result
    console.log(`[CacheService] Cache miss for query: ${query.slice(0, 50)}...`);
    const result = await queryFn();
    await this.set(query, result, params, ttl);
    
    return result;
  }

  /**
   * Start automatic cleanup of expired cache entries
   */
  private startCleanupInterval(): void {
    setInterval(async () => {
      const removed = await this.clearExpired();
      if (removed > 0) {
        console.log(`[CacheService] Cleaned up ${removed} expired cache entries`);
      }
    }, 2 * 60 * 1000); // Run every 2 minutes
  }

  /**
   * Start metrics collection
   */
  private startMetricsCollection(): void {
    setInterval(() => {
      console.log(`[CacheService] Stats:`, {
        hitRatio: `${(this.stats.hitRatio * 100).toFixed(1)}%`,
        memoryUsage: `${(this.stats.memorySize / 1024 / 1024).toFixed(1)}MB`,
        totalQueries: this.stats.totalQueries,
        cacheSize: this.memoryCache.size,
      });
    }, 5 * 60 * 1000); // Log every 5 minutes
  }

  /**
   * Warm up cache with important queries
   */
  public async warmUp(criticalQueries: Array<{ query: string; params?: any[] }>): Promise<void> {
    console.log('[CacheService] Starting cache warm-up...');
    
    for (const { query, params = [] } of criticalQueries) {
      try {
        await this.get(query, params);
      } catch (error) {
        console.warn(`[CacheService] Failed to warm up query: ${query}`, error);
      }
    }
    
    console.log('[CacheService] Cache warm-up completed');
  }
}

export default CacheService;