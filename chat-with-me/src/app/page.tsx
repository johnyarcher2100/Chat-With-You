import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
      <main className="flex w-full max-w-4xl flex-col items-center space-y-12">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900">Chat with Me</h1>
          <p className="mt-4 text-xl text-gray-600">
            一個多平台社群聊天應用，具有 Apple 風格的 UI、先進的多提供商認證、即時消息、AI 輔助聊天、可自定義 AI 機器人、全面的好友管理和安全的支付系統。
          </p>
        </div>

        <div className="relative w-full max-w-3xl overflow-hidden rounded-xl shadow-apple-lg">
          <Image
            src="/hero-image.jpg"
            alt="Chat with Me App"
            width={1200}
            height={600}
            className="w-full object-cover"
            priority
          />
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="rounded-lg bg-blue-50 p-6 shadow-apple-md">
            <h2 className="mb-3 text-xl font-semibold text-blue-700">即時消息</h2>
            <p className="text-blue-600">
              使用 Supabase Realtime 或 WebSocket 的即時消息功能，支持離線緩存和同步。
            </p>
          </div>

          <div className="rounded-lg bg-green-50 p-6 shadow-apple-md">
            <h2 className="mb-3 text-xl font-semibold text-green-700">AI 輔助聊天</h2>
            <p className="text-green-600">
              與 deepseekAPI 和 OpenAI API 集成，提供上下文感知建議和模擬回覆。
            </p>
          </div>

          <div className="rounded-lg bg-purple-50 p-6 shadow-apple-md">
            <h2 className="mb-3 text-xl font-semibold text-purple-700">自定義 AI 機器人</h2>
            <p className="text-purple-600">
              創建和配置個人 AI 機器人，包括知識型、訂單型和自定義型機器人。
            </p>
          </div>
        </div>

        <div className="flex space-x-4">
          <Link href="/auth/login">
            <Button size="lg" className="px-8">登錄</Button>
          </Link>
          <Link href="/auth/register">
            <Button size="lg" variant="outline" className="px-8">註冊</Button>
          </Link>
        </div>
      </main>

      <footer className="mt-16 text-center text-sm text-gray-500">
        <p>© {new Date().getFullYear()} Chat with Me. 保留所有權利。</p>
      </footer>
    </div>
  );
}
