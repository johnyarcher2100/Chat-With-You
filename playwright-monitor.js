// @ts-check
const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

/**
 * 聊天應用伺服器狀態監控腳本
 * 使用Playwright持續監控應用運行狀態並記錄錯誤
 */
class ServerMonitor {
  constructor(config) {
    this.config = {
      appUrl: 'http://localhost:3000',
      checkInterval: 2 * 60 * 1000, // 每2分鐘檢查一次
      logDir: './monitor_logs',
      screenshotDir: './monitor_screenshots',
      maxRetries: 3,
      criticalPages: [
        { path: '/', name: '首頁' },
        { path: '/auth/login', name: '登入頁' },
        { path: '/chat', name: '聊天頁面' },
        { path: '/profile', name: '個人資料' }
      ],
      ...config
    };
    
    // 確保日誌和截圖目錄存在
    this.ensureDirectoriesExist();
    
    // 監控狀態
    this.isRunning = false;
    this.checkCount = 0;
    this.errorCount = 0;
    this.lastCheckTime = null;
    this.browser = null;
    this.monitorInterval = null;
  }
  
  // 確保必要的目錄存在
  ensureDirectoriesExist() {
    const dirs = [this.config.logDir, this.config.screenshotDir];
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        this.log(`已建立目錄: ${dir}`);
      }
    });
  }
  
  // 記錄日誌
  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${type.toUpperCase()}] ${message}`;
    
    console.log(logEntry);
    
    // 寫入日誌檔案
    const logFile = path.join(this.config.logDir, `server-monitor-${new Date().toISOString().split('T')[0]}.log`);
    fs.appendFileSync(logFile, logEntry + '\n');
    
    // 如果是錯誤，也寫入專門的錯誤日誌
    if (type === 'error') {
      const errorLogFile = path.join(this.config.logDir, 'errors.log');
      fs.appendFileSync(errorLogFile, logEntry + '\n');
    }
  }
  
  // 擷取錯誤截圖
  async takeScreenshot(page, name) {
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const filename = `${name}_${timestamp}.png`;
    const filePath = path.join(this.config.screenshotDir, filename);
    
    try {
      await page.screenshot({ path: filePath, fullPage: true });
      this.log(`已保存截圖: ${filename}`);
      return filename;
    } catch (error) {
      this.log(`截圖失敗: ${error.message}`, 'error');
      return null;
    }
  }
  
  // 分析頁面健康狀態
  async analyzePage(page, url, name) {
    // 定義各陣列類型
    /** @type {{url: string, error: string}[]} */
    const networkErrors = [];
    /** @type {string[]} */
    const consoleErrors = [];
    
    const results = {
      url,
      name,
      status: 'healthy',
      loadTime: 0,
      consoleErrors,
      networkErrors,
      screenshot: /** @type {string | null} */ (null)
    };
    
    // 收集控制台錯誤
    page.on('console', msg => {
      const type = msg.type();
      if (type === 'error') {
        consoleErrors.push(msg.text());
        this.log(`頁面 ${name} 出現控制台錯誤: ${msg.text()}`, 'error');
      }
    });
    
    // 收集網絡錯誤
    page.on('requestfailed', request => {
      const failure = request.failure();
      const errorText = failure ? failure.errorText : '未知錯誤';
      
      // 忽略某些非關鍵資源的錯誤
      const reqUrl = request.url();
      if (reqUrl.includes('analytics') || reqUrl.includes('tracking')) {
        return;
      }
      
      networkErrors.push({
        url: request.url(),
        error: errorText
      });
      this.log(`頁面 ${name} 出現網絡請求失敗: ${request.url()} - ${errorText}`, 'error');
    });
    
    try {
      // 計時頁面載入時間
      const startTime = Date.now();
      await page.goto(url, { timeout: 30000 });
      await page.waitForLoadState('networkidle');
      results.loadTime = Date.now() - startTime;
      
      this.log(`頁面 ${name} 載入完成，耗時 ${results.loadTime}ms`);
      
      // 如果發現錯誤，則擷取截圖
      if (results.consoleErrors.length > 0 || results.networkErrors.length > 0) {
        results.status = 'error';
        results.screenshot = await this.takeScreenshot(page, name);
      }
      
      return results;
    } catch (error) {
      this.log(`頁面 ${name} 載入失敗: ${error.message}`, 'error');
      results.status = 'critical';
      results.screenshot = await this.takeScreenshot(page, name);
      return results;
    }
  }
  
  // 檢查伺服器健康狀態
  async checkServerHealth() {
    this.checkCount++;
    this.lastCheckTime = new Date();
    this.log(`開始第 ${this.checkCount} 次健康檢查`);
    
    /** @type {Array<any>} */
    const pages = [];
    
    const checkResults = {
      timestamp: this.lastCheckTime.toISOString(),
      overallStatus: 'healthy',
      pages
    };
    
    try {
      // 啟動瀏覽器實例
      this.browser = await chromium.launch({ 
        headless: true
      });
      
      const context = await this.browser.newContext();
      
      // 檢查每個關鍵頁面
      for (const pageConfig of this.config.criticalPages) {
        const page = await context.newPage();
        const fullUrl = new URL(pageConfig.path, this.config.appUrl).toString();
        
        this.log(`檢查頁面: ${pageConfig.name} (${fullUrl})`);
        const pageResult = await this.analyzePage(page, fullUrl, pageConfig.name);
        checkResults.pages.push(pageResult);
        
        // 如果有任何頁面不健康，整體狀態就不是健康的
        if (pageResult.status !== 'healthy') {
          checkResults.overallStatus = pageResult.status;
        }
        
        await page.close();
      }
      
      // 記錄整體健康狀態
      this.log(`健康檢查完成，狀態: ${checkResults.overallStatus}`);
      
      // 如果不健康，增加錯誤計數
      if (checkResults.overallStatus !== 'healthy') {
        this.errorCount++;
        this.log(`伺服器健康狀態異常: ${checkResults.overallStatus}`, 'error');
        
        // 保存詳細檢查結果
        const resultFile = path.join(
          this.config.logDir, 
          `health-check-result-${new Date().toISOString().replace(/:/g, '-')}.json`
        );
        fs.writeFileSync(resultFile, JSON.stringify(checkResults, null, 2));
        
        // 在這裡可以添加警報功能，例如發送郵件、發送到Slack等
        // TODO: 實現警報功能
      }
      
    } catch (error) {
      this.log(`健康檢查過程中發生錯誤: ${error.message}`, 'error');
      this.errorCount++;
    } finally {
      // 關閉瀏覽器
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }
    }
  }
  
  // 開始監控
  async start() {
    if (this.isRunning) {
      this.log('監控已經在運行中');
      return;
    }
    
    this.isRunning = true;
    this.log('開始伺服器監控');
    
    // 立即執行一次檢查
    await this.checkServerHealth();
    
    // 設置定期檢查
    this.monitorInterval = setInterval(async () => {
      try {
        await this.checkServerHealth();
      } catch (error) {
        this.log(`定期檢查失敗: ${error.message}`, 'error');
      }
    }, this.config.checkInterval);
  }
  
  // 停止監控
  stop() {
    if (!this.isRunning) {
      this.log('監控尚未啟動');
      return;
    }
    
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
    
    this.isRunning = false;
    this.log('伺服器監控已停止');
  }
  
  // 獲取監控報告
  getReport() {
    const now = Date.now();
    const uptime = this.isRunning && this.lastCheckTime 
      ? Math.floor((now - this.lastCheckTime.getTime()) / 1000) 
      : 0;
      
    return {
      isRunning: this.isRunning,
      checkCount: this.checkCount,
      errorCount: this.errorCount,
      lastCheckTime: this.lastCheckTime,
      uptime
    };
  }
}

// 使用示例
const monitor = new ServerMonitor();

// 處理程序退出信號
process.on('SIGINT', () => {
  console.log('接收到終止信號，正在停止監控...');
  monitor.stop();
  process.exit(0);
});

// 啟動監控
monitor.start().catch(error => {
  console.error('啟動監控時發生錯誤:', error);
  process.exit(1);
});

// 導出 ServerMonitor 類以便在其他文件中使用
module.exports = ServerMonitor; 