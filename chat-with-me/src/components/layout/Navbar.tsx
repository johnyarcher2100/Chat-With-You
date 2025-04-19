'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import NotificationBell from '@/components/notifications/NotificationBell';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FaUserCircle, FaCog, FaSignOutAlt, FaUserFriends, FaComments, FaRobot, FaApple } from 'react-icons/fa';
import { GlassNavbar, IOSButton } from '@/components/ui/apple';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  // 獲取用戶頭像的首字母
  const getInitials = () => {
    if (!user) return 'U';

    if (user.email) {
      return user.email[0].toUpperCase();
    }

    return 'U';
  };

  const [darkMode, setDarkMode] = useState(false);

  // 檢查系統深色模式偏好
  useEffect(() => {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(isDark);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setDarkMode(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return (
    <GlassNavbar dark={darkMode} className="border-b border-gray-200/50 dark:border-gray-800/50">
      <div className="container mx-auto flex h-full items-center justify-between px-4">
        <div className="flex items-center">
          <Link href="/chat" className="flex items-center text-xl font-bold">
            <FaApple className="mr-2 h-5 w-5" />
            <span>Chat with Me</span>
          </Link>

          <nav className="ml-8 hidden md:block">
            <ul className="flex space-x-6">
              <li>
                <Link
                  href="/chat"
                  className={`flex items-center space-x-1 transition-colors ${
                    pathname.startsWith('/chat')
                      ? 'text-primary dark:text-primary-light'
                      : 'text-gray-600 hover:text-primary dark:text-gray-300 dark:hover:text-primary-light'
                  }`}
                >
                  <FaComments className="h-4 w-4" />
                  <span>聊天</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/friends"
                  className={`flex items-center space-x-1 transition-colors ${
                    pathname.startsWith('/friends')
                      ? 'text-primary dark:text-primary-light'
                      : 'text-gray-600 hover:text-primary dark:text-gray-300 dark:hover:text-primary-light'
                  }`}
                >
                  <FaUserFriends className="h-4 w-4" />
                  <span>好友</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/robots"
                  className={`flex items-center space-x-1 transition-colors ${
                    pathname.startsWith('/robots')
                      ? 'text-primary dark:text-primary-light'
                      : 'text-gray-600 hover:text-primary dark:text-gray-300 dark:hover:text-primary-light'
                  }`}
                >
                  <FaRobot className="h-4 w-4" />
                  <span>機器人</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/design"
                  className={`flex items-center space-x-1 transition-colors ${
                    pathname.startsWith('/design')
                      ? 'text-primary dark:text-primary-light'
                      : 'text-gray-600 hover:text-primary dark:text-gray-300 dark:hover:text-primary-light'
                  }`}
                >
                  <FaCog className="h-4 w-4" />
                  <span>設計系統</span>
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        <div className="flex items-center space-x-4">
          <NotificationBell />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <IOSButton variant="ghost" size="icon" className="relative h-8 w-8 rounded-full p-0">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.user_metadata?.avatar_url} alt={user?.email || 'User'} />
                  <AvatarFallback>{getInitials()}</AvatarFallback>
                </Avatar>
              </IOSButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-apple border-gray-200 shadow-apple-md dark:border-gray-800">
              <DropdownMenuLabel>我的帳戶</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/profile')} className="cursor-pointer">
                <FaUserCircle className="mr-2 h-4 w-4" />
                <span>個人資料</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/settings')} className="cursor-pointer">
                <FaCog className="mr-2 h-4 w-4" />
                <span>設置</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-error">
                <FaSignOutAlt className="mr-2 h-4 w-4" />
                <span>登出</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </GlassNavbar>
  );
}
