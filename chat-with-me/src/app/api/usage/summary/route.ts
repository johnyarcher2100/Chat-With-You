import { NextRequest, NextResponse } from 'next/server';
import { getAIUsageSummaryInTWD } from '@/services/payment/ai-metering';
import { createServerClient } from '@/lib/supabase-server';

// 獲取使用情況摘要
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
    const startDate = startDateParam ? new Date(startDateParam) : new Date();
    startDate.setDate(1); // 設置為當月第一天
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = endDateParam ? new Date(endDateParam) : new Date();
    endDate.setHours(23, 59, 59, 999);
    
    // 獲取使用情況摘要
    const summary = await getAIUsageSummaryInTWD(user.id, startDate, endDate);
    
    return NextResponse.json(summary);
  } catch (error: any) {
    console.error('Error getting usage summary:', error);
    
    return NextResponse.json(
      { error: error.message || '獲取使用情況摘要時出錯' },
      { status: 500 }
    );
  }
}
