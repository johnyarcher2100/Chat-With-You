'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtime } from '@/contexts/RealtimeContext';
import { supabase } from '@/lib/supabase';
import { getFriendsWithProfiles, getFriendRequests, updateFriendStatus } from '@/lib/supabase-client-extended';
import { Friend, Profile } from '@/types/supabase';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { FaUserPlus, FaQrcode, FaSearch, FaUserFriends, FaUserClock } from 'react-icons/fa';

export default function FriendsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { subscribeToFriendRequests, unsubscribeFromFriendRequests } = useRealtime();

  const [friends, setFriends] = useState<Array<Friend & { profile: Profile }>>([]);
  const [friendRequests, setFriendRequests] = useState<Array<Friend & { profile: Profile }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 加載好友列表和好友請求
  const loadFriendsData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // 獲取好友列表
      const friendsData = await getFriendsWithProfiles(user.id);
      setFriends(friendsData);

      // 獲取好友請求
      const requests = await getFriendRequests(user.id);

      // 獲取請求者的配置文件
      const requestsWithProfiles = await Promise.all(
        requests.map(async (request) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', request.user_id)
            .single();

          return {
            ...request,
            profile
          };
        })
      );

      setFriendRequests(requestsWithProfiles);
    } catch (err: any) {
      setError(err.message || '加載好友數據時出錯');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // 處理好友請求更新
  const handleFriendRequestUpdate = useCallback((payload: any) => {
    if (payload.eventType === 'INSERT') {
      // 新的好友請求
      const newRequest = payload.new;

      // 獲取請求者的配置文件
      supabase
        .from('profiles')
        .select('*')
        .eq('id', newRequest.user_id)
        .single()
        .then(({ data: profile }) => {
          setFriendRequests(prev => [
            ...prev,
            {
              ...newRequest,
              profile
            }
          ]);
        });
    } else if (payload.eventType === 'UPDATE') {
      // 更新好友請求狀態
      const updatedRequest = payload.new;

      if (updatedRequest.status === 'accepted') {
        // 如果請求被接受，重新加載好友列表
        loadFriendsData();

        // 從請求列表中移除
        setFriendRequests(prev =>
          prev.filter(request => request.id !== updatedRequest.id)
        );
      } else if (updatedRequest.status === 'rejected' || updatedRequest.status === 'blocked') {
        // 從請求列表中移除
        setFriendRequests(prev =>
          prev.filter(request => request.id !== updatedRequest.id)
        );
      }
    }
  }, [loadFriendsData]);

  // 處理接受好友請求
  const handleAcceptFriendRequest = async (requestId: string) => {
    try {
      await updateFriendStatus(requestId, 'accepted');
      // 實時更新會處理 UI 更新
    } catch (err: any) {
      setError(err.message || '接受好友請求時出錯');
    }
  };

  // 處理拒絕好友請求
  const handleRejectFriendRequest = async (requestId: string) => {
    try {
      await updateFriendStatus(requestId, 'rejected');
      // 實時更新會處理 UI 更新
    } catch (err: any) {
      setError(err.message || '拒絕好友請求時出錯');
    }
  };

  // 初始化
  useEffect(() => {
    if (user) {
      loadFriendsData();

      // 訂閱好友請求更新
      const subscription = subscribeToFriendRequests(user.id, handleFriendRequestUpdate);

      return () => {
        unsubscribeFromFriendRequests(subscription);
      };
    }
  }, [user, loadFriendsData, subscribeToFriendRequests, unsubscribeFromFriendRequests, handleFriendRequestUpdate]);

  // 如果用戶未登錄，重定向到登錄頁面
  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">好友管理</h1>

        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/friends/search')}
          >
            <FaSearch className="mr-2 h-4 w-4" />
            搜索好友
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/friends/qrcode')}
          >
            <FaQrcode className="mr-2 h-4 w-4" />
            我的 QR 碼
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <Tabs defaultValue="friends">
        <TabsList className="mb-4 grid w-full grid-cols-2">
          <TabsTrigger value="friends" className="flex items-center">
            <FaUserFriends className="mr-2 h-4 w-4" />
            好友列表
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex items-center">
            <FaUserClock className="mr-2 h-4 w-4" />
            好友請求
            {friendRequests.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {friendRequests.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="friends">
          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <p className="text-gray-500">加載中...</p>
            </div>
          ) : friends.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center">
              <p className="mb-4 text-gray-500">您還沒有好友</p>
              <Button onClick={() => router.push('/friends/search')}>
                <FaUserPlus className="mr-2 h-4 w-4" />
                添加好友
              </Button>
            </div>
          ) : (
            <ul className="divide-y rounded-lg border">
              {friends.map(friend => (
                <li key={friend.id} className="flex items-center justify-between p-4">
                  <div className="flex items-center">
                    <Image
                      src={friend.profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(friend.profile.username || friend.profile.full_name || 'User')}&background=random`}
                      alt={friend.profile.username || friend.profile.full_name || 'User'}
                      width={48}
                      height={48}
                      className="rounded-full"
                    />
                    <div className="ml-4">
                      <h3 className="font-medium">
                        {friend.profile.username || friend.profile.full_name || 'User'}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {friend.profile.username ? `@${friend.profile.username}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // 創建或打開與該好友的聊天
                        router.push(`/chat?friend=${friend.profile.id}`);
                      }}
                    >
                      發送消息
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="requests">
          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <p className="text-gray-500">加載中...</p>
            </div>
          ) : friendRequests.length === 0 ? (
            <div className="flex h-40 items-center justify-center">
              <p className="text-gray-500">沒有待處理的好友請求</p>
            </div>
          ) : (
            <ul className="divide-y rounded-lg border">
              {friendRequests.map(request => (
                <li key={request.id} className="flex items-center justify-between p-4">
                  <div className="flex items-center">
                    <Image
                      src={request.profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(request.profile.username || request.profile.full_name || 'User')}&background=random`}
                      alt={request.profile.username || request.profile.full_name || 'User'}
                      width={48}
                      height={48}
                      className="rounded-full"
                    />
                    <div className="ml-4">
                      <h3 className="font-medium">
                        {request.profile.username || request.profile.full_name || 'User'}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {request.profile.username ? `@${request.profile.username}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRejectFriendRequest(request.id)}
                    >
                      拒絕
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleAcceptFriendRequest(request.id)}
                    >
                      接受
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
