import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  Box,
  TextField,
  Autocomplete,
  IconButton,
  Chip,
  InputAdornment,
  Paper,
  Typography,
  Collapse,
  useTheme,
  useMediaQuery,
  Fab,
  Drawer,
  Button,
  CircularProgress,
  alpha
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  Mic as MicIcon,
  Camera as CameraIcon,
  Tune as FilterIcon,
  History as HistoryIcon,
  TrendingUp as TrendingIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { debounce } from 'lodash';

// Types
interface AutocompleteSuggestion {
  label: string;
  value: string;
  category: string;
  icon: string;
  count?: number;
  type?: 'recent' | 'trending' | 'suggestion';
}

interface TouchOptimizedSearchBarProps {
  value: AutocompleteSuggestion | null;
  onSearch: (value: AutocompleteSuggestion | null) => void;
  onInputChange: (value: string) => void;
  inputValue: string;
  suggestions: AutocompleteSuggestion[];
  loading?: boolean;
  placeholder?: string;
  onVoiceSearch?: () => void;
  onCameraSearch?: () => void;
  onFilterOpen?: () => void;
  recentSearches?: AutocompleteSuggestion[];
  trendingSearches?: AutocompleteSuggestion[];
}

// Custom hook for haptic feedback
const useHapticFeedback = () => {
  const triggerHaptic = useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
    // iOS TapticEngine
    if ('TapticEngine' in window) {
      try {
        switch (type) {
          case 'light':
            (window as any).TapticEngine.impact({ style: 'light' });
            break;
          case 'medium':
            (window as any).TapticEngine.impact({ style: 'medium' });
            break;
          case 'heavy':
            (window as any).TapticEngine.impact({ style: 'heavy' });
            break;
        }
      } catch (e) {
        console.debug('TapticEngine not available');
      }
    }
    // Android Haptic Feedback
    else if ('vibrate' in navigator) {
      try {
        const patterns = {
          light: [10],
          medium: [20],
          heavy: [30]
        };
        navigator.vibrate(patterns[type]);
      } catch (e) {
        console.debug('Vibration not available');
      }
    }
    // Gamepad vibration fallback
    else if ('getGamepads' in navigator) {
      try {
        const gamepads = navigator.getGamepads();
        for (const gamepad of gamepads) {
          if (gamepad && 'vibrationActuator' in gamepad) {
            (gamepad as any).vibrationActuator.playEffect('dual-rumble', {
              duration: type === 'light' ? 50 : type === 'medium' ? 100 : 150,
              strongMagnitude: 0.1,
              weakMagnitude: 0.1
            });
          }
        }
      } catch (e) {
        console.debug('Gamepad vibration not available');
      }
    }
  }, []);

  return triggerHaptic;
};

// Custom hook for gesture handling
const useGestureHandling = () => {
  const handleSwipe = useCallback((element: HTMLElement, onSwipe: (direction: string) => void) => {
    let startX = 0;
    let startY = 0;
    let endX = 0;
    let endY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      endX = e.changedTouches[0].clientX;
      endY = e.changedTouches[0].clientY;
      
      const deltaX = endX - startX;
      const deltaY = endY - startY;
      const threshold = 50;

      if (Math.abs(deltaX) > threshold || Math.abs(deltaY) > threshold) {
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          onSwipe(deltaX > 0 ? 'right' : 'left');
        } else {
          onSwipe(deltaY > 0 ? 'down' : 'up');
        }
      }
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  return { handleSwipe };
};

const TouchOptimizedSearchBar: React.FC<TouchOptimizedSearchBarProps> = ({
  value,
  onSearch,
  onInputChange,
  inputValue,
  suggestions,
  loading = false,
  placeholder = "建築作品、建築家、場所を検索...",
  onVoiceSearch,
  onCameraSearch,
  onFilterOpen,
  recentSearches = [],
  trendingSearches = []
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isVerySmall = useMediaQuery(theme.breakpoints.down('sm'));
  
  // State
  const [isExpanded, setIsExpanded] = useState(false);
  const [showRecentSearches, setShowRecentSearches] = useState(false);
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  
  // Refs
  const searchInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Custom hooks
  const triggerHaptic = useHapticFeedback();
  const { handleSwipe } = useGestureHandling();

  // Debounced search
  const debouncedSearch = useMemo(
    () => debounce((searchValue: string) => {
      onInputChange(searchValue);
    }, 300),
    [onInputChange]
  );

  // Voice search functionality
  const handleVoiceSearch = useCallback(() => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      console.warn('Speech recognition not supported');
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = 'ja-JP';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsVoiceListening(true);
      triggerHaptic('light');
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onInputChange(transcript);
      triggerHaptic('medium');
    };

    recognition.onerror = () => {
      setIsVoiceListening(false);
      triggerHaptic('heavy');
    };

    recognition.onend = () => {
      setIsVoiceListening(false);
    };

    recognition.start();
    onVoiceSearch?.();
  }, [onInputChange, triggerHaptic, onVoiceSearch]);

  // Enhanced suggestions with recent and trending
  const enhancedSuggestions = useMemo(() => {
    const allSuggestions = [...suggestions];
    
    if (inputValue.length === 0 && showRecentSearches) {
      // Show recent searches when no input
      const recentWithType = recentSearches.map(s => ({ ...s, type: 'recent' as const }));
      const trendingWithType = trendingSearches.map(s => ({ ...s, type: 'trending' as const }));
      return [...recentWithType, ...trendingWithType];
    }
    
    return allSuggestions;
  }, [suggestions, recentSearches, trendingSearches, inputValue, showRecentSearches]);

  // Gesture handling setup
  useEffect(() => {
    if (containerRef.current && isMobile) {
      const cleanup = handleSwipe(containerRef.current, (direction) => {
        if (direction === 'right' && inputValue.length > 0) {
          // Swipe right to clear
          onInputChange('');
          triggerHaptic('light');
        } else if (direction === 'down' && !isExpanded) {
          // Swipe down to expand
          setIsExpanded(true);
          triggerHaptic('light');
        } else if (direction === 'up' && isExpanded) {
          // Swipe up to collapse
          setIsExpanded(false);
          triggerHaptic('light');
        }
      });
      return cleanup;
    }
  }, [handleSwipe, isMobile, inputValue, isExpanded, onInputChange, triggerHaptic]);

  // Mobile-optimized touch targets (minimum 44px)
  const touchTargetStyle = {
    minHeight: '44px',
    minWidth: '44px',
    padding: theme.spacing(1),
  };

  // Enhanced mobile search input
  const renderMobileSearchInput = () => (
    <Box
      ref={containerRef}
      sx={{
        position: 'relative',
        width: '100%',
        mb: isExpanded ? 2 : 0,
        transition: 'all 0.3s ease-in-out',
      }}
    >
      <Autocomplete
        value={value}
        onChange={(event, newValue) => {
          onSearch(newValue);
          triggerHaptic('light');
        }}
        inputValue={inputValue}
        onInputChange={(event, newInputValue) => {
          debouncedSearch(newInputValue);
        }}
        options={enhancedSuggestions}
        groupBy={(option) => option.type || option.category}
        getOptionLabel={(option) => option.label}
        loading={loading}
        freeSolo
        fullWidth
        PopperComponent={(props) => (
          <Paper
            {...props}
            sx={{
              ...props.sx,
              mt: 1,
              maxHeight: '60vh',
              overflow: 'auto',
              '& .MuiAutocomplete-option': {
                minHeight: '48px', // Touch-friendly option height
                padding: theme.spacing(1.5),
              }
            }}
          />
        )}
        renderInput={(params) => (
          <TextField
            {...params}
            ref={searchInputRef}
            placeholder={placeholder}
            variant="outlined"
            fullWidth
            onFocus={() => {
              setIsExpanded(true);
              setShowRecentSearches(true);
              triggerHaptic('light');
            }}
            onBlur={() => {
              setTimeout(() => {
                if (!inputValue) {
                  setIsExpanded(false);
                  setShowRecentSearches(false);
                }
              }, 200);
            }}
            InputProps={{
              ...params.InputProps,
              sx: {
                ...touchTargetStyle,
                borderRadius: isExpanded ? '24px 24px 12px 12px' : '24px',
                backgroundColor: alpha(theme.palette.background.paper, 0.95),
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  backgroundColor: alpha(theme.palette.background.paper, 1),
                },
              },
              startAdornment: (
                <InputAdornment position="start">
                  <IconButton
                    size="small"
                    sx={{
                      ...touchTargetStyle,
                      color: theme.palette.primary.main,
                    }}
                    aria-label="検索"
                  >
                    <SearchIcon />
                  </IconButton>
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {loading && <CircularProgress size={20} />}
                    
                    {inputValue && (
                      <IconButton
                        size="small"
                        onClick={() => {
                          onInputChange('');
                          triggerHaptic('light');
                        }}
                        sx={touchTargetStyle}
                        aria-label="クリア"
                      >
                        <ClearIcon />
                      </IconButton>
                    )}
                    
                    {onVoiceSearch && (
                      <IconButton
                        size="small"
                        onClick={handleVoiceSearch}
                        sx={{
                          ...touchTargetStyle,
                          color: isVoiceListening ? theme.palette.error.main : theme.palette.action.active,
                          animation: isVoiceListening ? 'pulse 1s infinite' : 'none',
                        }}
                        aria-label="音声検索"
                      >
                        <MicIcon />
                      </IconButton>
                    )}
                    
                    {onCameraSearch && (
                      <IconButton
                        size="small"
                        onClick={() => {
                          onCameraSearch();
                          triggerHaptic('light');
                        }}
                        sx={touchTargetStyle}
                        aria-label="画像検索"
                      >
                        <CameraIcon />
                      </IconButton>
                    )}
                  </Box>
                </InputAdornment>
              ),
            }}
          />
        )}
        renderOption={(props, option) => (
          <Box
            component="li"
            {...props}
            sx={{
              ...props.sx,
              minHeight: '48px',
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              padding: theme.spacing(1.5),
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.04),
              },
            }}
            onClick={(e) => {
              props.onClick?.(e);
              triggerHaptic('light');
            }}
          >
            <Typography variant="body2" sx={{ fontSize: '16px' }}>
              {option.icon}
            </Typography>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="body1" sx={{ fontSize: '16px' }}>
                {option.label}
              </Typography>
              {option.count && (
                <Typography variant="caption" color="text.secondary">
                  {option.count}件
                </Typography>
              )}
            </Box>
            {option.type === 'recent' && (
              <HistoryIcon sx={{ color: 'text.secondary', fontSize: '16px' }} />
            )}
            {option.type === 'trending' && (
              <TrendingIcon sx={{ color: 'warning.main', fontSize: '16px' }} />
            )}
          </Box>
        )}
      />
    </Box>
  );

  // Quick action buttons for mobile
  const renderQuickActions = () => (
    <Collapse in={isExpanded && isMobile}>
      <Box
        sx={{
          display: 'flex',
          gap: 1,
          flexWrap: 'wrap',
          mb: 2,
          px: 1,
        }}
      >
        <Chip
          icon={<HistoryIcon />}
          label="最近の検索"
          onClick={() => {
            setShowRecentSearches(!showRecentSearches);
            triggerHaptic('light');
          }}
          sx={{
            ...touchTargetStyle,
            backgroundColor: showRecentSearches 
              ? alpha(theme.palette.primary.main, 0.1)
              : 'transparent',
          }}
        />
        <Chip
          icon={<TrendingIcon />}
          label="人気の検索"
          onClick={() => {
            // Show trending suggestions
            triggerHaptic('light');
          }}
          sx={touchTargetStyle}
        />
        {onFilterOpen && (
          <Chip
            icon={<FilterIcon />}
            label="フィルター"
            onClick={() => {
              onFilterOpen();
              triggerHaptic('light');
            }}
            sx={touchTargetStyle}
          />
        )}
      </Box>
    </Collapse>
  );

  // Desktop vs Mobile rendering
  if (isMobile) {
    return (
      <Box sx={{ width: '100%', position: 'relative' }}>
        {renderMobileSearchInput()}
        {renderQuickActions()}
        
        {/* Floating refresh button for pull-to-refresh hint */}
        {isExpanded && (
          <Fab
            size="small"
            color="primary"
            sx={{
              position: 'fixed',
              bottom: theme.spacing(3),
              right: theme.spacing(3),
              zIndex: 1000,
              animation: 'fadeIn 0.3s ease-in-out',
            }}
            onClick={() => {
              // Refresh suggestions
              triggerHaptic('medium');
            }}
            aria-label="更新"
          >
            <RefreshIcon />
          </Fab>
        )}
        
        <style>
          {`
            @keyframes pulse {
              0% { opacity: 1; }
              50% { opacity: 0.5; }
              100% { opacity: 1; }
            }
            
            @keyframes fadeIn {
              from { opacity: 0; transform: scale(0.8); }
              to { opacity: 1; transform: scale(1); }
            }
          `}
        </style>
      </Box>
    );
  }

  // Desktop version with standard layout
  return (
    <Box sx={{ width: '100%' }}>
      {renderMobileSearchInput()}
    </Box>
  );
};

export default TouchOptimizedSearchBar;