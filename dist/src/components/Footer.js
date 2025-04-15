"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const material_1 = require("@mui/material");
const Footer = () => {
    return ((0, jsx_runtime_1.jsx)(material_1.Box, { component: "footer", sx: {
            py: 3,
            px: 2,
            mt: 'auto',
            backgroundColor: 'primary.main',
            color: 'white',
        }, children: (0, jsx_runtime_1.jsx)(material_1.Container, { maxWidth: "sm", children: (0, jsx_runtime_1.jsxs)(material_1.Typography, { variant: "body1", align: "center", children: ["\u5EFA\u7BC9\u30C7\u30FC\u30BF\u30D9\u30FC\u30B9 \u00A9 ", new Date().getFullYear()] }) }) }));
};
exports.default = Footer;
