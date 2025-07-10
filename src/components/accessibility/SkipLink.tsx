import React from 'react';
import { styled } from '@mui/material/styles';

interface SkipLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

const StyledSkipLink = styled('a')(({ theme }) => ({
  position: 'absolute',
  top: '-40px',
  left: '6px',
  background: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  padding: '8px 16px',
  zIndex: 9999,
  textDecoration: 'none',
  borderRadius: '0 0 4px 4px',
  fontSize: '0.875rem',
  fontWeight: 600,
  border: `2px solid ${theme.palette.primary.dark}`,
  transition: 'top 0.3s ease',
  
  '&:focus': {
    top: 0,
    outline: `2px solid ${theme.palette.secondary.main}`,
    outlineOffset: '2px',
  },
  
  // High contrast mode support
  '@media (prefers-contrast: high)': {
    backgroundColor: 'ButtonText',
    color: 'ButtonFace',
    border: '2px solid ButtonText',
    
    '&:focus': {
      backgroundColor: 'Highlight',
      color: 'HighlightText',
      outline: '2px solid ButtonText',
    }
  },
  
  // Reduced motion support
  '@media (prefers-reduced-motion: reduce)': {
    transition: 'none',
  }
}));

/**
 * Skip Link component for keyboard navigation accessibility
 * Allows users to skip directly to main content or navigation
 * WCAG 2.1 AA compliant
 */
export const SkipLink: React.FC<SkipLinkProps> = ({
  href,
  children,
  className = '',
  ...props
}) => {
  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    // Ensure the target element gets focus after navigation
    const targetId = href.replace('#', '');
    const targetElement = document.getElementById(targetId);
    
    if (targetElement) {
      // Add tabindex if not naturally focusable
      if (!targetElement.hasAttribute('tabindex')) {
        targetElement.setAttribute('tabindex', '-1');
      }
      
      // Focus the target element after a short delay
      setTimeout(() => {
        targetElement.focus();
        
        // Remove tabindex if we added it
        if (targetElement.getAttribute('tabindex') === '-1') {
          targetElement.removeAttribute('tabindex');
        }
      }, 100);
    }
  };
  
  return (
    <StyledSkipLink
      href={href}
      className={className}
      onClick={handleClick}
      {...props}
    >
      {children}
    </StyledSkipLink>
  );
};