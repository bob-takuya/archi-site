import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { AppProvider, useApp } from '../../../src/context/AppContext';

// Test component that uses the AppContext
const TestComponent = () => {
  const { 
    isDarkMode, 
    toggleDarkMode, 
    language, 
    setLanguage,
    searchTerm,
    setSearchTerm,
    filters,
    addFilter,
    removeFilter,
    clearFilters
  } = useApp();

  return (
    <div>
      <div data-testid="dark-mode">{isDarkMode ? 'dark' : 'light'}</div>
      <button onClick={toggleDarkMode}>Toggle Theme</button>
      
      <div data-testid="language">{language}</div>
      <button onClick={() => setLanguage(language === 'ja' ? 'en' : 'ja')}>Switch Language</button>
      
      <div data-testid="search-term">{searchTerm}</div>
      <input
        data-testid="search-input"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      
      <div data-testid="filters">{JSON.stringify(filters)}</div>
      <button onClick={() => addFilter('category', 'residential')}>Add Filter</button>
      <button onClick={() => removeFilter('category')}>Remove Filter</button>
      <button onClick={clearFilters}>Clear Filters</button>
    </div>
  );
};

describe('AppContext', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    
    // Mock localStorage getItem implementation
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => {
      if (key === 'darkMode') return 'false';
      if (key === 'language') return 'ja';
      return null;
    });
  });
  
  test('provides theme state and toggle functionality', () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );
    
    // Check initial state
    expect(screen.getByTestId('dark-mode')).toHaveTextContent('light');
    
    // Toggle theme
    fireEvent.click(screen.getByText('Toggle Theme'));
    expect(screen.getByTestId('dark-mode')).toHaveTextContent('dark');
    
    // Verify localStorage was updated
    expect(localStorage.setItem).toHaveBeenCalledWith('darkMode', 'true');
  });
  
  test('provides language state and setter', () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );
    
    // Check initial state
    expect(screen.getByTestId('language')).toHaveTextContent('ja');
    
    // Change language
    fireEvent.click(screen.getByText('Switch Language'));
    expect(screen.getByTestId('language')).toHaveTextContent('en');
    
    // Verify localStorage was updated
    expect(localStorage.setItem).toHaveBeenCalledWith('language', 'en');
  });
  
  test('provides search term state and setter', () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );
    
    // Check initial state
    expect(screen.getByTestId('search-term')).toHaveTextContent('');
    
    // Update search term
    fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'architecture' } });
    expect(screen.getByTestId('search-term')).toHaveTextContent('architecture');
  });
  
  test('provides filter state and management functions', () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );
    
    // Check initial state
    expect(screen.getByTestId('filters')).toHaveTextContent('{}');
    
    // Add filter
    fireEvent.click(screen.getByText('Add Filter'));
    expect(screen.getByTestId('filters')).toHaveTextContent('{"category":"residential"}');
    
    // Remove filter
    fireEvent.click(screen.getByText('Remove Filter'));
    expect(screen.getByTestId('filters')).toHaveTextContent('{}');
    
    // Add filter again and clear all
    fireEvent.click(screen.getByText('Add Filter'));
    fireEvent.click(screen.getByText('Clear Filters'));
    expect(screen.getByTestId('filters')).toHaveTextContent('{}');
  });
});