import { Message as AIMessage } from './types';
import { getDefaultAIService } from './index';
import { Message, Profile } from '@/types/supabase';
import { recordAIUsage } from '@/lib/supabase-client-extended';

// 建議類型
export enum SuggestionType {
  REPLY = 'reply',         // 一般回覆
  QUESTION = 'question',   // 提問
  EMOTION = 'emotion',     // 情感表達
  ACTION = 'action'        // 行動建議
}

export interface Suggestion {
  text: string;            // 建議文本
  type?: SuggestionType;   // 建議類型
  confidence: number;      // 0-1 之間的置信度
  metadata?: any;          // 額外元數據
}

// 獲取聊天建議
export const getChatSuggestions = async (
  messages: Message[],
  currentUser: Profile,
  participants: Profile[],
  count: number = 3,
  options: {
    includeTypes?: SuggestionType[];
    language?: string;
    maxLength?: number;
  } = {}
): Promise<Suggestion[]> => {
  try {
    // 獲取 AI 服務
    const aiService = getDefaultAIService();

    // 設置選項
    const {
      includeTypes = Object.values(SuggestionType),
      language = '中文',
      maxLength = 50
    } = options;

    // 準備系統提示
    const systemPrompt = `你是一個聊天助手，負責根據聊天歷史提供上下文相關的回覆建議。
請分析以下聊天歷史，並提供 ${count} 個可能的回覆建議。
這些建議應該是自然的、有幫助的，並且與聊天的上下文相關。
每個建議應該是一個簡短的句子或短語，不超過 ${maxLength} 個字符。
請使用${language}回覆。

請提供不同類型的建議，包括：
${includeTypes.includes(SuggestionType.REPLY) ? '- 一般回覆：直接回應前一條消息的內容' : ''}
${includeTypes.includes(SuggestionType.QUESTION) ? '- 提問：提出相關的問題以繼續對話' : ''}
${includeTypes.includes(SuggestionType.EMOTION) ? '- 情感表達：表達情感或共鳴的回覆' : ''}
${includeTypes.includes(SuggestionType.ACTION) ? '- 行動建議：建議下一步行動或活動' : ''}

請以 JSON 格式返回結果，格式如下：
[
  {
    "text": "建議文本",
    "type": "建議類型",
    "confidence": 0.9
  },
  ...
]

其中，建議類型可以是："reply"、"question"、"emotion"、"action"。
置信度應該是 0-1 之間的數字，表示建議的相關性和適用性。`;

    // 準備用戶消息
    const userMessages: AIMessage[] = [];

    // 添加系統消息
    userMessages.push({
      role: 'system',
      content: systemPrompt
    });

    // 添加聊天歷史
    const chatHistory = messages
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .slice(-10); // 只使用最近的 10 條消息

    for (const message of chatHistory) {
      const sender = message.user_id === currentUser.id
        ? currentUser
        : participants.find(p => p.id === message.user_id);

      const senderName = sender?.username || sender?.full_name || 'Unknown';

      userMessages.push({
        role: 'user',
        content: `${senderName}: ${message.content}`
      });
    }

    // 添加最後的用戶提示
    userMessages.push({
      role: 'user',
      content: `請根據以上聊天歷史，為用戶 ${currentUser.username || currentUser.full_name || 'me'} 提供 ${count} 個可能的回覆建議。`
    });

    // 調用 AI 服務
    const response = await aiService.chatCompletion(userMessages, {
      temperature: 0.7,
      maxTokens: 200
    });

    // 記錄 AI 使用情況
    await recordAIUsage(
      currentUser.id,
      aiService.getServiceName(),
      response.usage.totalTokens,
      aiService.calculateCost(response.usage.promptTokens, response.usage.completionTokens)
    );

    // 解析建議
    let suggestions: Suggestion[] = [];

    try {
      // 嘗試解析 JSON 回應
      const jsonMatch = response.content.match(/\[\s*\{.*\}\s*\]/s);

      if (jsonMatch) {
        const jsonStr = jsonMatch[0];
        const parsedSuggestions = JSON.parse(jsonStr);

        suggestions = parsedSuggestions
          .filter((s: any) => s.text && s.text.length > 0 && s.text.length <= 100)
          .slice(0, count)
          .map((s: any) => ({
            text: s.text.trim(),
            type: Object.values(SuggestionType).includes(s.type) ? s.type : SuggestionType.REPLY,
            confidence: typeof s.confidence === 'number' && s.confidence >= 0 && s.confidence <= 1
              ? s.confidence
              : 0.8
          }));
      }
    } catch (error) {
      console.warn('Failed to parse JSON suggestions, falling back to text parsing:', error);
    }

    // 如果 JSON 解析失敗，回退到文本解析
    if (suggestions.length === 0) {
      suggestions = response.content
        .split('\n')
        .filter(line => line.trim() !== '')
        .map(line => line.replace(/^\d+\.\s*/, '').trim()) // 移除數字前綴
        .filter(line => line.length > 0 && line.length <= 100) // 過濾太長或太短的建議
        .slice(0, count) // 限制建議數量
        .map(text => ({
          text,
          type: SuggestionType.REPLY,
          confidence: 0.8 // 默認置信度
        }));
    }

    return suggestions;
  } catch (error) {
    console.error('Error getting chat suggestions:', error);
    return [];
  }
};

// 回覆語調
export enum ReplyTone {
  FRIENDLY = 'friendly',       // 友好的
  PROFESSIONAL = 'professional', // 專業的
  CASUAL = 'casual',           // 随意的
  EMPATHETIC = 'empathetic',   // 共情的
  HUMOROUS = 'humorous'        // 幽默的
}

// 獲取回覆建議
export const getReplyToMessage = async (
  message: Message,
  currentUser: Profile,
  options: {
    tone?: ReplyTone;
    language?: string;
    maxLength?: number;
  } = {}
): Promise<string> => {
  try {
    // 獲取 AI 服務
    const aiService = getDefaultAIService();

    // 設置選項
    const {
      tone = ReplyTone.FRIENDLY,
      language = '中文',
      maxLength = 100
    } = options;

    // 準備系統提示
    let systemPrompt = `你是一個聊天助手，負責生成對消息的回覆。`;

    // 根據語調調整提示
    switch (tone) {
      case ReplyTone.FRIENDLY:
        systemPrompt += `請以友好、熱情的語調回覆，表現出關心和興趣。`;
        break;
      case ReplyTone.PROFESSIONAL:
        systemPrompt += `請以專業、正式的語調回覆，保持禮貌和專業性。`;
        break;
      case ReplyTone.CASUAL:
        systemPrompt += `請以輕鬆、隨意的語調回覆，就像與朋友聊天一樣。`;
        break;
      case ReplyTone.EMPATHETIC:
        systemPrompt += `請以共情、理解的語調回覆，表現出同理心和支持。`;
        break;
      case ReplyTone.HUMOROUS:
        systemPrompt += `請以幽默、詽謙的語調回覆，增添對話的樂趣性。`;
        break;
    }

    systemPrompt += `
回覆應該是自然的、有幫助的，並且與消息的內容相關。
回覆應該是一個簡短的句子或短語，不超過 ${maxLength} 個字符。
請使用${language}回覆。
請只返回回覆內容，不要添加任何其他文本。`;

    // 準備用戶消息
    const userMessages: AIMessage[] = [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: `消息: ${message.content}\n\n請生成一個回覆。`
      }
    ];

    // 調用 AI 服務
    const response = await aiService.chatCompletion(userMessages, {
      temperature: 0.7,
      maxTokens: 100
    });

    // 記錄 AI 使用情況
    await recordAIUsage(
      currentUser.id,
      aiService.getServiceName(),
      response.usage.totalTokens,
      aiService.calculateCost(response.usage.promptTokens, response.usage.completionTokens)
    );

    return response.content.trim();
  } catch (error) {
    console.error('Error getting reply to message:', error);
    return '';
  }
};
