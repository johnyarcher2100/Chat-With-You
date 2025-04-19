export type Profile = {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type Friend = {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'blocked';
  created_at: string;
  updated_at: string;
};

export type Chat = {
  id: string;
  name: string | null;
  is_group: boolean;
  created_at: string;
  updated_at: string;
};

export type ChatParticipant = {
  id: string;
  chat_id: string;
  user_id: string;
  created_at: string;
};

export type Message = {
  id: string;
  chat_id: string;
  user_id: string;
  content: string | null;
  is_ai_generated: boolean;
  media_url: string | null;
  created_at: string;
  updated_at: string;
};

export type AIBot = {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  bot_type: 'knowledge' | 'order' | 'custom';
  configuration: any;
  created_at: string;
  updated_at: string;
};

export type Payment = {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  payment_method: 'jkopay' | 'linepay' | 'credit_card';
  status: 'pending' | 'completed' | 'failed';
  transaction_id: string | null;
  created_at: string;
  updated_at: string;
};

export type AIUsage = {
  id: string;
  user_id: string;
  api_name: string;
  tokens_used: number;
  cost: number;
  created_at: string;
};

export type UserBalance = {
  user_id: string;
  balance: number;
  updated_at: string;
};

export type Notification = {
  id: string;
  user_id: string;
  type: 'friend_request' | 'friend_accepted' | 'message' | 'system';
  content: any;
  is_read: boolean;
  created_at: string;
};
