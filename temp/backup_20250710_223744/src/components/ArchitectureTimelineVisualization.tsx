import React, { useState, useMemo, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Slider,
  Button,
  Chip,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Avatar
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  Stop,
  SkipNext,
  SkipPrevious,
  Timeline,
  Fullscreen,
  Download,
  Settings,
  ZoomIn,
  ZoomOut,
  FilterAlt
} from '@mui/icons-material';
import { Architecture } from '../types/architecture';

// Timeline event interface
interface TimelineEvent {
  id: string;
  year: number;
  title: string;
  architect?: string;
  category: string;
  prefecture: string;
  description?: string;
  imageUrl?: string;
  significance: 'low' | 'medium' | 'high' | 'landmark';
  coordinates?: [number, number];
  relatedEvents?: string[];
}

// Era definition
interface Era {
  name: string;
  startYear: number;
  endYear: number;
  color: string;
  description: string;
  characteristics: string[];
}

// Component props
interface ArchitectureTimelineVisualizationProps {
  architectures: Architecture[];
  onEventSelect?: (event: TimelineEvent) => void;
  onYearChange?: (year: number) => void;
  autoPlayInterval?: number;
  enableEras?: boolean;
  enableFiltering?: boolean;
  enableComparison?: boolean;
}

// Predefined eras for Japanese architecture
const JAPANESE_ARCHITECTURE_ERAS: Era[] = [
  {
    name: '明治時代',
    startYear: 1868,
    endYear: 1912,
    color: '#8B4513',
    description: '西洋建築の導入と和洋折衷建築の発展',
    characteristics: ['西洋建築様式の導入', '煉瓦造建築', '和洋折衷', '擬洋風建築']
  },
  {
    name: '大正時代',
    startYear: 1912,
    endYear: 1926,
    color: '#FF6B6B',
    description: '大正ロマンと自由主義建築',
    characteristics: ['自由主義建築', '分離派建築', '表現主義', '大正ロマン']
  },
  {
    name: '昭和戦前',
    startYear: 1926,
    endYear: 1945,
    color: '#4ECDC4',
    description: 'モダニズム建築の受容と発展',
    characteristics: ['国際様式', 'アール・デコ', 'モダニズム', '帝冠様式']
  },
  {
    name: '昭和戦後',
    startYear: 1945,
    endYear: 1989,
    color: '#45B7D1',
    description: '復興から高度経済成長期の建築',
    characteristics: ['復興建築', 'メタボリズム', '高層建築', '団地建築']
  },
  {
    name: '平成時代',
    startYear: 1989,
    endYear: 2019,
    color: '#96CEB4',
    description: 'ポストモダンから現代建築へ',
    characteristics: ['ポストモダン', '解構主義', '環境建築', 'IT時代の建築']
  },
  {
    name: '令和時代',
    startYear: 2019,
    endYear: 2030,
    color: '#FECA57',
    description: '持続可能性と新技術の建築',
    characteristics: ['サステナブル建築', 'スマート建築', 'AIとIoT', '災害復興建築']
  }
];

// Significance colors
const SIGNIFICANCE_COLORS = {
  low: '#E0E0E0',
  medium: '#81C784',
  high: '#FF9800',
  landmark: '#F44336'
};

/**
 * Interactive Architecture Timeline Visualization Component
 */
const ArchitectureTimelineVisualization: React.FC<ArchitectureTimelineVisualizationProps> = ({
  architectures,
  onEventSelect,
  onYearChange,
  autoPlayInterval = 500,
  enableEras = true,
  enableFiltering = true,
  enableComparison = false
}) => {
  const [currentYear, setCurrentYear] = useState(1950);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPrefecture, setSelectedPrefecture] = useState<string>('all');
  const [significanceFilter, setSignificanceFilter] = useState<string[]>(['low', 'medium', 'high', 'landmark']);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [selectedEvents, setSelectedEvents] = useState<TimelineEvent[]>([]);

  // Convert architectures to timeline events
  const timelineEvents: TimelineEvent[] = useMemo(() => {
    return architectures
      .filter(arch => arch.ZAR_YEAR && arch.ZAR_YEAR >= 1850 && arch.ZAR_YEAR <= 2030)
      .map(arch => {
        // Determine significance based on various factors
        const hasImage = !!arch.ZAR_IMAGE_URL;
        const hasArchitect = !!arch.ZAR_ARCHITECT;
        const isInTokyo = arch.ZAR_PREFECTURE === '東京都';
        
        let significance: 'low' | 'medium' | 'high' | 'landmark' = 'low';
        if (hasImage && hasArchitect && isInTokyo) significance = 'landmark';
        else if (hasImage && hasArchitect) significance = 'high';
        else if (hasImage || hasArchitect) significance = 'medium';

        return {
          id: arch.Z_PK.toString(),
          year: arch.ZAR_YEAR!,
          title: arch.ZAR_TITLE,
          architect: arch.ZAR_ARCHITECT || undefined,
          category: arch.ZAR_CATEGORY || 'その他',
          prefecture: arch.ZAR_PREFECTURE || '不明',
          description: arch.ZAR_DESCRIPTION || undefined,
          imageUrl: arch.ZAR_IMAGE_URL || undefined,
          significance,
          coordinates: arch.ZAR_LATITUDE && arch.ZAR_LONGITUDE 
            ? [arch.ZAR_LATITUDE, arch.ZAR_LONGITUDE] 
            : undefined
        };
      });
  }, [architectures]);

  // Filter events
  const filteredEvents = useMemo(() => {
    return timelineEvents.filter(event => {
      if (selectedCategory !== 'all' && event.category !== selectedCategory) return false;
      if (selectedPrefecture !== 'all' && event.prefecture !== selectedPrefecture) return false;
      if (!significanceFilter.includes(event.significance)) return false;
      return true;
    });
  }, [timelineEvents, selectedCategory, selectedPrefecture, significanceFilter]);

  // Get events for current year range
  const currentEvents = useMemo(() => {
    const yearRange = Math.max(1, 10 / zoomLevel);
    return filteredEvents.filter(event => 
      event.year >= currentYear - yearRange && event.year <= currentYear + yearRange
    );
  }, [filteredEvents, currentYear, zoomLevel]);

  // Get current era
  const currentEra = useMemo(() => {
    return JAPANESE_ARCHITECTURE_ERAS.find(era => 
      currentYear >= era.startYear && currentYear <= era.endYear
    );
  }, [currentYear]);

  // Get unique categories and prefectures for filtering
  const categories = useMemo(() => 
    [...new Set(timelineEvents.map(event => event.category))].sort()
  , [timelineEvents]);

  const prefectures = useMemo(() => 
    [...new Set(timelineEvents.map(event => event.prefecture))].sort()
  , [timelineEvents]);

  // Auto-play functionality
  React.useEffect(() => {
    if (!isPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentYear(prev => {
        const next = prev + playSpeed;
        if (next > 2030) {
          setIsPlaying(false);
          return 1850;
        }
        return next;
      });
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [isPlaying, playSpeed, autoPlayInterval]);

  // Year change handler
  React.useEffect(() => {
    if (onYearChange) {
      onYearChange(currentYear);
    }
  }, [currentYear, onYearChange]);

  // Event handlers
  const handleEventClick = useCallback((event: TimelineEvent) => {
    if (comparisonMode) {
      setSelectedEvents(prev => {
        const exists = prev.find(e => e.id === event.id);
        if (exists) {
          return prev.filter(e => e.id !== event.id);
        } else if (prev.length < 5) {
          return [...prev, event];
        }
        return prev;
      });
    } else {
      setSelectedEvent(event);
      setShowEventDetails(true);
      if (onEventSelect) {
        onEventSelect(event);
      }
    }
  }, [comparisonMode, onEventSelect]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleStop = () => {
    setIsPlaying(false);
    setCurrentYear(1850);
  };

  const handleYearSliderChange = (event: Event, newValue: number | number[]) => {
    setCurrentYear(newValue as number);
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev * 2, 8));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev / 2, 0.25));
  };

  // Timeline scale calculation
  const timelineWidth = 1000;
  const yearRange = [1850, 2030];
  const totalYears = yearRange[1] - yearRange[0];
  const pixelsPerYear = timelineWidth / totalYears;

  // Event positioning
  const getEventPosition = (year: number) => {
    return ((year - yearRange[0]) / totalYears) * timelineWidth;
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">
          建築史タイムライン
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="比較モード">
            <FormControlLabel
              control={
                <Switch
                  checked={comparisonMode}
                  onChange={(e) => setComparisonMode(e.target.checked)}
                />
              }
              label="比較"
            />
          </Tooltip>
          <Button startIcon={<Download />} variant="outlined">
            エクスポート
          </Button>
        </Box>
      </Box>

      {/* Current Era Display */}
      {enableEras && currentEra && (
        <Paper sx={{ p: 2, mb: 3, backgroundColor: currentEra.color + '20' }}>
          <Typography variant="h6" sx={{ color: currentEra.color, fontWeight: 'bold' }}>
            {currentEra.name} ({currentEra.startYear} - {currentEra.endYear})
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            {currentEra.description}
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {currentEra.characteristics.map((char, index) => (
              <Chip
                key={index}
                label={char}
                size="small"
                sx={{ backgroundColor: currentEra.color + '40' }}
              />
            ))}
          </Box>
        </Paper>
      )}

      {/* Controls */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          {/* Playback Controls */}
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton onClick={() => setCurrentYear(prev => Math.max(prev - 10, 1850))}>
                <SkipPrevious />
              </IconButton>
              <IconButton onClick={handlePlayPause} color="primary">
                {isPlaying ? <Pause /> : <PlayArrow />}
              </IconButton>
              <IconButton onClick={handleStop}>
                <Stop />
              </IconButton>
              <IconButton onClick={() => setCurrentYear(prev => Math.min(prev + 10, 2030))}>
                <SkipNext />
              </IconButton>
              <FormControl size="small" sx={{ ml: 2, minWidth: 80 }}>
                <InputLabel>速度</InputLabel>
                <Select
                  value={playSpeed}
                  onChange={(e) => setPlaySpeed(e.target.value as number)}
                  label="速度"
                >
                  <MenuItem value={0.5}>0.5x</MenuItem>
                  <MenuItem value={1}>1x</MenuItem>
                  <MenuItem value={2}>2x</MenuItem>
                  <MenuItem value={5}>5x</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Grid>

          {/* Zoom Controls */}
          <Grid item xs={12} md={2}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton onClick={handleZoomOut}>
                <ZoomOut />
              </IconButton>
              <Typography variant="body2">
                {zoomLevel.toFixed(1)}x
              </Typography>
              <IconButton onClick={handleZoomIn}>
                <ZoomIn />
              </IconButton>
            </Box>
          </Grid>

          {/* Filters */}
          {enableFiltering && (
            <>
              <Grid item xs={12} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>カテゴリ</InputLabel>
                  <Select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    label="カテゴリ"
                  >
                    <MenuItem value="all">全て</MenuItem>
                    {categories.map(category => (
                      <MenuItem key={category} value={category}>
                        {category}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>都道府県</InputLabel>
                  <Select
                    value={selectedPrefecture}
                    onChange={(e) => setSelectedPrefecture(e.target.value)}
                    label="都道府県"
                  >
                    <MenuItem value="all">全て</MenuItem>
                    {prefectures.map(prefecture => (
                      <MenuItem key={prefecture} value={prefecture}>
                        {prefecture}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </>
          )}

          {/* Current Year Display */}
          <Grid item xs={12} md={2}>
            <Typography variant="h5" align="center" color="primary">
              {currentYear}年
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Year Slider */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Slider
          value={currentYear}
          onChange={handleYearSliderChange}
          min={1850}
          max={2030}
          step={1}
          marks={JAPANESE_ARCHITECTURE_ERAS.map(era => ({
            value: era.startYear,
            label: era.name
          }))}
          valueLabelDisplay="auto"
          sx={{ '& .MuiSlider-mark': { backgroundColor: 'primary.main' } }}
        />
      </Paper>

      {/* Timeline Visualization */}
      <Paper sx={{ p: 2, mb: 3, overflowX: 'auto' }}>
        <Box sx={{ position: 'relative', height: 400, minWidth: timelineWidth }}>
          {/* Era Backgrounds */}
          {enableEras && JAPANESE_ARCHITECTURE_ERAS.map(era => {
            const startPos = getEventPosition(era.startYear);
            const endPos = getEventPosition(era.endYear);
            return (
              <Box
                key={era.name}
                sx={{
                  position: 'absolute',
                  left: startPos,
                  width: endPos - startPos,
                  height: '100%',
                  backgroundColor: era.color + '10',
                  border: `1px solid ${era.color}40`,
                  borderRadius: 1
                }}
              />
            );
          })}

          {/* Current Year Indicator */}
          <Box
            sx={{
              position: 'absolute',
              left: getEventPosition(currentYear),
              top: 0,
              width: 2,
              height: '100%',
              backgroundColor: 'primary.main',
              zIndex: 10
            }}
          />

          {/* Events */}
          {filteredEvents.map(event => {
            const position = getEventPosition(event.year);
            const isVisible = Math.abs(event.year - currentYear) <= (10 / zoomLevel);
            const isSelected = selectedEvents.find(e => e.id === event.id);
            
            return (
              <Tooltip
                key={event.id}
                title={`${event.year}: ${event.title}${event.architect ? ` by ${event.architect}` : ''}`}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    left: position - 5,
                    top: 50 + (Math.random() * 250), // Random vertical position for better visibility
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    backgroundColor: SIGNIFICANCE_COLORS[event.significance],
                    border: isSelected ? '3px solid #1976d2' : '1px solid #fff',
                    opacity: isVisible ? 1 : 0.3,
                    cursor: 'pointer',
                    transform: isSelected ? 'scale(1.5)' : 'scale(1)',
                    transition: 'all 0.2s ease',
                    zIndex: isSelected ? 20 : isVisible ? 15 : 5,
                    '&:hover': {
                      transform: 'scale(1.8)',
                      zIndex: 25
                    }
                  }}
                  onClick={() => handleEventClick(event)}
                />
              </Tooltip>
            );
          })}

          {/* Legend */}
          <Box sx={{ position: 'absolute', bottom: 10, right: 10 }}>
            <Paper sx={{ p: 1 }}>
              <Typography variant="caption" gutterBottom>
                重要度
              </Typography>
              {Object.entries(SIGNIFICANCE_COLORS).map(([significance, color]) => (
                <Box key={significance} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: color
                    }}
                  />
                  <Typography variant="caption">
                    {significance === 'landmark' ? 'ランドマーク' :
                     significance === 'high' ? '高' :
                     significance === 'medium' ? '中' : '低'}
                  </Typography>
                </Box>
              ))}
            </Paper>
          </Box>
        </Box>
      </Paper>

      {/* Current Events Display */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          {currentYear}年前後の建築作品 ({currentEvents.length}件)
        </Typography>
        <Grid container spacing={2}>
          {currentEvents.slice(0, 6).map(event => (
            <Grid item xs={12} sm={6} md={4} key={event.id}>
              <Card
                sx={{
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'scale(1.02)' },
                  border: selectedEvents.find(e => e.id === event.id) ? '2px solid #1976d2' : 'none'
                }}
                onClick={() => handleEventClick(event)}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <Avatar
                      sx={{
                        backgroundColor: SIGNIFICANCE_COLORS[event.significance],
                        width: 24,
                        height: 24,
                        fontSize: '0.7rem'
                      }}
                    >
                      {event.year.toString().slice(-2)}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2" noWrap>
                        {event.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {event.architect && `${event.architect} | `}
                        {event.prefecture} | {event.category}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
        {currentEvents.length > 6 && (
          <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
            他 {currentEvents.length - 6} 件...
          </Typography>
        )}
      </Paper>

      {/* Comparison Panel */}
      {comparisonMode && selectedEvents.length > 0 && (
        <Paper sx={{ p: 2, mt: 2 }}>
          <Typography variant="h6" gutterBottom>
            選択中の建築作品 ({selectedEvents.length}/5)
          </Typography>
          <Grid container spacing={2}>
            {selectedEvents.map(event => (
              <Grid item xs={12} md={6} lg={4} key={event.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">{event.title}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {event.year}年 | {event.architect || '設計者不明'}
                    </Typography>
                    <Typography variant="body2">
                      {event.prefecture} | {event.category}
                    </Typography>
                    <Button
                      size="small"
                      onClick={() => setSelectedEvents(prev => prev.filter(e => e.id !== event.id))}
                      sx={{ mt: 1 }}
                    >
                      削除
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      {/* Event Details Dialog */}
      <Dialog
        open={showEventDetails}
        onClose={() => setShowEventDetails(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedEvent && (
          <>
            <DialogTitle>
              {selectedEvent.title} ({selectedEvent.year})
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  {selectedEvent.imageUrl && (
                    <Box
                      component="img"
                      src={selectedEvent.imageUrl}
                      alt={selectedEvent.title}
                      sx={{ width: '100%', borderRadius: 1, mb: 2 }}
                    />
                  )}
                  <Typography variant="body1" gutterBottom>
                    <strong>設計者:</strong> {selectedEvent.architect || '不明'}
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    <strong>所在地:</strong> {selectedEvent.prefecture}
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    <strong>カテゴリ:</strong> {selectedEvent.category}
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    <strong>重要度:</strong> {
                      selectedEvent.significance === 'landmark' ? 'ランドマーク' :
                      selectedEvent.significance === 'high' ? '高' :
                      selectedEvent.significance === 'medium' ? '中' : '低'
                    }
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  {selectedEvent.description && (
                    <Typography variant="body2" paragraph>
                      {selectedEvent.description}
                    </Typography>
                  )}
                  {currentEra && (
                    <Paper sx={{ p: 2, backgroundColor: currentEra.color + '20' }}>
                      <Typography variant="subtitle2" gutterBottom>
                        時代背景: {currentEra.name}
                      </Typography>
                      <Typography variant="body2">
                        {currentEra.description}
                      </Typography>
                    </Paper>
                  )}
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setShowEventDetails(false)}>
                閉じる
              </Button>
              <Button variant="contained">
                詳細ページへ
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default ArchitectureTimelineVisualization;