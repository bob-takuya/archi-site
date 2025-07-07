import React from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Skeleton, 
  Grid,
  Container 
} from '@mui/material';

interface LoadingSkeletonProps {
  variant?: 'card' | 'list' | 'hero' | 'map';
  count?: number;
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ 
  variant = 'card', 
  count = 6 
}) => {
  const renderCardSkeleton = () => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Skeleton variant="text" height={40} sx={{ mb: 1 }} />
        <Skeleton variant="text" height={20} sx={{ mb: 1 }} />
        <Skeleton variant="text" height={20} width="60%" />
      </CardContent>
    </Card>
  );

  const renderListSkeleton = () => (
    <Box sx={{ p: 2 }}>
      <Skeleton variant="text" height={32} sx={{ mb: 1 }} />
      <Skeleton variant="text" height={24} sx={{ mb: 1 }} />
      <Skeleton variant="text" height={20} width="40%" />
    </Box>
  );

  const renderHeroSkeleton = () => (
    <Container maxWidth="lg">
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Skeleton variant="text" height={60} sx={{ mb: 2 }} />
        <Skeleton variant="text" height={30} sx={{ mb: 4 }} />
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
          <Skeleton variant="rectangular" width={500} height={56} sx={{ borderRadius: 1 }} />
        </Box>
      </Box>
    </Container>
  );

  const renderMapSkeleton = () => (
    <Skeleton 
      variant="rectangular" 
      width="100%" 
      height={400} 
      sx={{ borderRadius: 2 }} 
    />
  );

  if (variant === 'hero') {
    return renderHeroSkeleton();
  }

  if (variant === 'map') {
    return renderMapSkeleton();
  }

  if (variant === 'list') {
    return (
      <Box>
        {Array.from({ length: count }).map((_, index) => (
          <Box key={index} sx={{ borderBottom: '1px solid #e0e0e0' }}>
            {renderListSkeleton()}
          </Box>
        ))}
      </Box>
    );
  }

  return (
    <Grid container spacing={4}>
      {Array.from({ length: count }).map((_, index) => (
        <Grid item key={index} xs={12} sm={6} md={4}>
          {renderCardSkeleton()}
        </Grid>
      ))}
    </Grid>
  );
};

export default LoadingSkeleton;