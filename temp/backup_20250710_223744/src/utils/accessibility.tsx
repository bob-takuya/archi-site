import React, { useEffect, useRef, useState } from 'react';

/**
 * Accessibility utilities for WCAG 2.1 AA compliance
 */

// Skip link component props
export interface SkipLinkProps {
  href: string;
  children: React.ReactNode;
}

// Focus management utilities
export const useFocusManagement = () => {
  const focusRef = useRef<HTMLElement | null>(null);
  
  const setFocus = (element?: HTMLElement | null) => {
    if (element) {
      element.focus();
      focusRef.current = element;
    }
  };
  
  const focusFirstElement = (container: HTMLElement) => {
    const focusableElements = getFocusableElements(container);
    if (focusableElements.length > 0) {
      setFocus(focusableElements[0]);
    }
  };
  
  const focusLastElement = (container: HTMLElement) => {
    const focusableElements = getFocusableElements(container);
    if (focusableElements.length > 0) {
      setFocus(focusableElements[focusableElements.length - 1]);
    }
  };
  
  return {
    setFocus,
    focusFirstElement,
    focusLastElement,
    currentFocus: focusRef.current
  };
};

// Get all focusable elements within a container
export const getFocusableElements = (container: HTMLElement): HTMLElement[] => {
  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]'
  ];
  
  return Array.from(
    container.querySelectorAll(focusableSelectors.join(', '))
  ) as HTMLElement[];
};

// Keyboard navigation hook
export const useKeyboardNavigation = (
  onEscape?: () => void,
  onEnter?: () => void,
  onArrowUp?: () => void,
  onArrowDown?: () => void,
  onArrowLeft?: () => void,
  onArrowRight?: () => void
) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Escape':
          onEscape?.();
          break;
        case 'Enter':
          onEnter?.();
          break;
        case 'ArrowUp':
          event.preventDefault();
          onArrowUp?.();
          break;
        case 'ArrowDown':
          event.preventDefault();
          onArrowDown?.();
          break;
        case 'ArrowLeft':
          onArrowLeft?.();
          break;
        case 'ArrowRight':
          onArrowRight?.();
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onEscape, onEnter, onArrowUp, onArrowDown, onArrowLeft, onArrowRight]);
};

// Focus trap hook for modals and drawers
export const useFocusTrap = (isActive: boolean) => {
  const containerRef = useRef<HTMLElement>(null);
  
  useEffect(() => {
    if (!isActive || !containerRef.current) return;
    
    const container = containerRef.current;
    const focusableElements = getFocusableElements(container);
    
    if (focusableElements.length === 0) return;
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    // Focus first element when trap becomes active
    firstElement.focus();
    
    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      
      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };
    
    container.addEventListener('keydown', handleTabKey);
    
    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }, [isActive]);
  
  return containerRef;
};

// Announcer for screen readers
export const useScreenReaderAnnouncer = () => {
  const [announcement, setAnnouncement] = useState('');
  
  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    setAnnouncement('');
    setTimeout(() => {
      setAnnouncement(message);
    }, 100);
  };
  
  return { announcement, announce };
};

// ARIA live region component
export const AriaLiveRegion: React.FC<{
  message: string;
  level?: 'polite' | 'assertive';
  className?: string;
}> = ({ message, level = 'polite', className = '' }) => (
  <div
    aria-live={level}
    aria-atomic="true"
    className={`sr-only ${className}`}
    style={{
      position: 'absolute',
      left: '-10000px',
      width: '1px',
      height: '1px',
      overflow: 'hidden'
    }}
  >
    {message}
  </div>
);

// Color contrast utilities
export const getContrastRatio = (color1: string, color2: string): number => {
  const getLuminance = (hex: string): number => {
    // Convert hex to RGB
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    
    // Calculate relative luminance
    const toLinear = (channel: number) => 
      channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
    
    return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  };
  
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  
  return (brightest + 0.05) / (darkest + 0.05);
};

export const isContrastCompliant = (
  foreground: string, 
  background: string, 
  level: 'AA' | 'AAA' = 'AA',
  size: 'normal' | 'large' = 'normal'
): boolean => {
  const ratio = getContrastRatio(foreground, background);
  
  if (level === 'AA') {
    return size === 'large' ? ratio >= 3 : ratio >= 4.5;
  } else {
    return size === 'large' ? ratio >= 4.5 : ratio >= 7;
  }
};

// Touch and gesture utilities for mobile accessibility
export const useTouchGestures = () => {
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);
  
  const minSwipeDistance = 50;
  
  const onTouchStart = (event: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart({
      x: event.targetTouches[0].clientX,
      y: event.targetTouches[0].clientY
    });
  };
  
  const onTouchMove = (event: React.TouchEvent) => {
    setTouchEnd({
      x: event.targetTouches[0].clientX,
      y: event.targetTouches[0].clientY
    });
  };
  
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;
    const isLeftSwipe = distanceX > minSwipeDistance;
    const isRightSwipe = distanceX < -minSwipeDistance;
    const isUpSwipe = distanceY > minSwipeDistance;
    const isDownSwipe = distanceY < -minSwipeDistance;
    
    return {
      isLeftSwipe,
      isRightSwipe,
      isUpSwipe,
      isDownSwipe,
      distanceX,
      distanceY
    };
  };
  
  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    touchStart,
    touchEnd
  };
};

// Reduced motion preference hook
export const useReducedMotion = (): boolean => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);
  
  return prefersReducedMotion;
};

// High contrast preference hook
export const useHighContrast = (): boolean => {
  const [prefersHighContrast, setPrefersHighContrast] = useState(false);
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    setPrefersHighContrast(mediaQuery.matches);
    
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersHighContrast(event.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);
  
  return prefersHighContrast;
};

// Screen reader detection
export const useScreenReader = (): boolean => {
  const [isScreenReader, setIsScreenReader] = useState(false);
  
  useEffect(() => {
    // Detect if user is using screen reader
    const detectScreenReader = () => {
      // Check for reduced motion preference as screen reader indicator
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      
      // Check if user navigates via keyboard primarily
      let keyboardNavigation = 0;
      let mouseNavigation = 0;
      
      const keyHandler = () => keyboardNavigation++;
      const mouseHandler = () => mouseNavigation++;
      
      document.addEventListener('keydown', keyHandler);
      document.addEventListener('mousedown', mouseHandler);
      
      setTimeout(() => {
        const screenReaderLikely = keyboardNavigation > mouseNavigation * 3 || prefersReducedMotion;
        setIsScreenReader(screenReaderLikely);
        
        document.removeEventListener('keydown', keyHandler);
        document.removeEventListener('mousedown', mouseHandler);
      }, 5000);
    };
    
    detectScreenReader();
  }, []);
  
  return isScreenReader;
};

// ARIA attributes helper
export const getAriaAttributes = (
  label?: string,
  describedBy?: string,
  expanded?: boolean,
  selected?: boolean,
  disabled?: boolean,
  invalid?: boolean,
  required?: boolean,
  live?: 'polite' | 'assertive' | 'off',
  atomic?: boolean
) => {
  const attributes: Record<string, any> = {};
  
  if (label) attributes['aria-label'] = label;
  if (describedBy) attributes['aria-describedby'] = describedBy;
  if (expanded !== undefined) attributes['aria-expanded'] = expanded;
  if (selected !== undefined) attributes['aria-selected'] = selected;
  if (disabled) attributes['aria-disabled'] = true;
  if (invalid) attributes['aria-invalid'] = true;
  if (required) attributes['aria-required'] = true;
  if (live) attributes['aria-live'] = live;
  if (atomic !== undefined) attributes['aria-atomic'] = atomic;
  
  return attributes;
};