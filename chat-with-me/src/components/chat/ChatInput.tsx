'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useOffline } from '@/contexts/OfflineContext';
import { useFileUpload } from '@/hooks/useFileUpload';
import { sendMessage } from '@/lib/supabase-client';
import { saveOfflineMessage } from '@/lib/offline-storage';
import { Button } from '@/components/ui/button';
import { Suggestion } from '@/services/ai/suggestions';

// 圖標
import { FaPaperPlane, FaImage, FaSmile } from 'react-icons/fa';

interface ChatInputProps {
  chatId: string;
  suggestions?: Suggestion[];
  onSendMessage?: () => void;
  onClearSuggestions?: () => void;
}

export default function ChatInput({
  chatId,
  suggestions = [],
  onSendMessage,
  onClearSuggestions
}: ChatInputProps) {
  const { user } = useAuth();
  const { online } = useOffline();
  const { uploadChatImage, uploading, progress } = useFileUpload();
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 自動調整文本區域高度
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [message]);

  // 處理發送消息
  const handleSendMessage = async () => {
    if (!user || !message.trim() || isSending) return;

    try {
      setIsSending(true);

      if (online) {
        // 在線模式：直接發送消息
        await sendMessage(chatId, user.id, message.trim());
      } else {
        // 離線模式：保存到本地存儲
        await saveOfflineMessage(chatId, user.id, message.trim());
      }

      // 清空輸入框
      setMessage('');

      // 清除建議
      if (onClearSuggestions) {
        onClearSuggestions();
      }

      // 通知父組件
      if (onSendMessage) {
        onSendMessage();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  // 處理按鍵事件
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // 按 Enter 鍵發送消息（不按 Shift 鍵）
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 處理文件選擇
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];

    // 檢查文件類型
    if (!file.type.startsWith('image/')) {
      alert('只能上傳圖片文件');
      return;
    }

    try {
      if (online) {
        // 在線模式：上傳圖片並發送消息
        const result = await uploadChatImage(file, chatId, (progress) => {
          setUploadProgress(progress);
        });

        if (result) {
          // 發送圖片消息
          await sendMessage(chatId, user.id, `[圖片]`, false, result.secureUrl);

          // 通知父組件
          if (onSendMessage) {
            onSendMessage();
          }
        }
      } else {
        // 離線模式：暫時不支援圖片上傳
        alert('離線模式下無法上傳圖片，請稍後再試。');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      // 重置文件輸入
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 處理建議點擊
  const handleSuggestionClick = (suggestion: string) => {
    setMessage(suggestion);

    // 聚焦文本區域
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  return (
    <div className="border-t bg-white p-4">
      {/* 建議區域 */}
      {suggestions.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {suggestions.map((suggestion, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              className="text-sm"
              onClick={() => handleSuggestionClick(suggestion.text)}
            >
              {suggestion.text}
            </Button>
          ))}
        </div>
      )}

      {/* 輸入區域 */}
      <div className="flex items-end gap-2">
        {/* 圖片上傳按鈕 */}
        <div className="relative">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-10 w-10 shrink-0 rounded-full"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <FaImage className="h-5 w-5 text-gray-500" />
          </Button>

          {uploading && (
            <div className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-white">
              {Math.round(uploadProgress)}%
            </div>
          )}
        </div>

        {/* 隱藏的文件輸入 */}
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleFileSelect}
        />

        {/* 表情按鈕（未實現） */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-10 w-10 shrink-0 rounded-full"
        >
          <FaSmile className="h-5 w-5 text-gray-500" />
        </Button>

        {/* 消息輸入框 */}
        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="輸入消息..."
            className="w-full resize-none rounded-lg border border-gray-300 bg-white px-4 py-2 pr-10 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            rows={1}
            style={{ maxHeight: '150px' }}
          />
        </div>

        {/* 發送按鈕 */}
        <Button
          type="button"
          variant="primary"
          size="icon"
          className="h-10 w-10 shrink-0 rounded-full bg-primary text-white"
          onClick={handleSendMessage}
          disabled={!message.trim() || isSending}
        >
          <FaPaperPlane className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
