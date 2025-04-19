'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PaymentMethod } from '@/services/payment/types';
import { AI_METERING_CONFIG } from '@/config/payment';
import { FaMoneyBill, FaCreditCard, FaHistory, FaChartLine } from 'react-icons/fa';

export default function PaymentsPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [balance, setBalance] = useState<number | null>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [usageSummary, setUsageSummary] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(PaymentMethod.JKOPAY);
  
  // 加載用戶餘額
  const loadBalance = async () => {
    try {
      const response = await fetch('/api/balance');
      
      if (!response.ok) {
        throw new Error('獲取餘額失敗');
      }
      
      const data = await response.json();
      setBalance(data.balance);
    } catch (err: any) {
      console.error('Error loading balance:', err);
      setError(err.message || '加載餘額時出錯');
    }
  };
  
  // 加載支付歷史
  const loadPayments = async () => {
    try {
      const response = await fetch('/api/payments');
      
      if (!response.ok) {
        throw new Error('獲取支付歷史失敗');
      }
      
      const data = await response.json();
      setPayments(data);
    } catch (err: any) {
      console.error('Error loading payments:', err);
      setError(err.message || '加載支付歷史時出錯');
    }
  };
  
  // 加載使用情況摘要
  const loadUsageSummary = async () => {
    try {
      const response = await fetch('/api/usage/summary');
      
      if (!response.ok) {
        throw new Error('獲取使用情況摘要失敗');
      }
      
      const data = await response.json();
      setUsageSummary(data);
    } catch (err: any) {
      console.error('Error loading usage summary:', err);
      // 不設置錯誤，因為這不是關鍵功能
    }
  };
  
  // 初始化
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setError(null);
      
      try {
        await Promise.all([
          loadBalance(),
          loadPayments(),
          loadUsageSummary()
        ]);
      } finally {
        setLoading(false);
      }
    };
    
    if (user) {
      init();
    }
  }, [user]);
  
  // 處理充值
  const handleTopUp = async () => {
    if (!selectedPlan) {
      setError('請選擇充值方案');
      return;
    }
    
    try {
      setLoading(true);
      
      // 獲取選擇的方案
      const plan = AI_METERING_CONFIG.plans.find(p => p.id === selectedPlan);
      
      if (!plan) {
        throw new Error('無效的充值方案');
      }
      
      // 創建支付
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: plan.amount,
          method: selectedMethod,
          description: `充值 ${plan.name}`
        })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '創建支付失敗');
      }
      
      const data = await response.json();
      
      // 重定向到支付頁面
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        throw new Error('未獲取到支付重定向 URL');
      }
    } catch (err: any) {
      console.error('Error creating payment:', err);
      setError(err.message || '創建支付時出錯');
    } finally {
      setLoading(false);
    }
  };
  
  // 格式化金額
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0
    }).format(amount);
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
  
  // 獲取支付狀態標籤
  const getPaymentStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-800">已完成</span>;
      case 'pending':
        return <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs text-yellow-800">處理中</span>;
      case 'failed':
        return <span className="rounded-full bg-red-100 px-2 py-1 text-xs text-red-800">失敗</span>;
      default:
        return <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-800">{status}</span>;
    }
  };
  
  // 獲取支付方式標籤
  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'jkopay':
        return '街口支付';
      case 'linepay':
        return 'Line Pay';
      case 'credit_card':
        return '信用卡';
      default:
        return method;
    }
  };
  
  // 加載中
  if (loading && balance === null) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
          <p className="mt-2 text-gray-500">載入中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="mb-6 text-2xl font-bold">支付與餘額</h1>
      
      {error && (
        <div className="mb-6 rounded-md bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}
      
      {/* 餘額卡片 */}
      <div className="mb-8">
        <Card>
          <CardHeader className="bg-primary text-white">
            <CardTitle className="flex items-center">
              <FaMoneyBill className="mr-2" />
              您的餘額
            </CardTitle>
            <CardDescription className="text-white/80">
              用於支付 AI 使用費用
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">
                {balance !== null ? formatAmount(balance) : '載入中...'}
              </div>
              {usageSummary && (
                <p className="mt-2 text-sm text-gray-500">
                  本月已使用: {formatAmount(usageSummary.totalCostTWD)}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* 主要內容標籤 */}
      <Tabs defaultValue="topup">
        <TabsList className="mb-4 grid w-full grid-cols-3">
          <TabsTrigger value="topup">充值</TabsTrigger>
          <TabsTrigger value="history">交易記錄</TabsTrigger>
          <TabsTrigger value="usage">使用統計</TabsTrigger>
        </TabsList>
        
        {/* 充值標籤內容 */}
        <TabsContent value="topup">
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">選擇充值方案</h2>
            
            <div className="grid gap-4 md:grid-cols-3">
              {AI_METERING_CONFIG.plans.map(plan => (
                <Card 
                  key={plan.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedPlan === plan.id ? 'border-2 border-primary' : ''
                  }`}
                  onClick={() => setSelectedPlan(plan.id)}
                >
                  <CardHeader>
                    <CardTitle>{plan.name}</CardTitle>
                    <CardDescription>
                      {plan.bonus > 0 ? `贈送 ${formatAmount(plan.bonus)} 額度` : '基本充值方案'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-primary">
                      {formatAmount(plan.amount)}
                    </div>
                    {plan.bonus > 0 && (
                      <div className="mt-2 text-sm text-green-600">
                        +{formatAmount(plan.bonus)} 贈送
                      </div>
                    )}
                  </CardContent>
                  <CardFooter>
                    <div className="text-sm text-gray-500">
                      總計: {formatAmount(plan.amount + plan.bonus)}
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
            
            <h2 className="text-xl font-semibold">選擇支付方式</h2>
            
            <div className="grid gap-4 md:grid-cols-2">
              <Card 
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedMethod === PaymentMethod.JKOPAY ? 'border-2 border-primary' : ''
                }`}
                onClick={() => setSelectedMethod(PaymentMethod.JKOPAY)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FaCreditCard className="mr-2" />
                    街口支付
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500">
                    使用街口支付進行充值
                  </p>
                </CardContent>
              </Card>
              
              <Card 
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedMethod === PaymentMethod.LINEPAY ? 'border-2 border-primary' : ''
                }`}
                onClick={() => setSelectedMethod(PaymentMethod.LINEPAY)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FaCreditCard className="mr-2" />
                    Line Pay
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500">
                    使用 Line Pay 進行充值
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <div className="flex justify-end">
              <Button 
                onClick={handleTopUp}
                disabled={!selectedPlan || loading}
                className="px-8"
              >
                {loading ? '處理中...' : '立即充值'}
              </Button>
            </div>
          </div>
        </TabsContent>
        
        {/* 交易記錄標籤內容 */}
        <TabsContent value="history">
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">交易記錄</h2>
            
            {payments.length === 0 ? (
              <div className="rounded-lg bg-gray-50 p-8 text-center">
                <p className="text-gray-500">暫無交易記錄</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full table-auto">
                  <thead className="bg-gray-50 text-left text-sm font-semibold text-gray-600">
                    <tr>
                      <th className="whitespace-nowrap px-4 py-3">日期</th>
                      <th className="whitespace-nowrap px-4 py-3">金額</th>
                      <th className="whitespace-nowrap px-4 py-3">支付方式</th>
                      <th className="whitespace-nowrap px-4 py-3">狀態</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {payments.map(payment => (
                      <tr key={payment.id} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap px-4 py-3 text-sm">
                          {formatDate(payment.created_at)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 font-medium">
                          {formatAmount(payment.amount)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm">
                          {getPaymentMethodLabel(payment.payment_method)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm">
                          {getPaymentStatusLabel(payment.status)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>
        
        {/* 使用統計標籤內容 */}
        <TabsContent value="usage">
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">AI 使用統計</h2>
            
            {!usageSummary ? (
              <div className="rounded-lg bg-gray-50 p-8 text-center">
                <p className="text-gray-500">暫無使用記錄</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <FaChartLine className="mr-2" />
                      本月使用量
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-primary">
                      {usageSummary.totalTokens.toLocaleString()} tokens
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      約等於 {Math.round(usageSummary.totalTokens / 750).toLocaleString()} 頁文字
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <FaMoneyBill className="mr-2" />
                      本月消費
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-primary">
                      {formatAmount(usageSummary.totalCostTWD)}
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      平均每天 {formatAmount(usageSummary.totalCostTWD / 30)}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
