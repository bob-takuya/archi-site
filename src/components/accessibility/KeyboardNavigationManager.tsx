import React, { useEffect, useCallback, useRef } from 'react';
import { Box } from '@mui/material';
import { 
  getFocusableElements, 
  useFocusManagement, 
  useKeyboardNavigation 
} from '../../utils/accessibility';

interface KeyboardNavigationManagerProps {
  children: React.ReactNode;
  trapFocus?: boolean;
  restoreFocus?: boolean;
  skipToContentId?: string;
  enableArrowNavigation?: boolean;
  enableTabNavigation?: boolean;
  onEscape?: () => void;
  className?: string;
}

/**
 * Keyboard Navigation Manager Component
 * Provides comprehensive keyboard navigation support for complex interfaces
 * WCAG 2.1 AA compliant with focus management and keyboard shortcuts
 */
export const KeyboardNavigationManager: React.FC<KeyboardNavigationManagerProps> = ({
  children,
  trapFocus = false,
  restoreFocus = true,
  skipToContentId,
  enableArrowNavigation = true,
  enableTabNavigation = true,
  onEscape,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const lastFocusedElement = useRef<HTMLElement | null>(null);
  const { setFocus, focusFirstElement, focusLastElement } = useFocusManagement();
  
  // Store the last focused element when component mounts
  useEffect(() => {
    if (restoreFocus && document.activeElement) {
      lastFocusedElement.current = document.activeElement as HTMLElement;
    }
    
    return () => {
      // Restore focus when component unmounts
      if (restoreFocus && lastFocusedElement.current) {
        setTimeout(() => {
          lastFocusedElement.current?.focus();
        }, 0);
      }
    };
  }, [restoreFocus]);

  // Handle arrow key navigation
  const handleArrowNavigation = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    if (!enableArrowNavigation || !containerRef.current) return;
    
    const focusableElements = getFocusableElements(containerRef.current);
    const currentIndex = focusableElements.findIndex(el => el === document.activeElement);
    
    let nextIndex = currentIndex;
    
    switch (direction) {
      case 'down':
      case 'right':
        nextIndex = currentIndex < focusableElements.length - 1 ? currentIndex + 1 : 0;
        break;
      case 'up':
      case 'left':
        nextIndex = currentIndex > 0 ? currentIndex - 1 : focusableElements.length - 1;
        break;
    }
    
    if (nextIndex !== currentIndex && focusableElements[nextIndex]) {
      setFocus(focusableElements[nextIndex]);
    }
  }, [enableArrowNavigation, setFocus]);

  // Handle skip to content functionality
  const handleSkipToContent = useCallback(() => {
    if (skipToContentId) {
      const targetElement = document.getElementById(skipToContentId);
      if (targetElement) {
        setFocus(targetElement);
        // Scroll to element if it's not visible
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [skipToContentId, setFocus]);

  // Handle focus trap
  const handleTabKey = useCallback((event: KeyboardEvent) => {
    if (!trapFocus || !enableTabNavigation || !containerRef.current) return;
    
    const focusableElements = getFocusableElements(containerRef.current);
    if (focusableElements.length === 0) return;
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    if (event.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        event.preventDefault();
        setFocus(lastElement);
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        event.preventDefault();
        setFocus(firstElement);
      }
    }
  }, [trapFocus, enableTabNavigation, setFocus]);

  // Enhanced keyboard navigation
  useKeyboardNavigation(
    onEscape, // Escape
    undefined, // Enter
    () => handleArrowNavigation('up'), // Arrow up
    () => handleArrowNavigation('down'), // Arrow down
    () => handleArrowNavigation('left'), // Arrow left
    () => handleArrowNavigation('right') // Arrow right
  );

  // Global keyboard event handler
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Handle Tab key for focus trap
      if (event.key === 'Tab') {
        handleTabKey(event);
      }
      
      // Handle keyboard shortcuts
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'j': // Ctrl/Cmd + J: Skip to content
            event.preventDefault();
            handleSkipToContent();
            break;
          case 'h': // Ctrl/Cmd + H: Focus first element
            event.preventDefault();
            if (containerRef.current) {
              focusFirstElement(containerRef.current);
            }
            break;
          case 'e': // Ctrl/Cmd + E: Focus last element
            event.preventDefault();
            if (containerRef.current) {
              focusLastElement(containerRef.current);
            }
            break;
        }
      }
      
      // Handle F6 key for landmark navigation
      if (event.key === 'F6') {
        event.preventDefault();
        navigateToNextLandmark(event.shiftKey);
      }
    };

    if (trapFocus || enableArrowNavigation || skipToContentId) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [
    trapFocus, 
    enableArrowNavigation, 
    skipToContentId, 
    handleTabKey, 
    handleSkipToContent,
    focusFirstElement,
    focusLastElement
  ]);

  // Navigate to next landmark (for F6 key)
  const navigateToNextLandmark = useCallback((reverse: boolean = false) => {
    const landmarks = Array.from(document.querySelectorAll(
      '[role="main"], [role="navigation"], [role="banner"], [role="contentinfo"], [role="complementary"], [role="region"]'
    )) as HTMLElement[];
    
    if (landmarks.length === 0) return;
    
    const currentLandmark = landmarks.find(landmark => 
      landmark.contains(document.activeElement as Node)
    );
    
    let nextIndex = 0;
    
    if (currentLandmark) {
      const currentIndex = landmarks.indexOf(currentLandmark);
      if (reverse) {
        nextIndex = currentIndex > 0 ? currentIndex - 1 : landmarks.length - 1;
      } else {
        nextIndex = currentIndex < landmarks.length - 1 ? currentIndex + 1 : 0;
      }
    }
    
    const nextLandmark = landmarks[nextIndex];
    if (nextLandmark) {
      // Focus the landmark or first focusable element within it
      const focusableInLandmark = getFocusableElements(nextLandmark);
      if (focusableInLandmark.length > 0) {
        setFocus(focusableInLandmark[0]);
      } else {
        // Make landmark focusable temporarily
        nextLandmark.setAttribute('tabindex', '-1');
        setFocus(nextLandmark);
        setTimeout(() => {
          nextLandmark.removeAttribute('tabindex');
        }, 100);
      }
      
      // Scroll landmark into view
      nextLandmark.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [setFocus]);

  // Focus first element when component mounts (if trap focus is enabled)
  useEffect(() => {
    if (trapFocus && containerRef.current) {
      setTimeout(() => {
        focusFirstElement(containerRef.current!);
      }, 0);
    }
  }, [trapFocus, focusFirstElement]);

  return (
    <Box
      ref={containerRef}
      className={className}
      sx={{
        outline: 'none',
        '&:focus-within': {
          // Visual indicator when container has focus
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: -2,
            left: -2,
            right: -2,
            bottom: -2,
            border: '2px solid transparent',
            borderRadius: 1,
            pointerEvents: 'none',
            zIndex: 1,
          }
        }
      }}
      tabIndex={trapFocus ? -1 : undefined}
      role={trapFocus ? 'region' : undefined}
      aria-label={trapFocus ? 'Keyboard navigation area' : undefined}
    >
      {children}
    </Box>
  );
};

export default KeyboardNavigationManager;