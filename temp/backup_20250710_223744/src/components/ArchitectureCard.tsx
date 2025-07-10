import React, { memo } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardActionArea,
  Typography,
  Box,
  Chip
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import EventIcon from '@mui/icons-material/Event';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CategoryIcon from '@mui/icons-material/Category';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

interface ArchitectureCardProps {
  architecture: {
    id: number;
    name?: string;
    title?: string;
    architect?: string;
    completedYear?: number;
    year?: number;
    city?: string;
    location?: string;
    address?: string;
    category?: string;
    tag?: string;
    tags?: string;
  };
  compact?: boolean;
  onClick?: (architecture: ArchitectureCardProps['architecture']) => void;
}

/**
 * Optimized Architecture Card component with React.memo
 * Memoized to prevent unnecessary re-renders when props haven't changed
 */
const ArchitectureCard = memo<ArchitectureCardProps>(({ architecture, compact = false, onClick }) => {
  const title = architecture.title || architecture.name || 'Unknown';
  const year = architecture.year || architecture.completedYear;
  const location = architecture.address || architecture.city || architecture.location;
  const tags = architecture.tags || architecture.tag;

  const handleClick = () => {
    if (onClick) {
      onClick(architecture);
    }
  };

  return (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        transition: 'transform 0.2s ease-in-out',
        '&:hover': {
          transform: 'scale(1.02)',
        },
      }}
    >
      <CardActionArea 
        component={RouterLink} 
        to={`/architecture/${architecture.id}`}
        sx={{ flexGrow: 1, height: '100%' }}
        onClick={handleClick}
      >
        <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Typography 
            gutterBottom 
            variant={compact ? "subtitle1" : "h6"} 
            component="h2"
            sx={{ 
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              mb: 1
            }}
          >
            {title}
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, flexGrow: 1 }}>
            {architecture.architect && (
              <Box sx={{ display: 'flex', alignItems: 'center', minHeight: 24 }}>
                <PersonIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary" noWrap>
                  {architecture.architect}
                </Typography>
              </Box>
            )}
            
            {year && year > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', minHeight: 24 }}>
                <EventIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {year}年
                </Typography>
              </Box>
            )}
            
            {location && (
              <Box sx={{ display: 'flex', alignItems: 'center', minHeight: 24 }}>
                <LocationOnIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary" noWrap>
                  {location}
                </Typography>
              </Box>
            )}

            {architecture.category && (
              <Box sx={{ display: 'flex', alignItems: 'center', minHeight: 24 }}>
                <CategoryIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary" noWrap>
                  {architecture.category}
                </Typography>
              </Box>
            )}
            
            {/* Tags at the bottom */}
            {tags && (
              <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.5, mt: 'auto', pt: 1 }}>
                <EmojiEventsIcon sx={{ color: 'warning.main', fontSize: 16 }} />
                <Chip 
                  label={tags}
                  size="small"
                  color="warning"
                  variant="outlined"
                  sx={{ 
                    height: '20px', 
                    fontSize: '0.65rem',
                    maxWidth: '200px',
                    '& .MuiChip-label': {
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }
                  }}
                />
              </Box>
            )}
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for memo
  // Only re-render if architecture data actually changed
  return (
    prevProps.architecture.id === nextProps.architecture.id &&
    prevProps.compact === nextProps.compact &&
    prevProps.architecture.title === nextProps.architecture.title &&
    prevProps.architecture.name === nextProps.architecture.name &&
    prevProps.architecture.architect === nextProps.architecture.architect &&
    prevProps.architecture.year === nextProps.architecture.year &&
    prevProps.architecture.completedYear === nextProps.architecture.completedYear &&
    prevProps.architecture.address === nextProps.architecture.address &&
    prevProps.architecture.city === nextProps.architecture.city &&
    prevProps.architecture.location === nextProps.architecture.location &&
    prevProps.architecture.category === nextProps.architecture.category &&
    prevProps.architecture.tags === nextProps.architecture.tags &&
    prevProps.architecture.tag === nextProps.architecture.tag
  );
});

ArchitectureCard.displayName = 'ArchitectureCard';

export default ArchitectureCard;