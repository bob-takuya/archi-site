import { createTheme, ThemeOptions } from '@mui/material/styles';

// Modern architecture-inspired color palette
const palette = {
  primary: {
    main: '#2E3440',     // Dark blue-gray (Nordic dark)
    light: '#4C566A',    // Lighter blue-gray
    dark: '#1B1F2B',     // Darker blue-gray
    contrastText: '#FFFFFF',
  },
  secondary: {
    main: '#88C0D0',     // Soft blue (Nordic frost)
    light: '#B3D4E0',    // Lighter blue
    dark: '#5E81AC',     // Darker blue
    contrastText: '#2E3440',
  },
  accent: {
    main: '#D08770',     // Warm orange (Nordic aurora)
    light: '#E5A088',    // Lighter orange
    dark: '#BF616A',     // Coral red
  },
  background: {
    default: '#ECEFF4',  // Light gray (Nordic snow)
    paper: '#FFFFFF',    // Pure white
    elevated: '#F8F9FA', // Slightly elevated
  },
  text: {
    primary: '#2E3440',  // Dark blue-gray
    secondary: '#4C566A', // Medium blue-gray
    disabled: '#D8DEE9', // Light gray
  },
  divider: '#E5E9F0',    // Light gray divider
  success: {
    main: '#A3BE8C',     // Green (Nordic aurora)
    light: '#B8CCA3',
    dark: '#8CAF69',
  },
  warning: {
    main: '#EBCB8B',     // Yellow (Nordic aurora)
    light: '#F0D5A3',
    dark: '#D4B571',
  },
  error: {
    main: '#BF616A',     // Red (Nordic aurora)
    light: '#CC8088',
    dark: '#A54A56',
  },
  info: {
    main: '#88C0D0',     // Blue (Nordic frost)
    light: '#B3D4E0',
    dark: '#5E81AC',
  },
};

// Enhanced typography with better hierarchy
const typography = {
  fontFamily: '"Inter", "Roboto", "Helvetica Neue", "Arial", sans-serif',
  h1: {
    fontSize: '3rem',
    fontWeight: 700,
    lineHeight: 1.2,
    letterSpacing: '-0.02em',
  },
  h2: {
    fontSize: '2.25rem',
    fontWeight: 600,
    lineHeight: 1.3,
    letterSpacing: '-0.01em',
  },
  h3: {
    fontSize: '1.875rem',
    fontWeight: 600,
    lineHeight: 1.3,
    letterSpacing: '-0.01em',
  },
  h4: {
    fontSize: '1.5rem',
    fontWeight: 600,
    lineHeight: 1.4,
  },
  h5: {
    fontSize: '1.25rem',
    fontWeight: 600,
    lineHeight: 1.4,
  },
  h6: {
    fontSize: '1.125rem',
    fontWeight: 600,
    lineHeight: 1.4,
  },
  subtitle1: {
    fontSize: '1rem',
    fontWeight: 500,
    lineHeight: 1.5,
  },
  subtitle2: {
    fontSize: '0.875rem',
    fontWeight: 500,
    lineHeight: 1.5,
  },
  body1: {
    fontSize: '1rem',
    fontWeight: 400,
    lineHeight: 1.6,
  },
  body2: {
    fontSize: '0.875rem',
    fontWeight: 400,
    lineHeight: 1.6,
  },
  caption: {
    fontSize: '0.75rem',
    fontWeight: 400,
    lineHeight: 1.5,
  },
  button: {
    fontSize: '0.875rem',
    fontWeight: 600,
    textTransform: 'none' as const,
    letterSpacing: '0.02em',
  },
};

// Enhanced component styling
const components = {
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        padding: '10px 24px',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-1px)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        },
      },
      contained: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 12,
        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
        transition: 'all 0.3s ease-in-out',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
        },
      },
    },
  },
  MuiTextField: {
    styleOverrides: {
      root: {
        '& .MuiOutlinedInput-root': {
          borderRadius: 8,
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: palette.secondary.main,
            },
          },
          '&.Mui-focused': {
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: palette.primary.main,
              borderWidth: 2,
            },
          },
        },
      },
    },
  },
  MuiAppBar: {
    styleOverrides: {
      root: {
        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.1)',
        backdropFilter: 'blur(10px)',
        backgroundColor: 'rgba(46, 52, 64, 0.95)',
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        fontWeight: 500,
      },
    },
  },
  MuiPaper: {
    styleOverrides: {
      root: {
        borderRadius: 12,
        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
      },
      elevation1: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
      },
      elevation2: {
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      },
      elevation3: {
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
      },
    },
  },
};

// Create theme with enhanced styling
export const theme = createTheme({
  palette,
  typography,
  components,
  spacing: 8,
  shape: {
    borderRadius: 8,
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 960,
      lg: 1280,
      xl: 1920,
    },
  },
  transitions: {
    easing: {
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
    },
  },
} as ThemeOptions);