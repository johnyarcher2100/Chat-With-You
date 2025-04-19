'use client';

import { useRef, useEffect } from 'react';
import { Message, Profile } from '@/types/supabase';
import ChatMessage from './ChatMessage';

interface ChatMessageListProps {
  messages: Message[];
  participants: Record<string, Profile>;
  currentUserId: string;
}

export default function ChatMessageList({ 
  messages, 
  participants, 
  currentUserId 
}: ChatMessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // 滾動到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // 當消息變化時滾動到底部
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // 按時間排序消息
  const sortedMessages = [...messages].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  
  // 分組消息（同一用戶連續發送的消息）
  const groupedMessages: Array<{
    message: Message;
    showAvatar: boolean;
  }> = [];
  
  sortedMessages.forEach((message, index) => {
    const prevMessage = index > 0 ? sortedMessages[index - 1] : null;
    const showAvatar = !prevMessage || prevMessage.user_id !== message.user_id;
    
    groupedMessages.push({
      message,
      showAvatar
    });
  });

  return (
    <div className="flex-1 overflow-y-auto p-4">
      {groupedMessages.map(({ message, showAvatar }) => (
        <ChatMessage
          key={message.id}
          message={message}
          sender={participants[message.user_id] || null}
          isCurrentUser={message.user_id === currentUserId}
          showAvatar={showAvatar}
        />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}
