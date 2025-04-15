// Jest setup file
require('@testing-library/jest-dom');

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
  writable: true
});

// Auto mock modules that might cause issues
jest.mock('leaflet', () => ({}), { virtual: true });
jest.mock('react-leaflet', () => ({}), { virtual: true });

// Add performance.now() if not available
if (!global.performance) {
  global.performance = {};
}
if (!global.performance.now) {
  global.performance.now = () => Date.now();
}

// Custom SQL.js-httpvfs mock for database tests
jest.mock('sql.js-httpvfs', () => {
  return {
    createDbWorker: jest.fn().mockResolvedValue({
      db: {
        exec: jest.fn().mockImplementation((query, params) => {
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
  };
});