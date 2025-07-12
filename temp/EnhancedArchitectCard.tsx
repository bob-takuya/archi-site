/**
 * Enhanced Architect Card with Progressive Image Loading - SOW Phase 2
 * Implements optimized image loading for architect profile photos
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
  Avatar,
  useTheme,
  alpha,
  Fade,
  Divider
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import CakeIcon from '@mui/icons-material/Cake';
import SchoolIcon from '@mui/icons-material/School';
import WorkIcon from '@mui/icons-material/Work';
import PublicIcon from '@mui/icons-material/Public';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import SpeedIcon from '@mui/icons-material/Speed';

import EnhancedProgressiveImage, { LoadingMetrics } from './EnhancedProgressiveImage';
import { generateBlurPlaceholder } from '../utils/imageOptimization';

interface ArchitectCardProps {
  architect: {
    Z_PK?: number;
    ZAT_ID?: number;
    ZAT_ARCHITECT: string;
    ZAT_ARCHITECT_JP?: string;
    ZAT_ARCHITECT_EN?: string;
    ZAT_BIRTHYEAR?: number;
    ZAT_DEATHYEAR?: number;
    ZAT_BIRTHPLACE?: string;
    ZAT_NATIONALITY?: string;
    ZAT_CATEGORY?: string;
    ZAT_SCHOOL?: string;
    ZAT_OFFICE?: string;
    ZAT_BIO?: string;
    ZAT_MAINWORKS?: string;
    ZAT_AWARDS?: string;
    ZAT_IMAGE?: string;
    // Legacy compatibility
    ZAR_ID?: number;
    ZAR_NAME?: string;
  };
  compact?: boolean;
  showImage?: boolean;
  imageSize?: 'small' | 'medium' | 'large';
  enableImageZoom?: boolean;
  enablePerformanceMonitoring?: boolean;
  onClick?: (architect: ArchitectCardProps['architect']) => void;
  onImageLoad?: (metrics: LoadingMetrics) => void;
}

/**
 * Enhanced Architect Card with progressive image loading for profile photos
 * Features:
 * - Progressive loading of architect profile images
 * - WebP support with fallbacks for portrait photos
 * - Performance optimization for mobile devices
 * - Blur placeholder for smooth loading transitions
 * - Comprehensive architect information display
 */
const EnhancedArchitectCard = memo<ArchitectCardProps>(({ 
  architect, 
  compact = false,
  showImage = true,
  imageSize = 'medium',
  enableImageZoom = false,
  enablePerformanceMonitoring = true,
  onClick,
  onImageLoad
}) => {
  const theme = useTheme();
  const [loadingMetrics, setLoadingMetrics] = useState<LoadingMetrics | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Extract display values
  const name = architect.ZAT_ARCHITECT || architect.ZAR_NAME || 'Unknown Architect';
  const nameJp = architect.ZAT_ARCHITECT_JP;
  const nameEn = architect.ZAT_ARCHITECT_EN;
  const birthYear = architect.ZAT_BIRTHYEAR;
  const deathYear = architect.ZAT_DEATHYEAR;
  const birthplace = architect.ZAT_BIRTHPLACE;
  const nationality = architect.ZAT_NATIONALITY;
  const category = architect.ZAT_CATEGORY;
  const school = architect.ZAT_SCHOOL;
  const office = architect.ZAT_OFFICE;
  const awards = architect.ZAT_AWARDS;
  const bio = architect.ZAT_BIO;
  const mainWorks = architect.ZAT_MAINWORKS;
  const imageUrl = architect.ZAT_IMAGE;
  const architectId = architect.Z_PK || architect.ZAT_ID || architect.ZAR_ID;

  // Image size configurations
  const imageSizeConfig = {
    small: { width: 60, height: 60 },
    medium: { width: 100, height: 100 },
    large: { width: 140, height: 140 }
  };

  const currentImageSize = imageSizeConfig[imageSize];

  // Handle card click
  const handleClick = useCallback(() => {
    if (onClick) {
      onClick(architect);
    }
  }, [onClick, architect]);

  // Handle image load with performance tracking
  const handleImageLoad = useCallback((metrics: LoadingMetrics) => {
    setLoadingMetrics(metrics);
    setImageLoaded(true);
    onImageLoad?.(metrics);
    
    // Log performance metrics for architect profile images
    if (enablePerformanceMonitoring) {
      console.log(`Architect profile image loaded for ${name}:`, {
        totalTime: metrics.totalLoadTime,
        perceivedImprovement: metrics.perceivedImprovement,
        connectionType: metrics.connectionType,
        imageSize: metrics.imageSize
      });
    }
  }, [onImageLoad, enablePerformanceMonitoring, name]);

  // Generate blur placeholder for the profile image
  const blurPlaceholder = imageUrl ? generateBlurPlaceholder(imageUrl) : undefined;

  // Format lifespan display
  const getLifespanDisplay = () => {
    if (!birthYear) return null;
    if (deathYear) {
      return `${birthYear} - ${deathYear}`;
    }
    return `${birthYear} -`;
  };

  return (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: theme.shadows[6],
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
        to={`/architect/${architectId}`}
        sx={{ flexGrow: 1, height: '100%', display: 'flex', flexDirection: 'column' }}
        onClick={handleClick}
      >
        <CardContent 
          sx={{ 
            flexGrow: 1, 
            display: 'flex', 
            flexDirection: 'column',
            p: compact ? 2 : 3,
            '&:last-child': { pb: compact ? 2 : 3 }
          }}
        >
          {/* Profile Header */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: compact ? 1.5 : 2,
            mb: compact ? 1.5 : 2
          }}>
            {/* Profile Image */}
            {showImage && (
              <Box sx={{ flexShrink: 0 }}>
                {imageUrl ? (
                  <EnhancedProgressiveImage
                    src={imageUrl}
                    alt={`${name} - プロフィール写真`}
                    width={currentImageSize.width}
                    height={currentImageSize.height}
                    blurDataUrl={blurPlaceholder}
                    loading="lazy"
                    priority={false}
                    objectFit="cover"
                    borderRadius="50%"
                    enableZoom={enableImageZoom}
                    enableFullscreen={false}
                    enablePerformanceMonitoring={enablePerformanceMonitoring}
                    optimizeForMobile={true}
                    onLoad={handleImageLoad}
                    onError={() => console.warn(`Failed to load profile image for architect ${name}`)}
                    sizes="(max-width: 600px) 60px, 100px"
                    style={{
                      border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                      transition: 'all 0.3s ease-in-out',
                    }}
                  />
                ) : (
                  <Avatar
                    sx={{
                      width: currentImageSize.width,
                      height: currentImageSize.height,
                      bgcolor: theme.palette.primary.main,
                      fontSize: compact ? '1.5rem' : '2rem'
                    }}
                  >
                    <PersonIcon fontSize="inherit" />
                  </Avatar>
                )}
              </Box>
            )}

            {/* Name and Basic Info */}
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography 
                variant={compact ? "h6" : "h5"} 
                component="h2"
                sx={{ 
                  fontWeight: 600,
                  lineHeight: 1.2,
                  mb: 0.5,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {name}
              </Typography>
              
              {/* Alternative names */}
              {(nameJp && nameJp !== name) && (
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ mb: 0.5 }}
                >
                  {nameJp}
                </Typography>
              )}
              
              {(nameEn && nameEn !== name) && (
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ mb: 0.5, fontStyle: 'italic' }}
                >
                  {nameEn}
                </Typography>
              )}

              {/* Lifespan */}
              {getLifespanDisplay() && (
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                  <CakeIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    {getLifespanDisplay()}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>

          {/* Detailed Information */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: compact ? 0.5 : 0.75, flexGrow: 1 }}>
            {/* Nationality and Birthplace */}
            {(nationality || birthplace) && (
              <Box sx={{ display: 'flex', alignItems: 'center', minHeight: 24 }}>
                <PublicIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary" noWrap>
                  {[nationality, birthplace].filter(Boolean).join(', ')}
                </Typography>
              </Box>
            )}

            {/* Education */}
            {school && (
              <Box sx={{ display: 'flex', alignItems: 'center', minHeight: 24 }}>
                <SchoolIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary" noWrap>
                  {school}
                </Typography>
              </Box>
            )}

            {/* Office/Practice */}
            {office && (
              <Box sx={{ display: 'flex', alignItems: 'center', minHeight: 24 }}>
                <WorkIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary" noWrap>
                  {office}
                </Typography>
              </Box>
            )}

            {/* Category */}
            {category && (
              <Chip 
                label={category}
                size="small"
                color="primary"
                variant="outlined"
                sx={{ 
                  alignSelf: 'flex-start',
                  height: compact ? '18px' : '20px', 
                  fontSize: compact ? '0.6rem' : '0.65rem',
                  mt: 0.5
                }}
              />
            )}

            {/* Bio (truncated) */}
            {bio && !compact && (
              <>
                <Divider sx={{ my: 1 }} />
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ 
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    lineHeight: 1.4
                  }}
                >
                  {bio}
                </Typography>
              </>
            )}

            {/* Awards */}
            {awards && (
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                flexWrap: 'wrap', 
                gap: 0.5, 
                mt: 'auto', 
                pt: compact ? 1 : 1.5 
              }}>
                <EmojiEventsIcon sx={{ color: 'warning.main', fontSize: 16 }} />
                <Chip 
                  label="受賞歴あり"
                  size="small"
                  color="warning"
                  variant="outlined"
                  sx={{ 
                    height: compact ? '18px' : '20px', 
                    fontSize: compact ? '0.6rem' : '0.65rem'
                  }}
                />
              </Box>
            )}

            {/* Main Works (truncated) */}
            {mainWorks && !compact && (
              <Typography 
                variant="caption" 
                color="text.secondary"
                sx={{ 
                  mt: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  lineHeight: 1.3
                }}
              >
                代表作: {mainWorks}
              </Typography>
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
                Profile Load: {loadingMetrics.totalLoadTime}ms
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
    prevProps.architect.Z_PK === nextProps.architect.Z_PK &&
    prevProps.architect.ZAT_ID === nextProps.architect.ZAT_ID &&
    prevProps.compact === nextProps.compact &&
    prevProps.showImage === nextProps.showImage &&
    prevProps.imageSize === nextProps.imageSize &&
    prevProps.enableImageZoom === nextProps.enableImageZoom &&
    prevProps.architect.ZAT_ARCHITECT === nextProps.architect.ZAT_ARCHITECT &&
    prevProps.architect.ZAT_ARCHITECT_JP === nextProps.architect.ZAT_ARCHITECT_JP &&
    prevProps.architect.ZAT_ARCHITECT_EN === nextProps.architect.ZAT_ARCHITECT_EN &&
    prevProps.architect.ZAT_BIRTHYEAR === nextProps.architect.ZAT_BIRTHYEAR &&
    prevProps.architect.ZAT_DEATHYEAR === nextProps.architect.ZAT_DEATHYEAR &&
    prevProps.architect.ZAT_BIRTHPLACE === nextProps.architect.ZAT_BIRTHPLACE &&
    prevProps.architect.ZAT_NATIONALITY === nextProps.architect.ZAT_NATIONALITY &&
    prevProps.architect.ZAT_CATEGORY === nextProps.architect.ZAT_CATEGORY &&
    prevProps.architect.ZAT_SCHOOL === nextProps.architect.ZAT_SCHOOL &&
    prevProps.architect.ZAT_OFFICE === nextProps.architect.ZAT_OFFICE &&
    prevProps.architect.ZAT_AWARDS === nextProps.architect.ZAT_AWARDS &&
    prevProps.architect.ZAT_IMAGE === nextProps.architect.ZAT_IMAGE
  );
});

EnhancedArchitectCard.displayName = 'EnhancedArchitectCard';

export default EnhancedArchitectCard;