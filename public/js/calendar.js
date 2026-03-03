/* =============================================
   CALENDAR — weekly grid view, task chips,
               click-to-complete
   ============================================= */

function getMonday(date) {
  const d   = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  d.setHours(0, 0, 0, 0);
  return d;
}

function isSameDay(a, b) {
  const da = new Date(a); da.setHours(0, 0, 0, 0);
  const db = new Date(b); db.setHours(0, 0, 0, 0);
  return da.getTime() === db.getTime();
}

function renderCalendar() {
  const grid    = document.getElementById('cal-grid');
  const weekLbl = document.getElementById('week-label');
  if (!grid) return;

  const today = new Date(); today.setHours(0, 0, 0, 0);
  weekLbl.textContent = calWeekStart.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const cols     = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(calWeekStart);
    d.setDate(calWeekStart.getDate() + i);
    const isToday  = d.getTime() === today.getTime();
    const dayTasks = tasks.filter(t => isSameDay(t.day, d));

    cols.push(`
      <div class="day-col ${isToday ? 'today' : ''}">
        <div class="day-col-header">
          <div class="day-name">${dayNames[i]}</div>
          <div class="day-num">${d.getDate()}</div>
        </div>
        <div class="day-tasks">
          ${dayTasks.length === 0
            ? '<div class="no-tasks-msg">—</div>'
            : dayTasks.map(t => renderCalTask(t)).join('')}
        </div>
      </div>`);
  }

  grid.innerHTML = cols.join('');
}

function renderCalTask(task) {
  const pClass = `p-${task.priority}`;
  const done   = task.completed;
  return `
    <div class="cal-task ${pClass} ${done ? 'completed' : ''}"
         onclick="handleCalClick('${task._id}', ${done})"
         title="${escHtml(task.title)} — ${task.estimatedMinutes}m">
      <div class="priority-strip"></div>
      <div class="cal-task-body">
        <div class="cal-task-title">${escHtml(task.title)}</div>
        <span class="cal-task-time">${task.estimatedMinutes}m</span>
        ${done ? '<span class="cal-task-check">✓</span>' : ''}
      </div>
    </div>`;
}

async function handleCalClick(id, currentlyDone) {
  const newDone = !currentlyDone;
  await toggleTask(id, newDone);
  if (newDone) {
    await awardXP(10, 'Task completed');
    const todayStr   = new Date().toDateString();
    const todayTasks = tasks.filter(t => new Date(t.day).toDateString() === todayStr);
    if (todayTasks.length > 0 && todayTasks.every(t => t.completed)) {
      await awardXP(25, 'All tasks for today done 🎉');
    }
  }
  renderCalendar();
  renderTodoList();
}