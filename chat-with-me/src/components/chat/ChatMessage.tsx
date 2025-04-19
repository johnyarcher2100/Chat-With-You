'use client';

import { useState } from 'react';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { Message, Profile } from '@/types/supabase';
import { CldImage } from 'next-cloudinary';

interface ChatMessageProps {
  message: Message;
  sender: Profile | null;
  isCurrentUser: boolean;
  showAvatar?: boolean;
}

export default function ChatMessage({
  message,
  sender,
  isCurrentUser,
  showAvatar = true
}: ChatMessageProps) {
  const [imageError, setImageError] = useState(false);

  // 格式化時間
  const formattedTime = formatDistanceToNow(new Date(message.created_at), {
    addSuffix: true,
    locale: zhTW
  });

  // 檢查是否為圖片消息
  const isImageMessage = message.media_url && !imageError;

  // 獲取發送者名稱
  const senderName = sender?.username || sender?.full_name || '未知用戶';

  // 獲取發送者頭像
  const avatarUrl = sender?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(senderName)}&background=random`;

  // 處理圖片加載錯誤
  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-4`}>
      {/* 頭像（非當前用戶） */}
      {!isCurrentUser && showAvatar && (
        <div className="mr-3 h-8 w-8 flex-shrink-0">
          <Image
            src={avatarUrl}
            alt={senderName}
            width={32}
            height={32}
            className="rounded-full"
          />
        </div>
      )}

      <div className={`max-w-[70%] ${isCurrentUser ? 'order-1' : 'order-2'}`}>
        {/* 發送者名稱（非當前用戶） */}
        {!isCurrentUser && (
          <div className="mb-1 text-xs text-gray-500">{senderName}</div>
        )}

        {/* 消息內容 */}
        <div className={`rounded-lg p-3 ${
          isCurrentUser
            ? 'bg-primary text-white'
            : 'bg-gray-100 text-gray-800'
        }`}>
          {isImageMessage ? (
            // 圖片消息
            <div className="overflow-hidden rounded">
              {message.media_url?.includes('cloudinary') ? (
                // Cloudinary 圖片
                <CldImage
                  src={message.media_url.split('/upload/')[1]}
                  alt="Shared image"
                  width={300}
                  height={200}
                  crop="limit"
                  className="max-h-[300px] w-auto object-contain"
                  onError={handleImageError}
                />
              ) : (
                // 一般圖片
                <Image
                  src={message.media_url!}
                  alt="Shared image"
                  width={300}
                  height={200}
                  className="max-h-[300px] w-auto object-contain"
                  onError={handleImageError}
                />
              )}
            </div>
          ) : (
            // 文本消息
            <div className="whitespace-pre-wrap break-words">{message.content}</div>
          )}
        </div>

        {/* 時間和狀態 */}
        <div className={`mt-1 flex text-xs text-gray-500 ${
          isCurrentUser ? 'justify-end' : 'justify-start'
        }`}>
          <span>{formattedTime}</span>
          {message.is_ai_generated && (
            <span className="ml-2 rounded bg-purple-100 px-1 text-purple-700">AI</span>
          )}
        </div>
      </div>

      {/* 頭像（當前用戶） */}
      {isCurrentUser && showAvatar && (
        <div className="ml-3 h-8 w-8 flex-shrink-0">
          <Image
            src={avatarUrl}
            alt={senderName}
            width={32}
            height={32}
            className="rounded-full"
          />
        </div>
      )}
    </div>
  );
}
