'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Message, Chat, Friend, Profile } from '@/types/supabase';
import {
  subscribeToMessages,
  subscribeToChat,
  subscribeToFriendRequests,
  subscribeToChatParticipants,
  subscribeToUserChats,
  subscribeToNotifications,
  unsubscribe
} from '@/lib/supabase-realtime';

// Realtime 上下文類型
type RealtimeContextType = {
  // 訂閱狀態
  subscribedChats: string[];
  subscribedToFriends: boolean;

  // 訂閱函數
  subscribeToChat: (chatId: string) => void;
  unsubscribeFromChat: (chatId: string) => void;
  subscribeToFriends: () => void;
  unsubscribeFromFriends: () => void;
  subscribeToNotifications: (userId: string, callback: (payload: any) => void) => any;
  unsubscribeFromNotifications: (subscription: any) => void;

  // 事件處理器
  onNewMessage: (callback: (message: Message) => void) => void;
  onChatUpdate: (callback: (chat: Chat) => void) => void;
  onFriendRequest: (callback: (friend: Friend) => void) => void;
  onFriendStatusChange: (callback: (friend: Friend) => void) => void;
  onChatParticipantJoin: (callback: (chatId: string, profile: Profile) => void) => void;
  onChatParticipantLeave: (callback: (chatId: string, userId: string) => void) => void;
  onNewChat: (callback: (chat: Chat) => void) => void;

  // 移除事件處理器
  removeMessageHandler: (callback: (message: Message) => void) => void;
  removeChatUpdateHandler: (callback: (chat: Chat) => void) => void;
  removeFriendRequestHandler: (callback: (friend: Friend) => void) => void;
  removeFriendStatusChangeHandler: (callback: (friend: Friend) => void) => void;
  removeChatParticipantJoinHandler: (callback: (chatId: string, profile: Profile) => void) => void;
  removeChatParticipantLeaveHandler: (callback: (chatId: string, userId: string) => void) => void;
  removeNewChatHandler: (callback: (chat: Chat) => void) => void;
};

// 創建 Realtime 上下文
const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

// Realtime 提供者組件
export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  // 訂閱狀態
  const [subscribedChats, setSubscribedChats] = useState<string[]>([]);
  const [subscribedToFriends, setSubscribedToFriends] = useState(false);

  // 訂閱引用
  const [chatSubscriptions, setChatSubscriptions] = useState<Record<string, any>>({});
  const [friendSubscription, setFriendSubscription] = useState<any>(null);
  const [userChatsSubscription, setUserChatsSubscription] = useState<any>(null);

  // 事件處理器
  const [messageHandlers, setMessageHandlers] = useState<((message: Message) => void)[]>([]);
  const [chatUpdateHandlers, setChatUpdateHandlers] = useState<((chat: Chat) => void)[]>([]);
  const [friendRequestHandlers, setFriendRequestHandlers] = useState<((friend: Friend) => void)[]>([]);
  const [friendStatusChangeHandlers, setFriendStatusChangeHandlers] = useState<((friend: Friend) => void)[]>([]);
  const [chatParticipantJoinHandlers, setChatParticipantJoinHandlers] = useState<((chatId: string, profile: Profile) => void)[]>([]);
  const [chatParticipantLeaveHandlers, setChatParticipantLeaveHandlers] = useState<((chatId: string, userId: string) => void)[]>([]);
  const [newChatHandlers, setNewChatHandlers] = useState<((chat: Chat) => void)[]>([]);

  // 清理所有訂閱
  const cleanupSubscriptions = () => {
    // 清理聊天訂閱
    Object.values(chatSubscriptions).forEach(subscription => {
      unsubscribe(subscription);
    });
    setChatSubscriptions({});
    setSubscribedChats([]);

    // 清理好友訂閱
    if (friendSubscription) {
      unsubscribe(friendSubscription);
      setFriendSubscription(null);
      setSubscribedToFriends(false);
    }

    // 清理用戶聊天訂閱
    if (userChatsSubscription) {
      unsubscribe(userChatsSubscription);
      setUserChatsSubscription(null);
    }
  };

  // 當用戶變化時，清理所有訂閱
  useEffect(() => {
    if (!user) {
      cleanupSubscriptions();
    } else {
      // 訂閱用戶的所有聊天
      const subscription = subscribeToUserChats(user.id, (payload) => {
        if (payload.eventType === 'INSERT') {
          newChatHandlers.forEach(handler => handler(payload.new));
        }
      });
      setUserChatsSubscription(subscription);
    }

    return () => {
      cleanupSubscriptions();
    };
  }, [user]);

  // 訂閱聊天
  const subscribeToChatMessages = (chatId: string) => {
    if (!user || subscribedChats.includes(chatId)) return;

    // 訂閱聊天消息
    const messagesSubscription = subscribeToMessages(chatId, (payload) => {
      if (payload.eventType === 'INSERT') {
        messageHandlers.forEach(handler => handler(payload.new));
      }
    });

    // 訂閱聊天更新
    const chatUpdateSubscription = subscribeToChat(chatId, (payload) => {
      if (payload.eventType === 'UPDATE') {
        chatUpdateHandlers.forEach(handler => handler(payload.new));
      }
    });

    // 訂閱聊天參與者變化
    const participantsSubscription = subscribeToChatParticipants(chatId, async (payload) => {
      if (payload.eventType === 'INSERT') {
        // 獲取參與者資料
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', payload.new.user_id)
          .single();

        if (profile) {
          chatParticipantJoinHandlers.forEach(handler => handler(chatId, profile));
        }
      } else if (payload.eventType === 'DELETE') {
        chatParticipantLeaveHandlers.forEach(handler => handler(chatId, payload.new.user_id));
      }
    });

    // 保存訂閱引用
    setChatSubscriptions(prev => ({
      ...prev,
      [chatId]: {
        messages: messagesSubscription,
        chat: chatUpdateSubscription,
        participants: participantsSubscription
      }
    }));

    // 更新訂閱狀態
    setSubscribedChats(prev => [...prev, chatId]);
  };

  // 取消訂閱聊天
  const unsubscribeFromChatMessages = (chatId: string) => {
    if (!subscribedChats.includes(chatId)) return;

    // 取消訂閱
    const subscriptions = chatSubscriptions[chatId];
    if (subscriptions) {
      Object.values(subscriptions).forEach(subscription => {
        unsubscribe(subscription);
      });

      // 更新訂閱引用
      setChatSubscriptions(prev => {
        const newSubscriptions = { ...prev };
        delete newSubscriptions[chatId];
        return newSubscriptions;
      });

      // 更新訂閱狀態
      setSubscribedChats(prev => prev.filter(id => id !== chatId));
    }
  };

  // 訂閱好友請求
  const subscribeToFriendRequests = () => {
    if (!user || subscribedToFriends) return;

    const subscription = subscribeToFriendRequests(user.id, (payload) => {
      if (payload.eventType === 'INSERT') {
        friendRequestHandlers.forEach(handler => handler(payload.new));
      } else if (payload.eventType === 'UPDATE') {
        friendStatusChangeHandlers.forEach(handler => handler(payload.new));
      }
    });

    // 保存訂閱引用
    setFriendSubscription(subscription);

    // 更新訂閱狀態
    setSubscribedToFriends(true);
  };

  // 取消訂閱好友請求
  const unsubscribeFromFriendRequests = () => {
    if (!subscribedToFriends) return;

    // 取消訂閱
    if (friendSubscription) {
      unsubscribe(friendSubscription);
      setFriendSubscription(null);
    }

    // 更新訂閱狀態
    setSubscribedToFriends(false);
  };

  // 添加事件處理器
  const onNewMessage = (callback: (message: Message) => void) => {
    setMessageHandlers(prev => [...prev, callback]);
  };

  const onChatUpdate = (callback: (chat: Chat) => void) => {
    setChatUpdateHandlers(prev => [...prev, callback]);
  };

  const onFriendRequest = (callback: (friend: Friend) => void) => {
    setFriendRequestHandlers(prev => [...prev, callback]);
  };

  const onFriendStatusChange = (callback: (friend: Friend) => void) => {
    setFriendStatusChangeHandlers(prev => [...prev, callback]);
  };

  const onChatParticipantJoin = (callback: (chatId: string, profile: Profile) => void) => {
    setChatParticipantJoinHandlers(prev => [...prev, callback]);
  };

  const onChatParticipantLeave = (callback: (chatId: string, userId: string) => void) => {
    setChatParticipantLeaveHandlers(prev => [...prev, callback]);
  };

  const onNewChat = (callback: (chat: Chat) => void) => {
    setNewChatHandlers(prev => [...prev, callback]);
  };

  // 移除事件處理器
  const removeMessageHandler = (callback: (message: Message) => void) => {
    setMessageHandlers(prev => prev.filter(handler => handler !== callback));
  };

  const removeChatUpdateHandler = (callback: (chat: Chat) => void) => {
    setChatUpdateHandlers(prev => prev.filter(handler => handler !== callback));
  };

  const removeFriendRequestHandler = (callback: (friend: Friend) => void) => {
    setFriendRequestHandlers(prev => prev.filter(handler => handler !== callback));
  };

  const removeFriendStatusChangeHandler = (callback: (friend: Friend) => void) => {
    setFriendStatusChangeHandlers(prev => prev.filter(handler => handler !== callback));
  };

  const removeChatParticipantJoinHandler = (callback: (chatId: string, profile: Profile) => void) => {
    setChatParticipantJoinHandlers(prev => prev.filter(handler => handler !== callback));
  };

  const removeChatParticipantLeaveHandler = (callback: (chatId: string, userId: string) => void) => {
    setChatParticipantLeaveHandlers(prev => prev.filter(handler => handler !== callback));
  };

  const removeNewChatHandler = (callback: (chat: Chat) => void) => {
    setNewChatHandlers(prev => prev.filter(handler => handler !== callback));
  };

  // 訂閱通知
  const subscribeToNotificationsHandler = (userId: string, callback: (payload: any) => void) => {
    return subscribeToNotifications(userId, callback);
  };

  // 取消訂閱通知
  const unsubscribeFromNotificationsHandler = (subscription: any) => {
    unsubscribe(subscription);
  };

  // 提供上下文值
  const value = {
    // 訂閱狀態
    subscribedChats,
    subscribedToFriends,

    // 訂閱函數
    subscribeToChat: subscribeToChatMessages,
    unsubscribeFromChat: unsubscribeFromChatMessages,
    subscribeToFriends: subscribeToFriendRequests,
    unsubscribeFromFriends: unsubscribeFromFriendRequests,
    subscribeToNotifications: subscribeToNotificationsHandler,
    unsubscribeFromNotifications: unsubscribeFromNotificationsHandler,

    // 事件處理器
    onNewMessage,
    onChatUpdate,
    onFriendRequest,
    onFriendStatusChange,
    onChatParticipantJoin,
    onChatParticipantLeave,
    onNewChat,

    // 移除事件處理器
    removeMessageHandler,
    removeChatUpdateHandler,
    removeFriendRequestHandler,
    removeFriendStatusChangeHandler,
    removeChatParticipantJoinHandler,
    removeChatParticipantLeaveHandler,
    removeNewChatHandler,
  };

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
}

// 使用 Realtime 上下文的 Hook
export function useRealtime() {
  const context = useContext(RealtimeContext);
  if (context === undefined) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
}
