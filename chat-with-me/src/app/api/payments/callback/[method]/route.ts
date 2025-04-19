import { NextRequest, NextResponse } from 'next/server';
import { getPaymentService, PaymentMethod } from '@/services/payment';
import { updateUserBalance } from '@/lib/supabase-client-extended';
import { createServerClient } from '@/lib/supabase-server';

// 處理支付回調
export async function GET(
  request: NextRequest,
  { params }: { params: { method: string } }
) {
  try {
    // 獲取支付方式
    const method = params.method.toUpperCase() as PaymentMethod;
    
    // 獲取查詢參數
    const url = new URL(request.url);
    const queryParams: Record<string, any> = {};
    
    url.searchParams.forEach((value, key) => {
      queryParams[key] = value;
    });
    
    // 獲取支付 ID
    const paymentId = queryParams.paymentId;
    
    if (!paymentId) {
      return NextResponse.json(
        { error: '缺少支付 ID' },
        { status: 400 }
      );
    }
    
    // 獲取 Supabase 客戶端
    const supabase = createServerClient();
    
    // 獲取支付記錄
    const { data: payment, error } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single();
    
    if (error || !payment) {
      return NextResponse.json(
        { error: '找不到支付記錄' },
        { status: 404 }
      );
    }
    
    // 獲取支付服務
    const paymentService = getPaymentService(method);
    
    // 驗證支付
    const result = await paymentService.verifyPayment(paymentId, queryParams);
    
    if (result.success) {
      // 更新用戶餘額
      await updateUserBalance(payment.user_id, payment.amount);
      
      // 重定向到成功頁面
      return NextResponse.redirect(new URL('/payments/success', request.url));
    } else {
      // 重定向到失敗頁面
      return NextResponse.redirect(new URL(`/payments/failed?message=${encodeURIComponent(result.message || '支付失敗')}`, request.url));
    }
  } catch (error: any) {
    console.error('Error handling payment callback:', error);
    
    // 重定向到失敗頁面
    return NextResponse.redirect(new URL(`/payments/failed?message=${encodeURIComponent(error.message || '處理支付回調時出錯')}`, request.url));
  }
}

// 處理支付通知
export async function POST(
  request: NextRequest,
  { params }: { params: { method: string } }
) {
  try {
    // 獲取支付方式
    const method = params.method.toUpperCase() as PaymentMethod;
    
    // 解析請求數據
    const data = await request.json();
    
    // 獲取支付 ID
    const paymentId = data.paymentId || data.orderId;
    
    if (!paymentId) {
      return NextResponse.json(
        { error: '缺少支付 ID' },
        { status: 400 }
      );
    }
    
    // 獲取 Supabase 客戶端
    const supabase = createServerClient();
    
    // 獲取支付記錄
    const { data: payment, error } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single();
    
    if (error || !payment) {
      return NextResponse.json(
        { error: '找不到支付記錄' },
        { status: 404 }
      );
    }
    
    // 獲取支付服務
    const paymentService = getPaymentService(method);
    
    // 驗證支付
    const result = await paymentService.verifyPayment(paymentId, data);
    
    if (result.success) {
      // 更新用戶餘額
      await updateUserBalance(payment.user_id, payment.amount);
      
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: result.message || '支付失敗' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Error handling payment notification:', error);
    
    return NextResponse.json(
      { error: error.message || '處理支付通知時出錯' },
      { status: 500 }
    );
  }
}
