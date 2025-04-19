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
import { FaArrowLeft, FaPlus, FaMinus, FaSearch, FaUserCircle } from 'react-icons/fa';
import { IOSCard, IOSButton, IOSInput } from '@/components/ui/apple';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

// 用戶餘額接口
interface UserBalance {
  user_id: string;
  balance: number;
  updated_at: string;
  user_email?: string;
  user_name?: string;
}

export default function UserBalancePage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userBalances, setUserBalances] = useState<UserBalance[]>([]);
  const [filteredBalances, setFilteredBalances] = useState<UserBalance[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserBalance | null>(null);
  const [amount, setAmount] = useState('');
  const [operation, setOperation] = useState<'add' | 'subtract'>('add');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
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
  
  // 加載用戶餘額
  useEffect(() => {
    const loadUserBalances = async () => {
      if (!user || !isAdmin) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // 獲取用戶餘額
        const { data: balances, error: balancesError } = await supabase
          .from('user_balance')
          .select('*')
          .order('updated_at', { ascending: false });
        
        if (balancesError) {
          throw balancesError;
        }
        
        // 獲取用戶信息
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, email, full_name');
        
        if (profilesError) {
          throw profilesError;
        }
        
        // 將用戶信息添加到餘額數據中
        const balancesWithUserInfo = balances.map(balance => {
          const userProfile = profiles.find(profile => profile.id === balance.user_id);
          return {
            ...balance,
            user_email: userProfile?.email || 'Unknown',
            user_name: userProfile?.full_name || 'Unknown'
          };
        });
        
        setUserBalances(balancesWithUserInfo);
        setFilteredBalances(balancesWithUserInfo);
      } catch (err: any) {
        setError(err.message || '加載用戶餘額時出錯');
      } finally {
        setLoading(false);
      }
    };
    
    loadUserBalances();
  }, [user, isAdmin, router]);
  
  // 處理搜索
  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setFilteredBalances(userBalances);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = userBalances.filter(
      balance =>
        balance.user_email?.toLowerCase().includes(query) ||
        balance.user_name?.toLowerCase().includes(query)
    );
    
    setFilteredBalances(filtered);
  };
  
  // 處理選擇用戶
  const handleSelectUser = (balance: UserBalance) => {
    setSelectedUser(balance);
    setAmount('');
    setOperation('add');
  };
  
  // 處理更新餘額
  const handleUpdateBalance = async () => {
    if (!user || !isAdmin || !selectedUser) return;
    
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      setError('請輸入有效的金額');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      const amountValue = parseFloat(amount);
      const changeAmount = operation === 'add' ? amountValue : -amountValue;
      
      // 更新用戶餘額
      const { data, error: updateError } = await supabase.rpc('update_user_balance', {
        p_user_id: selectedUser.user_id,
        p_amount: changeAmount
      });
      
      if (updateError) {
        throw updateError;
      }
      
      // 更新本地數據
      setUserBalances(prev => {
        return prev.map(balance => {
          if (balance.user_id === selectedUser.user_id) {
            return {
              ...balance,
              balance: balance.balance + changeAmount,
              updated_at: new Date().toISOString()
            };
          }
          return balance;
        });
      });
      
      setFilteredBalances(prev => {
        return prev.map(balance => {
          if (balance.user_id === selectedUser.user_id) {
            return {
              ...balance,
              balance: balance.balance + changeAmount,
              updated_at: new Date().toISOString()
            };
          }
          return balance;
        });
      });
      
      setSelectedUser(prev => {
        if (prev) {
          return {
            ...prev,
            balance: prev.balance + changeAmount,
            updated_at: new Date().toISOString()
          };
        }
        return prev;
      });
      
      setSuccess(`已${operation === 'add' ? '添加' : '扣除'} NT$${amountValue.toFixed(2)} 到用戶餘額`);
      setAmount('');
    } catch (err: any) {
      setError(err.message || '更新用戶餘額時出錯');
    } finally {
      setLoading(false);
    }
  };
  
  // 格式化餘額
  const formatBalance = (balance: number) => {
    return `NT$${balance.toFixed(2)}`;
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
            <h1 className="text-2xl font-bold">用戶餘額管理</h1>
          </div>
        </div>
        
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-4 rounded-md bg-green-50 p-4 text-sm text-green-700">
            {success}
          </div>
        )}
        
        {loading && !userBalances.length ? (
          <div className="flex h-40 items-center justify-center">
            <p className="text-gray-500">加載中...</p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* 用戶列表 */}
            <div className="lg:col-span-2">
              <IOSCard>
                <CardHeader>
                  <CardTitle>用戶餘額列表</CardTitle>
                  <CardDescription>
                    管理用戶的餘額
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  {/* 搜索框 */}
                  <div className="mb-4 flex space-x-2">
                    <IOSInput
                      placeholder="搜索用戶..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      icon={<FaSearch className="h-4 w-4 text-gray-400" />}
                      className="flex-1"
                    />
                    <IOSButton onClick={handleSearch}>
                      搜索
                    </IOSButton>
                  </div>
                  
                  {/* 用戶列表 */}
                  {filteredBalances.length === 0 ? (
                    <p className="text-gray-500">沒有找到用戶</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
                            <th className="px-4 py-3">用戶</th>
                            <th className="px-4 py-3">餘額</th>
                            <th className="px-4 py-3">更新時間</th>
                            <th className="px-4 py-3">操作</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredBalances.map((balance, index) => (
                            <tr
                              key={balance.user_id}
                              className={`border-b dark:border-gray-700 ${
                                index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'
                              } ${selectedUser?.user_id === balance.user_id ? 'bg-blue-50 dark:bg-blue-900' : ''}`}
                            >
                              <td className="whitespace-nowrap px-4 py-3">
                                <div className="flex items-center">
                                  <FaUserCircle className="mr-2 h-5 w-5 text-gray-400" />
                                  <div>
                                    <div className="font-medium">{balance.user_name}</div>
                                    <div className="text-xs text-gray-500">{balance.user_email}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="whitespace-nowrap px-4 py-3 font-medium">
                                {formatBalance(balance.balance)}
                              </td>
                              <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                                {formatDate(balance.updated_at)}
                              </td>
                              <td className="whitespace-nowrap px-4 py-3">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleSelectUser(balance)}
                                >
                                  選擇
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </IOSCard>
            </div>
            
            {/* 餘額管理 */}
            <div>
              <IOSCard>
                <CardHeader>
                  <CardTitle>餘額管理</CardTitle>
                  <CardDescription>
                    添加或扣除用戶餘額
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  {selectedUser ? (
                    <div className="space-y-4">
                      {/* 用戶信息 */}
                      <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                        <div className="flex items-center">
                          <FaUserCircle className="mr-3 h-10 w-10 text-gray-400" />
                          <div>
                            <div className="text-lg font-medium">{selectedUser.user_name}</div>
                            <div className="text-sm text-gray-500">{selectedUser.user_email}</div>
                            <div className="mt-1 text-sm">
                              當前餘額: <span className="font-medium">{formatBalance(selectedUser.balance)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* 操作選擇 */}
                      <div className="space-y-2">
                        <Label>操作</Label>
                        <div className="flex space-x-2">
                          <Button
                            variant={operation === 'add' ? 'default' : 'outline'}
                            className={operation === 'add' ? 'bg-green-500 hover:bg-green-600' : ''}
                            onClick={() => setOperation('add')}
                          >
                            <FaPlus className="mr-2 h-4 w-4" />
                            添加餘額
                          </Button>
                          <Button
                            variant={operation === 'subtract' ? 'default' : 'outline'}
                            className={operation === 'subtract' ? 'bg-red-500 hover:bg-red-600' : ''}
                            onClick={() => setOperation('subtract')}
                          >
                            <FaMinus className="mr-2 h-4 w-4" />
                            扣除餘額
                          </Button>
                        </div>
                      </div>
                      
                      {/* 金額輸入 */}
                      <div className="space-y-2">
                        <Label htmlFor="amount">金額 (NT$)</Label>
                        <Input
                          id="amount"
                          type="number"
                          min="0"
                          step="0.01"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="0.00"
                        />
                      </div>
                      
                      {/* 提交按鈕 */}
                      <Button
                        className="w-full"
                        onClick={handleUpdateBalance}
                        disabled={loading || !amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0}
                      >
                        {operation === 'add' ? '添加餘額' : '扣除餘額'}
                      </Button>
                    </div>
                  ) : (
                    <div className="flex h-40 flex-col items-center justify-center">
                      <p className="mb-2 text-gray-500">請從左側列表選擇一個用戶</p>
                      <FaUserCircle className="h-10 w-10 text-gray-300" />
                    </div>
                  )}
                </CardContent>
              </IOSCard>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
