// 支付服務類型定義

// 支付方式
export enum PaymentMethod {
  JKOPAY = 'jkopay',
  LINEPAY = 'linepay',
  CREDIT_CARD = 'credit_card'
}

// 支付狀態
export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

// 支付請求
export interface PaymentRequest {
  userId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  description?: string;
  metadata?: Record<string, any>;
  returnUrl?: string;
  cancelUrl?: string;
}

// 支付響應
export interface PaymentResponse {
  paymentId: string;
  transactionId?: string;
  status: PaymentStatus;
  redirectUrl?: string;
  message?: string;
}

// 支付結果
export interface PaymentResult {
  success: boolean;
  paymentId: string;
  transactionId?: string;
  status: PaymentStatus;
  message?: string;
}

// 支付服務接口
export interface PaymentService {
  // 創建支付
  createPayment(request: PaymentRequest): Promise<PaymentResponse>;
  
  // 驗證支付
  verifyPayment(paymentId: string, params: Record<string, any>): Promise<PaymentResult>;
  
  // 獲取支付狀態
  getPaymentStatus(paymentId: string): Promise<PaymentStatus>;
  
  // 取消支付
  cancelPayment(paymentId: string): Promise<boolean>;
}
