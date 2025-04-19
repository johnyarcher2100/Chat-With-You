// @ts-check
const { chromium } = require('@playwright/test');

/**
 * 對聊天應用進行運行除錯的腳本
 * 使用Playwright進行自動化除錯，專注於關鍵功能測試
 */
async function debugChatApp() {
  console.log('\n===== 開始進行聊天應用除錯 =====\n');
  
  // 啟動瀏覽器
  const browser = await chromium.launch({ 
    headless: false, // 設置為false以便觀察瀏覽器行為
    slowMo: 300 // 放慢操作以便觀察
  });
  
  // 創建新的頁面
  const page = await browser.newPage();
  
  // 收集錯誤和警告
  const consoleMessages = [];
  page.on('console', msg => {
    const type = msg.type();
    if (type === 'error' || type === 'warning') {
      consoleMessages.push({ type, text: msg.text() });
      console.log(`瀏覽器控制台 [${type}]: ${msg.text()}`);
    }
  });
  
  // 收集網絡錯誤
  const networkErrors = [];
  page.on('requestfailed', request => {
    const failure = request.failure();
    networkErrors.push({
      url: request.url(),
      error: failure ? failure.errorText : '未知錯誤'
    });
    console.log(`網絡請求失敗: ${request.url()} - ${failure ? failure.errorText : '未知錯誤'}`);
  });

  try {
    // 訪問本地開發伺服器
    console.log('步驟 1: 訪問應用首頁');
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    console.log('  ✓ 頁面已加載');
    
    // 擷取頁面截圖
    await page.screenshot({ path: 'debug_screenshots/homepage.png' });
    console.log('  ✓ 已保存首頁截圖');
    
    // 檢查基本元素
    const title = await page.title();
    console.log(`  ✓ 頁面標題: ${title}`);

    // 嘗試登入
    console.log('\n步驟 2: 嘗試登入流程');
    if (await page.isVisible('text=登入')) {
      console.log('  ✓ 發現登入按鈕');
      await page.click('text=登入');
      await page.waitForLoadState('networkidle');
      console.log('  ✓ 已導航到登入頁面');
      await page.screenshot({ path: 'debug_screenshots/login-page.png' });
      
      // 假設頁面有電子郵件和密碼輸入欄位
      const hasEmailField = await page.isVisible('input[type="email"]');
      const hasPasswordField = await page.isVisible('input[type="password"]');
      
      if (hasEmailField && hasPasswordField) {
        console.log('  ✓ 登入表單完整');
        await page.fill('input[type="email"]', 'test@example.com');
        await page.fill('input[type="password"]', 'password123');
        console.log('  ✓ 已填寫測試登入資訊');
        
        // 檢查登入按鈕
        const loginButton = await page.$('button:has-text("登入")') || await page.$('button[type="submit"]');
        if (loginButton) {
          console.log('  ✓ 找到登入提交按鈕');
        } else {
          console.log('  ✗ 未找到登入提交按鈕');
        }
      } else {
        console.log('  ✗ 登入表單缺少必要欄位');
      }
    } else if (await page.isVisible('text=退出登入') || await page.isVisible('text=登出')) {
      console.log('  ℹ 用戶已經登入');
    } else {
      console.log('  ✗ 未找到登入/登出按鈕');
    }
    
    // 檢查聊天功能
    console.log('\n步驟 3: 檢查聊天功能');
    const chatLink = await page.$('a:has-text("聊天")') || await page.$('a[href*="chat"]');
    if (chatLink) {
      console.log('  ✓ 發現聊天功能連結');
      await chatLink.click();
      await page.waitForLoadState('networkidle');
      console.log('  ✓ 已導航到聊天頁面');
      await page.screenshot({ path: 'debug_screenshots/chat-page.png' });
      
      // 檢查聊天列表
      const chatListExists = await page.isVisible('.chat-list') || await page.isVisible('ul li a');
      if (chatListExists) {
        console.log('  ✓ 發現聊天列表');
        
        // 檢查創建新聊天按鈕
        if (await page.isVisible('button:has-text("新聊天")') || await page.isVisible('[aria-label="新聊天"]')) {
          console.log('  ✓ 發現創建新聊天按鈕');
        } else {
          console.log('  ✗ 未找到創建新聊天按鈕');
        }
      } else {
        console.log('  ✗ 未找到聊天列表');
      }
    } else {
      console.log('  ✗ 未找到聊天功能入口');
    }
    
    // 檢查個人資料功能
    console.log('\n步驟 4: 檢查個人資料功能');
    const profileLink = await page.$('a:has-text("個人資料")') || await page.$('a[href*="profile"]');
    if (profileLink) {
      console.log('  ✓ 發現個人資料連結');
      await profileLink.click();
      await page.waitForLoadState('networkidle');
      console.log('  ✓ 已導航到個人資料頁面');
      await page.screenshot({ path: 'debug_screenshots/profile-page.png' });
    } else {
      console.log('  ✗ 未找到個人資料功能入口');
    }
    
    // 總結錯誤
    console.log('\n===== 除錯摘要 =====');
    console.log(`發現 ${consoleMessages.length} 個控制台錯誤/警告`);
    console.log(`發現 ${networkErrors.length} 個網絡請求錯誤`);
    
    if (consoleMessages.length > 0) {
      console.log('\n控制台錯誤/警告:');
      consoleMessages.forEach((msg, i) => {
        console.log(`${i+1}. [${msg.type}] ${msg.text}`);
      });
    }
    
    if (networkErrors.length > 0) {
      console.log('\n網絡錯誤:');
      networkErrors.forEach((err, i) => {
        console.log(`${i+1}. ${err.url} - ${err.error}`);
      });
    }
    
  } catch (error) {
    console.error('\n發生錯誤:', error);
  } finally {
    // 延遲關閉，以便查看最後的狀態
    console.log('\n等待10秒鐘以便觀察...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // 關閉瀏覽器
    await browser.close();
    console.log('除錯完成，瀏覽器已關閉');
  }
}

// 建立截圖目錄
const fs = require('fs');
if (!fs.existsSync('debug_screenshots')) {
  fs.mkdirSync('debug_screenshots');
}

// 執行除錯
debugChatApp().catch(error => {
  console.error('腳本執行失敗:', error);
  process.exit(1);
}); 