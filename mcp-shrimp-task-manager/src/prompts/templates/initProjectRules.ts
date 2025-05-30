/**
 * 初始化專案規範 prompt 模板
 * 包含指導如何產生專案規範文件的提示詞
 */

// 基本提示詞模板
export const initProjectRulesTemplate = `請用 「process_thought」 工具思考以下問題

# 專案規範初始化指南

## 目的

**此文件專為 AI Agent 設計，非一般開發者文檔。**
**必須生成一個專屬於 AI Agent 操作使用的專案規範文件(rules.md)。**

**必須專注於以下關鍵目標：**
- 明確專案特定規則與限制，禁止包含通用開發知識
- 提供 AI 執行任務時所需的專案特定資訊
- 為 AI 決策過程提供明確指導

**強制規定：**
- 完成的規範必須使 AI Agent 能立即理解哪些檔案必須參考或修改
- 明確指示多檔案連動修改要求（例如修改 README.md 時必須同步修改 /docs/zh/README.md）
- 使用命令式語言定義規則，避免解釋性內容
- 不要進行專案的功能解釋，而是如何修改功能或增加功能
- 請提供範例什麼事可以做的，什麼事不可以做的

**嚴重禁止：**
- 禁止包含通用開發知識
- 禁止包含 LLM 已知的通用開發知識
- 進行專案功能解釋

## 建議結構

請使用以下結構建立規範文件：

\`\`\`markdown
# 開發守則
## 標題
### 副標題
- 規則一
- 規則二
\`\`\`

## 內容指南

規範文件應包含但不限於以下內容：

1. **專案概述** - 簡要描述專案的目的、技術棧和核心功能
2. **專案架構** - 說明主要目錄結構和模塊劃分
3. **代碼規範** - 包括命名規範、格式要求、註釋規則等
4. **功能實作規範** - 主要解釋如何實作功能及應該注意事項
5. **框架/插件/第三方庫使用規範** - 外部依賴的使用規範
6. **工作流程規範** - 工作流程指南，包含工作流程圖或資料流
7. **關鍵檔案交互規範** - 關鍵檔案的交互規範，修改哪些檔案需要同步修改
8. **AI 決策規範** - 提供處理模糊情況的決策樹和優先級判斷標準
9. **禁止事項** - 明確列出哪些做法是禁止的

## 注意事項

1. **面向 AI 優化** - 文件將作為 prompt 提供給 Coding Agent AI，應對 prompt 最佳化
2. **專注於開發指導** - 提供持續開發的規則，而非使用教學
3. **具體示例** - 盡可能提供「應該做什麼」和「不應該做什麼」的具體示例
4. **使用命令式語言** - 必須使用直接指令而非描述性語言，減少解釋內容
5. **結構化呈現** - 所有內容必須以列表、表格等結構化形式呈現，便於 AI 解析
6. **突出重點標記** - 使用粗體、警告標記等突出關鍵規則和禁忌
7. **移除通用知識** - 禁止包含 LLM 已知的通用開發知識，僅包含專案特定規則

請根據以上指南，創建一個名為 rules.md 的文件並存放於: {rulesPath}

**現在開始呼叫 「process_thought」 工具思考如何撰寫出教導 Coding Agent 規範文件**
**思考完畢後請立即編輯 rules.md 文件，禁止呼叫「analyze_task」工具**
**如果檔案已經存在或用戶要求更新，請思考規範是否已經過時，是否需要補充更新**
**如果是更新模式，除非必要否則你應該保持現有的規範，以最小變更為原則的修改**
`;
