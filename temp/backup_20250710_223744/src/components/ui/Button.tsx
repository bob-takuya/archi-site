import React, { forwardRef } from 'react';
import { Button as MuiButton, ButtonProps as MuiButtonProps, useTheme, alpha } from '@mui/material';
import { getAriaAttributes, useHighContrast, useReducedMotion } from '../../utils/accessibility';

export interface ButtonProps extends Omit<MuiButtonProps, 'ref'> {
  variant?: 'contained' | 'outlined' | 'text';
  color?: 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  // Enhanced accessibility props
  ariaLabel?: string;
  ariaDescribedBy?: string;
  ariaExpanded?: boolean;
  ariaSelected?: boolean;
  loading?: boolean;
  loadingText?: string;
  // Touch-friendly size variants
  touchTarget?: 'minimal' | 'comfortable' | 'large';
}

/**
 * Enhanced Button component with full WCAG 2.1 AA compliance
 * - Touch-friendly sizing
 * - High contrast mode support
 * - Reduced motion support
 * - Loading states with proper ARIA
 * - Keyboard navigation optimization
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'contained',
  color = 'primary',
  size = 'medium',
  children,
  fullWidth = false,
  ariaLabel,
  ariaDescribedBy,
  ariaExpanded,
  ariaSelected,
  loading = false,
  loadingText = 'Loading...',
  touchTarget = 'comfortable',
  disabled,
  ...props
}, ref) => {
  const theme = useTheme();
  const prefersHighContrast = useHighContrast();
  const prefersReducedMotion = useReducedMotion();

  // Build ARIA attributes
  const ariaAttributes = getAriaAttributes(
    ariaLabel,
    ariaDescribedBy,
    ariaExpanded,
    ariaSelected,
    disabled || loading
  );

  // Touch target sizing
  const getTouchTargetSize = () => {
    switch (touchTarget) {
      case 'minimal':
        return { minHeight: 44, minWidth: 44 };
      case 'large':
        return { minHeight: 56, minWidth: 56 };
      case 'comfortable':
      default:
        return { minHeight: 48, minWidth: 48 };
    }
  };

  // High contrast mode styling
  const getHighContrastStyles = () => {
    if (!prefersHighContrast) return {};
    
    return {
      borderWidth: 2,
      borderStyle: 'solid',
      '&:focus': {
        outline: '3px solid HighlightText',
        outlineOffset: 2,
      },
      '&:hover': {
        borderColor: 'HighlightText',
      }
    };
  };

  // Reduced motion styling
  const getReducedMotionStyles = () => {
    if (!prefersReducedMotion) return {};
    
    return {
      transition: 'none',
      '&:hover': {
        transform: 'none',
      }
    };
  };

  return (
    <MuiButton
      ref={ref}
      variant={variant}
      color={color}
      size={size}
      fullWidth={fullWidth}
      disabled={disabled || loading}
      {...ariaAttributes}
      {...props}
      sx={{
        ...getTouchTargetSize(),
        // Enhanced focus styling
        '&:focus-visible': {
          outline: `2px solid ${theme.palette.secondary.main}`,
          outlineOffset: 2,
          borderRadius: 1,
        },
        // Touch-friendly padding
        px: touchTarget === 'large' ? 3 : touchTarget === 'small' ? 1.5 : 2,
        py: touchTarget === 'large' ? 1.5 : touchTarget === 'small' ? 0.75 : 1,
        // High contrast mode support
        ...getHighContrastStyles(),
        // Reduced motion support
        ...getReducedMotionStyles(),
        // Loading state styling
        ...(loading && {
          pointerEvents: 'none',
          opacity: 0.7,
          cursor: 'wait',
        }),
        // Enhanced hover states
        '&:hover:not(:disabled)': {
          transform: prefersReducedMotion ? 'none' : 'translateY(-1px)',
          boxShadow: prefersReducedMotion ? 'none' : theme.shadows[4],
        },
        // Color contrast optimization
        ...(variant === 'contained' && {
          color: theme.palette.getContrastText(theme.palette[color].main),
        }),
        ...props.sx,
      }}
    >
      {loading ? (
        <>
          <span aria-hidden="true" style={{ marginRight: 8 }}>
            ⟳
          </span>
          {loadingText}
        </>
      ) : (
        children
      )}
    </MuiButton>
  );
});

export default Button;