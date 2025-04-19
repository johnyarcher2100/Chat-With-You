'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { BotType, createDefaultBotConfiguration } from '@/services/ai/bots';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { FaArrowLeft, FaBrain, FaShoppingCart, FaCog } from 'react-icons/fa';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function CreateRobotPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [botType, setBotType] = useState<BotType>(BotType.KNOWLEDGE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 處理創建機器人
  const handleCreateBot = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    if (!name.trim()) {
      setError('請輸入機器人名稱');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // 創建默認配置
      const configuration = createDefaultBotConfiguration(botType);
      
      // 創建機器人
      const { data, error: createError } = await supabase
        .from('ai_bots')
        .insert({
          name,
          description,
          owner_id: user.id,
          bot_type: botType,
          configuration
        })
        .select()
        .single();
      
      if (createError) {
        throw createError;
      }
      
      // 導航到編輯頁面
      router.push(`/robots/${data.id}/edit`);
    } catch (err: any) {
      setError(err.message || '創建機器人時出錯');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <ProtectedRoute>
      <div className="container mx-auto p-4">
        <div className="mb-6 flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/robots')}
            className="mr-2"
          >
            <FaArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">創建 AI 機器人</h1>
        </div>
        
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}
        
        <form onSubmit={handleCreateBot}>
          <Card>
            <CardHeader>
              <CardTitle>基本信息</CardTitle>
              <CardDescription>
                設置機器人的基本信息和類型
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* 機器人名稱 */}
              <div className="space-y-2">
                <Label htmlFor="name">機器人名稱</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="例如：客服助手、訂單機器人"
                  required
                />
              </div>
              
              {/* 機器人描述 */}
              <div className="space-y-2">
                <Label htmlFor="description">機器人描述（可選）</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="描述這個機器人的功能和用途..."
                  rows={3}
                />
              </div>
              
              {/* 機器人類型 */}
              <div className="space-y-2">
                <Label>機器人類型</Label>
                <RadioGroup
                  value={botType}
                  onValueChange={(value) => setBotType(value as BotType)}
                  className="grid grid-cols-1 gap-4 md:grid-cols-3"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value={BotType.KNOWLEDGE} id="type-knowledge" />
                    <Label
                      htmlFor="type-knowledge"
                      className="flex cursor-pointer items-center space-x-2 rounded-md border p-4 hover:bg-gray-50"
                    >
                      <FaBrain className="h-5 w-5 text-blue-500" />
                      <div>
                        <div className="font-medium">知識型</div>
                        <div className="text-sm text-gray-500">
                          基於知識庫回答問題
                        </div>
                      </div>
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value={BotType.ORDER} id="type-order" />
                    <Label
                      htmlFor="type-order"
                      className="flex cursor-pointer items-center space-x-2 rounded-md border p-4 hover:bg-gray-50"
                    >
                      <FaShoppingCart className="h-5 w-5 text-green-500" />
                      <div>
                        <div className="font-medium">訂單型</div>
                        <div className="text-sm text-gray-500">
                          處理產品訂購和支付
                        </div>
                      </div>
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value={BotType.CUSTOM} id="type-custom" />
                    <Label
                      htmlFor="type-custom"
                      className="flex cursor-pointer items-center space-x-2 rounded-md border p-4 hover:bg-gray-50"
                    >
                      <FaCog className="h-5 w-5 text-purple-500" />
                      <div>
                        <div className="font-medium">自定義型</div>
                        <div className="text-sm text-gray-500">
                          自定義指令和行為
                        </div>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
            
            <CardFooter className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => router.push('/robots')}
                disabled={loading}
              >
                取消
              </Button>
              <Button
                type="submit"
                disabled={loading}
              >
                {loading ? '創建中...' : '創建機器人'}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </ProtectedRoute>
  );
}
