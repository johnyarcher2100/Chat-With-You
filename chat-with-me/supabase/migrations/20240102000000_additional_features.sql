-- 添加 chats 表的安全策略
CREATE POLICY "Users can view chats they are part of." ON chats
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chat_participants
      WHERE chat_id = id AND user_id = auth.uid()
    )
  );

-- 更新 chat_participants 的安全策略
DROP POLICY IF EXISTS "Users can view chats they are part of." ON chat_participants;
CREATE POLICY "Users can view chat participants for chats they are part of." ON chat_participants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chat_participants
      WHERE chat_id = chat_participants.chat_id AND user_id = auth.uid()
    )
  );

-- 創建觸發器，在創建新消息時自動更新聊天的 updated_at 時間
CREATE OR REPLACE FUNCTION public.handle_new_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.chats
  SET updated_at = NOW()
  WHERE id = NEW.chat_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_message_created
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_message();

-- 創建觸發器，在創建 AI 使用情況記錄時自動更新用戶餘額
CREATE OR REPLACE FUNCTION public.handle_new_ai_usage()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.user_balance
  SET balance = balance - NEW.cost,
      updated_at = NOW()
  WHERE user_id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_ai_usage_created
  AFTER INSERT ON ai_usage
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_ai_usage();
