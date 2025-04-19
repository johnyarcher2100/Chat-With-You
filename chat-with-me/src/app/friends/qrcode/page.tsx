'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { QRCodeSVG } from 'qrcode.react';
import { BrowserQRCodeReader } from '@zxing/browser';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FaArrowLeft, FaDownload, FaQrcode, FaCamera } from 'react-icons/fa';

export default function QRCodePage() {
  const router = useRouter();
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [activeTab, setActiveTab] = useState('myQR');
  const [qrValue, setQrValue] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // 生成 QR 碼值
  useEffect(() => {
    if (user) {
      // 創建包含用戶 ID 的 QR 碼值
      // 格式: cwm:friend:userId
      const value = `cwm:friend:${user.id}`;
      setQrValue(value);
    }
  }, [user]);
  
  // 處理下載 QR 碼
  const handleDownloadQR = () => {
    const svg = document.getElementById('user-qrcode');
    if (!svg) return;
    
    // 創建一個臨時的 canvas 元素
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // 設置 canvas 大小
    canvas.width = 300;
    canvas.height = 300;
    
    // 繪製白色背景
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 將 SVG 轉換為圖像
    const img = new Image();
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    img.onload = () => {
      // 繪製 QR 碼
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // 轉換為 PNG 並下載
      const pngUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = 'my-qrcode.png';
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      // 釋放資源
      URL.revokeObjectURL(url);
    };
    
    img.src = url;
  };
  
  // 開始掃描 QR 碼
  const startScan = async () => {
    if (!videoRef.current) return;
    
    try {
      setScanning(true);
      setScanResult(null);
      setError(null);
      
      const codeReader = new BrowserQRCodeReader();
      
      // 獲取可用的視頻設備
      const videoInputDevices = await BrowserQRCodeReader.listVideoInputDevices();
      
      if (videoInputDevices.length === 0) {
        throw new Error('沒有找到攝像頭設備');
      }
      
      // 使用第一個後置攝像頭（如果有）
      const selectedDeviceId = videoInputDevices[0].deviceId;
      
      // 開始解碼
      const controls = await codeReader.decodeFromVideoDevice(
        selectedDeviceId,
        videoRef.current,
        (result, error) => {
          if (result) {
            // 檢查 QR 碼格式是否正確
            const qrValue = result.getText();
            if (qrValue.startsWith('cwm:friend:')) {
              setScanResult(qrValue);
              setScanning(false);
              controls.stop();
              
              // 提取用戶 ID 並導航到用戶資料頁面
              const friendId = qrValue.split(':')[2];
              router.push(`/friends/profile/${friendId}`);
            }
          }
          
          if (error && !(error instanceof TypeError)) {
            // TypeError 通常是因為視頻流還沒準備好
            console.error('QR 碼掃描錯誤:', error);
          }
        }
      );
    } catch (err: any) {
      console.error('啟動掃描器時出錯:', err);
      setError(err.message || '啟動掃描器時出錯');
      setScanning(false);
    }
  };
  
  // 停止掃描
  const stopScan = () => {
    setScanning(false);
    // 視頻流會在組件卸載時自動停止
  };
  
  // 在組件卸載時停止掃描
  useEffect(() => {
    return () => {
      if (scanning) {
        stopScan();
      }
    };
  }, [scanning]);
  
  // 如果用戶未登錄，重定向到登錄頁面
  if (!user) {
    router.push('/login');
    return null;
  }
  
  return (
    <div className="container mx-auto p-4">
      <div className="mb-6 flex items-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/friends')}
          className="mr-2"
        >
          <FaArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">QR 碼</h1>
      </div>
      
      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4 grid w-full grid-cols-2">
          <TabsTrigger value="myQR" className="flex items-center">
            <FaQrcode className="mr-2 h-4 w-4" />
            我的 QR 碼
          </TabsTrigger>
          <TabsTrigger value="scanQR" className="flex items-center">
            <FaCamera className="mr-2 h-4 w-4" />
            掃描 QR 碼
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="myQR">
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-6">
              <div className="mb-4 text-center">
                <p className="text-sm text-gray-500">
                  分享此 QR 碼給朋友，讓他們掃描添加您為好友
                </p>
              </div>
              
              <div className="mb-6 rounded-lg bg-white p-4 shadow-sm">
                {qrValue && (
                  <QRCodeSVG
                    id="user-qrcode"
                    value={qrValue}
                    size={250}
                    level="H" // 高容錯率
                    includeMargin={true}
                  />
                )}
              </div>
              
              <Button onClick={handleDownloadQR}>
                <FaDownload className="mr-2 h-4 w-4" />
                下載 QR 碼
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="scanQR">
          <Card>
            <CardContent className="p-6">
              <div className="mb-4 text-center">
                <p className="text-sm text-gray-500">
                  掃描朋友的 QR 碼以添加他們為好友
                </p>
              </div>
              
              <div className="relative mb-6 overflow-hidden rounded-lg bg-black">
                <video
                  ref={videoRef}
                  className="h-[300px] w-full object-cover"
                />
                
                {!scanning && !scanResult && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70">
                    <Button onClick={startScan}>
                      <FaCamera className="mr-2 h-4 w-4" />
                      開始掃描
                    </Button>
                  </div>
                )}
                
                {scanning && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-48 w-48 border-2 border-white opacity-70"></div>
                  </div>
                )}
              </div>
              
              {scanning && (
                <div className="text-center">
                  <Button variant="outline" onClick={stopScan}>
                    停止掃描
                  </Button>
                </div>
              )}
              
              {scanResult && (
                <div className="rounded-lg bg-green-50 p-4 text-center text-green-700">
                  掃描成功！正在處理...
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
