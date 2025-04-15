import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../../../src/components/ui/Button';

describe('Button Component', () => {
  test('renders button with correct text', () => {
    render(<Button>Test Button</Button>);
    expect(screen.getByText('Test Button')).toBeInTheDocument();
  });

  test('applies the correct variant', () => {
    const { rerender } = render(<Button variant="contained">Contained Button</Button>);
    const button = screen.getByText('Contained Button');
    expect(button).toHaveClass('MuiButton-contained');

    rerender(<Button variant="outlined">Outlined Button</Button>);
    const outlinedButton = screen.getByText('Outlined Button');
    expect(outlinedButton).toHaveClass('MuiButton-outlined');
  });

  test('applies the correct color', () => {
    const { rerender } = render(<Button color="primary">Primary Button</Button>);
    const button = screen.getByText('Primary Button');
    expect(button).toHaveClass('MuiButton-colorPrimary');

    rerender(<Button color="secondary">Secondary Button</Button>);
    const secondaryButton = screen.getByText('Secondary Button');
    expect(secondaryButton).toHaveClass('MuiButton-colorSecondary');
  });

  test('handles click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Clickable Button</Button>);
    fireEvent.click(screen.getByText('Clickable Button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('renders button with fullWidth', () => {
    render(<Button fullWidth>Full Width Button</Button>);
    const button = screen.getByText('Full Width Button');
    expect(button).toHaveClass('MuiButton-fullWidth');
  });

  test('passes through other props', () => {
    render(<Button data-testid="custom-button">Custom Button</Button>);
    expect(screen.getByTestId('custom-button')).toBeInTheDocument();
  });
});