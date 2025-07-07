import React, { useEffect, useState } from 'react';
import { CircularProgress, Box, Typography, Alert } from '@mui/material';
import { initDatabase, DatabaseStatus, getDatabaseStatus } from '../services/db/ClientDatabaseService';

interface DatabaseLoaderProps {
  children: React.ReactNode;
}

/**
 * データベースの初期化と読み込み状態を管理するコンポーネント
 * 非ブロッキング: アプリケーションの描画を妨げない
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
      
      // アプリケーションの描画を妨げないよう、非同期で初期化
      setTimeout(async () => {
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
      }, 100); // 100ms遅延で非ブロッキング
    };
    
    initDb();
    
    return () => {
      isMounted = false;
      clearInterval(progressInterval);
    };
  }, [status]);
  
  // 常に子コンポーネントを表示（非ブロッキング）
  // データベースの状態はコンテキストで管理
  return <>{children}</>;
};

export default DatabaseLoader;