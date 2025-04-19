'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { BotType, BotConfiguration, createDefaultBotConfiguration } from '@/services/ai/bots';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { FaArrowLeft, FaSave, FaTrash, FaPlus } from 'react-icons/fa';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function EditRobotPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [botType, setBotType] = useState<BotType>(BotType.KNOWLEDGE);
  const [configuration, setConfiguration] = useState<BotConfiguration>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // 加載機器人信息
  useEffect(() => {
    const loadBot = async () => {
      if (!user || !id) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // 獲取機器人信息
        const { data, error: fetchError } = await supabase
          .from('ai_bots')
          .select('*')
          .eq('id', id)
          .eq('owner_id', user.id)
          .single();
        
        if (fetchError) {
          throw fetchError;
        }
        
        if (!data) {
          throw new Error('找不到機器人');
        }
        
        // 設置機器人信息
        setName(data.name);
        setDescription(data.description || '');
        setBotType(data.bot_type as BotType);
        setConfiguration(data.configuration || createDefaultBotConfiguration(data.bot_type as BotType));
      } catch (err: any) {
        setError(err.message || '加載機器人信息時出錯');
      } finally {
        setLoading(false);
      }
    };
    
    loadBot();
  }, [user, id]);
  
  // 處理保存機器人
  const handleSaveBot = async () => {
    if (!user || !id) return;
    
    if (!name.trim()) {
      setError('請輸入機器人名稱');
      return;
    }
    
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);
      
      // 更新機器人
      const { error: updateError } = await supabase
        .from('ai_bots')
        .update({
          name,
          description,
          configuration
        })
        .eq('id', id)
        .eq('owner_id', user.id);
      
      if (updateError) {
        throw updateError;
      }
      
      setSuccess(true);
      
      // 3 秒後清除成功消息
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err: any) {
      setError(err.message || '保存機器人時出錯');
    } finally {
      setSaving(false);
    }
  };
  
  // 更新配置
  const updateConfiguration = (updates: Partial<BotConfiguration>) => {
    setConfiguration(prev => ({
      ...prev,
      ...updates
    }));
  };
  
  // 添加產品
  const addProduct = () => {
    const products = [...(configuration.products || [])];
    products.push({
      id: `product-${Date.now()}`,
      name: '',
      description: '',
      price: 0,
      available: true
    });
    
    updateConfiguration({ products });
  };
  
  // 更新產品
  const updateProduct = (index: number, updates: Partial<any>) => {
    const products = [...(configuration.products || [])];
    products[index] = {
      ...products[index],
      ...updates
    };
    
    updateConfiguration({ products });
  };
  
  // 刪除產品
  const removeProduct = (index: number) => {
    const products = [...(configuration.products || [])];
    products.splice(index, 1);
    
    updateConfiguration({ products });
  };
  
  // 添加支付方式
  const addPaymentMethod = (method: string) => {
    const paymentMethods = [...(configuration.paymentMethods || [])];
    
    if (!paymentMethods.includes(method)) {
      paymentMethods.push(method);
      updateConfiguration({ paymentMethods });
    }
  };
  
  // 刪除支付方式
  const removePaymentMethod = (method: string) => {
    const paymentMethods = [...(configuration.paymentMethods || [])];
    const index = paymentMethods.indexOf(method);
    
    if (index !== -1) {
      paymentMethods.splice(index, 1);
      updateConfiguration({ paymentMethods });
    }
  };
  
  return (
    <ProtectedRoute>
      <div className="container mx-auto p-4">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/robots')}
              className="mr-2"
            >
              <FaArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">編輯 AI 機器人</h1>
          </div>
          
          <Button
            onClick={handleSaveBot}
            disabled={saving || loading}
          >
            <FaSave className="mr-2 h-4 w-4" />
            {saving ? '保存中...' : '保存'}
          </Button>
        </div>
        
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-4 rounded-md bg-green-50 p-4 text-sm text-green-700">
            機器人已保存
          </div>
        )}
        
        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <p className="text-gray-500">加載中...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 基本信息 */}
            <Card>
              <CardHeader>
                <CardTitle>基本信息</CardTitle>
                <CardDescription>
                  設置機器人的基本信息
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
                  <div className="rounded-md bg-gray-50 p-2 text-sm">
                    {botType === BotType.KNOWLEDGE && '知識型 - 基於知識庫回答問題'}
                    {botType === BotType.ORDER && '訂單型 - 處理產品訂購和支付'}
                    {botType === BotType.CUSTOM && '自定義型 - 自定義指令和行為'}
                  </div>
                  <p className="text-xs text-gray-500">
                    機器人類型創建後不可更改。如需更改類型，請創建新機器人。
                  </p>
                </div>
              </CardContent>
            </Card>
            
            {/* 機器人配置 */}
            <Card>
              <CardHeader>
                <CardTitle>機器人配置</CardTitle>
                <CardDescription>
                  根據機器人類型配置相關設置
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <Tabs defaultValue="general">
                  <TabsList className="mb-4 grid w-full grid-cols-2 md:grid-cols-4">
                    <TabsTrigger value="general">通用設置</TabsTrigger>
                    {botType === BotType.KNOWLEDGE && (
                      <TabsTrigger value="knowledge">知識庫</TabsTrigger>
                    )}
                    {botType === BotType.ORDER && (
                      <>
                        <TabsTrigger value="products">產品管理</TabsTrigger>
                        <TabsTrigger value="payment">支付設置</TabsTrigger>
                      </>
                    )}
                    {botType === BotType.CUSTOM && (
                      <TabsTrigger value="custom">自定義指令</TabsTrigger>
                    )}
                  </TabsList>
                  
                  {/* 通用設置 */}
                  <TabsContent value="general" className="space-y-6">
                    {/* 溫度 */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>溫度</Label>
                        <span className="text-sm text-gray-500">
                          {configuration.temperature?.toFixed(1) || '0.7'}
                        </span>
                      </div>
                      <Slider
                        value={[configuration.temperature || 0.7]}
                        min={0}
                        max={1}
                        step={0.1}
                        onValueChange={(value) => updateConfiguration({ temperature: value[0] })}
                      />
                      <p className="text-xs text-gray-500">
                        較低的值使回覆更加確定和一致，較高的值使回覆更加多樣化和創造性。
                      </p>
                    </div>
                    
                    {/* 最大令牌數 */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>最大令牌數</Label>
                        <span className="text-sm text-gray-500">
                          {configuration.maxTokens || '500'}
                        </span>
                      </div>
                      <Slider
                        value={[configuration.maxTokens || 500]}
                        min={100}
                        max={2000}
                        step={100}
                        onValueChange={(value) => updateConfiguration({ maxTokens: value[0] })}
                      />
                      <p className="text-xs text-gray-500">
                        控制回覆的最大長度。較高的值允許更長的回覆，但會增加成本。
                      </p>
                    </div>
                  </TabsContent>
                  
                  {/* 知識庫設置 */}
                  {botType === BotType.KNOWLEDGE && (
                    <TabsContent value="knowledge" className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="knowledgeBase">知識庫內容</Label>
                        <Textarea
                          id="knowledgeBase"
                          value={configuration.knowledgeBase || ''}
                          onChange={(e) => updateConfiguration({ knowledgeBase: e.target.value })}
                          placeholder="輸入機器人應該了解的知識..."
                          rows={10}
                        />
                        <p className="text-xs text-gray-500">
                          輸入機器人應該了解的知識。這些信息將用於回答用戶的問題。
                        </p>
                      </div>
                    </TabsContent>
                  )}
                  
                  {/* 產品管理 */}
                  {botType === BotType.ORDER && (
                    <TabsContent value="products" className="space-y-6">
                      <div className="flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={addProduct}
                        >
                          <FaPlus className="mr-2 h-3 w-3" />
                          添加產品
                        </Button>
                      </div>
                      
                      {(configuration.products || []).length === 0 ? (
                        <div className="flex h-40 flex-col items-center justify-center rounded-md border border-dashed p-4">
                          <p className="mb-2 text-gray-500">沒有產品</p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={addProduct}
                          >
                            <FaPlus className="mr-2 h-3 w-3" />
                            添加產品
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {(configuration.products || []).map((product, index) => (
                            <Card key={product.id}>
                              <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                  <CardTitle className="text-lg">產品 #{index + 1}</CardTitle>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-500 hover:bg-red-50 hover:text-red-600"
                                    onClick={() => removeProduct(index)}
                                  >
                                    <FaTrash className="h-4 w-4" />
                                  </Button>
                                </div>
                              </CardHeader>
                              
                              <CardContent className="space-y-4 pb-2">
                                {/* 產品名稱 */}
                                <div className="space-y-2">
                                  <Label htmlFor={`product-name-${index}`}>產品名稱</Label>
                                  <Input
                                    id={`product-name-${index}`}
                                    value={product.name}
                                    onChange={(e) => updateProduct(index, { name: e.target.value })}
                                    placeholder="例如：高級會員"
                                  />
                                </div>
                                
                                {/* 產品描述 */}
                                <div className="space-y-2">
                                  <Label htmlFor={`product-description-${index}`}>產品描述</Label>
                                  <Textarea
                                    id={`product-description-${index}`}
                                    value={product.description}
                                    onChange={(e) => updateProduct(index, { description: e.target.value })}
                                    placeholder="描述產品的功能和特點..."
                                    rows={2}
                                  />
                                </div>
                                
                                {/* 產品價格 */}
                                <div className="space-y-2">
                                  <Label htmlFor={`product-price-${index}`}>價格 (TWD)</Label>
                                  <Input
                                    id={`product-price-${index}`}
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={product.price}
                                    onChange={(e) => updateProduct(index, { price: parseFloat(e.target.value) })}
                                    placeholder="0"
                                  />
                                </div>
                                
                                {/* 產品可用性 */}
                                <div className="flex items-center justify-between">
                                  <Label htmlFor={`product-available-${index}`}>產品可用</Label>
                                  <Switch
                                    id={`product-available-${index}`}
                                    checked={product.available}
                                    onCheckedChange={(checked) => updateProduct(index, { available: checked })}
                                  />
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </TabsContent>
                  )}
                  
                  {/* 支付設置 */}
                  {botType === BotType.ORDER && (
                    <TabsContent value="payment" className="space-y-6">
                      <div className="space-y-2">
                        <Label>支付方式</Label>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="payment-credit-card"
                              checked={(configuration.paymentMethods || []).includes('信用卡')}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  addPaymentMethod('信用卡');
                                } else {
                                  removePaymentMethod('信用卡');
                                }
                              }}
                            />
                            <Label htmlFor="payment-credit-card">信用卡</Label>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="payment-jkopay"
                              checked={(configuration.paymentMethods || []).includes('街口支付')}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  addPaymentMethod('街口支付');
                                } else {
                                  removePaymentMethod('街口支付');
                                }
                              }}
                            />
                            <Label htmlFor="payment-jkopay">街口支付</Label>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="payment-linepay"
                              checked={(configuration.paymentMethods || []).includes('Line Pay')}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  addPaymentMethod('Line Pay');
                                } else {
                                  removePaymentMethod('Line Pay');
                                }
                              }}
                            />
                            <Label htmlFor="payment-linepay">Line Pay</Label>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  )}
                  
                  {/* 自定義指令 */}
                  {botType === BotType.CUSTOM && (
                    <TabsContent value="custom" className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="customInstructions">自定義指令</Label>
                        <Textarea
                          id="customInstructions"
                          value={configuration.customInstructions || ''}
                          onChange={(e) => updateConfiguration({ customInstructions: e.target.value })}
                          placeholder="輸入機器人的自定義指令..."
                          rows={10}
                        />
                        <p className="text-xs text-gray-500">
                          輸入詳細的指令，告訴機器人應該如何行動和回應。這些指令將指導機器人的行為。
                        </p>
                      </div>
                    </TabsContent>
                  )}
                </Tabs>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
