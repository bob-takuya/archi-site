import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  TextField,
  InputAdornment,
  IconButton,
  Box,
  Chip,
  Typography,
  Fade,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  Mic as MicIcon,
  CameraAlt as CameraIcon,
  TravelExplore as ExploreIcon
} from '@mui/icons-material';
import { AutocompleteService } from '../../services/db/AutocompleteService';
import { useGestureNavigation } from '../../hooks/useGestureNavigation';
import { useHapticFeedback } from '../../hooks/useHapticFeedback';
import type { SearchSuggestion } from '../../types/search';

interface TouchOptimizedSearchBarProps {
  onSearch: (query: string) => void;
  onVoiceSearch?: () => void;
  onCameraSearch?: () => void;
  onRandomDiscovery?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
  gestureEnabled?: boolean;
  showAdvancedOptions?: boolean;
  recentSearches?: string[];
  value?: string;
  onChange?: (value: string) => void;
}

const TouchOptimizedSearchBar: React.FC<TouchOptimizedSearchBarProps> = ({
  onSearch,
  onVoiceSearch,
  onCameraSearch,
  onRandomDiscovery,
  placeholder = "建築名、建築家、場所で検索...",
  autoFocus = false,
  gestureEnabled = true,
  showAdvancedOptions = true,
  recentSearches = [],
  value: controlledValue,
  onChange
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTouch = 'ontouchstart' in window;
  
  const [localValue, setLocalValue] = useState(controlledValue || '');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [recentExpanded, setRecentExpanded] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeout = useRef<NodeJS.Timeout>();
  const autocompleteService = useRef(new AutocompleteService());
  
  // Custom hooks for enhanced mobile experience
  const { handleSwipeGesture } = useGestureNavigation();
  const { triggerHapticFeedback } = useHapticFeedback();
  
  const value = controlledValue !== undefined ? controlledValue : localValue;
  
  const handleValueChange = (newValue: string) => {
    if (controlledValue !== undefined) {
      onChange?.(newValue);
    } else {
      setLocalValue(newValue);
    }
  };
  
  // Debounced autocomplete suggestions
  const updateSuggestions = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    
    try {
      setIsSearching(true);
      const results = await autocompleteService.current.getAutocompleteResults(query, 8);
      setSuggestions(results.suggestions);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Autocomplete error:', error);
      setSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  }, []);
  
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    handleValueChange(newValue);
    
    // Clear existing timeout
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    
    // Set new timeout for autocomplete
    searchTimeout.current = setTimeout(() => {
      updateSuggestions(newValue);
    }, 300);
  };
  
  const handleSearch = useCallback((searchQuery?: string) => {
    const query = searchQuery || value;
    if (query.trim()) {
      // Trigger haptic feedback on touch devices
      if (isTouch) {
        triggerHapticFeedback('selection');
      }
      
      onSearch(query.trim());
      setShowSuggestions(false);
      
      // Add to recent searches
      if (!recentSearches.includes(query.trim())) {
        // This would typically be handled by parent component
        console.log('Adding to recent searches:', query.trim());
      }
    }
  }, [value, onSearch, isTouch, triggerHapticFeedback, recentSearches]);
  
  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    handleValueChange(suggestion.text);
    handleSearch(suggestion.text);
    
    // Trigger haptic feedback
    if (isTouch) {
      triggerHapticFeedback('impact');
    }
  };
  
  const handleClear = () => {
    handleValueChange('');
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
    
    if (isTouch) {
      triggerHapticFeedback('selection');
    }
  };
  
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSearch();
    } else if (event.key === 'Escape') {
      setShowSuggestions(false);
    }
  };
  
  const handleVoiceSearch = () => {
    if (isTouch) {
      triggerHapticFeedback('impact');
    }
    onVoiceSearch?.();
  };
  
  const handleCameraSearch = () => {
    if (isTouch) {
      triggerHapticFeedback('impact');
    }
    onCameraSearch?.();
  };
  
  const handleRandomDiscovery = () => {
    if (isTouch) {
      triggerHapticFeedback('success');
    }
    onRandomDiscovery?.();
  };
  
  // Gesture handling for swipe-to-clear
  const handleGestureStart = (event: React.TouchEvent) => {
    if (!gestureEnabled) return;
    
    const touch = event.touches[0];
    const startX = touch.clientX;
    
    const handleGestureMove = (moveEvent: TouchEvent) => {
      const currentTouch = moveEvent.touches[0];
      const deltaX = currentTouch.clientX - startX;
      
      // Swipe right to clear (threshold: 100px)
      if (deltaX > 100 && value) {
        handleClear();
        document.removeEventListener('touchmove', handleGestureMove);
        document.removeEventListener('touchend', handleGestureEnd);
      }
    };
    
    const handleGestureEnd = () => {
      document.removeEventListener('touchmove', handleGestureMove);
      document.removeEventListener('touchend', handleGestureEnd);
    };
    
    document.addEventListener('touchmove', handleGestureMove);
    document.addEventListener('touchend', handleGestureEnd);
  };
  
  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, []);
  
  return (
    <Box sx={{ position: 'relative', width: '100%' }}>
      <TextField
        ref={inputRef}
        fullWidth
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onTouchStart={handleGestureStart}
        placeholder={placeholder}
        autoFocus={autoFocus}
        data-testid="search-bar"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon 
                sx={{ 
                  color: theme.palette.text.secondary,
                  fontSize: isMobile ? 24 : 20
                }} 
              />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                {value && (
                  <IconButton
                    onClick={handleClear}
                    size={isMobile ? 'medium' : 'small'}
                    aria-label="検索をクリア"
                    sx={{
                      minWidth: 44,
                      minHeight: 44,
                      '@media (max-width:600px)': {
                        minWidth: 48,
                        minHeight: 48
                      }
                    }}
                  >
                    <ClearIcon />
                  </IconButton>
                )}
                
                {showAdvancedOptions && (
                  <>
                    {onVoiceSearch && (
                      <IconButton
                        onClick={handleVoiceSearch}
                        size={isMobile ? 'medium' : 'small'}
                        aria-label="音声検索"
                        sx={{
                          minWidth: 44,
                          minHeight: 44,
                          '@media (max-width:600px)': {
                            minWidth: 48,
                            minHeight: 48
                          }
                        }}
                      >
                        <MicIcon />
                      </IconButton>
                    )}
                    
                    {onCameraSearch && (
                      <IconButton
                        onClick={handleCameraSearch}
                        size={isMobile ? 'medium' : 'small'}
                        aria-label="画像検索"
                        sx={{
                          minWidth: 44,
                          minHeight: 44,
                          '@media (max-width:600px)': {
                            minWidth: 48,
                            minHeight: 48
                          }
                        }}
                      >
                        <CameraIcon />
                      </IconButton>
                    )}
                    
                    {onRandomDiscovery && (
                      <IconButton
                        onClick={handleRandomDiscovery}
                        size={isMobile ? 'medium' : 'small'}
                        aria-label="ランダム発見"
                        sx={{
                          minWidth: 44,
                          minHeight: 44,
                          '@media (max-width:600px)': {
                            minWidth: 48,
                            minHeight: 48
                          }
                        }}
                      >
                        <ExploreIcon />
                      </IconButton>
                    )}
                  </>
                )}
              </Box>
            </InputAdornment>
          ),
          sx: {
            borderRadius: 3,
            backgroundColor: theme.palette.background.paper,
            '& .MuiOutlinedInput-input': {
              padding: isMobile ? '16px 14px' : '12px 14px',
              fontSize: isMobile ? 16 : 14, // Prevents zoom on iOS
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: theme.palette.secondary.main,
              borderWidth: 2,
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: theme.palette.primary.main,
              borderWidth: 2,
            }
          }
        }}
      />
      
      {/* Recent Searches */}
      {!value && recentSearches.length > 0 && (
        <Fade in={!showSuggestions}>
          <Box sx={{ 
            mt: 1, 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: 1,
            maxHeight: recentExpanded ? 'none' : 60,
            overflow: 'hidden'
          }}>
            <Typography variant="caption" sx={{ width: '100%', color: 'text.secondary' }}>
              最近の検索
            </Typography>
            {recentSearches.slice(0, recentExpanded ? undefined : 3).map((search, index) => (
              <Chip
                key={index}
                label={search}
                size="small"
                onClick={() => handleSuggestionClick({ 
                  id: `recent-${index}`, 
                  text: search, 
                  type: 'recent',
                  count: 0,
                  icon: 'history'
                })}
                sx={{
                  height: 32,
                  fontSize: '0.875rem',
                  '&:hover': {
                    backgroundColor: theme.palette.action.hover,
                  },
                  '&:active': {
                    transform: 'scale(0.95)',
                  }
                }}
              />
            ))}
            {recentSearches.length > 3 && (
              <Chip
                label={recentExpanded ? "折りたたむ" : `他${recentSearches.length - 3}件`}
                size="small"
                variant="outlined"
                onClick={() => setRecentExpanded(!recentExpanded)}
              />
            )}
          </Box>
        </Fade>
      )}
      
      {/* Autocomplete Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <Fade in={showSuggestions}>
          <Box
            sx={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              zIndex: 1000,
              mt: 1,
              backgroundColor: theme.palette.background.paper,
              borderRadius: 2,
              boxShadow: theme.shadows[8],
              border: `1px solid ${theme.palette.divider}`,
              maxHeight: 300,
              overflow: 'auto'
            }}
            data-testid="autocomplete-suggestions"
          >
            {suggestions.map((suggestion, index) => (
              <Box
                key={suggestion.id}
                onClick={() => handleSuggestionClick(suggestion)}
                data-testid="suggestion-item"
                sx={{
                  p: 2,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  minHeight: 48, // Touch-friendly height
                  borderBottom: index < suggestions.length - 1 ? `1px solid ${theme.palette.divider}` : 'none',
                  '&:hover': {
                    backgroundColor: theme.palette.action.hover,
                  },
                  '&:active': {
                    backgroundColor: theme.palette.action.selected,
                    transform: 'scale(0.98)',
                  },
                  transition: 'all 0.1s ease-in-out',
                }}
              >
                <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {suggestion.text}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {suggestion.type === 'architecture' && '建築'}
                    {suggestion.type === 'architect' && '建築家'}
                    {suggestion.type === 'location' && '場所'}
                    {suggestion.type === 'category' && 'カテゴリ'}
                    {suggestion.count > 0 && ` • ${suggestion.count}件`}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Fade>
      )}
    </Box>
  );
};

export default TouchOptimizedSearchBar;