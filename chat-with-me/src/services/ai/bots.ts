import { Message as AIMessage } from './types';
import { getDefaultAIService } from './index';
import { Message, Profile, AIBot } from '@/types/supabase';
import { recordAIUsage } from '@/lib/supabase-client-extended';
import { sendMessage } from '@/lib/supabase-client';

// 機器人類型
export enum BotType {
  KNOWLEDGE = 'knowledge',
  ORDER = 'order',
  CUSTOM = 'custom'
}

// 機器人配置
export interface BotConfiguration {
  // 通用配置
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;

  // 知識型機器人配置
  knowledgeBase?: string;

  // 訂單型機器人配置
  products?: Array<{
    id: string;
    name: string;
    description: string;
    price: number;
    available: boolean;
  }>;
  paymentMethods?: string[];

  // 自定義型機器人配置
  customInstructions?: string;
}

// 獲取機器人系統提示
const getBotSystemPrompt = (bot: AIBot): string => {
  const config = bot.configuration as BotConfiguration;

  // 如果有自定義系統提示，直接使用
  if (config.systemPrompt) {
    return config.systemPrompt;
  }

  // 根據機器人類型生成系統提示
  switch (bot.bot_type) {
    case BotType.KNOWLEDGE:
      return `你是一個名為 ${bot.name} 的知識型助手。
你的任務是回答用戶的問題，提供準確、有幫助的信息。
${config.knowledgeBase ? `你擁有以下知識庫：\n${config.knowledgeBase}\n` : ''}
請保持專業、友好的語調，並盡可能提供詳細的解釋。
如果你不知道答案，請誠實地告訴用戶你不知道，而不是編造信息。`;

    case BotType.ORDER:
      return `你是一個名為 ${bot.name} 的訂單助手。
你的任務是幫助用戶瀏覽產品、下訂單和處理支付。
${config.products ? `可用產品：\n${JSON.stringify(config.products, null, 2)}\n` : ''}
${config.paymentMethods ? `支付方式：${config.paymentMethods.join(', ')}\n` : ''}
請引導用戶完成訂購流程，提供清晰的選項和說明。
如果用戶詢問不在產品列表中的商品，請告訴他們目前不提供該商品。`;

    case BotType.CUSTOM:
      return config.customInstructions || `你是一個名為 ${bot.name} 的自定義助手。
請根據用戶的需求提供幫助和支持。`;

    default:
      return `你是一個名為 ${bot.name} 的助手。
請根據用戶的需求提供幫助和支持。`;
  }
};

// 處理機器人消息（聊天頁面）
export const processBotMessage = async (
  userMessage: string,
  botType: BotType,
  botConfig: BotConfiguration,
  chatHistory: Array<{ role: 'user' | 'bot', content: string }>
): Promise<string> => {
  try {
    // 獲取 AI 服務
    const aiService = getDefaultAIService();

    // 準備系統提示
    let systemPrompt = '';

    // 根據機器人類型生成系統提示
    switch (botType) {
      case BotType.KNOWLEDGE:
        systemPrompt = `你是一個知識型助手。
你的任務是回答用戶的問題，提供準確、有幫助的信息。
${botConfig.knowledgeBase ? `你擁有以下知識庫：\n${botConfig.knowledgeBase}\n` : ''}
請保持專業、友好的語調，並盡可能提供詳細的解釋。
如果你不知道答案，請誠實地告訴用戶你不知道，而不是編造信息。`;
        break;

      case BotType.ORDER:
        systemPrompt = `你是一個訂單助手。
你的任務是幫助用戶瀏覽產品、下訂單和處理支付。
${botConfig.products ? `可用產品：\n${JSON.stringify(botConfig.products, null, 2)}\n` : ''}
${botConfig.paymentMethods ? `支付方式：${botConfig.paymentMethods.join(', ')}\n` : ''}
請引導用戶完成訂購流程，提供清晰的選項和說明。
如果用戶詢問不在產品列表中的商品，請告訴他們目前不提供該商品。`;
        break;

      case BotType.CUSTOM:
        systemPrompt = botConfig.customInstructions || `你是一個自定義助手。
請根據用戶的需求提供幫助和支持。`;
        break;

      default:
        systemPrompt = `你是一個助手。
請根據用戶的需求提供幫助和支持。`;
    }

    // 準備消息
    const messages: AIMessage[] = [
      { role: 'system', content: systemPrompt }
    ];

    // 添加聊天歷史
    for (const message of chatHistory.slice(-10)) { // 只使用最近的 10 條消息
      messages.push({
        role: message.role === 'bot' ? 'assistant' : 'user',
        content: message.content
      });
    }

    // 添加當前用戶消息
    messages.push({
      role: 'user',
      content: userMessage
    });

    // 調用 AI 服務
    const response = await aiService.chatCompletion(messages, {
      temperature: botConfig.temperature || 0.7,
      maxTokens: botConfig.maxTokens || 500
    });

    return response.content.trim();
  } catch (error) {
    console.error('Error processing bot message:', error);
    throw error;
  }
};

// 處理機器人消息（聊天室）
export const processBotMessageInChat = async (
  chatId: string,
  bot: AIBot,
  messages: Message[],
  currentUser: Profile
): Promise<Message | null> => {
  try {
    // 獲取 AI 服務
    const aiService = getDefaultAIService();

    // 獲取機器人配置
    const config = bot.configuration as BotConfiguration;

    // 準備系統提示
    const systemPrompt = getBotSystemPrompt(bot);

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
      const role = message.user_id === bot.id ? 'assistant' : 'user';

      userMessages.push({
        role,
        content: message.content
      });
    }

    // 調用 AI 服務
    const response = await aiService.chatCompletion(userMessages, {
      temperature: config.temperature || 0.7,
      maxTokens: config.maxTokens || 500
    });

    // 記錄 AI 使用情況
    await recordAIUsage(
      currentUser.id, // 由當前用戶支付費用
      aiService.getServiceName(),
      response.usage.totalTokens,
      aiService.calculateCost(response.usage.promptTokens, response.usage.completionTokens)
    );

    // 發送機器人消息
    const botMessage = await sendMessage(
      chatId,
      bot.id,
      response.content.trim(),
      true // 標記為 AI 生成
    );

    return botMessage;
  } catch (error) {
    console.error('Error processing bot message in chat:', error);
    return null;
  }
};

// 創建默認機器人配置
export const createDefaultBotConfiguration = (botType: BotType): BotConfiguration => {
  const baseConfig: BotConfiguration = {
    temperature: 0.7,
    maxTokens: 500
  };

  switch (botType) {
    case BotType.KNOWLEDGE:
      return {
        ...baseConfig,
        knowledgeBase: ''
      };

    case BotType.ORDER:
      return {
        ...baseConfig,
        products: [],
        paymentMethods: ['信用卡', '街口支付', 'Line Pay']
      };

    case BotType.CUSTOM:
      return {
        ...baseConfig,
        customInstructions: ''
      };

    default:
      return baseConfig;
  }
};
