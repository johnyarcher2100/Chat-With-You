'use client';

import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Message } from '@/types/supabase';
import { sendMessage } from '@/lib/supabase-client';

// 定義數據庫架構
interface ChatDB extends DBSchema {
  'offline-messages': {
    key: string;
    value: {
      id: string;
      chatId: string;
      userId: string;
      content: string;
      isAIGenerated: boolean;
      mediaUrl: string | null;
      createdAt: string;
      status: 'pending' | 'synced' | 'failed';
      retryCount: number;
    };
    indexes: { 'by-status': string; 'by-chat': string };
  };
}

// 數據庫名稱和版本
const DB_NAME = 'chat-with-me-db';
const DB_VERSION = 1;

// 獲取數據庫連接
async function getDB(): Promise<IDBPDatabase<ChatDB>> {
  return openDB<ChatDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // 創建離線消息存儲
      const messagesStore = db.createObjectStore('offline-messages', {
        keyPath: 'id'
      });
      
      // 創建索引
      messagesStore.createIndex('by-status', 'status');
      messagesStore.createIndex('by-chat', 'chatId');
    }
  });
}

// 保存離線消息
export async function saveOfflineMessage(
  chatId: string,
  userId: string,
  content: string,
  isAIGenerated: boolean = false,
  mediaUrl: string | null = null
): Promise<string> {
  try {
    const db = await getDB();
    
    // 創建離線消息
    const offlineMessage = {
      id: `offline-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      chatId,
      userId,
      content,
      isAIGenerated,
      mediaUrl,
      createdAt: new Date().toISOString(),
      status: 'pending' as const,
      retryCount: 0
    };
    
    // 保存到 IndexedDB
    await db.add('offline-messages', offlineMessage);
    
    return offlineMessage.id;
  } catch (error) {
    console.error('Error saving offline message:', error);
    throw error;
  }
}

// 獲取離線消息
export async function getOfflineMessages(chatId: string): Promise<any[]> {
  try {
    const db = await getDB();
    
    // 獲取指定聊天的離線消息
    const messages = await db.getAllFromIndex('offline-messages', 'by-chat', chatId);
    
    return messages.map(msg => ({
      id: msg.id,
      chat_id: msg.chatId,
      user_id: msg.userId,
      content: msg.content,
      is_ai_generated: msg.isAIGenerated,
      media_url: msg.mediaUrl,
      created_at: msg.createdAt,
      updated_at: msg.createdAt,
      _status: msg.status // 添加狀態標記
    }));
  } catch (error) {
    console.error('Error getting offline messages:', error);
    return [];
  }
}

// 同步離線消息
export async function syncOfflineMessages(): Promise<{
  synced: number;
  failed: number;
}> {
  try {
    const db = await getDB();
    
    // 獲取所有待同步的消息
    const pendingMessages = await db.getAllFromIndex('offline-messages', 'by-status', 'pending');
    
    let synced = 0;
    let failed = 0;
    
    // 同步每條消息
    for (const msg of pendingMessages) {
      try {
        // 發送消息
        const sentMessage = await sendMessage(
          msg.chatId,
          msg.userId,
          msg.content,
          msg.isAIGenerated,
          msg.mediaUrl
        );
        
        if (sentMessage) {
          // 更新狀態為已同步
          await db.put('offline-messages', {
            ...msg,
            status: 'synced'
          });
          
          synced++;
        } else {
          // 增加重試次數
          await db.put('offline-messages', {
            ...msg,
            status: msg.retryCount >= 3 ? 'failed' : 'pending',
            retryCount: msg.retryCount + 1
          });
          
          if (msg.retryCount >= 3) {
            failed++;
          }
        }
      } catch (error) {
        console.error('Error syncing message:', error);
        
        // 增加重試次數
        await db.put('offline-messages', {
          ...msg,
          status: msg.retryCount >= 3 ? 'failed' : 'pending',
          retryCount: msg.retryCount + 1
        });
        
        if (msg.retryCount >= 3) {
          failed++;
        }
      }
    }
    
    return { synced, failed };
  } catch (error) {
    console.error('Error syncing offline messages:', error);
    return { synced: 0, failed: 0 };
  }
}

// 清理已同步的消息
export async function cleanupSyncedMessages(): Promise<number> {
  try {
    const db = await getDB();
    
    // 獲取所有已同步的消息
    const syncedMessages = await db.getAllFromIndex('offline-messages', 'by-status', 'synced');
    
    // 刪除每條已同步的消息
    for (const msg of syncedMessages) {
      await db.delete('offline-messages', msg.id);
    }
    
    return syncedMessages.length;
  } catch (error) {
    console.error('Error cleaning up synced messages:', error);
    return 0;
  }
}

// 檢查網絡狀態
export function isOnline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine;
}

// 添加網絡狀態變化監聽器
export function addNetworkStatusListeners(
  onlineCallback: () => void,
  offlineCallback: () => void
): void {
  if (typeof window !== 'undefined') {
    window.addEventListener('online', onlineCallback);
    window.addEventListener('offline', offlineCallback);
  }
}

// 移除網絡狀態變化監聽器
export function removeNetworkStatusListeners(
  onlineCallback: () => void,
  offlineCallback: () => void
): void {
  if (typeof window !== 'undefined') {
    window.removeEventListener('online', onlineCallback);
    window.removeEventListener('offline', offlineCallback);
  }
}
