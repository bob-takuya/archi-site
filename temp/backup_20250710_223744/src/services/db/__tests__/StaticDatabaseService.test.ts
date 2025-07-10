/**
 * StaticDatabaseService Tests
 * 
 * These tests verify the functionality of the client-side database service
 * that uses SQL.js for GitHub Pages compatibility.
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { StaticDatabaseService } from '../StaticDatabaseService';

// Mock the SQL.js worker
jest.mock('sql.js-httpvfs', () => ({
  createDbWorker: jest.fn().mockResolvedValue({
    db: {
      exec: jest.fn().mockImplementation((query, params) => {
        // Return mock data based on the query
        if (query.includes('COUNT(*)')) {
          return [{ columns: ['total'], values: [[10]] }];
        }
        
        if (query.includes('ZCDARCHITECTURE')) {
          return [{
            columns: ['ZAA_ID', 'ZAA_NAME', 'ZAA_PREFECTURE'],
            values: [
              [1, 'Tokyo Tower', 'Tokyo'],
              [2, 'Osaka Castle', 'Osaka']
            ]
          }];
        }
        
        return [];
      })
    }
  })
}));

describe('StaticDatabaseService', () => {
  let dbService;
  
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    dbService = StaticDatabaseService.getInstance();
  });
  
  afterEach(() => {
    // Clean up after each test
    jest.restoreAllMocks();
  });
  
  it('should be a singleton', () => {
    const instance1 = StaticDatabaseService.getInstance();
    const instance2 = StaticDatabaseService.getInstance();
    expect(instance1).toBe(instance2);
  });
  
  it('should initialize database', async () => {
    const worker = await dbService.initDatabase();
    expect(worker).toBeDefined();
  });
  
  it('should execute queries', async () => {
    await dbService.initDatabase(); // Ensure database is initialized
    const result = await dbService.executeQuery('SELECT * FROM test');
    expect(result).toBeDefined();
  });
  
  it('should get architectures with pagination', async () => {
    await dbService.initDatabase(); // Ensure database is initialized
    const result = await dbService.getAllArchitectures(1, 10);
    expect(result.data).toHaveLength(2);
    expect(result.total).toBe(10);
  });
  
  it('should filter architectures by search term', async () => {
    await dbService.initDatabase(); // Ensure database is initialized
    const result = await dbService.getAllArchitectures(1, 10, 'Tokyo');
    expect(result.data).toBeDefined();
    // Verify that at least one result contains "Tokyo"
    expect(result.data.some(item => item.ZAA_NAME.includes('Tokyo') || 
                                    item.ZAA_PREFECTURE.includes('Tokyo')))
      .toBe(true);
  });
  
  it('should handle errors during initialization', async () => {
    // Mock createDbWorker to reject
    const { createDbWorker } = require('sql.js-httpvfs');
    createDbWorker.mockRejectedValueOnce(new Error('Connection failed'));
    
    await expect(dbService.initDatabase()).rejects.toThrow('Connection failed');
  });
  
  it('should cache query results', async () => {
    await dbService.initDatabase(); // Ensure database is initialized
    
    // Execute the same query twice
    await dbService.executeQuery('SELECT * FROM ZCDARCHITECTURE');
    await dbService.executeQuery('SELECT * FROM ZCDARCHITECTURE');
    
    // The underlying SQL.js exec should only be called once if caching is working
    const { createDbWorker } = require('sql.js-httpvfs');
    const mockExec = createDbWorker().db.exec;
    expect(mockExec).toHaveBeenCalledTimes(1);
  });
  
  it('should get architect by ID', async () => {
    // Set up the mock to return specific architect data
    const { createDbWorker } = require('sql.js-httpvfs');
    createDbWorker().db.exec.mockImplementationOnce(() => [{
      columns: ['ZAR_ID', 'ZAR_NAME', 'ZAR_BIRTHYEAR'],
      values: [[1, 'Tachū Naitō', 1886]]
    }]);
    
    await dbService.initDatabase();
    const architect = await dbService.getArchitectById(1);
    
    expect(architect).toBeDefined();
    expect(architect.ZAR_NAME).toBe('Tachū Naitō');
    expect(architect.ZAR_BIRTHYEAR).toBe(1886);
  });
  
  it('should get architecture by ID', async () => {
    // Set up the mock to return specific architecture data
    const { createDbWorker } = require('sql.js-httpvfs');
    createDbWorker().db.exec.mockImplementationOnce(() => [{
      columns: ['ZAA_ID', 'ZAA_NAME', 'ZAA_PREFECTURE', 'ZAA_YEAR'],
      values: [[1, 'Tokyo Tower', 'Tokyo', 1958]]
    }]);
    
    await dbService.initDatabase();
    const architecture = await dbService.getArchitectureById(1);
    
    expect(architecture).toBeDefined();
    expect(architecture.ZAA_NAME).toBe('Tokyo Tower');
    expect(architecture.ZAA_YEAR).toBe(1958);
  });
  
  it('should return empty results when no data found', async () => {
    // Set up the mock to return empty results
    const { createDbWorker } = require('sql.js-httpvfs');
    createDbWorker().db.exec.mockImplementationOnce(() => []);
    
    await dbService.initDatabase();
    const result = await dbService.getAllArchitectures(1, 10, 'NonExistentTerm');
    
    expect(result.data).toHaveLength(0);
    expect(result.total).toBe(0);
  });
});