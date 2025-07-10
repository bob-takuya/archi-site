import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { StaticDatabaseService } from '../../services/db/StaticDatabaseService';
import HomePage from '../HomePage';

// Mock services
jest.mock('../../services/db/StaticDatabaseService', () => ({
  StaticDatabaseService: {
    getInstance: jest.fn().mockReturnValue({
      initDatabase: jest.fn().mockResolvedValue({}),
      getAllArchitectures: jest.fn().mockResolvedValue({
        data: [
          { ZAA_ID: 1, ZAA_NAME: 'Tokyo Tower', ZAA_PREFECTURE: 'Tokyo' },
          { ZAA_ID: 2, ZAA_NAME: 'Osaka Castle', ZAA_PREFECTURE: 'Osaka' }
        ],
        total: 2
      })
    })
  }
}));

// Mock components
jest.mock('../../components/Header', () => ({
  __esModule: true,
  default: () => <div data-testid="header">Header Component</div>
}));

jest.mock('../../components/Footer', () => ({
  __esModule: true,
  default: () => <div data-testid="footer">Footer Component</div>
}));

jest.mock('../../components/ArchitectureList', () => ({
  __esModule: true,
  default: ({ architectures, loading }) => (
    <div data-testid="architecture-list">
      {loading ? 'Loading...' : architectures.map(a => 
        <div key={a.ZAA_ID} data-testid="architecture-item">{a.ZAA_NAME}</div>
      )}
    </div>
  )
}));

jest.mock('../../components/Map', () => ({
  __esModule: true,
  default: ({ locations }) => (
    <div data-testid="map">
      Map Component with {locations.length} locations
    </div>
  )
}));

jest.mock('../../components/ui/SearchBar', () => ({
  __esModule: true,
  default: ({ onSearch }) => (
    <div data-testid="search-bar">
      <input 
        data-testid="search-input" 
        onChange={(e) => onSearch(e.target.value)}
      />
    </div>
  )
}));

const renderWithRouter = (ui) => {
  return render(ui, { wrapper: MemoryRouter });
};

describe('HomePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('renders the page with all main components', async () => {
    renderWithRouter(<HomePage />);
    
    // Header and footer should be present
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
    
    // Search bar should be present
    expect(screen.getByTestId('search-bar')).toBeInTheDocument();
    
    // Architecture list should be present (initially loading)
    expect(screen.getByTestId('architecture-list')).toBeInTheDocument();
    
    // Map should be present
    expect(screen.getByTestId('map')).toBeInTheDocument();
    
    // Wait for data loading
    await waitFor(() => {
      expect(screen.getByText('Tokyo Tower')).toBeInTheDocument();
      expect(screen.getByText('Osaka Castle')).toBeInTheDocument();
    });
  });
  
  it('loads and displays featured architectures', async () => {
    renderWithRouter(<HomePage />);
    
    // Initial loading state should be shown
    expect(screen.getByTestId('architecture-list')).toHaveTextContent('Loading...');
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Tokyo Tower')).toBeInTheDocument();
      expect(screen.getByText('Osaka Castle')).toBeInTheDocument();
    });
    
    // Map should have received the locations
    expect(screen.getByTestId('map')).toHaveTextContent('2 locations');
  });
  
  it('handles search input', async () => {
    const mockGetAllArchitectures = jest.fn().mockResolvedValue({
      data: [{ ZAA_ID: 1, ZAA_NAME: 'Tokyo Tower', ZAA_PREFECTURE: 'Tokyo' }],
      total: 1
    });
    
    jest.spyOn(StaticDatabaseService, 'getInstance').mockReturnValue({
      initDatabase: jest.fn().mockResolvedValue({}),
      getAllArchitectures: mockGetAllArchitectures
    } as any);
    
    renderWithRouter(<HomePage />);
    
    // Find the search input
    const searchInput = screen.getByTestId('search-input');
    
    // Type in a search term
    await userEvent.type(searchInput, 'Tokyo');
    
    // Wait for debounce and search to execute
    await waitFor(() => {
      expect(mockGetAllArchitectures).toHaveBeenCalledWith(
        expect.anything(), // page
        expect.anything(), // pageSize
        'Tokyo', // searchTerm
        expect.anything() // filters
      );
    });
  });
  
  it('handles error during data fetch', async () => {
    // Mock an error response
    jest.spyOn(StaticDatabaseService, 'getInstance').mockReturnValue({
      initDatabase: jest.fn().mockResolvedValue({}),
      getAllArchitectures: jest.fn().mockRejectedValue(new Error('Failed to fetch data'))
    } as any);
    
    renderWithRouter(<HomePage />);
    
    // Wait for error message to appear
    await waitFor(() => {
      expect(screen.getByText(/error loading data/i)).toBeInTheDocument();
    });
  });
});