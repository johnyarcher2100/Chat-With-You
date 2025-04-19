'use client';

import { usePathname } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Navbar from '@/components/layout/Navbar';

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isRootChatPage = pathname === '/chat';

  return (
    <ProtectedRoute>
      <div className="flex h-full flex-col">
        <Navbar />
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </div>
    </ProtectedRoute>
  );
}
