'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtime } from '@/contexts/RealtimeContext';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification, getProfile } from '@/lib/supabase-client-extended';
import { Notification, Profile } from '@/types/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FaArrowLeft, FaCheck, FaTrash, FaUserPlus, FaUserCheck, FaComment } from 'react-icons/fa';

export default function NotificationsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { subscribeToNotifications, unsubscribeFromNotifications } = useRealtime();
  
  const [notifications, setNotifications] = useState<Array<Notification & { profile?: Profile }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 加載通知
  const loadNotifications = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // 獲取通知
      const notificationsData = await getNotifications(user.id);
      
      // 獲取相關用戶的資料
      const notificationsWithProfiles = await Promise.all(
        notificationsData.map(async (notification) => {
          if (notification.type === 'friend_request' || notification.type === 'friend_accepted') {
            const userId = notification.content.user_id;
            try {
              const profile = await getProfile(userId);
              return {
                ...notification,
                profile
              };
            } catch (err) {
              console.error('Error fetching profile for notification:', err);
              return notification;
            }
          }
          return notification;
        })
      );
      
      setNotifications(notificationsWithProfiles);
    } catch (err: any) {
      setError(err.message || '加載通知時出錯');
    } finally {
      setLoading(false);
    }
  }, [user]);
  
  // 處理通知更新
  const handleNotificationUpdate = useCallback((payload: any) => {
    if (payload.eventType === 'INSERT') {
      // 新通知
      const newNotification = payload.new;
      
      // 獲取相關用戶的資料
      if (newNotification.type === 'friend_request' || newNotification.type === 'friend_accepted') {
        const userId = newNotification.content.user_id;
        getProfile(userId)
          .then(profile => {
            setNotifications(prev => [
              {
                ...newNotification,
                profile
              },
              ...prev
            ]);
          })
          .catch(err => {
            console.error('Error fetching profile for new notification:', err);
            setNotifications(prev => [newNotification, ...prev]);
          });
      } else {
        setNotifications(prev => [newNotification, ...prev]);
      }
    } else if (payload.eventType === 'UPDATE') {
      // 更新通知
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === payload.new.id ? { ...notification, ...payload.new } : notification
        )
      );
    } else if (payload.eventType === 'DELETE') {
      // 刪除通知
      setNotifications(prev => 
        prev.filter(notification => notification.id !== payload.old.id)
      );
    }
  }, []);
  
  // 處理標記為已讀
  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
      
      // 更新本地狀態
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId ? { ...notification, is_read: true } : notification
        )
      );
    } catch (err: any) {
      setError(err.message || '標記通知為已讀時出錯');
    }
  };
  
  // 處理標記所有為已讀
  const handleMarkAllAsRead = async () => {
    if (!user) return;
    
    try {
      await markAllNotificationsAsRead(user.id);
      
      // 更新本地狀態
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, is_read: true }))
      );
    } catch (err: any) {
      setError(err.message || '標記所有通知為已讀時出錯');
    }
  };
  
  // 處理刪除通知
  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await deleteNotification(notificationId);
      
      // 更新本地狀態
      setNotifications(prev => 
        prev.filter(notification => notification.id !== notificationId)
      );
    } catch (err: any) {
      setError(err.message || '刪除通知時出錯');
    }
  };
  
  // 處理通知點擊
  const handleNotificationClick = (notification: Notification & { profile?: Profile }) => {
    // 標記為已讀
    if (!notification.is_read) {
      handleMarkAsRead(notification.id);
    }
    
    // 根據通知類型導航
    switch (notification.type) {
      case 'friend_request':
        router.push('/friends');
        break;
      case 'friend_accepted':
        if (notification.profile) {
          router.push(`/friends/profile/${notification.profile.id}`);
        } else {
          router.push('/friends');
        }
        break;
      case 'message':
        const chatId = notification.content.chat_id;
        if (chatId) {
          router.push(`/chat/${chatId}`);
        }
        break;
      default:
        // 不做任何導航
        break;
    }
  };
  
  // 獲取通知內容
  const getNotificationContent = (notification: Notification & { profile?: Profile }) => {
    switch (notification.type) {
      case 'friend_request':
        return (
          <div className="flex items-center">
            {notification.profile && (
              <Image
                src={notification.profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(notification.profile.username || notification.profile.full_name || 'User')}&background=random`}
                alt={notification.profile.username || notification.profile.full_name || 'User'}
                width={40}
                height={40}
                className="mr-3 rounded-full"
              />
            )}
            <div>
              <p className="font-medium">
                {notification.profile ? (notification.profile.username || notification.profile.full_name) : '某用戶'} 向您發送了好友請求
              </p>
              <p className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: zhTW })}
              </p>
            </div>
            <div className="ml-auto flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push('/friends');
                }}
              >
                <FaUserPlus className="mr-1 h-3 w-3" />
                查看
              </Button>
            </div>
          </div>
        );
      case 'friend_accepted':
        return (
          <div className="flex items-center">
            {notification.profile && (
              <Image
                src={notification.profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(notification.profile.username || notification.profile.full_name || 'User')}&background=random`}
                alt={notification.profile.username || notification.profile.full_name || 'User'}
                width={40}
                height={40}
                className="mr-3 rounded-full"
              />
            )}
            <div>
              <p className="font-medium">
                {notification.profile ? (notification.profile.username || notification.profile.full_name) : '某用戶'} 接受了您的好友請求
              </p>
              <p className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: zhTW })}
              </p>
            </div>
            <div className="ml-auto flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  if (notification.profile) {
                    router.push(`/chat?friend=${notification.profile.id}`);
                  }
                }}
              >
                <FaComment className="mr-1 h-3 w-3" />
                發送消息
              </Button>
            </div>
          </div>
        );
      case 'message':
        return (
          <div className="flex items-center">
            <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white">
              <FaComment className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium">
                您有新的消息
              </p>
              <p className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: zhTW })}
              </p>
            </div>
            <div className="ml-auto flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  const chatId = notification.content.chat_id;
                  if (chatId) {
                    router.push(`/chat/${chatId}`);
                  }
                }}
              >
                <FaComment className="mr-1 h-3 w-3" />
                查看
              </Button>
            </div>
          </div>
        );
      case 'system':
        return (
          <div className="flex items-center">
            <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-gray-500 text-white">
              <FaCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium">
                {notification.content.message || '系統通知'}
              </p>
              <p className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: zhTW })}
              </p>
            </div>
          </div>
        );
      default:
        return (
          <div className="flex items-center">
            <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-gray-500 text-white">
              <FaCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium">
                未知通知類型
              </p>
              <p className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: zhTW })}
              </p>
            </div>
          </div>
        );
    }
  };
  
  // 初始化
  useEffect(() => {
    if (user) {
      loadNotifications();
      
      // 訂閱通知更新
      const subscription = subscribeToNotifications(user.id, handleNotificationUpdate);
      
      return () => {
        unsubscribeFromNotifications(subscription);
      };
    }
  }, [user, loadNotifications, subscribeToNotifications, unsubscribeFromNotifications, handleNotificationUpdate]);
  
  // 如果用戶未登錄，重定向到登錄頁面
  if (!user) {
    router.push('/login');
    return null;
  }
  
  return (
    <div className="container mx-auto p-4">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="mr-2"
          >
            <FaArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">通知</h1>
        </div>
        
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllAsRead}
            disabled={loading || notifications.every(n => n.is_read)}
          >
            <FaCheck className="mr-2 h-4 w-4" />
            全部標記為已讀
          </Button>
        </div>
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
      ) : notifications.length === 0 ? (
        <div className="flex h-40 items-center justify-center">
          <p className="text-gray-500">沒有通知</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map(notification => (
            <Card
              key={notification.id}
              className={`cursor-pointer transition-all hover:shadow-md ${!notification.is_read ? 'border-l-4 border-l-primary' : ''}`}
              onClick={() => handleNotificationClick(notification)}
            >
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex-1">
                  {getNotificationContent(notification)}
                </div>
                
                <div className="ml-2 flex flex-col space-y-2">
                  {!notification.is_read && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsRead(notification.id);
                      }}
                      title="標記為已讀"
                    >
                      <FaCheck className="h-4 w-4 text-green-500" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteNotification(notification.id);
                    }}
                    title="刪除通知"
                  >
                    <FaTrash className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
