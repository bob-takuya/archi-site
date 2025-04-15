"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_router_dom_1 = require("react-router-dom");
const material_1 = require("@mui/material");
const Menu_1 = __importDefault(require("@mui/icons-material/Menu"));
const Home_1 = __importDefault(require("@mui/icons-material/Home"));
const AccountBalance_1 = __importDefault(require("@mui/icons-material/AccountBalance"));
const People_1 = __importDefault(require("@mui/icons-material/People"));
const Map_1 = __importDefault(require("@mui/icons-material/Map"));
const Storage_1 = __importDefault(require("@mui/icons-material/Storage"));
const Close_1 = __importDefault(require("@mui/icons-material/Close"));
const navLinks = [
    { title: 'ホーム', path: '/', icon: (0, jsx_runtime_1.jsx)(Home_1.default, {}) },
    { title: '建築作品', path: '/architecture', icon: (0, jsx_runtime_1.jsx)(AccountBalance_1.default, {}) },
    { title: '建築家', path: '/architects', icon: (0, jsx_runtime_1.jsx)(People_1.default, {}) },
    { title: 'マップ', path: '/map', icon: (0, jsx_runtime_1.jsx)(Map_1.default, {}) },
    { title: 'DBエクスプローラー', path: '/db-explorer', icon: (0, jsx_runtime_1.jsx)(Storage_1.default, {}) }
];
const Header = () => {
    const location = (0, react_router_dom_1.useLocation)();
    const pathname = location.pathname;
    const theme = (0, material_1.useTheme)();
    const isMobile = (0, material_1.useMediaQuery)(theme.breakpoints.down('sm'));
    const [drawerOpen, setDrawerOpen] = (0, react_1.useState)(false);
    const toggleDrawer = (open) => (event) => {
        if (event.type === 'keydown' &&
            (event.key === 'Tab' || event.key === 'Shift')) {
            return;
        }
        setDrawerOpen(open);
    };
    return ((0, jsx_runtime_1.jsx)(material_1.AppBar, { position: "static", color: "primary", children: (0, jsx_runtime_1.jsxs)(material_1.Toolbar, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "h6", component: react_router_dom_1.Link, to: "/", sx: {
                        flexGrow: 1,
                        color: 'white',
                        textDecoration: 'none',
                        fontWeight: 'bold'
                    }, children: "\u5EFA\u7BC9\u30C7\u30FC\u30BF\u30D9\u30FC\u30B9" }), isMobile ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(material_1.IconButton, { edge: "end", color: "inherit", "aria-label": "menu", onClick: toggleDrawer(true), children: (0, jsx_runtime_1.jsx)(Menu_1.default, {}) }), (0, jsx_runtime_1.jsx)(material_1.Drawer, { anchor: "right", open: drawerOpen, onClose: toggleDrawer(false), children: (0, jsx_runtime_1.jsxs)(material_1.Box, { sx: { width: 250 }, role: "presentation", onClick: toggleDrawer(false), onKeyDown: toggleDrawer(false), children: [(0, jsx_runtime_1.jsx)(material_1.Box, { sx: { display: 'flex', justifyContent: 'flex-end', p: 1 }, children: (0, jsx_runtime_1.jsx)(material_1.IconButton, { onClick: toggleDrawer(false), children: (0, jsx_runtime_1.jsx)(Close_1.default, {}) }) }), (0, jsx_runtime_1.jsx)(material_1.List, { children: navLinks.map(({ title, path, icon }) => ((0, jsx_runtime_1.jsxs)(material_1.ListItem, { component: react_router_dom_1.Link, to: path, sx: {
                                                color: pathname === path ? 'primary.main' : 'text.primary',
                                                backgroundColor: pathname === path ? 'rgba(0, 0, 0, 0.08)' : 'transparent',
                                                fontWeight: pathname === path ? 'bold' : 'normal',
                                                '&:hover': {
                                                    backgroundColor: 'rgba(0, 0, 0, 0.04)'
                                                }
                                            }, children: [icon, (0, jsx_runtime_1.jsx)(material_1.ListItemText, { primary: title, sx: { ml: 2 } })] }, title))) })] }) })] })) : ((0, jsx_runtime_1.jsx)(material_1.Box, { sx: { display: 'flex' }, children: navLinks.map(({ title, path }) => ((0, jsx_runtime_1.jsx)(material_1.Button, { component: react_router_dom_1.Link, to: path, color: "inherit", sx: {
                            mx: 1,
                            fontWeight: pathname === path ? 'bold' : 'normal',
                            borderBottom: pathname === path ? '2px solid white' : 'none'
                        }, children: title }, title))) }))] }) }));
};
exports.default = Header;
