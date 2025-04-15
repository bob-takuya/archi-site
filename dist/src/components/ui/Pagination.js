"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Pagination = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const material_1 = require("@mui/material");
/**
 * Pagination component with consistent styling and simplified props
 */
const Pagination = (_a) => {
    var { page, count, onChange, showFirstButton = true, showLastButton = true, size = 'medium' } = _a, props = __rest(_a, ["page", "count", "onChange", "showFirstButton", "showLastButton", "size"]);
    const handleChange = (event, value) => {
        onChange(value);
    };
    return ((0, jsx_runtime_1.jsx)(material_1.Box, { sx: { display: 'flex', justifyContent: 'center', my: 3 }, children: (0, jsx_runtime_1.jsx)(material_1.Pagination, Object.assign({ page: page, count: count, onChange: handleChange, showFirstButton: showFirstButton, showLastButton: showLastButton, size: size }, props)) }));
};
exports.Pagination = Pagination;
exports.default = exports.Pagination;
