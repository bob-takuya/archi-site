import React, { useState, useCallback } from 'react';
import { 
  InputBase, 
  IconButton, 
  Paper, 
  Tooltip
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
}

/**
 * SearchBar component for searching content
 */
export const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = '検索',
  value = '',
  onChange,
  onSearch,
  fullWidth = true,
  variant = 'outlined',
  size = 'medium',
  ariaLabel = '検索',
}) => {
  const [inputValue, setInputValue] = useState(value);

  // Update internal state when external value changes
  React.useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Handle input changes
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange?.(newValue);
  }, [onChange]);

  // Handle search submission
  const handleSearch = useCallback(() => {
    onSearch?.(inputValue);
  }, [inputValue, onSearch]);

  // Handle clear button click
  const handleClear = useCallback(() => {
    setInputValue('');
    onChange?.('');
    onSearch?.('');
  }, [onChange, onSearch]);

  // Handle Enter key press
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  }, [handleSearch]);

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
        ...getSizeProps().sx
      }}
    >
      <InputBase
        sx={{ ml: 1, flex: 1 }}
        placeholder={placeholder}
        inputProps={{ 'aria-label': ariaLabel }}
        value={inputValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        fullWidth={fullWidth}
      />
      {inputValue && (
        <Tooltip title="クリア">
          <IconButton 
            size="small" 
            aria-label="clear" 
            onClick={handleClear}
          >
            <ClearIcon />
          </IconButton>
        </Tooltip>
      )}
      <Tooltip title="検索">
        <IconButton 
          size="small" 
          aria-label="search" 
          onClick={handleSearch}
        >
          <SearchIcon />
        </IconButton>
      </Tooltip>
    </Paper>
  );
};

export default SearchBar;