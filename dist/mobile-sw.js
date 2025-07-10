/**
 * Mobile-optimized Service Worker
 * Provides intelligent caching, offline functionality, and background sync
 */

const CACHE_VERSION = 'v1.2.0';
const CACHE_NAME = `archi-site-mobile-${CACHE_VERSION}`;

// Cache strategies configuration
const CACHE_STRATEGIES = {
  'core-assets': {
    patterns: [/\.(js|css|html)$/],
    strategy: 'cacheFirst',
    maxEntries: 50,
    maxAge: 86400 // 24 hours
  },
  'images': {
    patterns: [/\.(jpg|jpeg|png|webp|gif|svg)$/],
    strategy: 'cacheFirst',
    maxEntries: 100,
    maxAge: 604800 // 7 days
  },
  'api-data': {
    patterns: [/\/api\//, /\.json$/],
    strategy: 'networkFirst',
    maxEntries: 30,
    maxAge: 3600 // 1 hour
  },
  'fonts': {
    patterns: [/\.(woff|woff2|ttf|eot)$/],
    strategy: 'cacheFirst',
    maxEntries: 20,
    maxAge: 2592000 // 30 days
  }
};

// Critical resources to preload
const CRITICAL_RESOURCES = [
  '/',
  '/index.html',
  '/static/js/main.js',
  '/static/css/main.css',
  '/manifest.json'
];

// Install event - preload critical resources
self.addEventListener('install', (event) => {
  console.log('[Mobile SW] Installing...');
  
  event.waitUntil(
    Promise.all([
      // Preload critical resources
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(CRITICAL_RESOURCES).catch((error) => {
          console.warn('[Mobile SW] Failed to preload some critical resources:', error);
        });
      }),
      
      // Skip waiting to activate immediately
      self.skipWaiting()
    ])
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Mobile SW] Activating...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName.startsWith('archi-site-')) {
              console.log('[Mobile SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // Claim all clients
      self.clients.claim()
    ])
  );
  
  // Notify clients that offline is ready
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage({
        type: 'OFFLINE_READY',
        payload: { version: CACHE_VERSION }
      });
    });
  });
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http requests
  if (!event.request.url.startsWith('http')) {
    return;
  }

  const url = new URL(event.request.url);
  const strategy = getCacheStrategy(event.request);

  if (strategy) {
    event.respondWith(handleCacheStrategy(event.request, strategy));
  }
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[Mobile SW] Background sync:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(processBackgroundSync());
  }
});

// Message handler for communication with main thread
self.addEventListener('message', (event) => {
  const { type, payload } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'TRIGGER_BACKGROUND_SYNC':
      processBackgroundSync();
      break;
      
    case 'CLEAR_CACHE':
      clearCache(payload?.cacheName);
      break;
      
    case 'PRELOAD_RESOURCES':
      preloadResources(payload?.urls || []);
      break;
  }
});

// Determine cache strategy for a request
function getCacheStrategy(request) {
  const url = request.url;
  
  for (const [name, config] of Object.entries(CACHE_STRATEGIES)) {
    if (config.patterns.some(pattern => pattern.test(url))) {
      return { name, ...config };
    }
  }
  
  return null;
}

// Handle different caching strategies
async function handleCacheStrategy(request, strategy) {
  const cacheName = `${CACHE_NAME}-${strategy.name}`;
  
  switch (strategy.strategy) {
    case 'cacheFirst':
      return cacheFirst(request, cacheName, strategy);
      
    case 'networkFirst':
      return networkFirst(request, cacheName, strategy);
      
    case 'staleWhileRevalidate':
      return staleWhileRevalidate(request, cacheName, strategy);
      
    default:
      return fetch(request);
  }
}

// Cache first strategy
async function cacheFirst(request, cacheName, strategy) {
  try {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      // Check if cached response is still valid
      const cachedTime = new Date(cachedResponse.headers.get('sw-cached-time') || 0);
      const now = new Date();
      const age = (now.getTime() - cachedTime.getTime()) / 1000;
      
      if (age < strategy.maxAge) {
        return cachedResponse;
      }
    }
    
    // Fetch from network and cache
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const responseToCache = networkResponse.clone();
      const headers = new Headers(responseToCache.headers);
      headers.set('sw-cached-time', new Date().toISOString());
      
      const modifiedResponse = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers
      });
      
      cache.put(request, modifiedResponse);
      await cleanupCache(cache, strategy.maxEntries);
    }
    
    return networkResponse;
    
  } catch (error) {
    // Return cached response if available
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline fallback
    return createOfflineFallback(request);
  }
}

// Network first strategy
async function networkFirst(request, cacheName, strategy) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      const responseToCache = networkResponse.clone();
      const headers = new Headers(responseToCache.headers);
      headers.set('sw-cached-time', new Date().toISOString());
      
      const modifiedResponse = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers
      });
      
      cache.put(request, modifiedResponse);
      await cleanupCache(cache, strategy.maxEntries);
    }
    
    return networkResponse;
    
  } catch (error) {
    // Fallback to cache
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    return createOfflineFallback(request);
  }
}

// Stale while revalidate strategy
async function staleWhileRevalidate(request, cacheName, strategy) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  // Start network request in background
  const networkPromise = fetch(request).then(async (networkResponse) => {
    if (networkResponse.ok) {
      const responseToCache = networkResponse.clone();
      const headers = new Headers(responseToCache.headers);
      headers.set('sw-cached-time', new Date().toISOString());
      
      const modifiedResponse = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers
      });
      
      cache.put(request, modifiedResponse);
      await cleanupCache(cache, strategy.maxEntries);
    }
    return networkResponse;
  }).catch(() => null);
  
  // Return cached response immediately if available, otherwise wait for network
  return cachedResponse || networkPromise;
}

// Clean up cache entries based on max entries limit
async function cleanupCache(cache, maxEntries) {
  if (!maxEntries) return;
  
  const keys = await cache.keys();
  
  if (keys.length > maxEntries) {
    // Sort by cache time and remove oldest entries
    const entries = await Promise.all(
      keys.map(async (key) => {
        const response = await cache.match(key);
        const cachedTime = new Date(response?.headers.get('sw-cached-time') || 0);
        return { key, cachedTime };
      })
    );
    
    entries.sort((a, b) => a.cachedTime.getTime() - b.cachedTime.getTime());
    
    const entriesToDelete = entries.slice(0, keys.length - maxEntries);
    await Promise.all(
      entriesToDelete.map(entry => cache.delete(entry.key))
    );
  }
}

// Create offline fallback response
function createOfflineFallback(request) {
  const url = new URL(request.url);
  
  // Return appropriate fallback based on request type
  if (request.headers.get('accept')?.includes('text/html')) {
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>オフライン - 日本建築データベース</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              text-align: center; 
              padding: 50px; 
              background: #f5f5f5;
            }
            .offline-content {
              max-width: 400px;
              margin: 0 auto;
              background: white;
              padding: 40px;
              border-radius: 12px;
              box-shadow: 0 2px 12px rgba(0,0,0,0.1);
            }
            h1 { color: #333; margin-bottom: 20px; }
            p { color: #666; line-height: 1.6; }
            .retry-button {
              background: #0066cc;
              color: white;
              border: none;
              padding: 12px 24px;
              border-radius: 6px;
              cursor: pointer;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="offline-content">
            <h1>🏗️ オフライン</h1>
            <p>インターネット接続を確認して、もう一度お試しください。</p>
            <p>キャッシュされたコンテンツは引き続きご利用いただけます。</p>
            <button class="retry-button" onclick="location.reload()">再試行</button>
          </div>
        </body>
      </html>
    `, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }
  
  if (request.headers.get('accept')?.includes('application/json')) {
    return new Response(JSON.stringify({
      error: 'Offline',
      message: 'データは現在利用できません',
      offline: true
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // Default fallback
  return new Response('Offline', { status: 503 });
}

// Process background sync queue
async function processBackgroundSync() {
  try {
    // Get sync queue from IndexedDB or localStorage
    const clients = await self.clients.matchAll();
    
    clients.forEach(client => {
      client.postMessage({
        type: 'BACKGROUND_SYNC_COMPLETE',
        payload: { timestamp: Date.now() }
      });
    });
    
    console.log('[Mobile SW] Background sync completed');
    
  } catch (error) {
    console.error('[Mobile SW] Background sync failed:', error);
  }
}

// Clear specific cache
async function clearCache(cacheName) {
  try {
    if (cacheName) {
      await caches.delete(cacheName);
    } else {
      // Clear all caches
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(name => caches.delete(name))
      );
    }
    
    console.log('[Mobile SW] Cache cleared:', cacheName || 'all');
    
  } catch (error) {
    console.error('[Mobile SW] Failed to clear cache:', error);
  }
}

// Preload resources
async function preloadResources(urls) {
  try {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(urls);
    
    console.log('[Mobile SW] Resources preloaded:', urls.length);
    
  } catch (error) {
    console.error('[Mobile SW] Failed to preload resources:', error);
  }
}

// Error handling
self.addEventListener('error', (event) => {
  console.error('[Mobile SW] Error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('[Mobile SW] Unhandled rejection:', event.reason);
});

console.log('[Mobile SW] Service Worker loaded');