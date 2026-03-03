/* =============================================
   STORAGE — localStorage helpers & task CRUD
   No server required; all data stays local.
   ============================================= */

function getUser()   { return JSON.parse(localStorage.getItem('studybuddy_user') || '{"name":"Student","xp":0,"level":1,"streak":0,"lastActiveDate":null,"achievements":[]}'); }
function saveUser(u) { localStorage.setItem('studybuddy_user', JSON.stringify(u)); }
function saveTasks() { localStorage.setItem('studybuddy_tasks', JSON.stringify(tasks)); }

function logout() {
  localStorage.clear();
  window.location.href = '/login.html';
}

async function fetchTasks() {
  tasks = JSON.parse(localStorage.getItem('studybuddy_tasks') || '[]');
}

async function createTasks(arr) {
  const ts = Date.now();
  const created = arr.map((t, i) => ({ ...t, _id: `task_${ts}_${i}` }));
  tasks = [...tasks, ...created];
  saveTasks();
  return created;
}

async function toggleTask(id, completed) {
  const now = completed ? new Date().toISOString() : null;
  tasks = tasks.map(t => t._id === id ? { ...t, completed, completedAt: now } : t);
  saveTasks();
  return tasks.find(t => t._id === id);
}

async function deleteCompletedTasks() {
  tasks = tasks.filter(t => !t.completed);
  saveTasks();
}