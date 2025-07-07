import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import ArchitecturePage from './pages/ArchitecturePage';
import ArchitectureSinglePage from './pages/ArchitectureSinglePage';
import ArchitectsPage from './pages/ArchitectsPage';
import ArchitectSinglePage from './pages/ArchitectSinglePage';
import MapPage from './pages/MapPage';
import ErrorBoundary from './components/ErrorBoundary';
import { logDatabaseDetails } from './utils/dbUtils';
import DatabaseLoader from './components/DatabaseLoader';
import { theme } from './styles/theme';

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
  }, []);

  return (
    <>
      <ScrollToTop />
      <Header />
      <main className="container" role="main">
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/architecture" element={<ArchitecturePage />} />
            <Route path="/architecture/:id" element={<ArchitectureSinglePage />} />
            <Route path="/architects" element={<ArchitectsPage />} />
            <Route path="/architects/:id" element={<ArchitectSinglePage />} />
            <Route path="/map" element={<MapPage />} />
          </Routes>
        </ErrorBoundary>
      </main>
      <Footer />
    </>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <HashRouter>
          <DatabaseLoader>
            <AppContent />
          </DatabaseLoader>
        </HashRouter>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;