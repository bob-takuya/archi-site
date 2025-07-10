import { createTheme, ThemeOptions } from '@mui/material/styles';

// Japanese cultural color palette with warm earth tones
const japaneseColorPalette = {
  primary: {
    main: '#8B4513',     // Saddle Brown (warm, earthy)
    light: '#CD853F',    // Peru
    dark: '#654321',     // Dark Brown
    contrastText: '#FFFFFF',
  },
  secondary: {
    main: '#D2691E',     // Chocolate Orange
    light: '#F4A460',    // Sandy Brown
    dark: '#A0522D',     // Sienna
    contrastText: '#FFFFFF',
  },
  accent: {
    main: '#CD5C5C',     // Indian Red
    light: '#F08080',    // Light Coral
    dark: '#B22222',     // Fire Brick
  },
  background: {
    default: '#FFF8F0',  // Warm cream (reminiscent of traditional Japanese paper)
    paper: '#FFFFFF',    // Pure white
    elevated: '#FFF5EE', // Seashell - slightly warm elevated surfaces
    category: '#F5E6D3', // Warm beige for category cards
  },
  text: {
    primary: '#2F1B14',  // Very dark brown (easier on eyes than pure black)
    secondary: '#5D4037', // Brown for secondary text
    disabled: '#BCAAA4', // Light brown gray
  },
  divider: '#D7CCC8',    // Light brown divider
  success: {
    main: '#689F38',     // Natural green
    light: '#8BC34A',
    dark: '#558B2F',
  },
  warning: {
    main: '#FF8F00',     // Amber
    light: '#FFC947',
    dark: '#FF6F00',
  },
  error: {
    main: '#D32F2F',     // Red
    light: '#EF5350',
    dark: '#C62828',
  },
  info: {
    main: '#0277BD',     // Blue
    light: '#03A9F4',
    dark: '#01579B',
  },
  // Japanese-specific colors for categories
  categories: {
    residential: '#8D6E63',  // Brown
    commercial: '#5D4037',   // Dark brown
    cultural: '#D84315',     // Deep orange
    religious: '#6A1B9A',    // Purple
    educational: '#1565C0',  // Blue
    transportation: '#2E7D32', // Green
    modern: '#424242',       // Gray
    traditional: '#BF360C',  // Red brown
  }
};

// Enhanced typography optimized for Japanese text
const japaneseTypography = {
  fontFamily: '"Noto Sans JP", "Hiragino Kaku Gothic ProN", "Hiragino Sans", "Yu Gothic", "Meiryo", "Inter", "Roboto", sans-serif',
  h1: {
    fontSize: '2.75rem',
    fontWeight: 700,
    lineHeight: 1.3,
    letterSpacing: '-0.01em',
    fontFeatureSettings: '"palt" 1', // Proportional alternate spacing for Japanese
  },
  h2: {
    fontSize: '2.25rem',
    fontWeight: 600,
    lineHeight: 1.35,
    letterSpacing: '-0.005em',
    fontFeatureSettings: '"palt" 1',
  },
  h3: {
    fontSize: '1.875rem',
    fontWeight: 600,
    lineHeight: 1.4,
    fontFeatureSettings: '"palt" 1',
  },
  h4: {
    fontSize: '1.5rem',
    fontWeight: 600,
    lineHeight: 1.45,
    fontFeatureSettings: '"palt" 1',
  },
  h5: {
    fontSize: '1.25rem',
    fontWeight: 600,
    lineHeight: 1.5,
    fontFeatureSettings: '"palt" 1',
  },
  h6: {
    fontSize: '1.125rem',
    fontWeight: 600,
    lineHeight: 1.5,
    fontFeatureSettings: '"palt" 1',
  },
  subtitle1: {
    fontSize: '1rem',
    fontWeight: 500,
    lineHeight: 1.6,
    letterSpacing: '0.01em',
  },
  subtitle2: {
    fontSize: '0.875rem',
    fontWeight: 500,
    lineHeight: 1.6,
    letterSpacing: '0.01em',
  },
  body1: {
    fontSize: '1rem',
    fontWeight: 400,
    lineHeight: 1.7, // Increased for better Japanese text readability
    letterSpacing: '0.005em',
  },
  body2: {
    fontSize: '0.875rem',
    fontWeight: 400,
    lineHeight: 1.7,
    letterSpacing: '0.005em',
  },
  caption: {
    fontSize: '0.75rem',
    fontWeight: 400,
    lineHeight: 1.6,
    letterSpacing: '0.01em',
  },
  button: {
    fontSize: '0.875rem',
    fontWeight: 600,
    textTransform: 'none' as const,
    letterSpacing: '0.02em',
  },
};

// Enhanced component styling for Japanese UX patterns
const japaneseComponents = {
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: 6, // Slightly less rounded for Japanese aesthetic
        padding: '12px 28px',
        transition: 'all 0.2s ease-in-out',
        fontWeight: 600,
        '&:hover': {
          transform: 'translateY(-1px)',
          boxShadow: '0 4px 12px rgba(139, 69, 19, 0.3)', // Brown shadow
        },
      },
      contained: {
        boxShadow: '0 2px 8px rgba(139, 69, 19, 0.2)',
        '&:hover': {
          boxShadow: '0 4px 16px rgba(139, 69, 19, 0.3)',
        },
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        boxShadow: '0 2px 12px rgba(139, 69, 19, 0.12)',
        transition: 'all 0.3s ease-in-out',
        border: '1px solid rgba(139, 69, 19, 0.08)',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 24px rgba(139, 69, 19, 0.2)',
          borderColor: 'rgba(139, 69, 19, 0.15)',
        },
      },
    },
  },
  MuiTextField: {
    styleOverrides: {
      root: {
        '& .MuiOutlinedInput-root': {
          borderRadius: 6,
          backgroundColor: '#FFFFFF',
          transition: 'all 0.2s ease-in-out',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(139, 69, 19, 0.23)',
          },
          '&:hover': {
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: japaneseColorPalette.primary.main,
            },
          },
          '&.Mui-focused': {
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: japaneseColorPalette.primary.main,
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
        boxShadow: '0 2px 12px rgba(139, 69, 19, 0.15)',
        backdropFilter: 'blur(10px)',
        backgroundColor: 'rgba(139, 69, 19, 0.95)',
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: {
        borderRadius: 6,
        fontWeight: 500,
        '&.MuiChip-filled': {
          backgroundColor: japaneseColorPalette.background.category,
          color: japaneseColorPalette.text.primary,
          border: `1px solid ${japaneseColorPalette.primary.main}`,
        },
      },
    },
  },
  MuiPaper: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        boxShadow: '0 2px 12px rgba(139, 69, 19, 0.08)',
        border: '1px solid rgba(139, 69, 19, 0.05)',
      },
      elevation1: {
        boxShadow: '0 2px 8px rgba(139, 69, 19, 0.06)',
      },
      elevation2: {
        boxShadow: '0 4px 12px rgba(139, 69, 19, 0.1)',
      },
      elevation3: {
        boxShadow: '0 8px 24px rgba(139, 69, 19, 0.15)',
      },
    },
  },
  // Japanese-specific component for category cards
  MuiCategoryCard: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        padding: '16px',
        textAlign: 'center',
        transition: 'all 0.2s ease-in-out',
        cursor: 'pointer',
        border: '2px solid transparent',
        '&:hover': {
          transform: 'translateY(-3px)',
          borderColor: japaneseColorPalette.primary.main,
          boxShadow: '0 6px 20px rgba(139, 69, 19, 0.2)',
        },
      },
    },
  },
};

// Create Japanese-inspired theme
export const japaneseTheme = createTheme({
  palette: japaneseColorPalette,
  typography: japaneseTypography,
  components: japaneseComponents,
  spacing: 8,
  shape: {
    borderRadius: 6, // Slightly less rounded for Japanese aesthetic
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
  // Custom Japanese design tokens
  customTokens: {
    informationDensity: 'high', // Japanese users prefer comprehensive information
    navigationStyle: 'browse-first', // Category browsing over search
    visualHierarchy: 'detailed', // More detailed information display
    colorTemperature: 'warm', // Warm earth tones
    borderStyle: 'subtle', // Subtle borders for clean appearance
  },
} as ThemeOptions & { customTokens: any });

export default japaneseTheme;