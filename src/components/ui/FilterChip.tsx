import React from 'react';
import { Chip, ChipProps, Box } from '@mui/material';

export interface FilterChipProps extends Omit<ChipProps, 'onClick'> {
  label: string;
  selected?: boolean;
  value: string;
  onClick?: (value: string) => void;
}

/**
 * FilterChip component for toggling filters
 */
export const FilterChip: React.FC<FilterChipProps> = ({
  label,
  selected = false,
  value,
  onClick,
  ...props
}) => {
  const handleClick = () => {
    onClick?.(value);
  };

  return (
    <Chip
      label={label}
      color={selected ? 'primary' : 'default'}
      variant={selected ? 'filled' : 'outlined'}
      onClick={handleClick}
      {...props}
    />
  );
};

export interface FilterChipGroupProps {
  chips: {
    label: string;
    value: string;
    selected?: boolean;
  }[];
  onChange: (value: string) => void;
  spacing?: number;
}

/**
 * FilterChipGroup component for organizing multiple filter chips
 */
export const FilterChipGroup: React.FC<FilterChipGroupProps> = ({
  chips,
  onChange,
  spacing = 1
}) => {
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: spacing }}>
      {chips.map((chip) => (
        <FilterChip
          key={chip.value}
          label={chip.label}
          value={chip.value}
          selected={chip.selected}
          onClick={onChange}
        />
      ))}
    </Box>
  );
};

export default FilterChip;