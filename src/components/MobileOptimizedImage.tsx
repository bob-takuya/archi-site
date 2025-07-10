/**
 * Mobile-optimized image component with lazy loading, responsive design, and touch gestures
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Box, Skeleton, IconButton, Paper, useTheme, alpha } from '@mui/material';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import { useAdvancedTouchGestures, useDoubleTap } from '../utils/mobileGestures';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import CloseIcon from '@mui/icons-material/Close';
import TouchAppIcon from '@mui/icons-material/TouchApp';

interface MobileOptimizedImageProps {
  src: string;
  alt: string;
  width?: number | string;
  height?: number | string;
  aspectRatio?: number; // width/height
  placeholder?: string;
  onLoad?: () => void;
  onError?: () => void;
  enableZoom?: boolean;
  enableSwipeGestures?: boolean;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  priority?: boolean; // For above-the-fold images
  sizes?: string; // Responsive image sizes
  className?: string;
  lazyLoad?: boolean;
}

interface ResponsiveImageSize {
  width: number;
  quality: number;
  format: 'webp' | 'jpg' | 'png';
}

const generateResponsiveSizes = (originalSrc: string): ResponsiveImageSize[] => {
  return [
    { width: 320, quality: 75, format: 'webp' },
    { width: 480, quality: 80, format: 'webp' },
    { width: 768, quality: 85, format: 'webp' },
    { width: 1024, quality: 90, format: 'webp' },
    { width: 1200, quality: 95, format: 'webp' }
  ];
};

const MobileOptimizedImage: React.FC<MobileOptimizedImageProps> = ({
  src,
  alt,
  width = '100%',
  height = 'auto',
  aspectRatio,
  placeholder,
  onLoad,
  onError,
  enableZoom = true,
  enableSwipeGestures = false,
  onSwipeLeft,
  onSwipeRight,
  priority = false,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  className,
  lazyLoad = true
}) => {
  const theme = useTheme();
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [showTouchHint, setShowTouchHint] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection observer for lazy loading
  const [inView, targetRef] = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '50px'
  });

  const shouldLoad = !lazyLoad || priority || inView;

  // Touch gestures for swipe navigation
  const { gestureHandlers: swipeHandlers } = useAdvancedTouchGestures(
    onSwipeLeft,
    onSwipeRight,
    undefined,
    undefined,
    { enableHapticFeedback: true }
  );

  // Double tap to zoom
  const { onTouchEnd: handleDoubleTap } = useDoubleTap(() => {
    if (!enableZoom) return;
    setIsZoomed(!isZoomed);
  });

  // Handle image load success
  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    setHasError(false);
    onLoad?.();
  }, [onLoad]);

  // Handle image load error
  const handleError = useCallback(() => {
    setHasError(true);
    setIsLoaded(false);
    onError?.();
  }, [onError]);

  // Handle zoom toggle
  const toggleZoom = useCallback(() => {
    setIsZoomed(!isZoomed);
  }, [isZoomed]);

  // Show touch hint on first interaction
  useEffect(() => {
    if (enableSwipeGestures && isLoaded) {
      const timer = setTimeout(() => {
        setShowTouchHint(true);
        setTimeout(() => setShowTouchHint(false), 3000);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [enableSwipeGestures, isLoaded]);

  // Generate responsive image sources
  const generateSrcSet = useCallback((originalSrc: string) => {
    const sizes = generateResponsiveSizes(originalSrc);
    return sizes.map(size => 
      `${originalSrc}?w=${size.width}&q=${size.quality}&f=${size.format} ${size.width}w`
    ).join(', ');
  }, []);

  // Container styles
  const containerStyles = {
    position: 'relative' as const,
    width,
    height: aspectRatio ? 'auto' : height,
    aspectRatio: aspectRatio ? `${aspectRatio}` : undefined,
    overflow: 'hidden',
    borderRadius: theme.shape.borderRadius,
    cursor: enableZoom ? 'zoom-in' : 'default',
    transition: 'all 0.3s ease-in-out',
    transform: isZoomed ? 'scale(1.05)' : 'scale(1)',
    boxShadow: isZoomed 
      ? `0 8px 32px ${alpha(theme.palette.common.black, 0.3)}`
      : `0 2px 8px ${alpha(theme.palette.common.black, 0.1)}`,
    ...(enableSwipeGestures && {
      touchAction: 'pan-y pinch-zoom'
    })
  };

  // Loading skeleton
  if (!shouldLoad || (!isLoaded && !hasError)) {
    return (
      <Box
        ref={targetRef}
        sx={containerStyles}
        className={className}
      >
        <Skeleton
          variant="rectangular"
          width="100%"
          height="100%"
          animation="wave"
          sx={{
            bgcolor: alpha(theme.palette.grey[300], 0.3),
            borderRadius: theme.shape.borderRadius
          }}
        />
      </Box>
    );
  }

  // Error state
  if (hasError) {
    return (
      <Box
        sx={{
          ...containerStyles,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: alpha(theme.palette.grey[200], 0.5),
          color: theme.palette.text.secondary,
          fontSize: '0.875rem'
        }}
        className={className}
      >
        画像を読み込めませんでした
      </Box>
    );
  }

  return (
    <>
      <Box
        ref={containerRef}
        sx={containerStyles}
        className={className}
        {...(enableSwipeGestures ? swipeHandlers : {})}
        onTouchEnd={enableZoom ? handleDoubleTap : undefined}
      >
        <img
          ref={imgRef}
          src={src}
          srcSet={generateSrcSet(src)}
          sizes={sizes}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          onLoad={handleLoad}
          onError={handleError}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.3s ease-in-out',
            transform: isZoomed ? 'scale(1.1)' : 'scale(1)'
          }}
        />

        {/* Zoom controls */}
        {enableZoom && isLoaded && (
          <IconButton
            onClick={toggleZoom}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              backgroundColor: alpha(theme.palette.common.black, 0.6),
              color: theme.palette.common.white,
              '&:hover': {
                backgroundColor: alpha(theme.palette.common.black, 0.8)
              },
              transition: 'all 0.2s ease-in-out',
              opacity: isZoomed ? 1 : 0.7
            }}
            size="small"
          >
            {isZoomed ? <CloseIcon fontSize="small" /> : <ZoomInIcon fontSize="small" />}
          </IconButton>
        )}

        {/* Touch hint */}
        {showTouchHint && enableSwipeGestures && (
          <Paper
            elevation={2}
            sx={{
              position: 'absolute',
              bottom: 16,
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              px: 2,
              py: 1,
              backgroundColor: alpha(theme.palette.common.black, 0.8),
              color: theme.palette.common.white,
              fontSize: '0.75rem',
              borderRadius: 20,
              animation: 'fadeInOut 3s ease-in-out'
            }}
          >
            <TouchAppIcon fontSize="small" />
            スワイプして移動
          </Paper>
        )}
      </Box>

      {/* Fullscreen zoom overlay */}
      {isZoomed && enableZoom && (
        <Box
          onClick={() => setIsZoomed(false)}
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: alpha(theme.palette.common.black, 0.9),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: theme.zIndex.modal,
            cursor: 'zoom-out'
          }}
        >
          <Box
            onClick={(e) => e.stopPropagation()}
            sx={{
              maxWidth: '90vw',
              maxHeight: '90vh',
              position: 'relative'
            }}
          >
            <img
              src={src}
              alt={alt}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                borderRadius: theme.shape.borderRadius
              }}
            />
            <IconButton
              onClick={() => setIsZoomed(false)}
              sx={{
                position: 'absolute',
                top: -40,
                right: -40,
                backgroundColor: alpha(theme.palette.common.white, 0.9),
                color: theme.palette.common.black,
                '&:hover': {
                  backgroundColor: theme.palette.common.white
                }
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      )}

      {/* CSS animations */}
      <style>{`
        @keyframes fadeInOut {
          0%, 100% { opacity: 0; transform: translateX(-50%) translateY(10px); }
          50% { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </>
  );
};

export default MobileOptimizedImage;