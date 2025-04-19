import { NextRequest, NextResponse } from 'next/server';
import { getAIUsageHistory } from '@/lib/supabase-client-extended';
import { createServerClient } from '@/lib/supabase-server';

// 獲取使用情況歷史
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
    
    // 獲取查詢參數
    const url = new URL(request.url);
    const startDateParam = url.searchParams.get('startDate');
    const endDateParam = url.searchParams.get('endDate');
    
    // 解析日期參數
    const startDate = startDateParam ? new Date(startDateParam) : undefined;
    const endDate = endDateParam ? new Date(endDateParam) : undefined;
    
    // 獲取使用情況歷史
    const history = await getAIUsageHistory(user.id, startDate, endDate);
    
    return NextResponse.json(history);
  } catch (error: any) {
    console.error('Error getting usage history:', error);
    
    return NextResponse.json(
      { error: error.message || '獲取使用情況歷史時出錯' },
      { status: 500 }
    );
  }
}
