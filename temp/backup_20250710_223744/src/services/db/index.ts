/**
 * Database service index file
 * Exports all database services and provides a common interface
 */

import { DatabaseStatus, getDatabaseStatus, initDatabase, getResultsArray } from './ClientDatabaseService';
import * as ArchitectService from './ArchitectService';
import * as ArchitectureService from './ArchitectureService';

// Export all services
export {
  // Client database core
  DatabaseStatus,
  getDatabaseStatus,
  initDatabase,
  getResultsArray,
  
  // Architecture services
  ArchitectureService,
  
  // Architect services
  ArchitectService,
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