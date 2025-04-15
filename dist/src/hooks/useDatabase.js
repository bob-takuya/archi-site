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
exports.useDatabase = useDatabase;
const react_1 = require("react");
const AppContext_1 = require("../context/AppContext");
const dbServices = __importStar(require("../services/db"));
/**
 * Custom hook for database operations with loading and error handling.
 * This hook simplifies database interactions across the application.
 */
function useDatabase() {
    const { setIsLoading, setError } = (0, AppContext_1.useApp)();
    /**
     * Wrapper for database operation with automatic loading and error handling
     * @param operation Function that performs the database operation
     * @param defaultValue Default value to return if operation fails
     */
    const executeDbOperation = (0, react_1.useCallback)((operation_1, defaultValue_1, ...args_1) => __awaiter(this, [operation_1, defaultValue_1, ...args_1], void 0, function* (operation, defaultValue, showLoader = true) {
        if (showLoader) {
            setIsLoading(true);
        }
        try {
            const result = yield operation();
            return result;
        }
        catch (err) {
            console.error('Database operation failed:', err);
            setError(err instanceof Error ? err : new Error(String(err)));
            return defaultValue;
        }
        finally {
            if (showLoader) {
                setIsLoading(false);
            }
        }
    }), [setIsLoading, setError]);
    /**
     * Get all architectures with pagination and filtering
     */
    const getAllArchitectures = (0, react_1.useCallback)((page = 1, limit = 10, search = '', sort = 'year_desc') => {
        return executeDbOperation(() => dbServices.getAllArchitectures(page, limit, search, sort), { items: [], total: 0, pages: 0 });
    }, [executeDbOperation]);
    /**
     * Get architecture details by ID
     */
    const getArchitectureById = (0, react_1.useCallback)((id) => {
        return executeDbOperation(() => dbServices.getArchitectureById(id), null);
    }, [executeDbOperation]);
    /**
     * Get architectures for map display
     */
    const getMapArchitectures = (0, react_1.useCallback)(() => {
        return executeDbOperation(() => dbServices.getMapArchitectures(), []);
    }, [executeDbOperation]);
    /**
     * Get all architects with filtering and pagination
     */
    const getAllArchitects = (0, react_1.useCallback)((page = 1, limit = 10, searchTerm = '', selectedTags = [], sortBy = 'name', sortOrder = 'asc', nationality = '', category = '', school = '', birthYearFrom = 0, birthYearTo = 0, deathYear = 0) => {
        return executeDbOperation(() => dbServices.getAllArchitects(page, limit, searchTerm, selectedTags, sortBy, sortOrder, nationality, category, school, birthYearFrom, birthYearTo, deathYear), { items: [], total: 0, page, totalPages: 0 });
    }, [executeDbOperation]);
    /**
     * Get architect details by ID
     */
    const getArchitectById = (0, react_1.useCallback)((id) => {
        return executeDbOperation(() => dbServices.getArchitectById(id), null);
    }, [executeDbOperation]);
    /**
     * Get all architecture tags
     */
    const getAllTags = (0, react_1.useCallback)(() => {
        return executeDbOperation(() => dbServices.getAllTags(), []);
    }, [executeDbOperation]);
    /**
     * Get years for a specific tag
     */
    const getYearsForTag = (0, react_1.useCallback)((baseTag) => {
        return executeDbOperation(() => dbServices.getYearsForTag(baseTag), []);
    }, [executeDbOperation]);
    /**
     * Get architect tags for filtering
     */
    const getArchitectTags = (0, react_1.useCallback)(() => {
        return executeDbOperation(() => dbServices.getArchitectTags(), []);
    }, [executeDbOperation]);
    /**
     * Close database connection
     */
    const closeConnection = (0, react_1.useCallback)(() => {
        return executeDbOperation(() => dbServices.closeDatabase(), undefined, false);
    }, [executeDbOperation]);
    // Return all database functions
    return {
        getAllArchitectures,
        getArchitectureById,
        getMapArchitectures,
        getAllArchitects,
        getArchitectById,
        getAllTags,
        getYearsForTag,
        getArchitectTags,
        closeConnection
    };
}
