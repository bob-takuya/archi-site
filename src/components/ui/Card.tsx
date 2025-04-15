import React from 'react';
import { 
  Card as MuiCard, 
  CardProps as MuiCardProps,
  CardContent,
  CardHeader,
  CardMedia,
  CardActions
} from '@mui/material';

export interface CardProps extends MuiCardProps {
  title?: React.ReactNode;
  subheader?: React.ReactNode;
  image?: string;
  imageHeight?: number | string;
  imageAlt?: string;
  actions?: React.ReactNode;
}

/**
 * Card component with consistent styling for displaying information
 */
export const Card: React.FC<CardProps> = ({
  title,
  subheader,
  image,
  imageHeight = 140,
  imageAlt = '',
  actions,
  children,
  ...props
}) => {
  return (
    <MuiCard {...props}>
      {title && (
        <CardHeader
          title={title}
          subheader={subheader}
        />
      )}
      {image && (
        <CardMedia
          component="img"
          height={imageHeight}
          image={image}
          alt={imageAlt}
        />
      )}
      <CardContent>
        {children}
      </CardContent>
      {actions && (
        <CardActions>
          {actions}
        </CardActions>
      )}
    </MuiCard>
  );
};

export default Card;