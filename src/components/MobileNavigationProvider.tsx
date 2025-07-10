/**
 * Mobile navigation provider with enhanced touch gestures and performance monitoring
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Snackbar,
  Alert,
  Box,
  LinearProgress,
  useTheme,
  alpha
} from '@mui/material';
import { useViewportSize } from '../utils/mobileGestures';
import { MobilePerformanceMonitor, useNetworkStatus } from '../utils/mobileServiceWorker';

interface MobileNavigationContextType {
  // Navigation state
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
  
  // Notifications
  showNotification: (message: string, severity?: 'success' | 'info' | 'warning' | 'error') => void;
  
  // Navigation performance
  recordNavigation: (fromPath: string, toPath: string, loadTime: number) => void;
  
  // Haptic feedback
  triggerHaptic: (type?: 'light' | 'medium' | 'heavy') => void;
  
  // Network status
  isOnline: boolean;
  
  // Viewport information
  viewport: {
    width: number;
    height: number;
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
  };
}

const MobileNavigationContext = createContext<MobileNavigationContextType | null>(null);

interface NotificationState {
  open: boolean;
  message: string;
  severity: 'success' | 'info' | 'warning' | 'error';
}

interface MobileNavigationProviderProps {
  children: React.ReactNode;
}

export const MobileNavigationProvider: React.FC<MobileNavigationProviderProps> = ({ children }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const viewport = useViewportSize();
  const isOnline = useNetworkStatus();

  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<NotificationState>({
    open: false,
    message: '',
    severity: 'info'
  });

  // Track navigation performance
  const [navigationStartTime, setNavigationStartTime] = useState<number>(0);
  const [previousPath, setPreviousPath] = useState<string>('');

  // Show notification helper
  const showNotification = useCallback((
    message: string,
    severity: 'success' | 'info' | 'warning' | 'error' = 'info'
  ) => {
    setNotification({
      open: true,
      message,
      severity
    });
  }, []);

  // Close notification
  const handleCloseNotification = useCallback(() => {
    setNotification(prev => ({ ...prev, open: false }));
  }, []);

  // Haptic feedback helper
  const triggerHaptic = useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
    if ('vibrate' in navigator) {
      const patterns = {
        light: [10],
        medium: [50],
        heavy: [100]
      };
      navigator.vibrate(patterns[type]);
    }
  }, []);

  // Record navigation performance
  const recordNavigation = useCallback((fromPath: string, toPath: string, loadTime: number) => {
    MobilePerformanceMonitor.recordMetric('navigation-time', loadTime, {
      from: fromPath,
      to: toPath,
      isMobile: viewport.isMobile.toString(),
      isOnline: isOnline.toString()
    });
  }, [viewport.isMobile, isOnline]);

  // Track route changes for performance monitoring
  useEffect(() => {
    const currentPath = location.pathname;
    
    if (previousPath && previousPath !== currentPath) {
      const navigationTime = Date.now() - navigationStartTime;
      recordNavigation(previousPath, currentPath, navigationTime);
    }
    
    setPreviousPath(currentPath);
    setNavigationStartTime(Date.now());
  }, [location.pathname, previousPath, navigationStartTime, recordNavigation]);

  // Monitor page load performance
  useEffect(() => {
    const handlePageLoad = () => {
      MobilePerformanceMonitor.recordMetric('page-load-complete', 1, {
        path: location.pathname,
        isMobile: viewport.isMobile.toString()
      });
    };

    if (document.readyState === 'complete') {
      handlePageLoad();
    } else {
      window.addEventListener('load', handlePageLoad);
      return () => window.removeEventListener('load', handlePageLoad);
    }
  }, [location.pathname, viewport.isMobile]);

  // Monitor viewport changes
  useEffect(() => {
    MobilePerformanceMonitor.recordMetric('viewport-change', 1, {
      width: viewport.width.toString(),
      height: viewport.height.toString(),
      isMobile: viewport.isMobile.toString(),
      isTablet: viewport.isTablet.toString()
    });
  }, [viewport]);

  // Monitor network status changes
  useEffect(() => {
    MobilePerformanceMonitor.recordMetric('network-status-change', 1, {
      isOnline: isOnline.toString(),
      path: location.pathname
    });

    if (!isOnline) {
      showNotification('オフライン状態です。キャッシュされたコンテンツを表示しています。', 'warning');
    } else if (isOnline && notification.severity === 'warning') {
      showNotification('オンライン状態に戻りました。', 'success');
    }
  }, [isOnline, location.pathname, showNotification, notification.severity]);

  // Performance optimization: preload critical routes
  useEffect(() => {
    if (viewport.isMobile && isOnline) {
      // Preload critical routes for better mobile performance
      const criticalRoutes = ['/architecture', '/map', '/architects'];
      criticalRoutes.forEach(route => {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = route;
        document.head.appendChild(link);
      });
    }
  }, [viewport.isMobile, isOnline]);

  const contextValue: MobileNavigationContextType = {
    isLoading,
    setLoading: setIsLoading,
    showNotification,
    recordNavigation,
    triggerHaptic,
    isOnline,
    viewport
  };

  return (
    <MobileNavigationContext.Provider value={contextValue}>
      {children}
      
      {/* Loading indicator */}
      {isLoading && (
        <LinearProgress
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 2000,
            height: 3,
            backgroundColor: alpha(theme.palette.primary.main, 0.1)
          }}
        />
      )}

      {/* Notification snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={handleCloseNotification}
        anchorOrigin={{ 
          vertical: viewport.isMobile ? 'top' : 'bottom', 
          horizontal: 'center' 
        }}
        sx={{
          zIndex: 1500,
          ...(viewport.isMobile && {
            mt: 8 // Account for mobile header
          })
        }}
      >
        <Alert
          severity={notification.severity}
          variant="filled"
          onClose={handleCloseNotification}
          sx={{
            width: '100%',
            maxWidth: viewport.isMobile ? '90vw' : 400,
            borderRadius: 2,
            fontSize: viewport.isMobile ? '0.875rem' : '0.9rem',
            '& .MuiAlert-icon': {
              fontSize: viewport.isMobile ? '1.2rem' : '1.5rem'
            }
          }}
        >
          {notification.message}
        </Alert>
      </Snackbar>

      {/* Offline indicator */}
      {!isOnline && (
        <Box
          sx={{
            position: 'fixed',
            top: viewport.isMobile ? 64 : 0,
            left: 0,
            right: 0,
            zIndex: 1600,
            backgroundColor: theme.palette.warning.main,
            color: theme.palette.warning.contrastText,
            textAlign: 'center',
            py: 0.5,
            fontSize: '0.875rem',
            fontWeight: 500
          }}
        >
          📱 オフラインモード - キャッシュされたコンテンツを表示中
        </Box>
      )}
    </MobileNavigationContext.Provider>
  );
};

// Hook to use mobile navigation context
export const useMobileNavigation = (): MobileNavigationContextType => {
  const context = useContext(MobileNavigationContext);
  
  if (!context) {
    throw new Error('useMobileNavigation must be used within a MobileNavigationProvider');
  }
  
  return context;
};

// Hook for enhanced navigation with performance tracking
export const useEnhancedNavigate = () => {
  const navigate = useNavigate();
  const { recordNavigation, triggerHaptic, setLoading, viewport } = useMobileNavigation();
  const location = useLocation();

  const enhancedNavigate = useCallback((
    to: string | number,
    options?: {
      replace?: boolean;
      state?: any;
      preventScrollReset?: boolean;
      hapticFeedback?: boolean;
      showLoading?: boolean;
    }
  ) => {
    const startTime = Date.now();
    const fromPath = location.pathname;

    // Trigger haptic feedback if enabled
    if (options?.hapticFeedback !== false && viewport.isMobile) {
      triggerHaptic('light');
    }

    // Show loading indicator if enabled
    if (options?.showLoading !== false) {
      setLoading(true);
      setTimeout(() => setLoading(false), 500); // Auto-hide after 500ms
    }

    // Perform navigation
    if (typeof to === 'string') {
      navigate(to, {
        replace: options?.replace,
        state: options?.state,
        preventScrollReset: options?.preventScrollReset
      });

      // Record navigation performance
      setTimeout(() => {
        const endTime = Date.now();
        recordNavigation(fromPath, to, endTime - startTime);
      }, 100);
    } else {
      navigate(to);
    }
  }, [navigate, recordNavigation, triggerHaptic, setLoading, viewport.isMobile, location.pathname]);

  return enhancedNavigate;
};

export default MobileNavigationProvider;