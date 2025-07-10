import React from 'react';
import { Pagination as MuiPagination, PaginationProps as MuiPaginationProps, Box } from '@mui/material';

export interface PaginationComponentProps extends Omit<MuiPaginationProps, 'onChange'> {
  page: number;
  count: number;
  onChange: (page: number) => void;
  showFirstButton?: boolean;
  showLastButton?: boolean;
  size?: 'small' | 'medium' | 'large';
}

/**
 * Pagination component with consistent styling and simplified props
 */
export const Pagination: React.FC<PaginationComponentProps> = ({
  page,
  count,
  onChange,
  showFirstButton = true,
  showLastButton = true,
  size = 'medium',
  ...props
}) => {
  const handleChange = (event: React.ChangeEvent<unknown>, value: number) => {
    onChange(value);
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
      <MuiPagination
        page={page}
        count={count}
        onChange={handleChange}
        showFirstButton={showFirstButton}
        showLastButton={showLastButton}
        size={size}
        {...props}
      />
    </Box>
  );
};

export default Pagination;