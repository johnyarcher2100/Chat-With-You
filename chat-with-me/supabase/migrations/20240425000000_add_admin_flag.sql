-- 添加 is_admin 欄位到 profiles 表
ALTER TABLE IF EXISTS profiles
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- 更新已有的管理員策略或添加新的策略
CREATE POLICY IF NOT EXISTS "Admins can view all profiles." ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- 添加管理員可以更新任何用戶資料的策略（可選）
CREATE POLICY IF NOT EXISTS "Admins can update any profile." ON profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- 將初始用戶設置為管理員（替換 'your-user-id' 為實際的用戶ID）
-- 注意：這需要在實際環境中具體執行，不要在此啟用此行
-- UPDATE profiles SET is_admin = true WHERE id = 'your-user-id'; 