/**
 * Enhanced Service Worker for Japanese Architecture Database
 * Provides offline functionality with intelligent caching strategies
 */

const CACHE_VERSION = 'archi-site-v1.2.0';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const API_CACHE = `${CACHE_VERSION}-api`;
const DATABASE_CACHE = `${CACHE_VERSION}-database`;

// Cache strategies for different resource types
const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
  NETWORK_ONLY: 'network-only',
  CACHE_ONLY: 'cache-only'
};

// Static assets that should always be cached
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/static/js/main.js',
  '/static/css/main.css',
  '/images/shinkenchiku-data-logo.svg',
  '/images/shinkenchiku-favicon.ico',
  // Database worker
  '/sqlite.worker.js',
  '/sql-wasm.wasm',
];

// Database files for offline access
const DATABASE_ASSETS = [
  '/db/archimap.sqlite',
  '/db/archimap.sqlite.suffix',
  '/db/database-info.json',
];

// API patterns for caching
const API_PATTERNS = [
  /\/api\/architecture\/*/,
  /\/api\/architects\/*/,
  /\/api\/search\/*/,
];

// Maximum cache sizes (in MB)
const MAX_CACHE_SIZES = {
  [STATIC_CACHE]: 50,
  [DYNAMIC_CACHE]: 100,
  [API_CACHE]: 200,
  [DATABASE_CACHE]: 500,
};

// Cache TTL (in milliseconds)
const CACHE_TTL = {
  STATIC: 7 * 24 * 60 * 60 * 1000, // 7 days
  DYNAMIC: 24 * 60 * 60 * 1000,    // 1 day
  API: 30 * 60 * 1000,             // 30 minutes
  DATABASE: 30 * 24 * 60 * 60 * 1000, // 30 days
};

/**
 * Install event - cache static assets
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      
      // Cache database assets with error handling
      caches.open(DATABASE_CACHE).then(async (cache) => {
        console.log('[SW] Caching database assets');
        
        for (const asset of DATABASE_ASSETS) {
          try {
            await cache.add(asset);
          } catch (error) {
            console.warn(`[SW] Failed to cache database asset: ${asset}`, error);
          }
        }
      }),
    ])
  );
  
  // Force activation of new service worker
  self.skipWaiting();
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      cleanupOldCaches(),
      
      // Claim all clients
      self.clients.claim(),
      
      // Initialize background sync
      initializeBackgroundSync(),
    ])
  );
});

/**
 * Fetch event - handle all network requests
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Determine caching strategy based on URL
  const strategy = getCachingStrategy(url, request);
  
  event.respondWith(
    handleRequest(request, strategy)
      .catch((error) => {
        console.error('[SW] Request failed:', error);
        return getFallbackResponse(request);
      })
  );
});

/**
 * Background sync for offline actions
 */
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(handleBackgroundSync());
  }
});

/**
 * Message event for cache management
 */
self.addEventListener('message', (event) => {
  const { type, payload } = event.data;
  
  switch (type) {
    case 'CACHE_WARM_UP':
      event.waitUntil(warmUpCache(payload.urls));
      break;
      
    case 'CLEAR_CACHE':
      event.waitUntil(clearSpecificCache(payload.cacheName));
      break;
      
    case 'GET_CACHE_STATS':
      event.waitUntil(getCacheStats().then(stats => {
        event.ports[0].postMessage(stats);
      }));
      break;
      
    default:
      console.warn('[SW] Unknown message type:', type);
  }
});

/**
 * Determine caching strategy for a request
 */
function getCachingStrategy(url, request) {
  // Static assets - cache first
  if (STATIC_ASSETS.some(asset => url.pathname.endsWith(asset))) {
    return CACHE_STRATEGIES.CACHE_FIRST;
  }
  
  // Database files - cache first with long TTL
  if (DATABASE_ASSETS.some(asset => url.pathname.includes(asset))) {
    return CACHE_STRATEGIES.CACHE_FIRST;
  }
  
  // API requests - stale while revalidate
  if (API_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    return CACHE_STRATEGIES.STALE_WHILE_REVALIDATE;
  }
  
  // Dynamic content - network first
  if (url.pathname.includes('/architecture/') || url.pathname.includes('/architects/')) {
    return CACHE_STRATEGIES.NETWORK_FIRST;
  }
  
  // Search requests - network first with short cache
  if (url.pathname.includes('/search') || url.searchParams.has('search')) {
    return CACHE_STRATEGIES.NETWORK_FIRST;
  }
  
  // Default to network first
  return CACHE_STRATEGIES.NETWORK_FIRST;
}

/**
 * Handle request with specified strategy
 */
async function handleRequest(request, strategy) {
  const cacheName = getCacheNameForRequest(request);
  
  switch (strategy) {
    case CACHE_STRATEGIES.CACHE_FIRST:
      return cacheFirst(request, cacheName);
      
    case CACHE_STRATEGIES.NETWORK_FIRST:
      return networkFirst(request, cacheName);
      
    case CACHE_STRATEGIES.STALE_WHILE_REVALIDATE:
      return staleWhileRevalidate(request, cacheName);
      
    case CACHE_STRATEGIES.CACHE_ONLY:
      return cacheOnly(request, cacheName);
      
    case CACHE_STRATEGIES.NETWORK_ONLY:
    default:
      return fetch(request);
  }
}

/**
 * Cache first strategy
 */
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  if (cached && !isExpired(cached)) {
    return cached;
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      await cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    if (cached) {
      console.log('[SW] Network failed, serving stale cache');
      return cached;
    }
    throw error;
  }
}

/**
 * Network first strategy
 */
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      await cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) {
      console.log('[SW] Network failed, serving cache');
      return cached;
    }
    throw error;
  }
}

/**
 * Stale while revalidate strategy
 */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  // Always fetch in background to update cache
  const fetchPromise = fetch(request).then(response => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(error => {
    console.warn('[SW] Background fetch failed:', error);
  });
  
  // Return cached version immediately if available
  if (cached && !isExpired(cached)) {
    // Don't await the fetch promise - let it update in background
    fetchPromise;
    return cached;
  }
  
  // Wait for network if no cache or expired
  return fetchPromise;
}

/**
 * Cache only strategy
 */
async function cacheOnly(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  if (!cached) {
    throw new Error('No cached response available');
  }
  
  return cached;
}

/**
 * Get appropriate cache name for request
 */
function getCacheNameForRequest(request) {
  const url = new URL(request.url);
  
  if (STATIC_ASSETS.some(asset => url.pathname.endsWith(asset))) {
    return STATIC_CACHE;
  }
  
  if (DATABASE_ASSETS.some(asset => url.pathname.includes(asset))) {
    return DATABASE_CACHE;
  }
  
  if (API_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    return API_CACHE;
  }
  
  return DYNAMIC_CACHE;
}

/**
 * Check if cached response is expired
 */
function isExpired(response) {
  const cacheDate = response.headers.get('sw-cache-date');
  if (!cacheDate) return false;
  
  const age = Date.now() - parseInt(cacheDate);
  const url = new URL(response.url);
  
  // Different TTL for different content types
  if (DATABASE_ASSETS.some(asset => url.pathname.includes(asset))) {
    return age > CACHE_TTL.DATABASE;
  }
  
  if (STATIC_ASSETS.some(asset => url.pathname.endsWith(asset))) {
    return age > CACHE_TTL.STATIC;
  }
  
  if (API_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    return age > CACHE_TTL.API;
  }
  
  return age > CACHE_TTL.DYNAMIC;
}

/**
 * Clean up old caches
 */
async function cleanupOldCaches() {
  const cacheNames = await caches.keys();
  const currentCaches = [STATIC_CACHE, DYNAMIC_CACHE, API_CACHE, DATABASE_CACHE];
  
  const deletePromises = cacheNames
    .filter(cacheName => !currentCaches.includes(cacheName))
    .map(cacheName => {
      console.log('[SW] Deleting old cache:', cacheName);
      return caches.delete(cacheName);
    });
  
  await Promise.all(deletePromises);
  
  // Also clean up oversized caches
  await cleanupOversizedCaches();
}

/**
 * Clean up oversized caches
 */
async function cleanupOversizedCaches() {
  for (const [cacheName, maxSize] of Object.entries(MAX_CACHE_SIZES)) {
    try {
      await limitCacheSize(cacheName, maxSize);
    } catch (error) {
      console.error(`[SW] Failed to limit cache size for ${cacheName}:`, error);
    }
  }
}

/**
 * Limit cache size by removing oldest entries
 */
async function limitCacheSize(cacheName, maxSizeMB) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  
  if (keys.length === 0) return;
  
  // Estimate total size
  let totalSize = 0;
  const entries = [];
  
  for (const key of keys) {
    const response = await cache.match(key);
    if (response) {
      const size = await estimateResponseSize(response);
      totalSize += size;
      entries.push({ key, size, date: response.headers.get('sw-cache-date') || '0' });
    }
  }
  
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  
  if (totalSize <= maxSizeBytes) return;
  
  // Sort by date (oldest first)
  entries.sort((a, b) => parseInt(a.date) - parseInt(b.date));
  
  // Remove oldest entries until under limit
  let currentSize = totalSize;
  for (const entry of entries) {
    if (currentSize <= maxSizeBytes) break;
    
    await cache.delete(entry.key);
    currentSize -= entry.size;
    console.log(`[SW] Removed cached item: ${entry.key.url}`);
  }
}

/**
 * Estimate response size
 */
async function estimateResponseSize(response) {
  try {
    const clone = response.clone();
    const arrayBuffer = await clone.arrayBuffer();
    return arrayBuffer.byteLength;
  } catch {
    // Fallback estimation
    return 1024; // 1KB default
  }
}

/**
 * Get fallback response for failed requests
 */
function getFallbackResponse(request) {
  const url = new URL(request.url);
  
  // Return offline page for navigation requests
  if (request.mode === 'navigate') {
    return caches.match('/offline.html') || new Response(
      '<!DOCTYPE html><html><body><h1>オフライン</h1><p>インターネット接続を確認してください。</p></body></html>',
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }
  
  // Return empty response for API requests
  if (API_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    return new Response(
      JSON.stringify({ error: 'オフライン', data: [] }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }
  
  // Return 503 for other requests
  return new Response('Service Unavailable', { status: 503 });
}

/**
 * Warm up cache with important URLs
 */
async function warmUpCache(urls) {
  console.log('[SW] Warming up cache with', urls.length, 'URLs');
  
  const cache = await caches.open(DYNAMIC_CACHE);
  const fetchPromises = urls.map(async (url) => {
    try {
      const response = await fetch(url);
      if (response.ok) {
        await cache.put(url, response);
      }
    } catch (error) {
      console.warn(`[SW] Failed to warm up cache for ${url}:`, error);
    }
  });
  
  await Promise.all(fetchPromises);
  console.log('[SW] Cache warm-up completed');
}

/**
 * Clear specific cache
 */
async function clearSpecificCache(cacheName) {
  if (cacheName) {
    await caches.delete(cacheName);
    console.log(`[SW] Cleared cache: ${cacheName}`);
  } else {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => caches.delete(name)));
    console.log('[SW] Cleared all caches');
  }
}

/**
 * Get cache statistics
 */
async function getCacheStats() {
  const cacheNames = await caches.keys();
  const stats = {};
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    
    let totalSize = 0;
    for (const key of keys) {
      const response = await cache.match(key);
      if (response) {
        totalSize += await estimateResponseSize(response);
      }
    }
    
    stats[cacheName] = {
      entries: keys.length,
      size: totalSize,
      sizeFormatted: `${(totalSize / 1024 / 1024).toFixed(2)} MB`
    };
  }
  
  return stats;
}

/**
 * Initialize background sync
 */
async function initializeBackgroundSync() {
  // Register for background sync when online
  if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
    try {
      await self.registration.sync.register('background-sync');
      console.log('[SW] Background sync registered');
    } catch (error) {
      console.warn('[SW] Background sync registration failed:', error);
    }
  }
}

/**
 * Handle background sync
 */
async function handleBackgroundSync() {
  console.log('[SW] Handling background sync...');
  
  // Here you would handle any queued offline actions
  // For example, sync search history, upload analytics, etc.
  
  try {
    // Example: Sync cached search queries
    await syncCachedData();
    console.log('[SW] Background sync completed');
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
    throw error; // This will retry the sync later
  }
}

/**
 * Sync cached data when back online
 */
async function syncCachedData() {
  // Implementation would depend on specific sync requirements
  // For example, sending analytics data, updating search indices, etc.
  console.log('[SW] Syncing cached data...');
}

console.log('[SW] Service worker script loaded');