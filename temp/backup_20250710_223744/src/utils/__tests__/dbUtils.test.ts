/**
 * Database Utilities Tests
 * 
 * Tests utility functions for working with database results.
 */

import { resultToObjects, escapeSortColumn } from '../dbUtils';

describe('Database Utilities', () => {
  describe('resultToObjects', () => {
    it('should convert SQL result to array of objects', () => {
      const result = {
        columns: ['id', 'name', 'location'],
        values: [
          [1, 'Building A', 'Tokyo'],
          [2, 'Building B', 'Osaka']
        ]
      };
      
      const objects = resultToObjects(result);
      
      expect(objects).toHaveLength(2);
      expect(objects[0]).toEqual({ id: 1, name: 'Building A', location: 'Tokyo' });
      expect(objects[1]).toEqual({ id: 2, name: 'Building B', location: 'Osaka' });
    });
    
    it('should return empty array for undefined result', () => {
      expect(resultToObjects(undefined)).toEqual([]);
    });
    
    it('should return empty array for result with no columns or values', () => {
      expect(resultToObjects({ columns: [], values: [] })).toEqual([]);
    });
  });
  
  describe('escapeSortColumn', () => {
    it('should allow valid column names', () => {
      expect(escapeSortColumn('name')).toBe('name');
      expect(escapeSortColumn('ZAA_NAME')).toBe('ZAA_NAME');
      expect(escapeSortColumn('column_with_underscore')).toBe('column_with_underscore');
    });
    
    it('should sanitize invalid column names', () => {
      expect(escapeSortColumn('name; DROP TABLE users;')).toBe('nameDROPTABLEusers');
      expect(escapeSortColumn('')).toBe('ZAA_NAME'); // Default
      expect(escapeSortColumn('123')).toBe('123');
      expect(escapeSortColumn('name.column')).toBe('namecolumn');
    });
  });
});