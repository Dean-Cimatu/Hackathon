/* =============================================
   TODO LIST — task list panel, day grouping,
               toggle, clear completed
   ============================================= */

function renderTodoList() {
  const list = document.getElementById('todo-list');
  if (!list) return;

  const incompleteCount = tasks.filter(t => !t.completed).length;
  const countBadge = document.getElementById('task-count');
  if (countBadge) countBadge.textContent = `${incompleteCount} remaining`;

  if (tasks.length === 0) {
    list.innerHTML = `
      <div class="todo-empty">
        <div style="font-size:2rem;margin-bottom:8px">📭</div>
        <p>No tasks yet — ask the chatbot about your assignments!</p>
      </div>`;
    return;
  }

  const today = new Date(); today.setHours(0, 0, 0, 0);

  // Bucket tasks into overdue vs future/today groups
  const overdue = tasks.filter(t => !t.completed && new Date(t.day).setHours(0, 0, 0, 0) < today.getTime());
  const groups  = {};
  tasks.filter(t => new Date(t.day).setHours(0, 0, 0, 0) >= today.getTime()).forEach(t => {
    const key = new Date(t.day).toDateString();
    if (!groups[key]) groups[key] = [];
    groups[key].push(t);
  });

  let html = '';
  if (overdue.length) html += buildDayGroup('overdue', '⚠️ Overdue', overdue, true);

  Object.keys(groups).sort((a, b) => new Date(a) - new Date(b)).forEach(key => {
    const d          = new Date(key);
    const isToday    = d.getTime() === today.getTime();
    const isTomorrow = d.getTime() === today.getTime() + 86400000;
    const label = isToday    ? 'Today'
                : isTomorrow ? 'Tomorrow'
                : d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });
    html += buildDayGroup(key, label, groups[key], false);
  });

  list.innerHTML = html;
}

function buildDayGroup(key, label, taskList, isOverdue) {
  const rows = taskList.map(t => `
    <div class="todo-task ${t.completed ? 'done' : ''}" id="todo-${t._id}">
      <div class="task-checkbox ${t.completed ? 'checked' : ''}"
           onclick="handleTodoToggle('${t._id}', ${t.completed})" role="button" tabindex="0"></div>
      <div class="todo-task-info">
        <div class="todo-task-title">${escHtml(t.title)}</div>
        <div class="todo-task-meta">
          <span class="time-badge">${t.estimatedMinutes}m</span>
          <span class="priority-dot p-${t.priority}"></span>
        </div>
      </div>
    </div>`).join('');

  return `
    <div class="day-group" id="group-${key}">
      <div class="day-group-header" onclick="toggleGroup('${key}')">
        <span class="day-group-label ${isOverdue ? 'overdue' : ''}">${label}</span>
        <span class="day-group-toggle" id="toggle-${key}">▾</span>
      </div>
      <div class="day-group-tasks" id="tasks-${key}">${rows}</div>
    </div>`;
}

function toggleGroup(key) {
  const tasksEl = document.getElementById(`tasks-${key}`);
  const toggle  = document.getElementById(`toggle-${key}`);
  if (!tasksEl) return;
  const collapsed = tasksEl.style.display === 'none';
  tasksEl.style.display = collapsed ? '' : 'none';
  if (toggle) toggle.classList.toggle('collapsed', !collapsed);
}

async function handleTodoToggle(id, currentlyDone) {
  const newDone = !currentlyDone;
  const row = document.getElementById(`todo-${id}`);
  if (row) row.classList.add('completing');

  await toggleTask(id, newDone);

  if (newDone) {
    await awardXP(10, 'Task completed');
    const todayStr = new Date().toDateString();
    const todayT   = tasks.filter(t => new Date(t.day).toDateString() === todayStr);
    if (todayT.length > 0 && todayT.every(t => t.completed)) {
      await awardXP(25, 'All tasks for today done! 🎉');
    }
  }

  renderTodoList();
  renderCalendar();
}

async function clearCompleted() {
  if (!tasks.some(t => t.completed)) return;
  if (!confirm('Clear all completed tasks?')) return;
  await deleteCompletedTasks();
  renderTodoList();
  renderCalendar();
  showToast('Completed tasks cleared', 'info');
}