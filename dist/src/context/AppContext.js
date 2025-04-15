"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useApp = exports.AppProvider = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const db_1 = require("../services/db");
// Creating context with default values
const AppContext = (0, react_1.createContext)({
    isDarkMode: false,
    toggleDarkMode: () => { },
    language: 'ja',
    setLanguage: () => { },
    searchTerm: '',
    setSearchTerm: () => { },
    filters: {},
    addFilter: () => { },
    removeFilter: () => { },
    clearFilters: () => { },
    isLoading: false,
    setIsLoading: () => { },
    error: null,
    setError: () => { },
    clearError: () => { },
});
// Get user's preferred color scheme
const getPreferredColorScheme = () => {
    // Check if preference is stored in localStorage
    const storedPreference = localStorage.getItem('darkMode');
    if (storedPreference !== null) {
        return storedPreference === 'true';
    }
    // Check system preference
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
};
// Get user's preferred language
const getPreferredLanguage = () => {
    const storedLanguage = localStorage.getItem('language');
    if (storedLanguage === 'en' || storedLanguage === 'ja') {
        return storedLanguage;
    }
    // Default to Japanese
    return 'ja';
};
// Context Provider component
const AppProvider = ({ children }) => {
    // Theme state
    const [isDarkMode, setIsDarkMode] = (0, react_1.useState)(getPreferredColorScheme());
    // Language state
    const [language, setLanguageState] = (0, react_1.useState)(getPreferredLanguage());
    // Search state
    const [searchTerm, setSearchTerm] = (0, react_1.useState)('');
    // Filter state
    const [filters, setFilters] = (0, react_1.useState)({});
    // Loading state
    const [isLoading, setIsLoading] = (0, react_1.useState)(false);
    // Error state
    const [error, setError] = (0, react_1.useState)(null);
    // Toggle dark mode
    const toggleDarkMode = () => {
        setIsDarkMode(prev => {
            const newValue = !prev;
            localStorage.setItem('darkMode', String(newValue));
            return newValue;
        });
    };
    // Set language with persistence
    const setLanguage = (lang) => {
        setLanguageState(lang);
        localStorage.setItem('language', lang);
    };
    // Add or update a filter
    const addFilter = (key, value) => {
        setFilters(prev => (Object.assign(Object.assign({}, prev), { [key]: value })));
    };
    // Remove a filter
    const removeFilter = (key) => {
        setFilters(prev => {
            const newFilters = Object.assign({}, prev);
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
    (0, react_1.useEffect)(() => {
        document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
        document.body.classList.toggle('dark-mode', isDarkMode);
    }, [isDarkMode]);
    // Apply language effect when it changes
    (0, react_1.useEffect)(() => {
        document.documentElement.setAttribute('lang', language);
    }, [language]);
    // Clean up database connection on unmount
    (0, react_1.useEffect)(() => {
        return () => {
            (0, db_1.closeDatabase)().catch(console.error);
        };
    }, []);
    // Context value
    const value = {
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
    return (0, jsx_runtime_1.jsx)(AppContext.Provider, { value: value, children: children });
};
exports.AppProvider = AppProvider;
// Custom hook for using the context
const useApp = () => {
    const context = (0, react_1.useContext)(AppContext);
    if (context === undefined) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
};
exports.useApp = useApp;
exports.default = AppContext;
