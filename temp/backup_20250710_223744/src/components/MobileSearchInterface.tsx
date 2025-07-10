/**
 * Mobile-optimized search interface with voice search and touch-friendly autocomplete
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Paper,
  InputBase,
  IconButton,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Typography,
  Fade,
  CircularProgress,
  useTheme,
  alpha,
  Drawer,
  AppBar,
  Toolbar,
  Divider,
  Badge
} from '@mui/material';
import {
  Search as SearchIcon,
  Mic as MicIcon,
  Close as CloseIcon,
  History as HistoryIcon,
  TrendingUp as TrendingIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  Category as CategoryIcon,
  Clear as ClearIcon,
  FilterList as FilterIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { useDebounce } from '../hooks/useDebounce';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useViewportSize } from '../utils/mobileGestures';

interface SearchSuggestion {
  id: string;
  text: string;
  type: 'architect' | 'location' | 'style' | 'year' | 'general';
  icon: React.ReactNode;
  count?: number;
  recent?: boolean;
}

interface SearchFilter {
  id: string;
  label: string;
  active: boolean;
  count?: number;
}

interface MobileSearchInterfaceProps {
  onSearch: (query: string, filters?: SearchFilter[]) => void;
  onSuggestionSelect: (suggestion: SearchSuggestion) => void;
  suggestions: SearchSuggestion[];
  loading?: boolean;
  placeholder?: string;
  enableVoiceSearch?: boolean;
  enableFilters?: boolean;
  recentSearches?: string[];
  popularSearches?: SearchSuggestion[];
  isOpen?: boolean;
  onClose?: () => void;
}

const getIconForType = (type: string) => {
  switch (type) {
    case 'architect':
      return <PersonIcon fontSize="small" />;
    case 'location':
      return <LocationIcon fontSize="small" />;
    case 'style':
    case 'general':
      return <CategoryIcon fontSize="small" />;
    default:
      return <SearchIcon fontSize="small" />;
  }
};

const MobileSearchInterface: React.FC<MobileSearchInterfaceProps> = ({
  onSearch,
  onSuggestionSelect,
  suggestions = [],
  loading = false,
  placeholder = "建築作品、建築家、場所を検索...",
  enableVoiceSearch = true,
  enableFilters = true,
  recentSearches = [],
  popularSearches = [],
  isOpen = false,
  onClose
}) => {
  const theme = useTheme();
  const viewport = useViewportSize();
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [searchHistory, setSearchHistory] = useLocalStorage<string[]>('search-history', []);
  const [activeFilters, setActiveFilters] = useState<SearchFilter[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  
  // Debounced search query
  const debouncedQuery = useDebounce(query, 300);

  // Available filters
  const availableFilters: SearchFilter[] = [
    { id: 'year-recent', label: '最近(2010-)', active: false, count: 245 },
    { id: 'year-modern', label: 'モダン(1950-2010)', active: false, count: 892 },
    { id: 'year-classic', label: 'クラシック(-1950)', active: false, count: 156 },
    { id: 'type-residential', label: '住宅', active: false, count: 423 },
    { id: 'type-commercial', label: '商業施設', active: false, count: 287 },
    { id: 'type-cultural', label: '文化施設', active: false, count: 198 },
    { id: 'location-tokyo', label: '東京', active: false, count: 567 },
    { id: 'location-osaka', label: '大阪', active: false, count: 234 },
    { id: 'location-kyoto', label: '京都', active: false, count: 189 }
  ];

  // Initialize speech recognition
  useEffect(() => {
    if (!enableVoiceSearch || !('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      return;
    }

    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'ja-JP';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
      handleSearch(transcript);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [enableVoiceSearch]);

  // Handle search execution
  const handleSearch = useCallback((searchQuery: string = query) => {
    if (!searchQuery.trim()) return;

    // Add to search history
    const newHistory = [searchQuery, ...searchHistory.filter(h => h !== searchQuery)].slice(0, 10);
    setSearchHistory(newHistory);

    // Execute search
    onSearch(searchQuery, activeFilters.filter(f => f.active));
    setShowSuggestions(false);
    
    if (viewport.isMobile && onClose) {
      onClose();
    }
  }, [query, searchHistory, setSearchHistory, onSearch, activeFilters, viewport.isMobile, onClose]);

  // Handle voice search
  const handleVoiceSearch = useCallback(() => {
    if (!recognitionRef.current || isListening) return;
    
    try {
      recognitionRef.current.start();
    } catch (error) {
      console.error('Voice search error:', error);
    }
  }, [isListening]);

  // Handle suggestion selection
  const handleSuggestionSelect = useCallback((suggestion: SearchSuggestion) => {
    setQuery(suggestion.text);
    onSuggestionSelect(suggestion);
    handleSearch(suggestion.text);
  }, [onSuggestionSelect, handleSearch]);

  // Handle filter toggle
  const handleFilterToggle = useCallback((filterId: string) => {
    setActiveFilters(prev => 
      prev.map(f => f.id === filterId ? { ...f, active: !f.active } : f)
    );
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Update suggestions visibility
  useEffect(() => {
    setShowSuggestions(query.length > 0 && isOpen);
  }, [query, isOpen]);

  // Initialize filters
  useEffect(() => {
    setActiveFilters(availableFilters);
  }, []);

  // Search suggestions to display
  const displaySuggestions = React.useMemo(() => {
    if (query.length === 0) {
      return [
        ...searchHistory.slice(0, 5).map(text => ({
          id: `history-${text}`,
          text,
          type: 'general' as const,
          icon: <HistoryIcon fontSize="small" />,
          recent: true
        })),
        ...popularSearches.slice(0, 5)
      ];
    }
    return suggestions;
  }, [query, searchHistory, popularSearches, suggestions]);

  const activeFilterCount = activeFilters.filter(f => f.active).length;

  // Mobile fullscreen search
  if (viewport.isMobile) {
    return (
      <Drawer
        anchor="top"
        open={isOpen}
        onClose={onClose}
        sx={{
          '& .MuiDrawer-paper': {
            height: '100vh',
            backgroundColor: theme.palette.background.default
          }
        }}
      >
        <AppBar position="static" elevation={0} sx={{ backgroundColor: 'transparent' }}>
          <Toolbar sx={{ px: 1 }}>
            <IconButton onClick={onClose} edge="start">
              <ArrowBackIcon />
            </IconButton>
            
            <Paper
              sx={{
                flex: 1,
                mx: 1,
                display: 'flex',
                alignItems: 'center',
                backgroundColor: alpha(theme.palette.common.black, 0.04),
                border: 'none',
                boxShadow: 'none'
              }}
            >
              <InputBase
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder={placeholder}
                sx={{
                  flex: 1,
                  px: 2,
                  py: 1.5,
                  fontSize: '1rem'
                }}
                inputProps={{
                  style: { fontSize: '16px' } // Prevents zoom on iOS
                }}
              />
              
              {query && (
                <IconButton onClick={() => setQuery('')} size="small">
                  <ClearIcon />
                </IconButton>
              )}
              
              {loading && (
                <CircularProgress size={24} sx={{ mx: 1 }} />
              )}
              
              {enableVoiceSearch && (
                <IconButton
                  onClick={handleVoiceSearch}
                  sx={{
                    color: isListening ? theme.palette.error.main : theme.palette.text.secondary,
                    mr: 1
                  }}
                >
                  <MicIcon />
                </IconButton>
              )}
            </Paper>

            {enableFilters && (
              <Badge badgeContent={activeFilterCount} color="primary">
                <IconButton onClick={() => setShowFilters(!showFilters)}>
                  <FilterIcon />
                </IconButton>
              </Badge>
            )}
          </Toolbar>
        </AppBar>

        {/* Filters */}
        {enableFilters && showFilters && (
          <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
              フィルター
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {activeFilters.map((filter) => (
                <Chip
                  key={filter.id}
                  label={`${filter.label} (${filter.count})`}
                  onClick={() => handleFilterToggle(filter.id)}
                  color={filter.active ? 'primary' : 'default'}
                  variant={filter.active ? 'filled' : 'outlined'}
                  size="small"
                />
              ))}
            </Box>
          </Box>
        )}

        {/* Suggestions */}
        <List sx={{ flex: 1, overflow: 'auto' }}>
          {displaySuggestions.map((suggestion, index) => (
            <ListItem
              key={suggestion.id}
              button
              onClick={() => handleSuggestionSelect(suggestion)}
              sx={{
                py: 1.5,
                borderBottom: index < displaySuggestions.length - 1 
                  ? `1px solid ${alpha(theme.palette.divider, 0.5)}` 
                  : 'none'
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                {suggestion.icon}
              </ListItemIcon>
              <ListItemText
                primary={suggestion.text}
                secondary={suggestion.count ? `${suggestion.count}件` : undefined}
                sx={{
                  '& .MuiListItemText-primary': {
                    fontSize: '1rem'
                  }
                }}
              />
              {suggestion.recent && (
                <Chip label="履歴" size="small" variant="outlined" />
              )}
            </ListItem>
          ))}
          
          {displaySuggestions.length === 0 && query.length > 0 && !loading && (
            <ListItem>
              <ListItemText
                primary="検索結果が見つかりません"
                secondary="別のキーワードでお試しください"
                sx={{ textAlign: 'center', color: theme.palette.text.secondary }}
              />
            </ListItem>
          )}
        </List>
      </Drawer>
    );
  }

  // Desktop compact search
  return (
    <Box sx={{ position: 'relative', width: '100%', maxWidth: 600 }}>
      <Paper
        sx={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: alpha(theme.palette.common.black, 0.04),
          border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
          borderRadius: 2,
          overflow: 'hidden',
          transition: 'all 0.2s ease-in-out',
          '&:focus-within': {
            borderColor: theme.palette.primary.main,
            backgroundColor: theme.palette.background.paper,
            boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`
          }
        }}
      >
        <SearchIcon sx={{ mx: 2, color: theme.palette.text.secondary }} />
        
        <InputBase
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          onFocus={() => setShowSuggestions(true)}
          placeholder={placeholder}
          sx={{
            flex: 1,
            py: 1.5,
            fontSize: '1rem'
          }}
        />
        
        {query && (
          <IconButton onClick={() => setQuery('')} size="small">
            <ClearIcon />
          </IconButton>
        )}
        
        {loading && (
          <CircularProgress size={24} sx={{ mx: 1 }} />
        )}
        
        {enableVoiceSearch && (
          <IconButton
            onClick={handleVoiceSearch}
            sx={{
              color: isListening ? theme.palette.error.main : theme.palette.text.secondary,
              mr: 1
            }}
          >
            <MicIcon />
          </IconButton>
        )}
      </Paper>

      {/* Desktop suggestions dropdown */}
      {showSuggestions && (
        <Fade in={showSuggestions}>
          <Paper
            elevation={8}
            sx={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              zIndex: 1000,
              maxHeight: 400,
              overflow: 'auto',
              mt: 1,
              borderRadius: 2
            }}
          >
            <List>
              {displaySuggestions.map((suggestion, index) => (
                <ListItem
                  key={suggestion.id}
                  button
                  onClick={() => handleSuggestionSelect(suggestion)}
                  sx={{
                    borderBottom: index < displaySuggestions.length - 1 
                      ? `1px solid ${alpha(theme.palette.divider, 0.5)}` 
                      : 'none'
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    {suggestion.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={suggestion.text}
                    secondary={suggestion.count ? `${suggestion.count}件` : undefined}
                  />
                  {suggestion.recent && (
                    <Chip label="履歴" size="small" variant="outlined" />
                  )}
                </ListItem>
              ))}
            </List>
          </Paper>
        </Fade>
      )}
    </Box>
  );
};

export default MobileSearchInterface;