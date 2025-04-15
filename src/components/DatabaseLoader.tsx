import React, { useEffect, useState } from 'react';
import { CircularProgress, Box, Typography, Alert } from '@mui/material';
import { initDatabase, DatabaseStatus, getDatabaseStatus } from '../services/db/ClientDatabaseService';

interface DatabaseLoaderProps {
  children: React.ReactNode;
}

/**
 * データベースの初期化と読み込み状態を管理するコンポーネント
 */
export const DatabaseLoader: React.FC<DatabaseLoaderProps> = ({ children }) => {
  const [status, setStatus] = useState<DatabaseStatus>(getDatabaseStatus());
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  
  useEffect(() => {
    let isMounted = true;
    let progressInterval: NodeJS.Timeout;
    
    const initDb = async () => {
      // 既に接続が確立されている場合は処理不要
      if (status === DatabaseStatus.READY) {
        return;
      }
      
      // 進捗表示のためのインターバル（実際の進捗を反映するにはイベントリスナーが必要）
      progressInterval = setInterval(() => {
        if (isMounted) {
          setProgress(prev => {
            // 95%まで徐々に増加（残りは実際の完了時に設定）
            const increment = (95 - prev) * 0.1;
            return Math.min(prev + increment, 95);
          });
        }
      }, 300);
      
      try {
        await initDatabase();
        
        if (isMounted) {
          setProgress(100);
          setStatus(DatabaseStatus.READY);
        }
      } catch (err) {
        if (isMounted) {
          setError(`データベースの初期化に失敗しました: ${err instanceof Error ? err.message : '不明なエラー'}`);
          setStatus(DatabaseStatus.ERROR);
        }
      } finally {
        clearInterval(progressInterval);
      }
    };
    
    initDb();
    
    return () => {
      isMounted = false;
      clearInterval(progressInterval);
    };
  }, [status]);
  
  // 読み込み中の表示
  if (status !== DatabaseStatus.READY) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        height="100vh"
        bgcolor="#f5f5f5"
      >
        <Box textAlign="center" maxWidth="600px" p={3}>
          <Typography variant="h4" gutterBottom>
            日本の建築マップ
          </Typography>
          
          {status === DatabaseStatus.ERROR ? (
            <Alert severity="error" sx={{ mt: 3, mb: 3 }}>
              {error || 'データベースの読み込み中にエラーが発生しました。再読み込みしてください。'}
            </Alert>
          ) : (
            <>
              <Typography variant="body1" sx={{ mb: 3 }}>
                データベースを読み込んでいます。しばらくお待ちください...
              </Typography>
              
              <CircularProgress 
                variant="determinate" 
                value={progress} 
                size={60} 
                thickness={4} 
              />
              
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                {progress.toFixed(0)}% 完了
              </Typography>
            </>
          )}
          
          {status === DatabaseStatus.ERROR && (
            <Box mt={3}>
              <button
                onClick={() => {
                  setError(null);
                  setStatus(DatabaseStatus.NOT_INITIALIZED);
                }}
                style={{
                  padding: '8px 16px',
                  fontSize: '1rem',
                  cursor: 'pointer',
                }}
              >
                再試行
              </button>
            </Box>
          )}
        </Box>
      </Box>
    );
  }
  
  // データベースの準備ができたら子コンポーネントを表示
  return <>{children}</>;
};

export default DatabaseLoader;