'use client';

import { useState, useCallback } from 'react';
import { Message, Profile } from '@/types/supabase';
import { getChatSuggestions, Suggestion, SuggestionType, getReplyToMessage, ReplyTone } from '@/services/ai/suggestions';
import { simulateUserReply, isUserInactive, autoSimulateInactiveUsers } from '@/services/ai/simulation';
import { processBotMessage, BotType, createDefaultBotConfiguration } from '@/services/ai/bots';
import { AIServiceType, getAvailableAIServiceTypes, getDefaultAIServiceType } from '@/services/ai';

// 使用聊天建議的 Hook
export const useChatSuggestions = () => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState({
    count: 3,
    includeTypes: Object.values(SuggestionType),
    language: '中文',
    maxLength: 50
  });

  const getSuggestions = useCallback(async (
    messages: Message[],
    currentUser: Profile,
    participants: Profile[],
    count?: number,
    options?: {
      includeTypes?: SuggestionType[];
      language?: string;
      maxLength?: number;
    }
  ) => {
    setLoading(true);
    setError(null);

    // 合併選項
    const mergedOptions = {
      ...settings,
      count: count || settings.count,
      ...options
    };

    try {
      const result = await getChatSuggestions(
        messages,
        currentUser,
        participants,
        mergedOptions.count,
        {
          includeTypes: mergedOptions.includeTypes,
          language: mergedOptions.language,
          maxLength: mergedOptions.maxLength
        }
      );
      setSuggestions(result);
    } catch (err: any) {
      setError(err.message || 'Failed to get suggestions');
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, [settings]);

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
  }, []);

  const updateSettings = useCallback((newSettings: Partial<typeof settings>) => {
    setSettings(prev => ({
      ...prev,
      ...newSettings
    }));
  }, []);

  // 根據類型篩選建議
  const getSuggestionsByType = useCallback((type: SuggestionType) => {
    return suggestions.filter(s => s.type === type);
  }, [suggestions]);

  // 根據置信度排序建議
  const getSortedSuggestions = useCallback(() => {
    return [...suggestions].sort((a, b) => b.confidence - a.confidence);
  }, [suggestions]);

  return {
    suggestions,
    loading,
    error,
    settings,
    getSuggestions,
    clearSuggestions,
    updateSettings,
    getSuggestionsByType,
    getSortedSuggestions
  };
};

// 使用模擬回覆的 Hook
export const useSimulatedReplies = () => {
  const [simulating, setSimulating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState({
    personality: '',
    responseStyle: '',
    interests: [] as string[],
    minDelay: 5000,
    maxDelay: 30000,
    responseLength: 'medium' as 'short' | 'medium' | 'long',
    language: '中文',
    inactivityThreshold: 24 * 60 * 60 * 1000, // 24 小時
    simulationProbability: 0.8,
    preferredUsers: [] as string[],
    excludedUsers: [] as string[],
    contextAnalysis: true
  });

  const simulateReply = useCallback(async (
    chatId: string,
    messages: Message[],
    inactiveUser: Profile,
    activeUser: Profile,
    options?: Partial<typeof settings>
  ) => {
    setSimulating(true);
    setError(null);

    // 合併選項
    const mergedOptions = {
      ...settings,
      ...options
    };

    try {
      const result = await simulateUserReply(chatId, messages, inactiveUser, activeUser, mergedOptions);
      return result;
    } catch (err: any) {
      setError(err.message || 'Failed to simulate reply');
      return null;
    } finally {
      setSimulating(false);
    }
  }, [settings]);

  const checkInactiveUsers = useCallback((
    messages: Message[],
    userId: string,
    inactivityThreshold?: number
  ) => {
    return isUserInactive(messages, userId, inactivityThreshold || settings.inactivityThreshold);
  }, [settings.inactivityThreshold]);

  const autoSimulateReplies = useCallback(async (
    chatId: string,
    messages: Message[],
    participants: Profile[],
    currentUser: Profile,
    options?: Partial<typeof settings>
  ) => {
    setSimulating(true);
    setError(null);

    // 合併選項
    const mergedOptions = {
      ...settings,
      ...options
    };

    try {
      const result = await autoSimulateInactiveUsers(chatId, messages, participants, currentUser, mergedOptions);
      return result;
    } catch (err: any) {
      setError(err.message || 'Failed to auto-simulate replies');
      return null;
    } finally {
      setSimulating(false);
    }
  }, [settings]);

  const updateSettings = useCallback((newSettings: Partial<typeof settings>) => {
    setSettings(prev => ({
      ...prev,
      ...newSettings
    }));
  }, []);

  return {
    simulating,
    error,
    settings,
    simulateReply,
    checkInactiveUsers,
    autoSimulateReplies,
    updateSettings
  };
};

// 使用 AI 機器人的 Hook
export const useAIBot = () => {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processMessage = useCallback(async (
    chatId: string,
    bot: any,
    messages: Message[],
    currentUser: Profile
  ) => {
    setProcessing(true);
    setError(null);

    try {
      const result = await processBotMessage(chatId, bot, messages, currentUser);
      return result;
    } catch (err: any) {
      setError(err.message || 'Failed to process bot message');
      return null;
    } finally {
      setProcessing(false);
    }
  }, []);

  const createDefaultConfig = useCallback((botType: BotType) => {
    return createDefaultBotConfiguration(botType);
  }, []);

  return {
    processing,
    error,
    processMessage,
    createDefaultConfig
  };
};

// 使用 AI 服務的 Hook
export const useAIService = () => {
  const [availableServices, setAvailableServices] = useState<AIServiceType[]>([]);
  const [defaultService, setDefaultService] = useState<AIServiceType | null>(null);

  const refreshServices = useCallback(() => {
    setAvailableServices(getAvailableAIServiceTypes());
    setDefaultService(getDefaultAIServiceType());
  }, []);

  // 初始化
  useState(() => {
    refreshServices();
  });

  return {
    availableServices,
    defaultService,
    refreshServices
  };
};
