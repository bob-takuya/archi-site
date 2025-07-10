import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  Button,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  ExpandMore,
  TrendingUp,
  LocationOn,
  Person,
  Business,
  Timeline,
  PieChart,
  BarChart,
  Download,
  Refresh,
  Settings
} from '@mui/icons-material';
import {
  BarChart as RechartsBarChart,
  LineChart,
  PieChart as RechartsPieChart,
  Area,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  Pie,
  Bar,
  Line,
  ScatterChart,
  Scatter,
  ComposedChart
} from 'recharts';
import { Architecture } from '../types/architecture';
import { Architect } from '../types/architect';

// Analytics data interfaces
interface ArchitectureAnalytics {
  yearDistribution: { year: number; count: number; categories: Record<string, number> }[];
  prefectureDistribution: { prefecture: string; count: number; percentage: number }[];
  categoryDistribution: { category: string; count: number; percentage: number; color: string }[];
  architectPopularity: { architect: string; count: number; avgRating?: number }[];
  timelineData: { year: number; cumulative: number; new: number }[];
  geographicDensity: { region: string; density: number; coordinates: [number, number] }[];
  trendAnalysis: {
    growthRate: number;
    peakYear: number;
    mostPopularCategory: string;
    diversityIndex: number;
  };
}

// Component props
interface ArchitectureAnalyticsDashboardProps {
  architectures: Architecture[];
  architects: Architect[];
  onExportData?: (format: 'csv' | 'json' | 'pdf') => void;
  refreshInterval?: number;
  enableRealTimeUpdates?: boolean;
}

// Color palettes for charts
const CATEGORY_COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1',
  '#d084d0', '#ffb347', '#87ceeb', '#dda0dd', '#98fb98'
];

const PREFECTURE_COLORS = [
  '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
  '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'
];

/**
 * Comprehensive Architecture Analytics Dashboard
 */
const ArchitectureAnalyticsDashboard: React.FC<ArchitectureAnalyticsDashboardProps> = ({
  architectures,
  architects,
  onExportData,
  refreshInterval = 60000,
  enableRealTimeUpdates = false
}) => {
  const [selectedTimeRange, setSelectedTimeRange] = useState<'all' | '5years' | '10years' | '20years'>('all');
  const [selectedPrefecture, setSelectedPrefecture] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [chartType, setChartType] = useState<'bar' | 'line' | 'area'>('bar');
  const [showPercentage, setShowPercentage] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Calculate analytics data
  const analytics: ArchitectureAnalytics = useMemo(() => {
    const currentYear = new Date().getFullYear();
    let filteredData = architectures;

    // Apply time range filter
    if (selectedTimeRange !== 'all') {
      const yearsBack = selectedTimeRange === '5years' ? 5 : 
                       selectedTimeRange === '10years' ? 10 : 20;
      filteredData = filteredData.filter(arch => 
        arch.ZAR_YEAR && arch.ZAR_YEAR >= (currentYear - yearsBack)
      );
    }

    // Apply location filter
    if (selectedPrefecture !== 'all') {
      filteredData = filteredData.filter(arch => arch.ZAR_PREFECTURE === selectedPrefecture);
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      filteredData = filteredData.filter(arch => arch.ZAR_CATEGORY === selectedCategory);
    }

    // Year distribution with category breakdown
    const yearData: Record<number, Record<string, number>> = {};
    const categoryData: Record<string, number> = {};
    const prefectureData: Record<string, number> = {};
    const architectData: Record<string, number> = {};

    filteredData.forEach(arch => {
      // Year distribution
      if (arch.ZAR_YEAR) {
        if (!yearData[arch.ZAR_YEAR]) {
          yearData[arch.ZAR_YEAR] = {};
        }
        const category = arch.ZAR_CATEGORY || 'その他';
        yearData[arch.ZAR_YEAR][category] = (yearData[arch.ZAR_YEAR][category] || 0) + 1;
        categoryData[category] = (categoryData[category] || 0) + 1;
      }

      // Prefecture distribution
      if (arch.ZAR_PREFECTURE) {
        prefectureData[arch.ZAR_PREFECTURE] = (prefectureData[arch.ZAR_PREFECTURE] || 0) + 1;
      }

      // Architect popularity
      if (arch.ZAR_ARCHITECT) {
        architectData[arch.ZAR_ARCHITECT] = (architectData[arch.ZAR_ARCHITECT] || 0) + 1;
      }
    });

    // Process year distribution
    const yearDistribution = Object.entries(yearData)
      .map(([year, categories]) => ({
        year: parseInt(year),
        count: Object.values(categories).reduce((sum, count) => sum + count, 0),
        categories
      }))
      .sort((a, b) => a.year - b.year);

    // Process prefecture distribution
    const totalPrefectureCount = Object.values(prefectureData).reduce((sum, count) => sum + count, 0);
    const prefectureDistribution = Object.entries(prefectureData)
      .map(([prefecture, count]) => ({
        prefecture,
        count,
        percentage: (count / totalPrefectureCount) * 100
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15); // Top 15 prefectures

    // Process category distribution
    const totalCategoryCount = Object.values(categoryData).reduce((sum, count) => sum + count, 0);
    const categoryDistribution = Object.entries(categoryData)
      .map(([category, count], index) => ({
        category,
        count,
        percentage: (count / totalCategoryCount) * 100,
        color: CATEGORY_COLORS[index % CATEGORY_COLORS.length]
      }))
      .sort((a, b) => b.count - a.count);

    // Process architect popularity
    const architectPopularity = Object.entries(architectData)
      .map(([architect, count]) => ({
        architect,
        count,
        avgRating: Math.random() * 5 // Placeholder - would come from real rating data
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20); // Top 20 architects

    // Timeline data (cumulative)
    let cumulative = 0;
    const timelineData = yearDistribution.map(item => {
      cumulative += item.count;
      return {
        year: item.year,
        cumulative,
        new: item.count
      };
    });

    // Geographic density (placeholder data)
    const geographicDensity = [
      { region: '関東', density: 45.2, coordinates: [35.6762, 139.6503] as [number, number] },
      { region: '関西', density: 32.1, coordinates: [34.6937, 135.5023] as [number, number] },
      { region: '中部', density: 18.7, coordinates: [35.1815, 136.9066] as [number, number] },
      { region: '九州', density: 15.3, coordinates: [33.5904, 130.4017] as [number, number] },
      { region: '東北', density: 12.8, coordinates: [38.2682, 140.8694] as [number, number] }
    ];

    // Trend analysis
    const years = yearDistribution.map(item => item.year);
    const counts = yearDistribution.map(item => item.count);
    const growthRate = counts.length > 1 
      ? ((counts[counts.length - 1] - counts[0]) / counts[0]) * 100 
      : 0;
    
    const peakYear = yearDistribution.reduce((max, item) => 
      item.count > max.count ? item : max, yearDistribution[0]
    )?.year || currentYear;

    const mostPopularCategory = categoryDistribution[0]?.category || '';
    
    // Calculate diversity index (Shannon diversity)
    const diversityIndex = categoryDistribution.reduce((sum, item) => {
      const p = item.percentage / 100;
      return sum - (p * Math.log2(p));
    }, 0);

    return {
      yearDistribution,
      prefectureDistribution,
      categoryDistribution,
      architectPopularity,
      timelineData,
      geographicDensity,
      trendAnalysis: {
        growthRate,
        peakYear,
        mostPopularCategory,
        diversityIndex
      }
    };
  }, [architectures, selectedTimeRange, selectedPrefecture, selectedCategory]);

  // Auto-refresh data
  useEffect(() => {
    if (enableRealTimeUpdates) {
      const interval = setInterval(() => {
        setLastUpdated(new Date());
      }, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [enableRealTimeUpdates, refreshInterval]);

  // Export functions
  const handleExport = (format: 'csv' | 'json' | 'pdf') => {
    if (onExportData) {
      onExportData(format);
    }
  };

  // Custom chart tooltips
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Paper sx={{ p: 2, border: '1px solid #ccc' }}>
          <Typography variant="body2">{`${label}`}</Typography>
          {payload.map((entry: any, index: number) => (
            <Typography key={index} variant="body2" style={{ color: entry.color }}>
              {`${entry.dataKey}: ${entry.value}${showPercentage ? '%' : ''}`}
            </Typography>
          ))}
        </Paper>
      );
    }
    return null;
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            建築データ分析ダッシュボード
          </Typography>
          <Typography variant="body2" color="text.secondary">
            最終更新: {lastUpdated.toLocaleString()}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="データを更新">
            <IconButton onClick={() => setLastUpdated(new Date())}>
              <Refresh />
            </IconButton>
          </Tooltip>
          <Button
            startIcon={<Download />}
            variant="outlined"
            onClick={() => handleExport('csv')}
          >
            CSVエクスポート
          </Button>
          <Button
            startIcon={<Download />}
            variant="outlined"
            onClick={() => handleExport('json')}
          >
            JSONエクスポート
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          フィルター設定
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>期間</InputLabel>
              <Select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value as any)}
                label="期間"
              >
                <MenuItem value="all">全期間</MenuItem>
                <MenuItem value="5years">過去5年</MenuItem>
                <MenuItem value="10years">過去10年</MenuItem>
                <MenuItem value="20years">過去20年</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>都道府県</InputLabel>
              <Select
                value={selectedPrefecture}
                onChange={(e) => setSelectedPrefecture(e.target.value)}
                label="都道府県"
              >
                <MenuItem value="all">全て</MenuItem>
                {analytics.prefectureDistribution.map((item) => (
                  <MenuItem key={item.prefecture} value={item.prefecture}>
                    {item.prefecture}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>カテゴリ</InputLabel>
              <Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                label="カテゴリ"
              >
                <MenuItem value="all">全て</MenuItem>
                {analytics.categoryDistribution.map((item) => (
                  <MenuItem key={item.category} value={item.category}>
                    {item.category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={3}>
            <FormControlLabel
              control={
                <Switch
                  checked={showPercentage}
                  onChange={(e) => setShowPercentage(e.target.checked)}
                />
              }
              label="パーセント表示"
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Business color="primary" />
                <Typography variant="h6">総建築物数</Typography>
              </Box>
              <Typography variant="h4" color="primary">
                {architectures.length.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                フィルター適用後: {analytics.yearDistribution.reduce((sum, item) => sum + item.count, 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUp color="success" />
                <Typography variant="h6">成長率</Typography>
              </Box>
              <Typography variant="h4" color="success.main">
                {analytics.trendAnalysis.growthRate.toFixed(1)}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                ピーク年: {analytics.trendAnalysis.peakYear}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PieChart color="warning" />
                <Typography variant="h6">多様性指数</Typography>
              </Box>
              <Typography variant="h4" color="warning.main">
                {analytics.trendAnalysis.diversityIndex.toFixed(2)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                カテゴリの多様性
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Person color="info" />
                <Typography variant="h6">建築家数</Typography>
              </Box>
              <Typography variant="h4" color="info.main">
                {analytics.architectPopularity.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                人気カテゴリ: {analytics.trendAnalysis.mostPopularCategory}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3}>
        {/* Year Distribution Chart */}
        <Grid item xs={12} lg={8}>
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6">年代別分布</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === 'bar' ? (
                    <RechartsBarChart data={analytics.yearDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis />
                      <RechartsTooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar dataKey="count" fill="#8884d8" />
                    </RechartsBarChart>
                  ) : chartType === 'line' ? (
                    <LineChart data={analytics.yearDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis />
                      <RechartsTooltip content={<CustomTooltip />} />
                      <Legend />
                      <Line type="monotone" dataKey="count" stroke="#8884d8" strokeWidth={2} />
                    </LineChart>
                  ) : (
                    <AreaChart data={analytics.yearDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis />
                      <RechartsTooltip content={<CustomTooltip />} />
                      <Legend />
                      <Area type="monotone" dataKey="count" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                    </AreaChart>
                  )}
                </ResponsiveContainer>
              </Box>
              <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                <Button
                  variant={chartType === 'bar' ? 'contained' : 'outlined'}
                  onClick={() => setChartType('bar')}
                  size="small"
                >
                  棒グラフ
                </Button>
                <Button
                  variant={chartType === 'line' ? 'contained' : 'outlined'}
                  onClick={() => setChartType('line')}
                  size="small"
                >
                  線グラフ
                </Button>
                <Button
                  variant={chartType === 'area' ? 'contained' : 'outlined'}
                  onClick={() => setChartType('area')}
                  size="small"
                >
                  エリアグラフ
                </Button>
              </Box>
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* Category Distribution Pie Chart */}
        <Grid item xs={12} lg={4}>
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6">カテゴリ分布</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={analytics.categoryDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ category, percentage }) => `${category}: ${percentage.toFixed(1)}%`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {analytics.categoryDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </Box>
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* Prefecture Distribution */}
        <Grid item xs={12} lg={6}>
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6">都道府県別分布（上位15位）</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart
                    data={analytics.prefectureDistribution}
                    layout="horizontal"
                    margin={{ left: 80 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="prefecture" type="category" width={80} />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" fill="#82ca9d" />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </Box>
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* Timeline Chart */}
        <Grid item xs={12} lg={6}>
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6">累積建築数の推移</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={analytics.timelineData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Legend />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="cumulative"
                      fill="#8884d8"
                      fillOpacity={0.6}
                      stroke="#8884d8"
                    />
                    <Bar yAxisId="right" dataKey="new" fill="#82ca9d" />
                  </ComposedChart>
                </ResponsiveContainer>
              </Box>
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* Architect Popularity */}
        <Grid item xs={12}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6">建築家別作品数（上位20位）</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ height: 500 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart
                    data={analytics.architectPopularity}
                    margin={{ bottom: 80 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="architect" 
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      interval={0}
                    />
                    <YAxis />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" fill="#ffc658" />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </Box>
            </AccordionDetails>
          </Accordion>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ArchitectureAnalyticsDashboard;