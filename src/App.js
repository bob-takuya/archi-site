import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import ArchitecturePage from './pages/ArchitecturePage';
import ArchitectureSinglePage from './pages/ArchitectureSinglePage';
import ArchitectsPage from './pages/ArchitectsPage';
import ArchitectSinglePage from './pages/ArchitectSinglePage';
import MapPage from './pages/MapPage';
import DbExplorer from './pages/DbExplorer';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 500,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 500,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 500,
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Header />
      <main className="container">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/architecture" element={<ArchitecturePage />} />
          <Route path="/architecture/:id" element={<ArchitectureSinglePage />} />
          <Route path="/architects" element={<ArchitectsPage />} />
          <Route path="/architects/:id" element={<ArchitectSinglePage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/db-explorer" element={<DbExplorer />} />
        </Routes>
      </main>
      <Footer />
    </ThemeProvider>
  );
}

export default App; 