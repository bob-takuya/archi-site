import React, { createContext, useContext, useRef, useCallback, useEffect, useState } from 'react';
import { getFocusableElements } from '../../utils/accessibility';

interface FocusStackItem {
  id: string;
  element: HTMLElement;
  previousElement: HTMLElement | null;
  restoreOnUnmount: boolean;
}

interface FocusManagementContextType {
  pushFocus: (id: string, element: HTMLElement, restoreOnUnmount?: boolean) => void;
  popFocus: (id: string) => void;
  restoreFocus: (id?: string) => void;
  trapFocus: (element: HTMLElement) => () => void;
  moveFocusToFirst: (container: HTMLElement) => void;
  moveFocusToLast: (container: HTMLElement) => void;
  getCurrentFocus: () => HTMLElement | null;
  isFocusTrapped: boolean;
}

interface FocusManagementProviderProps {
  children: React.ReactNode;
}

interface FocusManagerProps {
  children: React.ReactNode;
  trapFocus?: boolean;
  restoreFocus?: boolean;
  initialFocus?: 'first' | 'last' | HTMLElement;
  onEscape?: () => void;
  id?: string;
}

const FocusManagementContext = createContext<FocusManagementContextType | null>(null);

/**
 * Focus Management System Provider
 * Manages focus stack and provides focus utilities throughout the application
 */
export const FocusManagementProvider: React.FC<FocusManagementProviderProps> = ({ children }) => {
  const focusStack = useRef<FocusStackItem[]>([]);
  const [isFocusTrapped, setIsFocusTrapped] = useState(false);
  const activeTraps = useRef<Set<HTMLElement>>(new Set());

  // Push a focus context onto the stack
  const pushFocus = useCallback((id: string, element: HTMLElement, restoreOnUnmount = true) => {
    const previousElement = document.activeElement as HTMLElement;
    
    focusStack.current.push({
      id,
      element,
      previousElement,
      restoreOnUnmount
    });
    
    element.focus();
  }, []);

  // Pop a focus context from the stack
  const popFocus = useCallback((id: string) => {
    const index = focusStack.current.findIndex(item => item.id === id);
    if (index === -1) return;
    
    const item = focusStack.current[index];
    focusStack.current.splice(index, 1);
    
    if (item.restoreOnUnmount && item.previousElement) {
      setTimeout(() => {
        item.previousElement?.focus();
      }, 0);
    }
  }, []);

  // Restore focus to a specific item or the top of the stack
  const restoreFocus = useCallback((id?: string) => {
    if (id) {
      const item = focusStack.current.find(item => item.id === id);
      if (item?.previousElement) {
        item.previousElement.focus();
      }
    } else if (focusStack.current.length > 0) {
      const topItem = focusStack.current[focusStack.current.length - 1];
      if (topItem.previousElement) {
        topItem.previousElement.focus();
      }
    }
  }, []);

  // Trap focus within an element
  const trapFocus = useCallback((element: HTMLElement) => {
    activeTraps.current.add(element);
    setIsFocusTrapped(true);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const focusableElements = getFocusableElements(element);
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

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

    document.addEventListener('keydown', handleKeyDown);

    // Focus first element initially
    const focusableElements = getFocusableElements(element);
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    // Return cleanup function
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      activeTraps.current.delete(element);
      
      if (activeTraps.current.size === 0) {
        setIsFocusTrapped(false);
      }
    };
  }, []);

  // Move focus to first focusable element in container
  const moveFocusToFirst = useCallback((container: HTMLElement) => {
    const focusableElements = getFocusableElements(container);
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }
  }, []);

  // Move focus to last focusable element in container
  const moveFocusToLast = useCallback((container: HTMLElement) => {
    const focusableElements = getFocusableElements(container);
    if (focusableElements.length > 0) {
      focusableElements[focusableElements.length - 1].focus();
    }
  }, []);

  // Get currently focused element
  const getCurrentFocus = useCallback(() => {
    return document.activeElement as HTMLElement | null;
  }, []);

  const contextValue: FocusManagementContextType = {
    pushFocus,
    popFocus,
    restoreFocus,
    trapFocus,
    moveFocusToFirst,
    moveFocusToLast,
    getCurrentFocus,
    isFocusTrapped
  };

  return (
    <FocusManagementContext.Provider value={contextValue}>
      {children}
    </FocusManagementContext.Provider>
  );
};

/**
 * Hook to use focus management context
 */
export const useFocusManagement = () => {
  const context = useContext(FocusManagementContext);
  if (!context) {
    throw new Error('useFocusManagement must be used within FocusManagementProvider');
  }
  return context;
};

/**
 * Focus Manager Component
 * Provides focus management for specific sections of the application
 */
export const FocusManager: React.FC<FocusManagerProps> = ({
  children,
  trapFocus = false,
  restoreFocus = true,
  initialFocus = 'first',
  onEscape,
  id = `focus-manager-${Date.now()}`
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { pushFocus, popFocus, trapFocus: trapFocusUtil, moveFocusToFirst, moveFocusToLast } = useFocusManagement();
  const cleanupRef = useRef<(() => void) | null>(null);

  // Handle escape key
  useEffect(() => {
    if (!onEscape) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onEscape();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onEscape]);

  // Setup focus management
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;

    // Push focus context
    if (restoreFocus) {
      pushFocus(id, container, true);
    }

    // Set initial focus
    if (initialFocus === 'first') {
      moveFocusToFirst(container);
    } else if (initialFocus === 'last') {
      moveFocusToLast(container);
    } else if (initialFocus instanceof HTMLElement) {
      initialFocus.focus();
    }

    // Setup focus trap
    if (trapFocus) {
      cleanupRef.current = trapFocusUtil(container);
    }

    // Cleanup on unmount
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
      if (restoreFocus) {
        popFocus(id);
      }
    };
  }, [trapFocus, restoreFocus, initialFocus, id, pushFocus, popFocus, trapFocusUtil, moveFocusToFirst, moveFocusToLast]);

  return (
    <div
      ref={containerRef}
      style={{ outline: 'none' }}
      tabIndex={trapFocus ? -1 : undefined}
    >
      {children}
    </div>
  );
};

/**
 * Auto Focus Component
 * Automatically focuses an element when it mounts
 */
interface AutoFocusProps {
  children: React.ReactElement;
  delay?: number;
  selectText?: boolean;
}

export const AutoFocus: React.FC<AutoFocusProps> = ({ 
  children, 
  delay = 0,
  selectText = false 
}) => {
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const focusElement = () => {
      if (elementRef.current) {
        elementRef.current.focus();
        
        if (selectText && elementRef.current instanceof HTMLInputElement) {
          elementRef.current.select();
        }
      }
    };

    if (delay > 0) {
      const timer = setTimeout(focusElement, delay);
      return () => clearTimeout(timer);
    } else {
      focusElement();
    }
  }, [delay, selectText]);

  return React.cloneElement(children, {
    ref: (el: HTMLElement) => {
      elementRef.current = el;
      // Preserve original ref if it exists
      if (typeof children.ref === 'function') {
        children.ref(el);
      } else if (children.ref) {
        children.ref.current = el;
      }
    }
  });
};

/**
 * Focus Trap Component
 * Simple component that traps focus within its children
 */
interface FocusTrapProps {
  children: React.ReactNode;
  active?: boolean;
  onEscape?: () => void;
}

export const FocusTrap: React.FC<FocusTrapProps> = ({ 
  children, 
  active = true,
  onEscape 
}) => {
  return (
    <FocusManager
      trapFocus={active}
      restoreFocus={active}
      onEscape={onEscape}
    >
      {children}
    </FocusManager>
  );
};

/**
 * Portal Focus Manager
 * Manages focus for portal-rendered content (modals, dialogs, etc.)
 */
interface PortalFocusManagerProps {
  children: React.ReactNode;
  onClose?: () => void;
  initialFocus?: HTMLElement | (() => HTMLElement);
}

export const PortalFocusManager: React.FC<PortalFocusManagerProps> = ({
  children,
  onClose,
  initialFocus
}) => {
  const { pushFocus, popFocus } = useFocusManagement();
  const id = useRef(`portal-${Date.now()}`);

  useEffect(() => {
    const portalElement = document.createElement('div');
    document.body.appendChild(portalElement);

    // Determine initial focus element
    let focusElement: HTMLElement | null = null;
    if (typeof initialFocus === 'function') {
      focusElement = initialFocus();
    } else if (initialFocus) {
      focusElement = initialFocus;
    } else {
      // Find first focusable element in portal
      const focusableElements = getFocusableElements(portalElement);
      focusElement = focusableElements[0] || portalElement;
    }

    if (focusElement) {
      pushFocus(id.current, focusElement, true);
    }

    return () => {
      popFocus(id.current);
      document.body.removeChild(portalElement);
    };
  }, [pushFocus, popFocus, initialFocus]);

  return (
    <FocusManager
      trapFocus={true}
      restoreFocus={true}
      onEscape={onClose}
      id={id.current}
    >
      {children}
    </FocusManager>
  );
};

export default FocusManagementProvider;