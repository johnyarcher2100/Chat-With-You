import crypto from 'crypto';
import { LINEPAY_CONFIG } from '@/config/payment';
import { 
  PaymentService, 
  PaymentRequest, 
  PaymentResponse, 
  PaymentResult, 
  PaymentStatus 
} from './types';
import { createPayment, updatePaymentStatus } from '@/lib/supabase-client';

// Line Pay 服務
export class LinePayService implements PaymentService {
  private channelId: string;
  private channelSecret: string;
  private apiUrl: string;
  private returnUrl: string;
  private cancelUrl: string;

  constructor() {
    this.channelId = LINEPAY_CONFIG.channelId;
    this.channelSecret = LINEPAY_CONFIG.channelSecret;
    this.apiUrl = LINEPAY_CONFIG.apiUrl;
    this.returnUrl = LINEPAY_CONFIG.returnUrl;
    this.cancelUrl = LINEPAY_CONFIG.cancelUrl;
  }

  // 創建簽名
  private createSignature(uri: string, body: Record<string, any>): string {
    // 將請求體轉換為 JSON 字符串
    const bodyString = JSON.stringify(body);
    
    // 創建簽名字符串
    const signatureString = this.channelSecret + uri + bodyString + this.channelSecret;
    
    // 使用 HMAC-SHA256 創建簽名
    const hmac = crypto.createHmac('sha256', this.channelSecret);
    hmac.update(signatureString);
    return hmac.digest('base64');
  }

  // 創建支付
  async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      // 檢查配置
      if (!this.channelId || !this.channelSecret) {
        throw new Error('Line Pay 配置不完整');
      }

      // 創建訂單編號
      const orderId = `ORDER_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      
      // 準備請求數據
      const requestUri = '/v3/payments/request';
      const requestData = {
        amount: Math.round(request.amount), // 確保金額為整數
        currency: request.currency || 'TWD',
        orderId,
        packages: [
          {
            id: `PKG_${Date.now()}`,
            amount: Math.round(request.amount),
            name: request.description || '充值',
            products: [
              {
                name: request.description || '充值',
                quantity: 1,
                price: Math.round(request.amount)
              }
            ]
          }
        ],
        redirectUrls: {
          confirmUrl: request.returnUrl || this.returnUrl,
          cancelUrl: request.cancelUrl || this.cancelUrl
        }
      };
      
      // 創建簽名
      const signature = this.createSignature(requestUri, requestData);
      
      // 發送請求
      const response = await fetch(`${this.apiUrl}${requestUri}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-LINE-ChannelId': this.channelId,
          'X-LINE-Authorization-Nonce': Date.now().toString(),
          'X-LINE-Authorization': signature
        },
        body: JSON.stringify(requestData)
      });
      
      // 解析響應
      const data = await response.json();
      
      if (data.returnCode !== '0000') {
        throw new Error(data.returnMessage || '創建支付失敗');
      }
      
      // 保存支付記錄到數據庫
      const payment = await createPayment({
        user_id: request.userId,
        amount: request.amount,
        currency: request.currency || 'TWD',
        payment_method: 'linepay',
        status: 'pending',
        transaction_id: data.info.transactionId.toString()
      });
      
      if (!payment) {
        throw new Error('保存支付記錄失敗');
      }
      
      return {
        paymentId: payment.id,
        transactionId: data.info.transactionId.toString(),
        status: PaymentStatus.PENDING,
        redirectUrl: data.info.paymentUrl.web,
        message: '支付創建成功'
      };
    } catch (error) {
      console.error('Error creating Line Pay payment:', error);
      throw error;
    }
  }

  // 驗證支付
  async verifyPayment(paymentId: string, params: Record<string, any>): Promise<PaymentResult> {
    try {
      // 檢查配置
      if (!this.channelId || !this.channelSecret) {
        throw new Error('Line Pay 配置不完整');
      }
      
      // 獲取交易 ID
      const transactionId = params.transactionId;
      
      if (!transactionId) {
        // 更新支付狀態為失敗
        await updatePaymentStatus(paymentId, 'failed');
        
        return {
          success: false,
          paymentId,
          status: PaymentStatus.FAILED,
          message: '缺少交易 ID'
        };
      }
      
      // 準備請求數據
      const requestUri = `/v3/payments/${transactionId}/confirm`;
      const requestData = {
        amount: parseInt(params.amount),
        currency: params.currency || 'TWD'
      };
      
      // 創建簽名
      const signature = this.createSignature(requestUri, requestData);
      
      // 發送請求
      const response = await fetch(`${this.apiUrl}${requestUri}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-LINE-ChannelId': this.channelId,
          'X-LINE-Authorization-Nonce': Date.now().toString(),
          'X-LINE-Authorization': signature
        },
        body: JSON.stringify(requestData)
      });
      
      // 解析響應
      const data = await response.json();
      
      if (data.returnCode !== '0000') {
        // 更新支付狀態為失敗
        await updatePaymentStatus(paymentId, 'failed');
        
        return {
          success: false,
          paymentId,
          transactionId,
          status: PaymentStatus.FAILED,
          message: data.returnMessage || '確認支付失敗'
        };
      }
      
      // 更新支付狀態為完成
      await updatePaymentStatus(paymentId, 'completed', transactionId);
      
      return {
        success: true,
        paymentId,
        transactionId,
        status: PaymentStatus.COMPLETED,
        message: '支付成功'
      };
    } catch (error) {
      console.error('Error verifying Line Pay payment:', error);
      
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
      if (!this.channelId || !this.channelSecret) {
        throw new Error('Line Pay 配置不完整');
      }
      
      // 獲取支付記錄
      const payment = await fetch(`/api/payments/${paymentId}`).then(res => res.json());
      
      if (!payment || !payment.transaction_id) {
        throw new Error('找不到支付記錄或交易 ID');
      }
      
      // 準備請求數據
      const requestUri = `/v3/payments/transactions/${payment.transaction_id}`;
      
      // 創建簽名
      const signature = this.createSignature(requestUri, {});
      
      // 發送請求
      const response = await fetch(`${this.apiUrl}${requestUri}`, {
        method: 'GET',
        headers: {
          'X-LINE-ChannelId': this.channelId,
          'X-LINE-Authorization-Nonce': Date.now().toString(),
          'X-LINE-Authorization': signature
        }
      });
      
      // 解析響應
      const data = await response.json();
      
      if (data.returnCode !== '0000') {
        throw new Error(data.returnMessage || '獲取支付狀態失敗');
      }
      
      // 映射支付狀態
      const status = data.info.payInfo[0].status;
      switch (status) {
        case 'AUTHORIZATION':
        case 'CAPTURE':
          return PaymentStatus.COMPLETED;
        case 'VOID':
        case 'REFUND':
          return PaymentStatus.FAILED;
        default:
          return PaymentStatus.PENDING;
      }
    } catch (error) {
      console.error('Error getting Line Pay payment status:', error);
      throw error;
    }
  }

  // 取消支付
  async cancelPayment(paymentId: string): Promise<boolean> {
    try {
      // 檢查配置
      if (!this.channelId || !this.channelSecret) {
        throw new Error('Line Pay 配置不完整');
      }
      
      // 獲取支付記錄
      const payment = await fetch(`/api/payments/${paymentId}`).then(res => res.json());
      
      if (!payment || !payment.transaction_id) {
        throw new Error('找不到支付記錄或交易 ID');
      }
      
      // 準備請求數據
      const requestUri = `/v3/payments/authorizations/${payment.transaction_id}/void`;
      const requestData = {};
      
      // 創建簽名
      const signature = this.createSignature(requestUri, requestData);
      
      // 發送請求
      const response = await fetch(`${this.apiUrl}${requestUri}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-LINE-ChannelId': this.channelId,
          'X-LINE-Authorization-Nonce': Date.now().toString(),
          'X-LINE-Authorization': signature
        },
        body: JSON.stringify(requestData)
      });
      
      // 解析響應
      const data = await response.json();
      
      if (data.returnCode !== '0000') {
        throw new Error(data.returnMessage || '取消支付失敗');
      }
      
      // 更新支付狀態為失敗
      await updatePaymentStatus(paymentId, 'failed');
      
      return true;
    } catch (error) {
      console.error('Error canceling Line Pay payment:', error);
      return false;
    }
  }
}
