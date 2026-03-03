/* =============================================
   APP — achievements modal, demo reset,
         init + event wiring
   ============================================= */

// ===== ACHIEVEMENT MODAL =====
function openAchievements() {
  const modal = document.getElementById('achievement-modal');
  if (!modal) return;
  modal.classList.remove('hidden');

  const grid = document.getElementById('achievement-grid');
  if (!grid) return;
  const u = getUser();

  grid.innerHTML = Object.entries(ACHIEVEMENTS_CONFIG).map(([id, a]) => {
    const unlocked = (u.achievements || []).includes(id);
    return `
      <div class="achievement-item ${unlocked ? 'unlocked' : 'locked'}">
        <div class="achievement-emoji">${a.emoji}</div>
        <div class="achievement-name">${a.name}</div>
        <div class="achievement-desc">${a.desc}</div>
      </div>`;
  }).join('');
}

// ===== DEMO RESET =====
async function resetDemo() {
  if (!confirm('Reset demo data? This will clear all tasks and progress.')) return;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d = (offset) => new Date(today.getTime() + offset * 86400000).toISOString();

  localStorage.setItem('studybuddy_tasks', JSON.stringify([
    { _id: 'demo_1', title: 'Research ER diagram notation', description: "Review crow's foot and Chen notation.",     estimatedMinutes: 30, priority: 'high',   day: d(0), completed: false, completedAt: null },
    { _id: 'demo_2', title: 'Draft entity list',            description: 'List all entities, attributes and PKs.',   estimatedMinutes: 25, priority: 'high',   day: d(1), completed: false, completedAt: null },
    { _id: 'demo_3', title: 'Define relationships',         description: 'Map cardinality and participation.',        estimatedMinutes: 40, priority: 'medium', day: d(2), completed: false, completedAt: null },
    { _id: 'demo_4', title: 'Create ER diagram draft',      description: 'Draw using draw.io or Lucidchart.',         estimatedMinutes: 55, priority: 'high',   day: d(3), completed: false, completedAt: null },
    { _id: 'demo_5', title: 'Review with group',            description: 'Get feedback before final submission.',     estimatedMinutes: 30, priority: 'medium', day: d(5), completed: false, completedAt: null },
  ]));
  localStorage.setItem('studybuddy_user', JSON.stringify({
    name: 'Student', xp: 150, level: 2, streak: 3,
    lastActiveDate: new Date().toDateString(), achievements: ['firstTask'],
  }));
  localStorage.setItem('studybuddy_chat', JSON.stringify([
    { role: 'assistant', content: "Hey! Tell me about an assignment, or just chat if you need support 💬", ts: Date.now() - 120000 },
    { role: 'user',      content: "I have a databases group project with a full ER diagram due in 10 days",  ts: Date.now() - 90000 },
    { role: 'assistant', content: "✅ Created 5 tasks! Check your calendar.", ts: Date.now() - 60000 },
  ]));
  window.location.reload();
}

// ===== INIT =====
async function init() {
  // Bootstrap default user if none exists
  if (!localStorage.getItem('studybuddy_user')) {
    saveUser({ name: 'Student', xp: 0, level: 1, streak: 0, lastActiveDate: null, achievements: [] });
  }

  user         = getUser();
  calWeekStart = getMonday(new Date());

  // ── Event listeners ───────────────────────────────────────────────────────

  document.getElementById('logout-btn')?.addEventListener('click', logout);
  document.getElementById('pomo-btn')?.addEventListener('click', togglePomodoro);
  document.getElementById('trophy-btn')?.addEventListener('click', openAchievements);
  document.getElementById('wellbeing-btn')?.addEventListener('click', openWellbeing);
  document.getElementById('wellbeing-close')?.addEventListener('click', closeWellbeing);
  document.getElementById('wellbeing-modal')?.addEventListener('click', e => {
    if (e.target === document.getElementById('wellbeing-modal')) closeWellbeing();
  });
  document.getElementById('summarise-btn')?.addEventListener('click', openSummarise);
  document.getElementById('summarise-close')?.addEventListener('click', closeSummarise);
  document.getElementById('summarise-modal')?.addEventListener('click', e => {
    if (e.target === document.getElementById('summarise-modal')) closeSummarise();
  });
  document.getElementById('wb-send-btn')?.addEventListener('click', sendWbMessage);
  document.getElementById('wb-input')?.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendWbMessage(); }
  });

  document.getElementById('achievement-modal')?.addEventListener('click', e => {
    if (e.target === document.getElementById('achievement-modal'))
      document.getElementById('achievement-modal').classList.add('hidden');
  });
  document.getElementById('achievement-close')?.addEventListener('click', () => {
    document.getElementById('achievement-modal').classList.add('hidden');
  });

  document.getElementById('cal-prev')?.addEventListener('click', () => {
    calWeekStart.setDate(calWeekStart.getDate() - 7);
    renderCalendar();
  });
  document.getElementById('cal-next')?.addEventListener('click', () => {
    calWeekStart.setDate(calWeekStart.getDate() + 7);
    renderCalendar();
  });
  document.getElementById('cal-today')?.addEventListener('click', () => {
    calWeekStart = getMonday(new Date());
    renderCalendar();
  });

  document.getElementById('chat-toggle-btn')?.addEventListener('click', toggleChatbot);
  document.getElementById('chat-clear-btn')?.addEventListener('click', clearChat);
  document.getElementById('chat-send-btn')?.addEventListener('click', sendChat);
  document.getElementById('chat-input')?.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat(); }
  });

  document.getElementById('clear-completed-btn')?.addEventListener('click', clearCompleted);
  document.getElementById('onboarding-tip')?.addEventListener('click', dismissOnboardingTip);
  document.getElementById('reset-demo-btn')?.addEventListener('click', resetDemo);

  // ── Load & render ─────────────────────────────────────────────────────────

  renderHeader();
  await fetchTasks();
  loadChatHistory();
  renderChat();
  renderCalendar();
  renderTodoList();
  updatePomodoroUI();

  // Re-inject resource cards for stored wellbeing messages
  chatHistory.forEach(m => { if (m.resourceKey) injectResourceCard(m.resourceKey); });

  checkOnboardingTip();
}

window.addEventListener('DOMContentLoaded', init);