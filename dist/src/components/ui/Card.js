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
exports.Card = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const material_1 = require("@mui/material");
/**
 * Card component with consistent styling for displaying information
 */
const Card = (_a) => {
    var { title, subheader, image, imageHeight = 140, imageAlt = '', actions, children } = _a, props = __rest(_a, ["title", "subheader", "image", "imageHeight", "imageAlt", "actions", "children"]);
    return ((0, jsx_runtime_1.jsxs)(material_1.Card, Object.assign({}, props, { children: [title && ((0, jsx_runtime_1.jsx)(material_1.CardHeader, { title: title, subheader: subheader })), image && ((0, jsx_runtime_1.jsx)(material_1.CardMedia, { component: "img", height: imageHeight, image: image, alt: imageAlt })), (0, jsx_runtime_1.jsx)(material_1.CardContent, { children: children }), actions && ((0, jsx_runtime_1.jsx)(material_1.CardActions, { children: actions }))] })));
};
exports.Card = Card;
exports.default = exports.Card;
