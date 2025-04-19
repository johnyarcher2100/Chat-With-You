'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { getProfile } from '@/lib/supabase-client';
import { getFriendStatus, sendFriendRequest } from '@/lib/supabase-client-extended';
import { Profile, Friend } from '@/types/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FaArrowLeft, FaUserPlus, FaUserCheck, FaUserClock, FaUserTimes, FaComment } from 'react-icons/fa';

export default function UserProfilePage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [friendStatus, setFriendStatus] = useState<Friend | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 加載用戶資料和好友狀態
  useEffect(() => {
    const loadData = async () => {
      if (!user || !id) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // 獲取用戶資料
        const userProfile = await getProfile(id);
        setProfile(userProfile);
        
        // 獲取好友狀態
        const status = await getFriendStatus(user.id, id);
        setFriendStatus(status);
      } catch (err: any) {
        setError(err.message || '加載用戶資料時出錯');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [user, id]);
  
  // 處理發送好友請求
  const handleSendFriendRequest = async () => {
    if (!user || !profile) return;
    
    try {
      setActionLoading(true);
      
      // 發送好友請求
      const result = await sendFriendRequest(user.id, profile.id);
      
      if (result) {
        setFriendStatus(result);
      }
    } catch (err: any) {
      setError(err.message || '發送好友請求時出錯');
    } finally {
      setActionLoading(false);
    }
  };
  
  // 處理開始聊天
  const handleStartChat = () => {
    if (!profile) return;
    
    // 導航到聊天頁面，並傳遞好友 ID
    router.push(`/chat?friend=${profile.id}`);
  };
  
  // 獲取好友狀態顯示
  const getFriendStatusDisplay = () => {
    if (!friendStatus) {
      return (
        <Button
          variant="default"
          onClick={handleSendFriendRequest}
          disabled={actionLoading}
          className="w-full"
        >
          <FaUserPlus className="mr-2 h-4 w-4" />
          添加好友
        </Button>
      );
    }
    
    switch (friendStatus.status) {
      case 'accepted':
        return (
          <div className="flex w-full space-x-2">
            <Button
              variant="outline"
              disabled
              className="flex-1"
            >
              <FaUserCheck className="mr-2 h-4 w-4 text-green-500" />
              已是好友
            </Button>
            <Button
              variant="default"
              onClick={handleStartChat}
              className="flex-1"
            >
              <FaComment className="mr-2 h-4 w-4" />
              發送消息
            </Button>
          </div>
        );
      case 'pending':
        // 檢查是誰發送的請求
        if (friendStatus.user_id === user?.id) {
          return (
            <Button
              variant="outline"
              disabled
              className="w-full"
            >
              <FaUserClock className="mr-2 h-4 w-4 text-yellow-500" />
              請求已發送
            </Button>
          );
        } else {
          return (
            <div className="flex w-full space-x-2">
              <Button
                variant="outline"
                className="flex-1"
              >
                <FaUserTimes className="mr-2 h-4 w-4 text-red-500" />
                拒絕
              </Button>
              <Button
                variant="default"
                className="flex-1"
              >
                <FaUserCheck className="mr-2 h-4 w-4" />
                接受
              </Button>
            </div>
          );
        }
      case 'rejected':
      case 'blocked':
        return (
          <Button
            variant="outline"
            disabled
            className="w-full"
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
          onClick={() => router.back()}
          className="mr-2"
        >
          <FaArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">用戶資料</h1>
      </div>
      
      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <p className="text-gray-500">加載中...</p>
        </div>
      ) : !profile ? (
        <div className="flex h-40 items-center justify-center">
          <p className="text-gray-500">找不到用戶</p>
        </div>
      ) : (
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center">
              <div className="mb-4">
                <Image
                  src={profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.username || profile.full_name || 'User')}&background=random`}
                  alt={profile.username || profile.full_name || 'User'}
                  width={100}
                  height={100}
                  className="rounded-full"
                />
              </div>
              
              <h2 className="mb-1 text-xl font-bold">
                {profile.full_name || 'User'}
              </h2>
              
              {profile.username && (
                <p className="mb-4 text-gray-500">
                  @{profile.username}
                </p>
              )}
              
              <div className="mt-6 w-full">
                {getFriendStatusDisplay()}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
