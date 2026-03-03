/* =============================================
   CHAT — Claude API integration, chat UI,
           task generation + wellbeing modes,
           university resource cards
   ============================================= */

const CHAT_SYSTEM_PROMPT = `You are StudyBuddy AI, an intelligent student assistant with two modes.

═══ TASK GENERATION MODE ═══
Trigger: User describes a project, assignment, deadline, or asks to plan/organise academic work.

Response: Output ONLY a JSON code block — no other text before or after.

\`\`\`json
[
  {
    "title": "Action verb + specific task (max 60 chars)",
    "description": "1-2 sentences of practical, specific guidance",
    "estimatedMinutes": 30,
    "day": 1,
    "priority": "high"
  }
]
\`\`\`

Task rules:
- Every title MUST start with an action verb (Write, Research, Create, Draft, Review, Outline, etc.)
- estimatedMinutes: 20–55 (keep tasks manageable)
- day: days from today (0 = today, 1 = tomorrow, 2 = day after, etc.)
- priority: "high" | "medium" | "low"
- Generate 8–14 tasks spread realistically across the available days
- Mix: research tasks, creation tasks, review tasks, admin tasks

═══ WELLBEING MODE ═══
Trigger: User mentions stress, anxiety, feelings, struggles, loneliness, or personal difficulties.

Response:
1. Respond warmly in 2–3 short conversational sentences
2. Always validate feelings BEFORE any suggestions
3. On a new line at the very end, add: [RESOURCE:category]
   where category is exactly one of: mental_health | academic | financial | social | accessibility
4. NEVER provide counselling, therapy, or medical advice
5. ALWAYS direct to professional support services

Detect mode automatically from context. If genuinely unclear, ask one clarifying question.`;

async function askClaude(messages) {
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
      max_tokens: 2048,
      system: CHAT_SYSTEM_PROMPT,
      messages,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `API error ${res.status}`);
  }

  const data = await res.json();
  return data.content[0].text;
}

// ── Chat history persistence ──────────────────────────────────────────────────

function loadChatHistory() {
  chatHistory = JSON.parse(localStorage.getItem('studybuddy_chat') || '[]');
  if (chatHistory.length === 0) {
    chatHistory = [{
      role: 'assistant',
      content: "Hey! Tell me about an assignment, or just chat if you need support 💬",
      ts: Date.now(),
    }];
  }
}

function saveChatHistory() {
  localStorage.setItem('studybuddy_chat', JSON.stringify(chatHistory));
}

// ── Chat UI ───────────────────────────────────────────────────────────────────

function toggleChatbot() {
  chatMinimized = !chatMinimized;
  const panel   = document.getElementById('chatbot-panel');
  const chevron = document.getElementById('chat-chevron');
  const preview = document.getElementById('chat-preview');

  panel.classList.toggle('minimized', chatMinimized);

  if (chatMinimized) {
    const lastMsg = chatHistory.filter(m => m.role === 'assistant').at(-1);
    if (preview && lastMsg) preview.textContent = lastMsg.content.substring(0, 50) + '…';
    if (chevron) chevron.textContent = '▴';
  } else {
    if (chevron) chevron.textContent = '▾';
    if (preview) preview.textContent = '';
    setTimeout(() => {
      const msgs = document.getElementById('chat-messages');
      if (msgs) msgs.scrollTop = msgs.scrollHeight;
    }, 220);
  }
}

function renderChat() {
  const container = document.getElementById('chat-messages');
  if (!container) return;

  container.innerHTML = chatHistory.map(msg => {
    const isUser = msg.role === 'user';
    return `
      <div class="chat-msg ${isUser ? 'user' : 'assistant'}">
        ${!isUser ? '<div class="chat-avatar">🤖</div>' : ''}
        <div class="chat-bubble">${escHtml(msg.content)}</div>
      </div>`;
  }).join('');

  container.scrollTop = container.scrollHeight;
}

async function sendChat() {
  const input = document.getElementById('chat-input');
  const text  = (input?.value || '').trim();
  if (!text) return;
  input.value = '';

  chatHistory.push({ role: 'user', content: text, ts: Date.now() });
  renderChat();

  const typing  = document.getElementById('typing-indicator');
  const sendBtn = document.getElementById('chat-send-btn');
  if (typing)  typing.style.display = 'block';
  if (sendBtn) sendBtn.disabled = true;

  try {
    const messages = chatHistory.map(m => ({ role: m.role, content: m.content }));
    const aiText   = await askClaude(messages);

    // ── Task generation mode: parse JSON block ──────────────────────────────
    const jsonMatch = aiText.match(/```json\s*([\s\S]*?)```/);
    if (jsonMatch) {
      let parsed;
      try { parsed = JSON.parse(jsonMatch[1].trim()); } catch { parsed = null; }

      if (Array.isArray(parsed) && parsed.length > 0) {
        const today    = new Date(); today.setHours(0, 0, 0, 0);
        const newTasks = parsed.map(t => ({
          title:            t.title,
          description:      t.description || '',
          estimatedMinutes: t.estimatedMinutes || 30,
          priority:         t.priority || 'medium',
          day: (() => {
            const d = new Date(today);
            d.setDate(today.getDate() + (Number(t.day) || 0));
            return d.toISOString();
          })(),
          completed: false,
        }));

        await createTasks(newTasks);
        chatHistory.push({ role: 'assistant', content: `✅ Created ${newTasks.length} tasks! Check your calendar.`, ts: Date.now() });
        renderCalendar();
        renderTodoList();
        dismissOnboardingTip();
      } else {
        chatHistory.push({ role: 'assistant', content: aiText, ts: Date.now() });
      }

    // ── Wellbeing mode: detect resource tag ────────────────────────────────
    } else {
      const tagMatch  = aiText.match(/\[RESOURCE:(\w+)\]/);
      const resourceKey = tagMatch ? tagMatch[1].toLowerCase() : null;
      const displayText = resourceKey ? aiText.replace(/\[RESOURCE:\w+\]/g, '').trim() : aiText;
      chatHistory.push({ role: 'assistant', content: displayText, ts: Date.now(), resourceKey });
    }

    saveChatHistory();
    renderChat();
    if (chatHistory.at(-1)?.resourceKey) injectResourceCard(chatHistory.at(-1).resourceKey);

  } catch {
    chatHistory.push({ role: 'assistant', content: "I'm having trouble connecting right now. If you need urgent support, contact Samaritans on 116 123 (free, 24/7).", ts: Date.now() });
    renderChat();
  } finally {
    if (typing)  typing.style.display = 'none';
    if (sendBtn) sendBtn.disabled = false;
  }
}

function injectResourceCard(catKey) {
  const cat = UNIVERSITY_RESOURCES[catKey];
  if (!cat) return;
  const container = document.getElementById('chat-messages');
  if (!container) return;

  const card = document.createElement('div');
  card.className = 'resource-card';
  card.innerHTML = `
    <div class="resource-card-title">${cat.icon} ${cat.label}</div>
    ${cat.items.map(r => `
      <div class="resource-item">
        <div class="resource-name">${r.name}</div>
        <div class="resource-desc">${r.desc}</div>
        ${r.phone ? `<a href="tel:${r.phone}" class="resource-link" style="margin-right:4px">📞 ${r.phone}</a>` : ''}
        ${r.link  ? `<a href="${r.link}" target="_blank" rel="noopener" class="resource-link">Visit →</a>` : ''}
      </div>`).join('')}`;

  container.appendChild(card);
  container.scrollTop = container.scrollHeight;
}

function clearChat() {
  chatHistory = [{
    role: 'assistant',
    content: "Hey! Tell me about an assignment, or just chat if you need support 💬",
    ts: Date.now(),
  }];
  saveChatHistory();
  renderChat();
}