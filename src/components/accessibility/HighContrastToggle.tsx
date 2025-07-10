import React, { useState, useEffect, useCallback } from 'react';
import { 
  IconButton, 
  Tooltip, 
  Switch, 
  FormControlLabel, 
  Box,
  useTheme,
  alpha 
} from '@mui/material';
import ContrastIcon from '@mui/icons-material/Contrast';
import { useTypedTranslation } from '../../i18n';
import { useHighContrast, getAriaAttributes } from '../../utils/accessibility';

interface HighContrastToggleProps {
  variant?: 'icon' | 'switch';
  size?: 'small' | 'medium' | 'large';
  className?: string;
  onToggle?: (enabled: boolean) => void;
}

/**
 * High Contrast Mode Toggle Component
 * Allows users to toggle high contrast mode for better accessibility
 * WCAG 2.1 AA compliant with proper announcements
 */
export const HighContrastToggle: React.FC<HighContrastToggleProps> = ({
  variant = 'icon',
  size = 'medium',
  className = '',
  onToggle
}) => {
  const { t } = useTypedTranslation();
  const theme = useTheme();
  const systemPrefersHighContrast = useHighContrast();
  
  const [highContrastEnabled, setHighContrastEnabled] = useState(() => {
    // Check localStorage first, then system preference
    const stored = localStorage.getItem('highContrast');
    if (stored !== null) {
      return stored === 'true';
    }
    return systemPrefersHighContrast;
  });

  // Save preference to localStorage
  useEffect(() => {
    localStorage.setItem('highContrast', highContrastEnabled.toString());
  }, [highContrastEnabled]);

  // Apply high contrast styles to document
  useEffect(() => {
    const root = document.documentElement;
    
    if (highContrastEnabled) {
      root.classList.add('high-contrast-mode');
      root.style.setProperty('--primary-color', '#000000');
      root.style.setProperty('--secondary-color', '#FFFFFF');
      root.style.setProperty('--background-color', '#FFFFFF');
      root.style.setProperty('--text-color', '#000000');
      root.style.setProperty('--border-color', '#000000');
    } else {
      root.classList.remove('high-contrast-mode');
      // Reset to original theme colors
      root.style.removeProperty('--primary-color');
      root.style.removeProperty('--secondary-color');
      root.style.removeProperty('--background-color');
      root.style.removeProperty('--text-color');
      root.style.removeProperty('--border-color');
    }
  }, [highContrastEnabled]);

  // Handle toggle
  const handleToggle = useCallback(() => {
    const newValue = !highContrastEnabled;
    setHighContrastEnabled(newValue);
    onToggle?.(newValue);
    
    // Announce change to screen readers
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.style.position = 'absolute';
    announcement.style.left = '-10000px';
    announcement.textContent = newValue 
      ? 'ハイコントラストモードが有効になりました'
      : 'ハイコントラストモードが無効になりました';
    
    document.body.appendChild(announcement);
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }, [highContrastEnabled, onToggle]);

  // Build ARIA attributes
  const ariaAttributes = getAriaAttributes(
    'ハイコントラストモードの切り替え',
    undefined,
    undefined,
    undefined,
    false
  );

  if (variant === 'switch') {
    return (
      <Box className={className}>
        <FormControlLabel
          control={
            <Switch
              checked={highContrastEnabled}
              onChange={handleToggle}
              size={size}
              {...ariaAttributes}
              sx={{
                '& .MuiSwitch-track': {
                  backgroundColor: highContrastEnabled 
                    ? theme.palette.common.black 
                    : theme.palette.grey[400],
                },
                '& .MuiSwitch-thumb': {
                  backgroundColor: highContrastEnabled 
                    ? theme.palette.common.white 
                    : theme.palette.common.white,
                  border: highContrastEnabled 
                    ? `2px solid ${theme.palette.common.black}`
                    : 'none',
                },
                '&:focus-within .MuiSwitch-thumb': {
                  outline: `2px solid ${theme.palette.secondary.main}`,
                  outlineOffset: 2,
                }
              }}
            />
          }
          label="ハイコントラスト"
          labelPlacement="start"
          sx={{
            '& .MuiFormControlLabel-label': {
              fontSize: size === 'large' ? '1.125rem' : size === 'small' ? '0.875rem' : '1rem',
              fontWeight: 500,
              color: highContrastEnabled ? theme.palette.common.black : 'inherit'
            }
          }}
        />
      </Box>
    );
  }

  return (
    <Box className={className}>
      <Tooltip 
        title={highContrastEnabled ? 'ハイコントラストモードを無効にする' : 'ハイコントラストモードを有効にする'}
        arrow
      >
        <IconButton
          onClick={handleToggle}
          size={size}
          {...ariaAttributes}
          sx={{
            color: highContrastEnabled ? theme.palette.common.black : 'inherit',
            backgroundColor: highContrastEnabled 
              ? alpha(theme.palette.common.black, 0.08)
              : 'transparent',
            border: highContrastEnabled 
              ? `2px solid ${theme.palette.common.black}`
              : '2px solid transparent',
            '&:hover': {
              backgroundColor: highContrastEnabled
                ? alpha(theme.palette.common.black, 0.12)
                : alpha(theme.palette.primary.main, 0.08),
            },
            '&:focus-visible': {
              outline: `2px solid ${theme.palette.secondary.main}`,
              outlineOffset: 2,
            }
          }}
        >
          <ContrastIcon 
            fontSize={size} 
            sx={{
              color: highContrastEnabled ? theme.palette.common.black : 'inherit'
            }}
          />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

export default HighContrastToggle;