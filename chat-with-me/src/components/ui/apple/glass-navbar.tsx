'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface GlassNavbarProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  sticky?: boolean;
  blur?: 'sm' | 'md' | 'lg';
  dark?: boolean;
  showBorder?: boolean;
  height?: 'sm' | 'md' | 'lg';
}

export function GlassNavbar({
  children,
  className,
  sticky = true,
  blur = 'md',
  dark = false,
  showBorder = true,
  height = 'md',
  ...props
}: GlassNavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  
  // 監聽滾動事件
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // 初始檢查
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
  
  // 當路徑變化時重置滾動狀態
  useEffect(() => {
    setScrolled(window.scrollY > 10);
  }, [pathname]);
  
  // 高度映射
  const heightMap = {
    sm: 'h-12',
    md: 'h-16',
    lg: 'h-20',
  };
  
  // 模糊程度映射
  const blurMap = {
    sm: 'backdrop-blur-apple-sm',
    md: 'backdrop-blur-apple-md',
    lg: 'backdrop-blur-apple-lg',
  };
  
  return (
    <div
      className={cn(
        'z-50 w-full transition-all duration-apple-medium',
        heightMap[height],
        sticky ? 'sticky top-0' : 'relative',
        dark ? 'text-white' : 'text-foreground',
        {
          'border-b border-gray-200/50 dark:border-gray-800/50': showBorder && scrolled,
          'shadow-apple-sm': scrolled,
        },
        className
      )}
      {...props}
    >
      <div
        className={cn(
          'absolute inset-0 transition-all duration-apple-medium',
          blurMap[blur],
          dark
            ? 'bg-black/70 dark:bg-black/80'
            : 'bg-white/70 dark:bg-gray-900/80',
          {
            'bg-white/80 dark:bg-gray-900/90': scrolled && !dark,
            'bg-black/80 dark:bg-black/90': scrolled && dark,
          }
        )}
      />
      <div className="relative flex h-full w-full items-center px-4">
        {children}
      </div>
    </div>
  );
}
