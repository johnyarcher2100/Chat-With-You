'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtime } from '@/contexts/RealtimeContext';
import { getRecentChats } from '@/lib/supabase-client-extended';
import { createChat } from '@/lib/supabase-client-extended';
import { getFriendsWithProfiles } from '@/lib/supabase-client-extended';
import { Chat, Profile } from '@/types/supabase';
import { Button } from '@/components/ui/button';
import { FaPlus, FaSearch } from 'react-icons/fa';

export default function ChatListPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { 
    onNewMessage, 
    onNewChat,
    removeMessageHandler,
    removeNewChatHandler
  } = useRealtime();
  
  const [chats, setChats] = useState<Array<Chat & { last_message?: any, participants: Profile[] }>>([]);
  const [friends, setFriends] = useState<Array<any>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  
  // 加載聊天列表
  const loadChats = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // 獲取最近的聊天
      const recentChats = await getRecentChats(user.id);
      setChats(recentChats);
      
      // 獲取好友列表
      const friendsData = await getFriendsWithProfiles(user.id);
      setFriends(friendsData);
    } catch (err: any) {
      setError(err.message || '加載聊天列表時出錯');
    } finally {
      setLoading(false);
    }
  }, [user]);
  
  // 處理新消息
  const handleNewMessage = useCallback((message: any) => {
    setChats(prev => {
      // 找到對應的聊天
      const chatIndex = prev.findIndex(chat => chat.id === message.chat_id);
      
      if (chatIndex === -1) return prev;
      
      // 創建新的聊天列表
      const newChats = [...prev];
      
      // 更新最後一條消息
      newChats[chatIndex] = {
        ...newChats[chatIndex],
        last_message: message,
        updated_at: message.created_at
      };
      
      // 按更新時間排序
      return newChats.sort((a, b) => 
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
    });
  }, []);
  
  // 處理新聊天
  const handleNewChat = useCallback((chat: Chat) => {
    loadChats(); // 重新加載聊天列表
  }, [loadChats]);
  
  // 創建新聊天
  const handleCreateChat = async (friendId: string) => {
    if (!user) return;
    
    try {
      // 創建聊天
      const newChat = await createChat(
        null, // 沒有名稱
        false, // 不是群聊
        [user.id, friendId] // 參與者
      );
      
      if (newChat) {
        // 導航到新聊天
        router.push(`/chat/${newChat.id}`);
      }
    } catch (err: any) {
      setError(err.message || '創建聊天時出錯');
    } finally {
      setShowNewChatModal(false);
    }
  };
  
  // 初始化
  useEffect(() => {
    loadChats();
  }, [loadChats]);
  
  // 訂閱新消息和新聊天
  useEffect(() => {
    onNewMessage(handleNewMessage);
    onNewChat(handleNewChat);
    
    return () => {
      removeMessageHandler(handleNewMessage);
      removeNewChatHandler(handleNewChat);
    };
  }, [onNewMessage, onNewChat, removeMessageHandler, removeNewChatHandler, handleNewMessage, handleNewChat]);
  
  // 獲取聊天名稱
  const getChatName = (chat: any) => {
    if (chat.name) return chat.name;
    
    // 對於一對一聊天，顯示對方的名稱
    const otherParticipants = chat.participants.filter((p: Profile) => p.id !== user?.id);
    return otherParticipants.map((p: Profile) => p.username || p.full_name).join(', ') || '未命名聊天';
  };
  
  // 獲取聊天頭像
  const getChatAvatar = (chat: any) => {
    // 對於一對一聊天，顯示對方的頭像
    if (!chat.is_group) {
      const otherParticipant = chat.participants.find((p: Profile) => p.id !== user?.id);
      if (otherParticipant) {
        return otherParticipant.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(otherParticipant.username || otherParticipant.full_name || 'User')}&background=random`;
      }
    }
    
    // 對於群聊，顯示默認頭像
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(chat.name || 'Group')}&background=random`;
  };
  
  // 獲取最後一條消息的預覽
  const getLastMessagePreview = (chat: any) => {
    if (!chat.last_message) return '沒有消息';
    
    if (chat.last_message.media_url) {
      return '[圖片]';
    }
    
    return chat.last_message.content || '';
  };
  
  // 獲取最後一條消息的時間
  const getLastMessageTime = (chat: any) => {
    if (!chat.last_message) return '';
    
    return formatDistanceToNow(new Date(chat.last_message.created_at), {
      addSuffix: true,
      locale: zhTW
    });
  };
  
  // 加載中
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
          <p className="mt-2 text-gray-500">載入中...</p>
        </div>
      </div>
    );
  }
  
  // 錯誤
  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-red-500">{error}</p>
          <Button className="mt-4" onClick={loadChats}>重試</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* 頁面標題 */}
      <div className="border-b bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">聊天</h1>
          <Button
            variant="outline"
            size="icon"
            className="rounded-full"
            onClick={() => setShowNewChatModal(true)}
          >
            <FaPlus className="h-5 w-5" />
          </Button>
        </div>
        
        {/* 搜索框 */}
        <div className="mt-4 flex items-center rounded-full border bg-gray-50 px-3 py-2">
          <FaSearch className="mr-2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索聊天..."
            className="w-full bg-transparent focus:outline-none"
          />
        </div>
      </div>
      
      {/* 聊天列表 */}
      <div className="flex-1 overflow-y-auto">
        {chats.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center p-4">
            <p className="mb-4 text-center text-gray-500">沒有聊天記錄</p>
            <Button onClick={() => setShowNewChatModal(true)}>
              開始新聊天
            </Button>
          </div>
        ) : (
          <ul className="divide-y">
            {chats.map(chat => (
              <li key={chat.id}>
                <Link href={`/chat/${chat.id}`} className="block hover:bg-gray-50">
                  <div className="flex items-center p-4">
                    {/* 聊天頭像 */}
                    <div className="mr-4 h-12 w-12 flex-shrink-0">
                      <Image
                        src={getChatAvatar(chat)}
                        alt={getChatName(chat)}
                        width={48}
                        height={48}
                        className="rounded-full"
                      />
                    </div>
                    
                    {/* 聊天信息 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h2 className="truncate text-lg font-medium">{getChatName(chat)}</h2>
                        <span className="text-xs text-gray-500">{getLastMessageTime(chat)}</span>
                      </div>
                      <p className="truncate text-sm text-gray-500">{getLastMessagePreview(chat)}</p>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
      
      {/* 新聊天模態框 */}
      {showNewChatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-xl font-bold">開始新聊天</h2>
            
            {friends.length === 0 ? (
              <p className="text-center text-gray-500">沒有好友</p>
            ) : (
              <ul className="max-h-80 divide-y overflow-y-auto">
                {friends.map(friend => (
                  <li key={friend.id} className="py-2">
                    <button
                      className="flex w-full items-center rounded-lg p-2 hover:bg-gray-100"
                      onClick={() => handleCreateChat(friend.profile.id)}
                    >
                      <div className="mr-3 h-10 w-10">
                        <Image
                          src={friend.profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(friend.profile.username || friend.profile.full_name || 'User')}&background=random`}
                          alt={friend.profile.username || friend.profile.full_name || 'User'}
                          width={40}
                          height={40}
                          className="rounded-full"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">
                          {friend.profile.username || friend.profile.full_name || 'User'}
                        </h3>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            
            <div className="mt-6 flex justify-end">
              <Button
                variant="outline"
                onClick={() => setShowNewChatModal(false)}
                className="mr-2"
              >
                取消
              </Button>
              <Button onClick={() => router.push('/friends')}>
                管理好友
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
