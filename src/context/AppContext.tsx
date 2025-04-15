import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import useDatabase from '../hooks/useDatabase';

interface AppContextProps {
  // Database access
  db: ReturnType<typeof useDatabase>;
  
  // Theme state
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  
  // Language settings
  language: 'ja' | 'en';
  setLanguage: (lang: 'ja' | 'en') => void;
  
  // Global search state
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  
  // Filter state
  filters: Record<string, string | string[]>;
  addFilter: (key: string, value: string | string[]) => void;
  removeFilter: (key: string) => void;
  clearFilters: () => void;

  // Loading state
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  
  // Error handling
  error: Error | null;
  setError: (error: Error | null) => void;
  clearError: () => void;
}

// Creating context with default values
const AppContext = createContext<AppContextProps>({
  db: {} as ReturnType<typeof useDatabase>, // Will be properly initialized in provider
  isDarkMode: false,
  toggleDarkMode: () => {},
  language: 'ja',
  setLanguage: () => {},
  searchTerm: '',
  setSearchTerm: () => {},
  filters: {},
  addFilter: () => {},
  removeFilter: () => {},
  clearFilters: () => {},
  isLoading: false,
  setIsLoading: () => {},
  error: null,
  setError: () => {},
  clearError: () => {},
});

// Get user's preferred color scheme
const getPreferredColorScheme = (): boolean => {
  // Check if preference is stored in localStorage
  const storedPreference = localStorage.getItem('darkMode');
  if (storedPreference !== null) {
    return storedPreference === 'true';
  }
  
  // Check system preference
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
};

// Get user's preferred language
const getPreferredLanguage = (): 'ja' | 'en' => {
  const storedLanguage = localStorage.getItem('language');
  if (storedLanguage === 'en' || storedLanguage === 'ja') {
    return storedLanguage;
  }
  
  // Default to Japanese
  return 'ja';
};

interface AppProviderProps {
  children: ReactNode;
}

// Context Provider component
export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  // Database hook
  const db = useDatabase();
  
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(getPreferredColorScheme());
  
  // Language state
  const [language, setLanguageState] = useState<'ja' | 'en'>(getPreferredLanguage());
  
  // Search state
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Filter state
  const [filters, setFilters] = useState<Record<string, string | string[]>>({});
  
  // Loading state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Error state
  const [error, setError] = useState<Error | null>(null);

  // Toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode(prev => {
      const newValue = !prev;
      localStorage.setItem('darkMode', String(newValue));
      return newValue;
    });
  };

  // Set language with persistence
  const setLanguage = (lang: 'ja' | 'en') => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  // Add or update a filter
  const addFilter = (key: string, value: string | string[]) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Remove a filter
  const removeFilter = (key: string) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({});
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  // Apply theme effect when it changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    document.body.classList.toggle('dark-mode', isDarkMode);
  }, [isDarkMode]);

  // Apply language effect when it changes
  useEffect(() => {
    document.documentElement.setAttribute('lang', language);
  }, [language]);

  // Context value
  const value: AppContextProps = {
    db,
    isDarkMode,
    toggleDarkMode,
    language,
    setLanguage,
    searchTerm,
    setSearchTerm,
    filters,
    addFilter,
    removeFilter,
    clearFilters,
    isLoading,
    setIsLoading,
    error,
    setError,
    clearError
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// Custom hook for using the context
export const useApp = (): AppContextProps => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export default AppContext;