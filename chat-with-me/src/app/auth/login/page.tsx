'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import SocialLoginButtons from '@/components/auth/SocialLoginButtons';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { signIn, signInWithProvider } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await signIn(email, password);
      if (error) {
        setError(error.message);
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || '登錄時發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLoginSuccess = () => {
    // OAuth 重定向會處理成功的情況，這裡不需要做任何事情
  };

  const handleSocialLoginError = (errorMessage: string) => {
    setError(errorMessage);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-apple-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">歡迎回來</h1>
          <p className="mt-2 text-sm text-gray-600">請登錄您的帳戶</p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                電子郵件
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                密碼
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <Link href="/auth/forgot-password" className="text-primary hover:text-primary-dark">
                忘記密碼？
              </Link>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? '登錄中...' : '登錄'}
          </Button>
        </form>

        <SocialLoginButtons
          onSuccess={handleSocialLoginSuccess}
          onError={handleSocialLoginError}
        />

        <div className="mt-6 text-center text-sm">
          <span className="text-gray-600">還沒有帳戶？</span>{' '}
          <Link href="/auth/register" className="text-primary hover:text-primary-dark">
            註冊
          </Link>
        </div>
      </div>
    </div>
  );
}
