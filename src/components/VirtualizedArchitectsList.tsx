/**
 * Virtualized Architects List - SOW Phase 2 Performance Optimization
 * Implements virtual scrolling for 1000+ architects with 60fps performance
 */

import React, { memo, useCallback, useMemo, useRef, useEffect } from 'react';
import { FixedSizeList as List, areEqual } from 'react-window';
import {
  Card,
  CardContent,
  CardActionArea,
  Typography,
  Box,
  Chip,
  Grid,
  Container,
  useTheme,
  useMediaQuery,
  Skeleton
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import type { Architect } from '../types/architect';

interface VirtualizedArchitectsListProps {
  architects: Architect[];
  height: number;
  width?: number;
  onItemClick?: (architect: Architect) => void;
  loading?: boolean;
  loadingCount?: number;
}

// Memoized architect card component for optimal rendering performance
const ArchitectCard = memo<{
  architect: Architect;
  style: React.CSSProperties;
  onItemClick?: (architect: Architect) => void;
}>(({ architect, style, onItemClick }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const handleClick = useCallback(() => {
    onItemClick?.(architect);
  }, [architect, onItemClick]);

  const formattedLifespan = useMemo(() => {
    const birth = architect.ZAT_BIRTHYEAR || '?';
    const death = architect.ZAT_DEATHYEAR || '現在';
    return `${birth}-${death}`;
  }, [architect.ZAT_BIRTHYEAR, architect.ZAT_DEATHYEAR]);

  const tags = useMemo(() => {
    const tags = [];
    if (architect.ZAT_NATIONALITY) tags.push(architect.ZAT_NATIONALITY);
    if (architect.ZAT_CATEGORY) tags.push(architect.ZAT_CATEGORY);
    return tags.slice(0, 3); // Limit to 3 tags for performance
  }, [architect.ZAT_NATIONALITY, architect.ZAT_CATEGORY]);

  return (
    <div style={style}>
      <Box sx={{ p: 1 }}>
        <Card 
          sx={{ 
            height: isMobile ? 140 : 160,
            display: 'flex', 
            flexDirection: 'column',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            willChange: 'transform, box-shadow',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: theme.shadows[8],
            },
          }}
          elevation={2}
        >
          <CardActionArea 
            component={RouterLink} 
            to={`/architects/${architect.ZAT_ID || architect.Z_PK}`}
            onClick={handleClick}
            sx={{ 
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'stretch',
            }}
          >
            <CardContent sx={{ flexGrow: 1, p: isMobile ? 1.5 : 2 }}>
              <Typography 
                variant={isMobile ? "subtitle1" : "h6"} 
                component="div" 
                gutterBottom
                sx={{
                  fontWeight: 600,
                  lineHeight: 1.2,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {architect.ZAT_ARCHITECT}
              </Typography>
              
              <Typography 
                variant="body2" 
                color="text.secondary" 
                gutterBottom
                sx={{
                  fontSize: isMobile ? '0.75rem' : '0.875rem',
                  lineHeight: 1.3,
                }}
              >
                {architect.ZAT_NATIONALITY || '不明'} • {formattedLifespan}
              </Typography>
              
              {tags.length > 0 && (
                <Box sx={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: 0.5, 
                  mt: 1,
                  minHeight: 24, // Prevent layout shift
                }}>
                  {tags.map((tag, index) => (
                    <Chip
                      key={`${tag}-${index}`}
                      label={tag}
                      size="small"
                      variant="outlined"
                      sx={{ 
                        fontSize: '0.75rem',
                        height: 20,
                        maxWidth: 120,
                        '& .MuiChip-label': {
                          px: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }
                      }}
                    />
                  ))}
                </Box>
              )}
            </CardContent>
          </CardActionArea>
        </Card>
      </Box>
    </div>
  );
}, areEqual);

ArchitectCard.displayName = 'ArchitectCard';

// Loading skeleton component
const ArchitectSkeleton = memo<{ style: React.CSSProperties }>(({ style }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  return (
    <div style={style}>
      <Box sx={{ p: 1 }}>
        <Card sx={{ height: isMobile ? 140 : 160, p: isMobile ? 1.5 : 2 }}>
          <Skeleton variant="text" width="80%" height={24} />
          <Skeleton variant="text" width="60%" height={20} sx={{ mt: 1 }} />
          <Box sx={{ display: 'flex', gap: 0.5, mt: 1 }}>
            <Skeleton variant="rounded" width={60} height={20} />
            <Skeleton variant="rounded" width={80} height={20} />
          </Box>
        </Card>
      </Box>
    </div>
  );
});

ArchitectSkeleton.displayName = 'ArchitectSkeleton';

// Grid row component that handles multiple columns
const GridRow = memo<{
  index: number;
  style: React.CSSProperties;
  data: {
    architects: Architect[];
    columnsPerRow: number;
    onItemClick?: (architect: Architect) => void;
    loading: boolean;
    loadingCount: number;
  };
}>(({ index, style, data }) => {
  const { architects, columnsPerRow, onItemClick, loading, loadingCount } = data;
  const startIndex = index * columnsPerRow;
  
  const rowItems = useMemo(() => {
    const items = [];
    for (let i = 0; i < columnsPerRow; i++) {
      const architectIndex = startIndex + i;
      
      if (loading && architectIndex < loadingCount) {
        items.push(
          <Grid item xs={12 / columnsPerRow} key={`skeleton-${architectIndex}`}>
            <ArchitectSkeleton style={{}} />
          </Grid>
        );
      } else if (architectIndex < architects.length) {
        const architect = architects[architectIndex];
        items.push(
          <Grid item xs={12 / columnsPerRow} key={architect.ZAT_ID || architect.Z_PK || architectIndex}>
            <ArchitectCard
              architect={architect}
              style={{}}
              onItemClick={onItemClick}
            />
          </Grid>
        );
      }
    }
    return items;
  }, [architects, columnsPerRow, startIndex, onItemClick, loading, loadingCount]);
  
  return (
    <div style={style}>
      <Grid container spacing={0}>
        {rowItems}
      </Grid>
    </div>
  );
}, areEqual);

GridRow.displayName = 'GridRow';

const VirtualizedArchitectsList: React.FC<VirtualizedArchitectsListProps> = ({
  architects,
  height,
  width,
  onItemClick,
  loading = false,
  loadingCount = 10
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  const listRef = useRef<List>(null);

  // Calculate columns per row based on screen size
  const columnsPerRow = useMemo(() => {
    if (isMobile) return 1;
    if (isTablet) return 2;
    return 3;
  }, [isMobile, isTablet]);

  // Calculate item height based on screen size
  const itemHeight = useMemo(() => {
    return isMobile ? 150 : 170;
  }, [isMobile]);

  // Calculate total rows needed
  const totalRows = useMemo(() => {
    const totalItems = loading ? loadingCount : architects.length;
    return Math.ceil(totalItems / columnsPerRow);
  }, [architects.length, columnsPerRow, loading, loadingCount]);

  // Memoized data for the virtual list
  const listData = useMemo(() => ({
    architects,
    columnsPerRow,
    onItemClick,
    loading,
    loadingCount
  }), [architects, columnsPerRow, onItemClick, loading, loadingCount]);

  // Calculate optimal overscan count for smooth scrolling
  const overscanCount = useMemo(() => {
    return Math.max(2, Math.ceil(height / itemHeight / 4));
  }, [height, itemHeight]);

  // Auto-scroll to top when architects change
  useEffect(() => {
    if (listRef.current && !loading) {
      listRef.current.scrollToItem(0, 'start');
    }
  }, [architects, loading]);

  if (loading && loadingCount === 0) {
    return (
      <Container maxWidth="lg">
        <Grid container spacing={2}>
          {Array.from({ length: 6 }).map((_, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <ArchitectSkeleton style={{}} />
            </Grid>
          ))}
        </Grid>
      </Container>
    );
  }

  return (
    <List
      ref={listRef}
      height={height}
      width={width || '100%'}
      itemCount={totalRows}
      itemSize={itemHeight}
      itemData={listData}
      overscanCount={overscanCount}
      style={{
        outline: 'none',
      }}
    >
      {GridRow}
    </List>
  );
};

export default memo(VirtualizedArchitectsList);
export { ArchitectCard, ArchitectSkeleton };