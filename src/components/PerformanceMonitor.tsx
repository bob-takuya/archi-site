import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Chip,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Speed as SpeedIcon,
  Memory as MemoryIcon,
  NetworkCheck as NetworkIcon,
  Storage as StorageIcon,
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';

interface PerformanceMetrics {
  // Core Web Vitals
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  
  // Additional metrics
  ttfb: number; // Time to First Byte
  domContentLoaded: number;
  loadComplete: number;
  
  // Memory usage
  usedHeapSize: number;
  totalHeapSize: number;
  heapSizeLimit: number;
  
  // Cache performance
  cacheHitRatio: number;
  cacheSize: number;
  
  // Database performance
  dbQueryTime: number;
  dbConnectionTime: number;
  
  // Network
  connectionType: string;
  effectiveType: string;
  
  timestamp: number;
}

interface PerformanceThresholds {
  fcp: { good: number; poor: number };
  lcp: { good: number; poor: number };
  fid: { good: number; poor: number };
  cls: { good: number; poor: number };
  ttfb: { good: number; poor: number };
  memoryUsage: { good: number; poor: number };
  cacheHitRatio: { good: number; poor: number };
}

const PERFORMANCE_THRESHOLDS: PerformanceThresholds = {
  fcp: { good: 1800, poor: 3000 },
  lcp: { good: 2500, poor: 4000 },
  fid: { good: 100, poor: 300 },
  cls: { good: 0.1, poor: 0.25 },
  ttfb: { good: 800, poor: 1800 },
  memoryUsage: { good: 0.5, poor: 0.8 },
  cacheHitRatio: { good: 0.8, poor: 0.5 },
};

/**
 * Performance monitoring component with real-time metrics
 * Tracks Core Web Vitals and custom performance indicators
 */
export const PerformanceMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isCollecting, setIsCollecting] = useState(false);
  const [history, setHistory] = useState<PerformanceMetrics[]>([]);

  // Collect performance metrics
  const collectMetrics = useCallback(async () => {
    setIsCollecting(true);
    
    try {
      const perfEntries = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paintEntries = performance.getEntriesByType('paint');
      
      // Core Web Vitals (approximations for demo)
      const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0;
      const lcp = await getLCP();
      const fid = await getFID();
      const cls = await getCLS();
      
      // Memory metrics
      const memoryInfo = (performance as any).memory;
      
      // Cache metrics (from cache service if available)
      const cacheStats = await getCacheStats();
      
      // Network info
      const networkInfo = (navigator as any).connection || {};
      
      const newMetrics: PerformanceMetrics = {
        fcp,
        lcp,
        fid,
        cls,
        ttfb: perfEntries.responseStart - perfEntries.requestStart,
        domContentLoaded: perfEntries.domContentLoadedEventEnd - perfEntries.navigationStart,
        loadComplete: perfEntries.loadEventEnd - perfEntries.navigationStart,
        usedHeapSize: memoryInfo?.usedJSHeapSize || 0,
        totalHeapSize: memoryInfo?.totalJSHeapSize || 0,
        heapSizeLimit: memoryInfo?.jsHeapSizeLimit || 0,
        cacheHitRatio: cacheStats.hitRatio,
        cacheSize: cacheStats.size,
        dbQueryTime: await measureDbQueryTime(),
        dbConnectionTime: 0, // Would be measured during DB initialization
        connectionType: networkInfo.type || 'unknown',
        effectiveType: networkInfo.effectiveType || 'unknown',
        timestamp: Date.now(),
      };
      
      setMetrics(newMetrics);
      setHistory(prev => [...prev.slice(-19), newMetrics]); // Keep last 20 measurements
      
    } catch (error) {
      console.error('Failed to collect performance metrics:', error);
    } finally {
      setIsCollecting(false);
    }
  }, []);

  // Auto-collect metrics on mount and periodically
  useEffect(() => {
    collectMetrics();
    
    const interval = setInterval(collectMetrics, 30000); // Every 30 seconds
    
    return () => clearInterval(interval);
  }, [collectMetrics]);

  // Get performance score
  const getPerformanceScore = (value: number, thresholds: { good: number; poor: number }, invert = false): 'good' | 'needs-improvement' | 'poor' => {
    if (invert) {
      if (value >= thresholds.good) return 'good';
      if (value >= thresholds.poor) return 'needs-improvement';
      return 'poor';
    } else {
      if (value <= thresholds.good) return 'good';
      if (value <= thresholds.poor) return 'needs-improvement';
      return 'poor';
    }
  };

  // Get score color
  const getScoreColor = (score: string) => {
    switch (score) {
      case 'good': return 'success';
      case 'needs-improvement': return 'warning';
      case 'poor': return 'error';
      default: return 'default';
    }
  };

  // Get score icon
  const getScoreIcon = (score: string) => {
    switch (score) {
      case 'good': return <CheckCircleIcon />;
      case 'needs-improvement': return <WarningIcon />;
      case 'poor': return <ErrorIcon />;
      default: return null;
    }
  };

  // Format bytes
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format time
  const formatTime = (ms: number) => {
    return `${ms.toFixed(0)}ms`;
  };

  if (!metrics) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" sx={{ flexGrow: 1 }}>
          パフォーマンス監視
        </Typography>
        <Tooltip title="更新">
          <IconButton onClick={collectMetrics} disabled={isCollecting}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Grid container spacing={2}>
        {/* Core Web Vitals */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <SpeedIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Core Web Vitals
              </Typography>
              
              <List>
                <ListItem>
                  <ListItemIcon>
                    {getScoreIcon(getPerformanceScore(metrics.fcp, PERFORMANCE_THRESHOLDS.fcp))}
                  </ListItemIcon>
                  <ListItemText
                    primary="First Contentful Paint"
                    secondary={formatTime(metrics.fcp)}
                  />
                  <Chip
                    label={getPerformanceScore(metrics.fcp, PERFORMANCE_THRESHOLDS.fcp)}
                    color={getScoreColor(getPerformanceScore(metrics.fcp, PERFORMANCE_THRESHOLDS.fcp)) as any}
                    size="small"
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    {getScoreIcon(getPerformanceScore(metrics.lcp, PERFORMANCE_THRESHOLDS.lcp))}
                  </ListItemIcon>
                  <ListItemText
                    primary="Largest Contentful Paint"
                    secondary={formatTime(metrics.lcp)}
                  />
                  <Chip
                    label={getPerformanceScore(metrics.lcp, PERFORMANCE_THRESHOLDS.lcp)}
                    color={getScoreColor(getPerformanceScore(metrics.lcp, PERFORMANCE_THRESHOLDS.lcp)) as any}
                    size="small"
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    {getScoreIcon(getPerformanceScore(metrics.fid, PERFORMANCE_THRESHOLDS.fid))}
                  </ListItemIcon>
                  <ListItemText
                    primary="First Input Delay"
                    secondary={formatTime(metrics.fid)}
                  />
                  <Chip
                    label={getPerformanceScore(metrics.fid, PERFORMANCE_THRESHOLDS.fid)}
                    color={getScoreColor(getPerformanceScore(metrics.fid, PERFORMANCE_THRESHOLDS.fid)) as any}
                    size="small"
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    {getScoreIcon(getPerformanceScore(metrics.cls, PERFORMANCE_THRESHOLDS.cls))}
                  </ListItemIcon>
                  <ListItemText
                    primary="Cumulative Layout Shift"
                    secondary={metrics.cls.toFixed(3)}
                  />
                  <Chip
                    label={getPerformanceScore(metrics.cls, PERFORMANCE_THRESHOLDS.cls)}
                    color={getScoreColor(getPerformanceScore(metrics.cls, PERFORMANCE_THRESHOLDS.cls)) as any}
                    size="small"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Memory Usage */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <MemoryIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                メモリ使用量
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" gutterBottom>
                  使用量: {formatBytes(metrics.usedHeapSize)} / {formatBytes(metrics.totalHeapSize)}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={(metrics.usedHeapSize / metrics.totalHeapSize) * 100}
                  color={
                    metrics.usedHeapSize / metrics.totalHeapSize > 0.8 ? 'error' :
                    metrics.usedHeapSize / metrics.totalHeapSize > 0.6 ? 'warning' : 'success'
                  }
                />
              </Box>
              
              <Typography variant="body2" color="text.secondary">
                限界: {formatBytes(metrics.heapSizeLimit)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Network & Cache */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <NetworkIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                ネットワーク & キャッシュ
              </Typography>
              
              <List dense>
                <ListItem>
                  <ListItemText
                    primary="接続タイプ"
                    secondary={metrics.connectionType}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="実効タイプ"
                    secondary={metrics.effectiveType}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="キャッシュヒット率"
                    secondary={`${(metrics.cacheHitRatio * 100).toFixed(1)}%`}
                  />
                  <Chip
                    label={getPerformanceScore(metrics.cacheHitRatio, PERFORMANCE_THRESHOLDS.cacheHitRatio, true)}
                    color={getScoreColor(getPerformanceScore(metrics.cacheHitRatio, PERFORMANCE_THRESHOLDS.cacheHitRatio, true)) as any}
                    size="small"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="キャッシュサイズ"
                    secondary={formatBytes(metrics.cacheSize)}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Database Performance */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <StorageIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                データベースパフォーマンス
              </Typography>
              
              <List dense>
                <ListItem>
                  <ListItemText
                    primary="クエリ時間"
                    secondary={formatTime(metrics.dbQueryTime)}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="TTFB"
                    secondary={formatTime(metrics.ttfb)}
                  />
                  <Chip
                    label={getPerformanceScore(metrics.ttfb, PERFORMANCE_THRESHOLDS.ttfb)}
                    color={getScoreColor(getPerformanceScore(metrics.ttfb, PERFORMANCE_THRESHOLDS.ttfb)) as any}
                    size="small"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="DOM読み込み完了"
                    secondary={formatTime(metrics.domContentLoaded)}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="ページ読み込み完了"
                    secondary={formatTime(metrics.loadComplete)}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Performance History */}
      <Accordion sx={{ mt: 2 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>パフォーマンス履歴 ({history.length}件)</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
            {history.slice(-10).reverse().map((metric, index) => (
              <Box key={metric.timestamp} sx={{ mb: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="body2">
                  {new Date(metric.timestamp).toLocaleTimeString()} - 
                  FCP: {formatTime(metric.fcp)}, 
                  LCP: {formatTime(metric.lcp)}, 
                  Memory: {((metric.usedHeapSize / metric.totalHeapSize) * 100).toFixed(1)}%
                </Typography>
              </Box>
            ))}
          </Box>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

// Helper functions for Core Web Vitals measurement
async function getLCP(): Promise<number> {
  return new Promise((resolve) => {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        resolve(lastEntry.startTime);
        observer.disconnect();
      });
      observer.observe({ type: 'largest-contentful-paint', buffered: true });
      
      // Fallback timeout
      setTimeout(() => resolve(0), 1000);
    } else {
      resolve(0);
    }
  });
}

async function getFID(): Promise<number> {
  return new Promise((resolve) => {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const firstEntry = entries[0];
        resolve(firstEntry.processingStart - firstEntry.startTime);
        observer.disconnect();
      });
      observer.observe({ type: 'first-input', buffered: true });
      
      // Fallback timeout
      setTimeout(() => resolve(0), 5000);
    } else {
      resolve(0);
    }
  });
}

async function getCLS(): Promise<number> {
  return new Promise((resolve) => {
    if ('PerformanceObserver' in window) {
      let clsValue = 0;
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
      });
      observer.observe({ type: 'layout-shift', buffered: true });
      
      // Measure for 5 seconds
      setTimeout(() => {
        observer.disconnect();
        resolve(clsValue);
      }, 5000);
    } else {
      resolve(0);
    }
  });
}

async function getCacheStats() {
  // This would integrate with your actual cache service
  try {
    // Assuming you have a global cache service
    const cacheService = (window as any).cacheService;
    return cacheService ? cacheService.getStats() : { hitRatio: 0, size: 0 };
  } catch {
    return { hitRatio: 0, size: 0 };
  }
}

async function measureDbQueryTime(): Promise<number> {
  // This would measure actual database query time
  const start = performance.now();
  
  try {
    // Simulate a quick database query
    await new Promise(resolve => setTimeout(resolve, Math.random() * 50));
    return performance.now() - start;
  } catch {
    return 0;
  }
}

export default PerformanceMonitor;