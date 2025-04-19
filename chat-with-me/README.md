# Chat with Me - 社群聊天應用

一個多平台社群聊天應用，具有 Apple 風格的 UI、先進的多提供商認證、即時消息、AI 輔助聊天、可自定義 AI 機器人、全面的好友管理和安全的支付系統。

## 功能

- **多平台支持**：Android、iOS 和 Web
- **用戶認證**：使用 Supabase 進行安全登錄，支持第三方集成（Facebook、Google、Apple）
- **即時消息**：使用 Supabase Realtime 或 WebSocket 的即時消息功能，支持離線緩存和同步
- **AI 集成**：與 deepseekAPI 和 OpenAI API 集成，提供 AI 輔助聊天功能
- **自定義 AI 機器人**：用戶可以創建和配置個人 AI 機器人
- **好友管理**：強大的好友管理系統，支持 QR 碼、搜索和好友互動控制
- **支付集成**：AI 調用計量，集成街口支付和 Line Pay
- **文件存儲**：使用 Cloudinary 管理頭像和聊天圖片
- **UI 設計**：Apple 風格的極簡主義 UI

## 技術棧

- **前端框架**：Next.js 15 with React，使用 TypeScript 確保類型安全
- **移動支持**：Expo 用於開發跨平台移動應用，Xcode 用於 iOS 特定配置
- **認證和數據庫**：Supabase 用於用戶認證、實時數據管理和數據庫存儲
- **支付集成**：與街口支付和 Line Pay 集成
- **AI 集成**：連接 deepseekAPI 和 OpenAI API
- **文件存儲**：與 Cloudinary 集成
- **部署**：Netlify 用於自動部署

## 開始使用

### 先決條件

- Node.js 18.0.0 或更高版本
- npm 或 yarn
- Supabase 帳戶
- Cloudinary 帳戶
- deepseekAPI 和 OpenAI API 密鑰
- 街口支付和 Line Pay 開發者帳戶

### 安裝

1. 克隆存儲庫：

```bash
git clone https://github.com/yourusername/chat-with-me.git
cd chat-with-me
```

2. 安裝依賴：

```bash
npm install
# 或
yarn install
```

3. 設置環境變量：

將 `.env.local.example` 文件複製為 `.env.local`，並填寫您的 API 密鑰和配置：

```bash
cp .env.local.example .env.local
```

4. 運行開發服務器：

```bash
npm run dev
# 或
yarn dev
```

5. 在瀏覽器中打開 [http://localhost:3000](http://localhost:3000)

## 部署

該項目可以部署到 Netlify。只需將您的存儲庫連接到 Netlify，並設置相同的環境變量。

## 貢獻

歡迎貢獻！請隨時提交問題或拉取請求。

## 許可證

MIT
