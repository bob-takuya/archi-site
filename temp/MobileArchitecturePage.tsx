/**
 * Mobile-optimized architecture browsing page with enhanced touch interactions
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Container,
  Grid,
  Fab,
  Snackbar,
  Alert,
  SwipeableDrawer,
  useTheme,
  alpha,
  LinearProgress,
  Backdrop,
  CircularProgress
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  ViewModule as GridViewIcon,
  Map as MapIcon,
  Favorite as FavoriteIcon,
  Share as ShareIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

// Mobile-optimized components
import MobileArchitectureCard from '../components/MobileArchitectureCard';
import MobileSearchInterface from '../components/MobileSearchInterface';
import MobileArchitectureViewer from '../components/MobileArchitectureViewer';

// Mobile utilities
import { useViewportSize, usePullToRefresh, useAdvancedTouchGestures } from '../utils/mobileGestures';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useNetworkStatus, MobilePerformanceMonitor } from '../utils/mobileServiceWorker';

// Services
import { 
  getAllArchitectures, 
  searchArchitectures, 
  getResearchAnalytics 
} from '../services/api/FastArchitectureService';

interface Architecture {
  id: string;
  name: string;
  architect: string;
  year: number;
  location: string;
  description?: string;
  imageUrl?: string;
  images?: string[];
  tags?: string[];
  coordinates?: [number, number];
}

interface SearchSuggestion {
  id: string;
  text: string;
  type: 'architect' | 'location' | 'style' | 'year' | 'general';
  icon: React.ReactNode;
  count?: number;
}

const MobileArchitecturePage: React.FC = () => {
  const theme = useTheme();
  const viewport = useViewportSize();
  const navigate = useNavigate();
  const location = useLocation();
  const isOnline = useNetworkStatus();

  // State management
  const [architectures, setArchitectures] = useState<Architecture[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  
  // Mobile-specific state
  const [showSearch, setShowSearch] = useState(false);
  const [selectedArchitecture, setSelectedArchitecture] = useState<Architecture | null>(null);
  const [currentArchitectureIndex, setCurrentArchitectureIndex] = useState(0);
  const [showViewer, setShowViewer] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  
  // Local storage for favorites and preferences
  const [favorites, setFavorites] = useLocalStorage<string[]>('architecture-favorites', []);
  const [searchHistory, setSearchHistory] = useLocalStorage<string[]>('search-history', []);
  const [viewPreference, setViewPreference] = useLocalStorage<'grid' | 'map'>('view-preference', 'grid');

  const itemsPerPage = viewport.isMobile ? 8 : 12;

  // Pull to refresh functionality
  const { gestureHandlers: pullRefreshHandlers, isPulling, pullProgress, isRefreshing } = usePullToRefresh(
    async () => {
      await fetchArchitectures(true);
      setNotification('データが更新されました');
    }
  );

  // Swipe gestures for navigation
  const { gestureHandlers: swipeHandlers } = useAdvancedTouchGestures(
    undefined, // No left swipe
    undefined, // No right swipe
    () => setShowSearch(true), // Swipe up to search
    undefined, // No down swipe
    { enableHapticFeedback: true }
  );

  // Fetch architectures with mobile optimizations
  const fetchArchitectures = useCallback(async (refresh = false) => {
    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const startTime = performance.now();
      
      let result;
      if (searchQuery) {
        result = await searchArchitectures(searchQuery, currentPage, itemsPerPage);
      } else {
        result = await getAllArchitectures(currentPage, itemsPerPage);
      }

      const endTime = performance.now();
      MobilePerformanceMonitor.recordMetric('api-request-time', endTime - startTime, {
        type: searchQuery ? 'search' : 'list',
        page: currentPage.toString(),
        itemsPerPage: itemsPerPage.toString()
      });

      setArchitectures(result.data || []);
      setTotalItems(result.total || 0);

      // Update search suggestions based on results
      if (result.suggestions) {
        setSuggestions(result.suggestions);
      }

    } catch (error) {
      console.error('Failed to fetch architectures:', error);
      setNotification('データの取得に失敗しました');
      
      // If offline, try to load from cache
      if (!isOnline) {
        setNotification('オフラインモードで表示しています');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, currentPage, itemsPerPage, isOnline]);

  // Initialize data
  useEffect(() => {
    fetchArchitectures();
  }, [fetchArchitectures]);

  // Handle search
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
    setShowSearch(false);

    // Add to search history
    if (query.trim()) {
      const newHistory = [query, ...searchHistory.filter(h => h !== query)].slice(0, 10);
      setSearchHistory(newHistory);
    }
  }, [searchHistory, setSearchHistory]);

  // Handle suggestion selection
  const handleSuggestionSelect = useCallback((suggestion: SearchSuggestion) => {
    handleSearch(suggestion.text);
  }, [handleSearch]);

  // Handle favorite toggle
  const handleFavorite = useCallback((architectureId: string) => {
    const newFavorites = favorites.includes(architectureId)
      ? favorites.filter(id => id !== architectureId)
      : [...favorites, architectureId];
    
    setFavorites(newFavorites);
    
    const isFavorited = newFavorites.includes(architectureId);
    setNotification(isFavorited ? 'お気に入りに追加しました' : 'お気に入りから削除しました');
    
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate([30]);
    }
  }, [favorites, setFavorites]);

  // Handle share
  const handleShare = useCallback(async (architecture: Architecture) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: architecture.name,
          text: `${architecture.architect}による${architecture.name}`,
          url: window.location.origin + `/architecture/${architecture.id}`
        });
      } catch (error) {
        console.log('Share cancelled or failed');
      }
    } else {
      // Fallback: copy to clipboard
      const shareText = `${architecture.name} by ${architecture.architect} - ${window.location.origin}/architecture/${architecture.id}`;
      navigator.clipboard?.writeText(shareText);
      setNotification('リンクをコピーしました');
    }
  }, []);

  // Handle architecture card click
  const handleArchitectureClick = useCallback((architecture: Architecture) => {
    const index = architectures.findIndex(a => a.id === architecture.id);
    setSelectedArchitecture(architecture);
    setCurrentArchitectureIndex(index);
    setShowViewer(true);
  }, [architectures]);

  // Navigation between architectures in viewer
  const handleNext = useCallback(() => {
    if (currentArchitectureIndex < architectures.length - 1) {
      const nextIndex = currentArchitectureIndex + 1;
      setCurrentArchitectureIndex(nextIndex);
      setSelectedArchitecture(architectures[nextIndex]);
    }
  }, [currentArchitectureIndex, architectures]);

  const handlePrevious = useCallback(() => {
    if (currentArchitectureIndex > 0) {
      const prevIndex = currentArchitectureIndex - 1;
      setCurrentArchitectureIndex(prevIndex);
      setSelectedArchitecture(architectures[prevIndex]);
    }
  }, [currentArchitectureIndex, architectures]);

  // View mode toggle
  const handleViewModeChange = useCallback((mode: 'grid' | 'map') => {
    setViewMode(mode);
    setViewPreference(mode);
  }, [setViewPreference]);

  // Performance monitoring
  useEffect(() => {
    MobilePerformanceMonitor.recordMetric('page-view', 1, {
      page: 'architecture-list',
      viewMode,
      isMobile: viewport.isMobile.toString()
    });
  }, [viewMode, viewport.isMobile]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: theme.palette.background.default,
        position: 'relative'
      }}
      {...swipeHandlers}
    >
      {/* Pull to refresh indicator */}
      {isPulling && (
        <LinearProgress
          variant="determinate"
          value={pullProgress * 100}
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
            height: 4
          }}
        />
      )}

      {/* Loading backdrop */}
      <Backdrop open={loading && !refreshing} sx={{ zIndex: 1000 }}>
        <CircularProgress color="primary" />
      </Backdrop>

      {/* Main content */}
      <Container
        maxWidth="lg"
        sx={{ py: 2, px: viewport.isMobile ? 1 : 2 }}
        {...pullRefreshHandlers}
      >
        {/* Header */}
        <Box sx={{ mb: 3, textAlign: 'center' }}>
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontWeight: 'bold',
              mb: 1,
              fontSize: viewport.isMobile ? '1.75rem' : '2.5rem'
            }}
          >
            日本の建築作品
          </Typography>
          
          {totalItems > 0 && (
            <Typography variant="body2" color="text.secondary">
              {searchQuery ? `"${searchQuery}"の検索結果: ` : ''}
              {totalItems.toLocaleString()}件の建築作品
            </Typography>
          )}
        </Box>

        {/* Architecture grid */}
        <Grid container spacing={viewport.isMobile ? 2 : 3}>
          {architectures.map((architecture, index) => (
            <Grid
              key={architecture.id}
              item
              xs={12}
              sm={6}
              md={4}
              lg={3}
            >
              <MobileArchitectureCard
                architecture={architecture}
                onFavorite={handleFavorite}
                onShare={handleShare}
                isFavorited={favorites.includes(architecture.id)}
                enableSwipeGestures={true}
                compact={viewport.isMobile}
                onClick={() => handleArchitectureClick(architecture)}
              />
            </Grid>
          ))}
        </Grid>

        {/* Empty state */}
        {architectures.length === 0 && !loading && (
          <Box
            sx={{
              textAlign: 'center',
              py: 8,
              px: 2
            }}
          >
            <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
              {searchQuery ? '検索結果が見つかりません' : '建築作品がありません'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {searchQuery ? '別のキーワードでお試しください' : 'データを読み込み中です'}
            </Typography>
          </Box>
        )}
      </Container>

      {/* Floating action buttons */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          zIndex: 100
        }}
      >
        {/* Search FAB */}
        <Fab
          color="primary"
          onClick={() => setShowSearch(true)}
          sx={{
            boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`
          }}
        >
          <SearchIcon />
        </Fab>

        {/* Refresh FAB (when offline or pull-to-refresh not available) */}
        {(!isOnline || !viewport.isMobile) && (
          <Fab
            size="small"
            onClick={() => fetchArchitectures(true)}
            disabled={refreshing}
            sx={{
              backgroundColor: alpha(theme.palette.background.paper, 0.9),
              '&:hover': {
                backgroundColor: theme.palette.background.paper
              }
            }}
          >
            <RefreshIcon />
          </Fab>
        )}
      </Box>

      {/* Search interface */}
      <MobileSearchInterface
        isOpen={showSearch}
        onClose={() => setShowSearch(false)}
        onSearch={handleSearch}
        onSuggestionSelect={handleSuggestionSelect}
        suggestions={suggestions}
        loading={loading}
        recentSearches={searchHistory}
        enableVoiceSearch={true}
        enableFilters={true}
      />

      {/* Architecture viewer */}
      {selectedArchitecture && (
        <MobileArchitectureViewer
          architecture={selectedArchitecture}
          architectures={architectures}
          currentIndex={currentArchitectureIndex}
          isOpen={showViewer}
          onClose={() => {
            setShowViewer(false);
            setSelectedArchitecture(null);
          }}
          onNext={handleNext}
          onPrevious={handlePrevious}
          onFavorite={handleFavorite}
          onShare={handleShare}
          isFavorited={favorites.includes(selectedArchitecture.id)}
          showNavigation={true}
        />
      )}

      {/* Notification snackbar */}
      <Snackbar
        open={!!notification}
        autoHideDuration={3000}
        onClose={() => setNotification(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity="success"
          variant="filled"
          onClose={() => setNotification(null)}
          sx={{ width: '100%' }}
        >
          {notification}
        </Alert>
      </Snackbar>

      {/* Offline indicator */}
      {!isOnline && (
        <Alert
          severity="warning"
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1001,
            borderRadius: 0
          }}
        >
          オフライン状態です。キャッシュされたコンテンツを表示しています。
        </Alert>
      )}
    </Box>
  );
};

export default MobileArchitecturePage;