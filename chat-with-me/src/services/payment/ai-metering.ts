import { AI_METERING_CONFIG } from '@/config/payment';
import { recordAIUsage, getAIUsageSummary, getUserBalance, updateUserBalance } from '@/lib/supabase-client-extended';

// 計算 AI 使用成本（美元）
export const calculateAICost = (
  apiName: string,
  inputTokens: number,
  outputTokens: number
): number => {
  // 獲取基本費率
  const rates = AI_METERING_CONFIG.baseRates[apiName.toLowerCase()] || {
    input: 0.002,
    output: 0.006
  };
  
  // 計算成本
  const inputCost = (inputTokens / 1000) * rates.input;
  const outputCost = (outputTokens / 1000) * rates.output;
  
  return inputCost + outputCost;
};

// 計算 AI 使用成本（新台幣）
export const calculateAICostInTWD = (
  apiName: string,
  inputTokens: number,
  outputTokens: number
): number => {
  // 計算美元成本
  const usdCost = calculateAICost(apiName, inputTokens, outputTokens);
  
  // 轉換為新台幣
  return usdCost * AI_METERING_CONFIG.usdToTwdRate;
};

// 記錄 AI 使用情況並更新餘額
export const recordAndChargeAIUsage = async (
  userId: string,
  apiName: string,
  inputTokens: number,
  outputTokens: number
): Promise<{
  success: boolean;
  cost: number;
  remainingBalance: number;
  message?: string;
}> => {
  try {
    // 計算成本（美元）
    const cost = calculateAICost(apiName, inputTokens, outputTokens);
    
    // 獲取用戶餘額
    const balance = await getUserBalance(userId);
    
    if (!balance) {
      return {
        success: false,
        cost: 0,
        remainingBalance: 0,
        message: '無法獲取用戶餘額'
      };
    }
    
    // 檢查餘額是否足夠
    if (balance.balance < cost) {
      return {
        success: false,
        cost,
        remainingBalance: balance.balance,
        message: '餘額不足'
      };
    }
    
    // 記錄 AI 使用情況
    await recordAIUsage(userId, apiName, inputTokens + outputTokens, cost);
    
    // 更新用戶餘額
    const updatedBalance = await updateUserBalance(userId, -cost);
    
    return {
      success: true,
      cost,
      remainingBalance: updatedBalance?.balance || 0
    };
  } catch (error) {
    console.error('Error recording and charging AI usage:', error);
    return {
      success: false,
      cost: 0,
      remainingBalance: 0,
      message: '記錄 AI 使用情況時出錯'
    };
  }
};

// 獲取用戶 AI 使用情況摘要
export const getAIUsageSummaryInTWD = async (
  userId: string,
  startDate?: Date,
  endDate?: Date
): Promise<{
  totalTokens: number;
  totalCostUSD: number;
  totalCostTWD: number;
}> => {
  try {
    // 獲取 AI 使用情況摘要
    const summary = await getAIUsageSummary(userId, startDate, endDate);
    
    return {
      totalTokens: summary.total_tokens,
      totalCostUSD: summary.total_cost,
      totalCostTWD: summary.total_cost * AI_METERING_CONFIG.usdToTwdRate
    };
  } catch (error) {
    console.error('Error getting AI usage summary:', error);
    return {
      totalTokens: 0,
      totalCostUSD: 0,
      totalCostTWD: 0
    };
  }
};

// 檢查用戶餘額是否足夠
export const checkUserBalance = async (
  userId: string,
  requiredAmount: number
): Promise<{
  sufficient: boolean;
  balance: number;
}> => {
  try {
    // 獲取用戶餘額
    const balance = await getUserBalance(userId);
    
    if (!balance) {
      return {
        sufficient: false,
        balance: 0
      };
    }
    
    return {
      sufficient: balance.balance >= requiredAmount,
      balance: balance.balance
    };
  } catch (error) {
    console.error('Error checking user balance:', error);
    return {
      sufficient: false,
      balance: 0
    };
  }
};

// 為新用戶添加免費額度
export const addFreeCreditsForNewUser = async (userId: string): Promise<boolean> => {
  try {
    // 獲取用戶餘額
    const balance = await getUserBalance(userId);
    
    // 如果餘額為 0，添加免費額度
    if (balance && balance.balance === 0) {
      await updateUserBalance(userId, AI_METERING_CONFIG.newUserFreeCredit);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error adding free credits for new user:', error);
    return false;
  }
};
