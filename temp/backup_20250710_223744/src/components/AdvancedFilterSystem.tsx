import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  IconButton,
  Tooltip,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Autocomplete,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Checkbox,
  Badge,
  Divider,
  Alert,
  Collapse,
  LinearProgress,
  CircularProgress
} from '@mui/material';
import {
  ExpandMore,
  FilterAlt,
  Clear,
  Save,
  Restore,
  Tune,
  Search,
  LocationOn,
  DateRange,
  Business,
  Person,
  Category,
  Star,
  Visibility,
  TrendingUp,
  Map as MapIcon,
  Timeline,
  Analytics
} from '@mui/icons-material';
import { Architecture } from '../types/architecture';
import { Architect } from '../types/architect';

// Filter configuration interface
interface FilterConfig {
  id: string;
  name: string;
  type: 'text' | 'select' | 'multiselect' | 'range' | 'slider' | 'checkbox' | 'date' | 'location' | 'rating';
  category: 'basic' | 'advanced' | 'geo' | 'temporal' | 'analytical';
  options?: string[];
  min?: number;
  max?: number;
  defaultValue?: any;
  description?: string;
  icon?: React.ReactNode;
}

// Active filter state
interface ActiveFilter {
  id: string;
  value: any;
  label: string;
  count: number;
}

// Filter preset
interface FilterPreset {
  id: string;
  name: string;
  description: string;
  filters: Record<string, any>;
  isBuiltIn: boolean;
}

// Component props
interface AdvancedFilterSystemProps {
  architectures: Architecture[];
  architects: Architect[];
  onFilterChange: (filteredData: Architecture[], activeFilters: ActiveFilter[]) => void;
  onAnalyticsUpdate?: (analytics: FilterAnalytics) => void;
  enableRealTimeUpdates?: boolean;
  enableSavePresets?: boolean;
  enableGeoFiltering?: boolean;
  enableAdvancedAnalytics?: boolean;
}

// Filter analytics
interface FilterAnalytics {
  totalResults: number;
  filteredResults: number;
  filterEfficiency: number;
  popularFilters: string[];
  categoryDistribution: Record<string, number>;
  yearDistribution: Record<number, number>;
  locationDistribution: Record<string, number>;
  architectDistribution: Record<string, number>;
  performanceMetrics: {
    filterTime: number;
    cacheHitRate: number;
    queryComplexity: number;
  };
}

// Built-in filter presets
const BUILT_IN_PRESETS: FilterPreset[] = [
  {
    id: 'modern-architecture',
    name: 'モダン建築',
    description: '1950年以降の現代建築作品',
    filters: {
      yearRange: [1950, 2030],
      categories: ['住宅', '商業建築', '文化施設']
    },
    isBuiltIn: true
  },
  {
    id: 'tokyo-landmarks',
    name: '東京のランドマーク',
    description: '東京都内の著名な建築作品',
    filters: {
      prefectures: ['東京都'],
      hasArchitect: true,
      hasImage: true
    },
    isBuiltIn: true
  },
  {
    id: 'famous-architects',
    name: '著名建築家',
    description: '有名建築家による作品集',
    filters: {
      architects: ['安藤忠雄', '隈研吾', '妹島和世', '西沢立衛'],
      hasImage: true
    },
    isBuiltIn: true
  },
  {
    id: 'recent-projects',
    name: '最近のプロジェクト',
    description: '過去10年間の新しい建築',
    filters: {
      yearRange: [2014, 2024]
    },
    isBuiltIn: true
  }
];

// Filter configurations
const FILTER_CONFIGS: FilterConfig[] = [
  {
    id: 'searchText',
    name: '検索キーワード',
    type: 'text',
    category: 'basic',
    description: '建築名、建築家、説明文から検索',
    icon: <Search />
  },
  {
    id: 'categories',
    name: 'カテゴリ',
    type: 'multiselect',
    category: 'basic',
    options: [],
    description: '建築のカテゴリで絞り込み',
    icon: <Category />
  },
  {
    id: 'prefectures',
    name: '都道府県',
    type: 'multiselect',
    category: 'basic',
    options: [],
    description: '地域で絞り込み',
    icon: <LocationOn />
  },
  {
    id: 'architects',
    name: '建築家',
    type: 'multiselect',
    category: 'basic',
    options: [],
    description: '建築家で絞り込み',
    icon: <Person />
  },
  {
    id: 'yearRange',
    name: '建設年',
    type: 'range',
    category: 'temporal',
    min: 1850,
    max: 2030,
    defaultValue: [1850, 2030],
    description: '建設年の範囲で絞り込み',
    icon: <DateRange />
  },
  {
    id: 'hasImage',
    name: '画像あり',
    type: 'checkbox',
    category: 'basic',
    description: '画像が登録されている作品のみ',
    icon: <Visibility />
  },
  {
    id: 'hasArchitect',
    name: '建築家情報あり',
    type: 'checkbox',
    category: 'basic',
    description: '建築家が登録されている作品のみ',
    icon: <Person />
  },
  {
    id: 'popularityThreshold',
    name: '人気度',
    type: 'slider',
    category: 'analytical',
    min: 0,
    max: 100,
    defaultValue: 0,
    description: '人気度の最小値',
    icon: <Star />
  },
  {
    id: 'coordinates',
    name: '座標情報あり',
    type: 'checkbox',
    category: 'geo',
    description: '地理座標が登録されている作品のみ',
    icon: <MapIcon />
  }
];

/**
 * Advanced Filter System Component
 */
const AdvancedFilterSystem: React.FC<AdvancedFilterSystemProps> = ({
  architectures,
  architects,
  onFilterChange,
  onAnalyticsUpdate,
  enableRealTimeUpdates = true,
  enableSavePresets = true,
  enableGeoFiltering = true,
  enableAdvancedAnalytics = true
}) => {
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['basic']);
  const [savedPresets, setSavedPresets] = useState<FilterPreset[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [isFiltering, setIsFiltering] = useState(false);
  const [filterAnalytics, setFilterAnalytics] = useState<FilterAnalytics | null>(null);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [realtimeEnabled, setRealtimeEnabled] = useState(enableRealTimeUpdates);

  // Extract unique values for filter options
  const filterOptions = useMemo(() => {
    const categories = [...new Set(architectures.map(a => a.ZAR_CATEGORY).filter(Boolean))].sort();
    const prefectures = [...new Set(architectures.map(a => a.ZAR_PREFECTURE).filter(Boolean))].sort();
    const architectNames = [...new Set([
      ...architectures.map(a => a.ZAR_ARCHITECT),
      ...architectures.map(a => a.ZAR_ARCHITECT1),
      ...architectures.map(a => a.ZAR_ARCHITECT2),
      ...architectures.map(a => a.ZAR_ARCHITECT3),
      ...architectures.map(a => a.ZAR_ARCHITECT4)
    ].filter(Boolean))].sort();

    return { categories, prefectures, architectNames };
  }, [architectures]);

  // Update filter configurations with dynamic options
  const updatedFilterConfigs = useMemo(() => {
    return FILTER_CONFIGS.map(config => {
      switch (config.id) {
        case 'categories':
          return { ...config, options: filterOptions.categories };
        case 'prefectures':
          return { ...config, options: filterOptions.prefectures };
        case 'architects':
          return { ...config, options: filterOptions.architectNames };
        default:
          return config;
      }
    });
  }, [filterOptions]);

  // Generate search suggestions
  useEffect(() => {
    const suggestions = [
      ...filterOptions.categories.slice(0, 5),
      ...filterOptions.architectNames.slice(0, 5),
      ...filterOptions.prefectures.slice(0, 3),
      '住宅', '美術館', 'モダン', '伝統建築', '公共建築'
    ];
    setSearchSuggestions([...new Set(suggestions)]);
  }, [filterOptions]);

  // Apply filters and calculate analytics
  const filteredData = useMemo(() => {
    const startTime = performance.now();
    
    let filtered = architectures;

    // Text search
    if (filters.searchText) {
      const searchTerm = filters.searchText.toLowerCase();
      filtered = filtered.filter(arch =>
        arch.ZAR_TITLE?.toLowerCase().includes(searchTerm) ||
        arch.ZAR_ARCHITECT?.toLowerCase().includes(searchTerm) ||
        arch.ZAR_DESCRIPTION?.toLowerCase().includes(searchTerm) ||
        arch.ZAR_ADDRESS?.toLowerCase().includes(searchTerm)
      );
    }

    // Category filter
    if (filters.categories?.length > 0) {
      filtered = filtered.filter(arch =>
        filters.categories.includes(arch.ZAR_CATEGORY)
      );
    }

    // Prefecture filter
    if (filters.prefectures?.length > 0) {
      filtered = filtered.filter(arch =>
        filters.prefectures.includes(arch.ZAR_PREFECTURE)
      );
    }

    // Architect filter
    if (filters.architects?.length > 0) {
      filtered = filtered.filter(arch =>
        filters.architects.some((architect: string) =>
          arch.ZAR_ARCHITECT === architect ||
          arch.ZAR_ARCHITECT1 === architect ||
          arch.ZAR_ARCHITECT2 === architect ||
          arch.ZAR_ARCHITECT3 === architect ||
          arch.ZAR_ARCHITECT4 === architect
        )
      );
    }

    // Year range filter
    if (filters.yearRange) {
      const [minYear, maxYear] = filters.yearRange;
      filtered = filtered.filter(arch =>
        arch.ZAR_YEAR && arch.ZAR_YEAR >= minYear && arch.ZAR_YEAR <= maxYear
      );
    }

    // Has image filter
    if (filters.hasImage) {
      filtered = filtered.filter(arch => arch.ZAR_IMAGE_URL);
    }

    // Has architect filter
    if (filters.hasArchitect) {
      filtered = filtered.filter(arch => arch.ZAR_ARCHITECT);
    }

    // Coordinates filter
    if (filters.coordinates) {
      filtered = filtered.filter(arch => arch.ZAR_LATITUDE && arch.ZAR_LONGITUDE);
    }

    // Popularity threshold
    if (filters.popularityThreshold > 0) {
      // Simulate popularity score based on available data
      filtered = filtered.filter(arch => {
        const hasImage = arch.ZAR_IMAGE_URL ? 30 : 0;
        const hasArchitect = arch.ZAR_ARCHITECT ? 25 : 0;
        const hasCoordinates = (arch.ZAR_LATITUDE && arch.ZAR_LONGITUDE) ? 20 : 0;
        const hasDescription = arch.ZAR_DESCRIPTION ? 15 : 0;
        const popularity = hasImage + hasArchitect + hasCoordinates + hasDescription;
        return popularity >= filters.popularityThreshold;
      });
    }

    const endTime = performance.now();

    // Calculate analytics
    if (enableAdvancedAnalytics) {
      const analytics: FilterAnalytics = {
        totalResults: architectures.length,
        filteredResults: filtered.length,
        filterEfficiency: (filtered.length / architectures.length) * 100,
        popularFilters: Object.keys(filters).filter(key => filters[key]),
        categoryDistribution: {},
        yearDistribution: {},
        locationDistribution: {},
        architectDistribution: {},
        performanceMetrics: {
          filterTime: endTime - startTime,
          cacheHitRate: Math.random() * 100, // Simulated
          queryComplexity: Object.keys(filters).length
        }
      };

      // Calculate distributions
      filtered.forEach(arch => {
        if (arch.ZAR_CATEGORY) {
          analytics.categoryDistribution[arch.ZAR_CATEGORY] = 
            (analytics.categoryDistribution[arch.ZAR_CATEGORY] || 0) + 1;
        }
        if (arch.ZAR_YEAR) {
          analytics.yearDistribution[arch.ZAR_YEAR] = 
            (analytics.yearDistribution[arch.ZAR_YEAR] || 0) + 1;
        }
        if (arch.ZAR_PREFECTURE) {
          analytics.locationDistribution[arch.ZAR_PREFECTURE] = 
            (analytics.locationDistribution[arch.ZAR_PREFECTURE] || 0) + 1;
        }
        if (arch.ZAR_ARCHITECT) {
          analytics.architectDistribution[arch.ZAR_ARCHITECT] = 
            (analytics.architectDistribution[arch.ZAR_ARCHITECT] || 0) + 1;
        }
      });

      setFilterAnalytics(analytics);
      if (onAnalyticsUpdate) {
        onAnalyticsUpdate(analytics);
      }
    }

    return filtered;
  }, [architectures, filters, enableAdvancedAnalytics, onAnalyticsUpdate]);

  // Update active filters
  useEffect(() => {
    const active: ActiveFilter[] = [];

    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== '' && !(Array.isArray(value) && value.length === 0)) {
        const config = updatedFilterConfigs.find(c => c.id === key);
        let label = '';
        let count = 0;

        switch (config?.type) {
          case 'text':
            label = `"${value}"`;
            count = filteredData.filter(arch =>
              arch.ZAR_TITLE?.toLowerCase().includes(value.toLowerCase()) ||
              arch.ZAR_ARCHITECT?.toLowerCase().includes(value.toLowerCase())
            ).length;
            break;
          case 'multiselect':
            label = Array.isArray(value) ? value.join(', ') : value;
            count = filteredData.length;
            break;
          case 'range':
            label = `${value[0]} - ${value[1]}`;
            count = filteredData.filter(arch =>
              arch.ZAR_YEAR && arch.ZAR_YEAR >= value[0] && arch.ZAR_YEAR <= value[1]
            ).length;
            break;
          case 'checkbox':
            label = value ? 'あり' : 'なし';
            count = filteredData.length;
            break;
          case 'slider':
            label = `${value}以上`;
            count = filteredData.length;
            break;
          default:
            label = String(value);
            count = filteredData.length;
        }

        active.push({
          id: key,
          value,
          label: `${config?.name}: ${label}`,
          count
        });
      }
    });

    setActiveFilters(active);
  }, [filters, filteredData, updatedFilterConfigs]);

  // Notify parent of filter changes
  useEffect(() => {
    if (realtimeEnabled) {
      onFilterChange(filteredData, activeFilters);
    }
  }, [filteredData, activeFilters, onFilterChange, realtimeEnabled]);

  // Handle filter changes
  const handleFilterChange = useCallback((filterId: string, value: any) => {
    setIsFiltering(true);
    setFilters(prev => ({
      ...prev,
      [filterId]: value
    }));
    setTimeout(() => setIsFiltering(false), 100);
  }, []);

  // Remove specific filter
  const removeFilter = useCallback((filterId: string) => {
    setFilters(prev => {
      const updated = { ...prev };
      delete updated[filterId];
      return updated;
    });
  }, []);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setFilters({});
  }, []);

  // Apply filters manually (for non-realtime mode)
  const applyFilters = useCallback(() => {
    onFilterChange(filteredData, activeFilters);
  }, [filteredData, activeFilters, onFilterChange]);

  // Save current filter state as preset
  const savePreset = useCallback((name: string, description: string) => {
    const newPreset: FilterPreset = {
      id: `custom_${Date.now()}`,
      name,
      description,
      filters: { ...filters },
      isBuiltIn: false
    };
    setSavedPresets(prev => [...prev, newPreset]);
  }, [filters]);

  // Load preset
  const loadPreset = useCallback((presetId: string) => {
    const preset = [...BUILT_IN_PRESETS, ...savedPresets].find(p => p.id === presetId);
    if (preset) {
      setFilters(preset.filters);
      setSelectedPreset(presetId);
    }
  }, [savedPresets]);

  // Toggle category expansion
  const toggleCategory = useCallback((category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  }, []);

  // Group filters by category
  const filtersByCategory = useMemo(() => {
    const grouped: Record<string, FilterConfig[]> = {};
    updatedFilterConfigs.forEach(config => {
      if (!grouped[config.category]) {
        grouped[config.category] = [];
      }
      grouped[config.category].push(config);
    });
    return grouped;
  }, [updatedFilterConfigs]);

  // Render filter control
  const renderFilterControl = (config: FilterConfig) => {
    const value = filters[config.id] || config.defaultValue;

    switch (config.type) {
      case 'text':
        return (
          <Autocomplete
            options={searchSuggestions}
            freeSolo
            value={value || ''}
            onChange={(event, newValue) => handleFilterChange(config.id, newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                label={config.name}
                size="small"
                fullWidth
                InputProps={{
                  ...params.InputProps,
                  startAdornment: config.icon
                }}
              />
            )}
          />
        );

      case 'select':
        return (
          <FormControl fullWidth size="small">
            <InputLabel>{config.name}</InputLabel>
            <Select
              value={value || ''}
              onChange={(e) => handleFilterChange(config.id, e.target.value)}
              label={config.name}
            >
              <MenuItem value="">全て</MenuItem>
              {config.options?.map(option => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );

      case 'multiselect':
        return (
          <Autocomplete
            multiple
            options={config.options || []}
            value={value || []}
            onChange={(event, newValue) => handleFilterChange(config.id, newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                label={config.name}
                size="small"
                placeholder="選択してください"
              />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  variant="outlined"
                  label={option}
                  size="small"
                  {...getTagProps({ index })}
                />
              ))
            }
          />
        );

      case 'range':
        return (
          <Box>
            <Typography variant="body2" gutterBottom>
              {config.name}: {value?.[0] || config.min} - {value?.[1] || config.max}
            </Typography>
            <Slider
              value={value || [config.min, config.max]}
              onChange={(event, newValue) => handleFilterChange(config.id, newValue)}
              valueLabelDisplay="auto"
              min={config.min}
              max={config.max}
            />
          </Box>
        );

      case 'slider':
        return (
          <Box>
            <Typography variant="body2" gutterBottom>
              {config.name}: {value || config.defaultValue}
            </Typography>
            <Slider
              value={value || config.defaultValue}
              onChange={(event, newValue) => handleFilterChange(config.id, newValue)}
              valueLabelDisplay="auto"
              min={config.min}
              max={config.max}
            />
          </Box>
        );

      case 'checkbox':
        return (
          <FormControlLabel
            control={
              <Checkbox
                checked={!!value}
                onChange={(e) => handleFilterChange(config.id, e.target.checked)}
              />
            }
            label={config.name}
          />
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FilterAlt />
          高度フィルタリング
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <FormControlLabel
            control={
              <Switch
                checked={realtimeEnabled}
                onChange={(e) => setRealtimeEnabled(e.target.checked)}
              />
            }
            label="リアルタイム"
          />
          {!realtimeEnabled && (
            <Button
              variant="contained"
              onClick={applyFilters}
              disabled={isFiltering}
              startIcon={isFiltering ? <CircularProgress size={16} /> : <Search />}
            >
              フィルタ適用
            </Button>
          )}
          <Button
            variant="outlined"
            onClick={clearAllFilters}
            startIcon={<Clear />}
          >
            クリア
          </Button>
        </Box>
      </Box>

      {/* Filter Presets */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          フィルタプリセット
        </Typography>
        <Grid container spacing={1}>
          {BUILT_IN_PRESETS.map(preset => (
            <Grid item key={preset.id}>
              <Chip
                label={preset.name}
                onClick={() => loadPreset(preset.id)}
                color={selectedPreset === preset.id ? 'primary' : 'default'}
                variant={selectedPreset === preset.id ? 'filled' : 'outlined'}
              />
            </Grid>
          ))}
          {savedPresets.map(preset => (
            <Grid item key={preset.id}>
              <Chip
                label={preset.name}
                onClick={() => loadPreset(preset.id)}
                color={selectedPreset === preset.id ? 'secondary' : 'default'}
                variant={selectedPreset === preset.id ? 'filled' : 'outlined'}
                onDelete={() => {
                  setSavedPresets(prev => prev.filter(p => p.id !== preset.id));
                }}
              />
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography variant="body2">
              アクティブフィルタ ({activeFilters.length}):
            </Typography>
            {activeFilters.map(filter => (
              <Chip
                key={filter.id}
                label={`${filter.label} (${filter.count}件)`}
                onDelete={() => removeFilter(filter.id)}
                size="small"
                color="primary"
                variant="outlined"
              />
            ))}
          </Box>
        </Alert>
      )}

      {/* Filter Controls */}
      <Grid container spacing={3}>
        {Object.entries(filtersByCategory).map(([category, configs]) => (
          <Grid item xs={12} key={category}>
            <Accordion
              expanded={expandedCategories.includes(category)}
              onChange={() => toggleCategory(category)}
            >
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Badge 
                  badgeContent={configs.filter(c => filters[c.id]).length} 
                  color="primary"
                >
                  <Typography variant="h6">
                    {category === 'basic' ? '基本フィルタ' :
                     category === 'advanced' ? '高度フィルタ' :
                     category === 'geo' ? '地理フィルタ' :
                     category === 'temporal' ? '時間フィルタ' :
                     category === 'analytical' ? '分析フィルタ' : category}
                  </Typography>
                </Badge>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  {configs.map(config => (
                    <Grid item xs={12} sm={6} md={4} key={config.id}>
                      <Card variant="outlined">
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            {config.icon}
                            <Typography variant="subtitle2">
                              {config.name}
                            </Typography>
                          </Box>
                          {renderFilterControl(config)}
                          {config.description && (
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                              {config.description}
                            </Typography>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Grid>
        ))}
      </Grid>

      {/* Analytics Summary */}
      {enableAdvancedAnalytics && filterAnalytics && (
        <Paper sx={{ p: 2, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            フィルタ分析結果
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary">
                総件数
              </Typography>
              <Typography variant="h6">
                {filterAnalytics.totalResults.toLocaleString()}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary">
                フィルタ後
              </Typography>
              <Typography variant="h6" color="primary">
                {filterAnalytics.filteredResults.toLocaleString()}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary">
                フィルタ効率
              </Typography>
              <Typography variant="h6">
                {filterAnalytics.filterEfficiency.toFixed(1)}%
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary">
                処理時間
              </Typography>
              <Typography variant="h6">
                {filterAnalytics.performanceMetrics.filterTime.toFixed(1)}ms
              </Typography>
            </Grid>
          </Grid>
          
          {isFiltering && (
            <Box sx={{ mt: 2 }}>
              <LinearProgress />
              <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                フィルタリング中...
              </Typography>
            </Box>
          )}
        </Paper>
      )}
    </Box>
  );
};

export default AdvancedFilterSystem;