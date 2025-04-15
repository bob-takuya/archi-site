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
exports.FilterChipGroup = exports.FilterChip = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const material_1 = require("@mui/material");
/**
 * FilterChip component for toggling filters
 */
const FilterChip = (_a) => {
    var { label, selected = false, value, onClick } = _a, props = __rest(_a, ["label", "selected", "value", "onClick"]);
    const handleClick = () => {
        onClick === null || onClick === void 0 ? void 0 : onClick(value);
    };
    return ((0, jsx_runtime_1.jsx)(material_1.Chip, Object.assign({ label: label, color: selected ? 'primary' : 'default', variant: selected ? 'filled' : 'outlined', onClick: handleClick }, props)));
};
exports.FilterChip = FilterChip;
/**
 * FilterChipGroup component for organizing multiple filter chips
 */
const FilterChipGroup = ({ chips, onChange, spacing = 1 }) => {
    return ((0, jsx_runtime_1.jsx)(material_1.Box, { sx: { display: 'flex', flexWrap: 'wrap', gap: spacing }, children: chips.map((chip) => ((0, jsx_runtime_1.jsx)(exports.FilterChip, { label: chip.label, value: chip.value, selected: chip.selected, onClick: onChange }, chip.value))) }));
};
exports.FilterChipGroup = FilterChipGroup;
exports.default = exports.FilterChip;
