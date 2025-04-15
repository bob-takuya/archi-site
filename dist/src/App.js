"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_router_dom_1 = require("react-router-dom");
const styles_1 = require("@mui/material/styles");
const CssBaseline_1 = __importDefault(require("@mui/material/CssBaseline"));
const Box_1 = __importDefault(require("@mui/material/Box"));
const Container_1 = __importDefault(require("@mui/material/Container"));
const AppContext_1 = require("./context/AppContext");
const AppContext_2 = require("./context/AppContext");
const Header_1 = __importDefault(require("./components/Header"));
const Footer_1 = __importDefault(require("./components/Footer"));
const HomePage_1 = __importDefault(require("./pages/HomePage"));
const ArchitecturePage_1 = __importDefault(require("./pages/ArchitecturePage"));
const ArchitectureSinglePage_1 = __importDefault(require("./pages/ArchitectureSinglePage"));
const ArchitectsPage_1 = __importDefault(require("./pages/ArchitectsPage"));
const ArchitectSinglePage_1 = __importDefault(require("./pages/ArchitectSinglePage"));
const MapPage_1 = __importDefault(require("./pages/MapPage"));
// App theme wrapper component with dark mode support
const AppWithTheme = () => {
    const { isDarkMode } = (0, AppContext_2.useAppContext)();
    // Create theme based on dark mode setting
    const theme = (0, react_1.useMemo)(() => (0, styles_1.createTheme)({
        palette: {
            mode: isDarkMode ? 'dark' : 'light',
            primary: {
                main: '#1976d2',
            },
            secondary: {
                main: isDarkMode ? '#ff5c8d' : '#dc004e',
            },
            background: {
                default: isDarkMode ? '#121212' : '#f5f5f5',
                paper: isDarkMode ? '#1e1e1e' : '#ffffff',
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
        components: {
            MuiAppBar: {
                styleOverrides: {
                    root: {
                        backgroundColor: isDarkMode ? '#1e1e1e' : '#1976d2',
                    },
                },
            },
            MuiCard: {
                styleOverrides: {
                    root: {
                        boxShadow: isDarkMode
                            ? '0 4px 20px rgba(0, 0, 0, 0.5)'
                            : '0 2px 10px rgba(0, 0, 0, 0.1)',
                    },
                },
            },
        },
    }), [isDarkMode]);
    return ((0, jsx_runtime_1.jsxs)(styles_1.ThemeProvider, { theme: theme, children: [(0, jsx_runtime_1.jsx)(CssBaseline_1.default, {}), (0, jsx_runtime_1.jsxs)(Box_1.default, { sx: {
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: theme.palette.background.default,
                }, children: [(0, jsx_runtime_1.jsx)(Header_1.default, {}), (0, jsx_runtime_1.jsx)(Container_1.default, { component: "main", sx: { flex: 1, py: 3 }, children: (0, jsx_runtime_1.jsxs)(react_router_dom_1.Routes, { children: [(0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { path: "/", element: (0, jsx_runtime_1.jsx)(HomePage_1.default, {}) }), (0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { path: "/architecture", element: (0, jsx_runtime_1.jsx)(ArchitecturePage_1.default, {}) }), (0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { path: "/architecture/:id", element: (0, jsx_runtime_1.jsx)(ArchitectureSinglePage_1.default, {}) }), (0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { path: "/architects", element: (0, jsx_runtime_1.jsx)(ArchitectsPage_1.default, {}) }), (0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { path: "/architects/:id", element: (0, jsx_runtime_1.jsx)(ArchitectSinglePage_1.default, {}) }), (0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { path: "/map", element: (0, jsx_runtime_1.jsx)(MapPage_1.default, {}) })] }) }), (0, jsx_runtime_1.jsx)(Footer_1.default, {})] })] }));
};
// Main App component with global context
const App = () => {
    return ((0, jsx_runtime_1.jsx)(AppContext_1.AppProvider, { children: (0, jsx_runtime_1.jsx)(AppWithTheme, {}) }));
};
exports.default = App;
