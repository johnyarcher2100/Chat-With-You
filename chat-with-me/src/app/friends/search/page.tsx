'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { searchUsers, getFriendStatus, sendFriendRequest } from '@/lib/supabase-client-extended';
import { Profile, Friend } from '@/types/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FaSearch, FaArrowLeft, FaUserPlus, FaUserCheck, FaUserClock, FaUserTimes } from 'react-icons/fa';

export default function FriendSearchPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<Profile & { friendStatus?: Friend | null }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 處理搜索
  const handleSearch = useCallback(async () => {
    if (!user || !searchQuery.trim()) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // 搜索用戶
      const results = await searchUsers(searchQuery, user.id);
      
      // 獲取每個用戶的好友狀態
      const resultsWithStatus = await Promise.all(
        results.map(async (profile) => {
          const status = await getFriendStatus(user.id, profile.id);
          return {
            ...profile,
            friendStatus: status
          };
        })
      );
      
      setSearchResults(resultsWithStatus);
    } catch (err: any) {
      setError(err.message || '搜索用戶時出錯');
    } finally {
      setLoading(false);
    }
  }, [user, searchQuery]);
  
  // 處理發送好友請求
  const handleSendFriendRequest = async (friendId: string) => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // 發送好友請求
      await sendFriendRequest(user.id, friendId);
      
      // 更新搜索結果中的好友狀態
      setSearchResults(prev => 
        prev.map(profile => {
          if (profile.id === friendId) {
            return {
              ...profile,
              friendStatus: {
                id: 'pending', // 臨時 ID，實際上會由服務器生成
                user_id: user.id,
                friend_id: friendId,
                status: 'pending',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }
            };
          }
          return profile;
        })
      );
    } catch (err: any) {
      setError(err.message || '發送好友請求時出錯');
    } finally {
      setLoading(false);
    }
  };
  
  // 獲取好友狀態顯示
  const getFriendStatusDisplay = (profile: Profile & { friendStatus?: Friend | null }) => {
    if (!profile.friendStatus) {
      return (
        <Button
          variant="default"
          size="sm"
          onClick={() => handleSendFriendRequest(profile.id)}
          disabled={loading}
        >
          <FaUserPlus className="mr-2 h-4 w-4" />
          添加好友
        </Button>
      );
    }
    
    switch (profile.friendStatus.status) {
      case 'accepted':
        return (
          <Button
            variant="outline"
            size="sm"
            disabled
          >
            <FaUserCheck className="mr-2 h-4 w-4 text-green-500" />
            已是好友
          </Button>
        );
      case 'pending':
        // 檢查是誰發送的請求
        if (profile.friendStatus.user_id === user?.id) {
          return (
            <Button
              variant="outline"
              size="sm"
              disabled
            >
              <FaUserClock className="mr-2 h-4 w-4 text-yellow-500" />
              請求已發送
            </Button>
          );
        } else {
          return (
            <Button
              variant="outline"
              size="sm"
              disabled
            >
              <FaUserClock className="mr-2 h-4 w-4 text-blue-500" />
              等待接受
            </Button>
          );
        }
      case 'rejected':
      case 'blocked':
        return (
          <Button
            variant="outline"
            size="sm"
            disabled
          >
            <FaUserTimes className="mr-2 h-4 w-4 text-red-500" />
            已拒絕/已阻止
          </Button>
        );
      default:
        return null;
    }
  };
  
  // 如果用戶未登錄，重定向到登錄頁面
  if (!user) {
    router.push('/login');
    return null;
  }
  
  return (
    <div className="container mx-auto p-4">
      <div className="mb-6 flex items-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/friends')}
          className="mr-2"
        >
          <FaArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">搜索好友</h1>
      </div>
      
      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}
      
      <div className="mb-6 flex items-center space-x-2">
        <Input
          type="text"
          placeholder="搜索用戶名或全名"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSearch();
            }
          }}
          className="flex-1"
        />
        <Button
          onClick={handleSearch}
          disabled={loading || !searchQuery.trim()}
        >
          <FaSearch className="mr-2 h-4 w-4" />
          搜索
        </Button>
      </div>
      
      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <p className="text-gray-500">搜索中...</p>
        </div>
      ) : searchResults.length === 0 ? (
        searchQuery.trim() ? (
          <div className="flex h-40 items-center justify-center">
            <p className="text-gray-500">沒有找到匹配的用戶</p>
          </div>
        ) : (
          <div className="flex h-40 items-center justify-center">
            <p className="text-gray-500">輸入用戶名或全名進行搜索</p>
          </div>
        )
      ) : (
        <ul className="divide-y rounded-lg border">
          {searchResults.map(profile => (
            <li key={profile.id} className="flex items-center justify-between p-4">
              <div className="flex items-center">
                <Image
                  src={profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.username || profile.full_name || 'User')}&background=random`}
                  alt={profile.username || profile.full_name || 'User'}
                  width={48}
                  height={48}
                  className="rounded-full"
                />
                <div className="ml-4">
                  <h3 className="font-medium">
                    {profile.username || profile.full_name || 'User'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {profile.username ? `@${profile.username}` : ''}
                  </p>
                </div>
              </div>
              
              <div>
                {getFriendStatusDisplay(profile)}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
