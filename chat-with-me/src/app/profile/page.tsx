'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import FileUpload from '@/components/ui/file-upload';
import { useFileUpload } from '@/hooks/useFileUpload';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

interface Profile {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  updated_at: string;
}

export default function Profile() {
  const { user } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { uploadAvatar, uploading, progress } = useFileUpload();

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
      } else if (data) {
        setProfile(data);
        setUsername(data.username || '');
        setFullName(data.full_name || '');
        setAvatarUrl(data.avatar_url || '');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    if (!user) return;

    try {
      const result = await uploadAvatar(file);

      if (result) {
        setAvatarUrl(result.secureUrl);
        return result.secureUrl;
      }

      return null;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    if (!user) return;

    try {
      const updates = {
        id: user.id,
        username,
        full_name: fullName,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('profiles').upsert(updates);

      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
      }
    } catch (error: any) {
      setError(error.message || '更新個人資料時發生錯誤');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">個人資料</h1>
        <Button
          variant="outline"
          onClick={() => router.push('/settings')}
        >
          設置
        </Button>
      </div>

      <div className="rounded-lg bg-white p-6 shadow-apple-md">
        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-md bg-green-50 p-4 text-sm text-green-700">
            個人資料已成功更新。
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              電子郵件
            </label>
            <Input
              id="email"
              type="email"
              value={user?.email || ''}
              disabled
              className="mt-1 bg-gray-100"
            />
            <p className="mt-1 text-xs text-gray-500">電子郵件地址無法更改</p>
          </div>

          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              用戶名
            </label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1"
              placeholder="您的用戶名"
            />
          </div>

          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
              全名
            </label>
            <Input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1"
              placeholder="您的全名"
            />
          </div>

          <div>
            <label htmlFor="avatar" className="block text-sm font-medium text-gray-700">
              頭像
            </label>
            <div className="mt-2">
              <FileUpload
                onFileSelect={handleAvatarUpload}
                accept="image/*"
                maxSize={2} // 2MB
                preview={true}
                previewUrl={avatarUrl}
                buttonText="選擇頭像"
                dropzoneText="拖放圖片到此處或點擊選擇"
                disabled={uploading || isLoading}
                className="max-w-md"
              />
              {uploading && (
                <div className="mt-2">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <p className="mt-1 text-center text-xs text-gray-500">
                    上傳中... {progress}%
                  </p>
                </div>
              )}
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? '更新中...' : '更新個人資料'}
          </Button>
        </form>
      </div>
    </div>
  );
}
