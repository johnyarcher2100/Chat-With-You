import { supabase } from './supabase';
import type { Message, Chat, Friend, ChatParticipant, Notification } from '@/types/supabase';

// 訂閱聊天消息
export const subscribeToMessages = (
  chatId: string,
  callback: (payload: { new: Message; eventType: 'INSERT' | 'UPDATE' | 'DELETE' }) => void
) => {
  return supabase
    .channel(`messages:chat_id=${chatId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `chat_id=eq.${chatId}`
      },
      (payload) => {
        callback(payload as any);
      }
    )
    .subscribe();
};

// 訂閱聊天更新
export const subscribeToChat = (
  chatId: string,
  callback: (payload: { new: Chat; old: Chat; eventType: 'UPDATE' }) => void
) => {
  return supabase
    .channel(`chat:id=${chatId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'chats',
        filter: `id=eq.${chatId}`
      },
      (payload) => {
        callback(payload as any);
      }
    )
    .subscribe();
};

// 訂閱好友請求
export const subscribeToFriendRequests = (
  userId: string,
  callback: (payload: { new: Friend; eventType: 'INSERT' | 'UPDATE' }) => void
) => {
  return supabase
    .channel(`friend_requests:friend_id=${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'friends',
        filter: `friend_id=eq.${userId}`
      },
      (payload) => {
        callback(payload as any);
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'friends',
        filter: `or(friend_id.eq.${userId},user_id.eq.${userId})`
      },
      (payload) => {
        callback(payload as any);
      }
    )
    .subscribe();
};

// 訂閱聊天參與者變化
export const subscribeToChatParticipants = (
  chatId: string,
  callback: (payload: { new: ChatParticipant; eventType: 'INSERT' | 'DELETE' }) => void
) => {
  return supabase
    .channel(`chat_participants:chat_id=${chatId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'chat_participants',
        filter: `chat_id=eq.${chatId}`
      },
      (payload) => {
        callback(payload as any);
      }
    )
    .subscribe();
};

// 訂閱用戶的所有聊天
export const subscribeToUserChats = (
  userId: string,
  callback: (payload: { new: Chat; eventType: 'INSERT' | 'UPDATE' }) => void
) => {
  return supabase
    .channel(`user_chats:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_participants',
        filter: `user_id=eq.${userId}`
      },
      async (payload: any) => {
        // 當用戶被添加到新聊天時，獲取聊天信息
        const { data: chat } = await supabase
          .from('chats')
          .select('*')
          .eq('id', payload.new.chat_id)
          .single();

        if (chat) {
          callback({ new: chat, eventType: 'INSERT' });
        }
      }
    )
    .subscribe();
};

// 訂閱通知
export const subscribeToNotifications = (
  userId: string,
  callback: (payload: { new: Notification; old: Notification; eventType: 'INSERT' | 'UPDATE' | 'DELETE' }) => void
) => {
  return supabase
    .channel(`notifications:user_id=${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        callback(payload as any);
      }
    )
    .subscribe();
};

// 取消訂閱
export const unsubscribe = (subscription: any) => {
  if (subscription) {
    supabase.removeChannel(subscription);
  }
};
