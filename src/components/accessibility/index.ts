/**
 * Accessibility Components Index
 * 
 * Comprehensive WCAG 2.1 AA compliant accessibility components
 * for the Japanese Architecture Database project.
 */

export { SkipLink, type SkipLinkProps } from './SkipLink';
export { HighContrastToggle } from './HighContrastToggle';
export { KeyboardNavigationManager } from './KeyboardNavigationManager';
export { AccessibilityTestSuite } from './AccessibilityTestSuite';
export { 
  FocusManagementProvider,
  FocusManager,
  AutoFocus,
  FocusTrap,
  PortalFocusManager,
  useFocusManagement
} from './FocusManagementSystem';

// Re-export accessibility utilities
export * from '../../utils/accessibility';