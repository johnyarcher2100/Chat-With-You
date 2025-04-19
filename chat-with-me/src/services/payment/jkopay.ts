import crypto from 'crypto';
import { JKOPAY_CONFIG } from '@/config/payment';
import { 
  PaymentService, 
  PaymentRequest, 
  PaymentResponse, 
  PaymentResult, 
  PaymentStatus 
} from './types';
import { createPayment, updatePaymentStatus } from '@/lib/supabase-client';

// 街口支付服務
export class JkopayService implements PaymentService {
  private merchantId: string;
  private merchantKey: string;
  private apiUrl: string;
  private returnUrl: string;
  private notifyUrl: string;

  constructor() {
    this.merchantId = JKOPAY_CONFIG.merchantId;
    this.merchantKey = JKOPAY_CONFIG.merchantKey;
    this.apiUrl = JKOPAY_CONFIG.apiUrl;
    this.returnUrl = JKOPAY_CONFIG.returnUrl;
    this.notifyUrl = JKOPAY_CONFIG.notifyUrl;
  }

  // 創建簽名
  private createSignature(data: Record<string, any>): string {
    // 按字母順序排序參數
    const sortedKeys = Object.keys(data).sort();
    const signString = sortedKeys
      .map(key => `${key}=${data[key]}`)
      .join('&');
    
    // 使用 HMAC-SHA256 創建簽名
    const hmac = crypto.createHmac('sha256', this.merchantKey);
    hmac.update(signString);
    return hmac.digest('hex');
  }

  // 創建支付
  async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      // 檢查配置
      if (!this.merchantId || !this.merchantKey) {
        throw new Error('街口支付配置不完整');
      }

      // 創建訂單編號
      const orderId = `ORDER_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      
      // 準備請求數據
      const requestData = {
        merchantId: this.merchantId,
        orderId,
        amount: Math.round(request.amount), // 確保金額為整數
        currency: request.currency || 'TWD',
        orderDescription: request.description || '充值',
        returnUrl: request.returnUrl || this.returnUrl,
        notifyUrl: this.notifyUrl,
        timestamp: Math.floor(Date.now() / 1000)
      };
      
      // 添加簽名
      const signature = this.createSignature(requestData);
      
      // 發送請求
      const response = await fetch(`${this.apiUrl}/v2/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': this.merchantId,
          'X-API-SIGNATURE': signature
        },
        body: JSON.stringify(requestData)
      });
      
      // 解析響應
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || '創建支付失敗');
      }
      
      // 保存支付記錄到數據庫
      const payment = await createPayment({
        user_id: request.userId,
        amount: request.amount,
        currency: request.currency || 'TWD',
        payment_method: 'jkopay',
        status: 'pending',
        transaction_id: data.paymentId || orderId
      });
      
      if (!payment) {
        throw new Error('保存支付記錄失敗');
      }
      
      return {
        paymentId: payment.id,
        transactionId: data.paymentId || orderId,
        status: PaymentStatus.PENDING,
        redirectUrl: data.paymentUrl,
        message: '支付創建成功'
      };
    } catch (error) {
      console.error('Error creating JkoPay payment:', error);
      throw error;
    }
  }

  // 驗證支付
  async verifyPayment(paymentId: string, params: Record<string, any>): Promise<PaymentResult> {
    try {
      // 檢查配置
      if (!this.merchantId || !this.merchantKey) {
        throw new Error('街口支付配置不完整');
      }
      
      // 驗證簽名
      const receivedSignature = params.signature;
      delete params.signature;
      
      const calculatedSignature = this.createSignature(params);
      
      if (receivedSignature !== calculatedSignature) {
        // 更新支付狀態為失敗
        await updatePaymentStatus(paymentId, 'failed');
        
        return {
          success: false,
          paymentId,
          status: PaymentStatus.FAILED,
          message: '簽名驗證失敗'
        };
      }
      
      // 檢查支付狀態
      if (params.status === 'SUCCESS') {
        // 更新支付狀態為完成
        await updatePaymentStatus(paymentId, 'completed', params.transactionId);
        
        return {
          success: true,
          paymentId,
          transactionId: params.transactionId,
          status: PaymentStatus.COMPLETED,
          message: '支付成功'
        };
      } else {
        // 更新支付狀態為失敗
        await updatePaymentStatus(paymentId, 'failed');
        
        return {
          success: false,
          paymentId,
          status: PaymentStatus.FAILED,
          message: params.message || '支付失敗'
        };
      }
    } catch (error) {
      console.error('Error verifying JkoPay payment:', error);
      
      // 更新支付狀態為失敗
      await updatePaymentStatus(paymentId, 'failed');
      
      return {
        success: false,
        paymentId,
        status: PaymentStatus.FAILED,
        message: '驗證支付時出錯'
      };
    }
  }

  // 獲取支付狀態
  async getPaymentStatus(paymentId: string): Promise<PaymentStatus> {
    try {
      // 檢查配置
      if (!this.merchantId || !this.merchantKey) {
        throw new Error('街口支付配置不完整');
      }
      
      // 準備請求數據
      const requestData = {
        merchantId: this.merchantId,
        paymentId,
        timestamp: Math.floor(Date.now() / 1000)
      };
      
      // 添加簽名
      const signature = this.createSignature(requestData);
      
      // 發送請求
      const response = await fetch(`${this.apiUrl}/v2/payments/${paymentId}`, {
        method: 'GET',
        headers: {
          'X-API-KEY': this.merchantId,
          'X-API-SIGNATURE': signature
        }
      });
      
      // 解析響應
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || '獲取支付狀態失敗');
      }
      
      // 映射支付狀態
      switch (data.status) {
        case 'SUCCESS':
          return PaymentStatus.COMPLETED;
        case 'FAILED':
          return PaymentStatus.FAILED;
        default:
          return PaymentStatus.PENDING;
      }
    } catch (error) {
      console.error('Error getting JkoPay payment status:', error);
      throw error;
    }
  }

  // 取消支付
  async cancelPayment(paymentId: string): Promise<boolean> {
    try {
      // 檢查配置
      if (!this.merchantId || !this.merchantKey) {
        throw new Error('街口支付配置不完整');
      }
      
      // 準備請求數據
      const requestData = {
        merchantId: this.merchantId,
        paymentId,
        timestamp: Math.floor(Date.now() / 1000)
      };
      
      // 添加簽名
      const signature = this.createSignature(requestData);
      
      // 發送請求
      const response = await fetch(`${this.apiUrl}/v2/payments/${paymentId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': this.merchantId,
          'X-API-SIGNATURE': signature
        },
        body: JSON.stringify(requestData)
      });
      
      // 解析響應
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || '取消支付失敗');
      }
      
      // 更新支付狀態為失敗
      await updatePaymentStatus(paymentId, 'failed');
      
      return true;
    } catch (error) {
      console.error('Error canceling JkoPay payment:', error);
      return false;
    }
  }
}
