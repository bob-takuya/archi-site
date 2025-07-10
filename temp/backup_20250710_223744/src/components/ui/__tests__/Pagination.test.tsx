import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Pagination from '../Pagination';

describe('Pagination Component', () => {
  it('renders correctly with required props', () => {
    render(<Pagination page={1} count={10} onChange={() => {}} />);
    
    // Pagination component should be present
    expect(screen.getByRole('navigation')).toBeInTheDocument();
    
    // Should have first and last buttons by default
    expect(screen.getByRole('button', { name: /first page/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /last page/i })).toBeInTheDocument();
    
    // Page 1 should be selected
    const page1Button = screen.getByRole('button', { name: /page 1/i });
    expect(page1Button).toHaveAttribute('aria-current', 'true');
  });
  
  it('calls onChange when a page is clicked', async () => {
    const handleChange = vi.fn();
    render(<Pagination page={1} count={10} onChange={handleChange} />);
    
    // Click on page 3
    const page3Button = screen.getByRole('button', { name: /page 3/i });
    await userEvent.click(page3Button);
    
    expect(handleChange).toHaveBeenCalledWith(3);
  });
  
  it('highlights the current page', () => {
    const { rerender } = render(<Pagination page={1} count={10} onChange={() => {}} />);
    
    // Page 1 should be selected
    let page1Button = screen.getByRole('button', { name: /page 1/i });
    expect(page1Button).toHaveAttribute('aria-current', 'true');
    
    // Rerender with page 5
    rerender(<Pagination page={5} count={10} onChange={() => {}} />);
    
    // Page 5 should now be selected
    const page5Button = screen.getByRole('button', { name: /page 5/i });
    expect(page5Button).toHaveAttribute('aria-current', 'true');
    
    // Page 1 should no longer be selected
    page1Button = screen.getByRole('button', { name: /page 1/i });
    expect(page1Button).not.toHaveAttribute('aria-current', 'true');
  });
  
  it('respects count prop', () => {
    const { rerender } = render(<Pagination page={1} count={3} onChange={() => {}} />);
    
    // Should have 3 page buttons (1, 2, 3)
    expect(screen.getAllByRole('button').filter(btn => 
      /page \d/i.test(btn.getAttribute('aria-label') || '')
    )).toHaveLength(3);
    
    // Rerender with count 5
    rerender(<Pagination page={1} count={5} onChange={() => {}} />);
    
    // Should now have 5 page buttons
    expect(screen.getAllByRole('button').filter(btn => 
      /page \d/i.test(btn.getAttribute('aria-label') || '')
    )).toHaveLength(5);
  });
  
  it('can hide first and last buttons', () => {
    render(
      <Pagination 
        page={1} 
        count={10} 
        onChange={() => {}} 
        showFirstButton={false}
        showLastButton={false}
      />
    );
    
    // First and last buttons should not be present
    expect(screen.queryByRole('button', { name: /first page/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /last page/i })).not.toBeInTheDocument();
    
    // But previous and next buttons should still exist
    expect(screen.getByRole('button', { name: /previous page/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /next page/i })).toBeInTheDocument();
  });
  
  it('applies different sizes correctly', () => {
    const { rerender } = render(<Pagination page={1} count={10} onChange={() => {}} size="small" />);
    
    // Should have small size
    expect(screen.getByRole('navigation').querySelector('.MuiPagination-sizeSmall')).toBeInTheDocument();
    
    // Rerender with medium size
    rerender(<Pagination page={1} count={10} onChange={() => {}} size="medium" />);
    
    // Should have medium size
    expect(screen.getByRole('navigation').querySelector('.MuiPagination-sizeMedium')).toBeInTheDocument();
    
    // Rerender with large size
    rerender(<Pagination page={1} count={10} onChange={() => {}} size="large" />);
    
    // Should have large size
    expect(screen.getByRole('navigation').querySelector('.MuiPagination-sizeLarge')).toBeInTheDocument();
  });
  
  it('disables buttons appropriately when on first/last page', () => {
    const { rerender } = render(<Pagination page={1} count={3} onChange={() => {}} />);
    
    // On first page, previous and first buttons should be disabled
    expect(screen.getByRole('button', { name: /previous page/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /first page/i })).toBeDisabled();
    
    // Next and last buttons should be enabled
    expect(screen.getByRole('button', { name: /next page/i })).not.toBeDisabled();
    expect(screen.getByRole('button', { name: /last page/i })).not.toBeDisabled();
    
    // Rerender with last page
    rerender(<Pagination page={3} count={3} onChange={() => {}} />);
    
    // On last page, next and last buttons should be disabled
    expect(screen.getByRole('button', { name: /next page/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /last page/i })).toBeDisabled();
    
    // Previous and first buttons should be enabled
    expect(screen.getByRole('button', { name: /previous page/i })).not.toBeDisabled();
    expect(screen.getByRole('button', { name: /first page/i })).not.toBeDisabled();
  });
});