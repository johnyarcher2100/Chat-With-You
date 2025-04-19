-- 創建 profiles 表
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 啟用 RLS（行級安全）
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 創建 profiles 的安全策略
CREATE POLICY "Public profiles are viewable by everyone." ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile." ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile." ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- 創建 friends 表
CREATE TABLE IF NOT EXISTS friends (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  friend_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('pending', 'accepted', 'rejected', 'blocked')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

-- 啟用 RLS
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;

-- 創建 friends 的安全策略
CREATE POLICY "Users can view their own friends." ON friends
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can insert their own friends." ON friends
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own friends." ON friends
  FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- 創建 chats 表
CREATE TABLE IF NOT EXISTS chats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT,
  is_group BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 啟用 RLS
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;

-- 創建 chat_participants 表
CREATE TABLE IF NOT EXISTS chat_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(chat_id, user_id)
);

-- 啟用 RLS
ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;

-- 創建 chat_participants 的安全策略
CREATE POLICY "Users can view chats they are part of." ON chat_participants
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert themselves into chats." ON chat_participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 創建 messages 表
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT,
  is_ai_generated BOOLEAN DEFAULT false,
  media_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 啟用 RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 創建 messages 的安全策略
CREATE POLICY "Users can view messages in chats they are part of." ON messages
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM chat_participants WHERE chat_id = messages.chat_id
    )
  );

CREATE POLICY "Users can insert messages in chats they are part of." ON messages
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    auth.uid() IN (
      SELECT user_id FROM chat_participants WHERE chat_id = messages.chat_id
    )
  );

-- 創建 ai_bots 表
CREATE TABLE IF NOT EXISTS ai_bots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  bot_type TEXT CHECK (bot_type IN ('knowledge', 'order', 'custom')),
  configuration JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 啟用 RLS
ALTER TABLE ai_bots ENABLE ROW LEVEL SECURITY;

-- 創建 ai_bots 的安全策略
CREATE POLICY "Users can view their own bots." ON ai_bots
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own bots." ON ai_bots
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own bots." ON ai_bots
  FOR UPDATE USING (auth.uid() = owner_id);

-- 創建 payments 表
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'TWD',
  payment_method TEXT CHECK (payment_method IN ('jkopay', 'linepay', 'credit_card')),
  status TEXT CHECK (status IN ('pending', 'completed', 'failed')),
  transaction_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 啟用 RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- 創建 payments 的安全策略
CREATE POLICY "Users can view their own payments." ON payments
  FOR SELECT USING (auth.uid() = user_id);

-- 創建 ai_usage 表
CREATE TABLE IF NOT EXISTS ai_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  api_name TEXT NOT NULL,
  tokens_used INTEGER NOT NULL,
  cost DECIMAL(10, 6) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 啟用 RLS
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;

-- 創建 ai_usage 的安全策略
CREATE POLICY "Users can view their own AI usage." ON ai_usage
  FOR SELECT USING (auth.uid() = user_id);

-- 創建 user_balance 表
CREATE TABLE IF NOT EXISTS user_balance (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  balance DECIMAL(10, 2) DEFAULT 0.00,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 啟用 RLS
ALTER TABLE user_balance ENABLE ROW LEVEL SECURITY;

-- 創建 user_balance 的安全策略
CREATE POLICY "Users can view their own balance." ON user_balance
  FOR SELECT USING (auth.uid() = user_id);

-- 創建觸發器，在創建新用戶時自動創建 profile 和 user_balance
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url)
  VALUES (NEW.id, NEW.email, '');
  
  INSERT INTO public.user_balance (user_id, balance)
  VALUES (NEW.id, 0.00);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
