// 嘗試使用簡化的方式與 mcp-shrimp-task-manager 互動

async function listTasks() {
  try {
    const response = await fetch('http://localhost:3000/api/tasks');
    const data = await response.json();
    console.log('Tasks:', data);
    return data;
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return null;
  }
}

async function main() {
  try {
    // 嘗試列出任務
    await listTasks();
  } catch (error) {
    console.error('錯誤：', error);
  }
}

main();
