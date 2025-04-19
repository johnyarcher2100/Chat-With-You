const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3001;
const DATA_DIR = path.join(__dirname, 'data');
const TASKS_FILE = path.join(DATA_DIR, 'project_tasks.json');

// 中間件
app.use(bodyParser.json());
app.use(express.static(__dirname));

// 確保數據目錄存在
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// 路由
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'task-manager-ui.html'));
});

// 獲取任務
app.get('/api/tasks', (req, res) => {
  try {
    if (!fs.existsSync(TASKS_FILE)) {
      return res.status(404).json({ error: '任務文件不存在' });
    }

    const tasksData = fs.readFileSync(TASKS_FILE, 'utf8');
    const tasks = JSON.parse(tasksData);
    res.json(tasks);
  } catch (error) {
    console.error('獲取任務失敗:', error);
    res.status(500).json({ error: '獲取任務失敗' });
  }
});

// 保存任務
app.post('/save-tasks', (req, res) => {
  try {
    const tasks = req.body;
    fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks, null, 2), 'utf8');
    res.json({ success: true });
  } catch (error) {
    console.error('保存任務失敗:', error);
    res.status(500).json({ error: '保存任務失敗' });
  }
});

// 更新任務狀態
app.put('/api/tasks/:taskId/status', (req, res) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;

    if (!fs.existsSync(TASKS_FILE)) {
      return res.status(404).json({ error: '任務文件不存在' });
    }

    const tasksData = fs.readFileSync(TASKS_FILE, 'utf8');
    const tasks = JSON.parse(tasksData);

    // 查找並更新任務狀態
    const task = tasks.tasks.find(t => t.id === taskId);
    if (!task) {
      return res.status(404).json({ error: '任務不存在' });
    }

    task.status = status;
    fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks, null, 2), 'utf8');
    res.json({ success: true });
  } catch (error) {
    console.error('更新任務狀態失敗:', error);
    res.status(500).json({ error: '更新任務狀態失敗' });
  }
});

// 更新子任務狀態
app.put('/api/tasks/:taskId/subtasks/:subtaskId/status', (req, res) => {
  try {
    const { taskId, subtaskId } = req.params;
    const { status } = req.body;

    if (!fs.existsSync(TASKS_FILE)) {
      return res.status(404).json({ error: '任務文件不存在' });
    }

    const tasksData = fs.readFileSync(TASKS_FILE, 'utf8');
    const tasks = JSON.parse(tasksData);

    // 查找任務
    const task = tasks.tasks.find(t => t.id === taskId);
    if (!task) {
      return res.status(404).json({ error: '任務不存在' });
    }

    // 查找並更新子任務狀態
    const subtask = task.subtasks.find(s => s.id === subtaskId);
    if (!subtask) {
      return res.status(404).json({ error: '子任務不存在' });
    }

    subtask.status = status;
    fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks, null, 2), 'utf8');
    res.json({ success: true });
  } catch (error) {
    console.error('更新子任務狀態失敗:', error);
    res.status(500).json({ error: '更新子任務狀態失敗' });
  }
});

// 啟動服務器
app.listen(PORT, () => {
  console.log(`任務管理服務器運行在 http://localhost:${PORT}`);
});
