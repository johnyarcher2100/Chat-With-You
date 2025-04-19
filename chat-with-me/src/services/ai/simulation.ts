import { Message as AIMessage } from './types';
import { getDefaultAIService } from './index';
import { Message, Profile } from '@/types/supabase';
import { recordAIUsage } from '@/lib/supabase-client-extended';
import { sendMessage } from '@/lib/supabase-client';

// 模擬用戶回覆選項
export interface SimulationOptions {
  personality?: string;     // 性格特征，如「外向」、「內向」、「幽默」等
  responseStyle?: string;   // 回覆風格，如「簡短」、「詳細」、「正式」等
  interests?: string[];     // 興趣愛好，影響回覆內容
  minDelay?: number;        // 最小延遲時間（毫秒）
  maxDelay?: number;        // 最大延遲時間（毫秒）
  responseLength?: 'short' | 'medium' | 'long'; // 回覆長度
  language?: string;        // 回覆語言
}

// 模擬用戶回覆
export const simulateUserReply = async (
  chatId: string,
  messages: Message[],
  inactiveUser: Profile,
  activeUser: Profile,
  options: SimulationOptions = {}
): Promise<Message | null> => {
  try {
    // 獲取 AI 服務
    const aiService = getDefaultAIService();

    // 設置選項
    const {
      personality = '',
      responseStyle = '',
      interests = [],
      minDelay = 5000,  // 默認最小延遲 5 秒
      maxDelay = 30000, // 默認最大延遲 30 秒
      responseLength = 'medium',
      language = '中文'
    } = options;

    // 準備系統提示
    let systemPrompt = `你的任務是模擬用戶 ${inactiveUser.username || inactiveUser.full_name || 'User'} 的回覆。
請分析以下聊天歷史，並生成一個自然的、符合該用戶風格的回覆。`;

    // 添加性格特征
    if (personality) {
      systemPrompt += `
該用戶的性格特征是：${personality}。請確保回覆反映這些特征。`;
    }

    // 添加回覆風格
    if (responseStyle) {
      systemPrompt += `
該用戶的回覆風格是：${responseStyle}。請確保回覆符合這種風格。`;
    }

    // 添加興趣愛好
    if (interests.length > 0) {
      systemPrompt += `
該用戶的興趣愛好包括：${interests.join('、')}。如果適用，請在回覆中反映這些興趣。`;
    }

    // 添加回覆長度
    switch (responseLength) {
      case 'short':
        systemPrompt += `
請生成非常簡短的回覆，通常不超過 20 個字符。`;
        break;
      case 'medium':
        systemPrompt += `
請生成中等長度的回覆，通常在 20-50 個字符之間。`;
        break;
      case 'long':
        systemPrompt += `
請生成較長的回覆，通常在 50-100 個字符之間。`;
        break;
    }

    systemPrompt += `
回覆應該是自然的，並且與聊天的上下文相關。
請使用${language}回覆。
請只返回模擬的回覆內容，不要添加任何其他文本或解釋。`;

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
      const isInactiveUser = message.user_id === inactiveUser.id;
      const sender = isInactiveUser ? inactiveUser : activeUser;
      const senderName = sender?.username || sender?.full_name || 'Unknown';

      userMessages.push({
        role: 'user',
        content: `${senderName}: ${message.content}`
      });
    }

    // 添加最後的用戶提示
    userMessages.push({
      role: 'user',
      content: `請模擬 ${inactiveUser.username || inactiveUser.full_name || 'User'} 的回覆。`
    });

    // 調用 AI 服務
    const response = await aiService.chatCompletion(userMessages, {
      temperature: 0.8, // 稍微提高溫度以增加多樣性
      maxTokens: 150
    });

    // 記錄 AI 使用情況
    await recordAIUsage(
      activeUser.id, // 由活躍用戶支付費用
      aiService.getServiceName(),
      response.usage.totalTokens,
      aiService.calculateCost(response.usage.promptTokens, response.usage.completionTokens)
    );

    // 隨機延遲一段時間，模擬真實用戶的回覆時間
    const delay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;

    // 根據回覆長度調整延遲
    // 較長的回覆需要更多時間「思考」和「輸入」
    let adjustedDelay = delay;
    if (response.content.length > 50) {
      adjustedDelay = delay * 1.5; // 增加 50% 的延遲
    } else if (response.content.length < 20) {
      adjustedDelay = delay * 0.8; // 減少 20% 的延遲
    }

    await new Promise(resolve => setTimeout(resolve, adjustedDelay));

    // 發送模擬消息
    const simulatedMessage = await sendMessage(
      chatId,
      inactiveUser.id,
      response.content.trim(),
      true // 標記為 AI 生成
    );

    return simulatedMessage;
  } catch (error) {
    console.error('Error simulating user reply:', error);
    return null;
  }
};

// 檢查用戶是否不活躍
export const isUserInactive = (
  messages: Message[],
  userId: string,
  inactivityThreshold: number = 24 * 60 * 60 * 1000 // 默認 24 小時
): boolean => {
  // 獲取用戶的最後一條消息
  const userMessages = messages.filter(msg => msg.user_id === userId);

  if (userMessages.length === 0) {
    return true; // 用戶沒有發送過消息，視為不活躍
  }

  // 按時間排序
  userMessages.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // 獲取最後一條消息的時間
  const lastMessageTime = new Date(userMessages[0].created_at).getTime();
  const currentTime = Date.now();

  // 檢查是否超過不活躍閾值
  return (currentTime - lastMessageTime) > inactivityThreshold;
};

// 自動模擬選項
export interface AutoSimulationOptions extends SimulationOptions {
  inactivityThreshold?: number; // 不活躍門檻（毫秒）
  simulationProbability?: number; // 模擬機率（0-1）
  preferredUsers?: string[]; // 偏好模擬的用戶 ID
  excludedUsers?: string[]; // 排除模擬的用戶 ID
  contextAnalysis?: boolean; // 是否分析上下文以決定最適合回覆的用戶
}

// 自動模擬不活躍用戶的回覆
export const autoSimulateInactiveUsers = async (
  chatId: string,
  messages: Message[],
  participants: Profile[],
  currentUser: Profile,
  options: AutoSimulationOptions = {}
): Promise<Message | null> => {
  try {
    // 設置選項
    const {
      inactivityThreshold = 24 * 60 * 60 * 1000, // 默認 24 小時
      simulationProbability = 0.8, // 默認 80% 的機率模擬
      preferredUsers = [],
      excludedUsers = [],
      contextAnalysis = true,
      ...simulationOptions
    } = options;

    // 模擬機率檢查
    if (Math.random() > simulationProbability) {
      return null; // 根據機率決定是否模擬
    }

    // 獲取所有不活躍的用戶
    let inactiveUsers = participants.filter(user =>
      user.id !== currentUser.id && // 不包括當前用戶
      !excludedUsers.includes(user.id) && // 不在排除列表中
      isUserInactive(messages, user.id, inactivityThreshold) // 檢查是否不活躍
    );

    // 如果沒有不活躍的用戶，直接返回
    if (inactiveUsers.length === 0) {
      return null;
    }

    // 優先考慮偏好用戶
    const preferredInactiveUsers = inactiveUsers.filter(user =>
      preferredUsers.includes(user.id)
    );

    if (preferredInactiveUsers.length > 0) {
      inactiveUsers = preferredInactiveUsers;
    }

    let selectedUser: Profile;

    if (contextAnalysis && inactiveUsers.length > 1 && messages.length > 0) {
      // 分析上下文，選擇最適合回覆的用戶
      // 簡單策略：選擇最後發言的用戶
      const lastActiveUsers = new Map<string, Date>();

      // 記錄每個用戶的最後發言時間
      for (const message of messages) {
        const userId = message.user_id;
        const messageTime = new Date(message.created_at);

        if (inactiveUsers.some(u => u.id === userId)) {
          const currentLastTime = lastActiveUsers.get(userId);

          if (!currentLastTime || messageTime > currentLastTime) {
            lastActiveUsers.set(userId, messageTime);
          }
        }
      }

      // 按最後發言時間排序
      const sortedUsers = [...lastActiveUsers.entries()]
        .sort((a, b) => b[1].getTime() - a[1].getTime())
        .map(([userId]) => inactiveUsers.find(u => u.id === userId))
        .filter((user): user is Profile => !!user);

      // 如果有排序結果，選擇最後發言的用戶
      if (sortedUsers.length > 0) {
        selectedUser = sortedUsers[0];
      } else {
        // 如果沒有排序結果，隨機選擇
        const randomIndex = Math.floor(Math.random() * inactiveUsers.length);
        selectedUser = inactiveUsers[randomIndex];
      }
    } else {
      // 隨機選擇一個不活躍的用戶
      const randomIndex = Math.floor(Math.random() * inactiveUsers.length);
      selectedUser = inactiveUsers[randomIndex];
    }

    // 模擬用戶回覆
    return await simulateUserReply(chatId, messages, selectedUser, currentUser, simulationOptions);
  } catch (error) {
    console.error('Error auto-simulating inactive users:', error);
    return null;
  }
};
