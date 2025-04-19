import { CLAUDE_API_KEY } from '@/config/env';
import {
  AIService,
  Message,
  ChatCompletionOptions,
  ChatCompletionResponse
} from './types';

// Claude API 端點
const CLAUDE_API_ENDPOINT = 'https://api.anthropic.com/v1/messages';

// Claude 模型
const CLAUDE_MODELS = {
  CLAUDE_3_OPUS: 'claude-3-opus-20240229',
  CLAUDE_3_SONNET: 'claude-3-sonnet-20240229',
  CLAUDE_3_HAIKU: 'claude-3-haiku-20240307'
};

// Claude API 服務
export class ClaudeService implements AIService {
  private apiKey: string;
  private defaultModel: string;
  private apiVersion: string;

  constructor(
    apiKey = CLAUDE_API_KEY,
    defaultModel = CLAUDE_MODELS.CLAUDE_3_SONNET,
    apiVersion = '2023-06-01'
  ) {
    this.apiKey = apiKey;
    this.defaultModel = defaultModel;
    this.apiVersion = apiVersion;
  }

  // 聊天完成
  async chatCompletion(
    messages: Message[],
    options: ChatCompletionOptions = {}
  ): Promise<ChatCompletionResponse> {
    try {
      // 檢查 API 密鑰
      if (!this.apiKey) {
        throw new Error('Claude API key is not set');
      }

      // 設置默認選項
      const {
        temperature = 0.7,
        maxTokens = 1000,
        topP = 1,
        stop = []
      } = options;

      // 將消息轉換為 Claude 格式
      const systemMessage = messages.find(msg => msg.role === 'system');
      const nonSystemMessages = messages.filter(msg => msg.role !== 'system');

      // 準備請求數據
      const requestData = {
        model: this.defaultModel,
        messages: nonSystemMessages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        system: systemMessage?.content || '',
        temperature,
        max_tokens: maxTokens,
        top_p: topP,
        stop_sequences: stop.length > 0 ? stop : undefined
      };

      // 發送請求
      const response = await fetch(CLAUDE_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': this.apiVersion
        },
        body: JSON.stringify(requestData)
      });

      // 檢查響應
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Claude API error: ${errorData.error?.message || response.statusText}`);
      }

      // 解析響應
      const data = await response.json();

      // 返回格式化的響應
      return {
        content: data.content[0].text,
        model: data.model,
        usage: {
          promptTokens: data.usage.input_tokens,
          completionTokens: data.usage.output_tokens,
          totalTokens: data.usage.input_tokens + data.usage.output_tokens
        }
      };
    } catch (error) {
      console.error('Claude API error:', error);
      throw error;
    }
  }

  // 獲取服務名稱
  getServiceName(): string {
    return 'Claude';
  }

  // 獲取默認模型
  getDefaultModel(): string {
    return this.defaultModel;
  }

  // 獲取可用模型列表
  getAvailableModels(): string[] {
    return Object.values(CLAUDE_MODELS);
  }

  // 計算成本（美元）
  calculateCost(promptTokens: number, completionTokens: number): number {
    // Claude 的價格可能會變動，這裡使用估計值
    // 假設 Claude 3 Sonnet 的價格為每 1M 個 input tokens $3，每 1M 個 output tokens $15
    const promptCost = (promptTokens / 1000000) * 3;
    const completionCost = (completionTokens / 1000000) * 15;
    return promptCost + completionCost;
  }
}
