/* =============================================
   POMODORO — 25/5 focus timer
   ============================================= */

let pomodoro = { active: false, mode: 'work', timeLeft: 25 * 60, iid: null };

function togglePomodoro() {
  if (pomodoro.active) {
    clearInterval(pomodoro.iid);
    pomodoro = { active: false, mode: 'work', timeLeft: 25 * 60, iid: null };
    updatePomodoroUI();
    showToast('Study mode stopped', 'info');
  } else {
    pomodoro.active   = true;
    pomodoro.mode     = 'work';
    pomodoro.timeLeft = 25 * 60;
    pomodoro.iid      = setInterval(tickPomodoro, 1000);
    updatePomodoroUI();
    showToast('Focus session started! 25 minutes 🎯', 'success');
  }
}

function tickPomodoro() {
  pomodoro.timeLeft--;
  if (pomodoro.timeLeft <= 0) {
    if (pomodoro.mode === 'work') {
      pomodoro.mode     = 'break';
      pomodoro.timeLeft = 5 * 60;
      showToast('Work session done! 5-min break ☕', 'success');
    } else {
      pomodoro.mode     = 'work';
      pomodoro.timeLeft = 25 * 60;
      showToast('Break over — back to focus 💪', 'info');
    }
  }
  updatePomodoroUI();
}

function updatePomodoroUI() {
  const timerEl = document.getElementById('pomodoro-timer');
  const btn     = document.getElementById('pomo-btn');
  if (!timerEl || !btn) return;

  if (!pomodoro.active) {
    timerEl.style.display = 'none';
    btn.innerHTML = '<span>🍅</span> Study Mode';
  } else {
    timerEl.style.display = '';
    const m = String(Math.floor(pomodoro.timeLeft / 60)).padStart(2, '0');
    const s = String(pomodoro.timeLeft % 60).padStart(2, '0');
    timerEl.textContent = `${pomodoro.mode === 'work' ? '🎯' : '☕'} ${m}:${s}`;
    btn.textContent = '⏹ Stop';
  }
}