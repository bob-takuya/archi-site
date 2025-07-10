import { createTheme, ThemeOptions } from '@mui/material/styles';
import { theme as baseTheme } from './theme';

/**
 * Enhanced mobile-optimized theme
 * Improves touch targets, typography, and spacing for mobile devices
 */

// Touch target sizes (minimum 44px for accessibility)
const TOUCH_TARGET = {
  minimum: 44,    // WCAG minimum
  comfortable: 48, // Comfortable touch target
  large: 56       // Large touch target
};

// Mobile-specific breakpoints
const mobileBreakpoints = {
  values: {
    xs: 0,
    sm: 600,
    md: 960,
    lg: 1280,
    xl: 1920,
  },
};

// Enhanced typography for mobile readability
const mobileTypography = {
  ...baseTheme.typography,
  
  // Larger base font size for mobile
  fontSize: 16, // Increased from 14px
  
  h1: {
    ...baseTheme.typography.h1,
    fontSize: '2.5rem', // Reduced from 3rem for mobile
    lineHeight: 1.1,
    letterSpacing: '-0.02em',
    '@media (max-width:600px)': {
      fontSize: '2rem',
    },
  },
  
  h2: {
    ...baseTheme.typography.h2,
    fontSize: '2rem', // Reduced from 2.25rem
    lineHeight: 1.2,
    '@media (max-width:600px)': {
      fontSize: '1.75rem',
    },
  },
  
  h3: {
    ...baseTheme.typography.h3,
    fontSize: '1.75rem', // Reduced from 1.875rem
    lineHeight: 1.2,
    '@media (max-width:600px)': {
      fontSize: '1.5rem',
    },
  },
  
  h4: {
    ...baseTheme.typography.h4,
    fontSize: '1.5rem',
    lineHeight: 1.3,
    '@media (max-width:600px)': {
      fontSize: '1.25rem',
    },
  },
  
  h5: {
    ...baseTheme.typography.h5,
    fontSize: '1.25rem',
    lineHeight: 1.3,
    '@media (max-width:600px)': {
      fontSize: '1.125rem',
    },
  },
  
  h6: {
    ...baseTheme.typography.h6,
    fontSize: '1.125rem',
    lineHeight: 1.4,
    '@media (max-width:600px)': {
      fontSize: '1rem',
    },
  },
  
  body1: {
    ...baseTheme.typography.body1,
    fontSize: '1rem',
    lineHeight: 1.6,
    '@media (max-width:600px)': {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
  },
  
  body2: {
    ...baseTheme.typography.body2,
    fontSize: '0.875rem',
    lineHeight: 1.6,
    '@media (max-width:600px)': {
      fontSize: '0.8125rem',
      lineHeight: 1.5,
    },
  },
  
  button: {
    ...baseTheme.typography.button,
    fontSize: '1rem', // Increased from 0.875rem
    fontWeight: 600,
    textTransform: 'none' as const,
    '@media (max-width:600px)': {
      fontSize: '0.875rem',
    },
  },
};

// Mobile-optimized component overrides
const mobileComponents = {
  ...baseTheme.components,
  
  // Enhanced Button component for touch
  MuiButton: {
    styleOverrides: {
      root: {
        minHeight: TOUCH_TARGET.comfortable,
        borderRadius: 12, // Increased for easier touch
        padding: '12px 24px',
        fontSize: '1rem',
        fontWeight: 600,
        textTransform: 'none',
        transition: 'all 0.2s ease-in-out',
        
        // Touch feedback
        '&:active': {
          transform: 'scale(0.98)',
        },
        
        // Improved hover states for touch devices
        '@media (hover: hover)': {
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: '0 6px 16px rgba(0, 0, 0, 0.15)',
          },
        },
        
        // High contrast mode support
        '@media (prefers-contrast: high)': {
          border: '2px solid currentColor',
        },
        
        // Reduced motion support
        '@media (prefers-reduced-motion: reduce)': {
          transition: 'none',
          '&:hover': {
            transform: 'none',
          },
        },
        
        // Mobile-specific adjustments
        '@media (max-width:600px)': {
          minHeight: TOUCH_TARGET.comfortable,
          padding: '14px 20px',
          fontSize: '0.875rem',
          borderRadius: 8,
        },
      },
      
      sizeSmall: {
        minHeight: TOUCH_TARGET.minimum,
        padding: '8px 16px',
        fontSize: '0.875rem',
        '@media (max-width:600px)': {
          minHeight: TOUCH_TARGET.minimum,
          padding: '10px 14px',
          fontSize: '0.8125rem',
        },
      },
      
      sizeLarge: {
        minHeight: TOUCH_TARGET.large,
        padding: '16px 32px',
        fontSize: '1.125rem',
        '@media (max-width:600px)': {
          minHeight: TOUCH_TARGET.large,
          padding: '18px 28px',
          fontSize: '1rem',
        },
      },
    },
  },
  
  // Enhanced IconButton for touch
  MuiIconButton: {
    styleOverrides: {
      root: {
        minWidth: TOUCH_TARGET.comfortable,
        minHeight: TOUCH_TARGET.comfortable,
        borderRadius: 12,
        
        '&:active': {
          transform: 'scale(0.95)',
        },
        
        '@media (max-width:600px)': {
          minWidth: TOUCH_TARGET.comfortable,
          minHeight: TOUCH_TARGET.comfortable,
        },
      },
      
      sizeSmall: {
        minWidth: TOUCH_TARGET.minimum,
        minHeight: TOUCH_TARGET.minimum,
        '@media (max-width:600px)': {
          minWidth: TOUCH_TARGET.minimum,
          minHeight: TOUCH_TARGET.minimum,
        },
      },
      
      sizeLarge: {
        minWidth: TOUCH_TARGET.large,
        minHeight: TOUCH_TARGET.large,
        '@media (max-width:600px)': {
          minWidth: TOUCH_TARGET.large,
          minHeight: TOUCH_TARGET.large,
        },
      },
    },
  },
  
  // Enhanced TextField for mobile input
  MuiTextField: {
    styleOverrides: {
      root: {
        '& .MuiOutlinedInput-root': {
          borderRadius: 12,
          fontSize: '1rem',
          minHeight: TOUCH_TARGET.comfortable,
          
          '& input': {
            padding: '14px 16px',
            fontSize: '1rem',
            '@media (max-width:600px)': {
              fontSize: '16px', // Prevents zoom on iOS
              padding: '16px',
            },
          },
          
          '& textarea': {
            fontSize: '1rem',
            '@media (max-width:600px)': {
              fontSize: '16px', // Prevents zoom on iOS
            },
          },
          
          '&:hover': {
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: baseTheme.palette.secondary.main,
              borderWidth: '2px',
            },
          },
          
          '&.Mui-focused': {
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: baseTheme.palette.primary.main,
              borderWidth: '2px',
            },
          },
        },
      },
    },
  },
  
  // Enhanced Card for touch interaction
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 16,
        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
        transition: 'all 0.3s ease-in-out',
        
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
        },
        
        '&:active': {
          transform: 'translateY(-1px)',
        },
        
        '@media (prefers-reduced-motion: reduce)': {
          transition: 'none',
          '&:hover': {
            transform: 'none',
          },
        },
        
        '@media (max-width:600px)': {
          borderRadius: 12,
          margin: '8px',
        },
      },
    },
  },
  
  // Enhanced Chip for touch
  MuiChip: {
    styleOverrides: {
      root: {
        height: TOUCH_TARGET.minimum,
        borderRadius: 22,
        fontSize: '0.875rem',
        fontWeight: 500,
        
        '&.MuiChip-clickable': {
          '&:active': {
            transform: 'scale(0.95)',
          },
        },
        
        '@media (max-width:600px)': {
          height: TOUCH_TARGET.minimum,
          fontSize: '0.8125rem',
        },
      },
      
      deleteIcon: {
        fontSize: '18px',
        '&:hover': {
          color: 'inherit',
        },
      },
    },
  },
  
  // Enhanced Drawer for mobile
  MuiDrawer: {
    styleOverrides: {
      paper: {
        borderRadius: '16px 0 0 16px',
        
        '@media (max-width:600px)': {
          width: '85%',
          maxWidth: 320,
        },
      },
    },
  },
  
  // Enhanced AppBar
  MuiAppBar: {
    styleOverrides: {
      root: {
        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.1)',
        backdropFilter: 'blur(10px)',
        backgroundColor: 'rgba(46, 52, 64, 0.95)',
        
        '@media (max-width:600px)': {
          minHeight: 64, // Slightly taller on mobile
        },
      },
    },
  },
  
  // Enhanced Toolbar
  MuiToolbar: {
    styleOverrides: {
      root: {
        minHeight: 64,
        padding: '0 16px',
        
        '@media (max-width:600px)': {
          minHeight: 64,
          padding: '0 8px',
        },
      },
    },
  },
  
  // Enhanced Paper
  MuiPaper: {
    styleOverrides: {
      root: {
        borderRadius: 16,
        
        '@media (max-width:600px)': {
          borderRadius: 12,
        },
      },
    },
  },
  
  // Enhanced List for touch navigation
  MuiListItem: {
    styleOverrides: {
      root: {
        minHeight: TOUCH_TARGET.comfortable,
        borderRadius: 8,
        margin: '2px 8px',
        
        '&.Mui-selected': {
          backgroundColor: 'rgba(0, 0, 0, 0.08)',
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.12)',
          },
        },
        
        '@media (max-width:600px)': {
          minHeight: TOUCH_TARGET.large, // Larger touch targets on mobile
          padding: '12px 16px',
        },
      },
    },
  },
};

// Create mobile-optimized theme
export const mobileTheme = createTheme({
  ...baseTheme,
  breakpoints: mobileBreakpoints,
  typography: mobileTypography,
  components: mobileComponents,
  
  // Mobile-specific spacing
  spacing: 8,
  
  // Enhanced shadows for mobile
  shadows: [
    'none',
    '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
    '0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23)',
    '0 10px 20px rgba(0, 0, 0, 0.19), 0 6px 6px rgba(0, 0, 0, 0.23)',
    '0 14px 28px rgba(0, 0, 0, 0.25), 0 10px 10px rgba(0, 0, 0, 0.22)',
    '0 19px 38px rgba(0, 0, 0, 0.30), 0 15px 12px rgba(0, 0, 0, 0.22)',
    '0 24px 48px rgba(0, 0, 0, 0.35), 0 19px 19px rgba(0, 0, 0, 0.22)',
    ...baseTheme.shadows.slice(7),
  ] as any,
  
  // Mobile shape configuration
  shape: {
    borderRadius: 12,
  },
} as ThemeOptions);

// Touch target size constants for export
export const touchTargets = TOUCH_TARGET;

// Utility functions for mobile optimization
export const isMobileDevice = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

export const isTouchDevice = (): boolean => {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

export const getViewportSize = () => {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
    isMobile: window.innerWidth < 600,
    isTablet: window.innerWidth >= 600 && window.innerWidth < 960,
    isDesktop: window.innerWidth >= 960,
  };
};