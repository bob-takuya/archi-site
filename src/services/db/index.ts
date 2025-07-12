/**
 * Database service index file
 * Exports all database services and provides a common interface
 * Updated to use simplified, more reliable services
 */

import { DatabaseStatus, getDatabaseStatus, initDatabase, getResultsArray } from './FixedDatabaseService';
import * as ArchitectureService from './ArchitectureService';

// Re-export for backward compatibility, but prefer using RealArchitectService directly
export { getAllArchitects, getArchitectById } from '../api/RealArchitectService';

// Export all services
export {
  // Client database core (simplified)
  DatabaseStatus,
  getDatabaseStatus,
  initDatabase,
  getResultsArray,
  
  // Architecture services
  ArchitectureService,
};

/**
 * Check if database is available and can be connected to
 * @returns True if database is accessible
 */
export async function isDatabaseAvailable(): Promise<boolean> {
  try {
    // Current status check
    const status = getDatabaseStatus();
    if (status === DatabaseStatus.READY) {
      return true;
    }
    
    // Try to initialize
    await initDatabase();
    return getDatabaseStatus() === DatabaseStatus.READY;
  } catch (error) {
    console.error('Database availability check failed:', error);
    return false;
  }
}