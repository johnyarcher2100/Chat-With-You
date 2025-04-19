import { supabase } from './supabase';
import type { Profile, Friend, Chat, Message, AIBot, Payment, UserBalance, AIUsage, ChatParticipant, Notification } from '@/types/supabase';

// 擴展聊天相關函數
export const getChatWithParticipants = async (chatId: string): Promise<{ chat: Chat, participants: Profile[] } | null> => {
  // 獲取聊天信息
  const { data: chat, error: chatError } = await supabase
    .from('chats')
    .select('*')
    .eq('id', chatId)
    .single();

  if (chatError) {
    console.error('Error fetching chat:', chatError);
    return null;
  }

  // 獲取參與者 ID
  const { data: participants, error: participantsError } = await supabase
    .from('chat_participants')
    .select('user_id')
    .eq('chat_id', chatId);

  if (participantsError) {
    console.error('Error fetching chat participants:', participantsError);
    return null;
  }

  const participantIds = participants.map(p => p.user_id);

  // 獲取參與者資料
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*')
    .in('id', participantIds);

  if (profilesError) {
    console.error('Error fetching participant profiles:', profilesError);
    return null;
  }

  return {
    chat,
    participants: profiles
  };
};

export const getRecentChats = async (userId: string, limit = 10): Promise<Array<Chat & { last_message?: Message, participants: Profile[] }>> => {
  // 獲取用戶參與的聊天
  const { data: chats, error: chatsError } = await supabase
    .from('chats')
    .select(`
      *,
      chat_participants!inner(user_id),
      messages(*, created_at)
    `)
    .eq('chat_participants.user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (chatsError) {
    console.error('Error fetching recent chats:', chatsError);
    return [];
  }

  // 處理結果
  const result = [];
  for (const chat of chats) {
    // 獲取最後一條消息
    const lastMessage = chat.messages && chat.messages.length > 0
      ? chat.messages.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
      : undefined;

    // 獲取參與者
    const { data: participants, error: participantsError } = await supabase
      .from('chat_participants')
      .select('user_id')
      .eq('chat_id', chat.id);

    if (participantsError) {
      console.error('Error fetching chat participants:', participantsError);
      continue;
    }

    const participantIds = participants.map(p => p.user_id);

    // 獲取參與者資料
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .in('id', participantIds);

    if (profilesError) {
      console.error('Error fetching participant profiles:', profilesError);
      continue;
    }

    result.push({
      ...chat,
      last_message: lastMessage,
      participants: profiles
    });
  }

  return result;
};

export const createChat = async (name: string | null, isGroup: boolean, participantIds: string[]): Promise<Chat | null> => {
  // 開始事務
  const { data: chat, error: chatError } = await supabase
    .from('chats')
    .insert({
      name,
      is_group: isGroup
    })
    .select()
    .single();

  if (chatError) {
    console.error('Error creating chat:', chatError);
    return null;
  }

  // 添加參與者
  const participants = participantIds.map(userId => ({
    chat_id: chat.id,
    user_id: userId
  }));

  const { error: participantsError } = await supabase
    .from('chat_participants')
    .insert(participants);

  if (participantsError) {
    console.error('Error adding chat participants:', participantsError);
    // 理想情況下，我們應該回滾事務，但 Supabase 不支持客戶端事務
    return null;
  }

  return chat;
};

export const addParticipantToChat = async (chatId: string, userId: string): Promise<ChatParticipant | null> => {
  const { data, error } = await supabase
    .from('chat_participants')
    .insert({
      chat_id: chatId,
      user_id: userId
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding participant to chat:', error);
    return null;
  }

  return data;
};

export const removeParticipantFromChat = async (chatId: string, userId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('chat_participants')
    .delete()
    .eq('chat_id', chatId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error removing participant from chat:', error);
    return false;
  }

  return true;
};

// 擴展 AI 使用情況相關函數
export const recordAIUsage = async (userId: string, apiName: string, tokensUsed: number, cost: number): Promise<AIUsage | null> => {
  const { data, error } = await supabase
    .from('ai_usage')
    .insert({
      user_id: userId,
      api_name: apiName,
      tokens_used: tokensUsed,
      cost
    })
    .select()
    .single();

  if (error) {
    console.error('Error recording AI usage:', error);
    return null;
  }

  return data;
};

export const getAIUsageHistory = async (userId: string, startDate?: Date, endDate?: Date): Promise<AIUsage[]> => {
  let query = supabase
    .from('ai_usage')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (startDate) {
    query = query.gte('created_at', startDate.toISOString());
  }

  if (endDate) {
    query = query.lte('created_at', endDate.toISOString());
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching AI usage history:', error);
    return [];
  }

  return data;
};

export const getAIUsageSummary = async (userId: string, startDate?: Date, endDate?: Date): Promise<{ total_tokens: number, total_cost: number }> => {
  let query = supabase
    .from('ai_usage')
    .select('tokens_used, cost')
    .eq('user_id', userId);

  if (startDate) {
    query = query.gte('created_at', startDate.toISOString());
  }

  if (endDate) {
    query = query.lte('created_at', endDate.toISOString());
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching AI usage summary:', error);
    return { total_tokens: 0, total_cost: 0 };
  }

  const totalTokens = data.reduce((sum, item) => sum + item.tokens_used, 0);
  const totalCost = data.reduce((sum, item) => sum + item.cost, 0);

  return {
    total_tokens: totalTokens,
    total_cost: totalCost
  };
};

// 擴展支付相關函數
export const getPaymentHistory = async (userId: string, limit = 10, offset = 0): Promise<Payment[]> => {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching payment history:', error);
    return [];
  }

  return data;
};

export const getPaymentById = async (paymentId: string): Promise<Payment | null> => {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('id', paymentId)
    .single();

  if (error) {
    console.error('Error fetching payment:', error);
    return null;
  }

  return data;
};

// 擴展好友相關函數
export const searchUsers = async (query: string, currentUserId: string, limit = 10): Promise<Profile[]> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
    .neq('id', currentUserId)
    .limit(limit);

  if (error) {
    console.error('Error searching users:', error);
    return [];
  }

  return data;
};

export const getFriendStatus = async (userId: string, otherUserId: string): Promise<Friend | null> => {
  const { data, error } = await supabase
    .from('friends')
    .select('*')
    .or(`and(user_id.eq.${userId},friend_id.eq.${otherUserId}),and(user_id.eq.${otherUserId},friend_id.eq.${userId})`)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No friend relationship found
      return null;
    }
    console.error('Error fetching friend status:', error);
    return null;
  }

  return data;
};

export const getFriendsWithProfiles = async (userId: string): Promise<Array<Friend & { profile: Profile }>> => {
  // 獲取所有已接受的好友關係
  const { data: friends, error } = await supabase
    .from('friends')
    .select('*')
    .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
    .eq('status', 'accepted');

  if (error) {
    console.error('Error fetching friends:', error);
    return [];
  }

  // 獲取好友的配置文件
  const result = [];
  for (const friend of friends) {
    const friendId = friend.user_id === userId ? friend.friend_id : friend.user_id;

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', friendId)
      .single();

    if (profileError) {
      console.error('Error fetching friend profile:', profileError);
      continue;
    }

    result.push({
      ...friend,
      profile
    });
  }

  return result;
};

// 通知相關函數
export const getNotifications = async (userId: string): Promise<Notification[]> => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }

  return data;
};

export const getUnreadNotificationsCount = async (userId: string): Promise<number> => {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) {
    console.error('Error fetching unread notifications count:', error);
    return 0;
  }

  return count || 0;
};

export const markNotificationAsRead = async (notificationId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId);

  if (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }

  return true;
};

export const markAllNotificationsAsRead = async (userId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) {
    console.error('Error marking all notifications as read:', error);
    return false;
  }

  return true;
};

export const deleteNotification = async (notificationId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId);

  if (error) {
    console.error('Error deleting notification:', error);
    return false;
  }

  return true;
};