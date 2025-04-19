'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

// 導入圖標
import { FaFacebook, FaGoogle, FaApple } from 'react-icons/fa';

interface SocialLoginButtonsProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export default function SocialLoginButtons({ onSuccess, onError }: SocialLoginButtonsProps) {
  const { signInWithProvider } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);

  const handleProviderLogin = async (provider: 'facebook' | 'google' | 'apple') => {
    setLoading(provider);

    try {
      const { error } = await signInWithProvider(provider);
      if (error) {
        onError?.(error.message);
      } else {
        onSuccess?.();
      }
    } catch (err: any) {
      onError?.(err.message || `使用 ${provider} 登錄時發生錯誤`);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="mt-6">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white px-2 text-gray-500">或使用以下方式登錄</span>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => handleProviderLogin('facebook')}
          disabled={loading !== null}
          className="flex items-center justify-center space-x-2"
        >
          <FaFacebook className="h-5 w-5 text-blue-600" />
          <span className="hidden sm:inline">Facebook</span>
          {loading === 'facebook' && (
            <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-blue-600"></div>
          )}
        </Button>
        
        <Button
          type="button"
          variant="outline"
          onClick={() => handleProviderLogin('google')}
          disabled={loading !== null}
          className="flex items-center justify-center space-x-2"
        >
          <FaGoogle className="h-5 w-5 text-red-500" />
          <span className="hidden sm:inline">Google</span>
          {loading === 'google' && (
            <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-red-500"></div>
          )}
        </Button>
        
        <Button
          type="button"
          variant="outline"
          onClick={() => handleProviderLogin('apple')}
          disabled={loading !== null}
          className="flex items-center justify-center space-x-2"
        >
          <FaApple className="h-5 w-5" />
          <span className="hidden sm:inline">Apple</span>
          {loading === 'apple' && (
            <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-gray-800"></div>
          )}
        </Button>
      </div>
    </div>
  );
}
