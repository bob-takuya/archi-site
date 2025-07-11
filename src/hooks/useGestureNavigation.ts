import { useCallback, useEffect, useRef } from 'react';

// Types for gesture events
interface GestureHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onPinchStart?: (scale: number) => void;
  onPinchMove?: (scale: number) => void;
  onPinchEnd?: (scale: number) => void;
  onLongPress?: (x: number, y: number) => void;
  onDoubleTap?: (x: number, y: number) => void;
}

interface GestureOptions {
  swipeThreshold?: number;
  velocityThreshold?: number;
  longPressDelay?: number;
  doubleTapDelay?: number;
  pinchThreshold?: number;
}

const defaultOptions: GestureOptions = {
  swipeThreshold: 50,
  velocityThreshold: 0.3,
  longPressDelay: 500,
  doubleTapDelay: 300,
  pinchThreshold: 0.1,
};

export const useGestureNavigation = (
  handlers: GestureHandlers = {},
  options: GestureOptions = {}
) => {
  const opts = { ...defaultOptions, ...options };
  const gestureRef = useRef<HTMLElement | null>(null);
  const touchesRef = useRef<Touch[]>([]);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastTapTimeRef = useRef<number>(0);
  const initialPinchDistanceRef = useRef<number>(0);
  const currentScaleRef = useRef<number>(1);

  // Utility functions
  const getDistance = useCallback((touch1: Touch, touch2: Touch): number => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  const getVelocity = useCallback((
    startTime: number,
    endTime: number,
    distance: number
  ): number => {
    const timeDiff = endTime - startTime;
    return timeDiff > 0 ? distance / timeDiff : 0;
  }, []);

  // Touch event handlers
  const handleTouchStart = useCallback((e: TouchEvent) => {
    e.preventDefault();
    touchesRef.current = Array.from(e.touches);
    
    const touch = e.touches[0];
    const currentTime = Date.now();

    // Handle double tap detection
    if (currentTime - lastTapTimeRef.current < (opts.doubleTapDelay || 300)) {
      handlers.onDoubleTap?.(touch.clientX, touch.clientY);
      lastTapTimeRef.current = 0; // Reset to prevent triple tap
      return;
    }
    lastTapTimeRef.current = currentTime;

    // Handle long press detection
    if (handlers.onLongPress) {
      longPressTimerRef.current = setTimeout(() => {
        handlers.onLongPress?.(touch.clientX, touch.clientY);
      }, opts.longPressDelay || 500);
    }

    // Handle pinch start
    if (e.touches.length === 2 && handlers.onPinchStart) {
      const distance = getDistance(e.touches[0], e.touches[1]);
      initialPinchDistanceRef.current = distance;
      currentScaleRef.current = 1;
      handlers.onPinchStart(1);
    }
  }, [handlers, opts, getDistance]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    e.preventDefault();
    
    // Clear long press timer on move
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    // Handle pinch gesture
    if (e.touches.length === 2 && handlers.onPinchMove && initialPinchDistanceRef.current > 0) {
      const distance = getDistance(e.touches[0], e.touches[1]);
      const scale = distance / initialPinchDistanceRef.current;
      currentScaleRef.current = scale;
      
      // Only trigger if scale change is significant
      if (Math.abs(scale - 1) > (opts.pinchThreshold || 0.1)) {
        handlers.onPinchMove(scale);
      }
    }
  }, [handlers, opts, getDistance]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    e.preventDefault();
    
    // Clear long press timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    const touches = touchesRef.current;
    if (touches.length === 0) return;

    // Handle pinch end
    if (e.touches.length === 0 && touches.length === 2 && handlers.onPinchEnd) {
      handlers.onPinchEnd(currentScaleRef.current);
      initialPinchDistanceRef.current = 0;
      currentScaleRef.current = 1;
      return;
    }

    // Handle swipe gestures (only for single touch)
    if (touches.length === 1 && e.changedTouches.length === 1) {
      const startTouch = touches[0];
      const endTouch = e.changedTouches[0];
      
      const deltaX = endTouch.clientX - startTouch.clientX;
      const deltaY = endTouch.clientY - startTouch.clientY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      
      const startTime = (e as any).timeStamp || Date.now();
      const endTime = Date.now();
      const velocity = getVelocity(startTime, endTime, distance);
      
      // Check if swipe meets threshold requirements
      if (distance > (opts.swipeThreshold || 50) && velocity > (opts.velocityThreshold || 0.3)) {
        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);
        
        // Determine swipe direction
        if (absX > absY) {
          // Horizontal swipe
          if (deltaX > 0) {
            handlers.onSwipeRight?.();
          } else {
            handlers.onSwipeLeft?.();
          }
        } else {
          // Vertical swipe
          if (deltaY > 0) {
            handlers.onSwipeDown?.();
          } else {
            handlers.onSwipeUp?.();
          }
        }
      }
    }

    touchesRef.current = [];
  }, [handlers, opts, getVelocity]);

  // Keyboard navigation support
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Arrow key navigation
    switch (e.key) {
      case 'ArrowLeft':
        if (e.metaKey || e.ctrlKey) {
          handlers.onSwipeLeft?.();
        }
        break;
      case 'ArrowRight':
        if (e.metaKey || e.ctrlKey) {
          handlers.onSwipeRight?.();
        }
        break;
      case 'ArrowUp':
        if (e.metaKey || e.ctrlKey) {
          handlers.onSwipeUp?.();
        }
        break;
      case 'ArrowDown':
        if (e.metaKey || e.ctrlKey) {
          handlers.onSwipeDown?.();
        }
        break;
      case ' ':
        if (e.ctrlKey) {
          // Ctrl+Space for long press equivalent
          const rect = gestureRef.current?.getBoundingClientRect();
          if (rect) {
            handlers.onLongPress?.(rect.width / 2, rect.height / 2);
          }
        }
        break;
      case 'Enter':
        if (e.ctrlKey) {
          // Ctrl+Enter for double tap equivalent
          const rect = gestureRef.current?.getBoundingClientRect();
          if (rect) {
            handlers.onDoubleTap?.(rect.width / 2, rect.height / 2);
          }
        }
        break;
    }
  }, [handlers]);

  // Set up event listeners
  useEffect(() => {
    const element = gestureRef.current;
    if (!element) return;

    // Touch events
    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: false });
    
    // Keyboard events for accessibility
    element.addEventListener('keydown', handleKeyDown);
    
    // Prevent context menu on long press
    element.addEventListener('contextmenu', (e) => e.preventDefault());

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('keydown', handleKeyDown);
      element.removeEventListener('contextmenu', (e) => e.preventDefault());
      
      // Clear any pending timers
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, handleKeyDown]);

  // Return ref and utility functions
  return {
    gestureRef: (element: HTMLElement | null) => {
      gestureRef.current = element;
    },
    // Programmatic gesture simulation for testing
    simulateSwipe: useCallback((direction: 'left' | 'right' | 'up' | 'down') => {
      switch (direction) {
        case 'left':
          handlers.onSwipeLeft?.();
          break;
        case 'right':
          handlers.onSwipeRight?.();
          break;
        case 'up':
          handlers.onSwipeUp?.();
          break;
        case 'down':
          handlers.onSwipeDown?.();
          break;
      }
    }, [handlers]),
    simulatePinch: useCallback((scale: number) => {
      handlers.onPinchStart?.(1);
      handlers.onPinchMove?.(scale);
      handlers.onPinchEnd?.(scale);
    }, [handlers]),
    simulateLongPress: useCallback((x = 0, y = 0) => {
      handlers.onLongPress?.(x, y);
    }, [handlers]),
    simulateDoubleTap: useCallback((x = 0, y = 0) => {
      handlers.onDoubleTap?.(x, y);
    }, [handlers]),
  };
};

export default useGestureNavigation;