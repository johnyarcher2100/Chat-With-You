'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function VerifyEmail() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-apple-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">驗證您的電子郵件</h1>
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              我們已經向您的電子郵件地址發送了一封驗證郵件。請檢查您的收件箱並點擊郵件中的鏈接以完成註冊。
            </p>
            <p className="mt-4 text-gray-600">
              如果您沒有收到郵件，請檢查您的垃圾郵件文件夾，或者點擊下面的按鈕重新發送驗證郵件。
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col space-y-4">
          <Button className="w-full">重新發送驗證郵件</Button>
          <Link href="/auth/login">
            <Button variant="outline" className="w-full">
              返回登錄
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
