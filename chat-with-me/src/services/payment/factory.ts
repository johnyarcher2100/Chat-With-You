import { PaymentMethod, PaymentService } from './types';
import { JkopayService } from './jkopay';
import { LinePayService } from './linepay';

// 支付服務工廠
export class PaymentServiceFactory {
  private static instance: PaymentServiceFactory;
  private services: Map<PaymentMethod, PaymentService>;

  private constructor() {
    this.services = new Map();
    this.initServices();
  }

  // 獲取單例實例
  public static getInstance(): PaymentServiceFactory {
    if (!PaymentServiceFactory.instance) {
      PaymentServiceFactory.instance = new PaymentServiceFactory();
    }
    return PaymentServiceFactory.instance;
  }

  // 初始化服務
  private initServices(): void {
    // 初始化街口支付服務
    this.services.set(PaymentMethod.JKOPAY, new JkopayService());
    
    // 初始化 Line Pay 服務
    this.services.set(PaymentMethod.LINEPAY, new LinePayService());
    
    // 信用卡支付暫未實現
    // this.services.set(PaymentMethod.CREDIT_CARD, new CreditCardService());
  }

  // 獲取支付服務
  public getService(method: PaymentMethod): PaymentService {
    const service = this.services.get(method);
    
    if (!service) {
      throw new Error(`不支持的支付方式: ${method}`);
    }
    
    return service;
  }

  // 獲取所有可用的支付方式
  public getAvailablePaymentMethods(): PaymentMethod[] {
    return Array.from(this.services.keys());
  }

  // 檢查支付方式是否可用
  public isPaymentMethodAvailable(method: PaymentMethod): boolean {
    return this.services.has(method);
  }
}
