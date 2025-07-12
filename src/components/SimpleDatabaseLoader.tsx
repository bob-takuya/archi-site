import React, { useEffect, useState } from 'react';
import { CircularProgress, Box, Typography, Alert, Button } from '@mui/material';
import { initDatabase, DatabaseStatus, getDatabaseStatus } from '../services/db/FixedDatabaseService';

interface SimpleDatabaseLoaderProps {
  children: React.ReactNode;
}

/**
 * Simplified Database Loader - Better error handling and user feedback
 */
export const SimpleDatabaseLoader: React.FC<SimpleDatabaseLoaderProps> = ({ children }) => {
  const [status, setStatus] = useState<DatabaseStatus>(getDatabaseStatus());
  const [error, setError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  
  useEffect(() => {
    let isMounted = true;
    
    const initDb = async () => {
      if (status === DatabaseStatus.READY) {
        return;
      }
      
      setStatus(DatabaseStatus.INITIALIZING);
      setError(null);
      
      try {
        await initDatabase();
        
        if (isMounted) {
          setStatus(DatabaseStatus.READY);
        }
      } catch (err) {
        if (isMounted) {
          const errorMessage = err instanceof Error ? err.message : '不明なエラーが発生しました';
          setError(errorMessage);
          setStatus(DatabaseStatus.ERROR);
        }
      }
    };
    
    initDb();
    
    return () => {
      isMounted = false;
    };
  }, [isRetrying]); // Add isRetrying to dependencies to allow retry
  
  const handleRetry = () => {
    setIsRetrying(prev => !prev); // Toggle to trigger useEffect
  };
  
  // Always render children, but show loading/error overlays when needed
  return (
    <>
      {children}
      
      {/* Loading overlay */}
      {status === DatabaseStatus.INITIALIZING && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
          }}
        >
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            データベースを読み込み中...
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            初回読み込みには時間がかかる場合があります
          </Typography>
        </Box>
      )}
      
      {/* Error overlay */}
      {status === DatabaseStatus.ERROR && error && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            p: 3
          }}
        >
          <Alert 
            severity="error" 
            sx={{ 
              maxWidth: 600, 
              width: '100%',
              mb: 2
            }}
          >
            <Typography variant="h6" gutterBottom>
              データベース接続エラー
            </Typography>
            <Typography variant="body2" paragraph>
              データベースに接続できませんでした。
            </Typography>
            <Typography variant="body2" color="text.secondary">
              エラー詳細: {error}
            </Typography>
          </Alert>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button 
              variant="contained" 
              onClick={handleRetry}
              disabled={status === DatabaseStatus.INITIALIZING}
            >
              再試行
            </Button>
            <Button 
              variant="outlined" 
              onClick={() => window.location.reload()}
            >
              ページを再読み込み
            </Button>
          </Box>
        </Box>
      )}
    </>
  );
};

export default SimpleDatabaseLoader;