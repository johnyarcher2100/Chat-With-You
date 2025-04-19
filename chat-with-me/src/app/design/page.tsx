'use client';

import React, { useState } from 'react';
import { FaApple, FaSearch, FaBell, FaUser, FaHome, FaComments, FaRobot, FaCog } from 'react-icons/fa';
import {
  GlassNavbar,
  IOSButton,
  IOSCard,
  IOSCardHeader,
  IOSCardTitle,
  IOSCardDescription,
  IOSCardContent,
  IOSCardFooter,
  IOSInput,
  IOSSwitch,
  IOSTabs,
  IOSTabsList,
  IOSTabsTrigger,
  IOSTabsContent
} from '@/components/ui/apple';

export default function DesignPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [darkMode, setDarkMode] = useState(false);
  
  // 切換深色模式
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };
  
  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      <GlassNavbar dark={darkMode}>
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center">
            <FaApple className="mr-2 h-6 w-6" />
            <span className="text-lg font-semibold">Chat with Me</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <IOSButton variant="ghost" size="icon">
              <FaSearch className="h-4 w-4" />
            </IOSButton>
            <IOSButton variant="ghost" size="icon">
              <FaBell className="h-4 w-4" />
            </IOSButton>
            <IOSButton variant="ghost" size="icon">
              <FaUser className="h-4 w-4" />
            </IOSButton>
          </div>
        </div>
      </GlassNavbar>
      
      <main className="container mx-auto p-4">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Apple 風格設計系統</h1>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm">深色模式</span>
            <IOSSwitch checked={darkMode} onCheckedChange={toggleDarkMode} />
          </div>
        </div>
        
        <IOSTabs value={activeTab} onValueChange={setActiveTab}>
          <IOSTabsList variant="glass" className="mb-6">
            <IOSTabsTrigger value="overview">概覽</IOSTabsTrigger>
            <IOSTabsTrigger value="buttons">按鈕</IOSTabsTrigger>
            <IOSTabsTrigger value="cards">卡片</IOSTabsTrigger>
            <IOSTabsTrigger value="inputs">輸入框</IOSTabsTrigger>
            <IOSTabsTrigger value="responsive">響應式</IOSTabsTrigger>
          </IOSTabsList>
          
          <IOSTabsContent value="overview">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <IOSCard hover>
                <IOSCardHeader>
                  <IOSCardTitle>Apple 風格設計</IOSCardTitle>
                  <IOSCardDescription>
                    基於 iOS 設計語言的現代化 UI 組件
                  </IOSCardDescription>
                </IOSCardHeader>
                <IOSCardContent>
                  <p>
                    我們的設計系統採用了 Apple 的設計語言，包括乾淨的白色背景、微妙的陰影、圓角元素和清晰的排版。
                  </p>
                </IOSCardContent>
                <IOSCardFooter>
                  <IOSButton size="sm">了解更多</IOSButton>
                </IOSCardFooter>
              </IOSCard>
              
              <IOSCard variant="glass" hover>
                <IOSCardHeader>
                  <IOSCardTitle>磨砂玻璃效果</IOSCardTitle>
                  <IOSCardDescription>
                    現代化的半透明效果
                  </IOSCardDescription>
                </IOSCardHeader>
                <IOSCardContent>
                  <p>
                    磨砂玻璃效果是 Apple 設計的標誌性元素之一，為界面增添了深度和現代感。
                  </p>
                </IOSCardContent>
                <IOSCardFooter>
                  <IOSButton variant="glass" size="sm">查看示例</IOSButton>
                </IOSCardFooter>
              </IOSCard>
              
              <IOSCard variant="outline" hover>
                <IOSCardHeader>
                  <IOSCardTitle>響應式設計</IOSCardTitle>
                  <IOSCardDescription>
                    適應各種屏幕尺寸
                  </IOSCardDescription>
                </IOSCardHeader>
                <IOSCardContent>
                  <p>
                    我們的設計系統確保在各種設備上都能提供一致的用戶體驗，從手機到桌面。
                  </p>
                </IOSCardContent>
                <IOSCardFooter>
                  <IOSButton variant="outline" size="sm">查看布局</IOSButton>
                </IOSCardFooter>
              </IOSCard>
            </div>
          </IOSTabsContent>
          
          <IOSTabsContent value="buttons">
            <IOSCard>
              <IOSCardHeader>
                <IOSCardTitle>按鈕樣式</IOSCardTitle>
                <IOSCardDescription>
                  各種 iOS 風格的按鈕變體
                </IOSCardDescription>
              </IOSCardHeader>
              <IOSCardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-4">
                    <div>
                      <h3 className="mb-2 text-sm font-medium">基本按鈕</h3>
                      <div className="flex flex-wrap gap-2">
                        <IOSButton>默認按鈕</IOSButton>
                        <IOSButton variant="secondary">次要按鈕</IOSButton>
                        <IOSButton variant="outline">輪廓按鈕</IOSButton>
                        <IOSButton variant="ghost">幽靈按鈕</IOSButton>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="mb-2 text-sm font-medium">按鈕尺寸</h3>
                      <div className="flex flex-wrap items-center gap-2">
                        <IOSButton size="xs">超小</IOSButton>
                        <IOSButton size="sm">小型</IOSButton>
                        <IOSButton>默認</IOSButton>
                        <IOSButton size="lg">大型</IOSButton>
                        <IOSButton size="xl">超大</IOSButton>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="mb-2 text-sm font-medium">狀態按鈕</h3>
                      <div className="flex flex-wrap gap-2">
                        <IOSButton variant="success">成功</IOSButton>
                        <IOSButton variant="danger">危險</IOSButton>
                        <IOSButton loading>加載中</IOSButton>
                        <IOSButton disabled>禁用</IOSButton>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="mb-2 text-sm font-medium">圖標按鈕</h3>
                      <div className="flex flex-wrap gap-2">
                        <IOSButton icon={<FaHome className="h-4 w-4" />}>
                          首頁
                        </IOSButton>
                        <IOSButton 
                          variant="secondary"
                          icon={<FaComments className="h-4 w-4" />}
                          iconPosition="right"
                        >
                          聊天
                        </IOSButton>
                        <IOSButton variant="outline" size="icon">
                          <FaRobot className="h-4 w-4" />
                        </IOSButton>
                        <IOSButton variant="ghost" size="icon">
                          <FaCog className="h-4 w-4" />
                        </IOSButton>
                      </div>
                    </div>
                  </div>
                </div>
              </IOSCardContent>
            </IOSCard>
          </IOSTabsContent>
          
          <IOSTabsContent value="cards">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <IOSCard>
                <IOSCardHeader>
                  <IOSCardTitle>默認卡片</IOSCardTitle>
                  <IOSCardDescription>
                    帶有陰影的標準卡片
                  </IOSCardDescription>
                </IOSCardHeader>
                <IOSCardContent>
                  <p>
                    這是一個標準卡片，具有陰影效果和圓角。適用於大多數內容展示場景。
                  </p>
                </IOSCardContent>
                <IOSCardFooter>
                  <IOSButton size="sm">操作按鈕</IOSButton>
                </IOSCardFooter>
              </IOSCard>
              
              <IOSCard variant="outline">
                <IOSCardHeader>
                  <IOSCardTitle>輪廓卡片</IOSCardTitle>
                  <IOSCardDescription>
                    帶有邊框的輕量級卡片
                  </IOSCardDescription>
                </IOSCardHeader>
                <IOSCardContent>
                  <p>
                    這是一個輪廓卡片，使用邊框而非陰影來定義邊界。適用於次要內容或列表項。
                  </p>
                </IOSCardContent>
                <IOSCardFooter>
                  <IOSButton variant="outline" size="sm">操作按鈕</IOSButton>
                </IOSCardFooter>
              </IOSCard>
              
              <IOSCard variant="glass">
                <IOSCardHeader>
                  <IOSCardTitle>磨砂玻璃卡片</IOSCardTitle>
                  <IOSCardDescription>
                    半透明背景的現代卡片
                  </IOSCardDescription>
                </IOSCardHeader>
                <IOSCardContent>
                  <p>
                    這是一個磨砂玻璃卡片，具有半透明背景和模糊效果。適用於覆蓋在圖片或彩色背景上。
                  </p>
                </IOSCardContent>
                <IOSCardFooter>
                  <IOSButton variant="glass" size="sm">操作按鈕</IOSButton>
                </IOSCardFooter>
              </IOSCard>
              
              <IOSCard variant="flat">
                <IOSCardHeader>
                  <IOSCardTitle>扁平卡片</IOSCardTitle>
                  <IOSCardDescription>
                    無陰影的簡潔卡片
                  </IOSCardDescription>
                </IOSCardHeader>
                <IOSCardContent>
                  <p>
                    這是一個扁平卡片，使用背景色而非陰影來區分。適用於密集信息展示。
                  </p>
                </IOSCardContent>
                <IOSCardFooter>
                  <IOSButton variant="ghost" size="sm">操作按鈕</IOSButton>
                </IOSCardFooter>
              </IOSCard>
              
              <IOSCard hover>
                <IOSCardHeader>
                  <IOSCardTitle>懸浮效果卡片</IOSCardTitle>
                  <IOSCardDescription>
                    鼠標懸浮時有動畫效果
                  </IOSCardDescription>
                </IOSCardHeader>
                <IOSCardContent>
                  <p>
                    這是一個帶有懸浮效果的卡片，鼠標懸浮時會輕微上浮並增加陰影。適用於可點擊的卡片。
                  </p>
                </IOSCardContent>
                <IOSCardFooter>
                  <IOSButton size="sm">操作按鈕</IOSButton>
                </IOSCardFooter>
              </IOSCard>
              
              <IOSCard padding="none">
                <img 
                  src="https://images.unsplash.com/photo-1517841905240-472988babdf9" 
                  alt="卡片圖片"
                  className="h-48 w-full object-cover"
                />
                <IOSCardHeader>
                  <IOSCardTitle>媒體卡片</IOSCardTitle>
                  <IOSCardDescription>
                    包含圖片的卡片
                  </IOSCardDescription>
                </IOSCardHeader>
                <IOSCardContent>
                  <p>
                    這是一個包含媒體內容的卡片，可以展示圖片、視頻等媒體資源。
                  </p>
                </IOSCardContent>
                <IOSCardFooter>
                  <IOSButton size="sm">查看詳情</IOSButton>
                </IOSCardFooter>
              </IOSCard>
            </div>
          </IOSTabsContent>
          
          <IOSTabsContent value="inputs">
            <IOSCard>
              <IOSCardHeader>
                <IOSCardTitle>輸入框樣式</IOSCardTitle>
                <IOSCardDescription>
                  各種 iOS 風格的輸入框變體
                </IOSCardDescription>
              </IOSCardHeader>
              <IOSCardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <div>
                      <h3 className="mb-2 text-sm font-medium">基本輸入框</h3>
                      <IOSInput placeholder="默認輸入框" />
                    </div>
                    
                    <div>
                      <h3 className="mb-2 text-sm font-medium">填充輸入框</h3>
                      <IOSInput variant="filled" placeholder="填充輸入框" />
                    </div>
                    
                    <div>
                      <h3 className="mb-2 text-sm font-medium">輪廓輸入框</h3>
                      <IOSInput variant="outline" placeholder="輪廓輸入框" />
                    </div>
                    
                    <div>
                      <h3 className="mb-2 text-sm font-medium">磨砂玻璃輸入框</h3>
                      <IOSInput variant="glass" placeholder="磨砂玻璃輸入框" />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="mb-2 text-sm font-medium">帶圖標輸入框</h3>
                      <IOSInput 
                        placeholder="搜索..." 
                        icon={<FaSearch className="h-4 w-4 text-gray-400" />} 
                      />
                    </div>
                    
                    <div>
                      <h3 className="mb-2 text-sm font-medium">錯誤狀態</h3>
                      <IOSInput 
                        placeholder="電子郵件" 
                        error 
                        errorMessage="請輸入有效的電子郵件地址" 
                      />
                    </div>
                    
                    <div>
                      <h3 className="mb-2 text-sm font-medium">禁用狀態</h3>
                      <IOSInput placeholder="禁用輸入框" disabled />
                    </div>
                    
                    <div>
                      <h3 className="mb-2 text-sm font-medium">圓形輸入框</h3>
                      <IOSInput 
                        placeholder="圓形輸入框" 
                        rounded="full"
                        icon={<FaSearch className="h-4 w-4 text-gray-400" />} 
                      />
                    </div>
                  </div>
                </div>
              </IOSCardContent>
            </IOSCard>
          </IOSTabsContent>
          
          <IOSTabsContent value="responsive">
            <IOSCard>
              <IOSCardHeader>
                <IOSCardTitle>響應式布局</IOSCardTitle>
                <IOSCardDescription>
                  適應不同屏幕尺寸的設計
                </IOSCardDescription>
              </IOSCardHeader>
              <IOSCardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="mb-2 text-sm font-medium">網格布局</h3>
                    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                      {[1, 2, 3, 4].map((item) => (
                        <div 
                          key={item}
                          className="rounded-apple bg-gray-100 p-4 text-center dark:bg-gray-800"
                        >
                          項目 {item}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="mb-2 text-sm font-medium">響應式卡片</h3>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <IOSCard variant="outline">
                        <IOSCardHeader>
                          <IOSCardTitle>小屏幕</IOSCardTitle>
                        </IOSCardHeader>
                        <IOSCardContent>
                          在小屏幕上，卡片將佔據整行。
                        </IOSCardContent>
                      </IOSCard>
                      
                      <IOSCard variant="outline">
                        <IOSCardHeader>
                          <IOSCardTitle>中屏幕</IOSCardTitle>
                        </IOSCardHeader>
                        <IOSCardContent>
                          在中等屏幕上，每行顯示兩張卡片。
                        </IOSCardContent>
                      </IOSCard>
                      
                      <IOSCard variant="outline">
                        <IOSCardHeader>
                          <IOSCardTitle>大屏幕</IOSCardTitle>
                        </IOSCardHeader>
                        <IOSCardContent>
                          在大屏幕上，每行顯示三張卡片。
                        </IOSCardContent>
                      </IOSCard>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="mb-2 text-sm font-medium">響應式導航</h3>
                    <div className="rounded-apple bg-gray-100 p-4 dark:bg-gray-800">
                      <div className="hidden md:block">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <FaApple className="h-6 w-6" />
                            <span className="font-medium">桌面導航</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <IOSButton size="sm">首頁</IOSButton>
                            <IOSButton size="sm">功能</IOSButton>
                            <IOSButton size="sm">關於</IOSButton>
                            <IOSButton size="sm">聯繫</IOSButton>
                          </div>
                        </div>
                      </div>
                      
                      <div className="md:hidden">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <FaApple className="h-5 w-5" />
                            <span className="font-medium">移動導航</span>
                          </div>
                          <IOSButton variant="ghost" size="sm">
                            <span className="sr-only">菜單</span>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="h-5 w-5"
                            >
                              <line x1="4" x2="20" y1="12" y2="12" />
                              <line x1="4" x2="20" y1="6" y2="6" />
                              <line x1="4" x2="20" y1="18" y2="18" />
                            </svg>
                          </IOSButton>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </IOSCardContent>
            </IOSCard>
          </IOSTabsContent>
        </IOSTabs>
      </main>
    </div>
  );
}
