import React from 'react';
import { Box, Typography, Container } from '@mui/material';

const Footer: React.FC = () => {
  return (
    <Box
      component="footer"
      role="contentinfo"
      data-testid="footer"
      sx={{
        py: 3,
        px: 2,
        mt: 'auto',
        backgroundColor: 'primary.main',
        color: 'white',
      }}
    >
      <Container maxWidth="sm">
        <Typography variant="body1" align="center">
          建築データベース © {new Date().getFullYear()}
        </Typography>
      </Container>
    </Box>
  );
};

export default Footer; 