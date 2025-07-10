import { defineConfig, splitVendorChunkPlugin } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { visualizer } from 'rollup-plugin-visualizer';
import { compression } from 'vite-plugin-compression';

// Bundle analyzer plugin
const bundleAnalyzer = () => {
  return process.env.ANALYZE 
    ? visualizer({
        filename: 'dist/bundle-analysis.html',
        open: true,
        gzipSize: true,
        brotliSize: true,
      })
    : null;
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';
  const isAnalyze = process.env.ANALYZE === 'true';

  return {
    plugins: [
      react({
        // React optimization options
        babel: {
          plugins: [
            // Remove prop-types in production
            ...(isProduction ? [['babel-plugin-transform-remove-console']] : []),
          ],
        },
      }),
      
      // Vendor chunk splitting
      splitVendorChunkPlugin(),
      
      // Compression plugins for production
      ...(isProduction ? [
        compression({
          algorithm: 'gzip',
          threshold: 1024,
        }),
        compression({
          algorithm: 'brotliCompress',
          ext: '.br',
          threshold: 1024,
        }),
      ] : []),
      
      // Bundle analyzer
      bundleAnalyzer(),
    ].filter(Boolean),
    
    build: {
      outDir: 'dist',
      sourcemap: isProduction ? false : true,
      minify: isProduction ? 'terser' : false,
      
      // Terser options for better compression
      terserOptions: isProduction ? {
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.info', 'console.debug'],
        },
        mangle: {
          safari10: true,
        },
        format: {
          comments: false,
        },
      } : undefined,
      
      rollupOptions: {
        output: {
          // Manual chunking strategy for optimal loading
          manualChunks: (id) => {
            // Vendor dependencies
            if (id.includes('node_modules')) {
              // React ecosystem
              if (id.includes('react') || id.includes('react-dom')) {
                return 'react-vendor';
              }
              
              // Material-UI and emotion (heavy UI library)
              if (id.includes('@mui') || id.includes('@emotion')) {
                return 'ui-vendor';
              }
              
              // Map libraries
              if (id.includes('leaflet') || id.includes('react-leaflet')) {
                return 'map-vendor';
              }
              
              // Database and worker libraries
              if (id.includes('sql.js') || id.includes('sql.js-httpvfs')) {
                return 'database-vendor';
              }
              
              // Router
              if (id.includes('react-router')) {
                return 'router-vendor';
              }
              
              // Charts and visualization
              if (id.includes('recharts') || id.includes('d3')) {
                return 'charts-vendor';
              }
              
              // i18n
              if (id.includes('i18next')) {
                return 'i18n-vendor';
              }
              
              // Other vendor packages
              return 'vendor';
            }
            
            // Application code chunking
            
            // Components
            if (id.includes('src/components')) {
              return 'components';
            }
            
            // Pages
            if (id.includes('src/pages')) {
              return 'pages';
            }
            
            // Services
            if (id.includes('src/services') || id.includes('src/utils')) {
              return 'services';
            }
            
            // Types and constants
            if (id.includes('src/types') || id.includes('src/constants')) {
              return 'shared';
            }
          },
          
          // Optimize chunk file names
          chunkFileNames: (chunkInfo) => {
            const facadeModuleId = chunkInfo.facadeModuleId 
              ? chunkInfo.facadeModuleId.split('/').pop().replace('.tsx', '').replace('.ts', '') 
              : 'chunk';
            
            return `assets/[name]-[hash].js`;
          },
          
          // Asset file names
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name.split('.');
            const ext = info[info.length - 1];
            
            if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(assetInfo.name)) {
              return `assets/images/[name]-[hash][extname]`;
            }
            
            if (/\.(css)$/i.test(assetInfo.name)) {
              return `assets/css/[name]-[hash][extname]`;
            }
            
            if (/\.(woff2?|eot|ttf|otf)$/i.test(assetInfo.name)) {
              return `assets/fonts/[name]-[hash][extname]`;
            }
            
            return `assets/[name]-[hash][extname]`;
          },
        },
        
        // External dependencies (CDN)
        external: isProduction ? [] : [],
      },
      
      // Chunk size warning limit
      chunkSizeWarningLimit: 1000,
      
      // Asset inlining threshold
      assetsInlineLimit: 4096,
      
      // CSS code splitting
      cssCodeSplit: true,
      
      // Target modern browsers for better optimization
      target: isProduction ? 'esnext' : 'modules',
      
      // Copy public directory
      copyPublicDir: true,
    },
    
    optimizeDeps: {
      // Include dependencies for faster dev startup
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        '@mui/material',
        '@mui/icons-material',
        '@emotion/react',
        '@emotion/styled',
        'leaflet',
        'react-leaflet',
      ],
      
      // Exclude problematic dependencies
      exclude: [
        'sql.js',
        'sql.js-httpvfs',
      ],
      
      // Force optimization of specific packages
      force: isProduction,
    },
    
    // Worker configuration
    worker: {
      format: 'es',
      plugins: [react()],
      rollupOptions: {
        output: {
          entryFileNames: 'assets/workers/[name]-[hash].js',
        },
      },
    },
    
    // Path resolution
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
        '@components': resolve(__dirname, 'src/components'),
        '@pages': resolve(__dirname, 'src/pages'),
        '@services': resolve(__dirname, 'src/services'),
        '@utils': resolve(__dirname, 'src/utils'),
        '@types': resolve(__dirname, 'src/types'),
        '@assets': resolve(__dirname, 'src/assets'),
      },
    },
    
    // Development server configuration
    server: {
      port: 3000,
      open: true,
      cors: true,
      
      // Proxy configuration for API requests
      proxy: {
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
        },
      },
      
      // HMR configuration
      hmr: {
        overlay: true,
      },
    },
    
    // Preview server configuration
    preview: {
      port: 3001,
      open: true,
    },
    
    // Base URL for GitHub Pages
    base: process.env.NODE_ENV === 'production' ? '/archi-site/' : '/',
    
    // Define global constants
    define: {
      __DEV__: mode === 'development',
      __PROD__: mode === 'production',
      __VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
    },
    
    // CSS configuration
    css: {
      modules: {
        // CSS modules configuration
        localsConvention: 'camelCase',
      },
      preprocessorOptions: {
        scss: {
          additionalData: `@import "@/styles/variables.scss";`,
        },
      },
      // PostCSS configuration
      postcss: {
        plugins: [
          // Add autoprefixer and other PostCSS plugins as needed
        ],
      },
    },
    
    // JSON configuration
    json: {
      namedExports: true,
      stringify: false,
    },
    
    // Environment variables
    envPrefix: 'VITE_',
    
    // Logging
    logLevel: isProduction ? 'warn' : 'info',
    
    // Clear screen on rebuild
    clearScreen: false,
  };
});

// Export type for TypeScript
export interface ViteConfigOptions {
  mode: string;
  command: 'build' | 'serve';
}