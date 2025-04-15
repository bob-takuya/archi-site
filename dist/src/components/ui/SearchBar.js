"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchBar = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importStar(require("react"));
const material_1 = require("@mui/material");
const Search_1 = __importDefault(require("@mui/icons-material/Search"));
const Clear_1 = __importDefault(require("@mui/icons-material/Clear"));
/**
 * SearchBar component for searching content
 */
const SearchBar = ({ placeholder = '検索', value = '', onChange, onSearch, fullWidth = true, variant = 'outlined', size = 'medium', ariaLabel = '検索', }) => {
    const [inputValue, setInputValue] = (0, react_1.useState)(value);
    // Update internal state when external value changes
    react_1.default.useEffect(() => {
        setInputValue(value);
    }, [value]);
    // Handle input changes
    const handleChange = (0, react_1.useCallback)((e) => {
        const newValue = e.target.value;
        setInputValue(newValue);
        onChange === null || onChange === void 0 ? void 0 : onChange(newValue);
    }, [onChange]);
    // Handle search submission
    const handleSearch = (0, react_1.useCallback)(() => {
        onSearch === null || onSearch === void 0 ? void 0 : onSearch(inputValue);
    }, [inputValue, onSearch]);
    // Handle clear button click
    const handleClear = (0, react_1.useCallback)(() => {
        setInputValue('');
        onChange === null || onChange === void 0 ? void 0 : onChange('');
        onSearch === null || onSearch === void 0 ? void 0 : onSearch('');
    }, [onChange, onSearch]);
    // Handle Enter key press
    const handleKeyDown = (0, react_1.useCallback)((e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    }, [handleSearch]);
    // Style variations based on props
    const getElevation = () => {
        switch (variant) {
            case 'elevated':
                return 3;
            case 'filled':
                return 0;
            case 'outlined':
            default:
                return 1;
        }
    };
    // Size variations
    const getSizeProps = () => {
        switch (size) {
            case 'small':
                return { sx: { py: 0.5, px: 1 } };
            case 'large':
                return { sx: { py: 1.5, px: 2 } };
            case 'medium':
            default:
                return { sx: { py: 1, px: 1.5 } };
        }
    };
    return ((0, jsx_runtime_1.jsxs)(material_1.Paper, { component: "form", elevation: getElevation(), sx: Object.assign({ display: 'flex', alignItems: 'center', width: fullWidth ? '100%' : 'auto', border: variant === 'outlined' ? 1 : 0, borderColor: 'divider', backgroundColor: variant === 'filled' ? 'action.hover' : 'background.paper' }, getSizeProps().sx), children: [(0, jsx_runtime_1.jsx)(material_1.InputBase, { sx: { ml: 1, flex: 1 }, placeholder: placeholder, inputProps: { 'aria-label': ariaLabel }, value: inputValue, onChange: handleChange, onKeyDown: handleKeyDown, fullWidth: fullWidth }), inputValue && ((0, jsx_runtime_1.jsx)(material_1.Tooltip, { title: "\u30AF\u30EA\u30A2", children: (0, jsx_runtime_1.jsx)(material_1.IconButton, { size: "small", "aria-label": "clear", onClick: handleClear, children: (0, jsx_runtime_1.jsx)(Clear_1.default, {}) }) })), (0, jsx_runtime_1.jsx)(material_1.Tooltip, { title: "\u691C\u7D22", children: (0, jsx_runtime_1.jsx)(material_1.IconButton, { size: "small", "aria-label": "search", onClick: handleSearch, children: (0, jsx_runtime_1.jsx)(Search_1.default, {}) }) })] }));
};
exports.SearchBar = SearchBar;
exports.default = exports.SearchBar;
