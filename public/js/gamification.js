/* =============================================
   GAMIFICATION — XP, levels, streaks,
                  achievements, header render
   ============================================= */

function calcLevel(xp) {
  let lv = 1;
  LEVEL_THRESHOLDS.forEach((t, i) => { if (xp >= t) lv = i + 1; });
  return Math.min(lv, 5);
}

async function awardXP(amount, reason) {
  user = getUser();
  const prevLevel = user.level;

  let total = amount;
  if (user.streak >= 3) total += user.streak * 5; // streak bonus

  user.xp    = (user.xp || 0) + total;
  user.level = calcLevel(user.xp);

  // Streak update
  const today     = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  if (user.lastActiveDate !== today) {
    user.streak = user.lastActiveDate === yesterday ? (user.streak || 0) + 1 : 1;
    user.lastActiveDate = today;
  }

  // Achievement checks
  const achievements = user.achievements || [];
  const hour = new Date().getHours();
  if (hour >= 22 && !achievements.includes('nightOwl'))  { achievements.push('nightOwl');  showToast(`Achievement: ${ACHIEVEMENTS_CONFIG.nightOwl.emoji} Night Owl!`, 'achievement'); }
  if (hour < 8   && !achievements.includes('earlyBird')) { achievements.push('earlyBird'); showToast(`Achievement: ${ACHIEVEMENTS_CONFIG.earlyBird.emoji} Early Bird!`, 'achievement'); }
  if (tasks.filter(t => t.completed).length === 1 && !achievements.includes('firstTask')) { achievements.push('firstTask'); showToast(`Achievement: ${ACHIEVEMENTS_CONFIG.firstTask.emoji} First Task!`, 'achievement'); }
  if ((user.streak || 0) >= 3 && !achievements.includes('streak3')) { achievements.push('streak3'); showToast(`Achievement: ${ACHIEVEMENTS_CONFIG.streak3.emoji} 3-Day Streak!`, 'achievement'); }
  if ((user.streak || 0) >= 7 && !achievements.includes('streak7')) { achievements.push('streak7'); showToast(`Achievement: ${ACHIEVEMENTS_CONFIG.streak7.emoji} Week Warrior!`, 'achievement'); }
  if (user.level >= 5 && !achievements.includes('level5'))          { achievements.push('level5');  showToast(`Achievement: ${ACHIEVEMENTS_CONFIG.level5.emoji} Graduate!`, 'achievement'); }
  user.achievements = achievements;

  if (user.level > prevLevel) showLevelUp(user.level);

  saveUser(user);
  showXPPopup(total);
  showToast(`+${total} XP${reason ? ' — ' + reason : ''}`, 'xp');
  renderHeader();
}

function renderHeader() {
  user = getUser();

  const greeting = document.getElementById('user-greeting');
  if (greeting) greeting.textContent = `Hey, ${user.name || 'there'}!`;

  const lvBadge = document.getElementById('level-badge');
  if (lvBadge) lvBadge.textContent = `LVL ${user.level || 1}`;

  const lv  = user.level || 1;
  const cur = LEVEL_THRESHOLDS[lv - 1] || 0;
  const nxt = LEVEL_THRESHOLDS[lv] || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  const pct = lv >= 5 ? 100 : Math.min(100, ((user.xp - cur) / (nxt - cur)) * 100);

  const xpFill  = document.getElementById('xp-bar-fill');
  const xpLabel = document.getElementById('xp-label');
  if (xpFill)  xpFill.style.width = `${pct}%`;
  if (xpLabel) xpLabel.textContent = lv >= 5 ? `${user.xp} XP — MAX` : `${user.xp} / ${nxt} XP`;

  const streakEl = document.getElementById('streak-val');
  if (streakEl) streakEl.textContent = user.streak || 0;
  const streakFlame = document.getElementById('streak-flame');
  if (streakFlame) streakFlame.style.fontSize = `${Math.min(1.1 + (user.streak || 0) * 0.08, 1.6)}rem`;

  prevXP = user.xp;
}

function showLevelUp(lv) {
  showToast(`⬆️ Level Up! You're now ${LEVEL_NAMES[lv - 1]} (LVL ${lv})`, 'levelup');
  launchConfetti();
}