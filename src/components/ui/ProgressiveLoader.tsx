/**
 * ProgressiveLoader - Intelligent progressive loading component
 * Provides smooth infinite scrolling with performance optimization
 */

import React, { 
  useState, 
  useEffect, 
  useCallback, 
  useRef, 
  useMemo,
  forwardRef,
  useImperativeHandle
} from 'react';
import {
  Box,
  CircularProgress,
  Typography,
  Button,
  Alert,
  Skeleton,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { RefreshIcon, ErrorIcon } from '@mui/icons-material';

export interface ProgressiveLoaderProps<T> {
  loadInitial: () => Promise<T[]>;
  loadMore: (offset: number, limit: number) => Promise<T[]>;
  renderItem: (item: T, index: number) => React.ReactNode;
  renderSkeleton?: (index: number) => React.ReactNode;
  keyExtractor?: (item: T, index: number) => string | number;
  threshold?: number; // Intersection threshold (0-1)
  batchSize?: number; // Items per batch
  maxItems?: number; // Maximum items to load
  preloadBatches?: number; // Number of batches to preload
  enableVirtualization?: boolean; // Enable virtual scrolling for large lists
  onError?: (error: Error) => void;
  onLoadComplete?: (totalItems: number) => void;
  onItemClick?: (item: T, index: number) => void;
  loadingText?: string;
  noMoreText?: string;
  errorText?: string;
  retryText?: string;
  className?: string;
  containerHeight?: number; // For virtualization
  itemHeight?: number; // For virtualization
  gap?: number; // Gap between items
}

export interface ProgressiveLoaderRef {
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  scrollToTop: () => void;
  scrollToItem: (index: number) => void;
  getLoadedItems: () => any[];
}

type LoadingState = 'idle' | 'loading' | 'loading-more' | 'complete' | 'error';

interface VirtualItem {
  index: number;
  offsetTop: number;
  height: number;
}

const ProgressiveLoader = <T,>(
  props: ProgressiveLoaderProps<T>,
  ref?: React.Ref<ProgressiveLoaderRef>
) => {
  const {
    loadInitial,
    loadMore,
    renderItem,
    renderSkeleton,
    keyExtractor = (_, index) => index,
    threshold = 0.8,
    batchSize = 20,
    maxItems = 1000,
    preloadBatches = 1,
    enableVirtualization = false,
    onError,
    onLoadComplete,
    onItemClick,
    loadingText = "読み込み中...",
    noMoreText = "すべて読み込みました",
    errorText = "読み込みエラーが発生しました",
    retryText = "再試行",
    className,
    containerHeight = 600,
    itemHeight = 100,
    gap = 8
  } = props;
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // State management
  const [items, setItems] = useState<T[]>([]);
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentOffset, setCurrentOffset] = useState(0);
  
  // Virtualization state
  const [scrollTop, setScrollTop] = useState(0);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 0 });
  
  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);
  const retryCountRef = useRef(0);
  const maxRetries = 3;
  
  // Performance optimization: memoize virtual items
  const virtualItems = useMemo((): VirtualItem[] => {
    if (!enableVirtualization) return [];
    
    return items.map((_, index) => ({
      index,
      offsetTop: index * (itemHeight + gap),
      height: itemHeight
    }));
  }, [items.length, itemHeight, gap, enableVirtualization]);
  
  // Calculate visible items for virtualization
  const visibleItems = useMemo(() => {
    if (!enableVirtualization) return items;
    
    const containerViewHeight = containerHeight;
    const startIndex = Math.floor(scrollTop / (itemHeight + gap));
    const endIndex = Math.min(
      items.length - 1,
      Math.floor((scrollTop + containerViewHeight) / (itemHeight + gap)) + 1
    );
    
    return items.slice(
      Math.max(0, startIndex - preloadBatches * batchSize),
      Math.min(items.length, endIndex + preloadBatches * batchSize)
    );
  }, [
    items,
    scrollTop,
    containerHeight,
    itemHeight,
    gap,
    enableVirtualization,
    preloadBatches,
    batchSize
  ]);
  
  // Load initial data
  const loadInitialData = useCallback(async () => {
    if (loadingRef.current) return;
    
    setLoadingState('loading');
    setError(null);
    loadingRef.current = true;
    
    try {
      const initialItems = await loadInitial();
      setItems(initialItems);
      setCurrentOffset(initialItems.length);
      setHasMore(initialItems.length >= batchSize);
      setLoadingState('idle');
      retryCountRef.current = 0;
      
      if (initialItems.length < batchSize) {
        setLoadingState('complete');
        onLoadComplete?.(initialItems.length);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load data');
      setError(error);
      setLoadingState('error');
      onError?.(error);
    } finally {
      loadingRef.current = false;
    }
  }, [loadInitial, batchSize, onError, onLoadComplete]);
  
  // Load more data
  const loadMoreData = useCallback(async () => {
    if (
      loadingRef.current || 
      !hasMore || 
      loadingState === 'complete' ||
      items.length >= maxItems
    ) {
      return;
    }
    
    setLoadingState('loading-more');
    loadingRef.current = true;
    
    try {
      const moreItems = await loadMore(currentOffset, batchSize);
      
      if (moreItems.length === 0) {
        setHasMore(false);
        setLoadingState('complete');
        onLoadComplete?.(items.length);
      } else {
        setItems(prev => [...prev, ...moreItems]);
        setCurrentOffset(prev => prev + moreItems.length);
        setLoadingState('idle');
        
        if (moreItems.length < batchSize || items.length + moreItems.length >= maxItems) {
          setHasMore(false);
          setLoadingState('complete');
          onLoadComplete?.(items.length + moreItems.length);
        }
      }
      
      retryCountRef.current = 0;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load more data');
      setError(error);
      setLoadingState('error');
      onError?.(error);
    } finally {
      loadingRef.current = false;
    }
  }, [
    hasMore,
    loadingState,
    items.length,
    maxItems,
    loadMore,
    currentOffset,
    batchSize,
    onLoadComplete,
    onError
  ]);
  
  // Retry loading with exponential backoff
  const retryLoad = useCallback(async () => {
    if (retryCountRef.current >= maxRetries) {
      setLoadingState('error');
      return;
    }
    
    retryCountRef.current++;
    const delay = Math.pow(2, retryCountRef.current) * 1000; // Exponential backoff
    
    setTimeout(() => {
      if (items.length === 0) {
        loadInitialData();
      } else {
        loadMoreData();
      }
    }, delay);
  }, [items.length, loadInitialData, loadMoreData]);
  
  // Refresh data
  const refresh = useCallback(async () => {
    setItems([]);
    setCurrentOffset(0);
    setHasMore(true);
    setError(null);
    retryCountRef.current = 0;
    await loadInitialData();
  }, [loadInitialData]);
  
  // Scroll handlers for virtualization
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    if (!enableVirtualization) return;
    
    const scrollTop = event.currentTarget.scrollTop;
    setScrollTop(scrollTop);
    
    const startIndex = Math.floor(scrollTop / (itemHeight + gap));
    const endIndex = Math.min(
      items.length - 1,
      Math.floor((scrollTop + containerHeight) / (itemHeight + gap)) + 1
    );
    
    setVisibleRange({ start: startIndex, end: endIndex });
  }, [enableVirtualization, itemHeight, gap, containerHeight, items.length]);
  
  // Intersection Observer setup
  useEffect(() => {
    if (!triggerRef.current || enableVirtualization) return;
    
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && loadingState === 'idle') {
          loadMoreData();
        }
      },
      {
        rootMargin: `${threshold * 100}px`,
        threshold: 0.1
      }
    );
    
    observerRef.current.observe(triggerRef.current);
    
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, loadingState, loadMoreData, threshold, enableVirtualization]);
  
  // Scroll-based loading for virtualization
  useEffect(() => {
    if (!enableVirtualization || !containerRef.current) return;
    
    const container = containerRef.current;
    const handleVirtualScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;
      
      if (scrollPercentage > threshold && hasMore && loadingState === 'idle') {
        loadMoreData();
      }
    };
    
    container.addEventListener('scroll', handleVirtualScroll);
    return () => container.removeEventListener('scroll', handleVirtualScroll);
  }, [enableVirtualization, threshold, hasMore, loadingState, loadMoreData]);
  
  // Initialize data
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);
  
  // Scroll utilities
  const scrollToTop = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);
  
  const scrollToItem = useCallback((index: number) => {
    if (!containerRef.current || !enableVirtualization) return;
    
    const offsetTop = index * (itemHeight + gap);
    containerRef.current.scrollTo({ top: offsetTop, behavior: 'smooth' });
  }, [enableVirtualization, itemHeight, gap]);
  
  // Imperative API
  useImperativeHandle(ref, () => ({
    refresh,
    loadMore: loadMoreData,
    scrollToTop,
    scrollToItem,
    getLoadedItems: () => items
  }), [refresh, loadMoreData, scrollToTop, scrollToItem, items]);
  
  // Render skeleton items
  const renderSkeletonItems = () => {
    const skeletonCount = Math.min(batchSize, 6);
    return Array.from({ length: skeletonCount }, (_, index) => (
      <Box key={`skeleton-${index}`} sx={{ mb: gap / 8 }}>
        {renderSkeleton ? (
          renderSkeleton(index)
        ) : (
          <Skeleton
            variant="rectangular"
            height={isMobile ? 120 : itemHeight}
            sx={{ borderRadius: 2 }}
          />
        )}
      </Box>
    ));
  };
  
  // Render error state
  const renderError = () => (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        py: 4
      }}
    >
      <Alert
        severity="error"
        action={
          <Button
            color="inherit"
            size="small"
            onClick={retryLoad}
            startIcon={<RefreshIcon />}
          >
            {retryText}
          </Button>
        }
      >
        {errorText}
      </Alert>
    </Box>
  );
  
  // Render loading indicator
  const renderLoading = () => (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 2,
        py: 2
      }}
    >
      <CircularProgress size={24} />
      <Typography variant="body2" color="text.secondary">
        {loadingState === 'loading-more' ? '追加読み込み中...' : loadingText}
      </Typography>
    </Box>
  );
  
  // Render complete indicator
  const renderComplete = () => (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        py: 2
      }}
    >
      <Typography variant="body2" color="text.secondary">
        {noMoreText}
      </Typography>
    </Box>
  );
  
  // Main render
  return (
    <Box
      ref={containerRef}
      className={className}
      sx={{
        width: '100%',
        height: enableVirtualization ? containerHeight : 'auto',
        overflow: enableVirtualization ? 'auto' : 'visible'
      }}
      onScroll={enableVirtualization ? handleScroll : undefined}
    >
      {/* Virtual scrolling container */}
      {enableVirtualization && (
        <Box
          sx={{
            position: 'relative',
            height: virtualItems.length * (itemHeight + gap)
          }}
        >
          {visibleItems.map((item, index) => {
            const actualIndex = items.indexOf(item);
            const virtualItem = virtualItems[actualIndex];
            
            return (
              <Box
                key={keyExtractor(item, actualIndex)}
                sx={{
                  position: 'absolute',
                  top: virtualItem?.offsetTop || 0,
                  left: 0,
                  right: 0,
                  height: itemHeight
                }}
                onClick={() => onItemClick?.(item, actualIndex)}
              >
                {renderItem(item, actualIndex)}
              </Box>
            );
          })}
        </Box>
      )}
      
      {/* Standard scrolling */}
      {!enableVirtualization && (
        <Box>
          {loadingState === 'loading' && renderSkeletonItems()}
          
          {items.map((item, index) => (
            <Box
              key={keyExtractor(item, index)}
              sx={{ mb: gap / 8 }}
              onClick={() => onItemClick?.(item, index)}
            >
              {renderItem(item, index)}
            </Box>
          ))}
          
          {/* Intersection observer trigger */}
          {hasMore && loadingState !== 'error' && (
            <div ref={triggerRef} style={{ height: 1, margin: 0 }} />
          )}
        </Box>
      )}
      
      {/* Status indicators */}
      {loadingState === 'loading-more' && renderLoading()}
      {loadingState === 'error' && renderError()}
      {loadingState === 'complete' && items.length > 0 && renderComplete()}
    </Box>
  );
};

export default forwardRef(ProgressiveLoader) as <T>(
  props: ProgressiveLoaderProps<T> & { ref?: React.Ref<ProgressiveLoaderRef> }
) => React.ReactElement;