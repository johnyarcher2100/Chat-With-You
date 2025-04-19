'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { FaChartBar, FaCog, FaMoneyBill, FaRobot, FaUsers, FaArrowLeft } from 'react-icons/fa';
import { IOSCard } from '@/components/ui/apple';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

// 統計數據接口
interface Stats {
  totalUsers: number;
  activeUsers: number;
  totalTokensUsed: number;
  totalCost: number;
  aiBotsCount: number;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    activeUsers: 0,
    totalTokensUsed: 0,
    totalCost: 0,
    aiBotsCount: 0
  });
  const [error, setError] = useState<string | null>(null);
  
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
  
  // 加載統計數據
  useEffect(() => {
    const loadStats = async () => {
      if (!user || !isAdmin) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // 獲取用戶數量
        const { count: totalUsers, error: usersError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });
        
        if (usersError) {
          throw usersError;
        }
        
        // 獲取活躍用戶數量（過去 7 天有登錄的用戶）
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const { count: activeUsers, error: activeUsersError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .gte('last_sign_in', sevenDaysAgo.toISOString());
        
        if (activeUsersError) {
          throw activeUsersError;
        }
        
        // 獲取 AI 使用情況
        const { data: aiUsage, error: aiUsageError } = await supabase
          .from('ai_usage')
          .select('tokens_used, cost');
        
        if (aiUsageError) {
          throw aiUsageError;
        }
        
        const totalTokensUsed = aiUsage.reduce((sum, item) => sum + item.tokens_used, 0);
        const totalCost = aiUsage.reduce((sum, item) => sum + item.cost, 0);
        
        // 獲取 AI 機器人數量
        const { count: aiBotsCount, error: aiBotsError } = await supabase
          .from('ai_bots')
          .select('*', { count: 'exact', head: true });
        
        if (aiBotsError) {
          throw aiBotsError;
        }
        
        setStats({
          totalUsers: totalUsers || 0,
          activeUsers: activeUsers || 0,
          totalTokensUsed,
          totalCost,
          aiBotsCount: aiBotsCount || 0
        });
      } catch (err: any) {
        setError(err.message || '加載統計數據時出錯');
      } finally {
        setLoading(false);
      }
    };
    
    loadStats();
  }, [user, isAdmin, router]);
  
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
              onClick={() => router.push('/dashboard')}
              className="mr-2"
            >
              <FaArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">管理員儀表板</h1>
          </div>
        </div>
        
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}
        
        {/* 統計卡片 */}
        <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {/* 總用戶數 */}
          <IOSCard className="bg-blue-50 dark:bg-blue-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">總用戶數</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {loading ? '...' : stats.totalUsers.toLocaleString()}
              </p>
            </CardContent>
          </IOSCard>
          
          {/* 活躍用戶數 */}
          <IOSCard className="bg-green-50 dark:bg-green-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">活躍用戶數</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                {loading ? '...' : stats.activeUsers.toLocaleString()}
              </p>
            </CardContent>
          </IOSCard>
          
          {/* 總令牌數 */}
          <IOSCard className="bg-purple-50 dark:bg-purple-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">總令牌數</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                {loading ? '...' : stats.totalTokensUsed.toLocaleString()}
              </p>
            </CardContent>
          </IOSCard>
          
          {/* 總成本 */}
          <IOSCard className="bg-amber-50 dark:bg-amber-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-300">總成本 (USD)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-amber-900 dark:text-amber-100">
                {loading ? '...' : `$${stats.totalCost.toFixed(2)}`}
              </p>
            </CardContent>
          </IOSCard>
          
          {/* AI 機器人數量 */}
          <IOSCard className="bg-indigo-50 dark:bg-indigo-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-indigo-700 dark:text-indigo-300">AI 機器人數量</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">
                {loading ? '...' : stats.aiBotsCount.toLocaleString()}
              </p>
            </CardContent>
          </IOSCard>
        </div>
        
        {/* 管理功能卡片 */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* LLM 參數配置 */}
          <Card className="hover:shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FaRobot className="mr-2 h-5 w-5 text-primary" />
                LLM 參數配置
              </CardTitle>
              <CardDescription>
                配置 LLM 的參數，如溫度、最大令牌數等
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                調整 LLM 的參數，以優化 AI 回覆的質量和成本
              </p>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                onClick={() => router.push('/admin/llm-config')}
              >
                前往配置
              </Button>
            </CardFooter>
          </Card>
          
          {/* API 使用監控 */}
          <Card className="hover:shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FaChartBar className="mr-2 h-5 w-5 text-primary" />
                API 使用監控
              </CardTitle>
              <CardDescription>
                監控 API 的使用情況和成本
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                查看 API 的使用情況、成本和統計數據，以優化資源使用
              </p>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                onClick={() => router.push('/admin/api-usage')}
              >
                查看使用情況
              </Button>
            </CardFooter>
          </Card>
          
          {/* 用戶餘額管理 */}
          <Card className="hover:shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FaMoneyBill className="mr-2 h-5 w-5 text-primary" />
                用戶餘額管理
              </CardTitle>
              <CardDescription>
                管理用戶的餘額
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                查看和管理用戶的餘額，添加或扣除餘額
              </p>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                onClick={() => router.push('/admin/user-balance')}
              >
                管理餘額
              </Button>
            </CardFooter>
          </Card>
          
          {/* 系統設置 */}
          <Card className="hover:shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FaCog className="mr-2 h-5 w-5 text-primary" />
                系統設置
              </CardTitle>
              <CardDescription>
                配置系統的設置
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                配置系統的設置，如默認 AI 服務、費率等
              </p>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                onClick={() => router.push('/admin/system-settings')}
              >
                前往設置
              </Button>
            </CardFooter>
          </Card>
          
          {/* 用戶管理 */}
          <Card className="hover:shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FaUsers className="mr-2 h-5 w-5 text-primary" />
                用戶管理
              </CardTitle>
              <CardDescription>
                管理用戶
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                查看和管理用戶，設置用戶權限等
              </p>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                onClick={() => router.push('/admin/users')}
              >
                管理用戶
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
