'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { FaCog, FaRobot, FaBell, FaShieldAlt, FaLanguage, FaPalette } from 'react-icons/fa';

export default function SettingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const settingsCategories = [
    {
      id: 'ai',
      title: 'AI 輔助設置',
      description: '自定義 AI 建議和模擬回覆的行為',
      icon: <FaRobot className="h-6 w-6 text-primary" />,
      href: '/settings/ai'
    },
    {
      id: 'notifications',
      title: '通知設置',
      description: '管理應用程序的通知偏好',
      icon: <FaBell className="h-6 w-6 text-primary" />,
      href: '/settings/notifications',
      disabled: true
    },
    {
      id: 'privacy',
      title: '隱私與安全',
      description: '管理隱私偏好和安全設置',
      icon: <FaShieldAlt className="h-6 w-6 text-primary" />,
      href: '/settings/privacy',
      disabled: true
    },
    {
      id: 'language',
      title: '語言與地區',
      description: '更改應用程序的語言和地區設置',
      icon: <FaLanguage className="h-6 w-6 text-primary" />,
      href: '/settings/language',
      disabled: true
    },
    {
      id: 'appearance',
      title: '外觀',
      description: '自定義應用程序的外觀和主題',
      icon: <FaPalette className="h-6 w-6 text-primary" />,
      href: '/settings/appearance',
      disabled: true
    }
  ];
  
  return (
    <ProtectedRoute>
      <div className="container mx-auto p-4">
        <h1 className="mb-6 text-2xl font-bold">設置</h1>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {settingsCategories.map(category => (
            <Card 
              key={category.id}
              className={`transition-all hover:shadow-md ${category.disabled ? 'opacity-60' : ''}`}
            >
              <CardHeader className="flex flex-row items-center gap-4">
                {category.icon}
                <div>
                  <CardTitle>{category.title}</CardTitle>
                  <CardDescription>{category.description}</CardDescription>
                </div>
              </CardHeader>
              <CardFooter>
                <Button 
                  onClick={() => router.push(category.href)}
                  disabled={category.disabled}
                  className="w-full"
                >
                  {category.disabled ? '即將推出' : '前往設置'}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
        
        <div className="mt-8">
          <Link href="/profile">
            <Button variant="outline" className="w-full">
              返回個人資料
            </Button>
          </Link>
        </div>
      </div>
    </ProtectedRoute>
  );
}
