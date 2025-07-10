import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Typography,
  Box,
  Avatar,
  Chip,
  Stack,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Home as ResidentialIcon,
  Business as CommercialIcon,
  AccountBalance as CulturalIcon,
  Temple as ReligiousIcon,
  School as EducationalIcon,
  Train as TransportationIcon,
  Architecture as ModernIcon,
  Cottage as TraditionalIcon,
} from '@mui/icons-material';

interface CategoryItem {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  icon: React.ReactNode;
  count: number;
  color: string;
  gradient: string;
  path: string;
}

const categories: CategoryItem[] = [
  {
    id: 'residential',
    name: '住宅建築',
    nameEn: 'Residential',
    description: '個人住宅、集合住宅、住宅団地など',
    icon: <ResidentialIcon />,
    count: 4200,
    color: '#8D6E63',
    gradient: 'linear-gradient(135deg, #8D6E63 0%, #A1887F 100%)',
    path: '/architecture?category=residential'
  },
  {
    id: 'commercial',
    name: '商業建築',
    nameEn: 'Commercial',
    description: 'オフィス、店舗、商業施設、ホテルなど',
    icon: <CommercialIcon />,
    count: 2800,
    color: '#5D4037',
    gradient: 'linear-gradient(135deg, #5D4037 0%, #795548 100%)',
    path: '/architecture?category=commercial'
  },
  {
    id: 'cultural',
    name: '文化施設',
    nameEn: 'Cultural',
    description: '美術館、博物館、図書館、劇場など',
    icon: <CulturalIcon />,
    count: 1900,
    color: '#D84315',
    gradient: 'linear-gradient(135deg, #D84315 0%, #FF5722 100%)',
    path: '/architecture?category=cultural'
  },
  {
    id: 'religious',
    name: '宗教建築',
    nameEn: 'Religious',
    description: '神社、寺院、教会、宗教施設など',
    icon: <ReligiousIcon />,
    count: 1600,
    color: '#6A1B9A',
    gradient: 'linear-gradient(135deg, #6A1B9A 0%, #9C27B0 100%)',
    path: '/architecture?category=religious'
  },
  {
    id: 'educational',
    name: '教育施設',
    nameEn: 'Educational',
    description: '学校、大学、研究施設、教育機関など',
    icon: <EducationalIcon />,
    count: 1400,
    color: '#1565C0',
    gradient: 'linear-gradient(135deg, #1565C0 0%, #2196F3 100%)',
    path: '/architecture?category=educational'
  },
  {
    id: 'transportation',
    name: '交通施設',
    nameEn: 'Transportation',
    description: '駅、空港、バスターミナル、交通インフラなど',
    icon: <TransportationIcon />,
    count: 800,
    color: '#2E7D32',
    gradient: 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)',
    path: '/architecture?category=transportation'
  },
  {
    id: 'modern',
    name: '現代建築',
    nameEn: 'Modern',
    description: '2000年以降の現代的な建築作品',
    icon: <ModernIcon />,
    count: 3200,
    color: '#424242',
    gradient: 'linear-gradient(135deg, #424242 0%, #616161 100%)',
    path: '/architecture?era=modern'
  },
  {
    id: 'traditional',
    name: '伝統建築',
    nameEn: 'Traditional',
    description: '日本の伝統的な建築様式と技法',
    icon: <TraditionalIcon />,
    count: 1200,
    color: '#BF360C',
    gradient: 'linear-gradient(135deg, #BF360C 0%, #FF5722 100%)',
    path: '/architecture?style=traditional'
  },
];

interface CategoryGridProps {
  title?: string;
  subtitle?: string;
  maxItems?: number;
}

const CategoryGrid: React.FC<CategoryGridProps> = ({ 
  title = 'カテゴリー別に探す', 
  subtitle = '建築作品をカテゴリーから探索できます',
  maxItems 
}) => {
  const theme = useTheme();
  const displayCategories = maxItems ? categories.slice(0, maxItems) : categories;

  return (
    <Box component="section" sx={{ py: 4 }}>
      {/* Section Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography 
          variant="h3" 
          component="h2" 
          gutterBottom
          sx={{ 
            fontWeight: 'bold',
            color: 'primary.main',
            mb: 2
          }}
        >
          {title}
        </Typography>
        <Typography 
          variant="h6" 
          color="text.secondary" 
          sx={{ 
            maxWidth: 600, 
            mx: 'auto',
            lineHeight: 1.6
          }}
        >
          {subtitle}
        </Typography>
      </Box>

      {/* Category Grid */}
      <Grid container spacing={3}>
        {displayCategories.map((category) => (
          <Grid item key={category.id} xs={12} sm={6} md={4} lg={3}>
            <Card
              component={RouterLink}
              to={category.path}
              sx={{
                height: '100%',
                textDecoration: 'none',
                position: 'relative',
                overflow: 'hidden',
                background: category.gradient,
                color: 'white',
                transition: 'all 0.3s ease-in-out',
                transform: 'translateY(0)',
                '&:hover': {
                  transform: 'translateY(-8px) scale(1.02)',
                  boxShadow: `0 12px 32px ${alpha(category.color, 0.4)}`,
                  '& .category-icon': {
                    transform: 'scale(1.1) rotate(5deg)',
                  },
                  '& .category-overlay': {
                    opacity: 0.9,
                  },
                },
              }}
            >
              {/* Background Pattern */}
              <Box
                className="category-overlay"
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  opacity: 0.1,
                  background: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)',
                  transition: 'opacity 0.3s ease',
                }}
              />
              
              <CardActionArea sx={{ height: '100%', p: 0 }}>
                <CardContent sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  p: 3,
                  position: 'relative',
                  zIndex: 1,
                  minHeight: 180,
                }}>
                  {/* Icon */}
                  <Avatar
                    className="category-icon"
                    sx={{
                      width: 64,
                      height: 64,
                      mb: 2,
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      color: 'white',
                      transition: 'all 0.3s ease',
                      '& svg': {
                        fontSize: '2rem',
                      },
                    }}
                  >
                    {category.icon}
                  </Avatar>

                  {/* Title */}
                  <Typography 
                    variant="h5" 
                    component="h3" 
                    gutterBottom
                    sx={{ 
                      fontWeight: 'bold',
                      mb: 1,
                      textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                    }}
                  >
                    {category.name}
                  </Typography>

                  {/* English Name */}
                  <Typography 
                    variant="subtitle2" 
                    sx={{ 
                      opacity: 0.9,
                      mb: 1,
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      fontSize: '0.75rem',
                    }}
                  >
                    {category.nameEn}
                  </Typography>

                  {/* Description */}
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      opacity: 0.9,
                      mb: 2,
                      lineHeight: 1.5,
                      fontSize: '0.875rem',
                    }}
                  >
                    {category.description}
                  </Typography>

                  {/* Count Chip */}
                  <Chip
                    label={`${category.count.toLocaleString()}件`}
                    size="small"
                    sx={{
                      backgroundColor: 'rgba(255, 255, 255, 0.25)',
                      color: 'white',
                      fontWeight: 'bold',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      fontSize: '0.75rem',
                    }}
                  />
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* View All Categories Link */}
      {maxItems && categories.length > maxItems && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Card
            component={RouterLink}
            to="/categories"
            sx={{
              textDecoration: 'none',
              backgroundColor: 'background.paper',
              border: '2px dashed',
              borderColor: 'primary.main',
              transition: 'all 0.3s ease',
              '&:hover': {
                borderColor: 'secondary.main',
                backgroundColor: alpha(theme.palette.primary.main, 0.05),
                transform: 'translateY(-2px)',
              },
            }}
          >
            <CardActionArea>
              <CardContent sx={{ 
                textAlign: 'center', 
                py: 4, 
                px: 6,
                minHeight: 120,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}>
                <Typography variant="h6" color="primary" gutterBottom>
                  すべてのカテゴリーを見る
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {categories.length}つのカテゴリーから選択
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        </Box>
      )}
    </Box>
  );
};

export default CategoryGrid;