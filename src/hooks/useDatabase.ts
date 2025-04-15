import { useState, useEffect } from 'react';
import { 
  ArchitectureService, 
  ArchitectService,
  DatabaseStatus, 
  getDatabaseStatus
} from '../services/db';
import { measureQueryPerformance } from '../utils/dbUtils';

/**
 * Database hook for convenient database access in React components
 * Provides status and methods to access the database
 */
const useDatabase = () => {
  const [status, setStatus] = useState<DatabaseStatus>(getDatabaseStatus());
  
  // Update status when it changes
  useEffect(() => {
    const checkStatus = () => {
      const currentStatus = getDatabaseStatus();
      if (currentStatus !== status) {
        setStatus(currentStatus);
      }
    };
    
    // Check status initially and then every second
    checkStatus();
    const interval = setInterval(checkStatus, 1000);
    
    return () => clearInterval(interval);
  }, [status]);
  
  return {
    // Status
    status,
    isReady: status === DatabaseStatus.READY,
    isInitializing: status === DatabaseStatus.INITIALIZING,
    isError: status === DatabaseStatus.ERROR,
    
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
          () => ArchitectService.getArchitectById(id)),
          
      getAll: (page = 1, limit = 12, searchTerm = '', tags = [], sortBy = 'ZAR_NAME', sortOrder = 'asc', options = {}) =>
        measureQueryPerformance('getAllArchitects',
          () => ArchitectService.getAllArchitects(page, limit, searchTerm, tags, sortBy, sortOrder, options)),
          
      getTags: () =>
        measureQueryPerformance('getArchitectTags',
          () => ArchitectService.getArchitectTags()),
    }
  };
};

export default useDatabase;