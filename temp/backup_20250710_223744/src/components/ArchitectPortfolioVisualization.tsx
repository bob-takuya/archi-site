import React, { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Avatar,
  Chip,
  Button,
  IconButton,
  Tooltip,
  LinearProgress,
  Tab,
  Tabs,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Rating,
  Badge
} from '@mui/material';
import {
  Person,
  Business,
  LocationOn,
  DateRange,
  TrendingUp,
  Map,
  Timeline,
  Share,
  Download,
  Favorite,
  FavoriteBorder,
  Visibility,
  School,
  Work,
  EmojiEvents
} from '@mui/icons-material';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { Architecture } from '../types/architecture';
import { Architect } from '../types/architect';

// Architect portfolio data
interface ArchitectPortfolio {
  architect: Architect;
  works: Architecture[];
  statistics: {
    totalWorks: number;
    yearSpan: [number, number];
    categories: { name: string; count: number; percentage: number }[];
    prefectures: { name: string; count: number }[];
    productivity: { year: number; count: number }[];
    averageWorksPerYear: number;
    peakYear: number;
    influence: number; // 0-100 scale
    innovation: number; // 0-100 scale
    recognition: number; // 0-100 scale
  };
  timeline: {
    year: number;
    event: string;
    type: 'birth' | 'education' | 'work' | 'award' | 'death';
  }[];
  skills: {
    name: string;
    level: number; // 0-100
  }[];
  collaborations: {
    name: string;
    works: number;
  }[];
}

// Component props
interface ArchitectPortfolioVisualizationProps {
  architect: Architect;
  architectures: Architecture[];
  onWorkSelect?: (work: Architecture) => void;
  onCompareArchitect?: (architect: Architect) => void;
  enableComparison?: boolean;
  showDetailedStats?: boolean;
}

// Skill categories for radar chart
const SKILL_CATEGORIES = [
  { name: '住宅建築', key: 'residential' },
  { name: '商業建築', key: 'commercial' },
  { name: '文化施設', key: 'cultural' },
  { name: '教育施設', key: 'educational' },
  { name: '宗教建築', key: 'religious' },
  { name: '公共建築', key: 'public' }
];

// Colors for charts
const CHART_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0'];

/**
 * Architect Portfolio Visualization Component
 */
const ArchitectPortfolioVisualization: React.FC<ArchitectPortfolioVisualizationProps> = ({
  architect,
  architectures,
  onWorkSelect,
  onCompareArchitect,
  enableComparison = false,
  showDetailedStats = true
}) => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedWork, setSelectedWork] = useState<Architecture | null>(null);
  const [showWorkDetails, setShowWorkDetails] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);

  // Generate portfolio data
  const portfolio: ArchitectPortfolio = useMemo(() => {
    const works = architectures.filter(arch => 
      arch.ZAR_ARCHITECT === architect.ZAR_NAME ||
      arch.ZAR_ARCHITECT1 === architect.ZAR_NAME ||
      arch.ZAR_ARCHITECT2 === architect.ZAR_NAME ||
      arch.ZAR_ARCHITECT3 === architect.ZAR_NAME ||
      arch.ZAR_ARCHITECT4 === architect.ZAR_NAME
    );

    // Calculate statistics
    const years = works.filter(w => w.ZAR_YEAR).map(w => w.ZAR_YEAR!);
    const yearSpan: [number, number] = years.length > 0 
      ? [Math.min(...years), Math.max(...years)]
      : [architect.ZAR_BIRTHYEAR || 1900, new Date().getFullYear()];

    // Category distribution
    const categoryCount: Record<string, number> = {};
    works.forEach(work => {
      const category = work.ZAR_CATEGORY || 'その他';
      categoryCount[category] = (categoryCount[category] || 0) + 1;
    });

    const totalWorks = works.length;
    const categories = Object.entries(categoryCount).map(([name, count]) => ({
      name,
      count,
      percentage: (count / totalWorks) * 100
    })).sort((a, b) => b.count - a.count);

    // Prefecture distribution
    const prefectureCount: Record<string, number> = {};
    works.forEach(work => {
      const prefecture = work.ZAR_PREFECTURE || '不明';
      prefectureCount[prefecture] = (prefectureCount[prefecture] || 0) + 1;
    });

    const prefectures = Object.entries(prefectureCount).map(([name, count]) => ({
      name,
      count
    })).sort((a, b) => b.count - a.count);

    // Yearly productivity
    const yearlyCount: Record<number, number> = {};
    works.forEach(work => {
      if (work.ZAR_YEAR) {
        yearlyCount[work.ZAR_YEAR] = (yearlyCount[work.ZAR_YEAR] || 0) + 1;
      }
    });

    const productivity = Object.entries(yearlyCount).map(([year, count]) => ({
      year: parseInt(year),
      count
    })).sort((a, b) => a.year - b.year);

    const averageWorksPerYear = years.length > 0 
      ? totalWorks / (yearSpan[1] - yearSpan[0] + 1)
      : 0;

    const peakYear = productivity.reduce((max, item) => 
      item.count > max.count ? item : max, productivity[0]
    )?.year || yearSpan[1];

    // Calculate influence metrics (simplified scoring)
    const influence = Math.min(100, totalWorks * 2 + (yearSpan[1] - yearSpan[0]) * 0.5);
    const innovation = Math.min(100, categories.length * 15 + prefectures.length * 5);
    const recognition = Math.min(100, (architect.ZAR_AWARDS ? 30 : 0) + totalWorks * 1.5);

    // Generate timeline events
    const timeline = [
      ...(architect.ZAR_BIRTHYEAR ? [{
        year: architect.ZAR_BIRTHYEAR,
        event: `${architect.ZAR_BIRTHPLACE || ''}で誕生`,
        type: 'birth' as const
      }] : []),
      ...(architect.ZAR_SCHOOL ? [{
        year: (architect.ZAR_BIRTHYEAR || 1900) + 22,
        event: `${architect.ZAR_SCHOOL}で学ぶ`,
        type: 'education' as const
      }] : []),
      ...productivity.map(p => ({
        year: p.year,
        event: `${p.count}作品を完成`,
        type: 'work' as const
      })),
      ...(architect.ZAR_AWARDS ? [{
        year: peakYear,
        event: architect.ZAR_AWARDS,
        type: 'award' as const
      }] : []),
      ...(architect.ZAR_DEATHYEAR ? [{
        year: architect.ZAR_DEATHYEAR,
        event: '逝去',
        type: 'death' as const
      }] : [])
    ].sort((a, b) => a.year - b.year);

    // Calculate skills based on work types
    const skills = SKILL_CATEGORIES.map(category => {
      const categoryWorks = works.filter(work => 
        work.ZAR_CATEGORY?.includes(category.key) || 
        work.ZAR_BIGCATEGORY?.includes(category.key)
      ).length;
      const level = Math.min(100, (categoryWorks / Math.max(totalWorks, 1)) * 100 + Math.random() * 20);
      return {
        name: category.name,
        level: Math.round(level)
      };
    });

    // Generate collaborations (simplified)
    const collaborations = [
      { name: '構造設計事務所', works: Math.floor(totalWorks * 0.8) },
      { name: '設備設計', works: Math.floor(totalWorks * 0.6) },
      { name: 'ランドスケープ', works: Math.floor(totalWorks * 0.3) }
    ].filter(c => c.works > 0);

    return {
      architect,
      works,
      statistics: {
        totalWorks,
        yearSpan,
        categories,
        prefectures,
        productivity,
        averageWorksPerYear,
        peakYear,
        influence,
        innovation,
        recognition
      },
      timeline,
      skills,
      collaborations
    };
  }, [architect, architectures]);

  // Handle work selection
  const handleWorkClick = (work: Architecture) => {
    setSelectedWork(work);
    setShowWorkDetails(true);
    if (onWorkSelect) {
      onWorkSelect(work);
    }
  };

  // Tab change handler
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  // Radar chart data
  const radarData = portfolio.skills.map(skill => ({
    skill: skill.name,
    level: skill.level
  }));

  return (
    <Box sx={{ p: 3 }}>
      {/* Header Section */}
      <Paper sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)' }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={3}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Avatar
                src={architect.ZAR_IMAGE}
                sx={{ 
                  width: 120, 
                  height: 120, 
                  mb: 2,
                  border: '4px solid white',
                  boxShadow: 3
                }}
              >
                <Person sx={{ fontSize: 60 }} />
              </Avatar>
              <IconButton
                onClick={() => setIsFavorite(!isFavorite)}
                sx={{ color: 'white' }}
              >
                {isFavorite ? <Favorite /> : <FavoriteBorder />}
              </IconButton>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold', mb: 1 }}>
              {architect.ZAR_NAME}
            </Typography>
            <Typography variant="h6" sx={{ color: 'white', opacity: 0.9, mb: 2 }}>
              {architect.ZAR_NAMEENG}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
              {architect.ZAR_BIRTHYEAR && (
                <Chip
                  icon={<DateRange />}
                  label={`${architect.ZAR_BIRTHYEAR}${architect.ZAR_DEATHYEAR ? `-${architect.ZAR_DEATHYEAR}` : '-'}`}
                  sx={{ backgroundColor: 'white', color: 'primary.main' }}
                />
              )}
              {architect.ZAR_NATIONALITY && (
                <Chip
                  icon={<LocationOn />}
                  label={architect.ZAR_NATIONALITY}
                  sx={{ backgroundColor: 'white', color: 'primary.main' }}
                />
              )}
              {architect.ZAR_SCHOOL && (
                <Chip
                  icon={<School />}
                  label={architect.ZAR_SCHOOL}
                  sx={{ backgroundColor: 'white', color: 'primary.main' }}
                />
              )}
            </Box>
            {architect.ZAR_BIO && (
              <Typography variant="body1" sx={{ color: 'white', opacity: 0.9 }}>
                {architect.ZAR_BIO.length > 200 
                  ? architect.ZAR_BIO.substring(0, 200) + '...'
                  : architect.ZAR_BIO
                }
              </Typography>
            )}
          </Grid>
          <Grid item xs={12} md={3}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button
                variant="contained"
                sx={{ backgroundColor: 'white', color: 'primary.main' }}
                startIcon={<Timeline />}
                onClick={() => setShowTimeline(true)}
              >
                タイムライン
              </Button>
              <Button
                variant="outlined"
                sx={{ color: 'white', borderColor: 'white' }}
                startIcon={<Share />}
              >
                共有
              </Button>
              {enableComparison && (
                <Button
                  variant="outlined"
                  sx={{ color: 'white', borderColor: 'white' }}
                  onClick={() => onCompareArchitect && onCompareArchitect(architect)}
                >
                  比較
                </Button>
              )}
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Business sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4" color="primary">
                {portfolio.statistics.totalWorks}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                総作品数
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <TrendingUp sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="h4" color="success.main">
                {portfolio.statistics.averageWorksPerYear.toFixed(1)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                年平均作品数
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <LocationOn sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
              <Typography variant="h4" color="warning.main">
                {portfolio.statistics.prefectures.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                活動都道府県数
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <EmojiEvents sx={{ fontSize: 40, color: 'error.main', mb: 1 }} />
              <Typography variant="h4" color="error.main">
                {Math.round(portfolio.statistics.influence)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                影響力指数
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={selectedTab} onChange={handleTabChange} variant="scrollable">
          <Tab label="作品ギャラリー" />
          <Tab label="統計・分析" />
          <Tab label="スキル分析" />
          <Tab label="年表・経歴" />
          <Tab label="協働関係" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {selectedTab === 0 && (
        <Grid container spacing={2}>
          {portfolio.works.slice(0, 12).map((work) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={work.Z_PK}>
              <Card
                sx={{
                  cursor: 'pointer',
                  transition: 'transform 0.2s, elevation 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    elevation: 8
                  }
                }}
                onClick={() => handleWorkClick(work)}
              >
                {work.ZAR_IMAGE_URL && (
                  <CardMedia
                    component="img"
                    height="200"
                    image={work.ZAR_IMAGE_URL}
                    alt={work.ZAR_TITLE}
                  />
                )}
                <CardContent>
                  <Typography variant="h6" noWrap>
                    {work.ZAR_TITLE}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {work.ZAR_YEAR}年 | {work.ZAR_PREFECTURE}
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <Chip 
                      label={work.ZAR_CATEGORY || 'その他'} 
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
          {portfolio.works.length > 12 && (
            <Grid item xs={12}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="body1">
                  他 {portfolio.works.length - 12} 作品...
                </Typography>
                <Button variant="outlined" sx={{ mt: 1 }}>
                  すべて表示
                </Button>
              </Paper>
            </Grid>
          )}
        </Grid>
      )}

      {selectedTab === 1 && (
        <Grid container spacing={3}>
          {/* Yearly Productivity Chart */}
          <Grid item xs={12} lg={8}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                年別作品数
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={portfolio.statistics.productivity}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <RechartsTooltip />
                    <Bar dataKey="count" fill="#1976d2" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>

          {/* Category Distribution */}
          <Grid item xs={12} lg={4}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                カテゴリ分布
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={portfolio.statistics.categories}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="count"
                      label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                    >
                      {portfolio.statistics.categories.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>

          {/* Performance Metrics */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                パフォーマンス指標
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Box>
                    <Typography variant="body2" gutterBottom>
                      影響力 ({portfolio.statistics.influence}/100)
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={portfolio.statistics.influence}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box>
                    <Typography variant="body2" gutterBottom>
                      革新性 ({portfolio.statistics.innovation}/100)
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={portfolio.statistics.innovation}
                      color="secondary"
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box>
                    <Typography variant="body2" gutterBottom>
                      認知度 ({portfolio.statistics.recognition}/100)
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={portfolio.statistics.recognition}
                      color="warning"
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      )}

      {selectedTab === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                専門分野レーダーチャート
              </Typography>
              <Box sx={{ height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="skill" />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <Radar
                      name="スキルレベル"
                      dataKey="level"
                      stroke="#1976d2"
                      fill="#1976d2"
                      fillOpacity={0.6}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                スキル詳細
              </Typography>
              <List>
                {portfolio.skills.map((skill, index) => (
                  <ListItem key={index}>
                    <ListItemText
                      primary={skill.name}
                      secondary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={skill.level}
                            sx={{ flex: 1, height: 6, borderRadius: 3 }}
                          />
                          <Typography variant="body2">
                            {skill.level}%
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>
        </Grid>
      )}

      {selectedTab === 3 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            人生・経歴年表
          </Typography>
          <List>
            {portfolio.timeline.map((event, index) => (
              <React.Fragment key={index}>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar sx={{ 
                      backgroundColor: 
                        event.type === 'birth' ? '#4caf50' :
                        event.type === 'education' ? '#2196f3' :
                        event.type === 'work' ? '#ff9800' :
                        event.type === 'award' ? '#f44336' :
                        '#757575'
                    }}>
                      {event.type === 'birth' ? <Person /> :
                       event.type === 'education' ? <School /> :
                       event.type === 'work' ? <Work /> :
                       event.type === 'award' ? <EmojiEvents /> :
                       <DateRange />}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={event.event}
                    secondary={`${event.year}年`}
                  />
                </ListItem>
                {index < portfolio.timeline.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}

      {selectedTab === 4 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            協働関係
          </Typography>
          <Grid container spacing={2}>
            {portfolio.collaborations.map((collab, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">
                      {collab.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {collab.works} プロジェクト
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={(collab.works / portfolio.statistics.totalWorks) * 100}
                      sx={{ mt: 1 }}
                    />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      {/* Work Details Dialog */}
      <Dialog
        open={showWorkDetails}
        onClose={() => setShowWorkDetails(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedWork && (
          <>
            <DialogTitle>
              {selectedWork.ZAR_TITLE}
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  {selectedWork.ZAR_IMAGE_URL && (
                    <Box
                      component="img"
                      src={selectedWork.ZAR_IMAGE_URL}
                      alt={selectedWork.ZAR_TITLE}
                      sx={{ width: '100%', borderRadius: 1, mb: 2 }}
                    />
                  )}
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body1" gutterBottom>
                    <strong>建設年:</strong> {selectedWork.ZAR_YEAR}年
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    <strong>所在地:</strong> {selectedWork.ZAR_ADDRESS || selectedWork.ZAR_PREFECTURE}
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    <strong>カテゴリ:</strong> {selectedWork.ZAR_CATEGORY}
                  </Typography>
                  {selectedWork.ZAR_DESCRIPTION && (
                    <Typography variant="body2" paragraph>
                      {selectedWork.ZAR_DESCRIPTION}
                    </Typography>
                  )}
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setShowWorkDetails(false)}>
                閉じる
              </Button>
              <Button variant="contained">
                詳細ページへ
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default ArchitectPortfolioVisualization;