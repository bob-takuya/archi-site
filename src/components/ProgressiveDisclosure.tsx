import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Collapse,
  Fade,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Paper,
  Chip,
  Stack,
  Divider,
  useTheme,
  alpha,
  LinearProgress,
  IconButton,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Info as InfoIcon,
  ArrowForward as ArrowForwardIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as RadioButtonUncheckedIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';

interface DisclosureLevel {
  id: string;
  title: string;
  subtitle?: string;
  content: React.ReactNode;
  prerequisite?: string;
  complexity: 'basic' | 'intermediate' | 'advanced';
  estimatedReadTime?: number;
  icon?: React.ReactNode;
}

interface ProgressiveDisclosureProps {
  levels: DisclosureLevel[];
  title?: string;
  subtitle?: string;
  mode?: 'stepped' | 'layered' | 'expandable';
  showProgress?: boolean;
  allowSkip?: boolean;
  persistState?: boolean;
  onLevelComplete?: (levelId: string) => void;
  onAllComplete?: () => void;
}

const complexityColors = {
  basic: '#4CAF50',
  intermediate: '#FF9800', 
  advanced: '#F44336'
};

const complexityLabels = {
  basic: '基本',
  intermediate: '中級',
  advanced: '上級'
};

const ProgressiveDisclosure: React.FC<ProgressiveDisclosureProps> = ({
  levels,
  title = '詳細情報',
  subtitle,
  mode = 'layered',
  showProgress = true,
  allowSkip = false,
  persistState = true,
  onLevelComplete,
  onAllComplete
}) => {
  const theme = useTheme();
  const [activeLevel, setActiveLevel] = useState<number>(0);
  const [completedLevels, setCompletedLevels] = useState<Set<number>>(new Set());
  const [expandedLevels, setExpandedLevels] = useState<Set<number>>(new Set([0]));
  const [userProgress, setUserProgress] = useState<number>(0);

  // Load persisted state
  useEffect(() => {
    if (persistState) {
      const saved = localStorage.getItem(`progressive-disclosure-${title}`);
      if (saved) {
        try {
          const { activeLevel: savedActive, completed, expanded } = JSON.parse(saved);
          setActiveLevel(savedActive || 0);
          setCompletedLevels(new Set(completed || []));
          setExpandedLevels(new Set(expanded || [0]));
        } catch (e) {
          console.warn('Failed to load progressive disclosure state');
        }
      }
    }
  }, [title, persistState]);

  // Save state when it changes
  useEffect(() => {
    if (persistState) {
      const state = {
        activeLevel,
        completed: Array.from(completedLevels),
        expanded: Array.from(expandedLevels)
      };
      localStorage.setItem(`progressive-disclosure-${title}`, JSON.stringify(state));
    }
  }, [activeLevel, completedLevels, expandedLevels, title, persistState]);

  // Update progress
  useEffect(() => {
    const progress = (completedLevels.size / levels.length) * 100;
    setUserProgress(progress);
    
    if (progress === 100 && onAllComplete) {
      onAllComplete();
    }
  }, [completedLevels, levels.length, onAllComplete]);

  const handleLevelComplete = (levelIndex: number) => {
    const newCompleted = new Set(completedLevels);
    newCompleted.add(levelIndex);
    setCompletedLevels(newCompleted);
    
    if (onLevelComplete) {
      onLevelComplete(levels[levelIndex].id);
    }
    
    // Auto-advance to next level in stepped mode
    if (mode === 'stepped' && levelIndex < levels.length - 1) {
      setTimeout(() => {
        setActiveLevel(levelIndex + 1);
        setExpandedLevels(new Set([levelIndex + 1]));
      }, 500);
    }
  };

  const handleLevelToggle = (levelIndex: number) => {
    if (mode === 'expandable') {
      const newExpanded = new Set(expandedLevels);
      if (expandedLevels.has(levelIndex)) {
        newExpanded.delete(levelIndex);
      } else {
        newExpanded.add(levelIndex);
      }
      setExpandedLevels(newExpanded);
    } else if (mode === 'layered') {
      setActiveLevel(levelIndex);
      setExpandedLevels(new Set([levelIndex]));
    }
  };

  const canAccessLevel = (levelIndex: number): boolean => {
    if (allowSkip) return true;
    if (levelIndex === 0) return true;
    return completedLevels.has(levelIndex - 1);
  };

  const getProgressPercentage = (): number => {
    return userProgress;
  };

  const renderSteppedMode = () => (
    <Box>
      {/* Header */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="subtitle1" color="text.secondary" gutterBottom>
            {subtitle}
          </Typography>
        )}
        
        {showProgress && (
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                進捗状況: {completedLevels.size} / {levels.length} 完了
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {Math.round(userProgress)}%
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={userProgress} 
              sx={{ 
                height: 8, 
                borderRadius: 4,
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                '& .MuiLinearProgress-bar': {
                  borderRadius: 4,
                },
              }} 
            />
          </Box>
        )}
      </Paper>

      {/* Stepper */}
      <Stepper activeStep={activeLevel} orientation="vertical">
        {levels.map((level, index) => {
          const isCompleted = completedLevels.has(index);
          const isActive = activeLevel === index;
          const canAccess = canAccessLevel(index);
          
          return (
            <Step key={level.id} completed={isCompleted}>
              <StepLabel
                optional={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    <Chip
                      label={complexityLabels[level.complexity]}
                      size="small"
                      sx={{
                        backgroundColor: alpha(complexityColors[level.complexity], 0.1),
                        color: complexityColors[level.complexity],
                        fontWeight: 600,
                      }}
                    />
                    {level.estimatedReadTime && (
                      <Typography variant="caption" color="text.secondary">
                        約{level.estimatedReadTime}分
                      </Typography>
                    )}
                  </Box>
                }
                sx={{
                  '& .MuiStepLabel-label': {
                    fontSize: '1.1rem',
                    fontWeight: isActive ? 600 : 400,
                    color: !canAccess ? 'text.disabled' : 'text.primary',
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {level.icon}
                  {level.title}
                </Box>
              </StepLabel>
              
              <StepContent>
                <Paper 
                  elevation={1} 
                  sx={{ 
                    p: 3, 
                    mt: 2,
                    backgroundColor: alpha(theme.palette.background.paper, 0.8),
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                  }}
                >
                  {level.subtitle && (
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      {level.subtitle}
                    </Typography>
                  )}
                  
                  <Box sx={{ mb: 3 }}>
                    {level.content}
                  </Box>
                  
                  <Stack direction="row" spacing={2}>
                    <Button
                      variant="contained"
                      onClick={() => handleLevelComplete(index)}
                      disabled={isCompleted}
                      startIcon={isCompleted ? <CheckCircleIcon /> : <ArrowForwardIcon />}
                    >
                      {isCompleted ? '完了済み' : '理解しました'}
                    </Button>
                    
                    {index < levels.length - 1 && allowSkip && (
                      <Button
                        variant="outlined"
                        onClick={() => {
                          setActiveLevel(index + 1);
                          setExpandedLevels(new Set([index + 1]));
                        }}
                      >
                        スキップ
                      </Button>
                    )}
                  </Stack>
                </Paper>
              </StepContent>
            </Step>
          );
        })}
      </Stepper>
    </Box>
  );

  const renderLayeredMode = () => (
    <Box>
      {/* Header */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="subtitle1" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Paper>

      {/* Level Navigation */}
      <Stack direction="row" spacing={1} sx={{ mb: 3, flexWrap: 'wrap', gap: 1 }}>
        {levels.map((level, index) => {
          const isActive = activeLevel === index;
          const isCompleted = completedLevels.has(index);
          const canAccess = canAccessLevel(index);
          
          return (
            <Button
              key={level.id}
              variant={isActive ? 'contained' : 'outlined'}
              onClick={() => canAccess && handleLevelToggle(index)}
              disabled={!canAccess}
              startIcon={
                isCompleted ? <CheckCircleIcon /> : 
                canAccess ? <RadioButtonUncheckedIcon /> : null
              }
              sx={{
                minWidth: 'auto',
                px: 2,
                py: 1,
                borderColor: isCompleted ? 'success.main' : undefined,
                backgroundColor: isCompleted && !isActive ? alpha(theme.palette.success.main, 0.1) : undefined,
              }}
            >
              {level.title}
            </Button>
          );
        })}
      </Stack>

      {/* Active Level Content */}
      <Fade in={true} key={activeLevel}>
        <Card elevation={3}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              {levels[activeLevel].icon}
              <Box>
                <Typography variant="h5" fontWeight="bold">
                  {levels[activeLevel].title}
                </Typography>
                {levels[activeLevel].subtitle && (
                  <Typography variant="subtitle1" color="text.secondary">
                    {levels[activeLevel].subtitle}
                  </Typography>
                )}
              </Box>
              <Box sx={{ ml: 'auto' }}>
                <Chip
                  label={complexityLabels[levels[activeLevel].complexity]}
                  sx={{
                    backgroundColor: alpha(complexityColors[levels[activeLevel].complexity], 0.1),
                    color: complexityColors[levels[activeLevel].complexity],
                    fontWeight: 600,
                  }}
                />
              </Box>
            </Box>
            
            <Box sx={{ mb: 3 }}>
              {levels[activeLevel].content}
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Button
                variant="contained"
                onClick={() => handleLevelComplete(activeLevel)}
                disabled={completedLevels.has(activeLevel)}
                startIcon={completedLevels.has(activeLevel) ? <CheckCircleIcon /> : <ArrowForwardIcon />}
              >
                {completedLevels.has(activeLevel) ? '完了済み' : '理解しました'}
              </Button>
              
              <Stack direction="row" spacing={1}>
                {activeLevel > 0 && (
                  <Button
                    variant="outlined"
                    onClick={() => handleLevelToggle(activeLevel - 1)}
                  >
                    前へ
                  </Button>
                )}
                {activeLevel < levels.length - 1 && canAccessLevel(activeLevel + 1) && (
                  <Button
                    variant="outlined"
                    onClick={() => handleLevelToggle(activeLevel + 1)}
                  >
                    次へ
                  </Button>
                )}
              </Stack>
            </Box>
          </CardContent>
        </Card>
      </Fade>
    </Box>
  );

  const renderExpandableMode = () => (
    <Box>
      {/* Header */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="subtitle1" color="text.secondary" gutterBottom>
            {subtitle}
          </Typography>
        )}
        
        {showProgress && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              読み終えたセクション: {completedLevels.size} / {levels.length}
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={getProgressPercentage()} 
              sx={{ height: 6, borderRadius: 3 }} 
            />
          </Box>
        )}
      </Paper>

      {/* Expandable Sections */}
      <Stack spacing={2}>
        {levels.map((level, index) => {
          const isExpanded = expandedLevels.has(index);
          const isCompleted = completedLevels.has(index);
          const canAccess = canAccessLevel(index);
          
          return (
            <Card 
              key={level.id}
              elevation={isExpanded ? 3 : 1}
              sx={{
                border: isCompleted ? `2px solid ${theme.palette.success.main}` : 
                       isExpanded ? `2px solid ${theme.palette.primary.main}` : 
                       `1px solid ${theme.palette.divider}`,
                opacity: canAccess ? 1 : 0.6,
              }}
            >
              <CardContent 
                sx={{ 
                  p: 0,
                  '&:last-child': { pb: 0 },
                }}
              >
                {/* Section Header */}
                <Box 
                  sx={{ 
                    p: 3, 
                    cursor: canAccess ? 'pointer' : 'default',
                    backgroundColor: isCompleted ? alpha(theme.palette.success.main, 0.05) : 
                                   isExpanded ? alpha(theme.palette.primary.main, 0.05) : 'transparent',
                    '&:hover': canAccess ? {
                      backgroundColor: alpha(theme.palette.primary.main, 0.02),
                    } : {},
                  }}
                  onClick={() => canAccess && handleLevelToggle(index)}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {isCompleted ? (
                          <CheckCircleIcon color="success" />
                        ) : (
                          level.icon || <InfoIcon color={canAccess ? 'primary' : 'disabled'} />
                        )}
                        <Typography 
                          variant="h6" 
                          fontWeight={600}
                          color={canAccess ? 'text.primary' : 'text.disabled'}
                        >
                          {level.title}
                        </Typography>
                      </Box>
                      
                      <Chip
                        label={complexityLabels[level.complexity]}
                        size="small"
                        sx={{
                          backgroundColor: alpha(complexityColors[level.complexity], 0.1),
                          color: complexityColors[level.complexity],
                          fontWeight: 600,
                        }}
                      />
                      
                      {level.estimatedReadTime && (
                        <Typography variant="caption" color="text.secondary">
                          約{level.estimatedReadTime}分
                        </Typography>
                      )}
                    </Box>
                    
                    {canAccess && (
                      <IconButton size="small">
                        {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                    )}
                  </Box>
                  
                  {level.subtitle && (
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      sx={{ mt: 1, ml: 5 }}
                    >
                      {level.subtitle}
                    </Typography>
                  )}
                </Box>
                
                {/* Section Content */}
                <Collapse in={isExpanded}>
                  <Divider />
                  <Box sx={{ p: 3 }}>
                    {level.content}
                    
                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                      <Button
                        variant="contained"
                        onClick={() => handleLevelComplete(index)}
                        disabled={isCompleted}
                        startIcon={isCompleted ? <CheckCircleIcon /> : <ArrowForwardIcon />}
                      >
                        {isCompleted ? '完了済み' : '理解しました'}
                      </Button>
                    </Box>
                  </Box>
                </Collapse>
              </CardContent>
            </Card>
          );
        })}
      </Stack>
    </Box>
  );

  switch (mode) {
    case 'stepped':
      return renderSteppedMode();
    case 'layered':
      return renderLayeredMode();
    case 'expandable':
      return renderExpandableMode();
    default:
      return renderLayeredMode();
  }
};

export default ProgressiveDisclosure;