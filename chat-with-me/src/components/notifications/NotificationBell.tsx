'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtime } from '@/contexts/RealtimeContext';
import { getUnreadNotificationsCount } from '@/lib/supabase-client-extended';
import { IOSButton } from '@/components/ui/apple';
import { FaBell } from 'react-icons/fa';

interface NotificationBellProps {
  onClick?: () => void;
}

export default function NotificationBell({ onClick }: NotificationBellProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { subscribeToNotifications, unsubscribeFromNotifications } = useRealtime();

  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // 加載未讀通知數量
  const loadUnreadCount = async () => {
    if (!user) return;

    try {
      const count = await getUnreadNotificationsCount(user.id);
      setUnreadCount(count);
    } catch (error) {
      console.error('Error loading unread notifications count:', error);
    } finally {
      setLoading(false);
    }
  };

  // 處理通知更新
  const handleNotificationUpdate = (payload: any) => {
    if (payload.eventType === 'INSERT') {
      // 新通知
      setUnreadCount(prev => prev + 1);
    } else if (payload.eventType === 'UPDATE') {
      // 更新通知（標記為已讀）
      if (payload.new.is_read && !payload.old.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } else if (payload.eventType === 'DELETE') {
      // 刪除通知
      if (!payload.old.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    }
  };

  // 處理點擊
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      router.push('/notifications');
    }
  };

  // 初始化
  useEffect(() => {
    if (user) {
      loadUnreadCount();

      // 訂閱通知更新
      const subscription = subscribeToNotifications(user.id, handleNotificationUpdate);

      return () => {
        unsubscribeFromNotifications(subscription);
      };
    }
  }, [user, subscribeToNotifications, unsubscribeFromNotifications]);

  if (!user || loading) {
    return null;
  }

  return (
    <IOSButton
      variant="ghost"
      size="icon"
      onClick={handleClick}
      className="relative"
    >
      <FaBell className="h-5 w-5" />
      {unreadCount > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-apple-full bg-error text-xs font-medium text-white shadow-apple-sm">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </IOSButton>
  );
}
