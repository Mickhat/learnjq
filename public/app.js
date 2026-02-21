// learnjq — Main Application Logic
// Single-file frontend: all UI modes, routing, progress tracking, and jq execution

// === STATE ===

let currentLesson = 0;
let currentChallenge = 0;
let completedLessons = new Set(JSON.parse(localStorage.getItem('learnjq-completed') || '[]'));
let completedChallenges = new Set(JSON.parse(localStorage.getItem('learnjq-challenges') || '[]'));
let pgHistory = JSON.parse(localStorage.getItem('learnjq-history') || '[]');
let debounceTimer = null;

// === HAMBURGER NAV (mobile) ===

/** Toggle the mobile navigation dropdown */
function toggleNav() {
  document.getElementById('nav-tabs').classList.toggle('open');
}

/** Close the mobile navigation dropdown */
function closeNav() {
  document.getElementById('nav-tabs').classList.remove('open');
}

// === TUTORIAL SANDBOXES ===
// Interactive mini-playgrounds embedded in the Getting Started tutorial

let tutorialTimers = new WeakMap();

/**
 * Run a tutorial sandbox's jq filter with debouncing
 * @param {HTMLInputElement} inputEl - The sandbox input element
 */
async function runTutorialSandbox(inputEl) {
  const sandbox = inputEl.closest('.tutorial-sandbox');
  const outputEl = sandbox.querySelector('.sandbox-output');
  const filter = inputEl.value.trim();
  const jsonInput = sandbox.dataset.input;

  const existing = tutorialTimers.get(sandbox);
  if (existing) clearTimeout(existing);

  if (!filter) {
    outputEl.textContent = '';
    return;
  }

  tutorialTimers.set(sandbox, setTimeout(async () => {
    const result = await runJq(jsonInput, filter);
    if (result.error) {
      outputEl.textContent = result.error;
      outputEl.style.color = '#f47067';
    } else {
      outputEl.textContent = result.output.trimEnd();
      outputEl.style.color = '#7ee787';
    }
  }, 250));
}

/** Initialize all tutorial sandboxes on page load */
function initTutorialSandboxes() {
  document.querySelectorAll('.tutorial-sandbox').forEach(sandbox => {
    const input = sandbox.querySelector('.sandbox-input');
    if (input && input.value) {
      runTutorialSandbox(input);
    }
  });
}

// === JQ EXECUTION ===

/**
 * Execute a jq filter against input JSON via the API
 * @param {string} input - JSON input string
 * @param {string} filter - jq filter expression
 * @param {Object} opts - Optional flags (rawOutput, slurp, nullInput)
 * @returns {Promise<{output?: string, error?: string, time: number}>}
 */
async function runJq(input, filter, opts = {}) {
  const start = performance.now();
  try {
    const res = await fetch('/api/jq', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input, filter, ...opts })
    });
    const data = await res.json();
    data.time = Math.round(performance.now() - start);
    return data;
  } catch (e) {
    return { error: e.message, time: 0 };
  }
}

/** Navigate to the first lesson (logo click handler) */
function goHome() {
  loadLesson(0);
  showMode('learn');
  history.replaceState(null, '', location.pathname);
}

// === MODE SWITCHING ===

/**
 * Switch to a different UI mode (learn, playground, challenges, etc.)
 * @param {string} mode - Mode name
 * @param {boolean} skipHash - If true, don't update the URL hash
 */
function showMode(mode, skipHash) {
  document.querySelectorAll('.mode-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  document.getElementById(`mode-${mode}`).classList.add('active');
  document.querySelector(`[data-mode="${mode}"]`).classList.add('active');

  if (mode === 'reference') renderReference();
  if (mode === 'tutorial') initTutorialSandboxes();
  updateMobileToggle(mode);

  // Hide footer on full-screen modes
  const footer = document.getElementById('site-footer');
  if (footer) {
    const hideFooter = ['playground', 'visualizer', 'reference'].includes(mode);
    footer.style.display = hideFooter ? 'none' : '';
  }

  if (!skipHash) updateHash();
}

// === URL HASH / SHAREABLE URLS ===

/** Update the URL hash to reflect the current mode and state */
function updateHash() {
  const mode = document.querySelector('.nav-tab.active')?.dataset.mode || 'learn';
  const params = new URLSearchParams();

  if (mode === 'learn') {
    const lesson = LESSONS[currentLesson];
    if (lesson) params.set('l', lesson.id);
  } else if (mode === 'challenges') {
    const ch = CHALLENGES[currentChallenge];
    if (ch) params.set('c', ch.id);
  } else if (mode === 'playground') {
    const filter = document.getElementById('pg-filter')?.value;
    const input = document.getElementById('pg-input')?.value;
    if (filter && filter !== '.') params.set('f', filter);
    if (input) params.set('i', input);
  } else if (mode === 'visualizer') {
    const filter = document.getElementById('viz-filter')?.value;
    if (filter) params.set('f', filter);
  } else if (mode === 'explain') {
    const filter = document.getElementById('explain-filter')?.value;
    if (filter) params.set('f', filter);
  }

  const paramStr = params.toString();
  const hash = paramStr ? `${mode}?${paramStr}` : mode;
  history.replaceState(null, '', `#${hash}`);
}

/**
 * Restore UI state from the URL hash (for shareable links)
 * @returns {boolean} true if a valid hash was found and loaded
 */
function loadFromHash() {
  const hash = location.hash.slice(1);
  if (!hash) return false;

  const [modePart, paramStr] = hash.split('?');
  const mode = modePart || 'learn';
  const params = new URLSearchParams(paramStr || '');

  const validModes = ['tutorial', 'learn', 'playground', 'challenges', 'visualizer', 'explain', 'reference'];
  if (!validModes.includes(mode)) return false;

  showMode(mode, true);

  if (mode === 'learn' && params.has('l')) {
    const idx = LESSONS.findIndex(l => l.id === params.get('l'));
    if (idx >= 0) loadLesson(idx);
  } else if (mode === 'challenges' && params.has('c')) {
    const idx = CHALLENGES.findIndex(c => c.id === params.get('c'));
    if (idx >= 0) loadChallenge(idx);
  } else if (mode === 'playground') {
    if (params.has('f')) document.getElementById('pg-filter').value = params.get('f');
    if (params.has('i')) document.getElementById('pg-input').value = params.get('i');
    if (params.has('f') || params.has('i')) runPlayground();
  } else if (mode === 'visualizer') {
    if (params.has('f')) {
      document.getElementById('viz-filter').value = params.get('f');
      runVisualizer();
    }
  } else if (mode === 'explain') {
    if (params.has('f')) {
      document.getElementById('explain-filter').value = params.get('f');
      runExplainer();
    }
  }

  return true;
}

/** Build the current shareable URL */
function getShareUrl() {
  updateHash();
  return window.location.href;
}

/** Copy the shareable URL to clipboard and show a toast */
async function copyShareUrl() {
  const url = getShareUrl();
  try {
    await navigator.clipboard.writeText(url);
    showShareToast('Link copied!');
  } catch {
    const input = document.createElement('input');
    input.value = url;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
    showShareToast('Link copied!');
  }
}

/** Show a temporary toast notification */
function showShareToast(msg) {
  let toast = document.getElementById('share-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'share-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2000);
}

/** Toggle between dark and light theme */
function toggleTheme() {
  const html = document.documentElement;
  const current = html.getAttribute('data-theme');
  html.setAttribute('data-theme', current === 'dark' ? 'light' : 'dark');
  document.querySelector('.theme-toggle').textContent = current === 'dark' ? '☀️' : '🌙';
  localStorage.setItem('learnjq-theme', current === 'dark' ? 'light' : 'dark');
}

// === LEARN MODE ===

/** Render the lesson sidebar list grouped by category */
function renderLessonList() {
  const list = document.getElementById('lesson-list');
  let html = '';
  let currentCat = '';

  LESSONS.forEach((lesson, i) => {
    if (lesson.category !== currentCat) {
      currentCat = lesson.category;
      html += `<div class="lesson-category"><div class="lesson-category-title">${currentCat}</div></div>`;
    }
    const done = completedLessons.has(lesson.id);
    const active = i === currentLesson ? 'active' : '';
    html += `<div class="lesson-item ${active}" data-idx="${i}" onclick="loadLesson(${i})">
      <span class="check ${done ? '' : 'pending'}">${done ? '✓' : '○'}</span>
      <span>${lesson.title}</span>
    </div>`;
  });

  list.innerHTML = html;
  updateProgress();
}

/**
 * Load a specific lesson by index
 * @param {number} idx - Lesson index in the LESSONS array
 */
function loadLesson(idx) {
  currentLesson = idx;
  const lesson = LESSONS[idx];
  updateHash();

  document.getElementById('lesson-title').textContent = lesson.title;
  document.getElementById('lesson-desc').textContent = lesson.desc;
  document.getElementById('lesson-explanation').innerHTML = lesson.explanation;
  document.getElementById('learn-input').value = lesson.input;
  document.getElementById('learn-filter').value = lesson.filter || '';
  document.getElementById('learn-expected').textContent = lesson.expected;
  document.getElementById('learn-hint').textContent = lesson.hint;
  document.getElementById('learn-hint').classList.add('hidden');
  document.getElementById('learn-output').textContent = '';
  document.getElementById('learn-output').className = 'output-area';
  document.getElementById('learn-status').textContent = '';

  // Highlight active lesson in sidebar
  document.querySelectorAll('.lesson-item').forEach(el => el.classList.remove('active'));
  const item = document.querySelector(`.lesson-item[data-idx="${idx}"]`);
  if (item) {
    item.classList.add('active');
    item.scrollIntoView({ block: 'nearest' });
  }

  // Auto-run if filter is pre-filled (demo lessons)
  if (lesson.filter) runLearnQuery();

  document.getElementById('learn-filter').focus();

  // Close sidebar on mobile after selection
  if (window.innerWidth <= 768) closeSidebar();
}

/** Execute the current lesson's filter and check against expected output */
async function runLearnQuery() {
  const input = document.getElementById('learn-input').value;
  const filter = document.getElementById('learn-filter').value;
  const output = document.getElementById('learn-output');
  const status = document.getElementById('learn-status');

  if (!filter.trim()) {
    output.textContent = '';
    output.className = 'output-area';
    status.textContent = '';
    return;
  }

  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(async () => {
    const lesson = LESSONS[currentLesson];
    const opts = lesson.rawOutput ? { rawOutput: true } : {};
    const result = await runJq(input, filter, opts);

    if (result.error) {
      output.textContent = result.error;
      output.className = 'output-area error';
      status.textContent = '❌';
    } else {
      output.textContent = result.output.trimEnd();
      output.className = 'output-area';

      // Check if output matches expected
      const normalized = result.output.trimEnd();
      const expected = lesson.expected.trimEnd();

      if (normalized === expected) {
        output.className = 'output-area success';
        status.textContent = '✅ Correct!';
        completedLessons.add(lesson.id);
        localStorage.setItem('learnjq-completed', JSON.stringify([...completedLessons]));
        renderLessonList();
      } else {
        status.textContent = '';
      }
    }
  }, 200);
}

/** Toggle the hint visibility for the current lesson */
function showHint() {
  const hint = document.getElementById('learn-hint');
  hint.classList.toggle('hidden');
}

/** Reset the current lesson's exercise to its default state */
function resetExercise() {
  const lesson = LESSONS[currentLesson];
  document.getElementById('learn-input').value = lesson.input;
  document.getElementById('learn-filter').value = '';
  document.getElementById('learn-output').textContent = '';
  document.getElementById('learn-output').className = 'output-area';
  document.getElementById('learn-status').textContent = '';
  document.getElementById('learn-filter').focus();
}

/** Navigate to the previous lesson */
function prevLesson() {
  if (currentLesson > 0) loadLesson(currentLesson - 1);
}

/** Navigate to the next lesson */
function nextLesson() {
  if (currentLesson < LESSONS.length - 1) loadLesson(currentLesson + 1);
}

/**
 * Filter the lesson list by search query
 * @param {string} query - Search text
 */
function filterLessons(query) {
  const q = query.toLowerCase();
  document.querySelectorAll('.lesson-item').forEach(el => {
    const idx = parseInt(el.dataset.idx);
    const lesson = LESSONS[idx];
    const match = lesson.title.toLowerCase().includes(q) ||
                  lesson.desc.toLowerCase().includes(q) ||
                  lesson.category.toLowerCase().includes(q);
    el.style.display = match ? '' : 'none';
  });
  document.querySelectorAll('.lesson-category').forEach(cat => {
    const title = cat.querySelector('.lesson-category-title')?.textContent?.toLowerCase() || '';
    if (!q) cat.style.display = '';
  });
}

/** Update progress badges and progress bars for lessons and challenges */
function updateProgress() {
  const badge = document.getElementById('progress-badge');
  badge.textContent = `${completedLessons.size}/${LESSONS.length}`;

  // Lesson progress bar
  const lFill = document.getElementById('lesson-progress-fill');
  const lLabel = document.getElementById('lesson-progress-label');
  if (lFill && lLabel) {
    const pct = LESSONS.length ? (completedLessons.size / LESSONS.length * 100) : 0;
    lFill.style.width = pct + '%';
    lLabel.textContent = `${completedLessons.size}/${LESSONS.length}`;
  }

  // Challenge progress bar
  const cFill = document.getElementById('challenge-progress-fill');
  const cLabel = document.getElementById('challenge-progress-label');
  if (cFill && cLabel) {
    const pct = CHALLENGES.length ? (completedChallenges.size / CHALLENGES.length * 100) : 0;
    cFill.style.width = pct + '%';
    cLabel.textContent = `${completedChallenges.size}/${CHALLENGES.length}`;
  }
}

// === PLAYGROUND ===

/** Run the playground's jq filter with debouncing */
async function runPlayground() {
  const input = document.getElementById('pg-input').value;
  const filter = document.getElementById('pg-filter').value;
  const output = document.getElementById('pg-output');
  const timeEl = document.getElementById('pg-time');

  if (!filter.trim()) {
    output.textContent = '';
    return;
  }

  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(async () => {
    const opts = {
      rawOutput: document.getElementById('opt-raw').classList.contains('active'),
      slurp: document.getElementById('opt-slurp').classList.contains('active'),
      nullInput: document.getElementById('opt-null').classList.contains('active'),
    };

    const result = await runJq(input, filter, opts);

    if (result.error) {
      output.textContent = result.error;
      output.className = 'output-area error';
    } else {
      output.textContent = result.output.trimEnd();
      output.className = 'output-area';
      addToHistory(filter);
    }

    timeEl.textContent = `${result.time}ms`;
  }, 300);
}

/** Load sample JSON data into the playground input */
function loadSample() {
  document.getElementById('pg-input').value = JSON.stringify({
    "users": [
      {"name": "Alice", "age": 30, "city": "Berlin", "hobbies": ["coding", "hiking"]},
      {"name": "Bob", "age": 25, "city": "Munich", "hobbies": ["gaming", "cooking"]},
      {"name": "Charlie", "age": 35, "city": "Hamburg", "hobbies": ["reading", "cycling"]},
      {"name": "Diana", "age": 28, "city": "Berlin", "hobbies": ["painting", "coding"]}
    ],
    "meta": {"total": 4, "page": 1}
  }, null, 2);
  runPlayground();
}

/** Pretty-print the playground JSON input */
function formatJSON() {
  const input = document.getElementById('pg-input');
  try {
    input.value = JSON.stringify(JSON.parse(input.value), null, 2);
  } catch (e) {
    // Not valid JSON, leave it
  }
}

/** Clear all playground fields */
function clearPlayground() {
  document.getElementById('pg-input').value = '';
  document.getElementById('pg-filter').value = '.';
  document.getElementById('pg-output').textContent = '';
}

/** Copy the playground output to clipboard */
function copyOutput() {
  const text = document.getElementById('pg-output').textContent;
  navigator.clipboard.writeText(text);
}

/**
 * Add a filter to the playground history (most recent first, max 20)
 * @param {string} filter - jq filter to save
 */
function addToHistory(filter) {
  if (!filter || filter === '.' || pgHistory.includes(filter)) return;
  pgHistory.unshift(filter);
  if (pgHistory.length > 20) pgHistory.pop();
  localStorage.setItem('learnjq-history', JSON.stringify(pgHistory));
  renderHistory();
}

/** Render the playground filter history bar */
function renderHistory() {
  const el = document.getElementById('pg-history');
  el.innerHTML = pgHistory.slice(0, 10).map(h =>
    `<button class="history-item" onclick="document.getElementById('pg-filter').value='${h.replace(/'/g, "\\'")}';runPlayground()">${h}</button>`
  ).join('');
}

// === CHALLENGES ===

/** Render the challenge sidebar list with difficulty badges */
function renderChallengeList() {
  const list = document.getElementById('challenge-list');
  list.innerHTML = CHALLENGES.map((ch, i) => {
    const done = completedChallenges.has(ch.id);
    const diffClass = `ch-diff diff-${ch.difficulty}`;
    return `<div class="challenge-item ${i === currentChallenge ? 'active' : ''}" onclick="loadChallenge(${i})">
      <span>${done ? '✅' : '○'}</span>
      <span>${ch.title}</span>
      <span class="${diffClass}">${ch.difficulty}</span>
    </div>`;
  }).join('');
}

/**
 * Load a specific challenge by index
 * @param {number} idx - Challenge index in the CHALLENGES array
 */
function loadChallenge(idx) {
  currentChallenge = idx;
  const ch = CHALLENGES[idx];
  updateHash();

  document.getElementById('ch-title').textContent = ch.title;
  document.getElementById('ch-difficulty').textContent = ch.difficulty;
  document.getElementById('ch-difficulty').className = `diff-${ch.difficulty}`;
  document.getElementById('ch-desc').textContent = ch.desc;
  document.getElementById('ch-input').textContent = JSON.stringify(JSON.parse(ch.input), null, 2);
  document.getElementById('ch-expected').textContent = ch.expected;
  document.getElementById('ch-filter').value = '';
  document.getElementById('ch-output').textContent = '';
  document.getElementById('ch-output').className = 'output-area';
  document.getElementById('ch-result').className = 'hidden';

  renderChallengeList();
  document.getElementById('ch-filter').focus();

  if (window.innerWidth <= 768) closeSidebar();
}

/** Check the user's challenge solution against expected output */
async function checkChallenge() {
  const ch = CHALLENGES[currentChallenge];
  const filter = document.getElementById('ch-filter').value;
  const output = document.getElementById('ch-output');
  const result = document.getElementById('ch-result');

  if (!filter.trim()) return;

  const res = await runJq(ch.input, filter);

  if (res.error) {
    output.textContent = res.error;
    output.className = 'output-area error';
    result.textContent = '❌ Error in your filter';
    result.className = 'incorrect';
    return;
  }

  output.textContent = res.output.trimEnd();

  if (res.output.trimEnd() === ch.expected.trimEnd()) {
    output.className = 'output-area success';
    result.textContent = '🎉 Correct! Well done!';
    result.className = 'correct';
    completedChallenges.add(ch.id);
    localStorage.setItem('learnjq-challenges', JSON.stringify([...completedChallenges]));
    renderChallengeList();
    updateProgress();
  } else {
    output.className = 'output-area';
    result.textContent = '❌ Not quite — compare your output with the expected output';
    result.className = 'incorrect';
  }
}

// === VISUALIZER ===

/** Pre-built examples for the pipe visualizer */
const VIZ_EXAMPLES = [
  {
    input: '[{"name":"Alice","age":30,"city":"Berlin"},{"name":"Bob","age":25,"city":"Munich"},{"name":"Charlie","age":35,"city":"Berlin"}]',
    filter: '.[] | select(.age > 28) | .name'
  },
  {
    input: '{"users":[{"name":"Alice","age":30},{"name":"Bob","age":25},{"name":"Charlie","age":35}]}',
    filter: '.users | sort_by(.age) | reverse | .[0]'
  },
  {
    input: '{"users":[{"name":"Alice","age":30,"city":"Berlin"},{"name":"Bob","age":25,"city":"Munich"},{"name":"Charlie","age":35,"city":"Berlin"}]}',
    filter: '.users | map({name, city}) | group_by(.city)'
  },
  {
    input: '{"users":[{"name":"Alice","age":30},{"name":"Bob","age":25},{"name":"Charlie","age":35}]}',
    filter: '.users | map(.age) | add / length'
  },
  {
    input: '{"name":"Alice","age":30,"city":"Berlin","active":true,"score":95}',
    filter: 'to_entries | map(select(.value | type == "string")) | from_entries'
  }
];

/** Load sample data into the visualizer input */
function loadVizSample() {
  document.getElementById('viz-input').value = JSON.stringify({
    users: [
      {name: "Alice", age: 30, city: "Berlin", role: "admin"},
      {name: "Bob", age: 25, city: "Munich", role: "user"},
      {name: "Charlie", age: 35, city: "Berlin", role: "mod"},
      {name: "Diana", age: 28, city: "Hamburg", role: "user"}
    ]
  }, null, 2);
}

/**
 * Load a pre-built visualizer example by index
 * @param {number} idx - Example index
 */
function vizExample(idx) {
  const ex = VIZ_EXAMPLES[idx];
  document.getElementById('viz-input').value = JSON.stringify(JSON.parse(ex.input), null, 2);
  document.getElementById('viz-filter').value = ex.filter;
  runVisualizer();
}

/** Run the pipe visualizer — split filter on pipes and show step-by-step results */
async function runVisualizer() {
  const input = document.getElementById('viz-input').value;
  const filter = document.getElementById('viz-filter').value;
  const pipeline = document.getElementById('viz-pipeline');

  if (!filter.trim()) return;

  pipeline.innerHTML = '<div class="viz-empty"><p>⏳ Running...</p></div>';

  try {
    const res = await fetch('/api/jq/steps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input, filter })
    });
    const data = await res.json();

    if (data.error) {
      pipeline.innerHTML = `<div class="viz-empty"><p>❌ ${escapeHtml(data.error)}</p></div>`;
      return;
    }

    renderPipeline(data.steps, input);
  } catch (e) {
    pipeline.innerHTML = `<div class="viz-empty"><p>❌ ${escapeHtml(e.message)}</p></div>`;
  }
}

/**
 * Render the visualizer pipeline with step-by-step output cards
 * @param {Array} steps - Step results from the API
 * @param {string} originalInput - The original JSON input
 */
function renderPipeline(steps, originalInput) {
  const pipeline = document.getElementById('viz-pipeline');
  let html = '<div class="viz-steps">';

  // Show original input
  html += `
    <div class="viz-step">
      <div class="viz-step-header">
        <div class="viz-step-num first">IN</div>
        <span class="viz-step-fragment">Input</span>
      </div>
      <div class="viz-input-step">${escapeHtml(formatCompact(originalInput).trim())}</div>
    </div>
    <div class="viz-arrow"></div>
  `;

  // Show each pipeline step
  steps.forEach((step, i) => {
    const isLast = i === steps.length - 1;
    const hasError = !!step.error;
    const output = step.output || step.error || '(empty)';

    // Detect output type from first value
    let outputType = '';
    if (step.output) {
      const firstLine = step.output.trim();
      if (firstLine.startsWith('{')) outputType = 'object';
      else if (firstLine.startsWith('[')) outputType = 'array';
      else if (firstLine.startsWith('"')) outputType = 'string';
      else if (firstLine === 'null') outputType = 'null';
      else if (firstLine === 'true' || firstLine === 'false') outputType = 'boolean';
      else if (!isNaN(firstLine)) outputType = 'number';
    }

    // Count separate output values (for multi-output like .[])
    let valueCount = 0;
    if (step.output) {
      try {
        const trimmed = step.output.trim();
        let depth = 0;
        let inStr = false;
        let count = 0;
        let hasContent = false;
        for (let j = 0; j < trimmed.length; j++) {
          const ch = trimmed[j];
          if (ch === '"' && (j === 0 || trimmed[j-1] !== '\\')) inStr = !inStr;
          if (!inStr) {
            if (ch === '{' || ch === '[') depth++;
            if (ch === '}' || ch === ']') depth--;
            if (depth === 0 && ch === '\n' && hasContent) count++;
          }
          if (ch !== '\n' && ch !== ' ') hasContent = true;
        }
        valueCount = count + (hasContent ? 1 : 0);
      } catch(e) { valueCount = 0; }
    }

    html += `
      <div class="viz-step">
        <div class="viz-step-header">
          <div class="viz-step-num ${hasError ? 'error' : ''}">${step.step}</div>
          <span class="viz-step-fragment">${escapeHtml(step.fragment)}</span>
          <span class="viz-step-full">${escapeHtml(step.fullFilter)}</span>
        </div>
        <div class="viz-step-output ${hasError ? 'error' : ''} ${isLast && !hasError ? 'final' : ''}">${escapeHtml(truncateOutput(output, 1500).trim())}${outputType ? `<span class="viz-step-type">${outputType}</span>` : ''}</div>
        <div class="viz-step-meta">
          ${valueCount > 1 ? `<span class="output-count">📊 ${valueCount} values</span>` : ''}
          ${outputType ? `<span class="output-type">Type: ${outputType}</span>` : ''}
          ${hasError ? '<span style="color:var(--red)">⚠ Error at this step</span>' : ''}
        </div>
      </div>
      ${!isLast ? '<div class="viz-arrow"></div>' : ''}
    `;
  });

  html += '</div>';
  pipeline.innerHTML = html;
}

// === UTILITY FUNCTIONS ===

/** Escape HTML special characters to prevent XSS */
function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Pretty-print a JSON string (or return as-is if invalid) */
function formatCompact(jsonStr) {
  try {
    return JSON.stringify(JSON.parse(jsonStr), null, 2);
  } catch(e) {
    return jsonStr;
  }
}

/** Truncate output to maxLen characters with an indicator */
function truncateOutput(str, maxLen) {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen) + '\n... (truncated)';
}

// === EXPLAINER ===

/** Run the filter explainer — tokenize and annotate each part */
function runExplainer() {
  const filter = document.getElementById('explain-filter').value;
  const result = document.getElementById('explain-result');

  if (!filter.trim()) {
    result.innerHTML = `<div class="explain-empty">
      <p>💡 <strong>Filter Explainer</strong></p>
      <p>Type any jq expression above and each part will be annotated.</p>
    </div>`;
    return;
  }

  const tokens = tokenizeJq(filter);
  let html = '<div class="explain-tokens">';

  // Render color-coded token bar
  html += '<div class="explain-bar">';
  tokens.forEach((t, idx) => {
    if (t.cat === 'space') {
      html += `<span class="ex-space">${t.text.replace(/ /g, '&nbsp;')}</span>`;
    } else {
      const color = CAT_COLORS[t.cat] || CAT_COLORS.unknown;
      html += `<span class="ex-token" data-idx="${idx}" style="color:${color};border-bottom-color:${color}" onmouseenter="highlightToken(${idx})" onmouseleave="unhighlightToken(${idx})" onclick="focusToken(${idx})">${escapeHtml(t.text)}</span>`;
    }
  });
  html += '</div>';

  // Render per-token annotations
  html += '<div class="explain-annotations">';
  tokens.forEach((t, idx) => {
    if (t.cat === 'space') return;
    const color = CAT_COLORS[t.cat] || CAT_COLORS.unknown;
    html += `<div class="ex-annotation" id="ex-ann-${idx}" data-idx="${idx}">
      <div class="ex-ann-header">
        <span class="ex-ann-token" style="color:${color}">${escapeHtml(t.text)}</span>
        <span class="ex-ann-cat" style="background:${color}20;color:${color}">${t.cat}</span>
      </div>
      <div class="ex-ann-desc">${escapeHtml(t.desc || '')}</div>
      ${t.doc ? `<div class="ex-ann-doc">${escapeHtml(t.doc)}</div>` : ''}
    </div>`;
  });
  html += '</div></div>';

  result.innerHTML = html;
}

/**
 * Load a pre-built example into the explainer
 * @param {string} filter - jq filter to explain
 */
function explainExample(filter) {
  document.getElementById('explain-filter').value = filter;
  runExplainer();
}

/** Highlight a token's annotation card on hover */
function highlightToken(idx) {
  const ann = document.getElementById(`ex-ann-${idx}`);
  if (ann) ann.classList.add('highlight');
}

/** Remove highlight from a token's annotation card */
function unhighlightToken(idx) {
  const ann = document.getElementById(`ex-ann-${idx}`);
  if (ann) ann.classList.remove('highlight');
}

/** Scroll to a token's annotation card on click */
function focusToken(idx) {
  const ann = document.getElementById(`ex-ann-${idx}`);
  if (ann) ann.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// === REFERENCE ===

/** Render the reference page from the REFERENCE data */
function renderReference() {
  const content = document.getElementById('ref-content');
  content.innerHTML = REFERENCE.map(section => `
    <div class="ref-section">
      <h2>${section.title}</h2>
      <div class="ref-items">
        ${section.items.map(item => `
          <div class="ref-item">
            <code>${item.syntax}</code>
            <div class="ref-desc">${item.desc}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('') + `
    <div class="ref-footer">
      <a href="/legal.html#imprint">Imprint</a>
      <span>·</span>
      <a href="/legal.html#privacy">Privacy</a>
      <span>·</span>
      <a href="https://github.com/Mickhat/learnjq" target="_blank">GitHub</a>
      <span>·</span>
      <a href="https://ko-fi.com/mickhat" target="_blank" class="kofi-link">☕ Support</a>
    </div>`;
}

// === KEYBOARD SHORTCUTS ===

document.addEventListener('keydown', (e) => {
  // Ctrl+Enter in playground: save to history
  if (e.ctrlKey && e.key === 'Enter') {
    const filter = document.getElementById('pg-filter')?.value;
    if (filter) addToHistory(filter);
  }

  // Enter in learn mode: run query
  if (e.key === 'Enter' && document.activeElement.id === 'learn-filter') {
    runLearnQuery();
  }

  // Enter in challenge mode: check solution
  if (e.key === 'Enter' && document.activeElement.id === 'ch-filter') {
    checkChallenge();
  }

  // Alt+Arrow for lesson navigation
  if (e.altKey && e.key === 'ArrowLeft') prevLesson();
  if (e.altKey && e.key === 'ArrowRight') nextLesson();
});

// === RESET PROGRESS ===

/** Reset all progress (lessons, challenges, history) after confirmation */
function resetProgress() {
  if (!confirm('Reset all progress? This clears completed lessons, challenges, and playground history.')) return;
  completedLessons = new Set();
  completedChallenges = new Set();
  pgHistory = [];
  localStorage.removeItem('learnjq-completed');
  localStorage.removeItem('learnjq-challenges');
  localStorage.removeItem('learnjq-history');
  renderLessonList();
  renderChallengeList();
  renderHistory();
  updateProgress();
}

// === MOBILE SIDEBAR ===

/** Toggle the mobile sidebar (lessons or challenges) */
function toggleSidebar() {
  const mode = document.querySelector('.mode-panel.active')?.id;
  let sidebar;
  if (mode === 'mode-learn') sidebar = document.getElementById('lesson-sidebar');
  else if (mode === 'mode-challenges') sidebar = document.getElementById('challenge-sidebar');
  if (!sidebar) return;

  sidebar.classList.toggle('open');
  document.getElementById('sidebar-overlay').classList.toggle('open');

  const btn = document.getElementById('sidebar-toggle');
  btn.textContent = sidebar.classList.contains('open') ? '✕ Close' : '☰ Lessons';
}

/** Close the mobile sidebar */
function closeSidebar() {
  document.getElementById('lesson-sidebar')?.classList.remove('open');
  document.getElementById('challenge-sidebar')?.classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('open');
  document.getElementById('sidebar-toggle').textContent = '☰ Lessons';
}

/**
 * Update the mobile toggle button label based on current mode
 * @param {string} mode - Current mode name
 */
function updateMobileToggle(mode) {
  const btn = document.getElementById('sidebar-toggle');
  if (mode === 'learn') btn.textContent = '☰ Lessons';
  else if (mode === 'challenges') btn.textContent = '☰ Challenges';
  btn.style.display = (mode === 'learn' || mode === 'challenges') ? '' : 'none';
  closeSidebar();
}

// === INIT ===

/** Initialize the application on page load */
function init() {
  // Restore saved theme
  const savedTheme = localStorage.getItem('learnjq-theme');
  if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
    document.querySelector('.theme-toggle').textContent = savedTheme === 'dark' ? '🌙' : '☀️';
  }

  renderLessonList();
  renderChallengeList();
  renderHistory();

  // Load from URL hash, or route new users to tutorial
  if (!loadFromHash()) {
    const isNewUser = completedLessons.size === 0 && completedChallenges.size === 0;
    if (isNewUser) {
      showMode('tutorial');
    } else {
      loadLesson(0);
      showMode('learn');
    }
  }

  // Browser back/forward support
  window.addEventListener('hashchange', () => loadFromHash());

  // Show jq version in logo tooltip
  fetch('/api/version').then(r => r.json()).then(d => {
    const brand = document.querySelector('.logo-mark');
    if (brand) brand.title = d.version || 'jq';
  });
}

init();
