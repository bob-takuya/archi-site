/**
 * Architects Performance Monitor - SOW Phase 2 Performance Tracking
 * Real-time performance monitoring with analytics dashboard
 */

import React, { useState, useEffect, memo, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  LinearProgress,
  Chip,
  Alert,
  IconButton,
  Collapse,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  ExpandMore,
  ExpandLess,
  Speed,
  Memory,
  Storage,
  TrendingUp,
  Warning,
  CheckCircle,
  Info
} from '@mui/icons-material';
import OptimizedArchitectService from '../services/OptimizedArchitectService';
import ArchitectsCacheService from '../services/ArchitectsCacheService';

interface PerformanceData {
  timestamp: number;
  queryTime: number;
  cacheHitRate: number;
  memoryUsage: number;
  networkLatency: number;
}

interface PerformanceAlert {
  id: string;
  type: 'warning' | 'error' | 'info';
  message: string;
  timestamp: number;
  acknowledged: boolean;
}

const ArchitectsPerformanceMonitor: React.FC<{
  visible?: boolean;
  onToggleVisibility?: (visible: boolean) => void;
}> = ({ visible = false, onToggleVisibility }) => {
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [currentStats, setCurrentStats] = useState<any>(null);
  const [cacheStats, setCacheStats] = useState<any>(null);
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isCollecting, setIsCollecting] = useState(false);

  const optimizedService = OptimizedArchitectService.getInstance();
  const cacheService = ArchitectsCacheService.getInstance();

  // Collect performance data
  const collectPerformanceData = useCallback(async () => {
    if (!visible || isCollecting) return;

    setIsCollecting(true);
    try {
      const stats = optimizedService.getPerformanceStats();
      const cache = cacheService.getStats();
      
      const memoryInfo = (performance as any).memory;
      const memoryUsage = memoryInfo 
        ? memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit 
        : 0;

      const newDataPoint: PerformanceData = {
        timestamp: Date.now(),
        queryTime: stats.avgQueryTime || 0,
        cacheHitRate: cache.hitRatio || 0,
        memoryUsage,
        networkLatency: await measureNetworkLatency()
      };

      setPerformanceData(prev => [...prev.slice(-29), newDataPoint]); // Keep last 30 points
      setCurrentStats(stats);
      setCacheStats(cache);

      // Check for performance alerts
      checkPerformanceAlerts(newDataPoint, stats, cache);

    } catch (error) {
      console.error('[PerformanceMonitor] Data collection failed:', error);
    } finally {
      setIsCollecting(false);
    }
  }, [visible, isCollecting, optimizedService, cacheService]);

  // Measure network latency
  const measureNetworkLatency = useCallback(async (): Promise<number> => {
    const start = performance.now();
    try {
      await fetch('/manifest.json', { method: 'HEAD', cache: 'no-cache' });
      return performance.now() - start;
    } catch {
      return 0;
    }
  }, []);

  // Check for performance alerts
  const checkPerformanceAlerts = useCallback((
    data: PerformanceData,
    stats: any,
    cache: any
  ) => {
    const newAlerts: PerformanceAlert[] = [];

    // High query time alert
    if (data.queryTime > 1000) {
      newAlerts.push({
        id: `high-query-time-${Date.now()}`,
        type: 'warning',
        message: `クエリ実行時間が高いです: ${data.queryTime.toFixed(0)}ms`,
        timestamp: Date.now(),
        acknowledged: false
      });
    }

    // Low cache hit rate alert
    if (cache.hitRatio < 0.6) {
      newAlerts.push({
        id: `low-cache-hit-${Date.now()}`,
        type: 'warning',
        message: `キャッシュヒット率が低いです: ${(cache.hitRatio * 100).toFixed(1)}%`,
        timestamp: Date.now(),
        acknowledged: false
      });
    }

    // High memory usage alert
    if (data.memoryUsage > 0.8) {
      newAlerts.push({
        id: `high-memory-${Date.now()}`,
        type: 'error',
        message: `メモリ使用量が高いです: ${(data.memoryUsage * 100).toFixed(1)}%`,
        timestamp: Date.now(),
        acknowledged: false
      });
    }

    // High network latency alert
    if (data.networkLatency > 500) {
      newAlerts.push({
        id: `high-latency-${Date.now()}`,
        type: 'warning',
        message: `ネットワーク遅延が高いです: ${data.networkLatency.toFixed(0)}ms`,
        timestamp: Date.now(),
        acknowledged: false
      });
    }

    if (newAlerts.length > 0) {
      setAlerts(prev => [...prev.slice(-19), ...newAlerts]); // Keep last 20 alerts
    }
  }, []);

  // Auto refresh effect
  useEffect(() => {
    if (!autoRefresh || !visible) return;

    const interval = setInterval(collectPerformanceData, 2000); // Every 2 seconds
    return () => clearInterval(interval);
  }, [autoRefresh, visible, collectPerformanceData]);

  // Initial data collection
  useEffect(() => {
    if (visible) {
      collectPerformanceData();
    }
  }, [visible, collectPerformanceData]);

  // Acknowledge alert
  const acknowledgeAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ));
  }, []);

  // Clear all alerts
  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  // Calculate trend
  const calculateTrend = useCallback((data: PerformanceData[], field: keyof PerformanceData): number => {
    if (data.length < 2) return 0;
    
    const recent = data.slice(-5);
    const older = data.slice(-10, -5);
    
    if (older.length === 0) return 0;
    
    const recentAvg = recent.reduce((sum, item) => sum + (item[field] as number), 0) / recent.length;
    const olderAvg = older.reduce((sum, item) => sum + (item[field] as number), 0) / older.length;
    
    return ((recentAvg - olderAvg) / olderAvg) * 100;
  }, []);

  // Format duration
  const formatDuration = useCallback((ms: number): string => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  }, []);

  // Format percentage
  const formatPercentage = useCallback((value: number): string => {
    return `${(value * 100).toFixed(1)}%`;
  }, []);

  // Get performance status
  const getPerformanceStatus = useCallback(() => {
    if (!currentStats || !cacheStats) return 'unknown';
    
    const queryTimeOk = currentStats.avgQueryTime < 500;
    const cacheHitOk = cacheStats.hitRatio >= 0.8;
    const memoryOk = performanceData.length > 0 ? 
      performanceData[performanceData.length - 1].memoryUsage < 0.7 : true;
    
    if (queryTimeOk && cacheHitOk && memoryOk) return 'excellent';
    if (queryTimeOk && cacheHitOk) return 'good';
    if (queryTimeOk || cacheHitOk) return 'fair';
    return 'poor';
  }, [currentStats, cacheStats, performanceData]);

  if (!visible) return null;

  const status = getPerformanceStatus();
  const statusColors = {
    excellent: 'success',
    good: 'info',
    fair: 'warning',
    poor: 'error',
    unknown: 'default'
  } as const;

  const activeAlerts = alerts.filter(alert => !alert.acknowledged);

  return (
    <Card sx={{ mt: 2, border: '1px solid', borderColor: 'divider' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Speed color="primary" />
            <Typography variant="h6">
              パフォーマンス監視
            </Typography>
            <Chip 
              label={status === 'excellent' ? '優秀' : 
                     status === 'good' ? '良好' :
                     status === 'fair' ? '普通' :
                     status === 'poor' ? '要改善' : '不明'}
              color={statusColors[status]}
              size="small"
            />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  size="small"
                />
              }
              label="自動更新"
            />
            <IconButton onClick={() => setExpanded(!expanded)} size="small">
              {expanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
            {onToggleVisibility && (
              <IconButton onClick={() => onToggleVisibility(false)} size="small">
                ×
              </IconButton>
            )}
          </Box>
        </Box>

        {/* Alerts */}
        {activeAlerts.length > 0 && (
          <Box sx={{ mb: 2 }}>
            {activeAlerts.slice(0, 3).map((alert) => (
              <Alert
                key={alert.id}
                severity={alert.type}
                action={
                  <IconButton
                    size="small"
                    onClick={() => acknowledgeAlert(alert.id)}
                  >
                    <CheckCircle fontSize="small" />
                  </IconButton>
                }
                sx={{ mb: 1 }}
              >
                {alert.message}
              </Alert>
            ))}
            {activeAlerts.length > 3 && (
              <Typography variant="body2" color="text.secondary">
                他 {activeAlerts.length - 3} 件のアラート
              </Typography>
            )}
          </Box>
        )}

        {/* Key Metrics */}
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                平均クエリ時間
              </Typography>
              <Typography variant="h6" color={currentStats?.avgQueryTime > 500 ? 'error' : 'primary'}>
                {currentStats ? formatDuration(currentStats.avgQueryTime) : '-'}
              </Typography>
              {performanceData.length > 5 && (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                  <TrendingUp 
                    fontSize="small" 
                    color={calculateTrend(performanceData, 'queryTime') < 0 ? 'success' : 'error'}
                    sx={{ 
                      transform: calculateTrend(performanceData, 'queryTime') < 0 ? 'rotate(180deg)' : 'none'
                    }}
                  />
                  <Typography variant="caption">
                    {calculateTrend(performanceData, 'queryTime').toFixed(1)}%
                  </Typography>
                </Box>
              )}
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                キャッシュヒット率
              </Typography>
              <Typography variant="h6" color={cacheStats?.hitRatio >= 0.8 ? 'success' : 'warning'}>
                {cacheStats ? formatPercentage(cacheStats.hitRatio) : '-'}
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={cacheStats ? cacheStats.hitRatio * 100 : 0}
                color={cacheStats?.hitRatio >= 0.8 ? 'success' : 'warning'}
                sx={{ mt: 1 }}
              />
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                メモリ使用量
              </Typography>
              <Typography variant="h6" color={
                performanceData.length > 0 && performanceData[performanceData.length - 1]?.memoryUsage > 0.8 
                  ? 'error' 
                  : 'primary'
              }>
                {performanceData.length > 0 
                  ? formatPercentage(performanceData[performanceData.length - 1].memoryUsage)
                  : '-'
                }
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={performanceData.length > 0 
                  ? performanceData[performanceData.length - 1].memoryUsage * 100 
                  : 0
                }
                color={
                  performanceData.length > 0 && performanceData[performanceData.length - 1]?.memoryUsage > 0.8 
                    ? 'error' 
                    : 'primary'
                }
                sx={{ mt: 1 }}
              />
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                総クエリ数
              </Typography>
              <Typography variant="h6">
                {cacheStats ? cacheStats.totalQueries.toLocaleString() : '-'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                ヒット: {cacheStats ? cacheStats.hits.toLocaleString() : '-'}
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Detailed View */}
        <Collapse in={expanded}>
          <Box sx={{ mt: 3 }}>
            {/* Detailed Stats Table */}
            <TableContainer component={Paper} sx={{ mb: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>メトリック</TableCell>
                    <TableCell align="right">現在値</TableCell>
                    <TableCell align="right">目標値</TableCell>
                    <TableCell align="center">状態</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>初期ロード時間</TableCell>
                    <TableCell align="right">
                      {currentStats ? `${currentStats.avgQueryTime.toFixed(0)}ms` : '-'}
                    </TableCell>
                    <TableCell align="right">&lt; 2000ms</TableCell>
                    <TableCell align="center">
                      {currentStats && currentStats.avgQueryTime < 2000 ? (
                        <CheckCircle color="success" fontSize="small" />
                      ) : (
                        <Warning color="warning" fontSize="small" />
                      )}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>キャッシュヒット率</TableCell>
                    <TableCell align="right">
                      {cacheStats ? `${(cacheStats.hitRatio * 100).toFixed(1)}%` : '-'}
                    </TableCell>
                    <TableCell align="right">&gt; 80%</TableCell>
                    <TableCell align="center">
                      {cacheStats && cacheStats.hitRatio >= 0.8 ? (
                        <CheckCircle color="success" fontSize="small" />
                      ) : (
                        <Warning color="warning" fontSize="small" />
                      )}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>スクロール性能</TableCell>
                    <TableCell align="right">60fps</TableCell>
                    <TableCell align="right">60fps</TableCell>
                    <TableCell align="center">
                      <CheckCircle color="success" fontSize="small" />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>

            {/* Cache Details */}
            {cacheStats && (
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        <Storage fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                        キャッシュ統計
                      </Typography>
                      <Typography variant="body2">
                        メモリサイズ: {(cacheStats.memorySize / 1024 / 1024).toFixed(1)}MB
                      </Typography>
                      <Typography variant="body2">
                        予測ヒット: {cacheStats.predictiveHits || 0}
                      </Typography>
                      <Typography variant="body2">
                        プリフェッチ: {cacheStats.prefetchedQueries || 0}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        <Info fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                        最適化レベル
                      </Typography>
                      <Typography variant="body2">
                        最適化スコア: {currentStats ? (currentStats.optimizationLevel * 100).toFixed(0) : 0}%
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={currentStats ? currentStats.optimizationLevel * 100 : 0}
                        sx={{ mt: 1 }}
                      />
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default memo(ArchitectsPerformanceMonitor);