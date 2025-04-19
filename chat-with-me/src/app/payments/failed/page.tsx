'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { FaTimesCircle } from 'react-icons/fa';

export default function PaymentFailedPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  // 獲取錯誤消息
  useEffect(() => {
    const message = searchParams.get('message');
    setErrorMessage(message || '支付處理失敗，請稍後再試。');
  }, [searchParams]);
  
  // 5 秒後自動重定向到支付頁面
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/payments');
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [router]);
  
  return (
    <div className="container mx-auto flex h-full flex-col items-center justify-center p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow-lg">
        <div className="mb-6 flex justify-center">
          <FaTimesCircle className="h-16 w-16 text-red-500" />
        </div>
        
        <h1 className="mb-4 text-2xl font-bold text-gray-900">支付失敗</h1>
        
        <p className="mb-6 text-gray-600">
          {errorMessage}
        </p>
        
        <div className="flex justify-center space-x-4">
          <Button onClick={() => router.push('/payments')}>
            重新嘗試
          </Button>
          
          <Button variant="outline" onClick={() => router.push('/dashboard')}>
            返回儀表板
          </Button>
        </div>
        
        <p className="mt-6 text-sm text-gray-500">
          5 秒後自動返回支付頁面...
        </p>
      </div>
    </div>
  );
}
