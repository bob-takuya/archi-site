"use strict";
/**
 * Architect Service
 *
 * This service handles all operations related to architect data,
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
exports.getArchitectTags = exports.getArchitectById = exports.getAllArchitects = void 0;
const DatabaseConnection_1 = require("./DatabaseConnection");
/**
 * Get all architects with optional filtering, pagination, and sorting
 */
const getAllArchitects = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (page = 1, limit = 10, searchTerm = '', selectedTags = [], sortBy = 'name', sortOrder = 'asc', nationality = '', category = '', school = '', birthYearFrom = 0, birthYearTo = 0, deathYear = 0) {
    try {
        const offset = (page - 1) * limit;
        let query = `
      SELECT 
        Z_PK as id,
        ZAT_ARCHITECT as name,
        ZAT_NATIONALITY as nationality,
        ZAT_BIRTHYEAR as birthYear,
        ZAT_DEATHYEAR as deathYear,
        ZAT_DESCRIPTION as bio,
        ZAT_OFFICE as office,
        ZAT_ARCHITECT_EN as nameEn,
        ZAT_PREFECTURE as prefecture,
        ZAT_WEBSITE as website,
        ZAT_CATEGORY as category,
        ZAT_SCHOOL as school
      FROM ZCDARCHITECT
      WHERE 1=1
    `;
        // Build parameters array for the query
        const params = [];
        if (searchTerm) {
            query += ` AND (ZAT_ARCHITECT LIKE ? OR ZAT_OFFICE LIKE ? OR ZAT_ARCHITECT_EN LIKE ?)`;
            params.push(`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`);
        }
        // Handle tag filtering
        if (selectedTags.length > 0) {
            for (const tag of selectedTags) {
                if (tag.startsWith('nationality:')) {
                    const nationalityTag = tag.substring(12);
                    if (!nationality) { // Don't override direct nationality parameter
                        query += ` AND ZAT_NATIONALITY = ?`;
                        params.push(nationalityTag);
                    }
                }
                else if (tag.startsWith('born:')) {
                    const decade = tag.substring(5).replace('s', '');
                    if (birthYearFrom === 0 && birthYearTo === 0) {
                        const startYear = parseInt(decade);
                        const endYear = startYear + 9;
                        query += ` AND ZAT_BIRTHYEAR >= ? AND ZAT_BIRTHYEAR <= ?`;
                        params.push(startYear, endYear);
                    }
                }
                else if (tag.startsWith('died:')) {
                    const year = tag.substring(5);
                    if (deathYear === 0) {
                        query += ` AND ZAT_DEATHYEAR = ?`;
                        params.push(parseInt(year));
                    }
                }
                else if (tag.startsWith('category:')) {
                    const categoryTag = tag.substring(9);
                    if (!category) {
                        query += ` AND ZAT_CATEGORY = ?`;
                        params.push(categoryTag);
                    }
                }
                else if (tag.startsWith('school:')) {
                    const schoolTag = tag.substring(7);
                    if (!school) {
                        query += ` AND ZAT_SCHOOL = ?`;
                        params.push(schoolTag);
                    }
                }
            }
        }
        // Apply direct filtering parameters
        if (nationality) {
            query += ` AND ZAT_NATIONALITY = ?`;
            params.push(nationality);
        }
        if (category) {
            query += ` AND ZAT_CATEGORY = ?`;
            params.push(category);
        }
        if (school) {
            query += ` AND ZAT_SCHOOL = ?`;
            params.push(school);
        }
        if (birthYearFrom > 0) {
            query += ` AND ZAT_BIRTHYEAR >= ?`;
            params.push(birthYearFrom);
        }
        if (birthYearTo > 0) {
            query += ` AND ZAT_BIRTHYEAR <= ?`;
            params.push(birthYearTo);
        }
        if (deathYear > 0) {
            query += ` AND ZAT_DEATHYEAR = ?`;
            params.push(deathYear);
        }
        // Set up sorting
        let orderColumn = 'ZAT_ARCHITECT';
        if (sortBy === 'birthYear') {
            orderColumn = 'ZAT_BIRTHYEAR';
        }
        else if (sortBy === 'nationality') {
            orderColumn = 'ZAT_NATIONALITY';
        }
        else if (sortBy === 'office') {
            orderColumn = 'ZAT_OFFICE';
        }
        query += ` ORDER BY ${orderColumn} ${sortOrder === 'desc' ? 'DESC' : 'ASC'}`;
        // Get total count with the same filters
        const countQuery = `
      SELECT COUNT(*) as total 
      FROM ZCDARCHITECT 
      WHERE 1=1
      ${searchTerm ? ` AND (ZAT_ARCHITECT LIKE ? OR ZAT_OFFICE LIKE ? OR ZAT_ARCHITECT_EN LIKE ?)` : ''}
      ${nationality ? ` AND ZAT_NATIONALITY = ?` : ''}
      ${category ? ` AND ZAT_CATEGORY = ?` : ''}
      ${school ? ` AND ZAT_SCHOOL = ?` : ''}
      ${birthYearFrom > 0 ? ` AND ZAT_BIRTHYEAR >= ?` : ''}
      ${birthYearTo > 0 ? ` AND ZAT_BIRTHYEAR <= ?` : ''}
      ${deathYear > 0 ? ` AND ZAT_DEATHYEAR = ?` : ''}
    `;
        const countResult = yield (0, DatabaseConnection_1.queryDatabase)(countQuery, params);
        if (!countResult || countResult.length === 0) {
            console.error('Invalid count query result:', countResult);
            return { items: [], total: 0, page, totalPages: 0 };
        }
        const total = countResult[0].total;
        // Apply pagination to the main query
        query += ` LIMIT ? OFFSET ?`;
        params.push(limit, offset);
        // Execute main query
        const results = yield (0, DatabaseConnection_1.queryDatabase)(query, params);
        return {
            items: results,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        };
    }
    catch (error) {
        console.error('Error fetching architects:', error);
        return { items: [], total: 0, page, totalPages: 0 };
    }
});
exports.getAllArchitects = getAllArchitects;
/**
 * Get architect details by ID
 */
const getArchitectById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Get basic architect information
        const architectQuery = `
      SELECT 
        Z_PK as id,
        ZAT_ARCHITECT as name,
        ZAT_NATIONALITY as nationality,
        ZAT_BIRTHYEAR as birthYear,
        ZAT_DEATHYEAR as deathYear,
        ZAT_DESCRIPTION as bio,
        ZAT_OFFICE as office,
        ZAT_ARCHITECT_EN as nameEn,
        ZAT_PREFECTURE as prefecture,
        ZAT_WEBSITE as website,
        ZAT_SCHOOL as school,
        ZAT_FACULTY as faculty,
        ZAT_SCHOOL_ABROAD as schoolAbroad,
        ZAT_TEACHER1 as teacher1,
        ZAT_TEACHER2 as teacher2,
        ZAT_TEACHER3 as teacher3,
        ZAT_CATEGORY as category
      FROM ZCDARCHITECT 
      WHERE Z_PK = ?
    `;
        const architectResult = yield (0, DatabaseConnection_1.queryDatabase)(architectQuery, [id]);
        if (!architectResult || architectResult.length === 0) {
            console.error('Architect not found:', id);
            return null;
        }
        const architect = architectResult[0];
        // Get architect's works
        if (architect.name) {
            const worksQuery = `
        SELECT 
          Z_PK as id,
          ZAR_TITLE as name,
          ZAR_ADDRESS as location,
          ZAR_PREFECTURE as city,
          ZAR_YEAR as completedYear,
          ZAR_LATITUDE as latitude,
          ZAR_LONGITUDE as longitude,
          ZAR_TAG as tag
        FROM ZCDARCHITECTURE
        WHERE ZAR_ARCHITECT = ?
        ORDER BY ZAR_YEAR DESC
      `;
            const worksResult = yield (0, DatabaseConnection_1.queryDatabase)(worksQuery, [architect.name]);
            architect.works = worksResult || [];
        }
        else {
            architect.works = [];
        }
        return architect;
    }
    catch (error) {
        console.error('Error fetching architect details:', error);
        return null;
    }
});
exports.getArchitectById = getArchitectById;
/**
 * Get architect tags for filtering
 */
const getArchitectTags = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const tags = new Set();
        // Get nationality tags
        const nationalityQuery = `SELECT DISTINCT ZAT_NATIONALITY FROM ZCDARCHITECT WHERE ZAT_NATIONALITY IS NOT NULL AND ZAT_NATIONALITY <> ''`;
        const nationalityResults = yield (0, DatabaseConnection_1.queryDatabase)(nationalityQuery);
        nationalityResults.forEach(row => {
            tags.add(`nationality:${row.ZAT_NATIONALITY}`);
        });
        // Get category tags
        const categoryQuery = `SELECT DISTINCT ZAT_CATEGORY FROM ZCDARCHITECT WHERE ZAT_CATEGORY IS NOT NULL AND ZAT_CATEGORY <> ''`;
        const categoryResults = yield (0, DatabaseConnection_1.queryDatabase)(categoryQuery);
        categoryResults.forEach(row => {
            tags.add(`category:${row.ZAT_CATEGORY}`);
        });
        // Get school tags
        const schoolQuery = `SELECT DISTINCT ZAT_SCHOOL FROM ZCDARCHITECT WHERE ZAT_SCHOOL IS NOT NULL AND ZAT_SCHOOL <> ''`;
        const schoolResults = yield (0, DatabaseConnection_1.queryDatabase)(schoolQuery);
        schoolResults.forEach(row => {
            tags.add(`school:${row.ZAT_SCHOOL}`);
        });
        // Generate birth year decade tags
        const birthYearQuery = `SELECT DISTINCT ZAT_BIRTHYEAR FROM ZCDARCHITECT WHERE ZAT_BIRTHYEAR > 0`;
        const birthYearResults = yield (0, DatabaseConnection_1.queryDatabase)(birthYearQuery);
        const decades = new Set();
        birthYearResults.forEach(row => {
            const decade = Math.floor(row.ZAT_BIRTHYEAR / 10) * 10;
            decades.add(decade);
        });
        decades.forEach(decade => {
            tags.add(`born:${decade}s`);
        });
        // Generate death year tags
        const deathYearQuery = `SELECT DISTINCT ZAT_DEATHYEAR FROM ZCDARCHITECT WHERE ZAT_DEATHYEAR > 0`;
        const deathYearResults = yield (0, DatabaseConnection_1.queryDatabase)(deathYearQuery);
        deathYearResults.forEach(row => {
            tags.add(`died:${row.ZAT_DEATHYEAR}`);
        });
        return Array.from(tags).sort();
    }
    catch (error) {
        console.error('Error fetching architect tags:', error);
        return [];
    }
});
exports.getArchitectTags = getArchitectTags;
