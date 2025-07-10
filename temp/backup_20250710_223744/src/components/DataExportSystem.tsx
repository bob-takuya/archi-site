import React, { useState, useCallback, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Checkbox,
  FormGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Chip,
  Badge,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Download,
  GetApp,
  Description,
  TableChart,
  PictureAsPdf,
  Image,
  Share,
  Settings,
  CheckCircle,
  Error,
  Warning,
  Info,
  ExpandMore,
  Schedule,
  Storage,
  Visibility,
  FilterAlt
} from '@mui/icons-material';
import { Architecture } from '../types/architecture';
import { Architect } from '../types/architect';

// Export format configuration
interface ExportFormat {
  id: string;
  name: string;
  description: string;
  extension: string;
  mimeType: string;
  icon: React.ReactNode;
  maxRecords?: number;
  features: string[];
  size: 'small' | 'medium' | 'large';
}

// Export options
interface ExportOptions {
  format: string;
  fields: string[];
  includeImages: boolean;
  includeCoordinates: boolean;
  includeAnalytics: boolean;
  customFilename?: string;
  dateRange?: [Date, Date];
  compression: boolean;
  templateStyle?: string;
  language: 'ja' | 'en';
}

// Export history entry
interface ExportHistoryEntry {
  id: string;
  timestamp: Date;
  format: string;
  filename: string;
  recordCount: number;
  fileSize: number;
  status: 'success' | 'error' | 'processing';
  downloadUrl?: string;
  errorMessage?: string;
}

// Component props
interface DataExportSystemProps {
  architectures: Architecture[];
  architects: Architect[];
  onExportComplete?: (entry: ExportHistoryEntry) => void;
  enableScheduledExports?: boolean;
  enableCustomTemplates?: boolean;
  maxExportSize?: number; // in MB
}

// Available export formats
const EXPORT_FORMATS: ExportFormat[] = [
  {
    id: 'csv',
    name: 'CSV',
    description: 'カンマ区切りファイル（Excel対応）',
    extension: 'csv',
    mimeType: 'text/csv',
    icon: <TableChart />,
    maxRecords: 50000,
    features: ['軽量', '高互換性', 'Excel対応'],
    size: 'small'
  },
  {
    id: 'json',
    name: 'JSON',
    description: 'JavaScript Object Notation（プログラム利用）',
    extension: 'json',
    mimeType: 'application/json',
    icon: <Description />,
    maxRecords: 100000,
    features: ['プログラム利用', '階層構造', 'API連携'],
    size: 'medium'
  },
  {
    id: 'pdf-report',
    name: 'PDF レポート',
    description: '詳細分析レポート（プレゼン用）',
    extension: 'pdf',
    mimeType: 'application/pdf',
    icon: <PictureAsPdf />,
    maxRecords: 1000,
    features: ['視覚的', 'プレゼン', '印刷対応'],
    size: 'large'
  },
  {
    id: 'excel',
    name: 'Excel',
    description: 'Microsoft Excel形式（フィルタ・グラフ付き）',
    extension: 'xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    icon: <TableChart />,
    maxRecords: 30000,
    features: ['フィルタ', 'グラフ', 'ピボット'],
    size: 'medium'
  },
  {
    id: 'geojson',
    name: 'GeoJSON',
    description: '地理情報付きJSON（マップ利用）',
    extension: 'geojson',
    mimeType: 'application/geo+json',
    icon: <Image />,
    maxRecords: 10000,
    features: ['地理情報', 'マップ連携', 'GIS対応'],
    size: 'medium'
  }
];

// Available fields for export
const EXPORT_FIELDS = [
  { id: 'ZAR_TITLE', name: '建築名', required: true },
  { id: 'ZAR_ARCHITECT', name: '建築家', required: false },
  { id: 'ZAR_YEAR', name: '建設年', required: false },
  { id: 'ZAR_PREFECTURE', name: '都道府県', required: false },
  { id: 'ZAR_ADDRESS', name: '住所', required: false },
  { id: 'ZAR_CATEGORY', name: 'カテゴリ', required: false },
  { id: 'ZAR_DESCRIPTION', name: '説明', required: false },
  { id: 'ZAR_LATITUDE', name: '緯度', required: false },
  { id: 'ZAR_LONGITUDE', name: '経度', required: false },
  { id: 'ZAR_IMAGE_URL', name: '画像URL', required: false },
  { id: 'ZAR_URL', name: '詳細URL', required: false }
];

/**
 * Data Export System Component
 */
const DataExportSystem: React.FC<DataExportSystemProps> = ({
  architectures,
  architects,
  onExportComplete,
  enableScheduledExports = false,
  enableCustomTemplates = false,
  maxExportSize = 50 // MB
}) => {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'csv',
    fields: ['ZAR_TITLE', 'ZAR_ARCHITECT', 'ZAR_YEAR', 'ZAR_PREFECTURE'],
    includeImages: false,
    includeCoordinates: true,
    includeAnalytics: false,
    compression: false,
    language: 'ja'
  });

  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [exportHistory, setExportHistory] = useState<ExportHistoryEntry[]>([]);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);

  // Calculate export statistics
  const exportStats = useMemo(() => {
    const selectedFormat = EXPORT_FORMATS.find(f => f.id === exportOptions.format);
    const filteredData = architectures.filter(arch => {
      // Apply any filters here if needed
      return true;
    });

    const estimatedSize = calculateEstimatedSize(filteredData, exportOptions);
    const canExport = filteredData.length <= (selectedFormat?.maxRecords || Infinity) &&
                     estimatedSize <= maxExportSize;

    return {
      recordCount: filteredData.length,
      estimatedSize,
      maxRecords: selectedFormat?.maxRecords || Infinity,
      canExport,
      warnings: []
    };
  }, [architectures, exportOptions, maxExportSize]);

  // Calculate estimated file size
  function calculateEstimatedSize(data: Architecture[], options: ExportOptions): number {
    const recordSize = options.fields.length * 50; // Average 50 bytes per field
    const imageSize = options.includeImages ? 100 : 0; // 100KB per image on average
    const baseSize = data.length * (recordSize + imageSize);
    
    const formatMultiplier = {
      'csv': 1.0,
      'json': 1.5,
      'pdf-report': 5.0,
      'excel': 2.0,
      'geojson': 1.8
    };

    return (baseSize * (formatMultiplier[options.format as keyof typeof formatMultiplier] || 1.0)) / (1024 * 1024); // MB
  }

  // Generate preview data
  const generatePreview = useCallback(() => {
    const preview = architectures.slice(0, 5).map(arch => {
      const previewRecord: any = {};
      exportOptions.fields.forEach(field => {
        previewRecord[field] = arch[field as keyof Architecture] || '';
      });
      return previewRecord;
    });
    setPreviewData(preview);
  }, [architectures, exportOptions.fields]);

  // Handle export option changes
  const handleOptionChange = useCallback((key: keyof ExportOptions, value: any) => {
    setExportOptions(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  // Handle field selection
  const handleFieldToggle = useCallback((fieldId: string) => {
    setExportOptions(prev => ({
      ...prev,
      fields: prev.fields.includes(fieldId)
        ? prev.fields.filter(f => f !== fieldId)
        : [...prev.fields, fieldId]
    }));
  }, []);

  // Export data
  const handleExport = useCallback(async () => {
    if (!exportStats.canExport) return;

    setIsExporting(true);
    setExportProgress(0);

    try {
      // Simulate export progress
      const progressInterval = setInterval(() => {
        setExportProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing

      clearInterval(progressInterval);
      setExportProgress(100);

      // Generate export data
      const exportData = await generateExportData();
      
      // Create download
      const blob = createBlob(exportData, exportOptions.format);
      const url = URL.createObjectURL(blob);
      const filename = generateFilename();

      // Trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Add to history
      const historyEntry: ExportHistoryEntry = {
        id: Date.now().toString(),
        timestamp: new Date(),
        format: exportOptions.format,
        filename,
        recordCount: exportStats.recordCount,
        fileSize: blob.size,
        status: 'success',
        downloadUrl: url
      };

      setExportHistory(prev => [historyEntry, ...prev]);
      
      if (onExportComplete) {
        onExportComplete(historyEntry);
      }

    } catch (error) {
      console.error('Export failed:', error);
      const errorEntry: ExportHistoryEntry = {
        id: Date.now().toString(),
        timestamp: new Date(),
        format: exportOptions.format,
        filename: 'エラー',
        recordCount: 0,
        fileSize: 0,
        status: 'error',
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      };
      setExportHistory(prev => [errorEntry, ...prev]);
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  }, [exportStats, exportOptions, onExportComplete]);

  // Generate export data based on format
  const generateExportData = async () => {
    const filteredData = architectures.filter(arch => {
      // Apply filters here
      return true;
    });

    const processedData = filteredData.map(arch => {
      const record: any = {};
      exportOptions.fields.forEach(field => {
        record[field] = arch[field as keyof Architecture] || '';
      });

      if (exportOptions.includeCoordinates && arch.ZAR_LATITUDE && arch.ZAR_LONGITUDE) {
        record.coordinates = [arch.ZAR_LONGITUDE, arch.ZAR_LATITUDE];
      }

      return record;
    });

    switch (exportOptions.format) {
      case 'csv':
        return generateCSV(processedData);
      case 'json':
        return JSON.stringify(processedData, null, 2);
      case 'geojson':
        return generateGeoJSON(processedData);
      case 'pdf-report':
        return generatePDFReport(processedData);
      case 'excel':
        return generateExcel(processedData);
      default:
        return JSON.stringify(processedData, null, 2);
    }
  };

  // Generate CSV
  const generateCSV = (data: any[]) => {
    if (data.length === 0) return '';
    
    const headers = exportOptions.fields.map(field => 
      EXPORT_FIELDS.find(f => f.id === field)?.name || field
    ).join(',');
    
    const rows = data.map(record => 
      exportOptions.fields.map(field => {
        const value = record[field] || '';
        return `"${String(value).replace(/"/g, '""')}"`;
      }).join(',')
    );
    
    return [headers, ...rows].join('\n');
  };

  // Generate GeoJSON
  const generateGeoJSON = (data: any[]) => {
    const features = data
      .filter(record => record.coordinates)
      .map(record => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: record.coordinates
        },
        properties: {
          ...record,
          coordinates: undefined
        }
      }));

    return JSON.stringify({
      type: 'FeatureCollection',
      features
    }, null, 2);
  };

  // Generate PDF Report (simplified)
  const generatePDFReport = (data: any[]) => {
    // This would typically use a PDF generation library like jsPDF
    return JSON.stringify({
      title: '建築データベース レポート',
      generatedAt: new Date().toISOString(),
      recordCount: data.length,
      data: data.slice(0, 100) // Limit for PDF
    }, null, 2);
  };

  // Generate Excel (simplified)
  const generateExcel = (data: any[]) => {
    // This would typically use a library like xlsx
    return JSON.stringify({
      sheets: {
        'Architecture Data': data,
        'Summary': {
          totalRecords: data.length,
          exportDate: new Date().toISOString()
        }
      }
    }, null, 2);
  };

  // Create blob for download
  const createBlob = (data: string, format: string) => {
    const formatConfig = EXPORT_FORMATS.find(f => f.id === format);
    return new Blob([data], { type: formatConfig?.mimeType || 'text/plain' });
  };

  // Generate filename
  const generateFilename = () => {
    const format = EXPORT_FORMATS.find(f => f.id === exportOptions.format);
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[-:]/g, '');
    const customName = exportOptions.customFilename || 'architecture_data';
    return `${customName}_${timestamp}.${format?.extension || 'txt'}`;
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Download />
        データエクスポート
      </Typography>

      <Grid container spacing={3}>
        {/* Export Configuration */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              エクスポート設定
            </Typography>

            {/* Format Selection */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                フォーマット選択
              </Typography>
              <Grid container spacing={2}>
                {EXPORT_FORMATS.map(format => (
                  <Grid item xs={12} sm={6} md={4} key={format.id}>
                    <Card
                      sx={{
                        cursor: 'pointer',
                        border: exportOptions.format === format.id ? 2 : 1,
                        borderColor: exportOptions.format === format.id ? 'primary.main' : 'divider',
                        '&:hover': { borderColor: 'primary.main' }
                      }}
                      onClick={() => handleOptionChange('format', format.id)}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          {format.icon}
                          <Typography variant="h6">
                            {format.name}
                          </Typography>
                          <Chip 
                            label={format.size} 
                            size="small"
                            color={
                              format.size === 'small' ? 'success' :
                              format.size === 'medium' ? 'warning' : 'error'
                            }
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary" paragraph>
                          {format.description}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {format.features.map(feature => (
                            <Chip key={feature} label={feature} size="small" variant="outlined" />
                          ))}
                        </Box>
                        {format.maxRecords && (
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                            最大 {format.maxRecords.toLocaleString()} 件
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>

            {/* Field Selection */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                出力フィールド選択
              </Typography>
              <FormGroup row>
                {EXPORT_FIELDS.map(field => (
                  <FormControlLabel
                    key={field.id}
                    control={
                      <Checkbox
                        checked={exportOptions.fields.includes(field.id)}
                        onChange={() => handleFieldToggle(field.id)}
                        disabled={field.required}
                      />
                    }
                    label={field.name}
                  />
                ))}
              </FormGroup>
            </Box>

            {/* Advanced Options */}
            <Accordion 
              expanded={showAdvancedOptions}
              onChange={() => setShowAdvancedOptions(!showAdvancedOptions)}
            >
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="subtitle1">
                  詳細オプション
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={exportOptions.includeImages}
                          onChange={(e) => handleOptionChange('includeImages', e.target.checked)}
                        />
                      }
                      label="画像URL含む"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={exportOptions.includeCoordinates}
                          onChange={(e) => handleOptionChange('includeCoordinates', e.target.checked)}
                        />
                      }
                      label="座標情報含む"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={exportOptions.compression}
                          onChange={(e) => handleOptionChange('compression', e.target.checked)}
                        />
                      }
                      label="圧縮"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel>言語</InputLabel>
                      <Select
                        value={exportOptions.language}
                        onChange={(e) => handleOptionChange('language', e.target.value)}
                        label="言語"
                      >
                        <MenuItem value="ja">日本語</MenuItem>
                        <MenuItem value="en">English</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      size="small"
                      label="カスタムファイル名"
                      value={exportOptions.customFilename || ''}
                      onChange={(e) => handleOptionChange('customFilename', e.target.value)}
                      placeholder="architecture_data"
                    />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Paper>
        </Grid>

        {/* Export Summary & Actions */}
        <Grid item xs={12} lg={4}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Statistics */}
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                エクスポート概要
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <Storage />
                  </ListItemIcon>
                  <ListItemText
                    primary="レコード数"
                    secondary={`${exportStats.recordCount.toLocaleString()} 件`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Description />
                  </ListItemIcon>
                  <ListItemText
                    primary="推定ファイルサイズ"
                    secondary={`${exportStats.estimatedSize.toFixed(2)} MB`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <FilterAlt />
                  </ListItemIcon>
                  <ListItemText
                    primary="出力フィールド"
                    secondary={`${exportOptions.fields.length} 項目`}
                  />
                </ListItem>
              </List>
            </Paper>

            {/* Warnings */}
            {!exportStats.canExport && (
              <Alert severity="warning">
                <Typography variant="body2">
                  {exportStats.recordCount > exportStats.maxRecords
                    ? `レコード数が上限（${exportStats.maxRecords.toLocaleString()}件）を超えています`
                    : `ファイルサイズが上限（${maxExportSize}MB）を超えています`
                  }
                </Typography>
              </Alert>
            )}

            {/* Actions */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button
                variant="contained"
                size="large"
                onClick={handleExport}
                disabled={!exportStats.canExport || isExporting}
                startIcon={isExporting ? <Schedule /> : <Download />}
                fullWidth
              >
                {isExporting ? 'エクスポート中...' : 'エクスポート開始'}
              </Button>
              
              <Button
                variant="outlined"
                onClick={() => {
                  generatePreview();
                  setShowPreview(true);
                }}
                startIcon={<Visibility />}
                fullWidth
              >
                プレビュー
              </Button>

              {isExporting && (
                <Box sx={{ mt: 1 }}>
                  <LinearProgress variant="determinate" value={exportProgress} />
                  <Typography variant="caption" sx={{ mt: 0.5, display: 'block', textAlign: 'center' }}>
                    {exportProgress}%
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Grid>

        {/* Export History */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              エクスポート履歴
            </Typography>
            {exportHistory.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                エクスポート履歴がありません
              </Typography>
            ) : (
              <List>
                {exportHistory.map((entry, index) => (
                  <React.Fragment key={entry.id}>
                    <ListItem>
                      <ListItemIcon>
                        {entry.status === 'success' ? (
                          <CheckCircle color="success" />
                        ) : entry.status === 'error' ? (
                          <Error color="error" />
                        ) : (
                          <Schedule color="primary" />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={entry.filename}
                        secondary={
                          <Box>
                            <Typography variant="caption">
                              {entry.timestamp.toLocaleString()} | 
                              {entry.recordCount.toLocaleString()}件 | 
                              {(entry.fileSize / (1024 * 1024)).toFixed(2)}MB
                            </Typography>
                            {entry.errorMessage && (
                              <Typography variant="caption" color="error" sx={{ display: 'block' }}>
                                エラー: {entry.errorMessage}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                      {entry.status === 'success' && (
                        <IconButton>
                          <GetApp />
                        </IconButton>
                      )}
                    </ListItem>
                    {index < exportHistory.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Preview Dialog */}
      <Dialog
        open={showPreview}
        onClose={() => setShowPreview(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          データプレビュー (最初の5件)
        </DialogTitle>
        <DialogContent>
          <Box sx={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f5f5f5' }}>
                  {exportOptions.fields.map(field => (
                    <th key={field} style={{ padding: 8, border: '1px solid #ddd', textAlign: 'left' }}>
                      {EXPORT_FIELDS.find(f => f.id === field)?.name || field}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewData.map((record, index) => (
                  <tr key={index}>
                    {exportOptions.fields.map(field => (
                      <td key={field} style={{ padding: 8, border: '1px solid #ddd' }}>
                        {String(record[field] || '').slice(0, 50)}
                        {String(record[field] || '').length > 50 && '...'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPreview(false)}>
            閉じる
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DataExportSystem;