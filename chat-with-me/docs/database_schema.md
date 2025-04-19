# Chat with Me 數據庫架構

本文檔描述了 Chat with Me 應用程序的數據庫架構。

## 表結構

### 1. profiles（用戶配置文件）

存儲用戶的基本信息。

| 列名 | 類型 | 描述 |
|------|------|------|
| id | UUID | 主鍵，關聯到 auth.users 表 |
| username | TEXT | 用戶名，唯一 |
| full_name | TEXT | 用戶全名 |
| avatar_url | TEXT | 用戶頭像 URL |
| created_at | TIMESTAMP WITH TIME ZONE | 創建時間 |
| updated_at | TIMESTAMP WITH TIME ZONE | 更新時間 |

### 2. friends（好友關係）

存儲用戶之間的好友關係。

| 列名 | 類型 | 描述 |
|------|------|------|
| id | UUID | 主鍵 |
| user_id | UUID | 用戶 ID，關聯到 profiles 表 |
| friend_id | UUID | 好友 ID，關聯到 profiles 表 |
| status | TEXT | 好友關係狀態：pending（待處理）、accepted（已接受）、rejected（已拒絕）、blocked（已阻止） |
| created_at | TIMESTAMP WITH TIME ZONE | 創建時間 |
| updated_at | TIMESTAMP WITH TIME ZONE | 更新時間 |

### 3. chats（聊天）

存儲聊天會話信息。

| 列名 | 類型 | 描述 |
|------|------|------|
| id | UUID | 主鍵 |
| name | TEXT | 聊天名稱（對於群聊） |
| is_group | BOOLEAN | 是否為群聊 |
| created_at | TIMESTAMP WITH TIME ZONE | 創建時間 |
| updated_at | TIMESTAMP WITH TIME ZONE | 更新時間 |

### 4. chat_participants（聊天參與者）

存儲聊天參與者信息。

| 列名 | 類型 | 描述 |
|------|------|------|
| id | UUID | 主鍵 |
| chat_id | UUID | 聊天 ID，關聯到 chats 表 |
| user_id | UUID | 用戶 ID，關聯到 profiles 表 |
| created_at | TIMESTAMP WITH TIME ZONE | 創建時間 |

### 5. messages（消息）

存儲聊天消息。

| 列名 | 類型 | 描述 |
|------|------|------|
| id | UUID | 主鍵 |
| chat_id | UUID | 聊天 ID，關聯到 chats 表 |
| user_id | UUID | 發送者 ID，關聯到 profiles 表 |
| content | TEXT | 消息內容 |
| is_ai_generated | BOOLEAN | 是否由 AI 生成 |
| media_url | TEXT | 媒體文件 URL |
| created_at | TIMESTAMP WITH TIME ZONE | 創建時間 |
| updated_at | TIMESTAMP WITH TIME ZONE | 更新時間 |

### 6. ai_bots（AI 機器人）

存儲 AI 機器人信息。

| 列名 | 類型 | 描述 |
|------|------|------|
| id | UUID | 主鍵 |
| name | TEXT | 機器人名稱 |
| description | TEXT | 機器人描述 |
| owner_id | UUID | 擁有者 ID，關聯到 profiles 表 |
| bot_type | TEXT | 機器人類型：knowledge（知識型）、order（訂單型）、custom（自定義型） |
| configuration | JSONB | 機器人配置，JSON 格式 |
| created_at | TIMESTAMP WITH TIME ZONE | 創建時間 |
| updated_at | TIMESTAMP WITH TIME ZONE | 更新時間 |

### 7. payments（支付）

存儲支付信息。

| 列名 | 類型 | 描述 |
|------|------|------|
| id | UUID | 主鍵 |
| user_id | UUID | 用戶 ID，關聯到 profiles 表 |
| amount | DECIMAL(10, 2) | 金額 |
| currency | TEXT | 貨幣，默認為 TWD |
| payment_method | TEXT | 支付方式：jkopay（街口支付）、linepay（Line Pay）、credit_card（信用卡） |
| status | TEXT | 支付狀態：pending（待處理）、completed（已完成）、failed（失敗） |
| transaction_id | TEXT | 交易 ID |
| created_at | TIMESTAMP WITH TIME ZONE | 創建時間 |
| updated_at | TIMESTAMP WITH TIME ZONE | 更新時間 |

### 8. ai_usage（AI 使用情況）

存儲 AI 使用情況。

| 列名 | 類型 | 描述 |
|------|------|------|
| id | UUID | 主鍵 |
| user_id | UUID | 用戶 ID，關聯到 profiles 表 |
| api_name | TEXT | API 名稱 |
| tokens_used | INTEGER | 使用的 token 數量 |
| cost | DECIMAL(10, 6) | 成本 |
| created_at | TIMESTAMP WITH TIME ZONE | 創建時間 |

### 9. user_balance（用戶餘額）

存儲用戶餘額。

| 列名 | 類型 | 描述 |
|------|------|------|
| user_id | UUID | 用戶 ID，關聯到 profiles 表，主鍵 |
| balance | DECIMAL(10, 2) | 餘額 |
| updated_at | TIMESTAMP WITH TIME ZONE | 更新時間 |

## 關係

1. profiles.id → auth.users.id（一對一）
2. friends.user_id → profiles.id（多對一）
3. friends.friend_id → profiles.id（多對一）
4. chat_participants.chat_id → chats.id（多對一）
5. chat_participants.user_id → profiles.id（多對一）
6. messages.chat_id → chats.id（多對一）
7. messages.user_id → profiles.id（多對一）
8. ai_bots.owner_id → profiles.id（多對一）
9. payments.user_id → profiles.id（多對一）
10. ai_usage.user_id → profiles.id（多對一）
11. user_balance.user_id → profiles.id（一對一）

## 安全策略

使用 Supabase 的行級安全（Row Level Security，RLS）來保護數據：

1. profiles：用戶只能查看自己的配置文件
2. friends：用戶只能查看與自己相關的好友關係
3. chats：用戶只能查看自己參與的聊天
4. chat_participants：用戶只能查看自己參與的聊天的參與者
5. messages：用戶只能查看自己參與的聊天的消息
6. ai_bots：用戶只能查看自己創建的機器人
7. payments：用戶只能查看自己的支付記錄
8. ai_usage：用戶只能查看自己的 AI 使用情況
9. user_balance：用戶只能查看自己的餘額

## 觸發器

1. 當新用戶創建時，自動創建 profile 和 user_balance 記錄
2. 當消息創建時，自動更新聊天的 updated_at 時間
3. 當 AI 使用情況記錄創建時，自動更新用戶餘額
