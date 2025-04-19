'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

export default function Dashboard() {
  const { user } = useAuth();
  const router = useRouter();

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">儀表板</h1>

      <div className="rounded-lg bg-white p-6 shadow-apple-md">
        <h2 className="mb-4 text-xl font-semibold">歡迎回來，{user?.email}</h2>
        <p className="text-gray-600">
          您已成功登錄到 Chat with Me 應用程序。這是您的個人儀表板，您可以在這裡管理您的帳戶、聊天和設置。
        </p>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-lg bg-blue-50 p-4 shadow-sm">
            <h3 className="mb-2 font-medium text-blue-700">聊天</h3>
            <p className="text-sm text-blue-600">開始新的對話或繼續現有對話。</p>
            <Button className="mt-4 w-full" variant="outline" onClick={() => router.push('/chat')}>
              進入聊天
            </Button>
          </div>

          <div className="rounded-lg bg-green-50 p-4 shadow-sm">
            <h3 className="mb-2 font-medium text-green-700">好友</h3>
            <p className="text-sm text-green-600">管理您的好友列表和好友請求。</p>
            <Button className="mt-4 w-full" variant="outline" onClick={() => router.push('/friends')}>
              管理好友
            </Button>
          </div>

          <div className="rounded-lg bg-purple-50 p-4 shadow-sm">
            <h3 className="mb-2 font-medium text-purple-700">AI 機器人</h3>
            <p className="text-sm text-purple-600">創建和管理您的自定義 AI 機器人。</p>
            <Button className="mt-4 w-full" variant="outline" onClick={() => router.push('/robots')}>
              管理機器人
            </Button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-lg bg-amber-50 p-4 shadow-sm">
            <h3 className="mb-2 font-medium text-amber-700">餘額和支付</h3>
            <p className="text-sm text-amber-600">管理您的餘額和支付方式。</p>
            <Button className="mt-4 w-full" variant="outline" onClick={() => router.push('/payments')}>
              管理餘額
            </Button>
          </div>

          <div className="rounded-lg bg-indigo-50 p-4 shadow-sm">
            <h3 className="mb-2 font-medium text-indigo-700">AI 使用統計</h3>
            <p className="text-sm text-indigo-600">查看您的 AI 使用情況和成本。</p>
            <Button className="mt-4 w-full" variant="outline" onClick={() => router.push('/usage')}>
              查看統計
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
