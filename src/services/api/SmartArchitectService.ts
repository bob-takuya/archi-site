/**
 * Smart Architect Service
 * Attempts to use real database service, falls back to empty state service
 * Ensures no realistic dummy data is ever shown
 */

import { getDatabaseStatus, DatabaseStatus } from '../db/ClientDatabaseService';
import { getAllArchitects as getRealArchitects, getArchitectById as getRealArchitectById, 
         searchArchitectsWithFacets as searchRealArchitects } from '../db/ArchitectService';
import { getAllArchitects as getEmptyArchitects, getArchitectById as getEmptyArchitectById,
         searchArchitects as searchEmptyArchitects, getArchitectNationalities as getEmptyNationalities,
         getArchitectCategories as getEmptyCategories, getArchitectSchools as getEmptySchools,
         DatabaseUnavailableError } from './EmptyStateArchitectService';
import type { Architect, ArchitectsResponse } from '../types/architect';
import type { ArchitectResponse } from './EmptyStateArchitectService';

// Convert between the two response types
const convertToArchitectResponse = (realResponse: ArchitectsResponse): ArchitectResponse => {
  return {
    results: realResponse.results,
    total: realResponse.total,
    page: realResponse.page,
    limit: realResponse.limit,
    totalPages: realResponse.totalPages
  };
};

/**
 * Check if database is available for use
 */
const isDatabaseAvailable = async (): Promise<boolean> => {
  try {
    const status = getDatabaseStatus();
    if (status === DatabaseStatus.READY) {
      return true;
    }
    if (status === DatabaseStatus.NOT_INITIALIZED || status === DatabaseStatus.INITIALIZING) {
      // Wait a moment for potential initialization
      await new Promise(resolve => setTimeout(resolve, 1000));
      return getDatabaseStatus() === DatabaseStatus.READY;
    }
    return false;
  } catch (error) {
    console.warn('Database availability check failed:', error);
    return false;
  }
};

/**
 * Get all architects with smart fallback
 */
export const getAllArchitects = async (
  page: number = 1,
  limit: number = 12,
  searchTerm: string = '',
  sortBy: string = 'name_asc'
): Promise<ArchitectResponse> => {
  console.log('🔍 SmartArchitectService: Checking database availability...');
  
  if (await isDatabaseAvailable()) {
    try {
      console.log('✅ Database available, using real service');
      const result = await getRealArchitects(page, limit, searchTerm, [], sortBy);
      return convertToArchitectResponse(result);
    } catch (error) {
      console.error('❌ Real service failed, falling back to empty state:', error);
    }
  }
  
  console.log('⚠️ Database not available, using empty state service');
  return getEmptyArchitects(page, limit, searchTerm, sortBy);
};

/**
 * Search architects with smart fallback
 */
export const searchArchitects = async (
  searchTerm: string = '',
  filters: {
    nationality?: string;
    category?: string;
    school?: string;
    birthYearFrom?: number;
    birthYearTo?: number;
  } = {},
  page: number = 1,
  limit: number = 12
): Promise<ArchitectResponse> => {
  console.log('🔍 SmartArchitectService: Checking database for search...');
  
  if (await isDatabaseAvailable()) {
    try {
      console.log('✅ Database available, using real search service');
      // Convert filters to facets format for real service
      const facets = {
        prefectures: filters.nationality ? [filters.nationality] : undefined,
        categories: filters.category ? [filters.category] : undefined,
        styles: filters.school ? [filters.school] : undefined,
        yearRange: (filters.birthYearFrom || filters.birthYearTo) ? 
          [filters.birthYearFrom || 1800, filters.birthYearTo || new Date().getFullYear()] : undefined
      };
      
      const result = await searchRealArchitects(searchTerm, facets, page, limit);
      return convertToArchitectResponse(result);
    } catch (error) {
      console.error('❌ Real search failed, falling back to empty state:', error);
    }
  }
  
  console.log('⚠️ Database not available, using empty state search');
  return searchEmptyArchitects(searchTerm, filters, page, limit);
};

/**
 * Get architect by ID with smart fallback
 */
export const getArchitectById = async (id: number): Promise<Architect | null> => {
  console.log('🔍 SmartArchitectService: Getting architect by ID...');
  
  if (await isDatabaseAvailable()) {
    try {
      console.log('✅ Database available, using real service');
      return await getRealArchitectById(id);
    } catch (error) {
      console.error('❌ Real service failed for ID lookup:', error);
    }
  }
  
  console.log('⚠️ Database not available, throwing error');
  return getEmptyArchitectById(id);
};

/**
 * Get unique nationalities with smart fallback
 */
export const getArchitectNationalities = async (): Promise<string[]> => {
  if (await isDatabaseAvailable()) {
    try {
      // Get from real service - need to implement this properly
      console.log('✅ Database available, but nationality extraction not implemented yet');
      return getEmptyNationalities();
    } catch (error) {
      console.error('❌ Real nationality service failed:', error);
    }
  }
  
  return getEmptyNationalities();
};

/**
 * Get unique categories with smart fallback
 */
export const getArchitectCategories = async (): Promise<string[]> => {
  if (await isDatabaseAvailable()) {
    try {
      // Get from real service - need to implement this properly
      console.log('✅ Database available, but category extraction not implemented yet');
      return getEmptyCategories();
    } catch (error) {
      console.error('❌ Real category service failed:', error);
    }
  }
  
  return getEmptyCategories();
};

/**
 * Get unique schools with smart fallback
 */
export const getArchitectSchools = async (): Promise<string[]> => {
  if (await isDatabaseAvailable()) {
    try {
      // Get from real service - need to implement this properly 
      console.log('✅ Database available, but school extraction not implemented yet');
      return getEmptySchools();
    } catch (error) {
      console.error('❌ Real school service failed:', error);
    }
  }
  
  return getEmptySchools();
};