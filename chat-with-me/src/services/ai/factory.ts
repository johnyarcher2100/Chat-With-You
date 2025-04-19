import { hasDeepSeekApiKey, hasClaudeApiKey } from '@/config/env';
import { AIService } from './types';
import { DeepSeekService } from './deepseek';
import { ClaudeService } from './claude';

// AI 服務類型
export enum AIServiceType {
  DEEPSEEK = 'deepseek',
  CLAUDE = 'claude'
}

// AI 服務工廠
export class AIServiceFactory {
  private static instance: AIServiceFactory;
  private services: Map<AIServiceType, AIService>;
  private defaultService: AIServiceType | null = null;

  private constructor() {
    this.services = new Map();
    this.initServices();
  }

  // 獲取單例實例
  public static getInstance(): AIServiceFactory {
    if (!AIServiceFactory.instance) {
      AIServiceFactory.instance = new AIServiceFactory();
    }
    return AIServiceFactory.instance;
  }

  // 初始化服務
  private initServices(): void {
    // 檢查 DeepSeek API 密鑰
    if (hasDeepSeekApiKey()) {
      this.services.set(AIServiceType.DEEPSEEK, new DeepSeekService());
      if (this.defaultService === null) {
        this.defaultService = AIServiceType.DEEPSEEK;
      }
    }

    // 檢查 Claude API 密鑰
    if (hasClaudeApiKey()) {
      this.services.set(AIServiceType.CLAUDE, new ClaudeService());
      if (this.defaultService === null) {
        this.defaultService = AIServiceType.CLAUDE;
      }
    }
  }

  // 獲取服務
  public getService(type?: AIServiceType): AIService {
    // 如果指定了服務類型，嘗試獲取該服務
    if (type && this.services.has(type)) {
      return this.services.get(type)!;
    }

    // 否則，返回默認服務
    if (this.defaultService !== null && this.services.has(this.defaultService)) {
      return this.services.get(this.defaultService)!;
    }

    // 如果沒有可用的服務，拋出錯誤
    throw new Error('No AI service available. Please check your API keys.');
  }

  // 獲取默認服務類型
  public getDefaultServiceType(): AIServiceType | null {
    return this.defaultService;
  }

  // 獲取所有可用的服務類型
  public getAvailableServiceTypes(): AIServiceType[] {
    return Array.from(this.services.keys());
  }

  // 檢查服務是否可用
  public isServiceAvailable(type: AIServiceType): boolean {
    return this.services.has(type);
  }

  // 設置默認服務
  public setDefaultService(type: AIServiceType): void {
    if (this.services.has(type)) {
      this.defaultService = type;
    } else {
      throw new Error(`AI service ${type} is not available.`);
    }
  }
}
