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
exports.Button = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const material_1 = require("@mui/material");
/**
 * Button component with consistent styling
 */
const Button = (_a) => {
    var { variant = 'contained', color = 'primary', size = 'medium', children, fullWidth = false } = _a, props = __rest(_a, ["variant", "color", "size", "children", "fullWidth"]);
    return ((0, jsx_runtime_1.jsx)(material_1.Button, Object.assign({ variant: variant, color: color, size: size, fullWidth: fullWidth }, props, { children: children })));
};
exports.Button = Button;
exports.default = exports.Button;
