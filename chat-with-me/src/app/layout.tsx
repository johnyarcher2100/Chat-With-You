import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { RealtimeProvider } from "@/contexts/RealtimeContext";
import { OfflineProvider } from "@/contexts/OfflineContext";
import CloudinaryConfig from "@/components/cloudinary/CloudinaryConfig";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Chat with Me - 社群聊天應用",
  description: "一個多平台社群聊天應用，具有 Apple 風格的 UI、先進的多提供商認證、即時消息、AI 輔助聊天、可自定義 AI 機器人、全面的好友管理和安全的支付系統。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <OfflineProvider>
            <RealtimeProvider>
              <CloudinaryConfig>
                {children}
              </CloudinaryConfig>
            </RealtimeProvider>
          </OfflineProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
