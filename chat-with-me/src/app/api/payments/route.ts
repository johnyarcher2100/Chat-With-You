import { NextRequest, NextResponse } from 'next/server';
import { getPaymentService, PaymentMethod } from '@/services/payment';
import { updateUserBalance } from '@/lib/supabase-client-extended';
import { createServerClient } from '@/lib/supabase-server';

// 創建支付
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
    
    // 解析請求數據
    const data = await request.json();
    
    // 驗證請求數據
    if (!data.amount || !data.method) {
      return NextResponse.json(
        { error: '缺少必要參數' },
        { status: 400 }
      );
    }
    
    // 獲取支付服務
    const paymentService = getPaymentService(data.method as PaymentMethod);
    
    // 創建支付
    const response = await paymentService.createPayment({
      userId: user.id,
      amount: parseFloat(data.amount),
      currency: data.currency || 'TWD',
      method: data.method as PaymentMethod,
      description: data.description || '充值',
      metadata: data.metadata,
      returnUrl: data.returnUrl,
      cancelUrl: data.cancelUrl
    });
    
    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error creating payment:', error);
    
    return NextResponse.json(
      { error: error.message || '創建支付時出錯' },
      { status: 500 }
    );
  }
}

// 獲取支付
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
    
    // 獲取支付 ID
    const url = new URL(request.url);
    const paymentId = url.searchParams.get('id');
    
    if (!paymentId) {
      // 獲取用戶的所有支付
      const { data: payments, error } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      return NextResponse.json(payments);
    } else {
      // 獲取指定的支付
      const { data: payment, error } = await supabase
        .from('payments')
        .select('*')
        .eq('id', paymentId)
        .eq('user_id', user.id)
        .single();
      
      if (error) {
        throw error;
      }
      
      if (!payment) {
        return NextResponse.json(
          { error: '找不到支付記錄' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(payment);
    }
  } catch (error: any) {
    console.error('Error getting payment:', error);
    
    return NextResponse.json(
      { error: error.message || '獲取支付時出錯' },
      { status: 500 }
    );
  }
}
