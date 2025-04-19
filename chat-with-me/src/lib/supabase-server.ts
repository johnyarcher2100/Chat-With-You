import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { type CookieOptions } from '@supabase/ssr';
import type { Profile } from '@/types/supabase';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/config/env';

/**
 * 創建伺服器端 Supabase 客戶端
 * 用於伺服器端元件和 API 路由
 */
export const createServerClient = () => {
  return createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: false, // 不需要持久化 session
        autoRefreshToken: false, // 不需要自動刷新 token
      },
    }
  );
};

/**
 * 獲取當前登入的用戶
 * 用於伺服器端元件和 API 路由
 */
export const getCurrentUser = async () => {
  const supabase = createServerClient();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

/**
 * 獲取用戶的設定檔
 * 用於伺服器端元件和 API 路由
 */
export const getUserProfile = async (userId: string): Promise<Profile | null> => {
  const supabase = createServerClient();
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};

export default createServerClient; 