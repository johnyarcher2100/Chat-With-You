import { NextRequest, NextResponse } from 'next/server';
import { getUserBalance, updateUserBalance } from '@/lib/supabase-client-extended';
import { createServerClient } from '@/lib/supabase-server';

// 獲取用戶餘額
export async function GET(request: NextRequest) {
  try {
    // 獲取 Supabase 客戶端
    const supabase = createServerClient();
    
    // 獲取當前用戶
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: '未授權' },
        { status: 401 }
      );
    }
    
    // 獲取用戶餘額
    const balance = await getUserBalance(user.id);
    
    if (!balance) {
      return NextResponse.json(
        { error: '找不到用戶餘額' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(balance);
  } catch (error: any) {
    console.error('Error getting user balance:', error);
    
    return NextResponse.json(
      { error: error.message || '獲取用戶餘額時出錯' },
      { status: 500 }
    );
  }
}

// 更新用戶餘額（僅限管理員）
export async function POST(request: NextRequest) {
  try {
    // 獲取 Supabase 客戶端
    const supabase = createServerClient();
    
    // 獲取當前用戶
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: '未授權' },
        { status: 401 }
      );
    }
    
    // 檢查用戶是否為管理員
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();
    
    if (!profile || !profile.is_admin) {
      return NextResponse.json(
        { error: '僅限管理員' },
        { status: 403 }
      );
    }
    
    // 解析請求數據
    const data = await request.json();
    
    // 驗證請求數據
    if (!data.userId || data.amount === undefined) {
      return NextResponse.json(
        { error: '缺少必要參數' },
        { status: 400 }
      );
    }
    
    // 更新用戶餘額
    const balance = await updateUserBalance(data.userId, parseFloat(data.amount));
    
    if (!balance) {
      return NextResponse.json(
        { error: '更新用戶餘額失敗' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(balance);
  } catch (error: any) {
    console.error('Error updating user balance:', error);
    
    return NextResponse.json(
      { error: error.message || '更新用戶餘額時出錯' },
      { status: 500 }
    );
  }
}
