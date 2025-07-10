import React from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import {
  Breadcrumbs,
  Link,
  Typography,
  Box,
  Chip,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Home as HomeIcon,
  ChevronRight as ChevronRightIcon,
  Architecture as ArchitectureIcon,
  People as PeopleIcon,
  Map as MapIcon,
  Analytics as AnalyticsIcon,
} from '@mui/icons-material';

interface BreadcrumbItem {
  label: string;
  path?: string;
  icon?: React.ReactNode;
  current?: boolean;
}

interface BreadcrumbNavigationProps {
  customItems?: BreadcrumbItem[];
  showHome?: boolean;
  showIcons?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
}

const BreadcrumbNavigation: React.FC<BreadcrumbNavigationProps> = ({
  customItems,
  showHome = true,
  showIcons = true,
  variant = 'default'
}) => {
  const location = useLocation();
  const theme = useTheme();

  // Generate breadcrumbs from URL path if no custom items provided
  const generateBreadcrumbsFromPath = (): BreadcrumbItem[] => {
    const pathSegments = location.pathname.split('/').filter(segment => segment);
    const breadcrumbs: BreadcrumbItem[] = [];

    if (showHome) {
      breadcrumbs.push({
        label: 'ホーム',
        path: '/',
        icon: <HomeIcon fontSize="small" />
      });
    }

    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === pathSegments.length - 1;
      
      let label = segment;
      let icon = null;

      // Map path segments to Japanese labels and icons
      switch (segment) {
        case 'architecture':
          label = '建築作品';
          icon = <ArchitectureIcon fontSize="small" />;
          break;
        case 'architects':
          label = '建築家';
          icon = <PeopleIcon fontSize="small" />;
          break;
        case 'map':
          label = 'マップ';
          icon = <MapIcon fontSize="small" />;
          break;
        case 'research':
          label = '研究・分析';
          icon = <AnalyticsIcon fontSize="small" />;
          break;
        case 'categories':
          label = 'カテゴリー';
          break;
        case 'search':
          label = '検索結果';
          break;
        default:
          // If it's a number, it might be an ID
          if (/^\d+$/.test(segment)) {
            label = `詳細 (${segment})`;
          } else {
            // Capitalize first letter
            label = segment.charAt(0).toUpperCase() + segment.slice(1);
          }
      }

      breadcrumbs.push({
        label,
        path: isLast ? undefined : currentPath,
        icon: showIcons ? icon : undefined,
        current: isLast
      });
    });

    return breadcrumbs;
  };

  const breadcrumbItems = customItems || generateBreadcrumbsFromPath();

  // Don't render if only home item exists
  if (breadcrumbItems.length <= 1 && !customItems) {
    return null;
  }

  const renderBreadcrumbItem = (item: BreadcrumbItem, index: number) => {
    const isLast = index === breadcrumbItems.length - 1;
    const isClickable = item.path && !item.current;

    const content = (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          padding: variant === 'compact' ? '4px 8px' : '6px 12px',
          borderRadius: 1,
          transition: 'all 0.2s ease',
          backgroundColor: item.current
            ? alpha(theme.palette.primary.main, 0.1)
            : 'transparent',
          border: item.current
            ? `1px solid ${alpha(theme.palette.primary.main, 0.3)}`
            : '1px solid transparent',
          ...(isClickable && {
            '&:hover': {
              backgroundColor: alpha(theme.palette.primary.main, 0.05),
              borderColor: alpha(theme.palette.primary.main, 0.2),
            },
          }),
        }}
      >
        {item.icon && showIcons && (
          <Box
            sx={{
              color: item.current ? 'primary.main' : 'text.secondary',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {item.icon}
          </Box>
        )}
        <Typography
          variant={variant === 'compact' ? 'body2' : 'body1'}
          sx={{
            color: item.current ? 'primary.main' : isClickable ? 'primary.main' : 'text.primary',
            fontWeight: item.current ? 600 : isClickable ? 500 : 400,
            fontSize: variant === 'compact' ? '0.875rem' : '1rem',
          }}
        >
          {item.label}
        </Typography>
      </Box>
    );

    if (isClickable) {
      return (
        <Link
          key={index}
          component={RouterLink}
          to={item.path!}
          underline="none"
          sx={{
            textDecoration: 'none',
            '&:hover': {
              textDecoration: 'none',
            },
          }}
        >
          {content}
        </Link>
      );
    }

    return (
      <Box key={index}>
        {content}
      </Box>
    );
  };

  return (
    <Box
      component="nav"
      aria-label="パンくずナビゲーション"
      sx={{
        py: variant === 'compact' ? 1 : 2,
        px: variant === 'compact' ? 0 : 1,
        backgroundColor: variant === 'detailed'
          ? alpha(theme.palette.background.paper, 0.8)
          : 'transparent',
        borderRadius: variant === 'detailed' ? 1 : 0,
        border: variant === 'detailed'
          ? `1px solid ${alpha(theme.palette.divider, 0.5)}`
          : 'none',
      }}
    >
      <Breadcrumbs
        separator={
          <ChevronRightIcon
            fontSize="small"
            sx={{
              color: 'text.secondary',
              mx: 0.5,
            }}
          />
        }
        aria-label="breadcrumb"
        sx={{
          '& .MuiBreadcrumbs-ol': {
            flexWrap: 'wrap',
            alignItems: 'center',
          },
          '& .MuiBreadcrumbs-separator': {
            mx: variant === 'compact' ? 0.5 : 1,
          },
        }}
      >
        {breadcrumbItems.map(renderBreadcrumbItem)}
      </Breadcrumbs>

      {/* URL Query Parameters Display (for detailed variant) */}
      {variant === 'detailed' && location.search && (
        <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {new URLSearchParams(location.search).entries() &&
            Array.from(new URLSearchParams(location.search).entries()).map(([key, value], index) => (
              <Chip
                key={index}
                label={`${key}: ${decodeURIComponent(value)}`}
                size="small"
                variant="outlined"
                sx={{
                  fontSize: '0.75rem',
                  height: 24,
                  '& .MuiChip-label': {
                    px: 1,
                  },
                }}
              />
            ))
          }
        </Box>
      )}
    </Box>
  );
};

export default BreadcrumbNavigation;