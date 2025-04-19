'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

// 導入圖標
import {
  FaHome,
  FaComments,
  FaUsers,
  FaRobot,
  FaCreditCard,
  FaChartBar,
  FaUserCircle,
  FaBars,
  FaTimes,
  FaUserShield
} from 'react-icons/fa';

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick?: () => void;
}

function NavItem({ href, icon, label, active, onClick }: NavItemProps) {
  return (
    <Link
      href={href}
      className={`flex items-center space-x-3 rounded-lg px-3 py-2 transition-colors ${
        active
          ? 'bg-primary text-white'
          : 'text-gray-700 hover:bg-gray-100'
      }`}
      onClick={onClick}
    >
      <div className="text-lg">{icon}</div>
      <span>{label}</span>
    </Link>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  // 檢查用戶是否為管理員
  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error checking admin status:', error);
          return;
        }

        setIsAdmin(data?.is_admin || false);
      } catch (err) {
        console.error('Error checking admin status:', err);
      }
    };

    checkAdmin();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/auth/login');
  };

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-background">
        {/* 移動端側邊欄遮罩 */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
            onClick={closeSidebar}
          />
        )}

        {/* 側邊欄 */}
        <aside
          className={`fixed inset-y-0 left-0 z-30 w-64 transform bg-white shadow-lg transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex h-16 items-center justify-between border-b px-4">
            <h2 className="text-xl font-bold text-primary">Chat with Me</h2>
            <button
              className="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 lg:hidden"
              onClick={closeSidebar}
            >
              <FaTimes className="h-6 w-6" />
            </button>
          </div>

          <nav className="mt-6 px-4">
            <div className="space-y-2">
              <NavItem
                href="/dashboard"
                icon={<FaHome />}
                label="儀表板"
                active={pathname === '/dashboard'}
                onClick={closeSidebar}
              />
              <NavItem
                href="/chat"
                icon={<FaComments />}
                label="聊天"
                active={pathname.startsWith('/chat')}
                onClick={closeSidebar}
              />
              <NavItem
                href="/friends"
                icon={<FaUsers />}
                label="好友"
                active={pathname.startsWith('/friends')}
                onClick={closeSidebar}
              />
              <NavItem
                href="/robots"
                icon={<FaRobot />}
                label="AI 機器人"
                active={pathname.startsWith('/robots')}
                onClick={closeSidebar}
              />
              <NavItem
                href="/payments"
                icon={<FaCreditCard />}
                label="支付"
                active={pathname.startsWith('/payments')}
                onClick={closeSidebar}
              />
              <NavItem
                href="/usage"
                icon={<FaChartBar />}
                label="使用統計"
                active={pathname.startsWith('/usage')}
                onClick={closeSidebar}
              />
              <NavItem
                href="/profile"
                icon={<FaUserCircle />}
                label="個人資料"
                active={pathname.startsWith('/profile')}
                onClick={closeSidebar}
              />

              {isAdmin && (
                <NavItem
                  href="/admin"
                  icon={<FaUserShield />}
                  label="管理員"
                  active={pathname.startsWith('/admin')}
                  onClick={closeSidebar}
                />
              )}
            </div>

            <div className="mt-8 border-t pt-4">
              <button
                className="flex w-full items-center space-x-3 rounded-lg px-3 py-2 text-gray-700 transition-colors hover:bg-red-50 hover:text-red-700"
                onClick={handleSignOut}
              >
                <div className="text-lg">🔒</div>
                <span>登出</span>
              </button>
            </div>
          </nav>
        </aside>

        {/* 主要內容 */}
        <div className="flex flex-1 flex-col">
          {/* 頂部導航欄 */}
          <header className="flex h-16 items-center justify-between border-b bg-white px-6 shadow-sm">
            <button
              className="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 lg:hidden"
              onClick={toggleSidebar}
            >
              <FaBars className="h-6 w-6" />
            </button>

            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-700">
                {user?.email}
              </div>
              <div className="h-8 w-8 rounded-full bg-primary text-white">
                <div className="flex h-full w-full items-center justify-center">
                  {user?.email?.[0]?.toUpperCase() || 'U'}
                </div>
              </div>
            </div>
          </header>

          {/* 頁面內容 */}
          <main className="flex-1 overflow-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
