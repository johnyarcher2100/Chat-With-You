const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const DATA_DIR = path.join(__dirname, 'data');
const TASKS_FILE = path.join(DATA_DIR, 'project_tasks.json');

// 確保數據目錄存在
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// 讀取任務數據
function readTasks() {
  try {
    if (!fs.existsSync(TASKS_FILE)) {
      return null;
    }
    const tasksData = fs.readFileSync(TASKS_FILE, 'utf8');
    return JSON.parse(tasksData);
  } catch (error) {
    console.error('讀取任務失敗:', error);
    return null;
  }
}

// 保存任務數據
function saveTasks(tasks) {
  try {
    fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks, null, 2), 'utf8');
    console.log('任務已保存到文件');
    return true;
  } catch (error) {
    console.error('保存任務失敗:', error);
    return false;
  }
}

// 啟動 mcp-shrimp-task-manager
function startMcpShrimp() {
  const mcpProcess = spawn('npx', ['mcp-shrimp-task-manager'], {
    env: {
      ...process.env,
      DATA_DIR
    }
  });

  mcpProcess.stdout.on('data', (data) => {
    console.log(`mcp-shrimp-task-manager: ${data}`);
  });

  mcpProcess.stderr.on('data', (data) => {
    console.error(`mcp-shrimp-task-manager 錯誤: ${data}`);
  });

  mcpProcess.on('close', (code) => {
    console.log(`mcp-shrimp-task-manager 進程退出，退出碼 ${code}`);
  });

  return mcpProcess;
}

// 生成任務報告
function generateTaskReport() {
  const tasks = readTasks();
  if (!tasks) {
    console.log('沒有任務數據');
    return;
  }

  console.log(`\n===== ${tasks.project} 任務報告 =====\n`);
  console.log(`描述: ${tasks.description}\n`);
  
  // 計算任務統計
  const totalTasks = tasks.tasks.length;
  const completedTasks = tasks.tasks.filter(t => t.status === 'completed').length;
  const inProgressTasks = tasks.tasks.filter(t => t.status === 'in-progress').length;
  const pendingTasks = tasks.tasks.filter(t => t.status === 'pending').length;
  
  console.log(`總任務數: ${totalTasks}`);
  console.log(`已完成: ${completedTasks} (${Math.round(completedTasks / totalTasks * 100)}%)`);
  console.log(`進行中: ${inProgressTasks} (${Math.round(inProgressTasks / totalTasks * 100)}%)`);
  console.log(`待處理: ${pendingTasks} (${Math.round(pendingTasks / totalTasks * 100)}%)\n`);
  
  // 按優先級分類
  const highPriorityTasks = tasks.tasks.filter(t => t.priority === 'high');
  const mediumPriorityTasks = tasks.tasks.filter(t => t.priority === 'medium');
  const lowPriorityTasks = tasks.tasks.filter(t => t.priority === 'low');
  
  console.log('高優先級任務:');
  highPriorityTasks.forEach(task => {
    console.log(`  - [${task.status}] ${task.id}. ${task.name}`);
  });
  
  console.log('\n中優先級任務:');
  mediumPriorityTasks.forEach(task => {
    console.log(`  - [${task.status}] ${task.id}. ${task.name}`);
  });
  
  console.log('\n低優先級任務:');
  lowPriorityTasks.forEach(task => {
    console.log(`  - [${task.status}] ${task.id}. ${task.name}`);
  });
  
  console.log('\n===== 報告結束 =====\n');
}

// 主函數
function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'start':
      console.log('啟動 mcp-shrimp-task-manager...');
      startMcpShrimp();
      break;
    
    case 'report':
      generateTaskReport();
      break;
    
    case 'init':
      // 初始化一個空的任務文件
      const emptyTasks = {
        project: '新專案',
        description: '請編輯此描述',
        tasks: []
      };
      if (saveTasks(emptyTasks)) {
        console.log('已初始化空任務文件');
      }
      break;
    
    default:
      console.log(`
使用方法:
  node mcp-integration.js start   - 啟動 mcp-shrimp-task-manager
  node mcp-integration.js report  - 生成任務報告
  node mcp-integration.js init    - 初始化空任務文件
      `);
      break;
  }
}

// 執行主函數
main();
