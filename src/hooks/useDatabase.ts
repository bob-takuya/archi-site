import { useState, useEffect } from 'react';
import { 
  ArchitectureService, 
  getAllArchitects,
  getArchitectById,
  DatabaseStatus, 
  getDatabaseStatus,
  initDatabase
} from '../services/db';
import { measureQueryPerformance } from '../utils/dbUtils';

/**
 * Database hook for convenient database access in React components
 * Provides status and methods to access the database
 */
const useDatabase = () => {
  const [status, setStatus] = useState<DatabaseStatus>(getDatabaseStatus());
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Initialize database and handle status changes
  useEffect(() => {
    const initDb = async () => {
      try {
        setIsLoading(true);
        setError(null);
        // ⚠️ WARNING: initDatabase must always complete (success or failure)
        // Never let it hang indefinitely to prevent eternal loading states
        await initDatabase();
        setIsLoading(false);
      } catch (err) {
        // ⚠️ CRITICAL: Always set isLoading to false on error
        // This prevents eternal loading and allows the UI to show error state
        setError(err as Error);
        setIsLoading(false);
      }
    };
    
    const checkStatus = () => {
      const currentStatus = getDatabaseStatus();
      if (currentStatus !== status) {
        setStatus(currentStatus);
        
        // Update loading state based on status
        if (currentStatus === DatabaseStatus.READY) {
          setIsLoading(false);
          setError(null);
        } else if (currentStatus === DatabaseStatus.ERROR) {
          setIsLoading(false);
        } else if (currentStatus === DatabaseStatus.INITIALIZING) {
          setIsLoading(true);
        }
      }
    };
    
    // Initialize database and check status
    if (status === DatabaseStatus.NOT_INITIALIZED) {
      initDb();
    }
    
    // Check status initially and then every second
    checkStatus();
    const interval = setInterval(checkStatus, 1000);
    
    return () => clearInterval(interval);
  }, [status]);
  
  return {
    // Status
    status,
    isReady: status === DatabaseStatus.READY,
    isInitializing: status === DatabaseStatus.INITIALIZING || isLoading,
    isError: status === DatabaseStatus.ERROR || !!error,
    isLoading,
    error,
    errorDetails: error?.message,
    
    // Architecture methods with performance measurement
    architecture: {
      getById: (id: number) => 
        measureQueryPerformance(`getArchitectureById(${id})`,
          () => ArchitectureService.getArchitectureById(id)),
          
      getAll: (page = 1, limit = 12, searchTerm = '', sortBy = 'ZAW_NAME', sortOrder = 'asc', options = {}) => 
        measureQueryPerformance('getAllArchitectures',
          () => ArchitectureService.getAllArchitectures(page, limit, searchTerm, sortBy, sortOrder, options)),
          
      getByArchitect: (architectId: number) => 
        measureQueryPerformance(`getArchitecturesByArchitect(${architectId})`,
          () => ArchitectureService.getArchitecturesByArchitect(architectId)),
          
      getTags: () => 
        measureQueryPerformance('getAllTags',
          () => ArchitectureService.getAllTags()),
          
      getPrefectureCounts: () =>
        measureQueryPerformance('getPrefectureCounts',
          () => ArchitectureService.getPrefectureCounts()),
          
      getForMap: (bounds: any, filters = {}) =>
        measureQueryPerformance('getArchitectureForMap',
          () => ArchitectureService.getArchitectureForMap(bounds, filters)),
    },
    
    // Architect methods with performance measurement
    architect: {
      getById: (id: number) => 
        measureQueryPerformance(`getArchitectById(${id})`,
          () => getArchitectById(id)),
          
      getAll: (page = 1, limit = 12, searchTerm = '', sortBy = 'name_asc') =>
        measureQueryPerformance('getAllArchitects',
          () => getAllArchitects(page, limit, searchTerm, sortBy)),
    }
  };
};

export default useDatabase;