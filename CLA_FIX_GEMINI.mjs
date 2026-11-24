/**
 * CLA Gemini local model repair (configuration only).
 * Does NOT change Firebase, source files, API keys or deployed environments.
 * Uses the key already in CLA's dotenv files. Never prints the key.
 * Requires Node >= 20 and the project's installed vite dependency.
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { loadEnv } from 'vite';

const root = path.dirname(fileURLToPath(import.meta.url));
const log = (...parts) => console.log(...parts);
const MAX_PROBES = 5;

function removeSecret(value, key) {
  return String(value ?? '').replaceAll(key, '[REDACTED]').slice(0, 300);
}

async function googleRequest(url, key, init = {}) {
  const res = await fetch(url, {
    ...init,
    headers: {
      'x-goog-api-key': key,
      ...(init.headers ?? {}),
    },
    signal: AbortSignal.timeout(25000),
  });
  const text = await res.text();
  let json = {};
  try { json = JSON.parse(text); } catch { /* preserve status, not raw data */ }
  return { status: res.status, ok: res.ok, json };
}

function safelyUpdateEnv(file, value) {
  const existed = fs.existsSync(file);
  const input = existed ? fs.readFileSync(file, 'utf8') : '';
  const newline = input.includes('\r\n') ? '\r\n' : '\n';
  const lines = input.split(/\r?\n/);
  let replaced = false;
  const updated = [];
  for (const line of lines) {
    if (/^[ \t]*GEMINI_MODEL[ \t]*=/.test(line)) {
      if (!replaced) updated.push(`GEMINI_MODEL=${value}`);
      replaced = true;
    } else {
      updated.push(line);
    }
  }
  if (!replaced) {
    while (updated.length && updated.at(-1) === '') updated.pop();
    updated.push(`GEMINI_MODEL=${value}`);
  }
  const output = updated.join(newline) + newline;
  if (output === input) return false;

  // Backup outside the repository so credentials aren't accidentally committed.
  if (existed) {
    const backupDir = path.join(process.env.LOCALAPPDATA || os.homedir(), 'CLA', 'GeminiBackups');
    fs.mkdirSync(backupDir, { recursive: true, mode: 0o700 });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backup = path.join(backupDir, `${path.basename(file)}.${stamp}.backup`);
    fs.copyFileSync(file, backup);
    try { fs.chmodSync(backup, 0o600); } catch { /* Windows ACL varies */ }
  }
  fs.writeFileSync(file, output, 'utf8');
  return true;
}

async function main() {
  log('=== CLA GEMINI SAFE REPAIR ===');
  log('Project:', root);
  if (!fs.existsSync(path.join(root, 'api', 'gemini-lumen.ts')) ||
      !fs.existsSync(path.join(root, 'tools', 'claGeminiDevApi.ts'))) {
    throw new Error('Missing current CLA API files. Extract this script into the Cognitive-Learn project root, then run again.');
  }
  const env = loadEnv('gemini', root, '');
  const key = (env.GEMINI_API_KEY || '').trim();
  if (!key || key.includes('YOUR_ACTUAL_GEMINI_API_KEY')) {
    throw new Error('No valid-looking GEMINI_API_KEY loaded. No files were changed.');
  }
  const current = (env.GEMINI_MODEL || 'gemini-2.5-flash').trim();
  log('Configured model:', current);
  log('Fetching Gemini model catalog using the existing key (key is never displayed)...');

  const models = [];
  let pageToken = '';
  for (let page = 0; page < 5; page++) {
    const url = 'https://generativelanguage.googleapis.com/v1beta/models?pageSize=100' +
      (pageToken ? '&pageToken=' + encodeURIComponent(pageToken) : '');
    const response = await googleRequest(url, key);
    if (!response.ok) {
      const message = removeSecret(response.json?.error?.message || 'No details returned', key);
      throw new Error(`Google models.list HTTP ${response.status}: ${message}. No files were changed.`);
    }
    for (const model of response.json.models || []) {
      const id = String(model.name || '').replace(/^models\//, '');
      const methods = model.supportedGenerationMethods || [];
      if (id.startsWith('gemini-') && methods.includes('generateContent') && !models.includes(id)) models.push(id);
    }
    pageToken = response.json.nextPageToken || '';
    if (!pageToken) break;
  }
  if (!models.length) throw new Error('The key lists no Gemini generateContent models; no files changed.');

  // Flash-family models only: prevent automatically selecting costly Pro or specialized video/image models.
  const candidates = models.filter(m => /flash/i.test(m) && !/image|tts|audio|live|native|exp|embedding/i.test(m));
  const rank = id => {
    if (id === current) return 100;
    if (id === 'gemini-3.8-flash') return 90;
    if (id === 'gemini-3.5-flash-lite') return 88;
    if (id === 'gemini-3.5-flash') return 86;
    if (id === 'gemini-3.1-flash-lite') return 84;
    if (id === 'gemini-2.5-flash-lite') return 60;
    if (id === 'gemini-2.5-flash') return 55;
    return 30;
  };
  candidates.sort((a, b) => rank(b) - rank(a) || a.localeCompare(b));
  log('Eligible Flash text models:', candidates.slice(0, 12).join(', ') || '(none)');
  if (!candidates.length) throw new Error('No suitable Flash text model found; no files changed.');

  const body = JSON.stringify({
    contents: [{ role: 'user', parts: [{ text: 'Return exactly this JSON: {"ok":true}' }] }],
    generationConfig: { responseMimeType: 'application/json', maxOutputTokens: 128 },
  });
  let selected = '';
  for (const model of candidates.slice(0, MAX_PROBES)) {
    log(`Probing ${model} with a tiny structured-output request...`);
    let response;
    try {
      response = await googleRequest(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
        key,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body },
      );
    } catch (error) {
      log('  Network/timeout:', removeSecret(error.message, key));
      continue;
    }
    if (response.ok && Array.isArray(response.json?.candidates) && response.json.candidates.length > 0) {
      selected = model;
      log(`  PASS: Google HTTP ${response.status}`);
      break;
    }
    const message = removeSecret(response.json?.error?.message || 'No candidate returned', key);
    log(`  FAIL: Google HTTP ${response.status} — ${message}`);
    if ([400, 401, 403].includes(response.status) && /api key|permission|billing|project|blocked|invalid|unauthorized/i.test(message)) {
      log('  Key/project restriction detected; stop instead of changing random models.');
      break;
    }
    if (response.status === 429) {
      log('  Quota/rate limit detected; stop rather than retrying more models.');
      break;
    }
  }
  if (!selected) {
    log('RESULT: NOT FIXED. The key did not pass a real generateContent test for candidates tried.');
    log('Nothing was modified. Check the Google errors above (permissions, model access, billing or quota).');
    process.exitCode = 2;
    return;
  }

  // Update the file used by both Vercel and Vite. Also update the Vite-specific override if one exists.
  const paths = [path.join(root, '.env.local')];
  const viteOverride = path.join(root, '.env.gemini.local');
  if (fs.existsSync(viteOverride)) paths.push(viteOverride);
  let changed = false;
  for (const target of paths) {
    if (safelyUpdateEnv(target, selected)) {
      log('Updated:', path.basename(target));
      changed = true;
    }
  }
  if (fs.existsSync(path.join(root, '.env.gemini')) && !fs.existsSync(viteOverride)) {
    log('Note: .env.gemini may override .env.local. Create/adjust .env.gemini.local if status still shows the old model.');
  }
  log('RESULT:', selected, changed ? 'CONFIG UPDATED' : 'CONFIG ALREADY CORRECT');
  log('Next: Stop the existing Vite terminal with Ctrl+C and start ONE server:');
  log('  npx vite --mode live --host 127.0.0.1 --port 3000 --strictPort');
  log('Then open http://127.0.0.1:3000/lumen/assistant and retry the button.');
  log('This proves Google model access, not necessarily the full CLA request schema.');
}

main().catch(err => {
  console.error('ERROR:', String(err?.message || err).slice(0, 350));
  console.error('No Gemini key is printed by this utility.');
  process.exitCode = 1;
});
