/* =============================================
   WELLBEING CHAT — dedicated support chat
   Separate history and system prompt from
   the main study assistant.
   ============================================= */

let wbHistory = [];

const WELLBEING_SYSTEM_PROMPT = `You are a compassionate student wellbeing assistant integrated into a study app.

Your only job is to listen, validate, and gently guide students toward the right support.

HOW TO RESPOND:
1. Keep responses short — 2–4 warm, conversational sentences maximum
2. Always validate feelings BEFORE anything else ("That sounds really tough", "It makes sense you'd feel that way", etc.)
3. Ask ONE gentle follow-up question to understand better, unless the need is already clear
4. When you have enough context to suggest a category of support, end your message on a new line with: [RESOURCE:category]
   where category is exactly one of: mental_health | academic | financial | social | accessibility

WHEN TO SURFACE RESOURCES:
- mental_health: stress, anxiety, low mood, feeling overwhelmed, loneliness, crisis
- academic: failing, deadlines, extensions, struggling with coursework, exam pressure
- financial: money worries, can't afford things, debt, hardship
- social: isolation, friendship issues, feeling left out, belonging
- accessibility: disability, learning difficulties, needing adjustments

STRICT RULES:
- NEVER diagnose, give medical advice, or act as a therapist
- NEVER be dismissive or skip straight to solutions
- ALWAYS recommend professional support — you are a signpost, not a substitute
- If someone expresses thoughts of self-harm or crisis, surface mental_health resources immediately and include the Samaritans number (116 123, free 24/7)`;

// ── Open / close ──────────────────────────────────────────────────────────────

function openWellbeing() {
  const modal = document.getElementById('wellbeing-modal');
  if (!modal) return;
  modal.classList.remove('hidden');

  // Start fresh each time with a warm greeting
  wbHistory = [{
    role: 'assistant',
    content: "Hi, I'm here for you 💚 This is a safe space — you can share whatever's on your mind. How are you feeling today?",
  }];
  renderWbChat();

  setTimeout(() => document.getElementById('wb-input')?.focus(), 100);
}

function closeWellbeing() {
  document.getElementById('wellbeing-modal')?.classList.add('hidden');
  wbHistory = [];
}

// ── Render ────────────────────────────────────────────────────────────────────

function renderWbChat() {
  const container = document.getElementById('wb-messages');
  if (!container) return;

  container.innerHTML = wbHistory.map(msg => {
    const isUser = msg.role === 'user';
    return `
      <div class="chat-msg ${isUser ? 'user' : 'assistant'}">
        ${!isUser ? '<div class="chat-avatar">💚</div>' : ''}
        <div class="chat-bubble">${escHtml(msg.content)}</div>
      </div>`;
  }).join('');

  container.scrollTop = container.scrollHeight;
}

// ── Send message ──────────────────────────────────────────────────────────────

async function sendWbMessage() {
  const input = document.getElementById('wb-input');
  const text  = (input?.value || '').trim();
  if (!text) return;
  input.value = '';

  wbHistory.push({ role: 'user', content: text });
  renderWbChat();

  const typing  = document.getElementById('wb-typing');
  const sendBtn = document.getElementById('wb-send-btn');
  if (typing)  typing.style.display = 'block';
  if (sendBtn) sendBtn.disabled = true;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 512,
        system: WELLBEING_SYSTEM_PROMPT,
        messages: wbHistory.map(m => ({ role: m.role, content: m.content })),
      }),
    });

    if (!res.ok) throw new Error(`API error ${res.status}`);
    const data    = await res.json();
    const aiText  = data.content[0].text;

    // Strip [RESOURCE:x] tag, keep text clean
    const tagMatch   = aiText.match(/\[RESOURCE:(\w+)\]/);
    const resourceKey = tagMatch ? tagMatch[1].toLowerCase() : null;
    const displayText = aiText.replace(/\[RESOURCE:\w+\]/g, '').trim();

    wbHistory.push({ role: 'assistant', content: displayText, resourceKey });
    renderWbChat();

    if (resourceKey) injectWbResourceCard(resourceKey);

  } catch {
    wbHistory.push({
      role: 'assistant',
      content: "I'm having trouble connecting right now. If you need urgent support, please contact Samaritans on 116 123 — they're free and available 24/7.",
    });
    renderWbChat();
  } finally {
    if (typing)  typing.style.display = 'none';
    if (sendBtn) sendBtn.disabled = false;
  }
}

// ── Resource card injection ───────────────────────────────────────────────────

function injectWbResourceCard(catKey) {
  const cat = UNIVERSITY_RESOURCES[catKey];
  if (!cat) return;
  const container = document.getElementById('wb-messages');
  if (!container) return;

  const card = document.createElement('div');
  card.className = 'resource-card wb-resource-card';
  card.innerHTML = `
    <div class="resource-card-title">${cat.icon} ${cat.label}</div>
    ${cat.items.map(r => `
      <div class="resource-item">
        <div class="resource-name">${r.name}</div>
        <div class="resource-desc">${r.desc}</div>
        <div style="display:flex;gap:6px;margin-top:4px;flex-wrap:wrap;">
          ${r.phone ? `<a href="tel:${r.phone}" class="resource-link">📞 ${r.phone}</a>` : ''}
          ${r.link  ? `<a href="${r.link}" target="_blank" rel="noopener" class="resource-link">Visit →</a>` : ''}
        </div>
      </div>`).join('')}`;

  container.appendChild(card);
  container.scrollTop = container.scrollHeight;
}
