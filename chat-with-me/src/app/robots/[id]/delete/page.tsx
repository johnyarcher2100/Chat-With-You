'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { FaArrowLeft, FaExclamationTriangle } from 'react-icons/fa';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function DeleteRobotPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  
  const [botName, setBotName] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
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
          .select('name')
          .eq('id', id)
          .eq('owner_id', user.id)
          .single();
        
        if (fetchError) {
          throw fetchError;
        }
        
        if (!data) {
          throw new Error('找不到機器人');
        }
        
        // 設置機器人名稱
        setBotName(data.name);
      } catch (err: any) {
        setError(err.message || '加載機器人信息時出錯');
      } finally {
        setLoading(false);
      }
    };
    
    loadBot();
  }, [user, id]);
  
  // 處理刪除機器人
  const handleDeleteBot = async () => {
    if (!user || !id) return;
    
    try {
      setDeleting(true);
      setError(null);
      
      // 刪除機器人
      const { error: deleteError } = await supabase
        .from('ai_bots')
        .delete()
        .eq('id', id)
        .eq('owner_id', user.id);
      
      if (deleteError) {
        throw deleteError;
      }
      
      // 導航回機器人列表
      router.push('/robots');
    } catch (err: any) {
      setError(err.message || '刪除機器人時出錯');
      setDeleting(false);
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
          <h1 className="text-2xl font-bold">刪除 AI 機器人</h1>
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-red-600">
                <FaExclamationTriangle className="mr-2 h-5 w-5" />
                確認刪除
              </CardTitle>
              <CardDescription>
                此操作無法撤銷，請謹慎操作
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <p className="text-gray-700">
                您確定要刪除機器人 <span className="font-semibold">"{botName}"</span> 嗎？
                刪除後，所有與該機器人相關的數據將被永久刪除，且無法恢復。
              </p>
            </CardContent>
            
            <CardFooter className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => router.push('/robots')}
                disabled={deleting}
              >
                取消
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteBot}
                disabled={deleting}
              >
                {deleting ? '刪除中...' : '確認刪除'}
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </ProtectedRoute>
  );
}
