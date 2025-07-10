import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ArchitectureList from '../ArchitectureList';

// Mock data
const mockArchitectures = [
  { ZAA_ID: 1, ZAA_NAME: 'Tokyo Tower', ZAA_PREFECTURE: 'Tokyo', ZAA_YEAR: 1958 },
  { ZAA_ID: 2, ZAA_NAME: 'Osaka Castle', ZAA_PREFECTURE: 'Osaka', ZAA_YEAR: 1583 },
  { ZAA_ID: 3, ZAA_NAME: 'Kinkaku-ji', ZAA_PREFECTURE: 'Kyoto', ZAA_YEAR: 1397 }
];

// Wrapper component with router
const renderWithRouter = (ui) => {
  return render(ui, { wrapper: MemoryRouter });
};

describe('ArchitectureList Component', () => {
  it('renders a list of architecture items', () => {
    renderWithRouter(
      <ArchitectureList 
        architectures={mockArchitectures}
        loading={false}
        onPageChange={() => {}}
        totalItems={3}
        page={1}
        itemsPerPage={10}
      />
    );
    
    // Check if all items are rendered
    expect(screen.getByText('Tokyo Tower')).toBeInTheDocument();
    expect(screen.getByText('Osaka Castle')).toBeInTheDocument();
    expect(screen.getByText('Kinkaku-ji')).toBeInTheDocument();
    
    // Check for location information
    expect(screen.getByText('Tokyo')).toBeInTheDocument();
    expect(screen.getByText('Osaka')).toBeInTheDocument();
    expect(screen.getByText('Kyoto')).toBeInTheDocument();
    
    // Check for year information
    expect(screen.getByText('1958')).toBeInTheDocument();
    expect(screen.getByText('1583')).toBeInTheDocument();
    expect(screen.getByText('1397')).toBeInTheDocument();
  });
  
  it('displays loading state when loading prop is true', () => {
    renderWithRouter(
      <ArchitectureList 
        architectures={[]}
        loading={true}
        onPageChange={() => {}}
        totalItems={0}
        page={1}
        itemsPerPage={10}
      />
    );
    
    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
  });
  
  it('displays empty state when no architectures are provided', () => {
    renderWithRouter(
      <ArchitectureList 
        architectures={[]}
        loading={false}
        onPageChange={() => {}}
        totalItems={0}
        page={1}
        itemsPerPage={10}
      />
    );
    
    expect(screen.getByText(/no results found/i)).toBeInTheDocument();
  });
  
  it('renders pagination when there are multiple pages', () => {
    renderWithRouter(
      <ArchitectureList 
        architectures={mockArchitectures}
        loading={false}
        onPageChange={() => {}}
        totalItems={25}
        page={1}
        itemsPerPage={10}
      />
    );
    
    const pagination = screen.getByRole('navigation');
    expect(pagination).toBeInTheDocument();
    
    // Check for page numbers
    const page1 = within(pagination).getByText('1');
    expect(page1).toBeInTheDocument();
    expect(page1).toHaveAttribute('aria-current', 'true');
    
    expect(within(pagination).getByText('2')).toBeInTheDocument();
    expect(within(pagination).getByText('3')).toBeInTheDocument();
  });
  
  it('calls onPageChange when a page is clicked', async () => {
    const handlePageChange = jest.fn();
    
    renderWithRouter(
      <ArchitectureList 
        architectures={mockArchitectures}
        loading={false}
        onPageChange={handlePageChange}
        totalItems={25}
        page={1}
        itemsPerPage={10}
      />
    );
    
    const pagination = screen.getByRole('navigation');
    const page2Button = within(pagination).getByText('2');
    
    await userEvent.click(page2Button);
    
    expect(handlePageChange).toHaveBeenCalledWith(2);
  });
  
  it('has links to detail pages for each architecture', () => {
    renderWithRouter(
      <ArchitectureList 
        architectures={mockArchitectures}
        loading={false}
        onPageChange={() => {}}
        totalItems={3}
        page={1}
        itemsPerPage={10}
      />
    );
    
    const links = screen.getAllByRole('link');
    
    // Each architecture should have a link to its detail page
    expect(links.length).toBeGreaterThanOrEqual(3);
    
    // Check first link attributes
    expect(links[0]).toHaveAttribute('href', '/architecture/1');
  });
});