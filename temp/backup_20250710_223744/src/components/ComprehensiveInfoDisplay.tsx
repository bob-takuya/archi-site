import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Stack,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
  Avatar,
  Button,
  useTheme,
  alpha,
  Rating,
  LinearProgress,
  Tooltip,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  Architecture as ArchitectureIcon,
  Info as InfoIcon,
  Star as StarIcon,
  Visibility as ViewIcon,
  Business as BusinessIcon,
  Schedule as ScheduleIcon,
  Engineering as EngineeringIcon,
  Photo as PhotoIcon,
  Map as MapIcon,
  Link as LinkIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Public as WebsiteIcon,
  Award as AwardIcon,
  Category as CategoryIcon,
  Height as HeightIcon,
  SquareFoot as AreaIcon,
  Euro as CostIcon,
} from '@mui/icons-material';

interface ArchitectureDetails {
  id: number;
  title: string;
  titleEn?: string;
  architect: string;
  architectEn?: string;
  year: number;
  completionDate?: string;
  location: {
    address: string;
    prefecture: string;
    city: string;
    coordinates?: [number, number];
  };
  category: string;
  style: string[];
  description: string;
  technicalDetails: {
    structure: string;
    materials: string[];
    floors: number;
    height?: number;
    area: number;
    cost?: string;
  };
  architect_info: {
    name: string;
    nameEn?: string;
    firm: string;
    established?: number;
    website?: string;
    email?: string;
    phone?: string;
    awards?: string[];
  };
  projectDetails: {
    client: string;
    contractor?: string;
    engineer?: string;
    consultants?: string[];
    duration?: string;
  };
  statistics: {
    views: number;
    rating: number;
    reviewCount: number;
    lastUpdated: string;
  };
  media: {
    photos: number;
    videos: number;
    plans: number;
    hasVirtualTour: boolean;
  };
  awards?: {
    name: string;
    year: number;
    organization: string;
  }[];
  relatedProjects?: {
    id: number;
    title: string;
    similarity: number;
  }[];
}

interface ComprehensiveInfoDisplayProps {
  data: ArchitectureDetails;
  compact?: boolean;
  showAllSections?: boolean;
}

const ComprehensiveInfoDisplay: React.FC<ComprehensiveInfoDisplayProps> = ({
  data,
  compact = false,
  showAllSections = true
}) => {
  const theme = useTheme();
  const [expandedSections, setExpandedSections] = useState<string[]>(
    compact ? [] : ['basic', 'technical', 'team']
  );

  const handleSectionToggle = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const formatNumber = (num: number): string => {
    return num.toLocaleString('ja-JP');
  };

  const getSimilarityColor = (similarity: number): string => {
    if (similarity >= 80) return theme.palette.success.main;
    if (similarity >= 60) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header Information - Always Visible */}
      <Card 
        elevation={3}
        sx={{ 
          mb: 3,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.02)} 100%)`,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
        }}
      >
        <CardContent sx={{ p: 4 }}>
          {/* Title and Basic Info */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
              {data.title}
            </Typography>
            {data.titleEn && (
              <Typography variant="h5" color="text.secondary" sx={{ mb: 2, fontStyle: 'italic' }}>
                {data.titleEn}
              </Typography>
            )}
            
            {/* Key Details Grid */}
            <Grid container spacing={3} sx={{ mt: 2 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <PersonIcon color="primary" fontSize="small" />
                  <Typography variant="subtitle2" color="text.secondary">
                    建築家
                  </Typography>
                </Box>
                <Typography variant="body1" fontWeight={600}>
                  {data.architect}
                </Typography>
                {data.architectEn && (
                  <Typography variant="body2" color="text.secondary">
                    {data.architectEn}
                  </Typography>
                )}
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <CalendarIcon color="primary" fontSize="small" />
                  <Typography variant="subtitle2" color="text.secondary">
                    竣工年
                  </Typography>
                </Box>
                <Typography variant="body1" fontWeight={600}>
                  {data.year}年
                </Typography>
                {data.completionDate && (
                  <Typography variant="body2" color="text.secondary">
                    {data.completionDate}
                  </Typography>
                )}
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <LocationIcon color="primary" fontSize="small" />
                  <Typography variant="subtitle2" color="text.secondary">
                    所在地
                  </Typography>
                </Box>
                <Typography variant="body1" fontWeight={600}>
                  {data.location.prefecture}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {data.location.city}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <CategoryIcon color="primary" fontSize="small" />
                  <Typography variant="subtitle2" color="text.secondary">
                    カテゴリー
                  </Typography>
                </Box>
                <Chip label={data.category} color="primary" variant="outlined" />
              </Grid>
            </Grid>
          </Box>

          {/* Statistics Bar */}
          <Paper 
            elevation={1} 
            sx={{ 
              p: 2, 
              backgroundColor: alpha(theme.palette.background.paper, 0.8),
              border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
            }}
          >
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={6} sm={3}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ViewIcon fontSize="small" color="info" />
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      {formatNumber(data.statistics.views)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      閲覧数
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              
              <Grid item xs={6} sm={3}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <StarIcon fontSize="small" color="warning" />
                  <Box>
                    <Rating 
                      value={data.statistics.rating} 
                      readOnly 
                      precision={0.1} 
                      size="small"
                    />
                    <Typography variant="caption" color="text.secondary">
                      {data.statistics.reviewCount}件の評価
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              
              <Grid item xs={6} sm={3}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PhotoIcon fontSize="small" color="success" />
                  <Box>
                    <Typography variant="body2" fontWeight={600}>
                      {data.media.photos}枚 / {data.media.videos}本
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      写真 / 動画
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary">
                  最終更新: {data.statistics.lastUpdated}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </CardContent>
      </Card>

      {/* Detailed Information Sections */}
      {showAllSections && (
        <Stack spacing={2}>
          {/* Basic Information */}
          <Accordion 
            expanded={expandedSections.includes('basic')}
            onChange={() => handleSectionToggle('basic')}
            sx={{
              border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
              '&:before': { display: 'none' },
            }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <InfoIcon color="primary" />
                <Typography variant="h6" fontWeight={600}>
                  基本情報
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                  <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
                    {data.description}
                  </Typography>
                  
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      建築スタイル
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      {data.style.map((style, index) => (
                        <Chip 
                          key={index} 
                          label={style} 
                          size="small" 
                          variant="outlined" 
                          color="secondary"
                        />
                      ))}
                    </Stack>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Paper elevation={1} sx={{ p: 2, backgroundColor: alpha(theme.palette.info.main, 0.05) }}>
                    <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <MapIcon fontSize="small" />
                      詳細位置
                    </Typography>
                    <Typography variant="body2" paragraph>
                      {data.location.address}
                    </Typography>
                    {data.location.coordinates && (
                      <Typography variant="caption" color="text.secondary">
                        緑度: {data.location.coordinates[0]}°<br />
                        緯度: {data.location.coordinates[1]}°
                      </Typography>
                    )}
                  </Paper>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Technical Details */}
          <Accordion 
            expanded={expandedSections.includes('technical')}
            onChange={() => handleSectionToggle('technical')}
            sx={{
              border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
              '&:before': { display: 'none' },
            }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <EngineeringIcon color="primary" />
                <Typography variant="h6" fontWeight={600}>
                  技術仕様
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center', p: 2, backgroundColor: alpha(theme.palette.primary.main, 0.05), borderRadius: 1 }}>
                    <HeightIcon color="primary" sx={{ mb: 1, fontSize: '2rem' }} />
                    <Typography variant="h6" fontWeight="bold">
                      {data.technicalDetails.floors}階
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      地上階数
                    </Typography>
                    {data.technicalDetails.height && (
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        高さ: {data.technicalDetails.height}m
                      </Typography>
                    )}
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center', p: 2, backgroundColor: alpha(theme.palette.secondary.main, 0.05), borderRadius: 1 }}>
                    <AreaIcon color="secondary" sx={{ mb: 1, fontSize: '2rem' }} />
                    <Typography variant="h6" fontWeight="bold">
                      {formatNumber(data.technicalDetails.area)}m²
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      延べ床面積
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center', p: 2, backgroundColor: alpha(theme.palette.info.main, 0.05), borderRadius: 1 }}>
                    <EngineeringIcon color="info" sx={{ mb: 1, fontSize: '2rem' }} />
                    <Typography variant="h6" fontWeight="bold">
                      {data.technicalDetails.structure}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      構造
                    </Typography>
                  </Box>
                </Grid>
                
                {data.technicalDetails.cost && (
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ textAlign: 'center', p: 2, backgroundColor: alpha(theme.palette.success.main, 0.05), borderRadius: 1 }}>
                      <CostIcon color="success" sx={{ mb: 1, fontSize: '2rem' }} />
                      <Typography variant="h6" fontWeight="bold">
                        {data.technicalDetails.cost}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        建設費
                      </Typography>
                    </Box>
                  </Grid>
                )}
              </Grid>
              
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  使用材料
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {data.technicalDetails.materials.map((material, index) => (
                    <Chip 
                      key={index} 
                      label={material} 
                      size="small" 
                      variant="filled" 
                      color="info"
                    />
                  ))}
                </Stack>
              </Box>
            </AccordionDetails>
          </Accordion>

          {/* Project Team */}
          <Accordion 
            expanded={expandedSections.includes('team')}
            onChange={() => handleSectionToggle('team')}
            sx={{
              border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
              '&:before': { display: 'none' },
            }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <BusinessIcon color="primary" />
                <Typography variant="h6" fontWeight={600}>
                  プロジェクトチーム
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                {/* Architect Information */}
                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          <PersonIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="h6">
                            {data.architect_info.name}
                          </Typography>
                          {data.architect_info.nameEn && (
                            <Typography variant="body2" color="text.secondary">
                              {data.architect_info.nameEn}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                      
                      <List dense>
                        <ListItem sx={{ px: 0 }}>
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            <BusinessIcon fontSize="small" />
                          </ListItemIcon>
                          <ListItemText 
                            primary="事務所" 
                            secondary={data.architect_info.firm}
                          />
                        </ListItem>
                        
                        {data.architect_info.established && (
                          <ListItem sx={{ px: 0 }}>
                            <ListItemIcon sx={{ minWidth: 36 }}>
                              <CalendarIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText 
                              primary="設立" 
                              secondary={`${data.architect_info.established}年`}
                            />
                          </ListItem>
                        )}
                        
                        {data.architect_info.website && (
                          <ListItem sx={{ px: 0 }}>
                            <ListItemIcon sx={{ minWidth: 36 }}>
                              <WebsiteIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText 
                              primary={<Button size="small" startIcon={<LinkIcon />}>Webサイト</Button>}
                            />
                          </ListItem>
                        )}
                      </List>
                      
                      {data.architect_info.awards && data.architect_info.awards.length > 0 && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <AwardIcon fontSize="small" />
                            主な受賞歴
                          </Typography>
                          <Stack spacing={1}>
                            {data.architect_info.awards.slice(0, 3).map((award, index) => (
                              <Chip key={index} label={award} size="small" color="warning" variant="outlined" />
                            ))}
                          </Stack>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
                
                {/* Project Details */}
                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        プロジェクト詳細
                      </Typography>
                      
                      <List dense>
                        <ListItem sx={{ px: 0 }}>
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            <BusinessIcon fontSize="small" />
                          </ListItemIcon>
                          <ListItemText 
                            primary="クライアント" 
                            secondary={data.projectDetails.client}
                          />
                        </ListItem>
                        
                        {data.projectDetails.contractor && (
                          <ListItem sx={{ px: 0 }}>
                            <ListItemIcon sx={{ minWidth: 36 }}>
                              <EngineeringIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText 
                              primary="施工会社" 
                              secondary={data.projectDetails.contractor}
                            />
                          </ListItem>
                        )}
                        
                        {data.projectDetails.engineer && (
                          <ListItem sx={{ px: 0 }}>
                            <ListItemIcon sx={{ minWidth: 36 }}>
                              <EngineeringIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText 
                              primary="構造設計" 
                              secondary={data.projectDetails.engineer}
                            />
                          </ListItem>
                        )}
                        
                        {data.projectDetails.duration && (
                          <ListItem sx={{ px: 0 }}>
                            <ListItemIcon sx={{ minWidth: 36 }}>
                              <ScheduleIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText 
                              primary="工期" 
                              secondary={data.projectDetails.duration}
                            />
                          </ListItem>
                        )}
                      </List>
                      
                      {data.projectDetails.consultants && data.projectDetails.consultants.length > 0 && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            コンサルタント
                          </Typography>
                          <Stack spacing={1}>
                            {data.projectDetails.consultants.map((consultant, index) => (
                              <Chip key={index} label={consultant} size="small" variant="outlined" />
                            ))}
                          </Stack>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Awards */}
          {data.awards && data.awards.length > 0 && (
            <Accordion 
              expanded={expandedSections.includes('awards')}
              onChange={() => handleSectionToggle('awards')}
              sx={{
                border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                '&:before': { display: 'none' },
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <AwardIcon color="primary" />
                  <Typography variant="h6" fontWeight={600}>
                    受賞歴 ({data.awards.length}件)
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  {data.awards.map((award, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                      <Card variant="outlined" sx={{ height: '100%' }}>
                        <CardContent sx={{ textAlign: 'center' }}>
                          <AwardIcon color="warning" sx={{ fontSize: '3rem', mb: 1 }} />
                          <Typography variant="h6" fontWeight={600} gutterBottom>
                            {award.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            {award.organization}
                          </Typography>
                          <Chip label={`${award.year}年`} size="small" color="warning" />
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </AccordionDetails>
            </Accordion>
          )}

          {/* Related Projects */}
          {data.relatedProjects && data.relatedProjects.length > 0 && (
            <Accordion 
              expanded={expandedSections.includes('related')}
              onChange={() => handleSectionToggle('related')}
              sx={{
                border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                '&:before': { display: 'none' },
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <ArchitectureIcon color="primary" />
                  <Typography variant="h6" fontWeight={600}>
                    関連プロジェクト
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={2}>
                  {data.relatedProjects.map((project, index) => (
                    <Paper 
                      key={index} 
                      elevation={1} 
                      sx={{ 
                        p: 2, 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.02),
                        },
                      }}
                    >
                      <Typography variant="body1" fontWeight={500}>
                        {project.title}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Tooltip title="類似度">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LinearProgress 
                              variant="determinate" 
                              value={project.similarity} 
                              sx={{ 
                                width: 60, 
                                height: 6,
                                backgroundColor: alpha(getSimilarityColor(project.similarity), 0.2),
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: getSimilarityColor(project.similarity),
                                },
                              }} 
                            />
                            <Typography variant="caption" color="text.secondary">
                              {project.similarity}%
                            </Typography>
                          </Box>
                        </Tooltip>
                        <Button size="small" variant="outlined">
                          詳細を見る
                        </Button>
                      </Box>
                    </Paper>
                  ))}
                </Stack>
              </AccordionDetails>
            </Accordion>
          )}
        </Stack>
      )}
    </Box>
  );
};

export default ComprehensiveInfoDisplay;