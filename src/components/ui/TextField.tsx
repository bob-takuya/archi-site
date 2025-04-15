import React from 'react';
import { TextField as MuiTextField, TextFieldProps as MuiTextFieldProps } from '@mui/material';

export interface TextFieldProps extends MuiTextFieldProps {
  label?: string;
  variant?: 'outlined' | 'filled' | 'standard';
  fullWidth?: boolean;
  error?: boolean;
  helperText?: React.ReactNode;
  size?: 'small' | 'medium';
}

/**
 * TextField component with consistent styling
 */
export const TextField: React.FC<TextFieldProps> = ({
  label,
  variant = 'outlined',
  fullWidth = true,
  error = false,
  helperText,
  size = 'medium',
  ...props
}) => {
  return (
    <MuiTextField
      label={label}
      variant={variant}
      fullWidth={fullWidth}
      error={error}
      helperText={helperText}
      size={size}
      {...props}
    />
  );
};

export default TextField;