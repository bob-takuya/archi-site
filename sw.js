const CACHE_NAME = 'archi-site-v1.1.0';
const STATIC_CACHE_NAME = 'archi-site-static-v1.1.0';
const DYNAMIC_CACHE_NAME = 'archi-site-dynamic-v1.1.0';

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/static/js/main.js',
  '/static/css/main.css',
  '/manifest.json',
  '/images/shinkenchiku-data-logo.svg',
  '/images/shinkenchiku-favicon.ico'
];

// API endpoints to cache with network-first strategy
const API_CACHE_PATTERNS = [
  /\/data\/.*\.json$/,
  /\/db\/.*\.sqlite$/,
  /\/locales\/.*\.json$/
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets...');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Static assets cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Failed to cache static assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE_NAME && 
                cacheName !== DYNAMIC_CACHE_NAME &&
                cacheName.startsWith('archi-site-')) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and other non-http(s) URLs
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  // Handle different types of requests
  if (isStaticAsset(request)) {
    // Static assets: cache-first strategy
    event.respondWith(cacheFirst(request, STATIC_CACHE_NAME));
  } else if (isAPIRequest(request)) {
    // API requests: network-first strategy with fallback
    event.respondWith(networkFirstWithFallback(request));
  } else if (isNavigationRequest(request)) {
    // Navigation requests: network-first with offline fallback
    event.respondWith(handleNavigationRequest(request));
  } else {
    // Other requests: network-first strategy
    event.respondWith(networkFirst(request));
  }
});

// Message event - handle cache updates from main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] Received SKIP_WAITING message');
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_UPDATE') {
    console.log('[SW] Received CACHE_UPDATE message');
    updateDynamicCache(event.data.urls);
  }
});

// Helper functions
function isStaticAsset(request) {
  const url = new URL(request.url);
  return url.pathname.includes('/static/') ||
         url.pathname.includes('/images/') ||
         url.pathname.includes('/fonts/') ||
         url.pathname.endsWith('.css') ||
         url.pathname.endsWith('.js') ||
         url.pathname.endsWith('.svg') ||
         url.pathname.endsWith('.ico');
}

function isAPIRequest(request) {
  const url = new URL(request.url);
  return API_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname));
}

function isNavigationRequest(request) {
  return request.mode === 'navigate' ||
         (request.method === 'GET' && 
          request.headers.get('accept') && 
          request.headers.get('accept').includes('text/html'));
}

// Cache-first strategy
function cacheFirst(request, cacheName) {
  return caches.open(cacheName)
    .then((cache) => {
      return cache.match(request)
        .then((response) => {
          if (response) {
            console.log('[SW] Serving from cache:', request.url);
            return response;
          }
          
          console.log('[SW] Fetching and caching:', request.url);
          return fetch(request)
            .then((networkResponse) => {
              if (networkResponse.ok) {
                cache.put(request, networkResponse.clone());
              }
              return networkResponse;
            });
        });
    });
}

// Network-first strategy
function networkFirst(request) {
  return fetch(request)
    .then((response) => {
      if (response.ok) {
        // Cache successful responses
        caches.open(DYNAMIC_CACHE_NAME)
          .then((cache) => {
            cache.put(request, response.clone());
          });
      }
      return response;
    })
    .catch(() => {
      // Fallback to cache if network fails
      return caches.match(request);
    });
}

// Network-first with intelligent fallback for API requests
function networkFirstWithFallback(request) {
  return fetch(request)
    .then((response) => {
      if (response.ok) {
        // Cache successful API responses
        caches.open(DYNAMIC_CACHE_NAME)
          .then((cache) => {
            cache.put(request, response.clone());
          });
        return response;
      }
      throw new Error('Network response not ok');
    })
    .catch((error) => {
      console.log('[SW] Network failed for API request, checking cache:', request.url);
      
      return caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            console.log('[SW] Serving stale API data from cache:', request.url);
            return cachedResponse;
          }
          
          // Return offline fallback for specific API endpoints
          return createOfflineFallback(request);
        });
    });
}

// Handle navigation requests with offline fallback
function handleNavigationRequest(request) {
  return fetch(request)
    .then((response) => {
      if (response.ok) {
        return response;
      }
      throw new Error('Navigation request failed');
    })
    .catch(() => {
      console.log('[SW] Serving offline fallback for navigation');
      return caches.match('/') || caches.match('/index.html');
    });
}

// Create offline fallback responses
function createOfflineFallback(request) {
  const url = new URL(request.url);
  
  if (url.pathname.includes('/data/') && url.pathname.endsWith('.json')) {
    // Return empty data structure for JSON endpoints
    return new Response(JSON.stringify({
      results: [],
      total: 0,
      page: 1,
      offline: true,
      message: 'オフライン状態です。インターネット接続を確認してください。'
    }), {
      headers: {
        'Content-Type': 'application/json',
        'X-Offline-Fallback': 'true'
      }
    });
  }
  
  // Return generic offline response
  return new Response('Offline - インターネット接続を確認してください', {
    status: 503,
    statusText: 'Service Unavailable',
    headers: {
      'Content-Type': 'text/plain',
      'X-Offline-Fallback': 'true'
    }
  });
}

// Update dynamic cache with new URLs
function updateDynamicCache(urls) {
  if (!Array.isArray(urls)) return;
  
  caches.open(DYNAMIC_CACHE_NAME)
    .then((cache) => {
      return Promise.all(
        urls.map((url) => {
          return fetch(url)
            .then((response) => {
              if (response.ok) {
                return cache.put(url, response);
              }
            })
            .catch((error) => {
              console.warn('[SW] Failed to cache URL:', url, error);
            });
        })
      );
    })
    .then(() => {
      console.log('[SW] Dynamic cache updated with new URLs');
    });
}

// Background sync for offline actions (if supported)
if ('sync' in self.registration) {
  self.addEventListener('sync', (event) => {
    if (event.tag === 'background-sync') {
      console.log('[SW] Background sync triggered');
      event.waitUntil(doBackgroundSync());
    }
  });
}

function doBackgroundSync() {
  // Implement background sync logic here
  // For example, sync offline search queries or user preferences
  return Promise.resolve();
}

// Periodic background sync (if supported)
if ('periodicSync' in self.registration) {
  self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'update-cache') {
      event.waitUntil(updateCache());
    }
  });
}

function updateCache() {
  console.log('[SW] Periodic cache update');
  // Update cache with fresh data periodically
  return caches.open(DYNAMIC_CACHE_NAME)
    .then((cache) => {
      // Update frequently accessed resources
      return cache.addAll([
        '/data/metadata.json',
        '/data/page_1.json'
      ]);
    });
}

console.log('[SW] Service Worker loaded successfully');