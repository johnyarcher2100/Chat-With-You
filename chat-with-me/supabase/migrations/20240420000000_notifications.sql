-- 創建通知表
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  content JSONB NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 啟用 RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 創建通知的安全策略
CREATE POLICY "Users can view their own notifications." ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications." ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- 創建通知觸發器函數
CREATE OR REPLACE FUNCTION create_friend_request_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- 當有新的好友請求時，創建通知
  IF NEW.status = 'pending' THEN
    INSERT INTO notifications (user_id, type, content)
    VALUES (
      NEW.friend_id,
      'friend_request',
      json_build_object(
        'friend_id', NEW.id,
        'user_id', NEW.user_id
      )
    );
  -- 當好友請求被接受時，創建通知
  ELSIF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    INSERT INTO notifications (user_id, type, content)
    VALUES (
      NEW.user_id,
      'friend_accepted',
      json_build_object(
        'friend_id', NEW.id,
        'user_id', NEW.friend_id
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 創建好友請求通知觸發器
DROP TRIGGER IF EXISTS friend_request_notification_trigger ON friends;
CREATE TRIGGER friend_request_notification_trigger
  AFTER INSERT OR UPDATE ON friends
  FOR EACH ROW
  EXECUTE FUNCTION create_friend_request_notification();
