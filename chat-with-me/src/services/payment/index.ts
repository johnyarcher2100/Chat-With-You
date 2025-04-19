// 導出所有支付服務相關類型和函數
export * from './types';
export * from './jkopay';
export * from './linepay';
export * from './factory';
export * from './ai-metering';

// 導出支付服務工廠的單例實例
import { PaymentServiceFactory, PaymentMethod } from './factory';
export const paymentServiceFactory = PaymentServiceFactory.getInstance();

// 獲取指定支付方式的支付服務
export const getPaymentService = (method: PaymentMethod) => {
  return paymentServiceFactory.getService(method);
};

// 檢查支付方式是否可用
export const isPaymentMethodAvailable = (method: PaymentMethod) => {
  return paymentServiceFactory.isPaymentMethodAvailable(method);
};

// 獲取所有可用的支付方式
export const getAvailablePaymentMethods = () => {
  return paymentServiceFactory.getAvailablePaymentMethods();
};
