import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Typography,
  Box,
  Chip
} from '@mui/material';
import EventIcon from '@mui/icons-material/Event';
import LocationOnIcon from '@mui/icons-material/LocationOn';

interface Architecture {
  id: number;
  name: string;
  completedYear: number;
  city?: string;
  location?: string;
  tag?: string;
}

interface ArchitectureListProps {
  architectures: Architecture[];
  compact?: boolean;
}

/**
 * 建築作品のリストを表示するコンポーネント
 */
const ArchitectureList: React.FC<ArchitectureListProps> = ({ architectures, compact = false }) => {
  if (!architectures || architectures.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        登録されている作品はありません。
      </Typography>
    );
  }

  return (
    <Grid container spacing={compact ? 2 : 3}>
      {architectures.map((architecture) => (
        <Grid item key={architecture.id} xs={12} sm={6} md={compact ? 6 : 4}>
          <Card 
            sx={{ 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column',
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'scale(1.02)',
              },
            }}
          >
            <CardActionArea 
              component={RouterLink} 
              to={`/architecture/${architecture.id}`}
              sx={{ flexGrow: 1 }}
            >
              <CardContent>
                <Typography gutterBottom variant="h6" component="h2">
                  {architecture.name}
                </Typography>
                
                {architecture.completedYear > 0 && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <EventIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {architecture.completedYear}年
                    </Typography>
                  </Box>
                )}
                
                {(architecture.city || architecture.location) && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <LocationOnIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {architecture.city ? architecture.city : ''}
                      {architecture.city && architecture.location ? ' / ' : ''}
                      {architecture.location ? architecture.location : ''}
                    </Typography>
                  </Box>
                )}
                
                {/* 作品のタグを表示 */}
                {architecture.tag && (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                    {architecture.tag.split(',')
                      .filter(tag => tag.trim() !== '' && !tag.includes('の追加建築'))
                      .map((tag, idx) => (
                        <Chip 
                          key={idx}
                          label={tag.trim()}
                          size="small"
                          color="secondary"
                          variant="outlined"
                          sx={{ height: '20px', fontSize: '0.65rem' }}
                        />
                      ))
                    }
                  </Box>
                )}
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default ArchitectureList; 