import React, { useState, forwardRef, useCallback } from 'react';
import { 
  TextField as MuiTextField, 
  TextFieldProps as MuiTextFieldProps,
  FormHelperText,
  InputAdornment,
  IconButton,
  Box,
  useTheme,
  alpha
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import ErrorIcon from '@mui/icons-material/Error';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ClearIcon from '@mui/icons-material/Clear';
import { useTypedTranslation } from '../../i18n';
import { 
  getAriaAttributes, 
  useHighContrast, 
  useReducedMotion,
  useScreenReaderAnnouncer 
} from '../../utils/accessibility';

export interface TextFieldProps extends Omit<MuiTextFieldProps, 'ref'> {
  label?: string;
  variant?: 'outlined' | 'filled' | 'standard';
  fullWidth?: boolean;
  error?: boolean;
  helperText?: React.ReactNode;
  size?: 'small' | 'medium';
  // Enhanced accessibility props
  ariaLabel?: string;
  ariaDescribedBy?: string;
  showPasswordToggle?: boolean;
  validationState?: 'valid' | 'invalid' | 'warning';
  validationMessage?: string;
  // Touch-friendly sizing
  touchTarget?: 'minimal' | 'comfortable' | 'large';
  // Enhanced functionality
  maxLength?: number;
  showCharacterCount?: boolean;
  clearable?: boolean;
  onClear?: () => void;
}

/**
 * Enhanced TextField component with full WCAG 2.1 AA compliance
 * - Internationalization support
 * - Screen reader announcements
 * - High contrast mode support
 * - Password visibility toggle
 * - Character count display
 * - Validation states with proper ARIA
 * - Touch-friendly sizing
 */
export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(({
  label,
  variant = 'outlined',
  fullWidth = true,
  error = false,
  helperText,
  size = 'medium',
  type = 'text',
  ariaLabel,
  ariaDescribedBy,
  showPasswordToggle = false,
  validationState,
  validationMessage,
  touchTarget = 'comfortable',
  maxLength,
  showCharacterCount = false,
  clearable = false,
  onClear,
  value = '',
  onChange,
  ...props
}, ref) => {
  const { t } = useTypedTranslation();
  const theme = useTheme();
  const prefersHighContrast = useHighContrast();
  const prefersReducedMotion = useReducedMotion();
  const { announce } = useScreenReaderAnnouncer();
  
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  
  const isPassword = type === 'password';
  const actualType = isPassword && showPassword ? 'text' : type;
  const currentLength = String(value).length;
  
  // Determine validation state
  const hasError = error || validationState === 'invalid';
  const hasWarning = validationState === 'warning';
  const hasSuccess = validationState === 'valid';
  
  // Build ARIA attributes
  const ariaAttributes = getAriaAttributes(
    ariaLabel,
    ariaDescribedBy,
    undefined,
    undefined,
    props.disabled,
    hasError,
    props.required
  );

  // Handle password visibility toggle
  const handlePasswordToggle = useCallback(() => {
    setShowPassword(prev => {
      const newValue = !prev;
      announce(newValue ? 'パスワードが表示されました' : 'パスワードが非表示になりました');
      return newValue;
    });
  }, [announce]);

  // Handle clear action
  const handleClear = useCallback(() => {
    onClear?.();
    if (onChange) {
      const syntheticEvent = {
        target: { value: '' }
      } as React.ChangeEvent<HTMLInputElement>;
      onChange(syntheticEvent);
    }
    announce('入力内容がクリアされました');
  }, [onClear, onChange, announce]);

  // Handle focus events
  const handleFocus = useCallback((event: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    props.onFocus?.(event);
  }, [props]);

  const handleBlur = useCallback((event: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    props.onBlur?.(event);
  }, [props]);

  // Get touch target sizing
  const getTouchTargetSize = () => {
    switch (touchTarget) {
      case 'minimal':
        return { '& .MuiInputBase-root': { minHeight: 44 } };
      case 'large':
        return { '& .MuiInputBase-root': { minHeight: 56, fontSize: '1.125rem' } };
      case 'comfortable':
      default:
        return { '& .MuiInputBase-root': { minHeight: 48 } };
    }
  };

  // Get validation color
  const getValidationColor = () => {
    if (hasError) return theme.palette.error.main;
    if (hasWarning) return theme.palette.warning.main;
    if (hasSuccess) return theme.palette.success.main;
    return theme.palette.primary.main;
  };

  // Get validation icon
  const getValidationIcon = () => {
    if (hasError) return <ErrorIcon color="error" fontSize="small" />;
    if (hasSuccess) return <CheckCircleIcon color="success" fontSize="small" />;
    return null;
  };

  // High contrast mode styling
  const getHighContrastStyles = () => {
    if (!prefersHighContrast) return {};
    
    return {
      '& .MuiOutlinedInput-root': {
        '& fieldset': {
          borderWidth: 2,
          borderColor: 'ButtonText',
        },
        '&:hover fieldset': {
          borderColor: 'HighlightText',
        },
        '&.Mui-focused fieldset': {
          borderWidth: 3,
          borderColor: 'Highlight',
        }
      }
    };
  };

  // Build helper text with character count
  const buildHelperText = () => {
    const parts: React.ReactNode[] = [];
    
    if (validationMessage) {
      parts.push(validationMessage);
    } else if (helperText) {
      parts.push(helperText);
    }
    
    if (showCharacterCount && maxLength) {
      const countText = `${currentLength}/${maxLength}`;
      const isNearLimit = currentLength > maxLength * 0.9;
      parts.push(
        <Box 
          component="span" 
          sx={{ 
            ml: 'auto',
            color: isNearLimit ? theme.palette.warning.main : 'text.secondary',
            fontSize: '0.75rem'
          }}
        >
          {countText}
        </Box>
      );
    }
    
    if (parts.length === 0) return undefined;
    
    return (
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {parts}
      </Box>
    );
  };

  // Build input adornments
  const endAdornment = (
    <>
      {/* Validation icon */}
      {getValidationIcon() && (
        <InputAdornment position="end">
          {getValidationIcon()}
        </InputAdornment>
      )}
      
      {/* Password visibility toggle */}
      {isPassword && showPasswordToggle && (
        <InputAdornment position="end">
          <IconButton
            aria-label={showPassword ? 'パスワードを非表示' : 'パスワードを表示'}
            onClick={handlePasswordToggle}
            edge="end"
            size="small"
            sx={{
              '&:focus-visible': {
                outline: `2px solid ${theme.palette.secondary.main}`,
                outlineOffset: 2,
              }
            }}
          >
            {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
          </IconButton>
        </InputAdornment>
      )}
      
      {/* Clear button */}
      {clearable && value && !props.disabled && (
        <InputAdornment position="end">
          <IconButton
            aria-label="入力内容をクリア"
            onClick={handleClear}
            edge="end"
            size="small"
            sx={{
              '&:focus-visible': {
                outline: `2px solid ${theme.palette.secondary.main}`,
                outlineOffset: 2,
              }
            }}
          >
            <ClearIcon fontSize="small" />
          </IconButton>
        </InputAdornment>
      )}
      
      {props.InputProps?.endAdornment}
    </>
  );

  return (
    <Box sx={{ width: '100%' }}>
      <MuiTextField
        ref={ref}
        label={label}
        variant={variant}
        fullWidth={fullWidth}
        error={hasError}
        size={size}
        type={actualType}
        value={value}
        onChange={onChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        helperText={buildHelperText()}
        inputProps={{
          maxLength,
          ...ariaAttributes,
          'aria-invalid': hasError,
          'aria-describedby': [
            ariaDescribedBy,
            validationMessage ? `${props.id}-validation` : undefined,
            showCharacterCount ? `${props.id}-count` : undefined
          ].filter(Boolean).join(' ') || undefined,
          ...props.inputProps
        }}
        InputProps={{
          ...props.InputProps,
          endAdornment
        }}
        sx={{
          ...getTouchTargetSize(),
          // Enhanced focus styles
          '& .MuiOutlinedInput-root': {
            '&.Mui-focused': {
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: getValidationColor(),
                borderWidth: isFocused ? 2 : 1,
              }
            },
            // High contrast mode support
            ...getHighContrastStyles()['& .MuiOutlinedInput-root'],
          },
          // Reduced motion support
          ...(prefersReducedMotion && {
            '& .MuiOutlinedInput-root': {
              transition: 'none',
            }
          }),
          // Touch-friendly styling
          '& .MuiInputBase-input': {
            fontSize: touchTarget === 'large' ? '1.125rem' : '1rem',
            padding: touchTarget === 'large' ? '16px 14px' : touchTarget === 'small' ? '8px 12px' : '12px 14px',
          },
          ...getHighContrastStyles(),
          ...props.sx
        }}
        {...props}
      />
      
      {/* Screen reader announcements for validation */}
      {validationMessage && (
        <FormHelperText 
          id={`${props.id}-validation`}
          sx={{ 
            position: 'absolute', 
            left: '-10000px',
            fontSize: 0 
          }}
          aria-live="polite"
          aria-atomic="true"
        >
          {validationMessage}
        </FormHelperText>
      )}
      
      {/* Character count for screen readers */}
      {showCharacterCount && maxLength && (
        <FormHelperText 
          id={`${props.id}-count`}
          sx={{ 
            position: 'absolute', 
            left: '-10000px',
            fontSize: 0 
          }}
          aria-live="polite"
          aria-atomic="true"
        >
          {currentLength}文字中{maxLength}文字
        </FormHelperText>
      )}
    </Box>
  );
});

TextField.displayName = 'TextField';

export default TextField;