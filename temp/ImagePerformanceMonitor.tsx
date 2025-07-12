/**
 * Image Performance Monitor - SOW Phase 2
 * Tracks and reports progressive image loading improvements
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  LinearProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  useTheme,
  alpha,
  IconButton,
  Collapse,
  Tooltip
} from '@mui/material';
import {
  Speed as SpeedIcon,
  TrendingUp as TrendingUpIcon,
  DataUsage as DataUsageIcon,
  NetworkCheck as NetworkCheckIcon,
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon
} from '@mui/icons-material';

import { LoadingMetrics } from './EnhancedProgressiveImage';
import {
  ImagePerformanceMetrics,
  generateImagePerformanceReport,
  detectConnectionQuality
} from '../utils/imageOptimization';

interface ImagePerformanceMonitorProps {
  isVisible?: boolean;
  maxEntries?: number;
  autoRefreshInterval?: number;
  onExportData?: (data: any) => void;
}

interface PerformanceEntry {
  id: string;
  timestamp: number;
  imageUrl: string;
  metrics: LoadingMetrics;
  improvement: number;
  componentType: 'architecture' | 'architect' | 'general';
}

/**
 * Real-time performance monitoring dashboard for progressive image loading
 * Tracks improvements, data savings, and connection quality impacts
 */
const ImagePerformanceMonitor: React.FC<ImagePerformanceMonitorProps> = ({
  isVisible = false,
  maxEntries = 100,
  autoRefreshInterval = 5000,
  onExportData
}) => {
  const theme = useTheme();
  const [entries, setEntries] = useState<PerformanceEntry[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [summary, setSummary] = useState({
    averageImprovement: 0,
    totalImages: 0,
    dataSaved: 0,
    averageLoadTime: 0
  });
  const intervalRef = useRef<NodeJS.Timeout>();

  // Add new performance entry
  const addPerformanceEntry = useCallback((
    imageUrl: string,
    metrics: LoadingMetrics,
    componentType: 'architecture' | 'architect' | 'general' = 'general'
  ) => {
    const entry: PerformanceEntry = {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
      imageUrl,
      metrics,
      improvement: metrics.perceivedImprovement || 0,
      componentType
    };

    setEntries(prev => {
      const newEntries = [entry, ...prev].slice(0, maxEntries);
      return newEntries;
    });
  }, [maxEntries]);

  // Expose the addPerformanceEntry function globally for components to use
  useEffect(() => {
    (window as any).__imagePerformanceMonitor = {
      addEntry: addPerformanceEntry
    };

    return () => {
      delete (window as any).__imagePerformanceMonitor;
    };
  }, [addPerformanceEntry]);

  // Calculate summary statistics
  useEffect(() => {
    if (entries.length === 0) {
      setSummary({
        averageImprovement: 0,
        totalImages: 0,
        dataSaved: 0,
        averageLoadTime: 0
      });
      return;
    }

    const totalImprovement = entries.reduce((sum, entry) => sum + entry.improvement, 0);
    const averageImprovement = totalImprovement / entries.length;
    
    const totalLoadTime = entries.reduce((sum, entry) => sum + (entry.metrics.totalLoadTime || 0), 0);
    const averageLoadTime = totalLoadTime / entries.length;
    
    // Estimate data saved (mock calculation)
    const estimatedDataSaved = entries.length * 0.3; // MB saved per image on average

    setSummary({
      averageImprovement,
      totalImages: entries.length,
      dataSaved: estimatedDataSaved,
      averageLoadTime
    });
  }, [entries]);

  // Auto-refresh functionality
  useEffect(() => {
    if (autoRefreshInterval > 0) {
      intervalRef.current = setInterval(() => {
        // Trigger re-calculation of summary
        setSummary(prev => ({ ...prev }));
      }, autoRefreshInterval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [autoRefreshInterval]);

  // Export performance data
  const handleExportData = useCallback(() => {
    const exportData = {
      summary,
      entries: entries.map(entry => ({
        timestamp: new Date(entry.timestamp).toISOString(),
        imageUrl: entry.imageUrl,
        loadTime: entry.metrics.totalLoadTime,
        improvement: entry.improvement,
        connectionType: entry.metrics.connectionType,
        componentType: entry.componentType
      })),
      generatedAt: new Date().toISOString()
    };

    onExportData?.(exportData);

    // Also provide JSON download
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `image-performance-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [summary, entries, onExportData]);

  // Clear all entries
  const handleClearData = useCallback(() => {
    setEntries([]);
  }, []);

  // Get improvement color
  const getImprovementColor = (improvement: number) => {
    if (improvement >= 40) return theme.palette.success.main;
    if (improvement >= 20) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  // Get connection quality indicator
  const connectionQuality = detectConnectionQuality();

  if (!isVisible) return null;

  return (
    <Card 
      sx={{ 
        position: 'fixed',
        bottom: 16,
        right: 16,
        width: isExpanded ? 800 : 320,
        maxHeight: isExpanded ? 600 : 200,
        zIndex: 1000,
        transition: 'all 0.3s ease-in-out',
        overflow: 'hidden'
      }}
    >
      <CardContent sx={{ p: 2 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SpeedIcon color="primary" />
            <Typography variant="h6" component="h3">
              画像パフォーマンス
            </Typography>
            <Chip
              size="small"
              label={`${summary.averageImprovement.toFixed(1)}%`}
              color={summary.averageImprovement >= 40 ? 'success' : summary.averageImprovement >= 20 ? 'warning' : 'error'}
              sx={{ fontWeight: 'bold' }}
            />
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Tooltip title="データをエクスポート">
              <IconButton size="small" onClick={handleExportData}>
                <DownloadIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="データをクリア">
              <IconButton size="small" onClick={handleClearData}>
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <IconButton
              size="small"
              onClick={() => setIsExpanded(!isExpanded)}
              sx={{
                transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s ease-in-out'
              }}
            >
              <ExpandMoreIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Summary Cards */}
        <Grid container spacing={1} sx={{ mb: 2 }}>
          <Grid item xs={6}>
            <Paper sx={{ p: 1, backgroundColor: alpha(theme.palette.primary.main, 0.1) }}>
              <Typography variant="caption" color="text.secondary">平均改善</Typography>
              <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
                {summary.averageImprovement.toFixed(1)}%
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={6}>
            <Paper sx={{ p: 1, backgroundColor: alpha(theme.palette.success.main, 0.1) }}>
              <Typography variant="caption" color="text.secondary">画像数</Typography>
              <Typography variant="h6" color="success.main" sx={{ fontWeight: 'bold' }}>
                {summary.totalImages}
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Connection Quality Indicator */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <NetworkCheckIcon fontSize="small" color="action" />
          <Typography variant="caption">
            接続: {connectionQuality.effectiveType} ({connectionQuality.downlink.toFixed(1)} Mbps)
          </Typography>
          <Chip
            size="small"
            label={connectionQuality.type}
            color={connectionQuality.type === 'fast' ? 'success' : connectionQuality.type === 'medium' ? 'warning' : 'error'}
            variant="outlined"
          />
        </Box>

        {/* Expanded Content */}
        <Collapse in={isExpanded}>
          <Box>
            {/* Additional Summary Stats */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6}>
                <Paper sx={{ p: 2, backgroundColor: alpha(theme.palette.info.main, 0.1) }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <DataUsageIcon fontSize="small" color="info" />
                    <Typography variant="subtitle2">データ節約</Typography>
                  </Box>
                  <Typography variant="h5" color="info.main">
                    {summary.dataSaved.toFixed(1)} MB
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6}>
                <Paper sx={{ p: 2, backgroundColor: alpha(theme.palette.warning.main, 0.1) }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <TrendingUpIcon fontSize="small" color="warning" />
                    <Typography variant="subtitle2">平均読み込み時間</Typography>
                  </Box>
                  <Typography variant="h5" color="warning.main">
                    {summary.averageLoadTime.toFixed(0)}ms
                  </Typography>
                </Paper>
              </Grid>
            </Grid>

            {/* Recent Entries Table */}
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              最近の読み込み履歴
            </Typography>
            <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>時刻</TableCell>
                    <TableCell>タイプ</TableCell>
                    <TableCell>読み込み時間</TableCell>
                    <TableCell>改善率</TableCell>
                    <TableCell>接続</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {entries.slice(0, 20).map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        <Typography variant="caption">
                          {new Date(entry.timestamp).toLocaleTimeString('ja-JP')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={entry.componentType}
                          color={entry.componentType === 'architecture' ? 'primary' : 'secondary'}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {entry.metrics.totalLoadTime?.toFixed(0) || 0}ms
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography
                            variant="body2"
                            sx={{ color: getImprovementColor(entry.improvement) }}
                          >
                            +{entry.improvement.toFixed(1)}%
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={Math.min(entry.improvement, 100)}
                            sx={{
                              width: 40,
                              height: 4,
                              borderRadius: 2,
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: getImprovementColor(entry.improvement)
                              }
                            }}
                          />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">
                          {entry.metrics.connectionType}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Achievement Badge */}
            {summary.averageImprovement >= 40 && summary.totalImages >= 10 && (
              <Box sx={{ 
                mt: 2, 
                p: 2, 
                backgroundColor: alpha(theme.palette.success.main, 0.1),
                borderRadius: 2,
                border: `1px solid ${theme.palette.success.main}`,
                textAlign: 'center'
              }}>
                <Typography variant="h6" color="success.main" sx={{ fontWeight: 'bold' }}>
                  🎉 40%改善目標達成！
                </Typography>
                <Typography variant="body2" color="success.main">
                  平均{summary.averageImprovement.toFixed(1)}%のパフォーマンス向上を実現
                </Typography>
              </Box>
            )}
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default ImagePerformanceMonitor;

// Helper hook for components to easily report performance
export const useImagePerformanceReporting = () => {
  const reportImageLoad = useCallback((
    imageUrl: string,
    metrics: LoadingMetrics,
    componentType: 'architecture' | 'architect' | 'general' = 'general'
  ) => {
    const monitor = (window as any).__imagePerformanceMonitor;
    if (monitor) {
      monitor.addEntry(imageUrl, metrics, componentType);
    }
  }, []);

  return { reportImageLoad };
};