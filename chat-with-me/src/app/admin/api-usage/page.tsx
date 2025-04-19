'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FaArrowLeft, FaDownload, FaFilter, FaChartBar, FaTable } from 'react-icons/fa';
import { IOSCard, IOSButton } from '@/components/ui/apple';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

// 使用情況接口
interface UsageData {
  id: string;
  user_id: string;
  api_name: string;
  tokens_used: number;
  cost: number;
  created_at: string;
  user_email?: string;
}

// 使用情況摘要接口
interface UsageSummary {
  api_name: string;
  total_tokens: number;
  total_cost: number;
  total_cost_twd: number;
  usage_count: number;
}

// 用戶使用情況摘要接口
interface UserUsageSummary {
  user_id: string;
  user_email: string;
  total_tokens: number;
  total_cost: number;
  total_cost_twd: number;
  usage_count: number;
}

export default function ApiUsagePage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [usageData, setUsageData] = useState<UsageData[]>([]);
  const [filteredData, setFilteredData] = useState<UsageData[]>([]);
  const [apiSummary, setApiSummary] = useState<UsageSummary[]>([]);
  const [userSummary, setUserSummary] = useState<UserUsageSummary[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [apiFilter, setApiFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');
  const [error, setError] = useState<string | null>(null);
  const [uniqueApis, setUniqueApis] = useState<string[]>([]);
  const [uniqueUsers, setUniqueUsers] = useState<{id: string, email: string}[]>([]);
  
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
  
  // 加載使用情況數據
  useEffect(() => {
    const loadUsageData = async () => {
      if (!user || !isAdmin) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // 獲取使用情況數據
        const { data: usageData, error: usageError } = await supabase
          .from('ai_usage')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (usageError) {
          throw usageError;
        }
        
        // 獲取用戶信息
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, email');
        
        if (profilesError) {
          throw profilesError;
        }
        
        // 將用戶信息添加到使用情況數據中
        const usageWithUserInfo = usageData.map(usage => {
          const userProfile = profiles.find(profile => profile.id === usage.user_id);
          return {
            ...usage,
            user_email: userProfile?.email || 'Unknown'
          };
        });
        
        setUsageData(usageWithUserInfo);
        setFilteredData(usageWithUserInfo);
        
        // 獲取唯一的 API 名稱
        const apis = [...new Set(usageWithUserInfo.map(item => item.api_name))];
        setUniqueApis(apis);
        
        // 獲取唯一的用戶
        const users = profiles.map(profile => ({
          id: profile.id,
          email: profile.email || 'Unknown'
        }));
        setUniqueUsers(users);
        
        // 計算 API 使用情況摘要
        const apiSummary = apis.map(api => {
          const apiUsage = usageWithUserInfo.filter(item => item.api_name === api);
          const totalTokens = apiUsage.reduce((sum, item) => sum + item.tokens_used, 0);
          const totalCost = apiUsage.reduce((sum, item) => sum + item.cost, 0);
          
          return {
            api_name: api,
            total_tokens: totalTokens,
            total_cost: totalCost,
            total_cost_twd: totalCost * 31.5, // 假設匯率為 31.5
            usage_count: apiUsage.length
          };
        });
        setApiSummary(apiSummary);
        
        // 計算用戶使用情況摘要
        const userSummary = users.map(user => {
          const userUsage = usageWithUserInfo.filter(item => item.user_id === user.id);
          const totalTokens = userUsage.reduce((sum, item) => sum + item.tokens_used, 0);
          const totalCost = userUsage.reduce((sum, item) => sum + item.cost, 0);
          
          return {
            user_id: user.id,
            user_email: user.email,
            total_tokens: totalTokens,
            total_cost: totalCost,
            total_cost_twd: totalCost * 31.5, // 假設匯率為 31.5
            usage_count: userUsage.length
          };
        }).filter(summary => summary.usage_count > 0); // 只顯示有使用記錄的用戶
        
        setUserSummary(userSummary);
      } catch (err: any) {
        setError(err.message || '加載使用情況數據時出錯');
      } finally {
        setLoading(false);
      }
    };
    
    loadUsageData();
  }, [user, isAdmin, router]);
  
  // 處理過濾
  const handleFilter = () => {
    let filtered = [...usageData];
    
    // 按日期過濾
    if (startDate) {
      const start = new Date(startDate);
      filtered = filtered.filter(item => new Date(item.created_at) >= start);
    }
    
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter(item => new Date(item.created_at) <= end);
    }
    
    // 按 API 過濾
    if (apiFilter !== 'all') {
      filtered = filtered.filter(item => item.api_name === apiFilter);
    }
    
    // 按用戶過濾
    if (userFilter !== 'all') {
      filtered = filtered.filter(item => item.user_id === userFilter);
    }
    
    setFilteredData(filtered);
    
    // 重新計算 API 使用情況摘要
    const apis = [...new Set(filtered.map(item => item.api_name))];
    const apiSummary = apis.map(api => {
      const apiUsage = filtered.filter(item => item.api_name === api);
      const totalTokens = apiUsage.reduce((sum, item) => sum + item.tokens_used, 0);
      const totalCost = apiUsage.reduce((sum, item) => sum + item.cost, 0);
      
      return {
        api_name: api,
        total_tokens: totalTokens,
        total_cost: totalCost,
        total_cost_twd: totalCost * 31.5, // 假設匯率為 31.5
        usage_count: apiUsage.length
      };
    });
    setApiSummary(apiSummary);
    
    // 重新計算用戶使用情況摘要
    const users = uniqueUsers;
    const userSummary = users.map(user => {
      const userUsage = filtered.filter(item => item.user_id === user.id);
      const totalTokens = userUsage.reduce((sum, item) => sum + item.tokens_used, 0);
      const totalCost = userUsage.reduce((sum, item) => sum + item.cost, 0);
      
      return {
        user_id: user.id,
        user_email: user.email,
        total_tokens: totalTokens,
        total_cost: totalCost,
        total_cost_twd: totalCost * 31.5, // 假設匯率為 31.5
        usage_count: userUsage.length
      };
    }).filter(summary => summary.usage_count > 0); // 只顯示有使用記錄的用戶
    
    setUserSummary(userSummary);
  };
  
  // 處理重置過濾器
  const handleResetFilter = () => {
    setStartDate('');
    setEndDate('');
    setApiFilter('all');
    setUserFilter('all');
    setFilteredData(usageData);
    
    // 重新計算 API 使用情況摘要
    const apis = [...new Set(usageData.map(item => item.api_name))];
    const apiSummary = apis.map(api => {
      const apiUsage = usageData.filter(item => item.api_name === api);
      const totalTokens = apiUsage.reduce((sum, item) => sum + item.tokens_used, 0);
      const totalCost = apiUsage.reduce((sum, item) => sum + item.cost, 0);
      
      return {
        api_name: api,
        total_tokens: totalTokens,
        total_cost: totalCost,
        total_cost_twd: totalCost * 31.5, // 假設匯率為 31.5
        usage_count: apiUsage.length
      };
    });
    setApiSummary(apiSummary);
    
    // 重新計算用戶使用情況摘要
    const users = uniqueUsers;
    const userSummary = users.map(user => {
      const userUsage = usageData.filter(item => item.user_id === user.id);
      const totalTokens = userUsage.reduce((sum, item) => sum + item.tokens_used, 0);
      const totalCost = userUsage.reduce((sum, item) => sum + item.cost, 0);
      
      return {
        user_id: user.id,
        user_email: user.email,
        total_tokens: totalTokens,
        total_cost: totalCost,
        total_cost_twd: totalCost * 31.5, // 假設匯率為 31.5
        usage_count: userUsage.length
      };
    }).filter(summary => summary.usage_count > 0); // 只顯示有使用記錄的用戶
    
    setUserSummary(userSummary);
  };
  
  // 處理導出 CSV
  const handleExportCSV = () => {
    // 創建 CSV 內容
    const headers = ['ID', 'User ID', 'User Email', 'API Name', 'Tokens Used', 'Cost (USD)', 'Cost (TWD)', 'Created At'];
    const rows = filteredData.map(item => [
      item.id,
      item.user_id,
      item.user_email,
      item.api_name,
      item.tokens_used,
      item.cost,
      (item.cost * 31.5).toFixed(2), // 假設匯率為 31.5
      item.created_at
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // 創建 Blob 和下載鏈接
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `api-usage-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // 格式化成本
  const formatCost = (cost: number) => {
    return `$${cost.toFixed(6)}`;
  };
  
  // 格式化新台幣成本
  const formatTWD = (cost: number) => {
    return `NT$${(cost * 31.5).toFixed(2)}`; // 假設匯率為 31.5
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
            <h1 className="text-2xl font-bold">API 使用監控</h1>
          </div>
          
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={handleExportCSV}
              disabled={loading || filteredData.length === 0}
            >
              <FaDownload className="mr-2 h-4 w-4" />
              導出 CSV
            </Button>
          </div>
        </div>
        
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}
        
        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <p className="text-gray-500">加載中...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 過濾器 */}
            <IOSCard>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FaFilter className="mr-2 h-4 w-4" />
                  過濾器
                </CardTitle>
                <CardDescription>
                  過濾 API 使用情況數據
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {/* 開始日期 */}
                  <div className="space-y-2">
                    <Label htmlFor="start-date">開始日期</Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  
                  {/* 結束日期 */}
                  <div className="space-y-2">
                    <Label htmlFor="end-date">結束日期</Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                  
                  {/* API 過濾器 */}
                  <div className="space-y-2">
                    <Label htmlFor="api-filter">API</Label>
                    <Select value={apiFilter} onValueChange={setApiFilter}>
                      <SelectTrigger id="api-filter">
                        <SelectValue placeholder="選擇 API" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">所有 API</SelectItem>
                        {uniqueApis.map(api => (
                          <SelectItem key={api} value={api}>{api}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* 用戶過濾器 */}
                  <div className="space-y-2">
                    <Label htmlFor="user-filter">用戶</Label>
                    <Select value={userFilter} onValueChange={setUserFilter}>
                      <SelectTrigger id="user-filter">
                        <SelectValue placeholder="選擇用戶" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">所有用戶</SelectItem>
                        {uniqueUsers.map(user => (
                          <SelectItem key={user.id} value={user.id}>{user.email}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="mt-4 flex justify-end space-x-2">
                  <Button variant="outline" onClick={handleResetFilter}>
                    重置
                  </Button>
                  <Button onClick={handleFilter}>
                    應用過濾器
                  </Button>
                </div>
              </CardContent>
            </IOSCard>
            
            {/* 使用情況數據 */}
            <IOSCard>
              <CardHeader>
                <CardTitle>使用情況數據</CardTitle>
                <CardDescription>
                  顯示 API 使用情況的詳細數據
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="mb-4 grid w-full grid-cols-3">
                    <TabsTrigger value="overview">
                      <FaChartBar className="mr-2 h-4 w-4" />
                      概覽
                    </TabsTrigger>
                    <TabsTrigger value="api">
                      <FaChartBar className="mr-2 h-4 w-4" />
                      API 統計
                    </TabsTrigger>
                    <TabsTrigger value="details">
                      <FaTable className="mr-2 h-4 w-4" />
                      詳細數據
                    </TabsTrigger>
                  </TabsList>
                  
                  {/* 概覽標籤 */}
                  <TabsContent value="overview">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {/* 總使用量 */}
                      <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900">
                        <h3 className="mb-2 text-sm font-medium text-blue-700 dark:text-blue-300">總使用量</h3>
                        <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                          {filteredData.reduce((sum, item) => sum + item.tokens_used, 0).toLocaleString()} 令牌
                        </p>
                      </div>
                      
                      {/* 總成本 */}
                      <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900">
                        <h3 className="mb-2 text-sm font-medium text-green-700 dark:text-green-300">總成本 (USD)</h3>
                        <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                          ${filteredData.reduce((sum, item) => sum + item.cost, 0).toFixed(2)}
                        </p>
                      </div>
                      
                      {/* 總成本 (TWD) */}
                      <div className="rounded-lg bg-amber-50 p-4 dark:bg-amber-900">
                        <h3 className="mb-2 text-sm font-medium text-amber-700 dark:text-amber-300">總成本 (TWD)</h3>
                        <p className="text-2xl font-bold text-amber-900 dark:text-amber-100">
                          NT${(filteredData.reduce((sum, item) => sum + item.cost, 0) * 31.5).toFixed(2)}
                        </p>
                      </div>
                    </div>
                    
                    {/* 用戶使用情況摘要 */}
                    <div className="mt-6">
                      <h3 className="mb-4 text-lg font-medium">用戶使用情況摘要</h3>
                      
                      {userSummary.length === 0 ? (
                        <p className="text-gray-500">沒有使用記錄</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="border-b bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
                                <th className="px-4 py-3">用戶</th>
                                <th className="px-4 py-3">使用次數</th>
                                <th className="px-4 py-3">總令牌數</th>
                                <th className="px-4 py-3">總成本 (USD)</th>
                                <th className="px-4 py-3">總成本 (TWD)</th>
                              </tr>
                            </thead>
                            <tbody>
                              {userSummary.map((summary, index) => (
                                <tr
                                  key={summary.user_id}
                                  className={`border-b dark:border-gray-700 ${
                                    index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'
                                  }`}
                                >
                                  <td className="whitespace-nowrap px-4 py-3">{summary.user_email}</td>
                                  <td className="whitespace-nowrap px-4 py-3">{summary.usage_count}</td>
                                  <td className="whitespace-nowrap px-4 py-3">{summary.total_tokens.toLocaleString()}</td>
                                  <td className="whitespace-nowrap px-4 py-3">${summary.total_cost.toFixed(6)}</td>
                                  <td className="whitespace-nowrap px-4 py-3">NT${summary.total_cost_twd.toFixed(2)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  
                  {/* API 統計標籤 */}
                  <TabsContent value="api">
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
                            <th className="px-4 py-3">API</th>
                            <th className="px-4 py-3">使用次數</th>
                            <th className="px-4 py-3">總令牌數</th>
                            <th className="px-4 py-3">總成本 (USD)</th>
                            <th className="px-4 py-3">總成本 (TWD)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {apiSummary.map((summary, index) => (
                            <tr
                              key={summary.api_name}
                              className={`border-b dark:border-gray-700 ${
                                index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'
                              }`}
                            >
                              <td className="whitespace-nowrap px-4 py-3">{summary.api_name}</td>
                              <td className="whitespace-nowrap px-4 py-3">{summary.usage_count}</td>
                              <td className="whitespace-nowrap px-4 py-3">{summary.total_tokens.toLocaleString()}</td>
                              <td className="whitespace-nowrap px-4 py-3">${summary.total_cost.toFixed(6)}</td>
                              <td className="whitespace-nowrap px-4 py-3">NT${summary.total_cost_twd.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </TabsContent>
                  
                  {/* 詳細數據標籤 */}
                  <TabsContent value="details">
                    {filteredData.length === 0 ? (
                      <p className="text-gray-500">沒有使用記錄</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="border-b bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
                              <th className="px-4 py-3">時間</th>
                              <th className="px-4 py-3">用戶</th>
                              <th className="px-4 py-3">API</th>
                              <th className="px-4 py-3">令牌數</th>
                              <th className="px-4 py-3">成本 (USD)</th>
                              <th className="px-4 py-3">成本 (TWD)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredData.map((item, index) => (
                              <tr
                                key={item.id}
                                className={`border-b dark:border-gray-700 ${
                                  index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'
                                }`}
                              >
                                <td className="whitespace-nowrap px-4 py-3">{formatDate(item.created_at)}</td>
                                <td className="whitespace-nowrap px-4 py-3">{item.user_email}</td>
                                <td className="whitespace-nowrap px-4 py-3">{item.api_name}</td>
                                <td className="whitespace-nowrap px-4 py-3">{item.tokens_used.toLocaleString()}</td>
                                <td className="whitespace-nowrap px-4 py-3">{formatCost(item.cost)}</td>
                                <td className="whitespace-nowrap px-4 py-3">{formatTWD(item.cost)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </IOSCard>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
