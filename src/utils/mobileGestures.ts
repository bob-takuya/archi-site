/**
 * Advanced touch gesture handling for mobile architecture browsing
 * Provides swipe navigation, touch feedback, and mobile-optimized interactions
 */

import { useEffect, useState, useCallback, useRef } from 'react';

export interface TouchPoint {
  x: number;
  y: number;
  timestamp: number;
}

export interface SwipeGesture {
  direction: 'left' | 'right' | 'up' | 'down';
  distance: number;
  velocity: number;
  duration: number;
}

export interface GestureConfig {
  minSwipeDistance: number;
  minSwipeVelocity: number;
  maxSwipeTime: number;
  enableHapticFeedback: boolean;
}

const DEFAULT_CONFIG: GestureConfig = {
  minSwipeDistance: 50,
  minSwipeVelocity: 0.3,
  maxSwipeTime: 800,
  enableHapticFeedback: true
};

/**
 * Enhanced touch gesture hook for architecture card navigation
 */
export const useAdvancedTouchGestures = (
  onSwipeLeft?: () => void,
  onSwipeRight?: () => void,
  onSwipeUp?: () => void,
  onSwipeDown?: () => void,
  config: Partial<GestureConfig> = {}
) => {
  const [touchStart, setTouchStart] = useState<TouchPoint | null>(null);
  const [touchEnd, setTouchEnd] = useState<TouchPoint | null>(null);
  const [isGesturing, setIsGesturing] = useState(false);
  const gestureConfig = { ...DEFAULT_CONFIG, ...config };

  // Haptic feedback helper
  const triggerHapticFeedback = useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (!gestureConfig.enableHapticFeedback) return;
    
    if ('vibrate' in navigator) {
      const patterns = {
        light: [10],
        medium: [50],
        heavy: [100]
      };
      navigator.vibrate(patterns[type]);
    }
  }, [gestureConfig.enableHapticFeedback]);

  const onTouchStart = useCallback((event: React.TouchEvent) => {
    if (event.touches.length !== 1) return;
    
    const touch = event.touches[0];
    setTouchStart({
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now()
    });
    setTouchEnd(null);
    setIsGesturing(true);
  }, []);

  const onTouchMove = useCallback((event: React.TouchEvent) => {
    if (!isGesturing || event.touches.length !== 1) return;
    
    const touch = event.touches[0];
    setTouchEnd({
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now()
    });
  }, [isGesturing]);

  const onTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd || !isGesturing) {
      setIsGesturing(false);
      return;
    }

    const deltaX = touchStart.x - touchEnd.x;
    const deltaY = touchStart.y - touchEnd.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const duration = touchEnd.timestamp - touchStart.timestamp;
    const velocity = distance / duration;

    // Check if gesture meets minimum requirements
    if (distance < gestureConfig.minSwipeDistance || 
        velocity < gestureConfig.minSwipeVelocity ||
        duration > gestureConfig.maxSwipeTime) {
      setIsGesturing(false);
      return;
    }

    // Determine swipe direction
    const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY);
    
    if (isHorizontal) {
      if (deltaX > 0) {
        // Swipe left
        triggerHapticFeedback('light');
        onSwipeLeft?.();
      } else {
        // Swipe right
        triggerHapticFeedback('light');
        onSwipeRight?.();
      }
    } else {
      if (deltaY > 0) {
        // Swipe up
        triggerHapticFeedback('medium');
        onSwipeUp?.();
      } else {
        // Swipe down
        triggerHapticFeedback('medium');
        onSwipeDown?.();
      }
    }

    setIsGesturing(false);
  }, [touchStart, touchEnd, isGesturing, gestureConfig, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, triggerHapticFeedback]);

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    isGesturing,
    gestureHandlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd
    }
  };
};

/**
 * Pull-to-refresh gesture hook
 */
export const usePullToRefresh = (
  onRefresh: () => Promise<void>,
  refreshThreshold: number = 120
) => {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef<number>(0);
  const scrollContainer = useRef<HTMLElement | null>(null);

  const onTouchStart = useCallback((event: React.TouchEvent) => {
    if (event.touches.length !== 1) return;
    
    startY.current = event.touches[0].clientY;
    setIsPulling(false);
    setPullDistance(0);
  }, []);

  const onTouchMove = useCallback((event: React.TouchEvent) => {
    if (event.touches.length !== 1 || isRefreshing) return;
    
    const currentY = event.touches[0].clientY;
    const deltaY = currentY - startY.current;
    
    // Only trigger pull if at top of container
    const element = scrollContainer.current || document.documentElement;
    if (element.scrollTop > 0) return;
    
    if (deltaY > 0) {
      event.preventDefault();
      setIsPulling(true);
      setPullDistance(Math.min(deltaY, refreshThreshold * 1.5));
    }
  }, [isRefreshing, refreshThreshold]);

  const onTouchEnd = useCallback(async () => {
    if (!isPulling || isRefreshing) return;
    
    if (pullDistance >= refreshThreshold) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
    
    setIsPulling(false);
    setPullDistance(0);
  }, [isPulling, isRefreshing, pullDistance, refreshThreshold, onRefresh]);

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    isPulling,
    pullDistance,
    isRefreshing,
    scrollContainer,
    pullProgress: Math.min(pullDistance / refreshThreshold, 1),
    gestureHandlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd
    }
  };
};

/**
 * Double tap gesture hook
 */
export const useDoubleTap = (
  onDoubleTap: () => void,
  delay: number = 300
) => {
  const [lastTap, setLastTap] = useState<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const onTouchEnd = useCallback(() => {
    const now = Date.now();
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    if (now - lastTap < delay) {
      // Double tap detected
      onDoubleTap();
      setLastTap(0);
    } else {
      setLastTap(now);
      timeoutRef.current = setTimeout(() => {
        setLastTap(0);
      }, delay);
    }
  }, [lastTap, delay, onDoubleTap]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { onTouchEnd };
};

/**
 * Long press gesture hook
 */
export const useLongPress = (
  onLongPress: () => void,
  delay: number = 500
) => {
  const [isLongPressing, setIsLongPressing] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const touchRef = useRef<TouchPoint | null>(null);

  const onTouchStart = useCallback((event: React.TouchEvent) => {
    if (event.touches.length !== 1) return;
    
    const touch = event.touches[0];
    touchRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now()
    };
    
    setIsLongPressing(false);
    
    timeoutRef.current = setTimeout(() => {
      setIsLongPressing(true);
      if ('vibrate' in navigator) {
        navigator.vibrate([50]);
      }
      onLongPress();
    }, delay);
  }, [delay, onLongPress]);

  const onTouchMove = useCallback((event: React.TouchEvent) => {
    if (!touchRef.current || event.touches.length !== 1) return;
    
    const touch = event.touches[0];
    const deltaX = Math.abs(touch.clientX - touchRef.current.x);
    const deltaY = Math.abs(touch.clientY - touchRef.current.y);
    
    // Cancel long press if user moves too much
    if (deltaX > 10 || deltaY > 10) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      touchRef.current = null;
    }
  }, []);

  const onTouchEnd = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    touchRef.current = null;
    setIsLongPressing(false);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    isLongPressing,
    gestureHandlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd
    }
  };
};

/**
 * Mobile viewport utilities
 */
export const useViewportSize = () => {
  const [viewport, setViewport] = useState(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
    isMobile: window.innerWidth < 768,
    isTablet: window.innerWidth >= 768 && window.innerWidth < 1024,
    isDesktop: window.innerWidth >= 1024
  }));

  useEffect(() => {
    const handleResize = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
        isMobile: window.innerWidth < 768,
        isTablet: window.innerWidth >= 768 && window.innerWidth < 1024,
        isDesktop: window.innerWidth >= 1024
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return viewport;
};

/**
 * Touch-optimized scroll behavior
 */
export const useSmoothScroll = () => {
  const scrollToElement = useCallback((elementId: string, offset: number = 0) => {
    const element = document.getElementById(elementId);
    if (!element) return;

    const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
    const targetPosition = elementPosition - offset;

    window.scrollTo({
      top: targetPosition,
      behavior: 'smooth'
    });
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, []);

  return {
    scrollToElement,
    scrollToTop
  };
};