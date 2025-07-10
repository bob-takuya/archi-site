/**
 * Mobile-optimized architecture viewer with swipe navigation and touch controls
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Paper,
  Chip,
  Fab,
  Drawer,
  useTheme,
  alpha,
  LinearProgress,
  Avatar,
  Collapse
} from '@mui/material';
import {
  Close as CloseIcon,
  Share as ShareIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Info as InfoIcon,
  Map as MapIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import MobileOptimizedImage from './MobileOptimizedImage';
import { useAdvancedTouchGestures, usePullToRefresh } from '../utils/mobileGestures';
import { useViewportSize } from '../utils/mobileGestures';

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
  details?: {
    area?: string;
    height?: string;
    materials?: string[];
    awards?: string[];
  };
}

interface MobileArchitectureViewerProps {
  architecture: Architecture;
  architectures?: Architecture[]; // For navigation
  currentIndex?: number;
  isOpen: boolean;
  onClose: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onFavorite?: (id: string) => void;
  onShare?: (architecture: Architecture) => void;
  isFavorited?: boolean;
  showNavigation?: boolean;
}

const MobileArchitectureViewer: React.FC<MobileArchitectureViewerProps> = ({
  architecture,
  architectures = [],
  currentIndex = 0,
  isOpen,
  onClose,
  onNext,
  onPrevious,
  onFavorite,
  onShare,
  isFavorited = false,
  showNavigation = true
}) => {
  const theme = useTheme();
  const viewport = useViewportSize();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const images = architecture.images?.length ? architecture.images : [architecture.imageUrl || ''];
  const hasMultipleImages = images.length > 1;
  const hasNavigation = showNavigation && (onNext || onPrevious);

  // Touch gestures for navigation
  const { gestureHandlers } = useAdvancedTouchGestures(
    onNext, // Swipe left -> next
    onPrevious, // Swipe right -> previous
    () => setShowInfo(true), // Swipe up -> show info
    onClose, // Swipe down -> close
    {
      minSwipeDistance: 50,
      enableHapticFeedback: true
    }
  );

  // Pull to refresh for updating data
  const { gestureHandlers: pullRefreshHandlers, isPulling, pullProgress } = usePullToRefresh(
    async () => {
      // Simulate data refresh
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  );

  // Handle image navigation
  const handleImageNext = useCallback(() => {
    if (hasMultipleImages) {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }
  }, [hasMultipleImages, images.length]);

  const handleImagePrevious = useCallback(() => {
    if (hasMultipleImages) {
      setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    }
  }, [hasMultipleImages, images.length]);

  // Handle favorite toggle
  const handleFavorite = useCallback(() => {
    onFavorite?.(architecture.id);
  }, [onFavorite, architecture.id]);

  // Handle share
  const handleShare = useCallback(async () => {
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
      onShare?.(architecture);
    }
  }, [onShare, architecture]);

  // Reset image index when architecture changes
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [architecture.id]);

  // Auto-hide info panel after delay
  useEffect(() => {
    if (showInfo) {
      const timer = setTimeout(() => {
        setShowInfo(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showInfo]);

  if (!isOpen) return null;

  return (
    <Drawer
      anchor="bottom"
      open={isOpen}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          height: '100vh',
          borderRadius: 0,
          backgroundColor: theme.palette.common.black
        }
      }}
      {...gestureHandlers}
    >
      {/* Pull to refresh indicator */}
      {isPulling && (
        <LinearProgress
          variant="determinate"
          value={pullProgress * 100}
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
            height: 4,
            backgroundColor: alpha(theme.palette.primary.main, 0.3)
          }}
        />
      )}

      {/* Header controls */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          background: `linear-gradient(180deg, ${alpha(theme.palette.common.black, 0.8)} 0%, transparent 100%)`,
          p: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton onClick={handleFavorite} sx={{ color: 'white' }}>
            {isFavorited ? <FavoriteIcon sx={{ color: theme.palette.error.main }} /> : <FavoriteBorderIcon />}
          </IconButton>
          
          <IconButton onClick={handleShare} sx={{ color: 'white' }}>
            <ShareIcon />
          </IconButton>
          
          <IconButton onClick={() => setShowInfo(!showInfo)} sx={{ color: 'white' }}>
            <InfoIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Main image viewer */}
      <Box
        sx={{
          position: 'relative',
          height: '60vh',
          backgroundColor: theme.palette.common.black
        }}
        {...pullRefreshHandlers}
      >
        <MobileOptimizedImage
          src={images[currentImageIndex]}
          alt={`${architecture.name} - Image ${currentImageIndex + 1}`}
          height="100%"
          enableZoom={true}
          enableSwipeGestures={hasMultipleImages}
          onSwipeLeft={handleImageNext}
          onSwipeRight={handleImagePrevious}
          priority={true}
        />

        {/* Image navigation indicators */}
        {hasMultipleImages && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 16,
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: 1
            }}
          >
            {images.map((_, index) => (
              <Box
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: index === currentImageIndex 
                    ? theme.palette.common.white 
                    : alpha(theme.palette.common.white, 0.5),
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              />
            ))}
          </Box>
        )}

        {/* Navigation arrows */}
        {hasNavigation && (
          <>
            {onPrevious && (
              <Fab
                size="small"
                onClick={onPrevious}
                sx={{
                  position: 'absolute',
                  left: 16,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  backgroundColor: alpha(theme.palette.common.black, 0.6),
                  color: 'white',
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.common.black, 0.8)
                  }
                }}
              >
                <ArrowBackIcon />
              </Fab>
            )}
            
            {onNext && (
              <Fab
                size="small"
                onClick={onNext}
                sx={{
                  position: 'absolute',
                  right: 16,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  backgroundColor: alpha(theme.palette.common.black, 0.6),
                  color: 'white',
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.common.black, 0.8)
                  }
                }}
              >
                <ArrowForwardIcon />
              </Fab>
            )}
          </>
        )}

        {/* Progress indicator for navigation */}
        {hasNavigation && architectures.length > 0 && (
          <Paper
            elevation={2}
            sx={{
              position: 'absolute',
              top: 60,
              left: '50%',
              transform: 'translateX(-50%)',
              px: 2,
              py: 0.5,
              backgroundColor: alpha(theme.palette.common.black, 0.8),
              color: 'white',
              fontSize: '0.75rem',
              borderRadius: 20
            }}
          >
            {currentIndex + 1} / {architectures.length}
          </Paper>
        )}
      </Box>

      {/* Content area */}
      <Box
        ref={scrollRef}
        sx={{
          flex: 1,
          backgroundColor: theme.palette.background.default,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          mt: -3,
          position: 'relative',
          overflow: 'auto'
        }}
      >
        {/* Handle bar */}
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 40,
            height: 4,
            backgroundColor: alpha(theme.palette.text.primary, 0.3),
            borderRadius: 2
          }}
        />

        {/* Content */}
        <Box sx={{ p: 3, pt: 4 }}>
          {/* Title and basic info */}
          <Typography
            variant="h5"
            component="h1"
            sx={{
              fontWeight: 'bold',
              mb: 1,
              fontSize: viewport.isMobile ? '1.5rem' : '1.75rem'
            }}
          >
            {architecture.name}
          </Typography>

          {/* Architect */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar sx={{ width: 32, height: 32, mr: 2, bgcolor: theme.palette.primary.main }}>
              <PersonIcon fontSize="small" />
            </Avatar>
            <Box>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {architecture.architect}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                建築家
              </Typography>
            </Box>
          </Box>

          {/* Year and location */}
          <Box sx={{ display: 'flex', gap: 3, mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CalendarIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                {architecture.year}年
              </Typography>
            </Box>
            
            {architecture.location && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocationIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  {architecture.location}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Tags */}
          {architecture.tags && architecture.tags.length > 0 && (
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
              {architecture.tags.map((tag, index) => (
                <Chip
                  key={index}
                  label={tag}
                  size="small"
                  variant="outlined"
                  sx={{ borderRadius: 12 }}
                />
              ))}
            </Box>
          )}

          {/* Description */}
          {architecture.description && (
            <Typography
              variant="body1"
              sx={{
                lineHeight: 1.7,
                mb: 3,
                color: theme.palette.text.primary
              }}
            >
              {architecture.description}
            </Typography>
          )}

          {/* Details section */}
          {architecture.details && (
            <>
              <Box
                onClick={() => setShowDetails(!showDetails)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  py: 1,
                  mb: 1
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  詳細情報
                </Typography>
                {showDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </Box>

              <Collapse in={showDetails}>
                <Box sx={{ pl: 2, pb: 2 }}>
                  {architecture.details.area && (
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>延床面積:</strong> {architecture.details.area}
                    </Typography>
                  )}
                  
                  {architecture.details.height && (
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>高さ:</strong> {architecture.details.height}
                    </Typography>
                  )}
                  
                  {architecture.details.materials && (
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>主要構造・材料:</strong> {architecture.details.materials.join(', ')}
                    </Typography>
                  )}
                  
                  {architecture.details.awards && architecture.details.awards.length > 0 && (
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                        受賞歴:
                      </Typography>
                      {architecture.details.awards.map((award, index) => (
                        <Typography key={index} variant="body2" sx={{ ml: 2, mb: 0.5 }}>
                          • {award}
                        </Typography>
                      ))}
                    </Box>
                  )}
                </Box>
              </Collapse>
            </>
          )}

          {/* Map location */}
          {architecture.coordinates && (
            <Paper
              elevation={1}
              sx={{
                p: 2,
                mt: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: alpha(theme.palette.action.hover, 0.5)
                }
              }}
            >
              <MapIcon color="primary" />
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  地図で確認
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {architecture.location}の詳細な位置を確認
                </Typography>
              </Box>
            </Paper>
          )}
        </Box>
      </Box>

      {/* Info overlay */}
      <Collapse in={showInfo}>
        <Paper
          elevation={8}
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 16,
            right: 16,
            p: 2,
            backgroundColor: alpha(theme.palette.background.paper, 0.95),
            backdropFilter: 'blur(10px)',
            borderRadius: 2,
            mb: 2
          }}
        >
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
            ← スワイプして前の建築 | スワイプして次の建築 →<br />
            ↑ スワイプして詳細表示 | ↓ スワイプして閉じる
          </Typography>
        </Paper>
      </Collapse>
    </Drawer>
  );
};

export default MobileArchitectureViewer;