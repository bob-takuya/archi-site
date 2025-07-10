/**
 * Mobile-optimized architecture card with touch gestures and enhanced UX
 */

import React, { useState, useCallback } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  Paper,
  useTheme,
  alpha,
  Collapse,
  Fade
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Share as ShareIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  TouchApp as TouchAppIcon
} from '@mui/icons-material';
import MobileOptimizedImage from './MobileOptimizedImage';
import { useAdvancedTouchGestures, useLongPress } from '../utils/mobileGestures';
import { useViewportSize } from '../utils/mobileGestures';

interface Architecture {
  id: string;
  name: string;
  architect: string;
  year: number;
  location: string;
  description?: string;
  imageUrl?: string;
  tags?: string[];
  coordinates?: [number, number];
}

interface MobileArchitectureCardProps {
  architecture: Architecture;
  onFavorite?: (id: string) => void;
  onShare?: (architecture: Architecture) => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  isFavorited?: boolean;
  enableSwipeGestures?: boolean;
  compact?: boolean;
  showDescription?: boolean;
}

const MobileArchitectureCard: React.FC<MobileArchitectureCardProps> = ({
  architecture,
  onFavorite,
  onShare,
  onSwipeLeft,
  onSwipeRight,
  isFavorited = false,
  enableSwipeGestures = true,
  compact = false,
  showDescription = true
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const viewport = useViewportSize();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showActionHint, setShowActionHint] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  // Touch gesture handlers
  const { gestureHandlers } = useAdvancedTouchGestures(
    onSwipeLeft,
    onSwipeRight,
    undefined,
    undefined,
    {
      minSwipeDistance: viewport.isMobile ? 30 : 50,
      enableHapticFeedback: true
    }
  );

  // Long press for context menu
  const { gestureHandlers: longPressHandlers, isLongPressing } = useLongPress(() => {
    setShowActionHint(true);
    setTimeout(() => setShowActionHint(false), 2000);
  }, 500);

  // Handle card navigation
  const handleCardClick = useCallback((e: React.MouseEvent) => {
    if (e.defaultPrevented) return;
    navigate(`/architecture/${architecture.id}`);
  }, [navigate, architecture.id]);

  // Handle favorite toggle
  const handleFavorite = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onFavorite?.(architecture.id);
  }, [onFavorite, architecture.id]);

  // Handle share
  const handleShare = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: architecture.name,
          text: `${architecture.architect}による${architecture.name}`,
          url: window.location.origin + `/architecture/${architecture.id}`
        });
      } catch (error) {
        console.log('Share cancelled or failed');
      }
    } else {
      onShare?.(architecture);
    }
  }, [onShare, architecture]);

  // Handle description toggle
  const handleToggleDescription = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  }, [isExpanded]);

  // Touch feedback
  const handleTouchStart = () => setIsPressed(true);
  const handleTouchEnd = () => setIsPressed(false);

  // Card styles with touch feedback
  const cardStyles = {
    position: 'relative' as const,
    height: compact ? 'auto' : undefined,
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
    transform: isPressed ? 'scale(0.98)' : 'scale(1)',
    boxShadow: isPressed 
      ? `0 2px 8px ${alpha(theme.palette.common.black, 0.2)}`
      : `0 4px 12px ${alpha(theme.palette.common.black, 0.1)}`,
    borderRadius: theme.shape.borderRadius * 2,
    overflow: 'hidden',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: `0 8px 24px ${alpha(theme.palette.common.black, 0.15)}`
    },
    '&:active': {
      transform: 'scale(0.98)'
    }
  };

  return (
    <Card
      sx={cardStyles}
      onClick={handleCardClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      {...(enableSwipeGestures ? gestureHandlers : {})}
      {...longPressHandlers}
    >
      {/* Image section */}
      <Box sx={{ position: 'relative', height: compact ? 200 : 250 }}>
        <MobileOptimizedImage
          src={architecture.imageUrl || '/images/placeholder-architecture.jpg'}
          alt={`${architecture.name} by ${architecture.architect}`}
          height="100%"
          enableZoom={!compact}
          enableSwipeGestures={enableSwipeGestures}
          onSwipeLeft={onSwipeLeft}
          onSwipeRight={onSwipeRight}
          priority={false}
        />
        
        {/* Year badge */}
        <Chip
          label={architecture.year}
          size="small"
          sx={{
            position: 'absolute',
            top: 12,
            left: 12,
            backgroundColor: alpha(theme.palette.primary.main, 0.9),
            color: theme.palette.primary.contrastText,
            fontWeight: 'bold',
            fontSize: '0.75rem'
          }}
        />

        {/* Action buttons */}
        <Box
          sx={{
            position: 'absolute',
            top: 12,
            right: 12,
            display: 'flex',
            gap: 1
          }}
        >
          <IconButton
            onClick={handleFavorite}
            size="small"
            sx={{
              backgroundColor: alpha(theme.palette.background.paper, 0.9),
              color: isFavorited ? theme.palette.error.main : theme.palette.text.secondary,
              '&:hover': {
                backgroundColor: theme.palette.background.paper,
                transform: 'scale(1.1)'
              }
            }}
          >
            {isFavorited ? <FavoriteIcon fontSize="small" /> : <FavoriteBorderIcon fontSize="small" />}
          </IconButton>
          
          <IconButton
            onClick={handleShare}
            size="small"
            sx={{
              backgroundColor: alpha(theme.palette.background.paper, 0.9),
              color: theme.palette.text.secondary,
              '&:hover': {
                backgroundColor: theme.palette.background.paper,
                transform: 'scale(1.1)'
              }
            }}
          >
            <ShareIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Long press hint */}
        {showActionHint && (
          <Fade in={showActionHint}>
            <Paper
              elevation={3}
              sx={{
                position: 'absolute',
                bottom: 16,
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: 2,
                py: 1,
                backgroundColor: alpha(theme.palette.common.black, 0.8),
                color: theme.palette.common.white,
                fontSize: '0.75rem',
                borderRadius: 20
              }}
            >
              <TouchAppIcon fontSize="small" />
              長押しでアクション
            </Paper>
          </Fade>
        )}
      </Box>

      {/* Content section */}
      <CardContent
        sx={{
          p: viewport.isMobile ? 2 : 3,
          pb: compact ? 2 : 3
        }}
      >
        {/* Title */}
        <Typography
          variant="h6"
          component="h3"
          sx={{
            fontWeight: 'bold',
            fontSize: viewport.isMobile ? '1.1rem' : '1.25rem',
            lineHeight: 1.2,
            mb: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical'
          }}
        >
          {architecture.name}
        </Typography>

        {/* Architect */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <PersonIcon
            fontSize="small"
            sx={{ color: theme.palette.text.secondary, mr: 1 }}
          />
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontWeight: 500 }}
          >
            {architecture.architect}
          </Typography>
        </Box>

        {/* Location */}
        {architecture.location && (
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <LocationIcon
              fontSize="small"
              sx={{ color: theme.palette.text.secondary, mr: 1 }}
            />
            <Typography variant="body2" color="text.secondary">
              {architecture.location}
            </Typography>
          </Box>
        )}

        {/* Tags */}
        {architecture.tags && architecture.tags.length > 0 && (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 2 }}>
            {architecture.tags.slice(0, 3).map((tag, index) => (
              <Chip
                key={index}
                label={tag}
                size="small"
                variant="outlined"
                sx={{
                  fontSize: '0.75rem',
                  height: 24,
                  '& .MuiChip-label': {
                    px: 1
                  }
                }}
              />
            ))}
            {architecture.tags.length > 3 && (
              <Chip
                label={`+${architecture.tags.length - 3}`}
                size="small"
                variant="outlined"
                sx={{
                  fontSize: '0.75rem',
                  height: 24,
                  color: theme.palette.text.secondary
                }}
              />
            )}
          </Box>
        )}

        {/* Description (expandable) */}
        {showDescription && architecture.description && !compact && (
          <>
            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  lineHeight: 1.5,
                  mb: 1
                }}
              >
                {architecture.description}
              </Typography>
            </Collapse>
            
            {architecture.description.length > 100 && (
              <IconButton
                onClick={handleToggleDescription}
                size="small"
                sx={{
                  color: theme.palette.primary.main,
                  p: 0.5,
                  mt: 0.5
                }}
              >
                {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                <Typography
                  variant="caption"
                  sx={{ ml: 0.5, fontSize: '0.75rem' }}
                >
                  {isExpanded ? '折りたたむ' : '詳細を見る'}
                </Typography>
              </IconButton>
            )}
          </>
        )}
      </CardContent>

      {/* Long press indicator */}
      {isLongPressing && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: alpha(theme.palette.primary.main, 0.1),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none'
          }}
        >
          <Paper
            elevation={3}
            sx={{
              px: 3,
              py: 2,
              backgroundColor: alpha(theme.palette.primary.main, 0.9),
              color: theme.palette.primary.contrastText,
              borderRadius: 20
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              アクションメニュー
            </Typography>
          </Paper>
        </Box>
      )}
    </Card>
  );
};

export default MobileArchitectureCard;