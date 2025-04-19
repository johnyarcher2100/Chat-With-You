'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { BotType, processBotMessage } from '@/services/ai/bots';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FaArrowLeft, FaPaperPlane, FaRobot, FaUser } from 'react-icons/fa';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

interface Message {
  id: string;
  role: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

export default function BotChatPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  
  const [botName, setBotName] = useState('AI 機器人');
  const [botType, setBotType] = useState<BotType>(BotType.KNOWLEDGE);
  const [botConfig, setBotConfig] = useState<any>({});
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // 加載機器人信息
  useEffect(() => {
    const loadBot = async () => {
      if (!user || !id) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // 獲取機器人信息
        const { data, error: fetchError } = await supabase
          .from('ai_bots')
          .select('*')
          .eq('id', id)
          .eq('owner_id', user.id)
          .single();
        
        if (fetchError) {
          throw fetchError;
        }
        
        if (!data) {
          throw new Error('找不到機器人');
        }
        
        // 設置機器人信息
        setBotName(data.name);
        setBotType(data.bot_type as BotType);
        setBotConfig(data.configuration || {});
        
        // 添加歡迎消息
        setMessages([
          {
            id: 'welcome',
            role: 'bot',
            content: `您好！我是${data.name}，有什麼可以幫助您的嗎？`,
            timestamp: new Date()
          }
        ]);
      } catch (err: any) {
        setError(err.message || '加載機器人信息時出錯');
      } finally {
        setLoading(false);
      }
    };
    
    loadBot();
  }, [user, id]);
  
  // 滾動到最新消息
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // 處理發送消息
  const handleSendMessage = async () => {
    if (!input.trim() || sending) return;
    
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setSending(true);
    
    try {
      // 處理機器人回覆
      const botResponse = await processBotMessage(
        input,
        botType,
        botConfig,
        messages.map(m => ({ role: m.role, content: m.content }))
      );
      
      const botMessage: Message = {
        id: `bot-${Date.now()}`,
        role: 'bot',
        content: botResponse,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botMessage]);
    } catch (err: any) {
      setError(err.message || '處理機器人回覆時出錯');
      
      // 添加錯誤消息
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'bot',
        content: '抱歉，我無法處理您的請求。請稍後再試。',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setSending(false);
    }
  };
  
  return (
    <ProtectedRoute>
      <div className="flex h-screen flex-col">
        {/* 頭部 */}
        <div className="border-b bg-white p-4 shadow-sm">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/robots')}
              className="mr-2"
            >
              <FaArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold">{botName}</h1>
              <p className="text-sm text-gray-500">
                {botType === BotType.KNOWLEDGE && '知識型機器人'}
                {botType === BotType.ORDER && '訂單型機器人'}
                {botType === BotType.CUSTOM && '自定義型機器人'}
              </p>
            </div>
          </div>
        </div>
        
        {/* 消息列表 */}
        <div className="flex-1 overflow-y-auto bg-gray-50 p-4">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-gray-500">加載中...</p>
            </div>
          ) : error ? (
            <div className="flex h-full items-center justify-center">
              <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map(message => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-primary text-white'
                        : 'bg-white text-gray-800 shadow'
                    }`}
                  >
                    <div className="mb-1 flex items-center">
                      {message.role === 'bot' ? (
                        <FaRobot className="mr-2 h-4 w-4" />
                      ) : (
                        <FaUser className="mr-2 h-4 w-4" />
                      )}
                      <span className="text-sm font-semibold">
                        {message.role === 'bot' ? botName : '您'}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    <p className="mt-1 text-right text-xs opacity-70">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
        
        {/* 輸入框 */}
        <div className="border-t bg-white p-4">
          <div className="flex items-center space-x-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="輸入消息..."
              disabled={loading || sending}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={loading || sending || !input.trim()}
            >
              <FaPaperPlane className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
