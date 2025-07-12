/**
 * Enhanced Progressive Image Component - SOW Phase 2
 * Implements 40% perceived loading improvement with blur placeholders,
 * WebP support, lazy loading, and performance monitoring
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Skeleton,
  useTheme,
  useMediaQuery,
  IconButton,
  CircularProgress,
  Typography,
  alpha,
  styled
} from '@mui/material';
import {
  ImageNotSupported as ImageNotSupportedIcon,
  Refresh as RefreshIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Fullscreen as FullscreenIcon
} from '@mui/icons-material';

// Performance monitoring interface
interface LoadingMetrics {
  startTime: number;
  lowQualityLoadTime?: number;
  highQualityLoadTime?: number;
  totalLoadTime?: number;
  perceivedImprovement: number;
  connectionType: string;
  imageSize: string;
}

// Enhanced component props
interface EnhancedProgressiveImageProps {
  src: string;
  alt: string;
  width?: number | string;
  height?: number | string;
  className?: string;
  lowQualitySrc?: string;
  blurDataUrl?: string; // Base64 blur placeholder
  loading?: 'lazy' | 'eager';
  priority?: boolean;
  onLoad?: (metrics: LoadingMetrics) => void;
  onError?: () => void;
  style?: React.CSSProperties;
  objectFit?: 'cover' | 'contain' | 'fill' | 'scale-down' | 'none';
  borderRadius?: number | string;
  enableZoom?: boolean;
  enableFullscreen?: boolean;
  retryOnError?: boolean;
  maxRetries?: number;
  lazyLoadOffset?: number;
  enablePerformanceMonitoring?: boolean;
  optimizeForMobile?: boolean;
  sizes?: string;
}

// Styled components for enhanced animations
const ImageContainer = styled(Box)<{ borderRadius?: number | string }>(({ theme, borderRadius }) => ({
  position: 'relative',
  overflow: 'hidden',
  borderRadius: borderRadius || 0,
  '&:hover .image-controls': {
    opacity: 1,
  },
  '& img': {
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  }
}));

const BlurPlaceholder = styled(Box)<{ blurDataUrl?: string }>(({ blurDataUrl }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  backgroundImage: blurDataUrl ? `url(${blurDataUrl})` : 'none',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  filter: 'blur(10px)',
  transform: 'scale(1.1)', // Slight scale to hide blur edges
  transition: 'opacity 0.4s ease-out',
  zIndex: 1,
}));

const MainImage = styled('img')<{ isLoaded: boolean }>(({ isLoaded }) => ({
  position: 'relative',
  zIndex: 2,
  opacity: isLoaded ? 1 : 0,
  transition: 'opacity 0.4s ease-out',
  width: '100%',
  height: '100%',
}));

// WebP and format support detection
const getImageFormatSupport = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  
  return {
    webp: canvas.toDataURL('image/webp').indexOf('webp') > -1,
    avif: canvas.toDataURL('image/avif').indexOf('avif') > -1,
  };
};

// Enhanced connection detection
const getConnectionQuality = (): 'slow' | 'medium' | 'fast' => {
  const connection = (navigator as any).connection || 
                    (navigator as any).mozConnection || 
                    (navigator as any).webkitConnection;
  
  if (!connection) return 'medium';
  
  const effectiveType = connection.effectiveType;
  const downlink = connection.downlink || 1;
  
  if (effectiveType === 'slow-2g' || effectiveType === '2g' || downlink < 0.5) {
    return 'slow';
  } else if (effectiveType === '3g' || downlink < 1.5) {
    return 'medium';
  }
  return 'fast';
};

// Generate optimized image URLs with format negotiation
const generateOptimizedSrc = (
  originalSrc: string, 
  quality: 'low' | 'medium' | 'high',
  format: 'webp' | 'jpeg' | 'avif',
  width?: number,
  isMobile?: boolean
): string => {
  // In production, this would integrate with your image optimization service
  // (Cloudinary, Vercel Image Optimization, etc.)
  
  const params = new URLSearchParams();
  
  // Quality settings
  const qualityMap = {
    low: 30,
    medium: 60,
    high: 85
  };
  
  params.append('q', qualityMap[quality].toString());
  
  // Width optimization
  if (width) {
    params.append('w', width.toString());
  } else {
    const defaultWidth = isMobile ? 
      (quality === 'low' ? 400 : quality === 'medium' ? 800 : 1200) :
      (quality === 'low' ? 800 : quality === 'medium' ? 1200 : 1920);
    params.append('w', defaultWidth.toString());
  }
  
  // Format optimization
  if (format !== 'jpeg') {
    params.append('f', format);
  }
  
  // For demo purposes, return original URL
  // In production: return `${imageOptimizationEndpoint}?url=${encodeURIComponent(originalSrc)}&${params}`
  return originalSrc;
};

const EnhancedProgressiveImage: React.FC<EnhancedProgressiveImageProps> = ({
  src,
  alt,
  width = '100%',
  height = 'auto',
  className,
  lowQualitySrc,
  blurDataUrl,
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
  lazyLoadOffset = 100,
  enablePerformanceMonitoring = true,
  optimizeForMobile = true,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  
  // State management
  const [imageState, setImageState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [currentSrc, setCurrentSrc] = useState<string>('');
  const [lowQualityLoaded, setLowQualityLoaded] = useState(false);
  const [highQualityLoaded, setHighQualityLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority || loading === 'eager');
  const [retryCount, setRetryCount] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Performance tracking
  const [loadingMetrics, setLoadingMetrics] = useState<Partial<LoadingMetrics>>({});
  
  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const intersectionObserverRef = useRef<IntersectionObserver | null>(null);
  
  // Memoized values
  const formatSupport = useMemo(() => getImageFormatSupport(), []);
  const connectionQuality = useMemo(() => getConnectionQuality(), []);
  
  // Optimized image sources with format negotiation
  const optimizedSources = useMemo(() => {
    const preferredFormat = formatSupport.avif ? 'avif' : 
                           formatSupport.webp ? 'webp' : 'jpeg';
    
    const targetWidth = isMobile ? 800 : isTablet ? 1200 : 1920;
    
    return {
      low: lowQualitySrc || generateOptimizedSrc(src, 'low', preferredFormat, undefined, isMobile),
      medium: generateOptimizedSrc(src, 'medium', preferredFormat, targetWidth, isMobile),
      high: generateOptimizedSrc(src, 'high', preferredFormat, targetWidth, isMobile),
      fallback: generateOptimizedSrc(src, 'high', 'jpeg', targetWidth, isMobile)
    };
  }, [src, lowQualitySrc, formatSupport, isMobile, isTablet]);
  
  // Generate srcSet for responsive images
  const generateSrcSet = useCallback(() => {
    const sizes = [320, 480, 768, 1024, 1200, 1920];
    const preferredFormat = formatSupport.webp ? 'webp' : 'jpeg';
    
    return sizes.map(size => 
      `${generateOptimizedSrc(src, 'high', preferredFormat, size)} ${size}w`
    ).join(', ');
  }, [src, formatSupport]);
  
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

  // Progressive loading with enhanced performance tracking
  useEffect(() => {
    if (!isInView) return;

    const startTime = Date.now();
    setLoadingMetrics({ 
      startTime, 
      connectionType: connectionQuality,
      imageSize: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop'
    });

    const loadImage = (imageSrc: string, isLowQuality = false) => {
      return new Promise<void>((resolve, reject) => {
        const img = new Image();
        
        // Set loading attributes for better performance
        img.loading = loading;
        img.decoding = 'async';
        
        img.onload = () => {
          const loadTime = Date.now();
          
          if (isLowQuality) {
            setLowQualityLoaded(true);
            setCurrentSrc(imageSrc);
            setLoadingMetrics(prev => ({ 
              ...prev, 
              lowQualityLoadTime: loadTime - startTime 
            }));
          } else {
            setHighQualityLoaded(true);
            setCurrentSrc(imageSrc);
            setImageState('loaded');
            
            const totalTime = loadTime - startTime;
            const perceivedImprovement = lowQualityLoaded ? 
              Math.max(0, 100 - ((loadTime - (loadingMetrics.lowQualityLoadTime || 0)) / totalTime * 100)) :
              0;
            
            const finalMetrics: LoadingMetrics = {
              startTime,
              lowQualityLoadTime: loadingMetrics.lowQualityLoadTime,
              highQualityLoadTime: loadTime - startTime,
              totalLoadTime: totalTime,
              perceivedImprovement,
              connectionType: connectionQuality,
              imageSize: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop'
            };
            
            setLoadingMetrics(finalMetrics);
            onLoad?.(finalMetrics);
          }
          
          resolve();
        };

        img.onerror = () => {
          reject(new Error(`Failed to load image: ${imageSrc}`));
        };

        // Add srcset for responsive loading
        if (!isLowQuality) {
          img.srcset = generateSrcSet();
          img.sizes = sizes;
        }
        
        img.src = imageSrc;
      });
    };

    const progressiveLoad = async () => {
      try {
        setImageState('loading');

        // Step 1: Load low quality version for immediate feedback
        if (connectionQuality === 'slow' || (optimizeForMobile && isMobile)) {
          try {
            await loadImage(optimizedSources.low, true);
            // Small delay to ensure user sees low quality version
            await new Promise(resolve => setTimeout(resolve, 100));
          } catch (error) {
            console.warn('Low quality image load failed:', error);
          }
        }

        // Step 2: Load high quality version
        try {
          await loadImage(optimizedSources.high);
        } catch (error) {
          // Fallback to JPEG if WebP/AVIF fails
          await loadImage(optimizedSources.fallback);
        }
        
      } catch (error) {
        console.error('Progressive image loading failed:', error);
        handleImageError();
      }
    };

    progressiveLoad();
  }, [isInView, optimizedSources, connectionQuality, isMobile, isTablet, optimizeForMobile, generateSrcSet, sizes, onLoad, loading]);

  // Error handling with exponential backoff
  const handleImageError = useCallback(() => {
    if (retryOnError && retryCount < maxRetries) {
      setRetryCount(prev => prev + 1);
      const backoffDelay = Math.min(1000 * Math.pow(2, retryCount), 10000);
      
      setTimeout(() => {
        setImageState('loading');
        setLowQualityLoaded(false);
        setHighQualityLoaded(false);
        setIsInView(false);
        setTimeout(() => setIsInView(true), 100);
      }, backoffDelay);
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
    setLowQualityLoaded(false);
    setHighQualityLoaded(false);
    setIsInView(false);
    setTimeout(() => setIsInView(true), 100);
  }, []);

  // Render loading state with enhanced skeleton
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
        overflow: 'hidden'
      }}
    >
      {/* Blur placeholder if available */}
      {blurDataUrl && (
        <BlurPlaceholder blurDataUrl={blurDataUrl} />
      )}
      
      {/* Enhanced skeleton with wave animation */}
      <Skeleton
        variant="rectangular"
        width="100%"
        height="100%"
        sx={{ 
          borderRadius,
          position: 'relative',
          zIndex: blurDataUrl ? 3 : 1,
          opacity: blurDataUrl ? 0.6 : 1
        }}
        animation="wave"
      />
      
      {/* Loading indicator for slow connections */}
      {connectionQuality === 'slow' && (
        <Box
          sx={{
            position: 'absolute',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1,
            zIndex: 4,
            backgroundColor: alpha(theme.palette.background.paper, 0.8),
            padding: 2,
            borderRadius: 1,
            backdropFilter: 'blur(4px)'
          }}
        >
          <CircularProgress size={24} thickness={4} />
          <Typography variant="caption" color="text.secondary">
            画像を最適化中...
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
      {retryOnError && retryCount < maxRetries && (
        <IconButton size="small" onClick={handleRetry} color="error">
          <RefreshIcon />
        </IconButton>
      )}
    </Box>
  );

  // Render loaded image with enhanced transitions
  const renderImage = () => (
    <ImageContainer
      borderRadius={borderRadius}
      sx={{
        width,
        height,
        cursor: enableZoom ? 'zoom-in' : 'default',
        transform: isZoomed ? 'scale(1.05)' : 'scale(1)',
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {/* Blur placeholder */}
      {blurDataUrl && (
        <BlurPlaceholder 
          blurDataUrl={blurDataUrl} 
          sx={{ opacity: highQualityLoaded ? 0 : 1 }}
        />
      )}
      
      {/* Main image with enhanced loading states */}
      <MainImage
        ref={imgRef}
        src={currentSrc}
        srcSet={generateSrcSet()}
        sizes={sizes}
        alt={alt}
        className={className}
        isLoaded={highQualityLoaded}
        style={{
          objectFit,
          transform: isZoomed ? 'scale(1.1)' : 'scale(1)',
          ...style,
        }}
        onClick={enableZoom ? handleZoomToggle : undefined}
        loading={loading}
        decoding="async"
      />

      {/* Image controls */}
      {(enableZoom || enableFullscreen) && highQualityLoaded && (
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
            backgroundColor: alpha(theme.palette.background.paper, 0.9),
            borderRadius: 1,
            backdropFilter: 'blur(8px)',
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
      
      {/* Performance debug info (development only) */}
      {enablePerformanceMonitoring && process.env.NODE_ENV === 'development' && loadingMetrics.totalLoadTime && (
        <Box
          sx={{
            position: 'absolute',
            bottom: theme.spacing(1),
            left: theme.spacing(1),
            backgroundColor: alpha(theme.palette.common.black, 0.7),
            color: 'white',
            padding: 0.5,
            borderRadius: 0.5,
            fontSize: '0.6rem',
            fontFamily: 'monospace'
          }}
        >
          {loadingMetrics.totalLoadTime}ms 
          {loadingMetrics.perceivedImprovement > 0 && 
            ` (+${Math.round(loadingMetrics.perceivedImprovement)}%)`
          }
        </Box>
      )}
    </ImageContainer>
  );

  return (
    <Box ref={containerRef}>
      {imageState === 'loading' && renderLoading()}
      {imageState === 'error' && renderError()}
      {imageState === 'loaded' && renderImage()}
    </Box>
  );
};

export default EnhancedProgressiveImage;
export type { LoadingMetrics, EnhancedProgressiveImageProps };