'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { AIServiceType, getAvailableAIServiceTypes, getDefaultAIServiceType } from '@/services/ai';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FaArrowLeft, FaSave, FaRedo } from 'react-icons/fa';
import { IOSCard, IOSButton } from '@/components/ui/apple';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

// LLM 配置接口
interface LLMConfig {
  defaultService: AIServiceType | null;
  services: {
    [key in AIServiceType]?: {
      enabled: boolean;
      defaultTemperature: number;
      defaultMaxTokens: number;
      customSystemPrompt: string;
    };
  };
}

export default function LLMConfigPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<LLMConfig>({
    defaultService: null,
    services: {}
  });
  const [availableServices, setAvailableServices] = useState<AIServiceType[]>([]);
  const [activeTab, setActiveTab] = useState<string>('general');
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
  
  // 加載配置
  useEffect(() => {
    const loadConfig = async () => {
      if (!user || !isAdmin) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // 獲取可用的 AI 服務類型
        const availableTypes = getAvailableAIServiceTypes();
        setAvailableServices(availableTypes);
        
        // 獲取默認 AI 服務類型
        const defaultType = getDefaultAIServiceType();
        
        // 獲取 LLM 配置
        const { data, error } = await supabase
          .from('admin_config')
          .select('value')
          .eq('key', 'llm_config')
          .single();
        
        if (error && error.code !== 'PGRST116') { // PGRST116 是 "沒有找到結果" 的錯誤代碼
          throw error;
        }
        
        let configData: LLMConfig;
        
        if (data) {
          configData = data.value as LLMConfig;
        } else {
          // 創建默認配置
          configData = {
            defaultService: defaultType,
            services: {}
          };
          
          // 為每個可用的服務創建默認配置
          availableTypes.forEach(type => {
            configData.services[type] = {
              enabled: true,
              defaultTemperature: 0.7,
              defaultMaxTokens: 1000,
              customSystemPrompt: ''
            };
          });
        }
        
        setConfig(configData);
        
        // 設置活動標籤
        if (availableTypes.length > 0) {
          setActiveTab(availableTypes[0]);
        } else {
          setActiveTab('general');
        }
      } catch (err: any) {
        setError(err.message || '加載配置時出錯');
      } finally {
        setLoading(false);
      }
    };
    
    loadConfig();
  }, [user, isAdmin, router]);
  
  // 處理保存配置
  const handleSaveConfig = async () => {
    if (!user || !isAdmin) return;
    
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);
      
      // 保存 LLM 配置
      const { error } = await supabase
        .from('admin_config')
        .upsert({
          key: 'llm_config',
          value: config,
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
      setError(err.message || '保存配置時出錯');
    } finally {
      setSaving(false);
    }
  };
  
  // 處理重置配置
  const handleResetConfig = async () => {
    if (!user || !isAdmin) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // 獲取可用的 AI 服務類型
      const availableTypes = getAvailableAIServiceTypes();
      
      // 獲取默認 AI 服務類型
      const defaultType = getDefaultAIServiceType();
      
      // 創建默認配置
      const defaultConfig: LLMConfig = {
        defaultService: defaultType,
        services: {}
      };
      
      // 為每個可用的服務創建默認配置
      availableTypes.forEach(type => {
        defaultConfig.services[type] = {
          enabled: true,
          defaultTemperature: 0.7,
          defaultMaxTokens: 1000,
          customSystemPrompt: ''
        };
      });
      
      setConfig(defaultConfig);
    } catch (err: any) {
      setError(err.message || '重置配置時出錯');
    } finally {
      setLoading(false);
    }
  };
  
  // 更新服務配置
  const updateServiceConfig = (service: AIServiceType, key: string, value: any) => {
    setConfig(prev => {
      const newConfig = { ...prev };
      
      if (!newConfig.services[service]) {
        newConfig.services[service] = {
          enabled: true,
          defaultTemperature: 0.7,
          defaultMaxTokens: 1000,
          customSystemPrompt: ''
        };
      }
      
      (newConfig.services[service] as any)[key] = value;
      
      return newConfig;
    });
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
            <h1 className="text-2xl font-bold">LLM 參數配置</h1>
          </div>
          
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={handleResetConfig}
              disabled={loading || saving}
            >
              <FaRedo className="mr-2 h-4 w-4" />
              重置
            </Button>
            <Button
              onClick={handleSaveConfig}
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
            配置已保存
          </div>
        )}
        
        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <p className="text-gray-500">加載中...</p>
          </div>
        ) : (
          <div className="space-y-6">
            <IOSCard>
              <CardHeader>
                <CardTitle>通用設置</CardTitle>
                <CardDescription>
                  配置 LLM 的通用參數
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* 默認 AI 服務 */}
                <div className="space-y-2">
                  <Label htmlFor="default-service">默認 AI 服務</Label>
                  <Select
                    value={config.defaultService || ''}
                    onValueChange={(value) => setConfig(prev => ({ ...prev, defaultService: value as AIServiceType }))}
                  >
                    <SelectTrigger id="default-service">
                      <SelectValue placeholder="選擇默認 AI 服務" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableServices.map(service => (
                        <SelectItem key={service} value={service}>
                          {service === AIServiceType.DEEPSEEK ? 'DeepSeek' : 'Claude'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    當沒有指定 AI 服務時，將使用此服務
                  </p>
                </div>
              </CardContent>
            </IOSCard>
            
            <IOSCard>
              <CardHeader>
                <CardTitle>服務配置</CardTitle>
                <CardDescription>
                  配置每個 AI 服務的參數
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="mb-4">
                    {availableServices.map(service => (
                      <TabsTrigger key={service} value={service}>
                        {service === AIServiceType.DEEPSEEK ? 'DeepSeek' : 'Claude'}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  
                  {availableServices.map(service => (
                    <TabsContent key={service} value={service} className="space-y-6">
                      {/* 啟用服務 */}
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor={`enable-${service}`}>啟用服務</Label>
                          <p className="text-xs text-gray-500">
                            是否啟用此 AI 服務
                          </p>
                        </div>
                        <Switch
                          id={`enable-${service}`}
                          checked={config.services[service]?.enabled || false}
                          onCheckedChange={(checked) => updateServiceConfig(service, 'enabled', checked)}
                        />
                      </div>
                      
                      {/* 默認溫度 */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>默認溫度</Label>
                          <span className="text-sm text-gray-500">
                            {config.services[service]?.defaultTemperature.toFixed(1) || '0.7'}
                          </span>
                        </div>
                        <Slider
                          value={[config.services[service]?.defaultTemperature || 0.7]}
                          min={0}
                          max={1}
                          step={0.1}
                          onValueChange={(value) => updateServiceConfig(service, 'defaultTemperature', value[0])}
                        />
                        <p className="text-xs text-gray-500">
                          較低的值使回覆更加確定和一致，較高的值使回覆更加多樣化和創造性
                        </p>
                      </div>
                      
                      {/* 默認最大令牌數 */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>默認最大令牌數</Label>
                          <span className="text-sm text-gray-500">
                            {config.services[service]?.defaultMaxTokens || '1000'}
                          </span>
                        </div>
                        <Slider
                          value={[config.services[service]?.defaultMaxTokens || 1000]}
                          min={100}
                          max={4000}
                          step={100}
                          onValueChange={(value) => updateServiceConfig(service, 'defaultMaxTokens', value[0])}
                        />
                        <p className="text-xs text-gray-500">
                          控制回覆的最大長度，較高的值允許更長的回覆，但會增加成本
                        </p>
                      </div>
                      
                      {/* 自定義系統提示 */}
                      <div className="space-y-2">
                        <Label htmlFor={`system-prompt-${service}`}>自定義系統提示</Label>
                        <textarea
                          id={`system-prompt-${service}`}
                          className="h-32 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          value={config.services[service]?.customSystemPrompt || ''}
                          onChange={(e) => updateServiceConfig(service, 'customSystemPrompt', e.target.value)}
                          placeholder="輸入自定義系統提示..."
                        />
                        <p className="text-xs text-gray-500">
                          自定義系統提示將用於所有使用此服務的對話，除非被特定對話的系統提示覆蓋
                        </p>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
              
              <CardFooter className="flex justify-end">
                <IOSButton
                  onClick={handleSaveConfig}
                  disabled={loading || saving}
                >
                  {saving ? '保存中...' : '保存配置'}
                </IOSButton>
              </CardFooter>
            </IOSCard>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
