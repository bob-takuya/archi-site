/**
 * Mobile optimization configuration
 */

export interface MobileConfig {
  // Touch and gesture settings
  touch: {
    minSwipeDistance: number;
    minSwipeVelocity: number;
    maxSwipeTime: number;
    enableHapticFeedback: boolean;
    touchTargetMinSize: number;
    longPressDelay: number;
    doubleTapDelay: number;
  };

  // Performance settings
  performance: {
    enableLazyLoading: boolean;
    enableImageOptimization: boolean;
    enableServiceWorker: boolean;
    enableBackgroundSync: boolean;
    cacheMaxAge: number;
    imageQuality: number;
    enableVirtualization: boolean;
    performanceMonitoring: boolean;
  };

  // UI/UX settings
  ui: {
    enablePullToRefresh: boolean;
    enableSwipeNavigation: boolean;
    enableVoiceSearch: boolean;
    enableOfflineMode: boolean;
    showTouchHints: boolean;
    animationDuration: number;
    enableReducedMotion: boolean;
    highContrastMode: boolean;
  };

  // Search and discovery
  search: {
    enableAutocomplete: boolean;
    enableSearchHistory: boolean;
    maxHistoryItems: number;
    debounceDelay: number;
    enableSuggestions: boolean;
    enableFilters: boolean;
  };

  // Data and caching
  data: {
    itemsPerPageMobile: number;
    itemsPerPageTablet: number;
    preloadCriticalResources: boolean;
    enableOfflineStorage: boolean;
    maxCacheSize: number; // in MB
    syncFrequency: number; // in minutes
  };

  // Analytics and monitoring
  analytics: {
    enablePerformanceTracking: boolean;
    enableUserBehaviorTracking: boolean;
    enableErrorTracking: boolean;
    trackOfflineUsage: boolean;
    batchSize: number;
    uploadFrequency: number; // in minutes
  };
}

export const MOBILE_CONFIG: MobileConfig = {
  touch: {
    minSwipeDistance: 50,
    minSwipeVelocity: 0.3,
    maxSwipeTime: 800,
    enableHapticFeedback: true,
    touchTargetMinSize: 44, // WCAG minimum
    longPressDelay: 500,
    doubleTapDelay: 300
  },

  performance: {
    enableLazyLoading: true,
    enableImageOptimization: true,
    enableServiceWorker: true,
    enableBackgroundSync: true,
    cacheMaxAge: 604800, // 7 days
    imageQuality: 80,
    enableVirtualization: false, // Disabled for architecture cards
    performanceMonitoring: true
  },

  ui: {
    enablePullToRefresh: true,
    enableSwipeNavigation: true,
    enableVoiceSearch: true,
    enableOfflineMode: true,
    showTouchHints: true,
    animationDuration: 300,
    enableReducedMotion: false, // Respect user preference
    highContrastMode: false // Respect user preference
  },

  search: {
    enableAutocomplete: true,
    enableSearchHistory: true,
    maxHistoryItems: 10,
    debounceDelay: 300,
    enableSuggestions: true,
    enableFilters: true
  },

  data: {
    itemsPerPageMobile: 8,
    itemsPerPageTablet: 12,
    preloadCriticalResources: true,
    enableOfflineStorage: true,
    maxCacheSize: 50, // 50MB
    syncFrequency: 15 // 15 minutes
  },

  analytics: {
    enablePerformanceTracking: true,
    enableUserBehaviorTracking: true,
    enableErrorTracking: true,
    trackOfflineUsage: true,
    batchSize: 50,
    uploadFrequency: 5 // 5 minutes
  }
};

// Device-specific configurations
export const getDeviceConfig = (viewport: { isMobile: boolean; isTablet: boolean; isDesktop: boolean }) => {
  const baseConfig = { ...MOBILE_CONFIG };

  if (viewport.isMobile) {
    return {
      ...baseConfig,
      touch: {
        ...baseConfig.touch,
        minSwipeDistance: 30, // More sensitive on mobile
        touchTargetMinSize: 48 // Larger targets on mobile
      },
      data: {
        ...baseConfig.data,
        itemsPerPageMobile: 6 // Fewer items for better performance
      },
      performance: {
        ...baseConfig.performance,
        imageQuality: 75 // Lower quality for mobile to save data
      }
    };
  }

  if (viewport.isTablet) {
    return {
      ...baseConfig,
      data: {
        ...baseConfig.data,
        itemsPerPageMobile: baseConfig.data.itemsPerPageTablet
      }
    };
  }

  // Desktop configuration
  return {
    ...baseConfig,
    touch: {
      ...baseConfig.touch,
      enableHapticFeedback: false // No haptic feedback on desktop
    },
    ui: {
      ...baseConfig.ui,
      enablePullToRefresh: false, // No pull to refresh on desktop
      showTouchHints: false
    }
  };
};

// Feature detection utilities
export const getDeviceCapabilities = () => {
  const capabilities = {
    touchScreen: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    vibration: 'vibrate' in navigator,
    speechRecognition: 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window,
    serviceWorker: 'serviceWorker' in navigator,
    localStorage: (() => {
      try {
        return typeof Storage !== 'undefined';
      } catch {
        return false;
      }
    })(),
    geolocation: 'geolocation' in navigator,
    camera: (() => {
      try {
        return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
      } catch {
        return false;
      }
    })(),
    shareApi: 'share' in navigator,
    clipboard: 'clipboard' in navigator,
    backgroundSync: 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype,
    pushNotifications: 'PushManager' in window,
    webGL: (() => {
      try {
        const canvas = document.createElement('canvas');
        return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
      } catch {
        return false;
      }
    })(),
    indexedDB: 'indexedDB' in window,
    webAssembly: 'WebAssembly' in window,
    intersectionObserver: 'IntersectionObserver' in window,
    deviceMotion: 'DeviceMotionEvent' in window,
    deviceOrientation: 'DeviceOrientationEvent' in window,
    fullscreen: document.fullscreenEnabled || (document as any).webkitFullscreenEnabled,
    webShare: 'share' in navigator,
    paymentRequest: 'PaymentRequest' in window
  };

  return capabilities;
};

// Network quality detection
export const getNetworkInfo = () => {
  const connection = (navigator as any).connection || 
                    (navigator as any).mozConnection || 
                    (navigator as any).webkitConnection;

  if (!connection) {
    return {
      effectiveType: 'unknown',
      downlink: 0,
      rtt: 0,
      saveData: false
    };
  }

  return {
    effectiveType: connection.effectiveType || 'unknown',
    downlink: connection.downlink || 0,
    rtt: connection.rtt || 0,
    saveData: connection.saveData || false
  };
};

// Adaptive configuration based on device and network
export const getAdaptiveConfig = () => {
  const capabilities = getDeviceCapabilities();
  const network = getNetworkInfo();
  const viewport = {
    width: window.innerWidth,
    height: window.innerHeight,
    isMobile: window.innerWidth < 768,
    isTablet: window.innerWidth >= 768 && window.innerWidth < 1024,
    isDesktop: window.innerWidth >= 1024
  };

  let config = getDeviceConfig(viewport);

  // Adapt to network conditions
  if (network.effectiveType === 'slow-2g' || network.effectiveType === '2g') {
    config = {
      ...config,
      performance: {
        ...config.performance,
        imageQuality: 60,
        enableImageOptimization: true
      },
      data: {
        ...config.data,
        itemsPerPageMobile: Math.max(4, config.data.itemsPerPageMobile - 2)
      }
    };
  }

  // Adapt to save data preference
  if (network.saveData) {
    config = {
      ...config,
      performance: {
        ...config.performance,
        imageQuality: 50,
        enableImageOptimization: true
      },
      ui: {
        ...config.ui,
        animationDuration: 150 // Faster animations to save battery
      }
    };
  }

  // Disable features if not supported
  if (!capabilities.vibration) {
    config.touch.enableHapticFeedback = false;
  }

  if (!capabilities.speechRecognition) {
    config.ui.enableVoiceSearch = false;
  }

  if (!capabilities.serviceWorker) {
    config.performance.enableServiceWorker = false;
    config.performance.enableBackgroundSync = false;
    config.ui.enableOfflineMode = false;
  }

  return {
    config,
    capabilities,
    network,
    viewport
  };
};

// Performance budgets for mobile
export const PERFORMANCE_BUDGETS = {
  // Core Web Vitals targets
  largestContentfulPaint: 2500, // ms
  firstInputDelay: 100, // ms
  cumulativeLayoutShift: 0.1,
  
  // Custom metrics
  timeToInteractive: 3000, // ms
  firstContentfulPaint: 1500, // ms
  
  // Resource budgets
  totalJavaScript: 300, // KB
  totalCSS: 100, // KB
  totalImages: 1000, // KB per page
  totalFonts: 150, // KB
  
  // Network budgets
  maxRequests: 50,
  maxDomNodes: 1500,
  
  // Memory budgets (mobile)
  maxHeapSize: 100 * 1024 * 1024, // 100MB
  maxImageCacheSize: 50 * 1024 * 1024 // 50MB
};

export default MOBILE_CONFIG;