/**
 * ErrorBoundary component for catching and displaying runtime errors gracefully
 * This improves user experience by showing friendly error messages instead of crashing the app
 * 
 * ⚠️ WARNING: This component shows "問題が発生しました" when errors occur ⚠️
 * 
 * Common causes that trigger this error boundary:
 * 1. Unhandled promise rejections in async functions
 * 2. Services throwing errors instead of returning empty data
 * 3. Missing data files causing fetch errors to propagate
 * 4. Circular dependencies in React hooks
 * 5. Component render errors due to undefined data
 * 
 * TO PREVENT THIS ERROR:
 * - Always use try-catch in async functions
 * - Return empty/default data instead of throwing errors in services
 * - Handle missing files gracefully
 * - Avoid circular dependencies in useCallback/useMemo
 * - Use optional chaining (?.) for potentially undefined data
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render shows the fallback UI
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // You can log the error to an error reporting service here
    console.error('Uncaught error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  handleRetry = (): void => {
    // Simply reload the page as a basic recovery mechanism
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 4,
            height: '100vh'
          }}
        >
          <Paper
            elevation={3}
            sx={{
              padding: 4,
              maxWidth: 600,
              width: '100%',
              borderRadius: 2,
              textAlign: 'center'
            }}
          >
            <Typography variant="h5" color="error" gutterBottom>
              問題が発生しました
            </Typography>
            
            <Typography variant="body1" paragraph>
              アプリケーションで予期しないエラーが発生しました。
              お手数ですが、再読み込みをお試しください。
            </Typography>

            {import.meta.env.DEV && this.state.error && (
              <Box
                sx={{
                  mt: 2,
                  p: 2,
                  bgcolor: '#f5f5f5',
                  borderRadius: 1,
                  textAlign: 'left',
                  overflowX: 'auto'
                }}
              >
                <Typography variant="subtitle2" gutterBottom>
                  Error details (開発モードのみ表示):
                </Typography>
                <Typography
                  variant="body2"
                  component="pre"
                  sx={{
                    whiteSpace: 'pre-wrap',
                    fontSize: '0.8rem'
                  }}
                >
                  {this.state.error.toString()}
                </Typography>
                {this.state.errorInfo && (
                  <Typography
                    variant="body2"
                    component="pre"
                    sx={{
                      whiteSpace: 'pre-wrap',
                      fontSize: '0.8rem',
                      mt: 1
                    }}
                  >
                    {this.state.errorInfo.componentStack}
                  </Typography>
                )}
              </Box>
            )}

            <Box sx={{ mt: 3 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={this.handleRetry}
                sx={{ mr: 2 }}
              >
                ページを再読み込み
              </Button>
              <Button
                variant="outlined"
                onClick={() => window.location.href = '/'}
              >
                ホームに戻る
              </Button>
            </Box>
          </Paper>
        </Box>
      );
    }

    // If there's no error, render children normally
    return this.props.children;
  }
}

export default ErrorBoundary;