import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: true,
    // Disable minification to prevent function name mangling issues
    minify: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          map: ['leaflet', 'react-leaflet'],
          ui: ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
          database: ['sql.js', 'sql.js-httpvfs'],
        },
      },
    },
    target: 'esnext',
    copyPublicDir: true,
  },
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      'react-router-dom',
      'leaflet',
      'react-leaflet',
      '@mui/material',
      '@mui/icons-material',
      'sql.js-httpvfs',
    ],
    exclude: ['sql.js'],
  },
  worker: {
    format: 'es',
    plugins: [react()],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  base: '/archi-site/', // Required for GitHub Pages with repository name
});