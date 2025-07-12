/**
 * Enhanced Architecture Card with Progressive Image Loading - SOW Phase 2
 * Implements optimized image loading for building images with performance monitoring
 */

import React, { memo, useCallback, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardActionArea,
  Typography,
  Box,
  Chip,
  useTheme,
  alpha,
  Fade
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import EventIcon from '@mui/icons-material/Event';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CategoryIcon from '@mui/icons-material/Category';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import SpeedIcon from '@mui/icons-material/Speed';

import EnhancedProgressiveImage, { LoadingMetrics } from './EnhancedProgressiveImage';
import { generateBlurPlaceholder } from '../utils/imageOptimization';

interface ArchitectureCardProps {
  architecture: {
    id: number;
    name?: string;
    title?: string;
    architect?: string;
    completedYear?: number;
    year?: number;
    city?: string;
    location?: string;
    address?: string;
    category?: string;
    tag?: string;
    tags?: string;
    // Image fields from database schema
    ZAR_IMAGE_URL?: string;
    imageUrl?: string;
  };
  compact?: boolean;
  showImage?: boolean;
  imageHeight?: number;
  enableImageZoom?: boolean;
  enablePerformanceMonitoring?: boolean;
  onClick?: (architecture: ArchitectureCardProps['architecture']) => void;
  onImageLoad?: (metrics: LoadingMetrics) => void;
}

/**
 * Enhanced Architecture Card with progressive image loading
 * Features:
 * - Progressive image loading with blur placeholders
 * - WebP support with JPEG fallbacks
 * - Performance monitoring and metrics
 * - Mobile-optimized loading strategies
 * - Lazy loading for off-screen images
 */
const EnhancedArchitectureCard = memo<ArchitectureCardProps>(({ 
  architecture, 
  compact = false,
  showImage = true,
  imageHeight = 200,
  enableImageZoom = false,
  enablePerformanceMonitoring = true,
  onClick,
  onImageLoad
}) => {
  const theme = useTheme();
  const [loadingMetrics, setLoadingMetrics] = useState<LoadingMetrics | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Extract display values
  const title = architecture.title || architecture.name || 'Unknown';
  const year = architecture.year || architecture.completedYear;
  const location = architecture.address || architecture.city || architecture.location;
  const tags = architecture.tags || architecture.tag;
  const imageUrl = architecture.ZAR_IMAGE_URL || architecture.imageUrl;

  // Handle card click
  const handleClick = useCallback(() => {
    if (onClick) {
      onClick(architecture);
    }
  }, [onClick, architecture]);

  // Handle image load with performance tracking
  const handleImageLoad = useCallback((metrics: LoadingMetrics) => {
    setLoadingMetrics(metrics);
    setImageLoaded(true);
    onImageLoad?.(metrics);
    
    // Log performance metrics for analysis
    if (enablePerformanceMonitoring) {
      console.log(`Image loaded for architecture ${architecture.id}:`, {
        totalTime: metrics.totalLoadTime,
        perceivedImprovement: metrics.perceivedImprovement,
        connectionType: metrics.connectionType,
        imageSize: metrics.imageSize
      });
    }
  }, [onImageLoad, enablePerformanceMonitoring, architecture.id]);

  // Generate blur placeholder for the image
  const blurPlaceholder = imageUrl ? generateBlurPlaceholder(imageUrl) : undefined;

  return (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[8],
        },
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Performance indicator */}
      {enablePerformanceMonitoring && loadingMetrics && loadingMetrics.perceivedImprovement > 30 && (
        <Fade in={imageLoaded}>
          <Box
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              zIndex: 10,
              backgroundColor: alpha(theme.palette.success.main, 0.9),
              color: 'white',
              padding: '2px 6px',
              borderRadius: 1,
              fontSize: '0.7rem',
              display: 'flex',
              alignItems: 'center',
              gap: 0.5
            }}
          >
            <SpeedIcon sx={{ fontSize: 12 }} />
            +{Math.round(loadingMetrics.perceivedImprovement)}%
          </Box>
        </Fade>
      )}

      <CardActionArea 
        component={RouterLink} 
        to={`/architecture/${architecture.id}`}
        sx={{ flexGrow: 1, height: '100%', display: 'flex', flexDirection: 'column' }}
        onClick={handleClick}
      >
        {/* Progressive Image Section */}
        {showImage && imageUrl && (
          <Box sx={{ position: 'relative', overflow: 'hidden' }}>
            <EnhancedProgressiveImage
              src={imageUrl}
              alt={`${title} - 建築写真`}
              width="100%"
              height={compact ? imageHeight * 0.75 : imageHeight}
              blurDataUrl={blurPlaceholder}
              loading="lazy"
              priority={false}
              objectFit="cover"
              borderRadius={0}
              enableZoom={enableImageZoom}
              enableFullscreen={false}
              enablePerformanceMonitoring={enablePerformanceMonitoring}
              optimizeForMobile={true}
              onLoad={handleImageLoad}
              onError={() => console.warn(`Failed to load image for architecture ${architecture.id}`)}
              sizes="(max-width: 600px) 100vw, (max-width: 960px) 50vw, 33vw"
              style={{
                transition: 'transform 0.3s ease-in-out',
              }}
            />
            
            {/* Gradient overlay for better text readability */}
            <Box
              sx={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '50%',
                background: `linear-gradient(transparent, ${alpha(theme.palette.common.black, 0.3)})`,
                pointerEvents: 'none'
              }}
            />
          </Box>
        )}

        {/* Content Section */}
        <CardContent 
          sx={{ 
            flexGrow: 1, 
            display: 'flex', 
            flexDirection: 'column',
            p: compact ? 2 : 3,
            '&:last-child': { pb: compact ? 2 : 3 }
          }}
        >
          {/* Title */}
          <Typography 
            gutterBottom 
            variant={compact ? "subtitle1" : "h6"} 
            component="h2"
            sx={{ 
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              mb: compact ? 1 : 1.5,
              fontWeight: 600,
              lineHeight: 1.3
            }}
          >
            {title}
          </Typography>
          
          {/* Architecture Details */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: compact ? 0.5 : 0.75, flexGrow: 1 }}>
            {/* Architect */}
            {architecture.architect && (
              <Box sx={{ display: 'flex', alignItems: 'center', minHeight: 24 }}>
                <PersonIcon 
                  fontSize="small" 
                  sx={{ 
                    mr: 1, 
                    color: 'text.secondary',
                    fontSize: compact ? '16px' : '18px'
                  }} 
                />
                <Typography 
                  variant={compact ? "body2" : "body2"} 
                  color="text.secondary" 
                  noWrap
                  sx={{ fontWeight: 500 }}
                >
                  {architecture.architect}
                </Typography>
              </Box>
            )}
            
            {/* Year */}
            {year && year > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', minHeight: 24 }}>
                <EventIcon 
                  fontSize="small" 
                  sx={{ 
                    mr: 1, 
                    color: 'text.secondary',
                    fontSize: compact ? '16px' : '18px'
                  }} 
                />
                <Typography 
                  variant={compact ? "body2" : "body2"} 
                  color="text.secondary"
                >
                  {year}年
                </Typography>
              </Box>
            )}
            
            {/* Location */}
            {location && (
              <Box sx={{ display: 'flex', alignItems: 'center', minHeight: 24 }}>
                <LocationOnIcon 
                  fontSize="small" 
                  sx={{ 
                    mr: 1, 
                    color: 'text.secondary',
                    fontSize: compact ? '16px' : '18px'
                  }} 
                />
                <Typography 
                  variant={compact ? "body2" : "body2"} 
                  color="text.secondary" 
                  noWrap
                >
                  {location}
                </Typography>
              </Box>
            )}

            {/* Category */}
            {architecture.category && (
              <Box sx={{ display: 'flex', alignItems: 'center', minHeight: 24 }}>
                <CategoryIcon 
                  fontSize="small" 
                  sx={{ 
                    mr: 1, 
                    color: 'text.secondary',
                    fontSize: compact ? '16px' : '18px'
                  }} 
                />
                <Typography 
                  variant={compact ? "body2" : "body2"} 
                  color="text.secondary" 
                  noWrap
                >
                  {architecture.category}
                </Typography>
              </Box>
            )}
            
            {/* Tags at the bottom */}
            {tags && (
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                flexWrap: 'wrap', 
                gap: 0.5, 
                mt: 'auto', 
                pt: compact ? 1 : 1.5 
              }}>
                <EmojiEventsIcon 
                  sx={{ 
                    color: 'warning.main', 
                    fontSize: compact ? 14 : 16 
                  }} 
                />
                <Chip 
                  label={tags}
                  size="small"
                  color="warning"
                  variant="outlined"
                  sx={{ 
                    height: compact ? '18px' : '20px', 
                    fontSize: compact ? '0.6rem' : '0.65rem',
                    maxWidth: '200px',
                    '& .MuiChip-label': {
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }
                  }}
                />
              </Box>
            )}
          </Box>

          {/* Performance metrics display (development only) */}
          {enablePerformanceMonitoring && process.env.NODE_ENV === 'development' && loadingMetrics && (
            <Box sx={{ 
              mt: 1, 
              p: 1, 
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              borderRadius: 1,
              fontSize: '0.7rem'
            }}>
              <Typography variant="caption" display="block">
                Load: {loadingMetrics.totalLoadTime}ms
              </Typography>
              {loadingMetrics.perceivedImprovement > 0 && (
                <Typography variant="caption" display="block" color="success.main">
                  Improvement: +{Math.round(loadingMetrics.perceivedImprovement)}%
                </Typography>
              )}
            </Box>
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  );
}, (prevProps, nextProps) => {
  // Enhanced comparison function for memo optimization
  return (
    prevProps.architecture.id === nextProps.architecture.id &&
    prevProps.compact === nextProps.compact &&
    prevProps.showImage === nextProps.showImage &&
    prevProps.imageHeight === nextProps.imageHeight &&
    prevProps.enableImageZoom === nextProps.enableImageZoom &&
    prevProps.architecture.title === nextProps.architecture.title &&
    prevProps.architecture.name === nextProps.architecture.name &&
    prevProps.architecture.architect === nextProps.architecture.architect &&
    prevProps.architecture.year === nextProps.architecture.year &&
    prevProps.architecture.completedYear === nextProps.architecture.completedYear &&
    prevProps.architecture.address === nextProps.architecture.address &&
    prevProps.architecture.city === nextProps.architecture.city &&
    prevProps.architecture.location === nextProps.architecture.location &&
    prevProps.architecture.category === nextProps.architecture.category &&
    prevProps.architecture.tags === nextProps.architecture.tags &&
    prevProps.architecture.tag === nextProps.architecture.tag &&
    prevProps.architecture.ZAR_IMAGE_URL === nextProps.architecture.ZAR_IMAGE_URL &&
    prevProps.architecture.imageUrl === nextProps.architecture.imageUrl
  );
});

EnhancedArchitectureCard.displayName = 'EnhancedArchitectureCard';

export default EnhancedArchitectureCard;