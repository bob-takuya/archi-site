import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Box, Typography } from '@mui/material';

interface VirtualizedListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number; // Number of items to render outside visible area
  onScroll?: (scrollTop: number) => void;
  onEndReached?: () => void;
  endReachedThreshold?: number; // Pixels from bottom to trigger onEndReached
  loading?: boolean;
  loadingComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
  className?: string;
}

/**
 * High-performance virtualized list component
 * Only renders visible items + overscan for smooth scrolling
 * Supports infinite scrolling and dynamic loading
 */
export function VirtualizedList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 5,
  onScroll,
  onEndReached,
  endReachedThreshold = 200,
  loading = false,
  loadingComponent,
  emptyComponent,
  className,
}: VirtualizedListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastScrollTop = useRef(0);
  const endReachedCalled = useRef(false);

  // Calculate visible range
  const visibleRange = useMemo(() => {
    const visibleStart = Math.floor(scrollTop / itemHeight);
    const visibleEnd = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight)
    );

    // Add overscan
    const start = Math.max(0, visibleStart - overscan);
    const end = Math.min(items.length - 1, visibleEnd + overscan);

    return { start, end };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  // Calculate total height
  const totalHeight = items.length * itemHeight;

  // Handle scroll events
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const newScrollTop = target.scrollTop;
    
    setScrollTop(newScrollTop);
    onScroll?.(newScrollTop);

    // Check if we need to load more items
    if (onEndReached && !loading) {
      const scrollBottom = newScrollTop + containerHeight;
      const shouldLoadMore = totalHeight - scrollBottom <= endReachedThreshold;
      
      // Only call once when reaching the threshold
      if (shouldLoadMore && !endReachedCalled.current) {
        endReachedCalled.current = true;
        onEndReached();
      } else if (!shouldLoadMore) {
        endReachedCalled.current = false;
      }
    }

    lastScrollTop.current = newScrollTop;
  }, [onScroll, onEndReached, loading, containerHeight, totalHeight, endReachedThreshold]);

  // Render visible items
  const renderVisibleItems = useMemo(() => {
    const visibleItems = [];
    
    for (let i = visibleRange.start; i <= visibleRange.end; i++) {
      const item = items[i];
      if (!item) continue;

      const top = i * itemHeight;
      
      visibleItems.push(
        <div
          key={i}
          style={{
            position: 'absolute',
            top,
            left: 0,
            right: 0,
            height: itemHeight,
            // Performance optimization: contain layout and style
            contain: 'layout style',
          }}
        >
          {renderItem(item, i)}
        </div>
      );
    }

    return visibleItems;
  }, [visibleRange, items, itemHeight, renderItem]);

  // Optimize scroll performance with throttling
  const throttledScrollHandler = useCallback(
    throttle(handleScroll, 16), // ~60fps
    [handleScroll]
  );

  // Show empty state
  if (items.length === 0 && !loading) {
    return (
      <Box 
        className={className}
        sx={{ 
          height: containerHeight, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}
      >
        {emptyComponent || (
          <Typography color="text.secondary">
            項目がありません
          </Typography>
        )}
      </Box>
    );
  }

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        height: containerHeight,
        overflow: 'auto',
        // Performance optimizations
        willChange: 'scroll-position',
        contain: 'strict',
        // Smooth scrolling on supported browsers
        scrollBehavior: 'smooth',
      }}
      onScroll={throttledScrollHandler}
    >
      {/* Virtual container with full height */}
      <div
        style={{
          height: totalHeight,
          position: 'relative',
          // Performance optimization: promote to GPU layer
          transform: 'translateZ(0)',
        }}
      >
        {renderVisibleItems}
        
        {/* Loading indicator at the bottom */}
        {loading && (
          <div
            style={{
              position: 'absolute',
              top: totalHeight,
              left: 0,
              right: 0,
              height: 60,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {loadingComponent || (
              <Typography color="text.secondary">
                読み込み中...
              </Typography>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Simple throttle function for scroll performance
 */
function throttle<T extends (...args: any[]) => void>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastExecTime = 0;
  
  return (...args: Parameters<T>) => {
    const currentTime = Date.now();
    
    if (currentTime - lastExecTime > delay) {
      func(...args);
      lastExecTime = currentTime;
    } else {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      timeoutId = setTimeout(() => {
        func(...args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  };
}

export default VirtualizedList;