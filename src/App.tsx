import React, { useEffect, useState, Suspense, lazy } from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { HelmetProvider } from 'react-helmet-async';
import { Box, Alert, Snackbar, CircularProgress, useMediaQuery } from '@mui/material';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import ArchitecturePage from './pages/ArchitecturePage';
import ArchitectureSinglePage from './pages/ArchitectureSinglePage';
import ArchitectsPage from './pages/ArchitectsPage';
import ArchitectSinglePage from './pages/ArchitectSinglePage';
import MapPage from './pages/MapPage';
import ResearchPage from './pages/ResearchPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ErrorBoundary from './components/ErrorBoundary';
import { SkipLink } from './components/accessibility/SkipLink';
import { AriaLiveRegion } from './utils/accessibility';
import { logDatabaseDetails } from './utils/dbUtils';
import DatabaseLoader from './components/DatabaseLoader';
import { theme } from './styles/theme';
import { mobileTheme, isMobileDevice, isTouchDevice } from './styles/mobileTheme';
import { register as registerSW, useServiceWorkerStatus } from './utils/serviceWorker';
import './i18n'; // Initialize i18n

// Lazy load the enhanced architects page for better performance
const EnhancedArchitectsPage = lazy(() => import('./pages/EnhancedArchitectsPage'));

/**
 * ScrollToTop component - scrolls to top when route changes
 */
const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  
  return null;
};

/**
 * Main application component with routing and providers
 */
const AppContent: React.FC = () => {
  const [announcement, setAnnouncement] = useState('');
  const [showOfflineAlert, setShowOfflineAlert] = useState(false);
  const [showUpdateAlert, setShowUpdateAlert] = useState(false);
  const swStatus = useServiceWorkerStatus();
  
  // Log database configuration information when app starts
  useEffect(() => {
    // Log if app is running in GitHub Pages production environment
    const isProduction = import.meta.env?.PROD || false;
    console.log(`App running in ${isProduction ? 'production' : 'development'} mode`);
    
    // Log database configuration details for debugging purposes
    try {
      logDatabaseDetails();
    } catch (error) {
      console.warn('Failed to log database details:', error);
    }
    
    // Initialize accessibility announcements
    setAnnouncement('アプリケーションが読み込まれました');
  }, []);
  
  // Handle service worker status changes
  useEffect(() => {
    if (!swStatus.isOnline && !showOfflineAlert) {
      setShowOfflineAlert(true);
      setAnnouncement('オフライン状態です。一部の機能が制限される場合があります。');
    } else if (swStatus.isOnline && showOfflineAlert) {
      setShowOfflineAlert(false);
      setAnnouncement('オンライン状態に戻りました。');
    }
    
    if (swStatus.hasUpdate && !showUpdateAlert) {
      setShowUpdateAlert(true);
      setAnnouncement('新しいバージョンが利用可能です。ページを再読み込みしてください。');
    }
  }, [swStatus, showOfflineAlert, showUpdateAlert]);

  const handleUpdateApp = () => {
    window.location.reload();
  };

  const handleCloseOfflineAlert = () => {
    setShowOfflineAlert(false);
  };

  const handleCloseUpdateAlert = () => {
    setShowUpdateAlert(false);
  };

  return (
    <>
      {/* Skip Links for Accessibility */}
      <SkipLink href="#main-content">メインコンテンツへスキップ</SkipLink>
      <SkipLink href="#navigation">ナビゲーションへスキップ</SkipLink>
      
      {/* ARIA Live Region for Screen Readers */}
      <AriaLiveRegion message={announcement} level="polite" />
      
      <ScrollToTop />
      <Header />
      
      <main 
        id="main-content" 
        className="container" 
        role="main"
        tabIndex={-1}
        style={{ outline: 'none' }}
      >
        <ErrorBoundary>
          <Suspense 
            fallback={
              <Box 
                display="flex" 
                justifyContent="center" 
                alignItems="center" 
                minHeight="200px"
                role="status"
                aria-label="ページを読み込み中"
              >
                <CircularProgress />
              </Box>
            }
          >
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/architecture" element={<ArchitecturePage />} />
              <Route path="/architecture/:id" element={<ArchitectureSinglePage />} />
              <Route path="/architects" element={<ArchitectsPage />} />
              <Route path="/architects/enhanced" element={<EnhancedArchitectsPage />} />
              <Route path="/architects/:id" element={<ArchitectSinglePage />} />
              <Route path="/map" element={<MapPage />} />
              <Route path="/research" element={<ResearchPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>
      
      <Footer />
      
      {/* Service Worker Status Notifications */}
      <Snackbar
        open={showOfflineAlert}
        onClose={handleCloseOfflineAlert}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        autoHideDuration={null}
      >
        <Alert 
          severity="warning" 
          onClose={handleCloseOfflineAlert}
          variant="filled"
          sx={{ width: '100%' }}
        >
          オフライン状態です。キャッシュされたコンテンツを表示しています。
        </Alert>
      </Snackbar>
      
      <Snackbar
        open={showUpdateAlert}
        onClose={handleCloseUpdateAlert}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        autoHideDuration={null}
      >
        <Alert 
          severity="info" 
          onClose={handleCloseUpdateAlert}
          action={
            <Box sx={{ display: 'flex', gap: 1 }}>
              <button 
                onClick={handleUpdateApp}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'white',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                更新
              </button>
            </Box>
          }
          variant="filled"
          sx={{ width: '100%' }}
        >
          新しいバージョンが利用可能です。
        </Alert>
      </Snackbar>
    </>
  );
};

const App: React.FC = () => {
  const [selectedTheme, setSelectedTheme] = useState(theme);
  const isMobile = useMediaQuery('(max-width:600px)');
  const isTouch = isTouchDevice();

  // Select appropriate theme based on device capabilities
  useEffect(() => {
    if (isMobile || isTouch) {
      setSelectedTheme(mobileTheme);
    } else {
      setSelectedTheme(theme);
    }
  }, [isMobile, isTouch]);

  // Initialize service worker and accessibility features
  useEffect(() => {
    // Register service worker for offline functionality
    registerSW({
      onSuccess: () => {
        console.log('Service worker registered successfully');
      },
      onUpdate: () => {
        console.log('Service worker update available');
      },
      onOfflineReady: () => {
        console.log('App ready for offline use');
      },
      onError: (error) => {
        console.error('Service worker registration failed:', error);
      }
    });

    // Initialize axe-core for accessibility testing in development
    if (import.meta.env.DEV) {
      import('@axe-core/react').then(axe => {
        axe.default(React, undefined, 1000);
      });
    }

    // Announce app load to screen readers
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.style.position = 'absolute';
    announcement.style.left = '-10000px';
    announcement.textContent = '建築データベースアプリケーションが読み込まれました';
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }, []);

  return (
    <ErrorBoundary>
      <HelmetProvider>
        <ThemeProvider theme={selectedTheme}>
          <CssBaseline />
          <HashRouter>
            <DatabaseLoader>
              <AppContent />
            </DatabaseLoader>
          </HashRouter>
        </ThemeProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
};

export default App;