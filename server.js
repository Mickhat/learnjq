// learnjq — Backend Server
// Executes jq queries server-side via child_process.execFile
// with defense-in-depth security (no shell, empty env, blocklist, timeouts)

const express = require('express');
const { execFile } = require('child_process');
const path = require('path');

// Prevent crash on uncaught EPIPE errors (jq exited before stdin write)
process.on('uncaughtException', (err) => {
  if (err.code === 'EPIPE') return;
  console.error('Uncaught:', err);
  process.exit(1);
});

const app = express();
const PORT = process.env.PORT || 3210;

app.use(express.json({ limit: '100kb' }));
app.use(express.static(path.join(__dirname, 'public')));

// === RATE LIMITING ===
// Simple in-memory rate limiter: 60 requests per minute per IP
const rateMap = new Map();

app.use('/api/', (req, res, next) => {
  const ip = req.ip;
  const now = Date.now();
  const window = 60000;
  const limit = 60;

  const entry = rateMap.get(ip) || { count: 0, reset: now + window };
  if (now > entry.reset) {
    entry.count = 0;
    entry.reset = now + window;
  }
  entry.count++;
  rateMap.set(ip, entry);

  if (entry.count > limit) {
    return res.status(429).json({ error: 'Rate limited. Try again in a minute.' });
  }
  next();
});

// Cleanup expired rate entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of rateMap) {
    if (now > v.reset) rateMap.delete(k);
  }
}, 300000);

// Blocklist for dangerous jq builtins (env access, debugging, stdin reading)
const BLOCKED_PATTERN = /\b(env|debug|stderr|input|inputs|path\s*\(.*\$ENV)\b|\$ENV/;

// === ROUTE: Execute jq filter ===
app.post('/api/jq', (req, res) => {
  const { input, filter, rawOutput, slurp, rawInput, nullInput } = req.body;

  if (!filter) return res.json({ error: 'No filter provided' });
  if (filter.length > 2000) return res.json({ error: 'Filter too long (max 2000 chars)' });

  if (BLOCKED_PATTERN.test(filter)) {
    return res.json({ error: 'Blocked: env/debug/input builtins are disabled for security' });
  }

  // Build jq argument list from option flags
  const args = [];
  if (rawOutput) args.push('-r');
  if (slurp) args.push('-s');
  if (rawInput) args.push('-R');
  if (nullInput) args.push('-n');
  args.push('--');  // End of options — prevents flag injection via filter
  args.push(filter);

  const child = execFile('jq', args, {
    env: {},          // Empty env — no secrets to leak
    timeout: 5000,    // 5 second timeout
    maxBuffer: 1024 * 512,
  }, (err, stdout, stderr) => {
    if (err) {
      if (stderr) return res.json({ error: stderr.trim() });
      if (err.killed) return res.json({ error: 'Timeout: query took too long (5s limit)' });
      return res.json({ error: err.message });
    }
    res.json({ output: stdout, stderr: stderr || null });
  });

  // Write input to jq's stdin (unless --null-input mode)
  if (!nullInput) {
    child.stdin.on('error', () => {}); // Ignore EPIPE if jq exits early
    child.stdin.write(input || '{}');
    child.stdin.end();
  }
});

// === ROUTE: Execute jq step-by-step (pipe visualizer) ===
// Splits the filter on top-level pipes, runs progressive filters,
// and returns intermediate results for each step
app.post('/api/jq/steps', (req, res) => {
  const { input, filter } = req.body;

  if (!filter) return res.json({ error: 'No filter provided' });
  if (filter.length > 2000) return res.json({ error: 'Filter too long (max 2000 chars)' });

  if (BLOCKED_PATTERN.test(filter)) {
    return res.json({ error: 'Blocked: env/debug/input builtins are disabled for security' });
  }

  // Split on top-level pipes (respecting strings, brackets, parens)
  const pipes = splitPipes(filter);
  if (pipes.length === 0) return res.json({ steps: [] });

  // Build progressive filters: step1, step1|step2, step1|step2|step3...
  const progressiveFilters = [];
  for (let i = 0; i < pipes.length; i++) {
    progressiveFilters.push(pipes.slice(0, i + 1).join(' | '));
  }

  // Execute each progressive filter in parallel
  const promises = progressiveFilters.map((f, idx) => {
    return new Promise((resolve) => {
      const child = execFile('jq', ['--', f], {
        timeout: 5000,
        maxBuffer: 1024 * 256,
        env: {},
      }, (err, stdout, stderr) => {
        resolve({
          step: idx + 1,
          fragment: pipes[idx].trim(),
          fullFilter: f,
          output: stdout?.trimEnd() || '',
          error: stderr?.trim() || (err ? err.message : null),
        });
      });
      child.stdin.on('error', () => {});
      child.stdin.write(input || '{}');
      child.stdin.end();
    });
  });

  Promise.all(promises).then(steps => {
    res.json({ steps, pipes });
  });
});

// === ROUTE: Get jq version ===
app.get('/api/version', (req, res) => {
  execFile('jq', ['--version'], (err, stdout) => {
    res.json({ version: stdout?.trim() || 'unknown' });
  });
});

// === HELPER: Smart pipe splitter ===
// Splits a jq filter string on top-level pipe characters,
// respecting parentheses, brackets, braces, and string literals
function splitPipes(filter) {
  const parts = [];
  let current = '';
  let depth = 0;        // () depth
  let bracketDepth = 0; // [] depth
  let braceDepth = 0;   // {} depth
  let inString = false;
  let escape = false;

  for (let i = 0; i < filter.length; i++) {
    const ch = filter[i];

    if (escape) {
      current += ch;
      escape = false;
      continue;
    }

    if (ch === '\\') {
      current += ch;
      escape = true;
      continue;
    }

    if (ch === '"') {
      inString = !inString;
      current += ch;
      continue;
    }

    if (inString) {
      current += ch;
      continue;
    }

    if (ch === '(') { depth++; current += ch; continue; }
    if (ch === ')') { depth--; current += ch; continue; }
    if (ch === '[') { bracketDepth++; current += ch; continue; }
    if (ch === ']') { bracketDepth--; current += ch; continue; }
    if (ch === '{') { braceDepth++; current += ch; continue; }
    if (ch === '}') { braceDepth--; current += ch; continue; }

    if (ch === '|' && depth === 0 && bracketDepth === 0 && braceDepth === 0) {
      parts.push(current);
      current = '';
      continue;
    }

    current += ch;
  }

  if (current.trim()) parts.push(current);
  return parts;
}

// === START SERVER ===
app.listen(PORT, '0.0.0.0', () => {
  console.log(`learnjq running at http://localhost:${PORT}`);
});
