import React, { useState, useCallback, useRef, useEffect, forwardRef } from 'react';
import { 
  InputBase, 
  IconButton, 
  Paper, 
  Tooltip,
  useTheme,
  alpha,
  Box,
  CircularProgress
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';

export interface SearchBarProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onSearch?: (value: string) => void;
  fullWidth?: boolean;
  variant?: 'outlined' | 'elevated' | 'filled';
  size?: 'small' | 'medium' | 'large';
  ariaLabel?: string;
  ariaDescribedBy?: string;
  // Performance optimizations
  debounceMs?: number;
  enableDebounce?: boolean;
  // Enhanced functionality
  loading?: boolean;
  disabled?: boolean;
  autoComplete?: string;
  clearButtonLabel?: string;
  searchButtonLabel?: string;
}

/**
 * Performance-optimized SearchBar component with debouncing
 * - 300ms debounce for search queries
 * - React.memo optimization
 * - Cleanup on unmount
 * - Immediate search on Enter key
 */
export const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(({
  placeholder = '検索',
  value = '',
  onChange,
  onSearch,
  fullWidth = true,
  variant = 'outlined',
  size = 'medium',
  ariaLabel = '検索',
  ariaDescribedBy,
  debounceMs = 300,
  enableDebounce = true,
  loading = false,
  disabled = false,
  autoComplete = 'off',
  clearButtonLabel = 'クリア',
  searchButtonLabel = '検索',
  ...props
}, ref) => {
  const theme = useTheme();
  
  const [inputValue, setInputValue] = useState(value);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSearchValueRef = useRef<string>('');
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Update internal state when external value changes
  useEffect(() => {
    setInputValue(value);
    lastSearchValueRef.current = value;
  }, [value]);

  // Debounced search function
  const debouncedSearch = useCallback((searchValue: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = setTimeout(() => {
      if (searchValue !== lastSearchValueRef.current) {
        onSearch?.(searchValue);
        lastSearchValueRef.current = searchValue;
      }
    }, debounceMs);
  }, [onSearch, debounceMs]);

  // Handle input changes with debouncing
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange?.(newValue);
    
    // Apply debouncing for search if enabled
    if (enableDebounce && onSearch) {
      debouncedSearch(newValue);
    }
  }, [onChange, onSearch, enableDebounce, debouncedSearch]);

  // Handle search submission (immediate, bypassing debounce)
  const handleSearch = useCallback(() => {
    // Clear any pending debounced search
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    onSearch?.(inputValue);
    lastSearchValueRef.current = inputValue;
  }, [inputValue, onSearch]);

  // Handle clear button click
  const handleClear = useCallback(() => {
    // Clear any pending debounced search
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    setInputValue('');
    onChange?.('');
    onSearch?.('');
    lastSearchValueRef.current = '';
    
    // Focus back to input after clearing
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [onChange, onSearch]);

  // Handle Enter key press (immediate search, bypassing debounce)
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  }, [handleSearch]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Style variations based on props
  const getElevation = () => {
    switch (variant) {
      case 'elevated':
        return 3;
      case 'filled':
        return 0;
      case 'outlined':
      default:
        return 1;
    }
  };

  // Size variations
  const getSizeProps = () => {
    switch (size) {
      case 'small':
        return { sx: { py: 0.5, px: 1 } };
      case 'large':
        return { sx: { py: 1.5, px: 2 } };
      case 'medium':
      default:
        return { sx: { py: 1, px: 1.5 } };
    }
  };

  return (
    <Paper
      component="form"
      elevation={getElevation()}
      sx={{
        display: 'flex',
        alignItems: 'center',
        width: fullWidth ? '100%' : 'auto',
        border: variant === 'outlined' ? 1 : 0,
        borderColor: 'divider',
        backgroundColor: variant === 'filled' ? 'action.hover' : 'background.paper',
        opacity: disabled ? 0.6 : 1,
        pointerEvents: disabled ? 'none' : 'auto',
        ...getSizeProps().sx,
        // Performance optimization: will-change for smooth animations
        willChange: 'transform',
        transition: theme.transitions.create(['box-shadow', 'border-color'], {
          duration: theme.transitions.duration.shorter,
        }),
        '&:focus-within': {
          borderColor: theme.palette.primary.main,
          boxShadow: `${alpha(theme.palette.primary.main, 0.25)} 0 0 0 2px`,
        },
      }}
    >
      <InputBase
        ref={inputRef}
        sx={{ ml: 1, flex: 1 }}
        placeholder={placeholder}
        inputProps={{ 
          'aria-label': ariaLabel,
          'aria-describedby': ariaDescribedBy,
          autoComplete,
        }}
        value={inputValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        fullWidth={fullWidth}
        disabled={disabled}
      />
      
      {/* Loading indicator */}
      {loading && (
        <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
          <CircularProgress size={16} />
        </Box>
      )}
      
      {/* Clear button */}
      {inputValue && !loading && (
        <Tooltip title={clearButtonLabel}>
          <IconButton 
            size="small" 
            aria-label={clearButtonLabel}
            onClick={handleClear}
            disabled={disabled}
          >
            <ClearIcon />
          </IconButton>
        </Tooltip>
      )}
      
      {/* Search button */}
      <Tooltip title={searchButtonLabel}>
        <IconButton 
          size="small" 
          aria-label={searchButtonLabel}
          onClick={handleSearch}
          disabled={disabled || loading}
          color={inputValue ? 'primary' : 'default'}
        >
          <SearchIcon />
        </IconButton>
      </Tooltip>
    </Paper>
  );
});

SearchBar.displayName = 'SearchBar';

export default SearchBar;