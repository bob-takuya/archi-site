import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Paper,
  Fab,
  Zoom,
  useTheme,
  useMediaQuery,
  Alert,
  Snackbar,
  IconButton,
  Tooltip,
  Badge
} from '@mui/material';
import {
  Analytics,
  Map as MapIcon,
  Timeline,
  Person,
  FilterAlt,
  Download,
  Refresh,
  Settings,
  Fullscreen,
  Share
} from '@mui/icons-material';
import { Helmet } from 'react-helmet-async';
import useDatabase from '../hooks/useDatabase';
import { Architecture } from '../types/architecture';
import { Architect } from '../types/architect';
import OptimizedAnalyticsDashboard from '../components/OptimizedAnalyticsDashboard';
import InteractiveMap from '../components/InteractiveMap';
import ArchitectureTimelineVisualization from '../components/ArchitectureTimelineVisualization';
import ArchitectPortfolioVisualization from '../components/ArchitectPortfolioVisualization';
import AdvancedFilterSystem from '../components/AdvancedFilterSystem';
import DataExportSystem from '../components/DataExportSystem';

// Tab configuration
interface AnalyticsTab {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  component: React.ComponentType<any>;
  requiresData: boolean;
}

const ANALYTICS_TABS: AnalyticsTab[] = [
  {
    id: 'dashboard',
    label: '研究 (高速分析)',
    icon: <Analytics />,
    description: 'プリコンピュート済み高速建築データ分析',
    component: OptimizedAnalyticsDashboard,
    requiresData: false
  },
  {
    id: 'map',
    label: 'インタラクティブマップ',
    icon: <MapIcon />,
    description: '地理的分布と詳細情報',
    component: InteractiveMap,
    requiresData: true
  },
  {
    id: 'timeline',
    label: 'タイムライン',
    icon: <Timeline />,
    description: '歴史的変遷の可視化',
    component: ArchitectureTimelineVisualization,
    requiresData: true
  },
  {
    id: 'portfolio',
    label: '建築家ポートフォリオ',
    icon: <Person />,
    description: '建築家の作品と統計',
    component: ArchitectPortfolioVisualization,
    requiresData: true
  },
  {
    id: 'filters',
    label: '高度フィルタ',
    icon: <FilterAlt />,
    description: 'カスタム検索とフィルタリング',
    component: AdvancedFilterSystem,
    requiresData: true
  },
  {
    id: 'export',
    label: 'データエクスポート',
    icon: <Download />,
    description: 'データの書き出しと共有',
    component: DataExportSystem,
    requiresData: true
  }
];

/**
 * Analytics Page Component
 * Comprehensive data visualization and analytics dashboard
 */
const AnalyticsPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { isReady, isLoading, error, architecture } = useDatabase();

  const [activeTab, setActiveTab] = useState(0);
  const [architectures, setArchitectures] = useState<Architecture[]>([]);
  const [architects, setArchitects] = useState<Architect[]>([]);
  const [filteredArchitectures, setFilteredArchitectures] = useState<Architecture[]>([]);
  const [selectedArchitect, setSelectedArchitect] = useState<Architect | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [notification, setNotification] = useState<{ message: string; severity: 'success' | 'info' | 'warning' | 'error' } | null>(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Load data from database
  useEffect(() => {
    const loadData = async () => {
      if (!isReady) return;

      try {
        // For OptimizedAnalyticsDashboard, we don't need to load all data
        // The dashboard loads precomputed analytics on its own
        // Only load data for tabs that require it
        
        // Clear any previously loaded data
        setArchitectures([]);
        setFilteredArchitectures([]);
        setArchitects([]);
        
        // The OptimizedAnalyticsDashboard handles its own data loading
        console.log('Analytics page ready - OptimizedAnalyticsDashboard will load precomputed data');

      } catch (error) {
        console.error('Failed to initialize analytics:', error);
        setNotification({
          message: 'データの初期化に失敗しました',
          severity: 'error'
        });
      }
    };

    loadData();
  }, [isReady]);

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Handle filter changes from advanced filter system
  const handleFilterChange = (filtered: Architecture[], activeFilters: any[]) => {
    setFilteredArchitectures(filtered);
    setNotification({
      message: `フィルタが適用されました (${filtered.length}件)`,
      severity: 'info'
    });
  };

  // Handle architecture selection
  const handleArchitectureSelect = (architecture: Architecture) => {
    // Find architect for this architecture
    const architect = architects.find(a => a.ZAR_NAME === architecture.ZAR_ARCHITECT);
    if (architect) {
      setSelectedArchitect(architect);
      setActiveTab(3); // Switch to portfolio tab
    }
  };

  // Handle architect comparison
  const handleArchitectCompare = (architect: Architect) => {
    setNotification({
      message: `${architect.ZAR_NAME}の比較機能は開発中です`,
      severity: 'info'
    });
  };

  // Refresh data
  const handleRefresh = () => {
    setLastRefresh(new Date());
    setNotification({
      message: 'データを更新しました',
      severity: 'success'
    });
  };

  // Toggle fullscreen
  const handleFullscreen = () => {
    if (!isFullscreen) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  };

  // Current tab configuration
  const currentTab = ANALYTICS_TABS[activeTab];

  // Data summary for display
  const dataSummary = useMemo(() => ({
    totalArchitectures: architectures.length,
    filteredCount: filteredArchitectures.length,
    totalArchitects: architects.length,
    yearRange: architectures.length > 0 ? [
      Math.min(...architectures.filter(a => a.ZAR_YEAR).map(a => a.ZAR_YEAR!)),
      Math.max(...architectures.filter(a => a.ZAR_YEAR).map(a => a.ZAR_YEAR!))
    ] : [2000, 2024],
    categories: [...new Set(architectures.map(a => a.ZAR_CATEGORY).filter(Boolean))].length,
    prefectures: [...new Set(architectures.map(a => a.ZAR_PREFECTURE).filter(Boolean))].length
  }), [architectures, filteredArchitectures, architects]);

  // Component props for active tab
  const getComponentProps = () => {
    const baseProps = {
      architectures: filteredArchitectures,
      architects: architects,
      onRefresh: handleRefresh
    };

    switch (currentTab.id) {
      case 'dashboard':
        return {
          onExportData: (format: string) => {
            setNotification({
              message: `${format}形式でのエクスポートを開始します`,
              severity: 'info'
            });
          },
          enableRealTimeUpdates: false
        };
      
      case 'map':
        return {
          markers: filteredArchitectures
            .filter(arch => arch.ZAR_LATITUDE && arch.ZAR_LONGITUDE)
            .map(arch => ({
              id: arch.Z_PK,
              name: arch.ZAR_TITLE,
              architect: arch.ZAR_ARCHITECT,
              location: arch.ZAR_ADDRESS || arch.ZAR_PREFECTURE || '',
              latitude: arch.ZAR_LATITUDE!,
              longitude: arch.ZAR_LONGITUDE!,
              year: arch.ZAR_YEAR,
              category: arch.ZAR_CATEGORY,
              prefecture: arch.ZAR_PREFECTURE,
              imageUrl: arch.ZAR_IMAGE_URL,
              description: arch.ZAR_DESCRIPTION
            })),
          center: [35.6762, 139.6503] as [number, number], // Tokyo
          zoom: 10,
          height: '70vh',
          onMarkerClick: handleArchitectureSelect,
          enableClustering: true,
          enableAnalytics: true
        };
      
      case 'timeline':
        return {
          ...baseProps,
          onEventSelect: handleArchitectureSelect,
          enableEras: true,
          enableFiltering: true,
          enableComparison: true
        };
      
      case 'portfolio':
        return {
          architect: selectedArchitect || architects[0],
          architectures: filteredArchitectures,
          onWorkSelect: handleArchitectureSelect,
          onCompareArchitect: handleArchitectCompare,
          enableComparison: true,
          showDetailedStats: true
        };
      
      case 'filters':
        return {
          ...baseProps,
          onFilterChange: handleFilterChange,
          enableRealTimeUpdates: true,
          enableSavePresets: true,
          enableGeoFiltering: true,
          enableAdvancedAnalytics: true
        };
      
      case 'export':
        return {
          ...baseProps,
          onExportComplete: (entry: any) => {
            setNotification({
              message: `エクスポートが完了しました: ${entry.filename}`,
              severity: 'success'
            });
          },
          enableScheduledExports: false,
          enableCustomTemplates: true
        };
      
      default:
        return baseProps;
    }
  };

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <Typography variant="h6">データを読み込み中...</Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          データの読み込みに失敗しました: {error}
        </Alert>
      </Container>
    );
  }

  const CurrentComponent = currentTab.component;

  return (
    <>
      <Helmet>
        <title>データ分析 - 日本建築データベース</title>
        <meta name="description" content="包括的な建築データの分析とビジュアライゼーション" />
      </Helmet>

      <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            データ分析・ビジュアライゼーション
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            建築データの包括的な分析、可視化、エクスポート機能
          </Typography>
          
          {/* Data Summary */}
          <Paper sx={{ p: 2, mb: 2 }}>
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'center' }}>
              <Typography variant="body2">
                建築作品: <strong>{dataSummary.totalArchitectures.toLocaleString()}</strong>件
                {dataSummary.filteredCount !== dataSummary.totalArchitectures && (
                  <> (フィルタ後: <strong>{dataSummary.filteredCount.toLocaleString()}</strong>件)</>
                )}
              </Typography>
              <Typography variant="body2">
                建築家: <strong>{dataSummary.totalArchitects}</strong>人
              </Typography>
              <Typography variant="body2">
                期間: <strong>{dataSummary.yearRange[0]} - {dataSummary.yearRange[1]}</strong>年
              </Typography>
              <Typography variant="body2">
                カテゴリ: <strong>{dataSummary.categories}</strong>種類
              </Typography>
              <Typography variant="body2">
                都道府県: <strong>{dataSummary.prefectures}</strong>
              </Typography>
              <Typography variant="caption" color="text.secondary">
                最終更新: {lastRefresh.toLocaleTimeString()}
              </Typography>
            </Box>
          </Paper>
        </Box>

        {/* Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant={isMobile ? "scrollable" : "fullWidth"}
            scrollButtons="auto"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            {ANALYTICS_TABS.map((tab, index) => (
              <Tab
                key={tab.id}
                icon={
                  <Badge 
                    badgeContent={
                      tab.id === 'filters' && filteredArchitectures.length !== architectures.length
                        ? filteredArchitectures.length
                        : undefined
                    }
                    color="primary"
                  >
                    {tab.icon}
                  </Badge>
                }
                label={tab.label}
                sx={{ minHeight: 72 }}
              />
            ))}
          </Tabs>
        </Paper>

        {/* Tab Content */}
        <Paper sx={{ p: 0, overflow: 'hidden' }}>
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', backgroundColor: 'grey.50' }}>
            <Typography variant="h6" gutterBottom>
              {currentTab.label}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {currentTab.description}
            </Typography>
          </Box>
          
          <Box sx={{ p: currentTab.id === 'map' ? 0 : 2 }}>
            {currentTab.requiresData && architectures.length === 0 ? (
              <Alert severity="info">
                分析データがありません。データベースの接続を確認してください。
              </Alert>
            ) : (
              <CurrentComponent {...getComponentProps()} />
            )}
          </Box>
        </Paper>

        {/* Floating Action Buttons */}
        <Box sx={{ position: 'fixed', bottom: 16, right: 16, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Zoom in={!isMobile}>
            <Tooltip title="フルスクリーン">
              <Fab
                color="primary"
                size="small"
                onClick={handleFullscreen}
              >
                <Fullscreen />
              </Fab>
            </Tooltip>
          </Zoom>
          
          <Zoom in={true} style={{ transitionDelay: '100ms' }}>
            <Tooltip title="データ更新">
              <Fab
                color="secondary"
                size="small"
                onClick={handleRefresh}
              >
                <Refresh />
              </Fab>
            </Tooltip>
          </Zoom>

          <Zoom in={true} style={{ transitionDelay: '200ms' }}>
            <Tooltip title="共有">
              <Fab
                color="default"
                size="small"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: '日本建築データベース - データ分析',
                      text: 'インタラクティブな建築データ分析をご覧ください',
                      url: window.location.href
                    });
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                    setNotification({
                      message: 'URLをコピーしました',
                      severity: 'success'
                    });
                  }
                }}
              >
                <Share />
              </Fab>
            </Tooltip>
          </Zoom>
        </Box>

        {/* Notification Snackbar */}
        <Snackbar
          open={!!notification}
          autoHideDuration={6000}
          onClose={() => setNotification(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        >
          {notification && (
            <Alert 
              onClose={() => setNotification(null)} 
              severity={notification.severity}
              variant="filled"
            >
              {notification.message}
            </Alert>
          )}
        </Snackbar>
      </Container>
    </>
  );
};

export default AnalyticsPage;