'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getAIBots } from '@/lib/supabase-client';
import { BotType } from '@/services/ai/bots';
import { AIBot } from '@/types/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FaRobot, FaPlus, FaEdit, FaTrash, FaComment, FaBrain, FaShoppingCart, FaCog } from 'react-icons/fa';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function RobotsPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [bots, setBots] = useState<AIBot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 加載機器人列表
  useEffect(() => {
    const loadBots = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const botsList = await getAIBots(user.id);
        setBots(botsList);
      } catch (err: any) {
        setError(err.message || '加載機器人列表時出錯');
      } finally {
        setLoading(false);
      }
    };
    
    loadBots();
  }, [user]);
  
  // 獲取機器人類型標籤
  const getBotTypeBadge = (botType: string) => {
    switch (botType) {
      case BotType.KNOWLEDGE:
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            <FaBrain className="mr-1 h-3 w-3" />
            知識型
          </Badge>
        );
      case BotType.ORDER:
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <FaShoppingCart className="mr-1 h-3 w-3" />
            訂單型
          </Badge>
        );
      case BotType.CUSTOM:
        return (
          <Badge variant="secondary" className="bg-purple-100 text-purple-800">
            <FaCog className="mr-1 h-3 w-3" />
            自定義型
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="bg-gray-100 text-gray-800">
            <FaRobot className="mr-1 h-3 w-3" />
            未知類型
          </Badge>
        );
    }
  };
  
  // 過濾特定類型的機器人
  const filterBotsByType = (botType: string) => {
    return bots.filter(bot => bot.bot_type === botType);
  };
  
  return (
    <ProtectedRoute>
      <div className="container mx-auto p-4">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">AI 機器人</h1>
          
          <Button onClick={() => router.push('/robots/create')}>
            <FaPlus className="mr-2 h-4 w-4" />
            創建機器人
          </Button>
        </div>
        
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}
        
        <Tabs defaultValue="all">
          <TabsList className="mb-4 grid w-full grid-cols-4">
            <TabsTrigger value="all">全部</TabsTrigger>
            <TabsTrigger value="knowledge">知識型</TabsTrigger>
            <TabsTrigger value="order">訂單型</TabsTrigger>
            <TabsTrigger value="custom">自定義型</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            {renderBotsList(bots)}
          </TabsContent>
          
          <TabsContent value="knowledge">
            {renderBotsList(filterBotsByType(BotType.KNOWLEDGE))}
          </TabsContent>
          
          <TabsContent value="order">
            {renderBotsList(filterBotsByType(BotType.ORDER))}
          </TabsContent>
          
          <TabsContent value="custom">
            {renderBotsList(filterBotsByType(BotType.CUSTOM))}
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  );
  
  // 渲染機器人列表
  function renderBotsList(botsList: AIBot[]) {
    if (loading) {
      return (
        <div className="flex h-40 items-center justify-center">
          <p className="text-gray-500">加載中...</p>
        </div>
      );
    }
    
    if (botsList.length === 0) {
      return (
        <div className="flex h-40 flex-col items-center justify-center">
          <p className="mb-4 text-gray-500">沒有找到機器人</p>
          <Button onClick={() => router.push('/robots/create')}>
            <FaPlus className="mr-2 h-4 w-4" />
            創建機器人
          </Button>
        </div>
      );
    }
    
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {botsList.map(bot => (
          <Card key={bot.id} className="overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">{bot.name}</CardTitle>
                {getBotTypeBadge(bot.bot_type)}
              </div>
              <CardDescription className="line-clamp-2">
                {bot.description || '沒有描述'}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="pb-2">
              <div className="flex h-24 items-center justify-center rounded-md bg-gray-50">
                <FaRobot className="h-12 w-12 text-gray-300" />
              </div>
            </CardContent>
            
            <CardFooter className="flex justify-between">
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/robots/${bot.id}/edit`)}
                >
                  <FaEdit className="mr-1 h-4 w-4" />
                  編輯
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-500 hover:bg-red-50 hover:text-red-600"
                  onClick={() => router.push(`/robots/${bot.id}/delete`)}
                >
                  <FaTrash className="mr-1 h-4 w-4" />
                  刪除
                </Button>
              </div>
              
              <Button
                variant="default"
                size="sm"
                onClick={() => router.push(`/robots/${bot.id}/chat`)}
              >
                <FaComment className="mr-1 h-4 w-4" />
                聊天
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }
}
