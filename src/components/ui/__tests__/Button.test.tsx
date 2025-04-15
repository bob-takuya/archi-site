import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Button from '../Button';

describe('Button Component', () => {
  it('renders correctly with default props', () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole('button', { name: /click me/i });
    
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();
  });
  
  it('applies variant when specified', () => {
    render(<Button variant="outlined">Outlined Button</Button>);
    const button = screen.getByRole('button');
    
    expect(button).toHaveClass('MuiButton-outlined');
  });
  
  it('applies color when specified', () => {
    render(<Button color="secondary">Secondary Button</Button>);
    const button = screen.getByRole('button');
    
    expect(button).toHaveClass('MuiButton-colorSecondary');
  });
  
  it('applies size when specified', () => {
    render(<Button size="large">Large Button</Button>);
    const button = screen.getByRole('button');
    
    expect(button).toHaveClass('MuiButton-sizeLarge');
  });
  
  it('disables the button when disabled prop is true', () => {
    render(<Button disabled>Disabled Button</Button>);
    const button = screen.getByRole('button');
    
    expect(button).toBeDisabled();
  });
  
  it('calls onClick handler when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Clickable Button</Button>);
    const button = screen.getByRole('button');
    
    fireEvent.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
  
  it('does not call onClick when disabled', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick} disabled>Disabled Button</Button>);
    const button = screen.getByRole('button');
    
    fireEvent.click(button);
    
    expect(handleClick).not.toHaveBeenCalled();
  });
  
  it('applies fullWidth property when specified', () => {
    render(<Button fullWidth>Full Width Button</Button>);
    const button = screen.getByRole('button');
    
    expect(button).toHaveClass('MuiButton-fullWidth');
  });
});