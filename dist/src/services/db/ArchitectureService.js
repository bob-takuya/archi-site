"use strict";
/**
 * Architecture Service
 *
 * This service handles all operations related to architecture data,
 * including fetching, filtering, and data transformation.
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getYearsForTag = exports.getAllTags = exports.getMapArchitectures = exports.getArchitectureById = exports.getAllArchitectures = void 0;
const DatabaseConnection_1 = require("./DatabaseConnection");
/**
 * Get all architectures with optional filtering, pagination, and sorting
 */
const getAllArchitectures = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (page = 1, limit = 10, search = '', sort = 'year_desc') {
    const db = yield DatabaseConnection_1.queryDatabase;
    let offset = (page - 1) * limit;
    let whereClause = '';
    let params = [];
    // Handle different search formats
    if (search.startsWith('tag:')) {
        const tagValue = search.substring(4).trim();
        // Handle multiple tags (comma-separated)
        if (tagValue.includes(',')) {
            const tags = tagValue.split(',').map(tag => tag.trim()).filter(tag => tag);
            const likeConditions = tags.map(() => `ZAR_TAG LIKE ?`).join(' OR ');
            whereClause = `WHERE (${likeConditions}) AND ZAR_TAG NOT LIKE '%の追加建築%'`;
            params = tags.map(tag => `%${tag}%`);
        }
        else {
            whereClause = `WHERE ZAR_TAG LIKE ? AND ZAR_TAG NOT LIKE '%の追加建築%'`;
            params = [`%${tagValue}%`];
        }
    }
    // Year search
    else if (search.startsWith('year:')) {
        const yearValue = search.substring(5).trim();
        whereClause = `WHERE ZAR_YEAR = ? AND ZAR_TAG NOT LIKE '%の追加建築%'`;
        params = [yearValue];
    }
    // Prefecture search
    else if (search.startsWith('prefecture:')) {
        const prefectureValue = search.substring(11).trim();
        whereClause = `WHERE ZAR_PREFECTURE = ? AND ZAR_TAG NOT LIKE '%の追加建築%'`;
        params = [prefectureValue];
    }
    // Category search
    else if (search.startsWith('category:')) {
        const categoryValue = search.substring(9).trim();
        const bigCategoryClause = `ZAR_BIGCATEGORY = ?`;
        const categoryClause = `ZAR_CATEGORY = ?`;
        whereClause = `WHERE (${bigCategoryClause} OR ${categoryClause}) AND ZAR_TAG NOT LIKE '%の追加建築%'`;
        params = [categoryValue, categoryValue];
    }
    // Architect search
    else if (search.startsWith('architect:')) {
        const architectValue = search.substring(10).trim();
        // Handle multiple architects (comma-separated)
        if (architectValue.includes(',')) {
            const architectNames = architectValue.split(',').map(name => name.trim());
            const likeConditions = architectNames.map(() => `ZAR_ARCHITECT LIKE ?`).join(' OR ');
            whereClause = `WHERE (${likeConditions}) AND ZAR_TAG NOT LIKE '%の追加建築%'`;
            params = architectNames.map(name => `%${name}%`);
        }
        else {
            whereClause = `WHERE ZAR_ARCHITECT LIKE ? AND ZAR_TAG NOT LIKE '%の追加建築%'`;
            params = [`%${architectValue}%`];
        }
    }
    // General search (across multiple fields)
    else if (search) {
        whereClause = `WHERE (ZAR_TITLE LIKE ? OR ZAR_ADDRESS LIKE ? OR ZAR_PREFECTURE LIKE ? OR ZAR_ARCHITECT LIKE ?) AND ZAR_TAG NOT LIKE '%の追加建築%'`;
        params = [`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`];
    }
    else {
        whereClause = `WHERE ZAR_TAG NOT LIKE '%の追加建築%'`;
    }
    // Configure sorting
    let orderByClause = '';
    switch (sort) {
        case 'year_asc':
            orderByClause = 'ORDER BY ZAR_YEAR ASC';
            break;
        case 'name_asc':
            orderByClause = 'ORDER BY ZAR_TITLE ASC';
            break;
        case 'name_desc':
            orderByClause = 'ORDER BY ZAR_TITLE DESC';
            break;
        case 'architect_asc':
            orderByClause = 'ORDER BY ZAR_ARCHITECT ASC';
            break;
        case 'architect_desc':
            orderByClause = 'ORDER BY ZAR_ARCHITECT DESC';
            break;
        case 'year_desc':
        default:
            orderByClause = 'ORDER BY ZAR_YEAR DESC';
    }
    // Get total count
    const countQuery = `
    SELECT COUNT(*) as total
    FROM ZCDARCHITECTURE
    ${whereClause}
  `;
    try {
        // Use queryDatabase for improved caching
        const countResult = yield (0, DatabaseConnection_1.queryDatabase)(countQuery, params);
        if (!countResult || countResult.length === 0) {
            console.error('Invalid count query result:', countResult);
            return { items: [], total: 0, pages: 0 };
        }
        const total = countResult[0].total;
        // Fetch paginated data
        const query = `
      SELECT 
        Z_PK as id, 
        ZAR_TITLE as name, 
        ZAR_PREFECTURE as city, 
        ZAR_YEAR as completedYear,
        ZAR_ARCHITECT as architectName,
        ZAR_ADDRESS as location
      FROM ZCDARCHITECTURE
      ${whereClause}
      ${orderByClause}
      LIMIT ? OFFSET ?
    `;
        const results = yield (0, DatabaseConnection_1.queryDatabase)(query, [...params, limit, offset]);
        return {
            items: results,
            total,
            pages: Math.ceil(total / limit)
        };
    }
    catch (error) {
        console.error('Error fetching architectures:', error);
        return { items: [], total: 0, pages: 0 };
    }
});
exports.getAllArchitectures = getAllArchitectures;
/**
 * Get architecture details by ID
 */
const getArchitectureById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const query = `
      SELECT 
        ZCDARCHITECTURE.Z_PK as id,
        ZCDARCHITECTURE.ZAR_TITLE as name,
        ZCDARCHITECTURE.ZAR_ADDRESS as location,
        ZCDARCHITECTURE.ZAR_PREFECTURE as city,
        ZCDARCHITECTURE.ZAR_PREFECTURE as country,
        ZCDARCHITECTURE.ZAR_LATITUDE as latitude,
        ZCDARCHITECTURE.ZAR_LONGITUDE as longitude,
        ZCDARCHITECTURE.ZAR_YEAR as completedYear,
        ZCDARCHITECTURE.ZAR_DESCRIPTION as description,
        ZCDARCHITECTURE.ZAR_TAG as tag,
        ZCDARCHITECTURE.ZAR_SHINKENCHIKU_URL as shinkenchikuUrl,
        ZCDARCHITECTURE.ZAR_BIGCATEGORY as bigCategory,
        ZCDARCHITECTURE.ZAR_CATEGORY as category,
        ZCDARCHITECT.Z_PK as architectId,
        ZCDARCHITECT.ZAT_ARCHITECT as architectName
      FROM ZCDARCHITECTURE
      LEFT JOIN ZCDARCHITECT ON ZCDARCHITECTURE.ZAR_ARCHITECT = ZCDARCHITECT.ZAT_ARCHITECT
      WHERE ZCDARCHITECTURE.Z_PK = ?
    `;
        const results = yield (0, DatabaseConnection_1.queryDatabase)(query, [id]);
        if (!results || results.length === 0) {
            return null;
        }
        const item = results[0];
        // Filter out "追加建築" from tags
        if (item.tag) {
            const tags = item.tag.split(',');
            const filteredTags = tags.filter(tag => !tag.includes('の追加建築'));
            item.tag = filteredTags.join(',');
        }
        // Structure architect information
        if (item.architectId && item.architectName) {
            item.architect = {
                id: item.architectId,
                name: item.architectName
            };
            // Remove redundant properties
            delete item.architectId;
            delete item.architectName;
        }
        else {
            item.architect = { id: null, name: null };
        }
        return item;
    }
    catch (error) {
        console.error('Error fetching architecture details:', error);
        return null;
    }
});
exports.getArchitectureById = getArchitectureById;
/**
 * Get architectures for map display
 */
const getMapArchitectures = () => __awaiter(void 0, void 0, void 0, function* () {
    const query = `
    SELECT 
      ZCDARCHITECTURE.Z_PK as id,
      ZCDARCHITECTURE.ZAR_TITLE as name,
      ZCDARCHITECTURE.ZAR_ADDRESS as location,
      ZCDARCHITECTURE.ZAR_PREFECTURE as city,
      ZCDARCHITECTURE.ZAR_LATITUDE as latitude,
      ZCDARCHITECTURE.ZAR_LONGITUDE as longitude,
      ZCDARCHITECT.ZAT_ARCHITECT as architectName,
      ZCDARCHITECTURE.ZAR_YEAR as completedYear
    FROM ZCDARCHITECTURE
    LEFT JOIN ZCDARCHITECT ON ZCDARCHITECTURE.ZAR_ARCHITECT = ZCDARCHITECT.ZAT_ARCHITECT
    WHERE ZCDARCHITECTURE.ZAR_LATITUDE IS NOT NULL
    AND ZCDARCHITECTURE.ZAR_LONGITUDE IS NOT NULL
  `;
    try {
        return yield (0, DatabaseConnection_1.queryDatabase)(query);
    }
    catch (error) {
        console.error('Error fetching map architectures:', error);
        return [];
    }
});
exports.getMapArchitectures = getMapArchitectures;
/**
 * Get all unique tags
 */
const getAllTags = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const query = `
      SELECT DISTINCT ZAR_TAG FROM ZCDARCHITECTURE 
      WHERE ZAR_TAG IS NOT NULL AND ZAR_TAG != ''
    `;
        const results = yield (0, DatabaseConnection_1.queryDatabase)(query);
        // Process and deduplicate tags
        const baseTagsSet = new Set();
        const allTagsWithYears = [];
        results.forEach(row => {
            const tagsStr = row.ZAR_TAG;
            if (tagsStr) {
                const tags = tagsStr.split(',');
                tags.forEach(tag => {
                    const trimmedTag = tag.trim();
                    if (trimmedTag && !trimmedTag.includes('の追加建築')) {
                        // Collect all tags including those with year information
                        allTagsWithYears.push(trimmedTag);
                        // Extract base tags by removing year information
                        let baseTag = trimmedTag;
                        // Remove year/month patterns (e.g., "新建築2014年7月号" -> "新建築")
                        baseTag = baseTag.replace(/\d{4}年\d{1,2}月号?/, '').trim();
                        // Remove year patterns (e.g., "村野藤吾賞2018年" -> "村野藤吾賞")
                        baseTag = baseTag.replace(/\d{4}年度?/, '').trim();
                        // Remove iteration patterns (e.g., "第10回JIA新人賞" -> "JIA新人賞")
                        baseTag = baseTag.replace(/第\d+回/, '').trim();
                        // Remove year in parentheses (e.g., "BCS賞(2018)" -> "BCS賞")
                        baseTag = baseTag.replace(/\(\d{4}\)/, '').trim();
                        if (baseTag) {
                            baseTagsSet.add(baseTag);
                        }
                        else {
                            // Keep original tag if it's only a year or category/year
                            baseTagsSet.add(trimmedTag);
                        }
                    }
                });
            }
        });
        return Array.from(baseTagsSet).sort();
    }
    catch (error) {
        console.error('Error fetching tags:', error);
        return [];
    }
});
exports.getAllTags = getAllTags;
/**
 * Get years for a specific tag
 */
const getYearsForTag = (baseTag) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const query = `
      SELECT DISTINCT ZAR_TAG FROM ZCDARCHITECTURE 
      WHERE ZAR_TAG LIKE ? AND ZAR_TAG NOT LIKE '%の追加建築%'
    `;
        const results = yield (0, DatabaseConnection_1.queryDatabase)(query, [`%${baseTag}%`]);
        if (!results || results.length === 0) {
            return [];
        }
        const yearsSet = new Set();
        results.forEach(row => {
            const tagsStr = row.ZAR_TAG;
            if (tagsStr) {
                const tags = tagsStr.split(',');
                tags.forEach(tag => {
                    const trimmedTag = tag.trim();
                    if (trimmedTag.includes(baseTag) && trimmedTag !== baseTag) {
                        let suffix = '';
                        // Extract year/month pattern
                        const yearMonthMatch = trimmedTag.match(/(\d{4}年\d{1,2}月号?)/);
                        if (yearMonthMatch) {
                            suffix = yearMonthMatch[1];
                        }
                        // Extract year pattern
                        else if (trimmedTag.match(/\d{4}年度?/)) {
                            const match = trimmedTag.match(/(\d{4}年度?)/);
                            if (match)
                                suffix = match[1];
                        }
                        // Extract iteration pattern
                        else if (trimmedTag.match(/第\d+回/)) {
                            const match = trimmedTag.match(/(第\d+回)/);
                            if (match)
                                suffix = match[1];
                        }
                        // Extract year in parentheses
                        else if (trimmedTag.match(/\(\d{4}\)/)) {
                            const match = trimmedTag.match(/(\(\d{4}\))/);
                            if (match)
                                suffix = match[1];
                        }
                        // Extract other differences
                        else {
                            suffix = trimmedTag.replace(baseTag, '').trim();
                        }
                        if (suffix) {
                            yearsSet.add(suffix);
                        }
                    }
                });
            }
        });
        // Sort numerically when possible
        const compareYears = (a, b) => {
            var _a, _b;
            const aNum = (_a = a.match(/\d+/)) === null || _a === void 0 ? void 0 : _a[0];
            const bNum = (_b = b.match(/\d+/)) === null || _b === void 0 ? void 0 : _b[0];
            if (aNum && bNum) {
                return parseInt(aNum, 10) - parseInt(bNum, 10);
            }
            return a.localeCompare(b);
        };
        return Array.from(yearsSet).sort(compareYears);
    }
    catch (error) {
        console.error('Error fetching years for tag:', error);
        return [];
    }
});
exports.getYearsForTag = getYearsForTag;
