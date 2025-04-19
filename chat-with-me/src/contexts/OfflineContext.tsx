'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  isOnline,
  addNetworkStatusListeners,
  removeNetworkStatusListeners,
  syncOfflineMessages,
  cleanupSyncedMessages
} from '@/lib/offline-storage';

// 離線上下文類型
type OfflineContextType = {
  online: boolean;
  syncing: boolean;
  lastSyncTime: Date | null;
  syncStatus: {
    synced: number;
    failed: number;
  };
  syncMessages: () => Promise<void>;
};

// 創建離線上下文
const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

// 離線提供者組件
export function OfflineProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [online, setOnline] = useState(isOnline());
  const [syncing, setSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncStatus, setSyncStatus] = useState({ synced: 0, failed: 0 });
  
  // 處理上線
  const handleOnline = () => {
    setOnline(true);
    syncMessages(); // 自動同步消息
  };
  
  // 處理離線
  const handleOffline = () => {
    setOnline(false);
  };
  
  // 同步消息
  const syncMessages = async () => {
    if (!online || syncing || !user) return;
    
    try {
      setSyncing(true);
      
      // 同步離線消息
      const result = await syncOfflineMessages();
      setSyncStatus(result);
      
      // 清理已同步的消息
      await cleanupSyncedMessages();
      
      // 更新同步時間
      setLastSyncTime(new Date());
    } catch (error) {
      console.error('Error syncing messages:', error);
    } finally {
      setSyncing(false);
    }
  };
  
  // 添加網絡狀態監聽器
  useEffect(() => {
    addNetworkStatusListeners(handleOnline, handleOffline);
    
    return () => {
      removeNetworkStatusListeners(handleOnline, handleOffline);
    };
  }, []);
  
  // 當用戶登錄時，嘗試同步消息
  useEffect(() => {
    if (user && online) {
      syncMessages();
    }
  }, [user, online]);
  
  // 定期同步消息（每 5 分鐘）
  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(() => {
      if (online) {
        syncMessages();
      }
    }, 5 * 60 * 1000);
    
    return () => {
      clearInterval(interval);
    };
  }, [user, online]);
  
  // 提供上下文值
  const value = {
    online,
    syncing,
    lastSyncTime,
    syncStatus,
    syncMessages
  };
  
  return (
    <OfflineContext.Provider value={value}>
      {children}
    </OfflineContext.Provider>
  );
}

// 使用離線上下文的 Hook
export function useOffline() {
  const context = useContext(OfflineContext);
  if (context === undefined) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
}
