// AI 服務類型定義

// 消息角色
export type MessageRole = 'system' | 'user' | 'assistant';

// 消息
export interface Message {
  role: MessageRole;
  content: string;
}

// 聊天完成請求選項
export interface ChatCompletionOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stop?: string[];
}

// 聊天完成響應
export interface ChatCompletionResponse {
  content: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// AI 服務接口
export interface AIService {
  // 聊天完成
  chatCompletion(
    messages: Message[],
    options?: ChatCompletionOptions
  ): Promise<ChatCompletionResponse>;

  // 獲取服務名稱
  getServiceName(): string;

  // 獲取默認模型
  getDefaultModel(): string;

  // 獲取可用模型列表
  getAvailableModels(): string[];

  // 計算成本
  calculateCost(promptTokens: number, completionTokens: number): number;
}
