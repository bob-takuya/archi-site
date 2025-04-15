/**
 * Database initialization component
 * 
 * This component ensures the SQLite database is loaded before rendering children components.
 * It handles loading states and errors during database initialization.
 */

import React, { ReactNode, useState, useEffect } from 'react';
import useDatabase from '../hooks/useDatabase';
import { CircularProgress, Box, Typography, Button, Alert, Link } from '@mui/material';
import { isDatabaseAvailable } from '../services/db';

interface DatabaseProviderProps {
  children: ReactNode;
}

const DatabaseProvider: React.FC<DatabaseProviderProps> = ({ children }) => {
  const { isLoading, isError, error, isReady, errorDetails } = useDatabase();
  const [retryCount, setRetryCount] = useState(0);

  // Auto-retry logic for transient errors (especially in GitHub Pages environment)
  useEffect(() => {
    if (isError && retryCount < 2) {
      const timer = setTimeout(() => {
        console.log(`Auto-retrying database initialization (attempt ${retryCount + 1})...`);
        setRetryCount(prev => prev + 1);
        // Force a quick check if the database is available
        isDatabaseAvailable()
          .then(available => {
            if (available) {
              window.location.reload();
            }
          })
          .catch(() => {
            // Silently fail, the main error handler will show the error
          });
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [isError, retryCount]);

  // Loading state with progress indicator
  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          gap: 3
        }}
      >
        <CircularProgress size={60} />
        <Typography variant="h6">
          データベースを読み込み中...
        </Typography>
        <Typography variant="body2" color="text.secondary">
          初回アクセス時は数秒かかる場合があります
        </Typography>
      </Box>
    );
  }

  // Error state with more detailed information and retry options
  if (isError) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          gap: 3,
          p: 3
        }}
      >
        <Alert severity="error" sx={{ maxWidth: 600, width: '100%' }}>
          <Typography variant="h6" gutterBottom>
            データベースの読み込みに失敗しました
          </Typography>
          
          {/* Display the user-friendly error details */}
          <Typography variant="body1" gutterBottom>
            {errorDetails || error?.message || 'Unknown error'}
          </Typography>
          
          {/* Show more technical details for developers */}
          <details>
            <summary>技術的な詳細</summary>
            <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap', mt: 1 }}>
              {error?.stack || JSON.stringify(error, null, 2) || 'No additional information'}
            </Typography>
          </details>
        </Alert>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => window.location.reload()}
          >
            再試行
          </Button>
          
          <Button
            variant="outlined"
            component={Link}
            href="https://github.com/bob-takuya/archi-site/issues"
            target="_blank"
            rel="noopener noreferrer"
          >
            問題を報告
          </Button>
        </Box>
        
        <Typography variant="body2" color="text.secondary">
          問題が解決しない場合は、以下をお試しください:
          <ul>
            <li>ブラウザのキャッシュをクリア</li>
            <li>シークレットモードで開く</li>
            <li>最新のChrome、Firefox、またはEdgeを使用</li>
            <li>WebAssemblyとJavaScriptが有効になっていることを確認</li>
          </ul>
        </Typography>
      </Box>
    );
  }

  // Database is ready, render children
  if (isReady) {
    return <>{children}</>;
  }

  // Fallback (should never reach here)
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        p: 3
      }}
    >
      <Typography>データベースの準備中...</Typography>
    </Box>
  );
};

export default DatabaseProvider;