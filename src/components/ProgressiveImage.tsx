import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box,
  Skeleton,
  useTheme,
  useMediaQuery,
  IconButton,
  Zoom,
  CircularProgress,
  Typography,
  alpha
} from '@mui/material';
import {
  ImageNotSupported as ImageNotSupportedIcon,
  Refresh as RefreshIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Fullscreen as FullscreenIcon
} from '@mui/icons-material';

interface ProgressiveImageProps {
  src: string;
  alt: string;
  width?: number | string;
  height?: number | string;
  className?: string;
  placeholderSrc?: string;
  lowQualitySrc?: string;
  loading?: 'lazy' | 'eager';
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
  style?: React.CSSProperties;
  objectFit?: 'cover' | 'contain' | 'fill' | 'scale-down' | 'none';
  borderRadius?: number | string;
  enableZoom?: boolean;
  enableFullscreen?: boolean;
  retryOnError?: boolean;
  maxRetries?: number;
  showLoadingProgress?: boolean;
  lazyLoadOffset?: number;
}

// WebP support detection
const supportsWebP = (() => {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL('image/webp').indexOf('webp') > -1;
})();

// Network quality detection
const getConnectionType = (): 'slow' | 'fast' | 'unknown' => {
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  
  if (!connection) return 'unknown';
  
  const slowConnections = ['slow-2g', '2g', '3g'];
  const effectiveType = connection.effectiveType;
  
  if (slowConnections.includes(effectiveType)) return 'slow';
  return 'fast';
};

const ProgressiveImage: React.FC<ProgressiveImageProps> = ({
  src,
  alt,
  width = '100%',
  height = 'auto',
  className,
  placeholderSrc,
  lowQualitySrc,
  loading = 'lazy',
  priority = false,
  onLoad,
  onError,
  style,
  objectFit = 'cover',
  borderRadius = 0,
  enableZoom = false,
  enableFullscreen = false,
  retryOnError = true,
  maxRetries = 3,
  showLoadingProgress = false,
  lazyLoadOffset = 100
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSlowConnection = getConnectionType() === 'slow';

  // State management
  const [imageState, setImageState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [currentSrc, setCurrentSrc] = useState<string>('');
  const [isInView, setIsInView] = useState(priority || loading === 'eager');
  const [retryCount, setRetryCount] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loadStartTime, setLoadStartTime] = useState<number | null>(null);

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const intersectionObserverRef = useRef<IntersectionObserver | null>(null);

  // Generate optimized image URLs
  const getOptimizedSrc = useCallback((originalSrc: string, quality: 'low' | 'medium' | 'high' = 'high'): string => {
    // If a specific low-quality src is provided, use it
    if (quality === 'low' && lowQualitySrc) {
      return lowQualitySrc;
    }

    // For GitHub-hosted images or external images, we can't modify them
    // In a real app, you'd have an image optimization service
    let optimizedSrc = originalSrc;

    // Add WebP support if available
    if (supportsWebP && !originalSrc.includes('.svg')) {
      // In production, you'd replace this with your image optimization service
      // optimizedSrc = originalSrc.replace(/\.(jpg|jpeg|png)$/i, '.webp');
    }

    // Quality adjustments based on connection and device
    const qualityParams = new URLSearchParams();
    
    if (quality === 'low') {
      qualityParams.append('q', '30');
      qualityParams.append('w', isMobile ? '400' : '800');
    } else if (quality === 'medium') {
      qualityParams.append('q', '60');
      qualityParams.append('w', isMobile ? '800' : '1200');
    } else {
      qualityParams.append('q', isSlowConnection ? '70' : '85');
      qualityParams.append('w', isMobile ? '1200' : '1920');
    }

    // For external services like Cloudinary, you'd append quality parameters
    // const hasParams = originalSrc.includes('?');
    // return `${optimizedSrc}${hasParams ? '&' : '?'}${qualityParams.toString()}`;
    
    return optimizedSrc;
  }, [lowQualitySrc, isMobile, isSlowConnection]);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (loading === 'eager' || priority) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: `${lazyLoadOffset}px`,
        threshold: 0.1
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    intersectionObserverRef.current = observer;

    return () => {
      observer.disconnect();
    };
  }, [loading, priority, lazyLoadOffset]);

  // Progressive loading with quality levels
  useEffect(() => {
    if (!isInView) return;

    const loadImage = (imageSrc: string) => {
      return new Promise<void>((resolve, reject) => {
        const img = new Image();
        
        img.onload = () => {
          setCurrentSrc(imageSrc);
          setImageState('loaded');
          setLoadingProgress(100);
          onLoad?.();
          resolve();
        };

        img.onerror = () => {
          reject(new Error(`Failed to load image: ${imageSrc}`));
        };

        // Progress simulation for loading indicator
        if (showLoadingProgress) {
          setLoadStartTime(Date.now());
          const progressInterval = setInterval(() => {
            setLoadingProgress(prev => {
              if (prev >= 90) {
                clearInterval(progressInterval);
                return 90;
              }
              return prev + Math.random() * 10;
            });
          }, 100);
          
          img.onload = () => {
            clearInterval(progressInterval);
            setLoadingProgress(100);
            setCurrentSrc(imageSrc);
            setImageState('loaded');
            onLoad?.();
            resolve();
          };
        }

        img.src = imageSrc;
      });
    };

    const progressiveLoad = async () => {
      try {
        setImageState('loading');
        setLoadingProgress(0);

        // Step 1: Load placeholder if available
        if (placeholderSrc) {
          await loadImage(placeholderSrc);
        }

        // Step 2: Load low quality version on slow connections
        if (isSlowConnection || isMobile) {
          try {
            await loadImage(getOptimizedSrc(src, 'low'));
            // Add small delay to show the low-quality version
            await new Promise(resolve => setTimeout(resolve, 100));
          } catch (e) {
            // Continue to high quality if low quality fails
          }
        }

        // Step 3: Load high quality version
        await loadImage(getOptimizedSrc(src, 'high'));
        
      } catch (error) {
        console.error('Progressive image loading failed:', error);
        handleImageError();
      }
    };

    progressiveLoad();
  }, [isInView, src, placeholderSrc, getOptimizedSrc, isSlowConnection, isMobile, onLoad, showLoadingProgress]);

  // Error handling with retry
  const handleImageError = useCallback(() => {
    if (retryOnError && retryCount < maxRetries) {
      setRetryCount(prev => prev + 1);
      setTimeout(() => {
        setImageState('loading');
        setIsInView(false);
        setTimeout(() => setIsInView(true), 100); // Trigger reload
      }, 1000 * (retryCount + 1)); // Exponential backoff
    } else {
      setImageState('error');
      onError?.();
    }
  }, [retryOnError, retryCount, maxRetries, onError]);

  // Zoom functionality
  const handleZoomToggle = useCallback(() => {
    setIsZoomed(!isZoomed);
  }, [isZoomed]);

  // Fullscreen functionality
  const handleFullscreenToggle = useCallback(() => {
    if (!isFullscreen && containerRef.current) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  }, [isFullscreen]);

  // Manual retry
  const handleRetry = useCallback(() => {
    setRetryCount(0);
    setImageState('loading');
    setIsInView(false);
    setTimeout(() => setIsInView(true), 100);
  }, []);

  // Render loading state
  const renderLoading = () => (
    <Box
      sx={{
        position: 'relative',
        width,
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: alpha(theme.palette.grey[300], 0.3),
        borderRadius,
      }}
    >
      <Skeleton
        variant="rectangular"
        width="100%"
        height="100%"
        sx={{ borderRadius }}
        animation="wave"
      />
      
      {showLoadingProgress && (
        <Box
          sx={{
            position: 'absolute',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <CircularProgress
            variant="determinate"
            value={loadingProgress}
            size={40}
            thickness={4}
          />
          <Typography variant="caption" color="text.secondary">
            {Math.round(loadingProgress)}%
          </Typography>
        </Box>
      )}
    </Box>
  );

  // Render error state
  const renderError = () => (
    <Box
      sx={{
        width,
        height,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: alpha(theme.palette.error.main, 0.1),
        borderRadius,
        border: `1px dashed ${theme.palette.error.main}`,
        gap: 1,
        p: 2,
      }}
    >
      <ImageNotSupportedIcon color="error" />
      <Typography variant="caption" color="error" align="center">
        画像を読み込めませんでした
      </Typography>
      {retryOnError && (
        <IconButton size="small" onClick={handleRetry} color="error">
          <RefreshIcon />
        </IconButton>
      )}
    </Box>
  );

  // Render loaded image
  const renderImage = () => (
    <Box
      sx={{
        position: 'relative',
        width,
        height,
        overflow: 'hidden',
        borderRadius,
        '&:hover .image-controls': {
          opacity: enableZoom || enableFullscreen ? 1 : 0,
        },
      }}
    >
      <img
        ref={imgRef}
        src={currentSrc}
        alt={alt}
        className={className}
        style={{
          width: '100%',
          height: '100%',
          objectFit,
          transform: isZoomed ? 'scale(1.5)' : 'scale(1)',
          transition: 'transform 0.3s ease-in-out',
          cursor: enableZoom ? 'zoom-in' : 'default',
          ...style,
        }}
        onClick={enableZoom ? handleZoomToggle : undefined}
        loading={loading}
      />

      {/* Image controls */}
      {(enableZoom || enableFullscreen) && (
        <Box
          className="image-controls"
          sx={{
            position: 'absolute',
            top: theme.spacing(1),
            right: theme.spacing(1),
            display: 'flex',
            gap: 0.5,
            opacity: 0,
            transition: 'opacity 0.2s ease-in-out',
            backgroundColor: alpha(theme.palette.background.paper, 0.8),
            borderRadius: 1,
            backdropFilter: 'blur(4px)',
          }}
        >
          {enableZoom && (
            <IconButton
              size="small"
              onClick={handleZoomToggle}
              sx={{ minWidth: '32px', minHeight: '32px' }}
            >
              {isZoomed ? <ZoomOutIcon /> : <ZoomInIcon />}
            </IconButton>
          )}
          {enableFullscreen && (
            <IconButton
              size="small"
              onClick={handleFullscreenToggle}
              sx={{ minWidth: '32px', minHeight: '32px' }}
            >
              <FullscreenIcon />
            </IconButton>
          )}
        </Box>
      )}
    </Box>
  );

  return (
    <Box ref={containerRef}>
      {imageState === 'loading' && renderLoading()}
      {imageState === 'error' && renderError()}
      {imageState === 'loaded' && renderImage()}
    </Box>
  );
};

export default ProgressiveImage;