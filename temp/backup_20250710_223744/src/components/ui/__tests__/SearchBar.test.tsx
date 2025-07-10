import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchBar from '../SearchBar';

describe('SearchBar Component', () => {
  it('renders correctly with default props', () => {
    render(<SearchBar />);
    
    expect(screen.getByPlaceholderText('検索')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /clear/i })).not.toBeInTheDocument();
  });
  
  it('displays custom placeholder text', () => {
    render(<SearchBar placeholder="建築を検索" />);
    
    expect(screen.getByPlaceholderText('建築を検索')).toBeInTheDocument();
  });
  
  it('updates input value on change', async () => {
    const handleChange = vi.fn();
    render(<SearchBar onChange={handleChange} />);
    
    const input = screen.getByPlaceholderText('検索');
    await userEvent.type(input, 'Tokyo Tower');
    
    expect(input).toHaveValue('Tokyo Tower');
    expect(handleChange).toHaveBeenCalledTimes('Tokyo Tower'.length);
    expect(handleChange).toHaveBeenLastCalledWith('Tokyo Tower');
  });
  
  it('calls onSearch when search button is clicked', async () => {
    const handleSearch = vi.fn();
    render(<SearchBar onSearch={handleSearch} />);
    
    const input = screen.getByPlaceholderText('検索');
    await userEvent.type(input, 'Tokyo Tower');
    
    const searchButton = screen.getByRole('button', { name: /search/i });
    await userEvent.click(searchButton);
    
    expect(handleSearch).toHaveBeenCalledWith('Tokyo Tower');
  });
  
  it('calls onSearch when Enter key is pressed', async () => {
    const handleSearch = vi.fn();
    render(<SearchBar onSearch={handleSearch} />);
    
    const input = screen.getByPlaceholderText('検索');
    await userEvent.type(input, 'Tokyo Tower{Enter}');
    
    expect(handleSearch).toHaveBeenCalledWith('Tokyo Tower');
  });
  
  it('clears input when clear button is clicked', async () => {
    const handleChange = vi.fn();
    const handleSearch = vi.fn();
    render(<SearchBar onChange={handleChange} onSearch={handleSearch} />);
    
    const input = screen.getByPlaceholderText('検索');
    await userEvent.type(input, 'Tokyo Tower');
    
    // Clear button should appear after typing
    const clearButton = screen.getByRole('button', { name: /clear/i });
    await userEvent.click(clearButton);
    
    expect(input).toHaveValue('');
    expect(handleChange).toHaveBeenLastCalledWith('');
    expect(handleSearch).toHaveBeenLastCalledWith('');
  });
  
  it('respects fullWidth property', () => {
    const { rerender } = render(<SearchBar fullWidth={true} />);
    
    const container = screen.getByRole('form');
    expect(container).toHaveStyle({ width: '100%' });
    
    rerender(<SearchBar fullWidth={false} />);
    expect(container).toHaveStyle({ width: 'auto' });
  });
  
  it('applies different sizes correctly', () => {
    const { rerender } = render(<SearchBar size="small" />);
    
    // Check small size
    expect(screen.getByRole('form')).toHaveStyle({ padding: '4px 8px' });
    
    // Check medium size
    rerender(<SearchBar size="medium" />);
    expect(screen.getByRole('form')).toHaveStyle({ padding: '8px 12px' });
    
    // Check large size
    rerender(<SearchBar size="large" />);
    expect(screen.getByRole('form')).toHaveStyle({ padding: '12px 16px' });
  });
  
  it('applies different variants correctly', () => {
    const { rerender } = render(<SearchBar variant="outlined" />);
    
    // Check outlined variant
    let container = screen.getByRole('form');
    expect(container).toHaveStyle({ border: '1px solid' });
    
    // Check elevated variant
    rerender(<SearchBar variant="elevated" />);
    container = screen.getByRole('form');
    expect(container).toHaveAttribute('elevation', '3');
    
    // Check filled variant
    rerender(<SearchBar variant="filled" />);
    container = screen.getByRole('form');
    expect(container).toHaveStyle({ backgroundColor: 'action.hover' });
  });
  
  it('displays initial value when provided', () => {
    render(<SearchBar value="Initial Query" />);
    
    expect(screen.getByPlaceholderText('検索')).toHaveValue('Initial Query');
    expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
  });
  
  it('updates when external value changes', () => {
    const { rerender } = render(<SearchBar value="Initial Query" />);
    
    // Input should have initial value
    expect(screen.getByPlaceholderText('検索')).toHaveValue('Initial Query');
    
    // Update the value prop
    rerender(<SearchBar value="Updated Query" />);
    
    // Input should update to the new value
    expect(screen.getByPlaceholderText('検索')).toHaveValue('Updated Query');
  });
});