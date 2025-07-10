import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse,
  Chip,
  LinearProgress,
  Alert,
  useTheme,
  alpha
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { useTypedTranslation } from '../../i18n';
import { getContrastRatio, isContrastCompliant } from '../../utils/accessibility';

interface AccessibilityTest {
  id: string;
  name: string;
  description: string;
  category: 'contrast' | 'keyboard' | 'aria' | 'semantic' | 'focus' | 'content';
  severity: 'error' | 'warning' | 'info';
  wcagLevel: 'A' | 'AA' | 'AAA';
  test: () => Promise<AccessibilityTestResult>;
}

interface AccessibilityTestResult {
  passed: boolean;
  message: string;
  details?: string[];
  elements?: HTMLElement[];
  recommendations?: string[];
}

interface AccessibilityTestSuiteProps {
  targetElement?: HTMLElement;
  onTestComplete?: (results: AccessibilityTestResult[]) => void;
  autoRun?: boolean;
  showDetails?: boolean;
}

/**
 * Accessibility Test Suite Component
 * Comprehensive WCAG 2.1 AA compliance testing
 * Tests keyboard navigation, ARIA, color contrast, semantic HTML, and more
 */
export const AccessibilityTestSuite: React.FC<AccessibilityTestSuiteProps> = ({
  targetElement,
  onTestComplete,
  autoRun = false,
  showDetails = true
}) => {
  const { t } = useTypedTranslation();
  const theme = useTheme();
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<Record<string, AccessibilityTestResult>>({});
  const [expandedResults, setExpandedResults] = useState<Set<string>>(new Set());
  const testTargetRef = useRef<HTMLElement>(null);

  // Get target element for testing
  const getTestTarget = useCallback(() => {
    return targetElement || testTargetRef.current || document.body;
  }, [targetElement]);

  // Define accessibility tests
  const accessibilityTests: AccessibilityTest[] = [
    {
      id: 'color-contrast',
      name: 'Color Contrast',
      description: 'Check if text has sufficient color contrast ratio (4.5:1 for normal text, 3:1 for large text)',
      category: 'contrast',
      severity: 'error',
      wcagLevel: 'AA',
      test: async () => {
        const target = getTestTarget();
        const textElements = target.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, a, button, label');
        const issues: string[] = [];
        const failedElements: HTMLElement[] = [];

        for (const element of Array.from(textElements)) {
          const computedStyle = window.getComputedStyle(element as HTMLElement);
          const textColor = computedStyle.color;
          const backgroundColor = computedStyle.backgroundColor;
          
          // Skip transparent backgrounds or elements without text
          if (backgroundColor === 'rgba(0, 0, 0, 0)' || !element.textContent?.trim()) {
            continue;
          }

          try {
            // Convert colors to hex for contrast calculation
            const textColorHex = rgbToHex(textColor);
            const backgroundColorHex = rgbToHex(backgroundColor);
            
            if (textColorHex && backgroundColorHex) {
              const fontSize = parseFloat(computedStyle.fontSize);
              const fontWeight = computedStyle.fontWeight;
              const isLargeText = fontSize >= 18 || (fontSize >= 14 && (fontWeight === 'bold' || parseInt(fontWeight) >= 700));
              
              if (!isContrastCompliant(textColorHex, backgroundColorHex, 'AA', isLargeText ? 'large' : 'normal')) {
                const ratio = getContrastRatio(textColorHex, backgroundColorHex);
                issues.push(`Element "${element.textContent?.slice(0, 50)}..." has insufficient contrast ratio: ${ratio.toFixed(2)}:1`);
                failedElements.push(element as HTMLElement);
              }
            }
          } catch (error) {
            // Skip elements with complex color calculations
          }
        }

        return {
          passed: issues.length === 0,
          message: issues.length === 0 
            ? 'All text elements have sufficient color contrast'
            : `Found ${issues.length} contrast issues`,
          details: issues,
          elements: failedElements,
          recommendations: issues.length > 0 ? [
            'Use darker colors for text or lighter backgrounds',
            'Test your color combinations with a contrast checker',
            'Consider using high contrast mode for better accessibility'
          ] : []
        };
      }
    },
    {
      id: 'keyboard-navigation',
      name: 'Keyboard Navigation',
      description: 'Check if all interactive elements are keyboard accessible',
      category: 'keyboard',
      severity: 'error',
      wcagLevel: 'A',
      test: async () => {
        const target = getTestTarget();
        const interactiveElements = target.querySelectorAll('button, a, input, select, textarea, [tabindex]');
        const issues: string[] = [];
        const failedElements: HTMLElement[] = [];

        for (const element of Array.from(interactiveElements)) {
          const el = element as HTMLElement;
          const tabIndex = el.getAttribute('tabindex');
          
          // Check if element is focusable
          if (tabIndex === '-1' && !['button', 'a', 'input', 'select', 'textarea'].includes(el.tagName.toLowerCase())) {
            issues.push(`Element ${el.tagName} with role ${el.getAttribute('role')} is not keyboard accessible`);
            failedElements.push(el);
          }
          
          // Check for missing href on links
          if (el.tagName.toLowerCase() === 'a' && !el.getAttribute('href')) {
            issues.push(`Link element without href attribute is not keyboard accessible`);
            failedElements.push(el);
          }
        }

        return {
          passed: issues.length === 0,
          message: issues.length === 0 
            ? 'All interactive elements are keyboard accessible'
            : `Found ${issues.length} keyboard accessibility issues`,
          details: issues,
          elements: failedElements,
          recommendations: issues.length > 0 ? [
            'Add href attributes to link elements',
            'Ensure all interactive elements have proper tabindex',
            'Test navigation using only the keyboard'
          ] : []
        };
      }
    },
    {
      id: 'aria-labels',
      name: 'ARIA Labels',
      description: 'Check if form elements and buttons have proper ARIA labels',
      category: 'aria',
      severity: 'warning',
      wcagLevel: 'AA',
      test: async () => {
        const target = getTestTarget();
        const elements = target.querySelectorAll('button, input, select, textarea, [role="button"]');
        const issues: string[] = [];
        const failedElements: HTMLElement[] = [];

        for (const element of Array.from(elements)) {
          const el = element as HTMLElement;
          const hasLabel = el.getAttribute('aria-label') || 
                          el.getAttribute('aria-labelledby') ||
                          el.textContent?.trim() ||
                          (el.tagName.toLowerCase() === 'input' && el.getAttribute('placeholder'));

          if (!hasLabel) {
            issues.push(`${el.tagName} element lacks accessible label`);
            failedElements.push(el);
          }
        }

        return {
          passed: issues.length === 0,
          message: issues.length === 0 
            ? 'All interactive elements have proper labels'
            : `Found ${issues.length} missing label issues`,
          details: issues,
          elements: failedElements,
          recommendations: issues.length > 0 ? [
            'Add aria-label attributes to unlabeled elements',
            'Use aria-labelledby to associate labels with form controls',
            'Ensure button text is descriptive'
          ] : []
        };
      }
    },
    {
      id: 'heading-structure',
      name: 'Heading Structure',
      description: 'Check if headings follow proper hierarchical order',
      category: 'semantic',
      severity: 'warning',
      wcagLevel: 'AA',
      test: async () => {
        const target = getTestTarget();
        const headings = Array.from(target.querySelectorAll('h1, h2, h3, h4, h5, h6'));
        const issues: string[] = [];
        const failedElements: HTMLElement[] = [];

        let expectedLevel = 1;
        let hasH1 = false;

        for (const heading of headings) {
          const level = parseInt(heading.tagName.charAt(1));
          
          if (level === 1) {
            hasH1 = true;
            expectedLevel = 2;
          } else if (level > expectedLevel) {
            issues.push(`Heading level ${level} appears before level ${expectedLevel}`);
            failedElements.push(heading as HTMLElement);
          } else {
            expectedLevel = level + 1;
          }
        }

        if (headings.length > 0 && !hasH1) {
          issues.push('No H1 heading found on page');
        }

        return {
          passed: issues.length === 0,
          message: issues.length === 0 
            ? 'Heading structure follows proper hierarchy'
            : `Found ${issues.length} heading structure issues`,
          details: issues,
          elements: failedElements,
          recommendations: issues.length > 0 ? [
            'Use only one H1 per page',
            'Follow sequential heading order (H1, H2, H3, etc.)',
            'Do not skip heading levels'
          ] : []
        };
      }
    },
    {
      id: 'focus-indicators',
      name: 'Focus Indicators',
      description: 'Check if focusable elements have visible focus indicators',
      category: 'focus',
      severity: 'error',
      wcagLevel: 'AA',
      test: async () => {
        const target = getTestTarget();
        const focusableElements = target.querySelectorAll('button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])');
        const issues: string[] = [];
        const failedElements: HTMLElement[] = [];

        for (const element of Array.from(focusableElements)) {
          const el = element as HTMLElement;
          
          // Temporarily focus the element to check focus styles
          el.focus();
          const computedStyle = window.getComputedStyle(el);
          const outline = computedStyle.outline;
          const boxShadow = computedStyle.boxShadow;
          
          // Check if element has visible focus indicator
          if (outline === 'none' && boxShadow === 'none') {
            issues.push(`${el.tagName} element lacks visible focus indicator`);
            failedElements.push(el);
          }
        }

        // Restore focus to body
        document.body.focus();

        return {
          passed: issues.length === 0,
          message: issues.length === 0 
            ? 'All focusable elements have visible focus indicators'
            : `Found ${issues.length} missing focus indicator issues`,
          details: issues,
          elements: failedElements,
          recommendations: issues.length > 0 ? [
            'Add CSS focus styles using :focus-visible',
            'Ensure focus indicators have sufficient contrast',
            'Test keyboard navigation to verify focus visibility'
          ] : []
        };
      }
    },
    {
      id: 'alt-text',
      name: 'Image Alt Text',
      description: 'Check if images have appropriate alt text',
      category: 'content',
      severity: 'error',
      wcagLevel: 'A',
      test: async () => {
        const target = getTestTarget();
        const images = target.querySelectorAll('img');
        const issues: string[] = [];
        const failedElements: HTMLElement[] = [];

        for (const img of Array.from(images)) {
          const altText = img.getAttribute('alt');
          
          if (altText === null) {
            issues.push(`Image without alt attribute: ${img.src || 'unknown source'}`);
            failedElements.push(img as HTMLElement);
          } else if (altText === img.src || altText.includes('image') || altText.includes('picture')) {
            issues.push(`Image with poor alt text: "${altText}"`);
            failedElements.push(img as HTMLElement);
          }
        }

        return {
          passed: issues.length === 0,
          message: issues.length === 0 
            ? 'All images have appropriate alt text'
            : `Found ${issues.length} image alt text issues`,
          details: issues,
          elements: failedElements,
          recommendations: issues.length > 0 ? [
            'Add descriptive alt text to all images',
            'Use empty alt="" for decorative images',
            'Avoid generic terms like "image" or "picture" in alt text'
          ] : []
        };
      }
    }
  ];

  // Run all accessibility tests
  const runTests = useCallback(async () => {
    setIsRunning(true);
    setProgress(0);
    setResults({});

    const newResults: Record<string, AccessibilityTestResult> = {};

    for (let i = 0; i < accessibilityTests.length; i++) {
      const test = accessibilityTests[i];
      try {
        const result = await test.test();
        newResults[test.id] = result;
        setResults({ ...newResults });
        setProgress(((i + 1) / accessibilityTests.length) * 100);
      } catch (error) {
        newResults[test.id] = {
          passed: false,
          message: `Test failed with error: ${error}`,
          recommendations: ['Check console for detailed error information']
        };
      }
      
      // Small delay to show progress
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    setIsRunning(false);
    onTestComplete?.(Object.values(newResults));
  }, [accessibilityTests, getTestTarget, onTestComplete]);

  // Auto-run tests if specified
  useEffect(() => {
    if (autoRun) {
      runTests();
    }
  }, [autoRun, runTests]);

  // Toggle result expansion
  const toggleResultExpansion = (testId: string) => {
    const newExpanded = new Set(expandedResults);
    if (newExpanded.has(testId)) {
      newExpanded.delete(testId);
    } else {
      newExpanded.add(testId);
    }
    setExpandedResults(newExpanded);
  };

  // Get severity icon
  const getSeverityIcon = (severity: string, passed: boolean) => {
    if (passed) return <CheckCircleIcon color="success" />;
    
    switch (severity) {
      case 'error':
        return <ErrorIcon color="error" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      default:
        return <InfoIcon color="info" />;
    }
  };

  // Get overall score
  const getOverallScore = () => {
    const totalTests = accessibilityTests.length;
    const passedTests = Object.values(results).filter(r => r.passed).length;
    return totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;
  };

  return (
    <Box ref={testTargetRef} sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        Accessibility Test Suite
      </Typography>
      
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button
          variant="contained"
          startIcon={<PlayArrowIcon />}
          onClick={runTests}
          disabled={isRunning}
        >
          {isRunning ? 'Running Tests...' : 'Run Accessibility Tests'}
        </Button>
        
        {Object.keys(results).length > 0 && (
          <Chip
            label={`Score: ${getOverallScore()}%`}
            color={getOverallScore() >= 90 ? 'success' : getOverallScore() >= 70 ? 'warning' : 'error'}
            variant="outlined"
          />
        )}
      </Box>

      {isRunning && (
        <Box sx={{ mb: 3 }}>
          <LinearProgress variant="determinate" value={progress} />
          <Typography variant="body2" sx={{ mt: 1 }}>
            Running tests... {Math.round(progress)}%
          </Typography>
        </Box>
      )}

      {Object.keys(results).length > 0 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Test Results
          </Typography>
          
          <List>
            {accessibilityTests.map((test) => {
              const result = results[test.id];
              if (!result) return null;
              
              const isExpanded = expandedResults.has(test.id);
              
              return (
                <React.Fragment key={test.id}>
                  <ListItem
                    button
                    onClick={() => toggleResultExpansion(test.id)}
                    sx={{
                      borderRadius: 1,
                      mb: 1,
                      bgcolor: result.passed 
                        ? alpha(theme.palette.success.main, 0.1)
                        : alpha(theme.palette.error.main, 0.1)
                    }}
                  >
                    <ListItemIcon>
                      {getSeverityIcon(test.severity, result.passed)}
                    </ListItemIcon>
                    <ListItemText
                      primary={test.name}
                      secondary={result.message}
                    />
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <Chip 
                        label={test.wcagLevel} 
                        size="small" 
                        variant="outlined"
                      />
                      {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </Box>
                  </ListItem>
                  
                  {showDetails && (
                    <Collapse in={isExpanded}>
                      <Box sx={{ pl: 4, pr: 2, pb: 2 }}>
                        <Typography variant="body2" color="text.secondary" paragraph>
                          {test.description}
                        </Typography>
                        
                        {result.details && result.details.length > 0 && (
                          <Alert severity={test.severity} sx={{ mb: 2 }}>
                            <Typography variant="subtitle2">Issues Found:</Typography>
                            <List dense>
                              {result.details.map((detail, index) => (
                                <ListItem key={index} sx={{ py: 0 }}>
                                  <Typography variant="body2">• {detail}</Typography>
                                </ListItem>
                              ))}
                            </List>
                          </Alert>
                        )}
                        
                        {result.recommendations && result.recommendations.length > 0 && (
                          <Alert severity="info">
                            <Typography variant="subtitle2">Recommendations:</Typography>
                            <List dense>
                              {result.recommendations.map((rec, index) => (
                                <ListItem key={index} sx={{ py: 0 }}>
                                  <Typography variant="body2">• {rec}</Typography>
                                </ListItem>
                              ))}
                            </List>
                          </Alert>
                        )}
                      </Box>
                    </Collapse>
                  )}
                </React.Fragment>
              );
            })}
          </List>
        </Paper>
      )}
    </Box>
  );
};

// Helper function to convert RGB to hex
function rgbToHex(rgb: string): string | null {
  const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!match) return null;
  
  const r = parseInt(match[1]);
  const g = parseInt(match[2]);
  const b = parseInt(match[3]);
  
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export default AccessibilityTestSuite;