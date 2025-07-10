/**
 * Enhanced service worker for mobile offline functionality
 * Provides intelligent caching, background sync, and mobile-optimized strategies
 */

interface CacheStrategy {
  name: string;
  patterns: RegExp[];
  strategy: 'cacheFirst' | 'networkFirst' | 'staleWhileRevalidate';
  maxEntries?: number;
  maxAge?: number; // in seconds
}

interface ServiceWorkerConfig {
  version: string;
  cacheStrategies: CacheStrategy[];
  enableBackgroundSync: boolean;
  enablePushNotifications: boolean;
  enableOfflineAnalytics: boolean;
}

const MOBILE_SW_CONFIG: ServiceWorkerConfig = {
  version: 'v1.2.0',
  cacheStrategies: [
    {
      name: 'core-assets',
      patterns: [/\.(js|css|html)$/],
      strategy: 'cacheFirst',
      maxEntries: 50,
      maxAge: 86400 // 24 hours
    },
    {
      name: 'images',
      patterns: [/\.(jpg|jpeg|png|webp|gif|svg)$/],
      strategy: 'cacheFirst',
      maxEntries: 100,
      maxAge: 604800 // 7 days
    },
    {
      name: 'api-data',
      patterns: [/\/api\//, /\.json$/],
      strategy: 'networkFirst',
      maxEntries: 30,
      maxAge: 3600 // 1 hour
    },
    {
      name: 'fonts',
      patterns: [/\.(woff|woff2|ttf|eot)$/],
      strategy: 'cacheFirst',
      maxEntries: 20,
      maxAge: 2592000 // 30 days
    }
  ],
  enableBackgroundSync: true,
  enablePushNotifications: false,
  enableOfflineAnalytics: true
};

// Service worker registration with mobile-specific options
export const registerMobileServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!('serviceWorker' in navigator)) {
    console.log('Service Worker not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/mobile-sw.js', {
      scope: '/'
    });

    // Handle updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New service worker is available
            showUpdateNotification();
          }
        });
      }
    });

    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);

    console.log('Mobile Service Worker registered successfully');
    return registration;
  } catch (error) {
    console.error('Mobile Service Worker registration failed:', error);
    return null;
  }
};

// Handle messages from service worker
const handleServiceWorkerMessage = (event: MessageEvent) => {
  const { type, payload } = event.data;

  switch (type) {
    case 'OFFLINE_READY':
      showOfflineReadyNotification();
      break;
    case 'CACHE_UPDATED':
      console.log('Cache updated:', payload);
      break;
    case 'BACKGROUND_SYNC_COMPLETE':
      console.log('Background sync completed:', payload);
      break;
    case 'OFFLINE_ANALYTICS':
      handleOfflineAnalytics(payload);
      break;
  }
};

// Show update notification to user
const showUpdateNotification = () => {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('アプリの更新が利用可能です', {
      body: 'ページを再読み込みして最新版をお使いください',
      icon: '/images/notification-icon.png',
      badge: '/images/badge-icon.png',
      tag: 'app-update'
    });
  }
};

// Show offline ready notification
const showOfflineReadyNotification = () => {
  console.log('App is ready for offline use');
  // You can show a user notification here
};

// Handle offline analytics
const handleOfflineAnalytics = (data: any) => {
  // Store offline analytics data
  const offlineAnalytics = JSON.parse(localStorage.getItem('offline-analytics') || '[]');
  offlineAnalytics.push({
    ...data,
    timestamp: Date.now()
  });
  localStorage.setItem('offline-analytics', JSON.stringify(offlineAnalytics));
};

// Check for network connectivity
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Trigger background sync when coming back online
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'TRIGGER_BACKGROUND_SYNC'
        });
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
};

// Cache management utilities
export class MobileCacheManager {
  static async getCacheSize(): Promise<number> {
    if (!('caches' in window)) return 0;

    let totalSize = 0;
    const cacheNames = await caches.keys();

    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const requests = await cache.keys();

      for (const request of requests) {
        const response = await cache.match(request);
        if (response) {
          const size = response.headers.get('content-length');
          totalSize += size ? parseInt(size, 10) : 0;
        }
      }
    }

    return totalSize;
  }

  static async clearOldCaches(keepCacheNames: string[] = []): Promise<void> {
    if (!('caches' in window)) return;

    const cacheNames = await caches.keys();
    const cachesToDelete = cacheNames.filter(name => 
      !keepCacheNames.includes(name) && 
      !name.includes(MOBILE_SW_CONFIG.version)
    );

    await Promise.all(
      cachesToDelete.map(cacheName => caches.delete(cacheName))
    );

    console.log(`Cleared ${cachesToDelete.length} old caches`);
  }

  static async preloadCriticalResources(urls: string[]): Promise<void> {
    if (!('caches' in window)) return;

    const cache = await caches.open(`critical-${MOBILE_SW_CONFIG.version}`);
    
    try {
      await cache.addAll(urls);
      console.log('Critical resources preloaded');
    } catch (error) {
      console.error('Failed to preload critical resources:', error);
    }
  }
}

// Offline data synchronization
export class OfflineDataSync {
  private static readonly SYNC_QUEUE_KEY = 'sync-queue';

  static addToSyncQueue(data: any): void {
    const queue = this.getSyncQueue();
    queue.push({
      id: Date.now().toString(),
      data,
      timestamp: Date.now(),
      retries: 0
    });
    localStorage.setItem(this.SYNC_QUEUE_KEY, JSON.stringify(queue));
  }

  static getSyncQueue(): any[] {
    const queue = localStorage.getItem(this.SYNC_QUEUE_KEY);
    return queue ? JSON.parse(queue) : [];
  }

  static async processSyncQueue(): Promise<void> {
    const queue = this.getSyncQueue();
    if (queue.length === 0) return;

    const processedItems: string[] = [];

    for (const item of queue) {
      try {
        // Process sync item (implement your sync logic here)
        await this.syncItem(item);
        processedItems.push(item.id);
      } catch (error) {
        console.error('Failed to sync item:', error);
        
        // Increment retry count
        item.retries = (item.retries || 0) + 1;
        
        // Remove items that have failed too many times
        if (item.retries > 3) {
          processedItems.push(item.id);
        }
      }
    }

    // Remove processed items from queue
    const remainingQueue = queue.filter(item => 
      !processedItems.includes(item.id)
    );
    localStorage.setItem(this.SYNC_QUEUE_KEY, JSON.stringify(remainingQueue));
  }

  private static async syncItem(item: any): Promise<void> {
    // Implement your specific sync logic here
    // For example, send analytics data, favorites, search history, etc.
    console.log('Syncing item:', item);
  }
}

// Mobile-specific performance monitoring
export class MobilePerformanceMonitor {
  private static metrics: any[] = [];

  static recordMetric(name: string, value: number, tags: Record<string, string> = {}): void {
    this.metrics.push({
      name,
      value,
      tags: {
        ...tags,
        userAgent: navigator.userAgent,
        connection: this.getConnectionInfo(),
        timestamp: Date.now()
      }
    });

    // Keep only last 100 metrics
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }
  }

  static getMetrics(): any[] {
    return [...this.metrics];
  }

  static async sendMetrics(): Promise<void> {
    if (this.metrics.length === 0) return;

    try {
      // Send metrics to your analytics endpoint
      // If offline, add to sync queue
      if (!navigator.onLine) {
        OfflineDataSync.addToSyncQueue({
          type: 'performance-metrics',
          metrics: this.getMetrics()
        });
      } else {
        // Send immediately
        console.log('Sending performance metrics:', this.getMetrics());
        // await fetch('/api/analytics/performance', { ... });
      }
      
      // Clear sent metrics
      this.metrics = [];
    } catch (error) {
      console.error('Failed to send performance metrics:', error);
    }
  }

  private static getConnectionInfo(): string {
    const connection = (navigator as any).connection || 
                     (navigator as any).mozConnection || 
                     (navigator as any).webkitConnection;
    
    if (connection) {
      return `${connection.effectiveType || 'unknown'}-${connection.downlink || 0}mbps`;
    }
    
    return 'unknown';
  }
}

// Auto-initialize performance monitoring
if (typeof window !== 'undefined') {
  // Record page load performance
  window.addEventListener('load', () => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      MobilePerformanceMonitor.recordMetric('page-load-time', navigation.loadEventEnd - navigation.fetchStart);
      MobilePerformanceMonitor.recordMetric('dom-content-loaded', navigation.domContentLoadedEventEnd - navigation.fetchStart);
    }
  });

  // Send metrics periodically
  setInterval(() => {
    MobilePerformanceMonitor.sendMetrics();
  }, 300000); // Every 5 minutes
}

// React hooks for service worker functionality
import { useState, useEffect } from 'react';

export const useServiceWorkerUpdate = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const handleControllerChange = () => {
      window.location.reload();
    };

    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'UPDATE_AVAILABLE') {
        setUpdateAvailable(true);
      }
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
    navigator.serviceWorker.addEventListener('message', handleMessage);

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, []);

  const installUpdate = async () => {
    if (!updateAvailable) return;

    setInstalling(true);
    
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
    }
  };

  return {
    updateAvailable,
    installing,
    installUpdate
  };
};

export default MOBILE_SW_CONFIG;