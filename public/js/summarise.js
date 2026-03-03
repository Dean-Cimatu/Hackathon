/* =============================================
   SUMMARISE — YouTube URL & video file upload
   Sends to backend which uses gpt-4o-transcribe
   + gpt-5.2 to generate bullet-point summaries
   ============================================= */

let sumActiveTab = 'url';

function openSummarise() {
  document.getElementById('summarise-modal').classList.remove('hidden');
  clearSumResults();
}

function closeSummarise() {
  document.getElementById('summarise-modal').classList.add('hidden');
  clearSumResults();
}

function switchSumTab(tab) {
  sumActiveTab = tab;
  document.getElementById('sum-url-panel').classList.toggle('hidden', tab !== 'url');
  document.getElementById('sum-file-panel').classList.toggle('hidden', tab !== 'file');
  document.getElementById('sum-tab-url').classList.toggle('active', tab === 'url');
  document.getElementById('sum-tab-file').classList.toggle('active', tab === 'file');
  clearSumResults();
}

function updateSumFilename(input) {
  const name = input.files?.[0]?.name || 'No file chosen';
  document.getElementById('sum-file-name').textContent = name;
}

function clearSumResults() {
  document.getElementById('sum-results').classList.add('hidden');
  document.getElementById('sum-loading').classList.add('hidden');
  document.getElementById('sum-bullets').innerHTML = '';
  document.getElementById('sum-url-input').value = '';
  document.getElementById('sum-file-input').value = '';
  document.getElementById('sum-file-name').textContent = 'No file chosen';
}

function showSumLoading(show) {
  document.getElementById('sum-loading').classList.toggle('hidden', !show);
  document.getElementById('sum-url-btn').disabled  = show;
  document.getElementById('sum-file-btn').disabled = show;
}

function renderSumBullets(bullets) {
  const ul = document.getElementById('sum-bullets');
  ul.innerHTML = bullets.map(b => `<li>${escHtml(b)}</li>`).join('');
  document.getElementById('sum-results').classList.remove('hidden');
}

function copySummary() {
  const bullets = [...document.querySelectorAll('#sum-bullets li')].map(li => '• ' + li.textContent).join('\n');
  navigator.clipboard.writeText(bullets).then(() => showToast('Summary copied!', 'success'));
}

async function summariseYoutube() {
  const url = document.getElementById('sum-url-input').value.trim();
  if (!url) return showToast('Please enter a YouTube URL', 'error');

  showSumLoading(true);
  try {
    const res = await fetch(`${API_BASE}/summarise/youtube`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    const data = await res.json();
    if (!res.ok || data.error) throw new Error(data.error || 'Failed to summarise');
    renderSumBullets(data.summary);
  } catch (err) {
    showToast(err.message || 'Something went wrong', 'error');
  } finally {
    showSumLoading(false);
  }
}

async function summariseFile() {
  const fileInput = document.getElementById('sum-file-input');
  if (!fileInput.files?.[0]) return showToast('Please choose a video file', 'error');

  const formData = new FormData();
  formData.append('videoFile', fileInput.files[0]);

  showSumLoading(true);
  try {
    const res = await fetch(`${API_BASE}/summarise/upload`, {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    if (!res.ok || data.error) throw new Error(data.error || 'Failed to summarise');
    renderSumBullets(data.summary);
  } catch (err) {
    showToast(err.message || 'Something went wrong', 'error');
  } finally {
    showSumLoading(false);
  }
}
