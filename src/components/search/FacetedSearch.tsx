/**
 * FacetedSearch - Advanced multi-criteria search component
 * Provides real-time filtering with faceted navigation
 */

import React, { 
  useState, 
  useEffect, 
  useCallback, 
  useMemo,
  useRef 
} from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Collapse,
  IconButton,
  Badge,
  Slider,
  FormGroup,
  FormControlLabel,
  Checkbox,
  TextField,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Button,
  useTheme,
  useMediaQuery,
  Drawer,
  AppBar,
  Toolbar,
  Stack
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  Tune as TuneIcon
} from '@mui/icons-material';
import { useDebounce } from '../../hooks/useDebounce';
import TouchOptimizedSearchBar from '../ui/TouchOptimizedSearchBar';
import type { Architecture } from '../../types/architecture';

export interface FacetCount {
  value: string;
  label?: string;
  count: number;
  selected: boolean;
}

export interface RangeFacet {
  min: number;
  max: number;
  selectedMin: number;
  selectedMax: number;
  step?: number;
  unit?: string;
}

export interface SearchFacets {
  prefectures: FacetCount[];
  architects: FacetCount[];
  decades: FacetCount[];
  categories: FacetCount[];
  materials: FacetCount[];
  styles: FacetCount[];
  yearRange: RangeFacet;
  popular: FacetCount[];
}

export interface ActiveFacets {
  [key: string]: string[] | [number, number];
}

export interface FacetedSearchProps {
  onSearch: (query: string, facets: ActiveFacets) => void;
  onFacetsChange?: (facets: ActiveFacets) => void;
  facets: SearchFacets;
  loading?: boolean;
  resultCount?: number;
  placeholder?: string;
  showResultCount?: boolean;
  mobileBreakpoint?: number;
  maxVisibleFacets?: number;
}

interface FacetPanelProps {
  facets: SearchFacets;
  activeFacets: ActiveFacets;
  onFacetChange: (facets: ActiveFacets) => void;
  maxVisible?: number;
}

// Individual facet group component
const FacetGroup: React.FC<{
  title: string;
  facets: FacetCount[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  maxVisible?: number;
  showSearch?: boolean;
}> = ({ 
  title, 
  facets, 
  selectedValues, 
  onChange, 
  maxVisible = 5,
  showSearch = false 
}) => {
  const [expanded, setExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAll, setShowAll] = useState(false);
  
  const filteredFacets = useMemo(() => {
    let filtered = facets;
    
    if (searchTerm) {
      filtered = facets.filter(facet => 
        facet.value.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Sort by selection first, then by count
    return filtered.sort((a, b) => {
      if (a.selected && !b.selected) return -1;
      if (!a.selected && b.selected) return 1;
      return b.count - a.count;
    });
  }, [facets, searchTerm]);
  
  const visibleFacets = showAll ? filteredFacets : filteredFacets.slice(0, maxVisible);
  const hasMore = filteredFacets.length > maxVisible;
  
  const handleToggle = (value: string, checked: boolean) => {
    if (checked) {
      onChange([...selectedValues, value]);
    } else {
      onChange(selectedValues.filter(v => v !== value));
    }
  };
  
  const selectedCount = selectedValues.length;
  
  return (
    <Accordion 
      expanded={expanded} 
      onChange={(_, isExpanded) => setExpanded(isExpanded)}
      sx={{ boxShadow: 'none', '&:before': { display: 'none' } }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{
          minHeight: 48,
          '& .MuiAccordionSummary-content': {
            alignItems: 'center',
            gap: 1
          }
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
        {selectedCount > 0 && (
          <Badge 
            badgeContent={selectedCount} 
            color="primary" 
            sx={{ ml: 1 }}
          />
        )}
      </AccordionSummary>
      
      <AccordionDetails sx={{ pt: 0 }}>
        {showSearch && (
          <TextField
            size="small"
            placeholder={`${title}を検索...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
            }}
            sx={{ mb: 2, width: '100%' }}
          />
        )}
        
        <FormGroup>
          {visibleFacets.map((facet) => (
            <FormControlLabel
              key={facet.value}
              control={
                <Checkbox
                  checked={selectedValues.includes(facet.value)}
                  onChange={(e) => handleToggle(facet.value, e.target.checked)}
                  size="small"
                />
              }
              label={
                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <Typography variant="body2">
                    {facet.label || facet.value}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {facet.count.toLocaleString()}
                  </Typography>
                </Box>
              }
              sx={{ 
                width: '100%', 
                mr: 0,
                '& .MuiFormControlLabel-label': {
                  width: '100%'
                }
              }}
            />
          ))}
        </FormGroup>
        
        {hasMore && (
          <Button
            size="small"
            onClick={() => setShowAll(!showAll)}
            sx={{ mt: 1 }}
          >
            {showAll ? '折りたたむ' : `他${filteredFacets.length - maxVisible}件を表示`}
          </Button>
        )}
      </AccordionDetails>
    </Accordion>
  );
};

// Range facet component
const RangeFacetGroup: React.FC<{
  title: string;
  range: RangeFacet;
  onChange: (range: [number, number]) => void;
}> = ({ title, range, onChange }) => {
  const [expanded, setExpanded] = useState(false);
  const [localRange, setLocalRange] = useState<[number, number]>([
    range.selectedMin,
    range.selectedMax
  ]);
  
  const debouncedOnChange = useDebounce(onChange, 300);
  
  useEffect(() => {
    if (localRange[0] !== range.selectedMin || localRange[1] !== range.selectedMax) {
      debouncedOnChange(localRange);
    }
  }, [localRange, debouncedOnChange, range.selectedMin, range.selectedMax]);
  
  const handleChange = (_: Event, newValue: number | number[]) => {
    setLocalRange(newValue as [number, number]);
  };
  
  const isDefault = localRange[0] === range.min && localRange[1] === range.max;
  
  return (
    <Accordion 
      expanded={expanded} 
      onChange={(_, isExpanded) => setExpanded(isExpanded)}
      sx={{ boxShadow: 'none', '&:before': { display: 'none' } }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{
          minHeight: 48,
          '& .MuiAccordionSummary-content': {
            alignItems: 'center',
            gap: 1
          }
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
        {!isDefault && (
          <Chip
            size="small"
            label={`${localRange[0]}${range.unit || ''} - ${localRange[1]}${range.unit || ''}`}
            color="primary"
            variant="outlined"
          />
        )}
      </AccordionSummary>
      
      <AccordionDetails>
        <Box sx={{ px: 1 }}>
          <Slider
            value={localRange}
            onChange={handleChange}
            valueLabelDisplay="auto"
            min={range.min}
            max={range.max}
            step={range.step || 1}
            marks={[
              { value: range.min, label: `${range.min}${range.unit || ''}` },
              { value: range.max, label: `${range.max}${range.unit || ''}` }
            ]}
            valueLabelFormat={(value) => `${value}${range.unit || ''}`}
          />
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
            <TextField
              size="small"
              type="number"
              value={localRange[0]}
              onChange={(e) => setLocalRange([parseInt(e.target.value) || range.min, localRange[1]])}
              inputProps={{ min: range.min, max: range.max }}
              sx={{ width: 80 }}
            />
            <Typography sx={{ alignSelf: 'center' }}>〜</Typography>
            <TextField
              size="small"
              type="number"
              value={localRange[1]}
              onChange={(e) => setLocalRange([localRange[0], parseInt(e.target.value) || range.max])}
              inputProps={{ min: range.min, max: range.max }}
              sx={{ width: 80 }}
            />
          </Box>
        </Box>
      </AccordionDetails>
    </Accordion>
  );
};

// Facet panel component
const FacetPanel: React.FC<FacetPanelProps> = ({ 
  facets, 
  activeFacets, 
  onFacetChange,
  maxVisible = 5 
}) => {
  const handleFacetChange = (key: string, values: string[] | [number, number]) => {
    onFacetChange({
      ...activeFacets,
      [key]: values
    });
  };
  
  const clearAllFacets = () => {
    onFacetChange({});
  };
  
  const activeFacetCount = Object.values(activeFacets).reduce((count, values) => {
    if (Array.isArray(values)) {
      return count + values.length;
    }
    return count;
  }, 0);
  
  return (
    <Box>
      {/* Facet header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 2 
      }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          フィルター
        </Typography>
        {activeFacetCount > 0 && (
          <Button
            size="small"
            onClick={clearAllFacets}
            startIcon={<ClearIcon />}
          >
            クリア ({activeFacetCount})
          </Button>
        )}
      </Box>
      
      {/* Active facets */}
      {activeFacetCount > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
            適用中のフィルター
          </Typography>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
            {Object.entries(activeFacets).map(([key, values]) => {
              if (Array.isArray(values) && values.length > 0) {
                return values.map((value) => (
                  <Chip
                    key={`${key}-${value}`}
                    label={value}
                    size="small"
                    onDelete={() => {
                      const newValues = values.filter(v => v !== value);
                      handleFacetChange(key, newValues);
                    }}
                    color="primary"
                    variant="outlined"
                  />
                ));
              }
              return null;
            })}
          </Stack>
          <Divider sx={{ mt: 2 }} />
        </Box>
      )}
      
      {/* Facet groups */}
      <Box>
        <FacetGroup
          title="都道府県"
          facets={facets.prefectures}
          selectedValues={(activeFacets.prefectures as string[]) || []}
          onChange={(values) => handleFacetChange('prefectures', values)}
          maxVisible={maxVisible}
          showSearch={facets.prefectures.length > 10}
        />
        
        <FacetGroup
          title="建築家"
          facets={facets.architects}
          selectedValues={(activeFacets.architects as string[]) || []}
          onChange={(values) => handleFacetChange('architects', values)}
          maxVisible={maxVisible}
          showSearch={facets.architects.length > 10}
        />
        
        <RangeFacetGroup
          title="竣工年"
          range={facets.yearRange}
          onChange={(range) => handleFacetChange('yearRange', range)}
        />
        
        <FacetGroup
          title="建築分類"
          facets={facets.categories}
          selectedValues={(activeFacets.categories as string[]) || []}
          onChange={(values) => handleFacetChange('categories', values)}
          maxVisible={maxVisible}
        />
        
        <FacetGroup
          title="建築様式"
          facets={facets.styles}
          selectedValues={(activeFacets.styles as string[]) || []}
          onChange={(values) => handleFacetChange('styles', values)}
          maxVisible={maxVisible}
        />
        
        <FacetGroup
          title="主要素材"
          facets={facets.materials}
          selectedValues={(activeFacets.materials as string[]) || []}
          onChange={(values) => handleFacetChange('materials', values)}
          maxVisible={maxVisible}
        />
      </Box>
    </Box>
  );
};

// Main faceted search component
const FacetedSearch: React.FC<FacetedSearchProps> = ({
  onSearch,
  onFacetsChange,
  facets,
  loading = false,
  resultCount,
  placeholder = "建築名、建築家、場所で検索...",
  showResultCount = true,
  mobileBreakpoint = 960,
  maxVisibleFacets = 5
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(`(max-width:${mobileBreakpoint}px)`);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFacets, setActiveFacets] = useState<ActiveFacets>({});
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  
  // Debounce search and facet changes
  const debouncedSearch = useDebounce(searchQuery, 300);
  const debouncedFacets = useDebounce(activeFacets, 300);
  
  // Trigger search when query or facets change
  useEffect(() => {
    onSearch(debouncedSearch, debouncedFacets);
  }, [debouncedSearch, debouncedFacets, onSearch]);
  
  // Notify parent of facet changes
  useEffect(() => {
    onFacetsChange?.(activeFacets);
  }, [activeFacets, onFacetsChange]);
  
  const handleQueryChange = (query: string) => {
    setSearchQuery(query);
  };
  
  const handleFacetsChange = (newFacets: ActiveFacets) => {
    setActiveFacets(newFacets);
  };
  
  const activeFacetCount = Object.values(activeFacets).reduce((count, values) => {
    if (Array.isArray(values)) {
      return count + values.length;
    }
    return count;
  }, 0);
  
  // Mobile filter drawer
  const renderMobileFilters = () => (
    <Drawer
      anchor="bottom"
      open={mobileFilterOpen}
      onClose={() => setMobileFilterOpen(false)}
      PaperProps={{
        sx: {
          height: '80vh',
          borderRadius: '16px 16px 0 0'
        }
      }}
    >
      <AppBar position="static" elevation={0} sx={{ bgcolor: 'background.paper' }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flex: 1, color: 'text.primary' }}>
            フィルター
          </Typography>
          <IconButton 
            onClick={() => setMobileFilterOpen(false)}
            sx={{ color: 'text.primary' }}
          >
            <CloseIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      
      <Box sx={{ p: 2, overflow: 'auto', flex: 1 }}>
        <FacetPanel
          facets={facets}
          activeFacets={activeFacets}
          onFacetChange={handleFacetsChange}
          maxVisible={maxVisibleFacets}
        />
      </Box>
    </Drawer>
  );
  
  return (
    <Box sx={{ display: 'flex', gap: 2, height: '100%' }}>
      {/* Desktop Facet Panel */}
      {!isMobile && (
        <Box sx={{ width: 320, flexShrink: 0 }}>
          <Paper 
            elevation={1} 
            sx={{ 
              p: 2, 
              height: '100%', 
              overflow: 'auto',
              borderRadius: 2
            }}
          >
            <FacetPanel
              facets={facets}
              activeFacets={activeFacets}
              onFacetChange={handleFacetsChange}
              maxVisible={maxVisibleFacets}
            />
          </Paper>
        </Box>
      )}
      
      {/* Search Results Area */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Search Header */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
            <Box sx={{ flex: 1 }}>
              <TouchOptimizedSearchBar
                onSearch={handleQueryChange}
                placeholder={placeholder}
                value={searchQuery}
                onChange={handleQueryChange}
                gestureEnabled={isMobile}
              />
            </Box>
            
            {/* Mobile Filter Button */}
            {isMobile && (
              <IconButton
                onClick={() => setMobileFilterOpen(true)}
                sx={{
                  minWidth: 48,
                  minHeight: 48,
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 2
                }}
              >
                <Badge badgeContent={activeFacetCount} color="primary">
                  <TuneIcon />
                </Badge>
              </IconButton>
            )}
          </Box>
          
          {/* Result Count and Active Filters */}
          {(showResultCount || activeFacetCount > 0) && (
            <Box sx={{ 
              mt: 2, 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 1
            }}>
              {showResultCount && (
                <Typography variant="body2" color="text.secondary">
                  {loading ? '検索中...' : 
                   resultCount !== undefined ? `${resultCount.toLocaleString()}件の建築` : ''
                  }
                </Typography>
              )}
              
              {activeFacetCount > 0 && !isMobile && (
                <Button
                  size="small"
                  onClick={() => setActiveFacets({})}
                  startIcon={<ClearIcon />}
                  variant="outlined"
                >
                  フィルターをクリア ({activeFacetCount})
                </Button>
              )}
            </Box>
          )}
        </Box>
        
        {/* Search Results Content Area */}
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          {/* Results will be rendered by parent component */}
        </Box>
      </Box>
      
      {/* Mobile Filter Drawer */}
      {isMobile && renderMobileFilters()}
    </Box>
  );
};

export default FacetedSearch;