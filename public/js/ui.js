/* =============================================
   UI HELPERS — toasts, popups, confetti,
               onboarding tip, HTML escaping
   ============================================= */

function escHtml(str) {
  return (str || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function showToast(msg, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = msg;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 350);
  }, 3200);
}

function showXPPopup(amount) {
  const pop = document.createElement('div');
  pop.className = 'xp-popup';
  pop.textContent = `+${amount} XP`;
  pop.style.cssText = 'left:50%;top:54%;';
  document.body.appendChild(pop);
  setTimeout(() => pop.remove(), 950);
}

function launchConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  if (!canvas) return;
  canvas.style.display = 'block';
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx  = canvas.getContext('2d');
  const cols = ['#f59e0b', '#ef4444', '#22c55e', '#3b82f6', '#a855f7', '#ec4899'];
  const pts  = Array.from({ length: 90 }, () => ({
    x:  Math.random() * canvas.width,
    y:  -20,
    s:  Math.random() * 9 + 4,
    c:  cols[Math.floor(Math.random() * cols.length)],
    sp: Math.random() * 4 + 2,
    w:  Math.random() * Math.PI * 2,
    r:  Math.random() * 360,
    rs: Math.random() * 6 - 3,
  }));
  let frame = 0;
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pts.forEach(p => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.r * Math.PI) / 180);
      ctx.fillStyle = p.c;
      ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.55);
      ctx.restore();
      p.y += p.sp;
      p.x += Math.sin(p.w + frame * 0.03) * 2;
      p.r += p.rs;
    });
    frame++;
    if (frame < 140) requestAnimationFrame(draw);
    else canvas.style.display = 'none';
  }
  requestAnimationFrame(draw);
}

function checkOnboardingTip() {
  const u = getUser();
  if (tasks.length === 0 && (u.xp || 0) === 0) {
    const tip = document.getElementById('onboarding-tip');
    if (tip) {
      tip.style.display = 'block';
      setTimeout(() => { if (tip) tip.style.display = 'none'; }, 6000);
    }
  }
}

function dismissOnboardingTip() {
  const tip = document.getElementById('onboarding-tip');
  if (tip) tip.style.display = 'none';
}

