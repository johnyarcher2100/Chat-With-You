import { supabase } from './supabase';
import type { Profile, Friend, Chat, Message, AIBot, Payment, UserBalance } from '@/types/supabase';
import { BotType } from '@/services/ai/bots';

// 用戶配置文件相關函數
export const getProfile = async (userId: string): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }

  return data;
};

export const updateProfile = async (profile: Partial<Profile> & { id: string }): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .upsert(profile)
    .select()
    .single();

  if (error) {
    console.error('Error updating profile:', error);
    return null;
  }

  return data;
};

// 好友相關函數
export const getFriends = async (userId: string): Promise<Friend[]> => {
  const { data, error } = await supabase
    .from('friends')
    .select('*')
    .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
    .eq('status', 'accepted');

  if (error) {
    console.error('Error fetching friends:', error);
    return [];
  }

  return data;
};

export const getFriendRequests = async (userId: string): Promise<Friend[]> => {
  const { data, error } = await supabase
    .from('friends')
    .select('*')
    .eq('friend_id', userId)
    .eq('status', 'pending');

  if (error) {
    console.error('Error fetching friend requests:', error);
    return [];
  }

  return data;
};

export const sendFriendRequest = async (userId: string, friendId: string): Promise<Friend | null> => {
  const { data, error } = await supabase
    .from('friends')
    .insert({
      user_id: userId,
      friend_id: friendId,
      status: 'pending'
    })
    .select()
    .single();

  if (error) {
    console.error('Error sending friend request:', error);
    return null;
  }

  return data;
};

export const updateFriendStatus = async (friendId: string, status: 'accepted' | 'rejected' | 'blocked'): Promise<Friend | null> => {
  const { data, error } = await supabase
    .from('friends')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', friendId)
    .select()
    .single();

  if (error) {
    console.error('Error updating friend status:', error);
    return null;
  }

  return data;
};

// 聊天相關函數
export const getChats = async (userId: string): Promise<Chat[]> => {
  const { data, error } = await supabase
    .from('chat_participants')
    .select('chat_id')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching chat participants:', error);
    return [];
  }

  const chatIds = data.map(participant => participant.chat_id);

  if (chatIds.length === 0) {
    return [];
  }

  const { data: chats, error: chatsError } = await supabase
    .from('chats')
    .select('*')
    .in('id', chatIds);

  if (chatsError) {
    console.error('Error fetching chats:', chatsError);
    return [];
  }

  return chats;
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

export const getMessages = async (chatId: string, limit = 50, offset = 0): Promise<Message[]> => {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching messages:', error);
    return [];
  }

  return data;
};

export const sendMessage = async (chatId: string, userId: string, content: string, isAIGenerated = false, mediaUrl: string | null = null): Promise<Message | null> => {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      chat_id: chatId,
      user_id: userId,
      content,
      is_ai_generated: isAIGenerated,
      media_url: mediaUrl
    })
    .select()
    .single();

  if (error) {
    console.error('Error sending message:', error);
    return null;
  }

  return data;
};

// AI 機器人相關函數
export const getAIBots = async (userId: string): Promise<AIBot[]> => {
  const { data, error } = await supabase
    .from('ai_bots')
    .select('*')
    .eq('owner_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching AI bots:', error);
    return [];
  }

  return data || [];
};

export const createAIBot = async (
  name: string,
  description: string,
  botType: BotType,
  configuration: any,
  userId: string
): Promise<AIBot | null> => {
  const { data, error } = await supabase
    .from('ai_bots')
    .insert({
      name,
      description,
      bot_type: botType,
      configuration,
      owner_id: userId
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating AI bot:', error);
    return null;
  }

  return data;
};

export const updateAIBot = async (
  botId: string,
  updates: Partial<AIBot>,
  userId: string
): Promise<AIBot | null> => {
  const { data, error } = await supabase
    .from('ai_bots')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', botId)
    .eq('owner_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating AI bot:', error);
    return null;
  }

  return data;
};

// 刪除機器人
export const deleteAIBot = async (botId: string, userId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('ai_bots')
    .delete()
    .eq('id', botId)
    .eq('owner_id', userId);

  if (error) {
    console.error('Error deleting AI bot:', error);
    return false;
  }

  return true;
};

// 支付相關函數
export const createPayment = async (payment: Omit<Payment, 'id' | 'created_at' | 'updated_at'>): Promise<Payment | null> => {
  const { data, error } = await supabase
    .from('payments')
    .insert(payment)
    .select()
    .single();

  if (error) {
    console.error('Error creating payment:', error);
    return null;
  }

  return data;
};

export const updatePaymentStatus = async (paymentId: string, status: 'completed' | 'failed', transactionId?: string): Promise<Payment | null> => {
  const { data, error } = await supabase
    .from('payments')
    .update({
      status,
      transaction_id: transactionId,
      updated_at: new Date().toISOString()
    })
    .eq('id', paymentId)
    .select()
    .single();

  if (error) {
    console.error('Error updating payment status:', error);
    return null;
  }

  return data;
};

// 用戶餘額相關函數
export const getUserBalance = async (userId: string): Promise<UserBalance | null> => {
  const { data, error } = await supabase
    .from('user_balance')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Error fetching user balance:', error);
    return null;
  }

  return data;
};

export const updateUserBalance = async (userId: string, amount: number): Promise<UserBalance | null> => {
  // 首先獲取當前餘額
  const currentBalance = await getUserBalance(userId);

  if (!currentBalance) {
    return null;
  }

  const newBalance = currentBalance.balance + amount;

  const { data, error } = await supabase
    .from('user_balance')
    .update({
      balance: newBalance,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating user balance:', error);
    return null;
  }

  return data;
};
