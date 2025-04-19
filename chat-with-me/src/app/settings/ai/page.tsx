'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useChatSuggestions, useSimulatedReplies } from '@/hooks/useAI';
import { SuggestionType } from '@/services/ai/suggestions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function AISettingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { settings: suggestionSettings, updateSettings: updateSuggestionSettings } = useChatSuggestions();
  const { settings: simulationSettings, updateSettings: updateSimulationSettings } = useSimulatedReplies();
  
  const [localSuggestionSettings, setLocalSuggestionSettings] = useState(suggestionSettings);
  const [localSimulationSettings, setLocalSimulationSettings] = useState(simulationSettings);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 當設置變化時更新本地設置
  useEffect(() => {
    setLocalSuggestionSettings(suggestionSettings);
  }, [suggestionSettings]);
  
  useEffect(() => {
    setLocalSimulationSettings(simulationSettings);
  }, [simulationSettings]);
  
  // 處理建議設置變化
  const handleSuggestionSettingChange = (key: string, value: any) => {
    setLocalSuggestionSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  // 處理模擬設置變化
  const handleSimulationSettingChange = (key: string, value: any) => {
    setLocalSimulationSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  // 處理建議類型變化
  const handleSuggestionTypeChange = (type: SuggestionType, checked: boolean) => {
    setLocalSuggestionSettings(prev => {
      const types = checked 
        ? [...prev.includeTypes, type]
        : prev.includeTypes.filter(t => t !== type);
      
      return {
        ...prev,
        includeTypes: types
      };
    });
  };
  
  // 處理保存設置
  const handleSaveSettings = () => {
    try {
      setError(null);
      
      // 更新建議設置
      updateSuggestionSettings(localSuggestionSettings);
      
      // 更新模擬設置
      updateSimulationSettings(localSimulationSettings);
      
      setSuccess(true);
      
      // 3 秒後清除成功消息
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err: any) {
      setError(err.message || '保存設置時出錯');
    }
  };
  
  // 處理重置設置
  const handleResetSettings = () => {
    setLocalSuggestionSettings(suggestionSettings);
    setLocalSimulationSettings(simulationSettings);
  };
  
  return (
    <ProtectedRoute>
      <div className="container mx-auto p-4">
        <h1 className="mb-6 text-2xl font-bold">AI 輔助設置</h1>
        
        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-6 rounded-md bg-green-50 p-4 text-sm text-green-700">
            設置已保存
          </div>
        )}
        
        <Tabs defaultValue="suggestions">
          <TabsList className="mb-4 grid w-full grid-cols-2">
            <TabsTrigger value="suggestions">聊天建議</TabsTrigger>
            <TabsTrigger value="simulation">模擬回覆</TabsTrigger>
          </TabsList>
          
          {/* 聊天建議設置 */}
          <TabsContent value="suggestions">
            <Card>
              <CardHeader>
                <CardTitle>聊天建議設置</CardTitle>
                <CardDescription>
                  自定義 AI 如何為您提供聊天建議
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 建議數量 */}
                <div className="space-y-2">
                  <Label>建議數量</Label>
                  <div className="flex items-center space-x-4">
                    <Slider
                      value={[localSuggestionSettings.count]}
                      min={1}
                      max={5}
                      step={1}
                      onValueChange={(value) => handleSuggestionSettingChange('count', value[0])}
                      className="w-64"
                    />
                    <span className="w-8 text-center">{localSuggestionSettings.count}</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    每次顯示的建議數量
                  </p>
                </div>
                
                {/* 建議類型 */}
                <div className="space-y-2">
                  <Label>建議類型</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="type-reply"
                        checked={localSuggestionSettings.includeTypes.includes(SuggestionType.REPLY)}
                        onCheckedChange={(checked) => 
                          handleSuggestionTypeChange(SuggestionType.REPLY, checked as boolean)
                        }
                      />
                      <Label htmlFor="type-reply" className="cursor-pointer">一般回覆</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="type-question"
                        checked={localSuggestionSettings.includeTypes.includes(SuggestionType.QUESTION)}
                        onCheckedChange={(checked) => 
                          handleSuggestionTypeChange(SuggestionType.QUESTION, checked as boolean)
                        }
                      />
                      <Label htmlFor="type-question" className="cursor-pointer">提問</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="type-emotion"
                        checked={localSuggestionSettings.includeTypes.includes(SuggestionType.EMOTION)}
                        onCheckedChange={(checked) => 
                          handleSuggestionTypeChange(SuggestionType.EMOTION, checked as boolean)
                        }
                      />
                      <Label htmlFor="type-emotion" className="cursor-pointer">情感表達</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="type-action"
                        checked={localSuggestionSettings.includeTypes.includes(SuggestionType.ACTION)}
                        onCheckedChange={(checked) => 
                          handleSuggestionTypeChange(SuggestionType.ACTION, checked as boolean)
                        }
                      />
                      <Label htmlFor="type-action" className="cursor-pointer">行動建議</Label>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    選擇您想要接收的建議類型
                  </p>
                </div>
                
                {/* 建議語言 */}
                <div className="space-y-2">
                  <Label>建議語言</Label>
                  <Select
                    value={localSuggestionSettings.language}
                    onValueChange={(value) => handleSuggestionSettingChange('language', value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="選擇語言" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="中文">繁體中文</SelectItem>
                      <SelectItem value="简体中文">簡體中文</SelectItem>
                      <SelectItem value="English">英文</SelectItem>
                      <SelectItem value="日本語">日文</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    建議的語言
                  </p>
                </div>
                
                {/* 建議長度 */}
                <div className="space-y-2">
                  <Label>最大長度</Label>
                  <div className="flex items-center space-x-4">
                    <Slider
                      value={[localSuggestionSettings.maxLength]}
                      min={20}
                      max={100}
                      step={10}
                      onValueChange={(value) => handleSuggestionSettingChange('maxLength', value[0])}
                      className="w-64"
                    />
                    <span className="w-8 text-center">{localSuggestionSettings.maxLength}</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    建議的最大字符數
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* 模擬回覆設置 */}
          <TabsContent value="simulation">
            <Card>
              <CardHeader>
                <CardTitle>模擬回覆設置</CardTitle>
                <CardDescription>
                  自定義 AI 如何模擬不活躍用戶的回覆
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 啟用模擬回覆 */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enable-simulation" className="block">啟用模擬回覆</Label>
                    <p className="text-xs text-gray-500">
                      當聊天中的用戶不活躍時，AI 將模擬他們的回覆
                    </p>
                  </div>
                  <Switch
                    id="enable-simulation"
                    checked={localSimulationSettings.simulationProbability > 0}
                    onCheckedChange={(checked) => 
                      handleSimulationSettingChange('simulationProbability', checked ? 0.8 : 0)
                    }
                  />
                </div>
                
                {/* 模擬機率 */}
                {localSimulationSettings.simulationProbability > 0 && (
                  <div className="space-y-2">
                    <Label>模擬機率</Label>
                    <div className="flex items-center space-x-4">
                      <Slider
                        value={[localSimulationSettings.simulationProbability * 100]}
                        min={10}
                        max={100}
                        step={10}
                        onValueChange={(value) => 
                          handleSimulationSettingChange('simulationProbability', value[0] / 100)
                        }
                        className="w-64"
                      />
                      <span className="w-8 text-center">{Math.round(localSimulationSettings.simulationProbability * 100)}%</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      AI 嘗試模擬不活躍用戶回覆的機率
                    </p>
                  </div>
                )}
                
                {/* 不活躍閾值 */}
                <div className="space-y-2">
                  <Label>不活躍閾值</Label>
                  <Select
                    value={(localSimulationSettings.inactivityThreshold / (60 * 60 * 1000)).toString()}
                    onValueChange={(value) => 
                      handleSimulationSettingChange('inactivityThreshold', parseInt(value) * 60 * 60 * 1000)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="選擇時間" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 小時</SelectItem>
                      <SelectItem value="3">3 小時</SelectItem>
                      <SelectItem value="6">6 小時</SelectItem>
                      <SelectItem value="12">12 小時</SelectItem>
                      <SelectItem value="24">24 小時</SelectItem>
                      <SelectItem value="48">2 天</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    用戶多長時間不活躍後才會被模擬
                  </p>
                </div>
                
                {/* 回覆風格 */}
                <div className="space-y-2">
                  <Label>回覆風格</Label>
                  <Input
                    value={localSimulationSettings.responseStyle}
                    onChange={(e) => handleSimulationSettingChange('responseStyle', e.target.value)}
                    placeholder="例如：簡短、詳細、正式、隨意等"
                  />
                  <p className="text-xs text-gray-500">
                    模擬回覆的風格特點
                  </p>
                </div>
                
                {/* 回覆長度 */}
                <div className="space-y-2">
                  <Label>回覆長度</Label>
                  <RadioGroup
                    value={localSimulationSettings.responseLength}
                    onValueChange={(value) => 
                      handleSimulationSettingChange('responseLength', value)
                    }
                    className="flex space-x-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="short" id="length-short" />
                      <Label htmlFor="length-short">簡短</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="medium" id="length-medium" />
                      <Label htmlFor="length-medium">中等</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="long" id="length-long" />
                      <Label htmlFor="length-long">較長</Label>
                    </div>
                  </RadioGroup>
                  <p className="text-xs text-gray-500">
                    模擬回覆的長度
                  </p>
                </div>
                
                {/* 回覆延遲 */}
                <div className="space-y-2">
                  <Label>回覆延遲 (秒)</Label>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1">
                      <Label className="text-xs">最小</Label>
                      <Slider
                        value={[localSimulationSettings.minDelay / 1000]}
                        min={1}
                        max={30}
                        step={1}
                        onValueChange={(value) => 
                          handleSimulationSettingChange('minDelay', value[0] * 1000)
                        }
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>1</span>
                        <span>30</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <Label className="text-xs">最大</Label>
                      <Slider
                        value={[localSimulationSettings.maxDelay / 1000]}
                        min={5}
                        max={60}
                        step={1}
                        onValueChange={(value) => 
                          handleSimulationSettingChange('maxDelay', value[0] * 1000)
                        }
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>5</span>
                        <span>60</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    模擬回覆的延遲時間範圍 (當前: {localSimulationSettings.minDelay / 1000}-{localSimulationSettings.maxDelay / 1000} 秒)
                  </p>
                </div>
                
                {/* 上下文分析 */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="context-analysis" className="block">上下文分析</Label>
                    <p className="text-xs text-gray-500">
                      分析聊天上下文以選擇最適合回覆的用戶
                    </p>
                  </div>
                  <Switch
                    id="context-analysis"
                    checked={localSimulationSettings.contextAnalysis}
                    onCheckedChange={(checked) => 
                      handleSimulationSettingChange('contextAnalysis', checked)
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <div className="mt-6 flex justify-end space-x-4">
          <Button variant="outline" onClick={handleResetSettings}>
            重置
          </Button>
          <Button onClick={handleSaveSettings}>
            保存設置
          </Button>
        </div>
      </div>
    </ProtectedRoute>
  );
}
