'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { FaArrowLeft, FaSearch, FaUserCircle, FaUserCog, FaUserSlash, FaUserCheck } from 'react-icons/fa';
import { IOSCard, IOSButton, IOSInput } from '@/components/ui/apple';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

// 用戶接口
interface User {
  id: string;
  email: string;
  full_name: string;
  is_admin: boolean;
  is_blocked: boolean;
  created_at: string;
  last_sign_in: string;
}

export default function UsersManagementPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
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
  
  // 加載用戶列表
  useEffect(() => {
    const loadUsers = async () => {
      if (!user || !isAdmin) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // 獲取用戶列表
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) {
          throw error;
        }
        
        setUsers(data);
        setFilteredUsers(data);
      } catch (err: any) {
        setError(err.message || '加載用戶列表時出錯');
      } finally {
        setLoading(false);
      }
    };
    
    loadUsers();
  }, [user, isAdmin, router]);
  
  // 處理搜索
  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setFilteredUsers(users);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = users.filter(
      user =>
        user.email?.toLowerCase().includes(query) ||
        user.full_name?.toLowerCase().includes(query)
    );
    
    setFilteredUsers(filtered);
  };
  
  // 處理選擇用戶
  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
  };
  
  // 處理更新用戶
  const handleUpdateUser = async (updates: Partial<User>) => {
    if (!user || !isAdmin || !selectedUser) return;
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      // 更新用戶
      const { data, error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', selectedUser.id)
        .select()
        .single();
      
      if (updateError) {
        throw updateError;
      }
      
      // 更新本地數據
      setUsers(prev => {
        return prev.map(u => {
          if (u.id === selectedUser.id) {
            return { ...u, ...updates };
          }
          return u;
        });
      });
      
      setFilteredUsers(prev => {
        return prev.map(u => {
          if (u.id === selectedUser.id) {
            return { ...u, ...updates };
          }
          return u;
        });
      });
      
      setSelectedUser(prev => {
        if (prev) {
          return { ...prev, ...updates };
        }
        return prev;
      });
      
      setSuccess('用戶已更新');
      
      // 3 秒後清除成功消息
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err: any) {
      setError(err.message || '更新用戶時出錯');
    } finally {
      setLoading(false);
    }
  };
  
  // 格式化日期
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    
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
            <h1 className="text-2xl font-bold">用戶管理</h1>
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
        
        {loading && !users.length ? (
          <div className="flex h-40 items-center justify-center">
            <p className="text-gray-500">加載中...</p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* 用戶列表 */}
            <div className="lg:col-span-2">
              <IOSCard>
                <CardHeader>
                  <CardTitle>用戶列表</CardTitle>
                  <CardDescription>
                    管理系統用戶
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
                  {filteredUsers.length === 0 ? (
                    <p className="text-gray-500">沒有找到用戶</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
                            <th className="px-4 py-3">用戶</th>
                            <th className="px-4 py-3">狀態</th>
                            <th className="px-4 py-3">註冊時間</th>
                            <th className="px-4 py-3">最後登錄</th>
                            <th className="px-4 py-3">操作</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredUsers.map((user, index) => (
                            <tr
                              key={user.id}
                              className={`border-b dark:border-gray-700 ${
                                index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'
                              } ${selectedUser?.id === user.id ? 'bg-blue-50 dark:bg-blue-900' : ''}`}
                            >
                              <td className="whitespace-nowrap px-4 py-3">
                                <div className="flex items-center">
                                  <FaUserCircle className="mr-2 h-5 w-5 text-gray-400" />
                                  <div>
                                    <div className="font-medium">{user.full_name || 'N/A'}</div>
                                    <div className="text-xs text-gray-500">{user.email}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="whitespace-nowrap px-4 py-3">
                                {user.is_blocked ? (
                                  <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800">
                                    已封禁
                                  </span>
                                ) : user.is_admin ? (
                                  <span className="rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-800">
                                    管理員
                                  </span>
                                ) : (
                                  <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                                    正常
                                  </span>
                                )}
                              </td>
                              <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                                {formatDate(user.created_at)}
                              </td>
                              <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                                {formatDate(user.last_sign_in)}
                              </td>
                              <td className="whitespace-nowrap px-4 py-3">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleSelectUser(user)}
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
            
            {/* 用戶管理 */}
            <div>
              <IOSCard>
                <CardHeader>
                  <CardTitle>用戶管理</CardTitle>
                  <CardDescription>
                    管理用戶權限和狀態
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
                            <div className="text-lg font-medium">{selectedUser.full_name || 'N/A'}</div>
                            <div className="text-sm text-gray-500">{selectedUser.email}</div>
                            <div className="mt-1 text-sm">
                              註冊時間: <span className="font-medium">{formatDate(selectedUser.created_at)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* 管理員權限 */}
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="is-admin" className="block">管理員權限</Label>
                          <p className="text-xs text-gray-500">
                            授予用戶管理員權限
                          </p>
                        </div>
                        <Switch
                          id="is-admin"
                          checked={selectedUser.is_admin}
                          onCheckedChange={(checked) => handleUpdateUser({ is_admin: checked })}
                          disabled={selectedUser.id === user?.id} // 不能更改自己的管理員權限
                        />
                      </div>
                      
                      {/* 封禁用戶 */}
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="is-blocked" className="block">封禁用戶</Label>
                          <p className="text-xs text-gray-500">
                            封禁用戶將阻止其登錄和使用系統
                          </p>
                        </div>
                        <Switch
                          id="is-blocked"
                          checked={selectedUser.is_blocked}
                          onCheckedChange={(checked) => handleUpdateUser({ is_blocked: checked })}
                          disabled={selectedUser.id === user?.id} // 不能封禁自己
                        />
                      </div>
                      
                      {/* 操作按鈕 */}
                      <div className="mt-6 grid grid-cols-2 gap-2">
                        {selectedUser.is_admin ? (
                          <Button
                            variant="outline"
                            className="text-purple-600 hover:bg-purple-50 hover:text-purple-700"
                            onClick={() => handleUpdateUser({ is_admin: false })}
                            disabled={selectedUser.id === user?.id} // 不能更改自己的管理員權限
                          >
                            <FaUserCog className="mr-2 h-4 w-4" />
                            移除管理員
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            className="text-purple-600 hover:bg-purple-50 hover:text-purple-700"
                            onClick={() => handleUpdateUser({ is_admin: true })}
                            disabled={selectedUser.id === user?.id} // 不能更改自己的管理員權限
                          >
                            <FaUserCog className="mr-2 h-4 w-4" />
                            設為管理員
                          </Button>
                        )}
                        
                        {selectedUser.is_blocked ? (
                          <Button
                            variant="outline"
                            className="text-green-600 hover:bg-green-50 hover:text-green-700"
                            onClick={() => handleUpdateUser({ is_blocked: false })}
                            disabled={selectedUser.id === user?.id} // 不能封禁自己
                          >
                            <FaUserCheck className="mr-2 h-4 w-4" />
                            解除封禁
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={() => handleUpdateUser({ is_blocked: true })}
                            disabled={selectedUser.id === user?.id} // 不能封禁自己
                          >
                            <FaUserSlash className="mr-2 h-4 w-4" />
                            封禁用戶
                          </Button>
                        )}
                      </div>
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
