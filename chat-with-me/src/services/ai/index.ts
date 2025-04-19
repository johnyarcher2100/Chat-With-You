// 導出所有 AI 服務相關類型和函數
export * from './types';
export * from './deepseek';
export * from './claude';
export * from './factory';

// 導出 AI 服務工廠的單例實例
import { AIServiceFactory, AIServiceType } from './factory';
export const aiServiceFactory = AIServiceFactory.getInstance();

// 獲取默認 AI 服務
export const getDefaultAIService = () => {
  return aiServiceFactory.getService();
};

// 獲取指定類型的 AI 服務
export const getAIService = (type: AIServiceType) => {
  return aiServiceFactory.getService(type);
};

// 檢查 AI 服務是否可用
export const isAIServiceAvailable = (type: AIServiceType) => {
  return aiServiceFactory.isServiceAvailable(type);
};

// 獲取所有可用的 AI 服務類型
export const getAvailableAIServiceTypes = () => {
  return aiServiceFactory.getAvailableServiceTypes();
};

// 獲取默認 AI 服務類型
export const getDefaultAIServiceType = () => {
  return aiServiceFactory.getDefaultServiceType();
};
