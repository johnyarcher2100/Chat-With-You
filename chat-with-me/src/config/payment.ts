// 支付配置

// 街口支付配置
export const JKOPAY_CONFIG = {
  merchantId: process.env.JKOPAY_MERCHANT_ID || '',
  merchantKey: process.env.JKOPAY_MERCHANT_KEY || '',
  apiUrl: process.env.JKOPAY_API_URL || 'https://api-sandbox.jkopay.com',
  returnUrl: process.env.NEXT_PUBLIC_URL ? `${process.env.NEXT_PUBLIC_URL}/payments/callback/jkopay` : 'http://localhost:3000/payments/callback/jkopay',
  notifyUrl: process.env.NEXT_PUBLIC_URL ? `${process.env.NEXT_PUBLIC_URL}/api/payments/notify/jkopay` : 'http://localhost:3000/api/payments/notify/jkopay'
};

// Line Pay 配置
export const LINEPAY_CONFIG = {
  channelId: process.env.LINEPAY_CHANNEL_ID || '',
  channelSecret: process.env.LINEPAY_CHANNEL_SECRET || '',
  apiUrl: process.env.LINEPAY_API_URL || 'https://sandbox-api-pay.line.me',
  returnUrl: process.env.NEXT_PUBLIC_URL ? `${process.env.NEXT_PUBLIC_URL}/payments/callback/linepay` : 'http://localhost:3000/payments/callback/linepay',
  cancelUrl: process.env.NEXT_PUBLIC_URL ? `${process.env.NEXT_PUBLIC_URL}/payments/cancel/linepay` : 'http://localhost:3000/payments/cancel/linepay'
};

// 信用卡配置（使用 Stripe）
export const STRIPE_CONFIG = {
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
  secretKey: process.env.STRIPE_SECRET_KEY || '',
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  returnUrl: process.env.NEXT_PUBLIC_URL ? `${process.env.NEXT_PUBLIC_URL}/payments/callback/stripe` : 'http://localhost:3000/payments/callback/stripe'
};

// AI 計量配置
export const AI_METERING_CONFIG = {
  // 基本費率（每 1000 個 token）
  baseRates: {
    'deepseek': {
      input: 0.002, // 美元
      output: 0.006 // 美元
    },
    'claude': {
      input: 0.003, // 美元
      output: 0.015 // 美元
    }
  },
  
  // 轉換為新台幣的匯率
  usdToTwdRate: 31.5,
  
  // 新用戶免費額度（新台幣）
  newUserFreeCredit: 100,
  
  // 充值方案
  plans: [
    { id: 'basic', name: '基本方案', amount: 100, bonus: 0 }, // 100 TWD
    { id: 'standard', name: '標準方案', amount: 500, bonus: 50 }, // 500 TWD + 50 TWD bonus
    { id: 'premium', name: '高級方案', amount: 1000, bonus: 150 } // 1000 TWD + 150 TWD bonus
  ]
};
