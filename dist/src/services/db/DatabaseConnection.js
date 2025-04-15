"use strict";
/**
 * Database Connection Module
 *
 * This module provides the core database connection and query functionality.
 * It manages the singleton database worker instance and offers basic query methods.
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
exports.closeDatabase = exports.clearQueryCache = exports.queryDatabase = exports.executeQuery = exports.getDbWorker = void 0;
const sql_js_httpvfs_1 = require("sql.js-httpvfs");
const queryOptimizer_1 = require("../../server/utils/queryOptimizer");
// Cache for query results to improve performance
const queryCache = {};
// Configuration for the SQLite database worker
const workerConfig = {
    from: "inline",
    config: {
        serverMode: "full",
        url: "/db/archimap.sqlite",
        requestChunkSize: 1024 * 1024
    }
};
// Single instance of the database worker
let dbWorkerPromise = null;
/**
 * Get the database worker instance.
 * Creates the worker if it doesn't exist or returns the existing one.
 */
const getDbWorker = () => __awaiter(void 0, void 0, void 0, function* () {
    if (!dbWorkerPromise) {
        console.log('Initializing DB worker...');
        try {
            dbWorkerPromise = (0, sql_js_httpvfs_1.createDbWorker)([workerConfig], "/sqlite.worker.js", "/sql-wasm.wasm");
            console.log('DB worker initialized successfully');
        }
        catch (error) {
            console.error('DB worker initialization error:', error);
            throw error;
        }
    }
    try {
        return (yield dbWorkerPromise).db;
    }
    catch (error) {
        console.error('Error getting DB worker instance:', error);
        throw error;
    }
});
exports.getDbWorker = getDbWorker;
/**
 * Execute a raw SQL query with parameters.
 * @param query SQL query string
 * @param params Query parameters
 * @returns Query result as an array of rows
 */
const executeQuery = (query_1, ...args_1) => __awaiter(void 0, [query_1, ...args_1], void 0, function* (query, params = []) {
    var _a;
    try {
        // Apply query optimization
        const optimizedQuery = (0, queryOptimizer_1.optimizeQuery)(query);
        // Generate cache key and check cache
        const cacheKey = (0, queryOptimizer_1.generateCacheKey)(optimizedQuery, params);
        const cachedResult = (0, queryOptimizer_1.getCachedQueryResult)(cacheKey);
        if (cachedResult !== undefined) {
            console.log(`Using cached result for query: ${optimizedQuery.substring(0, 100)}...`);
            return cachedResult;
        }
        console.log(`Executing SQL query: ${optimizedQuery.substring(0, 100)}...`);
        const worker = yield (0, exports.getDbWorker)();
        const startTime = performance.now();
        const result = yield worker.exec(optimizedQuery, params);
        const execTime = performance.now() - startTime;
        // Log slow queries
        if (execTime > 100) {
            console.log(`Query took ${execTime.toFixed(2)}ms: ${optimizedQuery.substring(0, 100)}...`);
        }
        const resultValues = ((_a = result[0]) === null || _a === void 0 ? void 0 : _a.values) || [];
        // Cache the result if appropriate
        const ttl = (0, queryOptimizer_1.analyzeQueryCaching)(optimizedQuery);
        if (ttl > 0) {
            (0, queryOptimizer_1.cacheQueryResult)(cacheKey, resultValues, ttl);
        }
        return resultValues;
    }
    catch (error) {
        console.error('SQL query execution error:', error);
        throw error;
    }
});
exports.executeQuery = executeQuery;
/**
 * Execute a database query with support for caching and named parameters.
 * @param query SQL query string
 * @param params Named or indexed parameters
 * @returns Processed query results as an array of objects
 */
const queryDatabase = (query_1, ...args_1) => __awaiter(void 0, [query_1, ...args_1], void 0, function* (query, params = {}) {
    try {
        const worker = yield (0, exports.getDbWorker)();
        // Apply query optimization
        const optimizedQuery = (0, queryOptimizer_1.optimizeQuery)(query);
        // Process parameters for SQL.js format
        let sql = optimizedQuery;
        let values = [];
        if (Array.isArray(params)) {
            // If params is already an array, use as is
            values = params;
        }
        else if (Object.keys(params).length > 0) {
            // Normalize named parameters to positional ones
            const normalized = (0, queryOptimizer_1.normalizeQueryParams)(sql, params);
            sql = normalized.query;
            values = normalized.params;
        }
        // Generate a cache key
        const cacheKey = (0, queryOptimizer_1.generateCacheKey)(sql, values);
        // Try to get results from cache
        const cachedResult = (0, queryOptimizer_1.getCachedQueryResult)(cacheKey);
        if (cachedResult !== undefined) {
            console.log('Using cached query result');
            return cachedResult;
        }
        // Execute the query
        const startTime = performance.now();
        let result;
        try {
            result = yield worker.db.query(sql, values);
        }
        catch (error) {
            console.error('Error executing query:', error, 'SQL:', sql, 'Values:', values);
            throw error;
        }
        const execTime = performance.now() - startTime;
        if (execTime > 100) {
            console.log(`Query took ${execTime.toFixed(2)}ms: ${sql.substring(0, 100)}...`);
        }
        // Process results
        const rows = Array.isArray(result) ? result : [];
        // Cache the results if appropriate
        const ttl = (0, queryOptimizer_1.analyzeQueryCaching)(sql);
        if (ttl > 0) {
            (0, queryOptimizer_1.cacheQueryResult)(cacheKey, rows, ttl);
        }
        return rows;
    }
    catch (error) {
        console.error('Query execution error:', error);
        throw error;
    }
});
exports.queryDatabase = queryDatabase;
/**
 * Clear the query cache to free memory.
 */
const clearQueryCache = () => {
    if (queryCache) {
        Object.keys(queryCache).forEach(key => {
            delete queryCache[key];
        });
        console.log('Query cache cleared');
    }
};
exports.clearQueryCache = clearQueryCache;
/**
 * Close the database connection and clear resources.
 */
const closeDatabase = () => __awaiter(void 0, void 0, void 0, function* () {
    if (dbWorkerPromise) {
        try {
            const worker = yield dbWorkerPromise;
            if (worker && worker.close) {
                yield worker.close();
                console.log('Database connection closed');
            }
            dbWorkerPromise = null;
            (0, exports.clearQueryCache)();
        }
        catch (error) {
            console.error('Database shutdown error:', error);
            throw error;
        }
    }
});
exports.closeDatabase = closeDatabase;
