const fs = require('fs');
const path = require('path');

// 讀取任務文件
const tasksFilePath = path.join(__dirname, 'data', 'project_tasks.json');
try {
  const tasksData = fs.readFileSync(tasksFilePath, 'utf8');
  const tasks = JSON.parse(tasksData);
  
  console.log('專案名稱:', tasks.project);
  console.log('專案描述:', tasks.description);
  console.log('任務數量:', tasks.tasks.length);
  
  // 顯示所有主要任務
  console.log('\n主要任務:');
  tasks.tasks.forEach(task => {
    console.log(`- ${task.id}: ${task.name} (優先級: ${task.priority}, 狀態: ${task.status})`);
  });
  
  // 顯示第一個任務的子任務
  const firstTask = tasks.tasks[0];
  console.log(`\n任務 ${firstTask.id} (${firstTask.name}) 的子任務:`);
  firstTask.subtasks.forEach(subtask => {
    console.log(`  - ${subtask.id}: ${subtask.name} (狀態: ${subtask.status})`);
  });
} catch (error) {
  console.error('讀取任務文件時出錯:', error);
}
