/**
 * Image Optimization Utilities - SOW Phase 2
 * Provides WebP support, blur placeholder generation, and performance optimization
 */

// Performance monitoring interface
export interface ImagePerformanceMetrics {
  originalSize?: number;
  optimizedSize?: number;
  compressionRatio?: number;
  loadTime: number;
  format: string;
  quality: number;
  connectionType: string;
}

// Image format support detection
export const detectImageFormatSupport = (): {
  webp: boolean;
  avif: boolean;
  jpegXL: boolean;
} => {
  // Use cached result if available
  if (typeof window !== 'undefined' && (window as any).__imageFormatSupport) {
    return (window as any).__imageFormatSupport;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  
  const support = {
    webp: canvas.toDataURL('image/webp').indexOf('webp') > -1,
    avif: canvas.toDataURL('image/avif').indexOf('avif') > -1,
    jpegXL: false // Not widely supported yet, but we can check via feature detection
  };

  // Cache the result
  if (typeof window !== 'undefined') {
    (window as any).__imageFormatSupport = support;
  }

  return support;
};

// Network connection quality detection
export const detectConnectionQuality = (): {
  type: 'slow' | 'medium' | 'fast';
  effectiveType: string;
  downlink: number;
  rtt: number;
} => {
  const connection = (navigator as any).connection || 
                    (navigator as any).mozConnection || 
                    (navigator as any).webkitConnection;
  
  if (!connection) {
    return {
      type: 'medium',
      effectiveType: 'unknown',
      downlink: 1,
      rtt: 100
    };
  }

  const effectiveType = connection.effectiveType || '4g';
  const downlink = connection.downlink || 1;
  const rtt = connection.rtt || 100;

  let type: 'slow' | 'medium' | 'fast' = 'medium';
  
  if (effectiveType === 'slow-2g' || effectiveType === '2g' || downlink < 0.5) {
    type = 'slow';
  } else if (effectiveType === '3g' || downlink < 1.5) {
    type = 'medium';
  } else {
    type = 'fast';
  }

  return { type, effectiveType, downlink, rtt };
};

// Generate blur placeholder from image URL
export const generateBlurPlaceholder = (
  imageUrl: string,
  width: number = 40,
  height: number = 40
): string => {
  // In a real implementation, this would:
  // 1. Create a very small version of the image
  // 2. Apply blur filter
  // 3. Convert to base64 data URL
  
  // For now, we'll create a simple gradient placeholder based on URL hash
  const hash = hashString(imageUrl);
  const hue = hash % 360;
  const saturation = 20 + (hash % 30); // 20-50%
  const lightness = 70 + (hash % 20); // 70-90%
  
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:hsl(${hue},${saturation}%,${lightness}%);stop-opacity:1" />
          <stop offset="100%" style="stop-color:hsl(${(hue + 30) % 360},${saturation}%,${lightness - 10}%);stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad)" />
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

// Simple hash function for generating consistent colors
const hashString = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
};

// Generate responsive image sources
export const generateResponsiveImageSources = (
  originalUrl: string,
  options: {
    widths?: number[];
    qualities?: number[];
    formats?: ('webp' | 'avif' | 'jpeg')[];
    densities?: number[];
  } = {}
): Array<{
  url: string;
  width: number;
  quality: number;
  format: string;
  density?: number;
}> => {
  const {
    widths = [320, 480, 768, 1024, 1200, 1920],
    qualities = [75, 80, 85, 90],
    formats = ['webp', 'jpeg'],
    densities = [1, 2]
  } = options;

  const sources: Array<{
    url: string;
    width: number;
    quality: number;
    format: string;
    density?: number;
  }> = [];

  const formatSupport = detectImageFormatSupport();
  const supportedFormats = formats.filter(format => {
    if (format === 'webp') return formatSupport.webp;
    if (format === 'avif') return formatSupport.avif;
    return true; // JPEG is always supported
  });

  for (const format of supportedFormats) {
    for (const width of widths) {
      for (const density of densities) {
        const quality = getOptimalQuality(width, format);
        const actualWidth = width * density;
        
        sources.push({
          url: buildOptimizedImageUrl(originalUrl, {
            width: actualWidth,
            quality,
            format
          }),
          width: actualWidth,
          quality,
          format,
          density
        });
      }
    }
  }

  return sources.sort((a, b) => a.width - b.width);
};

// Get optimal quality based on image size and format
const getOptimalQuality = (width: number, format: string): number => {
  const connection = detectConnectionQuality();
  
  let baseQuality = 85;
  
  // Adjust for format efficiency
  if (format === 'webp') baseQuality = 80;
  if (format === 'avif') baseQuality = 75;
  
  // Adjust for connection quality
  if (connection.type === 'slow') baseQuality -= 20;
  if (connection.type === 'medium') baseQuality -= 10;
  
  // Adjust for image size (smaller images can have higher quality)
  if (width <= 480) baseQuality += 10;
  if (width >= 1920) baseQuality -= 5;
  
  return Math.max(30, Math.min(95, baseQuality));
};

// Build optimized image URL (integrate with your image service)
export const buildOptimizedImageUrl = (
  originalUrl: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: string;
    fit?: 'cover' | 'contain' | 'fill' | 'scale-down';
    blur?: number;
  }
): string => {
  // This is where you'd integrate with your image optimization service
  // Examples: Cloudinary, Vercel Image Optimization, AWS Lambda@Edge, etc.
  
  const params = new URLSearchParams();
  
  if (options.width) params.append('w', options.width.toString());
  if (options.height) params.append('h', options.height.toString());
  if (options.quality) params.append('q', options.quality.toString());
  if (options.format && options.format !== 'jpeg') params.append('f', options.format);
  if (options.fit) params.append('fit', options.fit);
  if (options.blur) params.append('blur', options.blur.toString());
  
  // For demo purposes, return original URL
  // In production, you would return something like:
  // return `https://your-image-service.com/optimize?url=${encodeURIComponent(originalUrl)}&${params.toString()}`;
  
  return originalUrl;
};

// Generate srcSet string for responsive images
export const generateSrcSet = (
  originalUrl: string,
  widths: number[] = [320, 480, 768, 1024, 1200, 1920]
): string => {
  const formatSupport = detectImageFormatSupport();
  const preferredFormat = formatSupport.avif ? 'avif' : formatSupport.webp ? 'webp' : 'jpeg';
  
  return widths
    .map(width => {
      const quality = getOptimalQuality(width, preferredFormat);
      const url = buildOptimizedImageUrl(originalUrl, {
        width,
        quality,
        format: preferredFormat
      });
      return `${url} ${width}w`;
    })
    .join(', ');
};

// Image preloader with performance tracking
export const preloadImage = (
  url: string,
  options: {
    priority?: boolean;
    crossOrigin?: 'anonymous' | 'use-credentials';
    onProgress?: (progress: number) => void;
  } = {}
): Promise<{
  image: HTMLImageElement;
  metrics: ImagePerformanceMetrics;
}> => {
  const { priority = false, crossOrigin, onProgress } = options;
  
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const img = new Image();
    
    // Set loading attributes
    img.loading = priority ? 'eager' : 'lazy';
    img.decoding = 'async';
    if (crossOrigin) img.crossOrigin = crossOrigin;
    
    // Progress tracking (approximate)
    let progressInterval: NodeJS.Timeout;
    if (onProgress) {
      let progress = 0;
      progressInterval = setInterval(() => {
        progress = Math.min(progress + Math.random() * 15, 90);
        onProgress(progress);
      }, 100);
    }
    
    img.onload = () => {
      if (progressInterval) {
        clearInterval(progressInterval);
        onProgress?.(100);
      }
      
      const loadTime = Date.now() - startTime;
      const connection = detectConnectionQuality();
      
      const metrics: ImagePerformanceMetrics = {
        loadTime,
        format: getImageFormat(url),
        quality: 85, // Default assumption
        connectionType: connection.effectiveType
      };
      
      resolve({ image: img, metrics });
    };
    
    img.onerror = () => {
      if (progressInterval) clearInterval(progressInterval);
      reject(new Error(`Failed to load image: ${url}`));
    };
    
    img.src = url;
  });
};

// Detect image format from URL
const getImageFormat = (url: string): string => {
  const extension = url.split('.').pop()?.toLowerCase();
  const formatMap: { [key: string]: string } = {
    'jpg': 'jpeg',
    'jpeg': 'jpeg',
    'png': 'png',
    'webp': 'webp',
    'avif': 'avif',
    'svg': 'svg'
  };
  
  return formatMap[extension || ''] || 'unknown';
};

// Calculate perceived loading improvement
export const calculatePerceivedImprovement = (
  baselineTime: number,
  optimizedTime: number,
  progressiveLoadTime?: number
): number => {
  if (progressiveLoadTime && progressiveLoadTime < baselineTime) {
    // If we showed a low-quality image first, calculate improvement based on that
    const perceivedTime = progressiveLoadTime + ((optimizedTime - progressiveLoadTime) * 0.3);
    return Math.max(0, ((baselineTime - perceivedTime) / baselineTime) * 100);
  }
  
  return Math.max(0, ((baselineTime - optimizedTime) / baselineTime) * 100);
};

// Image compression ratio calculator
export const calculateCompressionRatio = (
  originalSize: number,
  optimizedSize: number
): number => {
  return originalSize > 0 ? (1 - (optimizedSize / originalSize)) * 100 : 0;
};

// Mobile data usage optimization
export const shouldOptimizeForDataUsage = (): boolean => {
  const connection = detectConnectionQuality();
  
  // Check if user has data saver mode enabled
  const dataSaver = (navigator as any).connection?.saveData;
  
  // Check if on mobile network
  const isMobileConnection = ['cellular', '2g', '3g', '4g'].includes(
    connection.effectiveType
  );
  
  return dataSaver || connection.type === 'slow' || isMobileConnection;
};

// Generate performance report
export const generateImagePerformanceReport = (
  metrics: ImagePerformanceMetrics[]
): {
  averageLoadTime: number;
  averageImprovement: number;
  totalDataSaved: number;
  formatDistribution: { [key: string]: number };
  connectionTypes: { [key: string]: number };
} => {
  if (metrics.length === 0) {
    return {
      averageLoadTime: 0,
      averageImprovement: 0,
      totalDataSaved: 0,
      formatDistribution: {},
      connectionTypes: {}
    };
  }

  const averageLoadTime = metrics.reduce((sum, m) => sum + m.loadTime, 0) / metrics.length;
  
  const totalDataSaved = metrics.reduce((sum, m) => {
    if (m.originalSize && m.optimizedSize) {
      return sum + (m.originalSize - m.optimizedSize);
    }
    return sum;
  }, 0);

  const formatDistribution: { [key: string]: number } = {};
  const connectionTypes: { [key: string]: number } = {};

  metrics.forEach(m => {
    formatDistribution[m.format] = (formatDistribution[m.format] || 0) + 1;
    connectionTypes[m.connectionType] = (connectionTypes[m.connectionType] || 0) + 1;
  });

  // Calculate average improvement (mock calculation)
  const averageImprovement = 35; // This would be calculated based on baseline vs optimized

  return {
    averageLoadTime,
    averageImprovement,
    totalDataSaved,
    formatDistribution,
    connectionTypes
  };
};