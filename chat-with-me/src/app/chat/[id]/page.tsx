'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtime } from '@/contexts/RealtimeContext';
import { useOffline } from '@/contexts/OfflineContext';
import { useChatSuggestions, useSimulatedReplies } from '@/hooks/useAI';
import { getMessages, getChatWithParticipants } from '@/lib/supabase-client-extended';
import { getOfflineMessages } from '@/lib/offline-storage';
import { Message, Profile, Chat } from '@/types/supabase';
import ChatMessageList from '@/components/chat/ChatMessageList';
import ChatInput from '@/components/chat/ChatInput';
import { FaCog } from 'react-icons/fa';

export default function ChatPage() {
  const { id: chatId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { online, syncMessages } = useOffline();
  const {
    subscribeToChat,
    unsubscribeFromChat,
    onNewMessage,
    removeMessageHandler
  } = useRealtime();
  const {
    suggestions,
    getSuggestions,
    clearSuggestions
  } = useChatSuggestions();

  const {
    autoSimulateReplies,
    settings: simulationSettings
  } = useSimulatedReplies();

  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [participants, setParticipants] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 加載聊天數據
  const loadChatData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // 獲取聊天和參與者
      const chatData = await getChatWithParticipants(chatId);

      if (!chatData) {
        setError('找不到聊天');
        return;
      }

      setChat(chatData.chat);

      // 將參與者轉換為記錄
      const participantsRecord: Record<string, Profile> = {};
      chatData.participants.forEach(participant => {
        participantsRecord[participant.id] = participant;
      });
      setParticipants(participantsRecord);

      // 獲取消息
      let messagesData = await getMessages(chatId);

      // 獲取離線消息
      const offlineMessages = await getOfflineMessages(chatId);

      // 合併消息
      const allMessages = [...messagesData, ...offlineMessages];

      // 按時間排序
      allMessages.sort((a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      setMessages(allMessages);

      // 如果在線，嘗試同步離線消息
      if (online && offlineMessages.length > 0) {
        syncMessages();
      }

      // 獲取聊天建議
      if (allMessages.length > 0) {
        await getSuggestions(
          allMessages,
          participantsRecord[user.id],
          chatData.participants
        );
      }
    } catch (err: any) {
      setError(err.message || '加載聊天數據時出錯');
    } finally {
      setLoading(false);
    }
  }, [chatId, user, online, syncMessages, getSuggestions]);

  // 處理新消息
  const handleNewMessage = useCallback((message: Message) => {
    if (message.chat_id === chatId) {
      setMessages(prev => {
        // 檢查消息是否已存在
        const exists = prev.some(m => m.id === message.id);
        if (exists) return prev;
        return [...prev, message];
      });

      // 獲取新的聊天建議
      if (user && Object.keys(participants).length > 0) {
        getSuggestions(
          [...messages, message],
          participants[user.id],
          Object.values(participants)
        );
      }
    }
  }, [chatId, messages, participants, user, getSuggestions]);

  // 初始化
  useEffect(() => {
    loadChatData();

    return () => {
      clearSuggestions();
    };
  }, [loadChatData, clearSuggestions]);

  // 訂閱聊天
  useEffect(() => {
    if (chatId) {
      subscribeToChat(chatId);
      onNewMessage(handleNewMessage);

      return () => {
        unsubscribeFromChat(chatId);
        removeMessageHandler(handleNewMessage);
      };
    }
  }, [chatId, subscribeToChat, unsubscribeFromChat, onNewMessage, removeMessageHandler, handleNewMessage]);

  // 處理發送消息
  const handleSendMessage = () => {
    // 清除建議
    clearSuggestions();

    // 延遲獲取新的建議，等待消息同步
    setTimeout(() => {
      if (user && messages.length > 0 && Object.keys(participants).length > 0) {
        getSuggestions(
          messages,
          participants[user.id],
          Object.values(participants)
        );

        // 如果模擬回覆功能已啟用，嘗試模擬不活躍用戶的回覆
        if (simulationSettings.simulationProbability > 0) {
          autoSimulateReplies(
            chatId,
            messages,
            Object.values(participants),
            participants[user.id]
          );
        }
      }
    }, 1000);
  };

  // 加載中
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
          <p className="mt-2 text-gray-500">載入中...</p>
        </div>
      </div>
    );
  }

  // 錯誤
  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  // 未找到聊天
  if (!chat) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">找不到聊天</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* 聊天標題 */}
      <div className="border-b bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">
              {chat.name || Object.values(participants)
                .filter(p => p.id !== user?.id)
                .map(p => p.username || p.full_name)
                .join(', ')}
            </h1>
            <p className="text-sm text-gray-500">
              {Object.keys(participants).length} 位參與者
            </p>
          </div>

          <div className="flex items-center space-x-2">
            {/* AI 設置按鈕 */}
            <button
              onClick={() => window.location.href = '/settings/ai'}
              className="rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-primary"
              title="AI 設置"
            >
              <FaCog className="h-5 w-5" />
            </button>

            {/* 離線狀態指示器 */}
            {!online && (
              <div className="rounded-full bg-yellow-100 px-3 py-1 text-xs text-yellow-800">
                離線模式
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 聊天消息列表 */}
      <ChatMessageList
        messages={messages}
        participants={participants}
        currentUserId={user?.id || ''}
      />

      {/* 聊天輸入框 */}
      <ChatInput
        chatId={chatId}
        suggestions={suggestions}
        onSendMessage={handleSendMessage}
        onClearSuggestions={clearSuggestions}
      />
    </div>
  );
}
