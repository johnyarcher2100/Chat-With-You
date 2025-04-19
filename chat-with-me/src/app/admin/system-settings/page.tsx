'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FaArrowLeft, FaSave, FaRedo, FaCog, FaMoneyBill, FaRobot } from 'react-icons/fa';
import { IOSCard, IOSButton } from '@/components/ui/apple';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

// 系統設置接口
interface SystemSettings {
  payment: {
    usdToTwdRate: number;
    newUserFreeCredit: number;
    plans: Array<{
      id: string;
      name: string;
      amount: number;
      bonus: number;
    }>;
  };
  ai: {
    baseRates: {
      [key: string]: {
        input: number;
        output: number;
      };
    };
    maxTokensPerRequest: number;
    defaultTemperature: number;
  };
  features: {
    enableFriendRequests: boolean;
    enableGroupChats: boolean;
    enableAIBots: boolean;
    enablePayments: boolean;
  };
}

export default function SystemSettingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SystemSettings>({
    payment: {
      usdToTwdRate: 31.5,
      newUserFreeCredit: 100,
      plans: [
        { id: 'basic', name: '基本方案', amount: 100, bonus: 0 },
        { id: 'standard', name: '標準方案', amount: 500, bonus: 50 },
        { id: 'premium', name: '高級方案', amount: 1000, bonus: 150 }
      ]
    },
    ai: {
      baseRates: {
        'deepseek': {
          input: 0.002,
          output: 0.006
        },
        'claude': {
          input: 0.003,
          output: 0.015
        }
      },
      maxTokensPerRequest: 4000,
      defaultTemperature: 0.7
    },
    features: {
      enableFriendRequests: true,
      enableGroupChats: true,
      enableAIBots: true,
      enablePayments: true
    }
  });
  const [activeTab, setActiveTab] = useState('payment');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // 檢查用戶是否為管理員
  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single();
        
        if (error) {
          throw error;
        }
        
        setIsAdmin(data?.is_admin || false);
        
        if (!data?.is_admin) {
          router.push('/dashboard');
        }
      } catch (err) {
        console.error('Error checking admin status:', err);
        router.push('/dashboard');
      }
    };
    
    checkAdmin();
  }, [user, router]);
  
  // 加載系統設置
  useEffect(() => {
    const loadSettings = async () => {
      if (!user || !isAdmin) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // 獲取系統設置
        const { data, error } = await supabase
          .from('admin_config')
          .select('value')
          .eq('key', 'system_settings')
          .single();
        
        if (error && error.code !== 'PGRST116') { // PGRST116 是 "沒有找到結果" 的錯誤代碼
          throw error;
        }
        
        if (data) {
          setSettings(data.value as SystemSettings);
        }
      } catch (err: any) {
        setError(err.message || '加載系統設置時出錯');
      } finally {
        setLoading(false);
      }
    };
    
    loadSettings();
  }, [user, isAdmin, router]);
  
  // 處理保存設置
  const handleSaveSettings = async () => {
    if (!user || !isAdmin) return;
    
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);
      
      // 保存系統設置
      const { error } = await supabase
        .from('admin_config')
        .upsert({
          key: 'system_settings',
          value: settings,
          updated_at: new Date().toISOString()
        });
      
      if (error) {
        throw error;
      }
      
      setSuccess(true);
      
      // 3 秒後清除成功消息
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err: any) {
      setError(err.message || '保存系統設置時出錯');
    } finally {
      setSaving(false);
    }
  };
  
  // 處理重置設置
  const handleResetSettings = () => {
    setSettings({
      payment: {
        usdToTwdRate: 31.5,
        newUserFreeCredit: 100,
        plans: [
          { id: 'basic', name: '基本方案', amount: 100, bonus: 0 },
          { id: 'standard', name: '標準方案', amount: 500, bonus: 50 },
          { id: 'premium', name: '高級方案', amount: 1000, bonus: 150 }
        ]
      },
      ai: {
        baseRates: {
          'deepseek': {
            input: 0.002,
            output: 0.006
          },
          'claude': {
            input: 0.003,
            output: 0.015
          }
        },
        maxTokensPerRequest: 4000,
        defaultTemperature: 0.7
      },
      features: {
        enableFriendRequests: true,
        enableGroupChats: true,
        enableAIBots: true,
        enablePayments: true
      }
    });
  };
  
  // 更新支付設置
  const updatePaymentSettings = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      payment: {
        ...prev.payment,
        [key]: value
      }
    }));
  };
  
  // 更新計劃
  const updatePlan = (index: number, key: string, value: any) => {
    setSettings(prev => {
      const plans = [...prev.payment.plans];
      plans[index] = {
        ...plans[index],
        [key]: key === 'amount' || key === 'bonus' ? parseFloat(value) : value
      };
      
      return {
        ...prev,
        payment: {
          ...prev.payment,
          plans
        }
      };
    });
  };
  
  // 添加計劃
  const addPlan = () => {
    setSettings(prev => ({
      ...prev,
      payment: {
        ...prev.payment,
        plans: [
          ...prev.payment.plans,
          {
            id: `plan-${Date.now()}`,
            name: '新方案',
            amount: 0,
            bonus: 0
          }
        ]
      }
    }));
  };
  
  // 刪除計劃
  const removePlan = (index: number) => {
    setSettings(prev => {
      const plans = [...prev.payment.plans];
      plans.splice(index, 1);
      
      return {
        ...prev,
        payment: {
          ...prev.payment,
          plans
        }
      };
    });
  };
  
  // 更新 AI 設置
  const updateAISettings = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      ai: {
        ...prev.ai,
        [key]: value
      }
    }));
  };
  
  // 更新 AI 費率
  const updateAIRate = (api: string, type: 'input' | 'output', value: string) => {
    setSettings(prev => ({
      ...prev,
      ai: {
        ...prev.ai,
        baseRates: {
          ...prev.ai.baseRates,
          [api]: {
            ...prev.ai.baseRates[api],
            [type]: parseFloat(value)
          }
        }
      }
    }));
  };
  
  // 更新功能設置
  const updateFeatureSettings = (key: string, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      features: {
        ...prev.features,
        [key]: value
      }
    }));
  };
  
  // 如果用戶不是管理員，不顯示頁面
  if (!isAdmin) {
    return null;
  }
  
  return (
    <ProtectedRoute>
      <div className="container mx-auto p-4">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/admin')}
              className="mr-2"
            >
              <FaArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">系統設置</h1>
          </div>
          
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={handleResetSettings}
              disabled={loading || saving}
            >
              <FaRedo className="mr-2 h-4 w-4" />
              重置
            </Button>
            <Button
              onClick={handleSaveSettings}
              disabled={loading || saving}
            >
              <FaSave className="mr-2 h-4 w-4" />
              {saving ? '保存中...' : '保存'}
            </Button>
          </div>
        </div>
        
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-4 rounded-md bg-green-50 p-4 text-sm text-green-700">
            設置已保存
          </div>
        )}
        
        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <p className="text-gray-500">加載中...</p>
          </div>
        ) : (
          <div className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4 grid w-full grid-cols-3">
                <TabsTrigger value="payment">
                  <FaMoneyBill className="mr-2 h-4 w-4" />
                  支付設置
                </TabsTrigger>
                <TabsTrigger value="ai">
                  <FaRobot className="mr-2 h-4 w-4" />
                  AI 設置
                </TabsTrigger>
                <TabsTrigger value="features">
                  <FaCog className="mr-2 h-4 w-4" />
                  功能設置
                </TabsTrigger>
              </TabsList>
              
              {/* 支付設置 */}
              <TabsContent value="payment">
                <IOSCard>
                  <CardHeader>
                    <CardTitle>支付設置</CardTitle>
                    <CardDescription>
                      配置支付相關的設置
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-6">
                    {/* 匯率設置 */}
                    <div className="space-y-2">
                      <Label htmlFor="usd-to-twd-rate">美元兌新台幣匯率</Label>
                      <Input
                        id="usd-to-twd-rate"
                        type="number"
                        min="1"
                        step="0.01"
                        value={settings.payment.usdToTwdRate}
                        onChange={(e) => updatePaymentSettings('usdToTwdRate', parseFloat(e.target.value))}
                      />
                      <p className="text-xs text-gray-500">
                        用於將美元成本轉換為新台幣
                      </p>
                    </div>
                    
                    {/* 新用戶免費額度 */}
                    <div className="space-y-2">
                      <Label htmlFor="new-user-credit">新用戶免費額度 (NT$)</Label>
                      <Input
                        id="new-user-credit"
                        type="number"
                        min="0"
                        step="1"
                        value={settings.payment.newUserFreeCredit}
                        onChange={(e) => updatePaymentSettings('newUserFreeCredit', parseFloat(e.target.value))}
                      />
                      <p className="text-xs text-gray-500">
                        新用戶註冊時獲得的免費額度
                      </p>
                    </div>
                    
                    {/* 充值方案 */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label>充值方案</Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={addPlan}
                        >
                          添加方案
                        </Button>
                      </div>
                      
                      {settings.payment.plans.map((plan, index) => (
                        <div key={plan.id} className="rounded-lg border p-4">
                          <div className="mb-4 flex items-center justify-between">
                            <h4 className="font-medium">方案 #{index + 1}</h4>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:bg-red-50 hover:text-red-600"
                              onClick={() => removePlan(index)}
                            >
                              刪除
                            </Button>
                          </div>
                          
                          <div className="grid gap-4 md:grid-cols-2">
                            {/* 方案 ID */}
                            <div className="space-y-2">
                              <Label htmlFor={`plan-id-${index}`}>方案 ID</Label>
                              <Input
                                id={`plan-id-${index}`}
                                value={plan.id}
                                onChange={(e) => updatePlan(index, 'id', e.target.value)}
                              />
                            </div>
                            
                            {/* 方案名稱 */}
                            <div className="space-y-2">
                              <Label htmlFor={`plan-name-${index}`}>方案名稱</Label>
                              <Input
                                id={`plan-name-${index}`}
                                value={plan.name}
                                onChange={(e) => updatePlan(index, 'name', e.target.value)}
                              />
                            </div>
                            
                            {/* 方案金額 */}
                            <div className="space-y-2">
                              <Label htmlFor={`plan-amount-${index}`}>金額 (NT$)</Label>
                              <Input
                                id={`plan-amount-${index}`}
                                type="number"
                                min="0"
                                step="1"
                                value={plan.amount}
                                onChange={(e) => updatePlan(index, 'amount', e.target.value)}
                              />
                            </div>
                            
                            {/* 方案獎勵 */}
                            <div className="space-y-2">
                              <Label htmlFor={`plan-bonus-${index}`}>獎勵 (NT$)</Label>
                              <Input
                                id={`plan-bonus-${index}`}
                                type="number"
                                min="0"
                                step="1"
                                value={plan.bonus}
                                onChange={(e) => updatePlan(index, 'bonus', e.target.value)}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </IOSCard>
              </TabsContent>
              
              {/* AI 設置 */}
              <TabsContent value="ai">
                <IOSCard>
                  <CardHeader>
                    <CardTitle>AI 設置</CardTitle>
                    <CardDescription>
                      配置 AI 相關的設置
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-6">
                    {/* 基本費率 */}
                    <div className="space-y-4">
                      <Label>基本費率 (每 1000 個令牌)</Label>
                      
                      {/* DeepSeek 費率 */}
                      <div className="rounded-lg border p-4">
                        <h4 className="mb-4 font-medium">DeepSeek</h4>
                        
                        <div className="grid gap-4 md:grid-cols-2">
                          {/* 輸入費率 */}
                          <div className="space-y-2">
                            <Label htmlFor="deepseek-input-rate">輸入費率 (USD)</Label>
                            <Input
                              id="deepseek-input-rate"
                              type="number"
                              min="0"
                              step="0.0001"
                              value={settings.ai.baseRates.deepseek.input}
                              onChange={(e) => updateAIRate('deepseek', 'input', e.target.value)}
                            />
                          </div>
                          
                          {/* 輸出費率 */}
                          <div className="space-y-2">
                            <Label htmlFor="deepseek-output-rate">輸出費率 (USD)</Label>
                            <Input
                              id="deepseek-output-rate"
                              type="number"
                              min="0"
                              step="0.0001"
                              value={settings.ai.baseRates.deepseek.output}
                              onChange={(e) => updateAIRate('deepseek', 'output', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                      
                      {/* Claude 費率 */}
                      <div className="rounded-lg border p-4">
                        <h4 className="mb-4 font-medium">Claude</h4>
                        
                        <div className="grid gap-4 md:grid-cols-2">
                          {/* 輸入費率 */}
                          <div className="space-y-2">
                            <Label htmlFor="claude-input-rate">輸入費率 (USD)</Label>
                            <Input
                              id="claude-input-rate"
                              type="number"
                              min="0"
                              step="0.0001"
                              value={settings.ai.baseRates.claude.input}
                              onChange={(e) => updateAIRate('claude', 'input', e.target.value)}
                            />
                          </div>
                          
                          {/* 輸出費率 */}
                          <div className="space-y-2">
                            <Label htmlFor="claude-output-rate">輸出費率 (USD)</Label>
                            <Input
                              id="claude-output-rate"
                              type="number"
                              min="0"
                              step="0.0001"
                              value={settings.ai.baseRates.claude.output}
                              onChange={(e) => updateAIRate('claude', 'output', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* 最大令牌數 */}
                    <div className="space-y-2">
                      <Label htmlFor="max-tokens">每次請求最大令牌數</Label>
                      <Input
                        id="max-tokens"
                        type="number"
                        min="100"
                        step="100"
                        value={settings.ai.maxTokensPerRequest}
                        onChange={(e) => updateAISettings('maxTokensPerRequest', parseFloat(e.target.value))}
                      />
                      <p className="text-xs text-gray-500">
                        每次 AI 請求的最大令牌數限制
                      </p>
                    </div>
                    
                    {/* 默認溫度 */}
                    <div className="space-y-2">
                      <Label htmlFor="default-temperature">默認溫度</Label>
                      <Input
                        id="default-temperature"
                        type="number"
                        min="0"
                        max="1"
                        step="0.1"
                        value={settings.ai.defaultTemperature}
                        onChange={(e) => updateAISettings('defaultTemperature', parseFloat(e.target.value))}
                      />
                      <p className="text-xs text-gray-500">
                        AI 回覆的默認溫度，較低的值使回覆更加確定和一致，較高的值使回覆更加多樣化和創造性
                      </p>
                    </div>
                  </CardContent>
                </IOSCard>
              </TabsContent>
              
              {/* 功能設置 */}
              <TabsContent value="features">
                <IOSCard>
                  <CardHeader>
                    <CardTitle>功能設置</CardTitle>
                    <CardDescription>
                      啟用或禁用系統功能
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-6">
                    {/* 好友請求 */}
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="enable-friend-requests" className="block">啟用好友請求</Label>
                        <p className="text-xs text-gray-500">
                          允許用戶發送和接收好友請求
                        </p>
                      </div>
                      <Switch
                        id="enable-friend-requests"
                        checked={settings.features.enableFriendRequests}
                        onCheckedChange={(checked) => updateFeatureSettings('enableFriendRequests', checked)}
                      />
                    </div>
                    
                    {/* 群組聊天 */}
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="enable-group-chats" className="block">啟用群組聊天</Label>
                        <p className="text-xs text-gray-500">
                          允許用戶創建和參與群組聊天
                        </p>
                      </div>
                      <Switch
                        id="enable-group-chats"
                        checked={settings.features.enableGroupChats}
                        onCheckedChange={(checked) => updateFeatureSettings('enableGroupChats', checked)}
                      />
                    </div>
                    
                    {/* AI 機器人 */}
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="enable-ai-bots" className="block">啟用 AI 機器人</Label>
                        <p className="text-xs text-gray-500">
                          允許用戶創建和使用 AI 機器人
                        </p>
                      </div>
                      <Switch
                        id="enable-ai-bots"
                        checked={settings.features.enableAIBots}
                        onCheckedChange={(checked) => updateFeatureSettings('enableAIBots', checked)}
                      />
                    </div>
                    
                    {/* 支付功能 */}
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="enable-payments" className="block">啟用支付功能</Label>
                        <p className="text-xs text-gray-500">
                          允許用戶充值和使用付費功能
                        </p>
                      </div>
                      <Switch
                        id="enable-payments"
                        checked={settings.features.enablePayments}
                        onCheckedChange={(checked) => updateFeatureSettings('enablePayments', checked)}
                      />
                    </div>
                  </CardContent>
                </IOSCard>
              </TabsContent>
            </Tabs>
            
            <div className="flex justify-end">
              <IOSButton
                onClick={handleSaveSettings}
                disabled={loading || saving}
              >
                {saving ? '保存中...' : '保存設置'}
              </IOSButton>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
