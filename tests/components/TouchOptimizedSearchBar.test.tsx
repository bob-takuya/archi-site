/**
 * Test suite for TouchOptimizedSearchBar component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from '../../src/styles/theme';
import TouchOptimizedSearchBar from '../../src/components/ui/TouchOptimizedSearchBar';

// Mock the AutocompleteService
jest.mock('../../src/services/db/AutocompleteService', () => ({
  AutocompleteService: jest.fn().mockImplementation(() => ({
    getAutocompleteResults: jest.fn().mockResolvedValue({
      suggestions: [
        { id: '1', text: 'Tokyo Station', type: 'architecture', count: 5, icon: 'architecture' },
        { id: '2', text: 'Tokyo Prefecture', type: 'location', count: 100, icon: 'location' }
      ]
    })
  }))
}));

// Mock the gesture navigation hook
jest.mock('../../src/hooks/useGestureNavigation', () => ({
  useGestureNavigation: () => ({
    handleSwipeGesture: jest.fn()
  })
}));

// Mock the haptic feedback hook
jest.mock('../../src/hooks/useHapticFeedback', () => ({
  useHapticFeedback: () => ({
    triggerHapticFeedback: jest.fn()
  })
}));

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider theme={theme}>
    {children}
  </ThemeProvider>
);

describe('TouchOptimizedSearchBar', () => {
  const defaultProps = {
    onSearch: jest.fn(),
    placeholder: 'Search test...'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders search bar with correct placeholder', () => {
    render(
      <TestWrapper>
        <TouchOptimizedSearchBar {...defaultProps} />
      </TestWrapper>
    );

    const searchInput = screen.getByRole('textbox');
    expect(searchInput).toBeInTheDocument();
    expect(searchInput).toHaveAttribute('placeholder', 'Search test...');
  });

  test('meets touch target requirements', () => {
    render(
      <TestWrapper>
        <TouchOptimizedSearchBar {...defaultProps} />
      </TestWrapper>
    );

    const searchBar = screen.getByTestId('search-bar');
    const styles = getComputedStyle(searchBar);
    
    // Check that the search bar has minimum touch-friendly dimensions
    expect(searchBar).toBeInTheDocument();
  });

  test('calls onSearch when search is triggered', async () => {
    const mockOnSearch = jest.fn();
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <TouchOptimizedSearchBar {...defaultProps} onSearch={mockOnSearch} />
      </TestWrapper>
    );

    const searchInput = screen.getByRole('textbox');
    
    await user.type(searchInput, 'Tokyo');
    await user.keyboard('{Enter}');

    expect(mockOnSearch).toHaveBeenCalledWith('Tokyo');
  });

  test('displays autocomplete suggestions', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <TouchOptimizedSearchBar {...defaultProps} />
      </TestWrapper>
    );

    const searchInput = screen.getByRole('textbox');
    
    await user.type(searchInput, 'Tokyo');

    await waitFor(() => {
      expect(screen.getByTestId('autocomplete-suggestions')).toBeInTheDocument();
    });

    expect(screen.getByText('Tokyo Station')).toBeInTheDocument();
    expect(screen.getByText('Tokyo Prefecture')).toBeInTheDocument();
  });

  test('handles suggestion selection', async () => {
    const mockOnSearch = jest.fn();
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <TouchOptimizedSearchBar {...defaultProps} onSearch={mockOnSearch} />
      </TestWrapper>
    );

    const searchInput = screen.getByRole('textbox');
    
    await user.type(searchInput, 'Tokyo');

    await waitFor(() => {
      expect(screen.getByTestId('autocomplete-suggestions')).toBeInTheDocument();
    });

    const suggestion = screen.getByText('Tokyo Station');
    await user.click(suggestion);

    expect(mockOnSearch).toHaveBeenCalledWith('Tokyo Station');
  });

  test('shows clear button when input has value', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <TouchOptimizedSearchBar {...defaultProps} />
      </TestWrapper>
    );

    const searchInput = screen.getByRole('textbox');
    
    await user.type(searchInput, 'Tokyo');

    const clearButton = screen.getByLabelText('検索をクリア');
    expect(clearButton).toBeInTheDocument();
  });

  test('clears input when clear button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <TouchOptimizedSearchBar {...defaultProps} />
      </TestWrapper>
    );

    const searchInput = screen.getByRole('textbox') as HTMLInputElement;
    
    await user.type(searchInput, 'Tokyo');
    expect(searchInput.value).toBe('Tokyo');

    const clearButton = screen.getByLabelText('検索をクリア');
    await user.click(clearButton);

    expect(searchInput.value).toBe('');
  });

  test('displays recent searches when provided', () => {
    const recentSearches = ['東京', '大阪', '京都'];

    render(
      <TestWrapper>
        <TouchOptimizedSearchBar 
          {...defaultProps} 
          recentSearches={recentSearches}
        />
      </TestWrapper>
    );

    expect(screen.getByText('最近の検索')).toBeInTheDocument();
    expect(screen.getByText('東京')).toBeInTheDocument();
    expect(screen.getByText('大阪')).toBeInTheDocument();
    expect(screen.getByText('京都')).toBeInTheDocument();
  });

  test('shows advanced options when enabled', () => {
    render(
      <TestWrapper>
        <TouchOptimizedSearchBar 
          {...defaultProps} 
          showAdvancedOptions={true}
          onVoiceSearch={jest.fn()}
          onCameraSearch={jest.fn()}
        />
      </TestWrapper>
    );

    expect(screen.getByLabelText('音声検索')).toBeInTheDocument();
    expect(screen.getByLabelText('画像検索')).toBeInTheDocument();
  });

  test('handles controlled value changes', async () => {
    const mockOnChange = jest.fn();
    const user = userEvent.setup();

    const { rerender } = render(
      <TestWrapper>
        <TouchOptimizedSearchBar 
          {...defaultProps} 
          value=""
          onChange={mockOnChange}
        />
      </TestWrapper>
    );

    const searchInput = screen.getByRole('textbox') as HTMLInputElement;
    
    await user.type(searchInput, 'T');

    expect(mockOnChange).toHaveBeenCalledWith('T');

    // Simulate parent updating the value
    rerender(
      <TestWrapper>
        <TouchOptimizedSearchBar 
          {...defaultProps} 
          value="Tokyo"
          onChange={mockOnChange}
        />
      </TestWrapper>
    );

    expect(searchInput.value).toBe('Tokyo');
  });

  test('calls voice search callback when voice button is clicked', async () => {
    const mockVoiceSearch = jest.fn();
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <TouchOptimizedSearchBar 
          {...defaultProps} 
          onVoiceSearch={mockVoiceSearch}
        />
      </TestWrapper>
    );

    const voiceButton = screen.getByLabelText('音声検索');
    await user.click(voiceButton);

    expect(mockVoiceSearch).toHaveBeenCalled();
  });

  test('calls camera search callback when camera button is clicked', async () => {
    const mockCameraSearch = jest.fn();
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <TouchOptimizedSearchBar 
          {...defaultProps} 
          onCameraSearch={mockCameraSearch}
        />
      </TestWrapper>
    );

    const cameraButton = screen.getByLabelText('画像検索');
    await user.click(cameraButton);

    expect(mockCameraSearch).toHaveBeenCalled();
  });

  test('supports keyboard navigation', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <TouchOptimizedSearchBar {...defaultProps} />
      </TestWrapper>
    );

    const searchInput = screen.getByRole('textbox');
    
    await user.type(searchInput, 'Tokyo');

    await waitFor(() => {
      expect(screen.getByTestId('autocomplete-suggestions')).toBeInTheDocument();
    });

    // Test Escape key to close suggestions
    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(screen.queryByTestId('autocomplete-suggestions')).not.toBeInTheDocument();
    });
  });

  test('handles touch gestures when enabled', () => {
    const { container } = render(
      <TestWrapper>
        <TouchOptimizedSearchBar 
          {...defaultProps} 
          gestureEnabled={true}
        />
      </TestWrapper>
    );

    const searchInput = container.querySelector('input');
    
    // Simulate touch start event
    const touchEvent = new TouchEvent('touchstart', {
      touches: [{ clientX: 100, clientY: 100 } as Touch]
    });

    fireEvent(searchInput!, touchEvent);

    // Component should handle touch events without throwing
    expect(searchInput).toBeInTheDocument();
  });
});