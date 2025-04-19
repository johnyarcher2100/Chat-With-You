import { DEEPSEEK_API_KEY } from '@/config/env';
import {
  AIService,
  Message,
  ChatCompletionOptions,
  ChatCompletionResponse
} from './types';

// DeepSeek API 端點
const DEEPSEEK_API_ENDPOINT = 'https://api.deepseek.com/v1/chat/completions';

// DeepSeek 模型
const DEEPSEEK_MODELS = {
  DEEPSEEK_CHAT: 'deepseek-chat',
  DEEPSEEK_CODER: 'deepseek-coder'
};

// DeepSeek API 服務
export class DeepSeekService implements AIService {
  private apiKey: string;
  private defaultModel: string;

  constructor(apiKey = DEEPSEEK_API_KEY, defaultModel = DEEPSEEK_MODELS.DEEPSEEK_CHAT) {
    this.apiKey = apiKey;
    this.defaultModel = defaultModel;
  }

  // 聊天完成
  async chatCompletion(
    messages: Message[],
    options: ChatCompletionOptions = {}
  ): Promise<ChatCompletionResponse> {
    try {
      // 檢查 API 密鑰
      if (!this.apiKey) {
        throw new Error('DeepSeek API key is not set');
      }

      // 設置默認選項
      const {
        temperature = 0.7,
        maxTokens = 1000,
        topP = 1,
        frequencyPenalty = 0,
        presencePenalty = 0,
        stop = []
      } = options;

      // 準備請求數據
      const requestData = {
        model: this.defaultModel,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        temperature,
        max_tokens: maxTokens,
        top_p: topP,
        frequency_penalty: frequencyPenalty,
        presence_penalty: presencePenalty,
        stop: stop.length > 0 ? stop : undefined
      };

      // 發送請求
      const response = await fetch(DEEPSEEK_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(requestData)
      });

      // 檢查響應
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`DeepSeek API error: ${errorData.error?.message || response.statusText}`);
      }

      // 解析響應
      const data = await response.json();

      // 返回格式化的響應
      return {
        content: data.choices[0].message.content,
        model: data.model,
        usage: {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens
        }
      };
    } catch (error) {
      console.error('DeepSeek API error:', error);
      throw error;
    }
  }

  // 獲取服務名稱
  getServiceName(): string {
    return 'DeepSeek';
  }

  // 獲取默認模型
  getDefaultModel(): string {
    return this.defaultModel;
  }

  // 獲取可用模型列表
  getAvailableModels(): string[] {
    return Object.values(DEEPSEEK_MODELS);
  }

  // 計算成本（美元）
  calculateCost(promptTokens: number, completionTokens: number): number {
    // DeepSeek 的價格可能會變動，這裡使用估計值
    // 假設 DeepSeek Chat 的價格為每 1000 個 prompt tokens $0.002，每 1000 個 completion tokens $0.006
    const promptCost = (promptTokens / 1000) * 0.002;
    const completionCost = (completionTokens / 1000) * 0.006;
    return promptCost + completionCost;
  }
}
