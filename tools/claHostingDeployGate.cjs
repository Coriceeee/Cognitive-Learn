'use strict';
/**
 * CP89 Firebase Hosting deployment preflight, with NO credential disclosure.
 * Run from Cognitive-Learn project root. No writes, no deploy, no login.
 * The --frontend-only flag is an explicit opt-out of Gemini API readiness.
 */
const fs = require('node:fs');
const path = require('node:path');

const ROOT = process.cwd();
const FRONTEND_ONLY = process.argv.includes('--frontend-only');
const API_CHECK_DISABLED = process.argv.includes('--offline-check'); // test-only; do not use to release.
const PROJECT = 'cognitive-learn-ai';
const ORIGINS = [
  `https://${PROJECT}.web.app`,
  `https://${PROJECT}.firebaseapp.com`,
  'https://cognitivelearn.ai.vn', // CP89 deployment target; ensure this is a Custom serving domain, NOT a self-redirect.
];
const REQUIRED = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
  'VITE_USE_FIREBASE_EMULATORS',
  'VITE_CLA_STUDENT_CONSENT_GATE',
];
const errors = [];

function parseFile(filename) {
  const env = {};
  if (!fs.existsSync(filename)) return env;
  const text = fs.readFileSync(filename, 'utf8').replace(/^\uFEFF/, '');
  for (const line of text.split(/\r?\n/)) {
    const match = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line);
    if (!match) continue;
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1,-1);
    else value = value.replace(/\s+#.*$/, '').trim();
    env[match[1]] = value;
  }
  return env;
}
function effectiveEnv() {
  const values = {};
  for (const file of ['.env', '.env.local', '.env.live', '.env.live.local']) {
    Object.assign(values, parseFile(path.join(ROOT, file)));
  }
  for (const [key, val] of Object.entries(process.env)) {
    if (key.startsWith('VITE_')) values[key] = val;
  }
  return values;
}
function isReal(v) { return typeof v === 'string' && v.trim().length > 0 && !/^(?:fake|demo|placeholder|your[-_]|replace[-_]|xxx)/i.test(v); }
function readJson(name) {
  try { return JSON.parse(fs.readFileSync(path.join(ROOT, name), 'utf8')); }
  catch { errors.push(`${name} thieu hoac JSON khong hop le`); return {}; }
}
function checkConfig() {
  if (!fs.existsSync(path.join(ROOT, 'package.json'))) errors.push('Khong tim thay package.json tai thu muc CLA.');
  if (!fs.existsSync(path.join(ROOT, '.env.live.local'))) errors.push('Chua co .env.live.local cua Firebase that. Khong sao chep gia tri QA/demo.');
  const env = effectiveEnv();
  for (const key of REQUIRED) if (!isReal(env[key]) && !['VITE_USE_FIREBASE_EMULATORS', 'VITE_CLA_STUDENT_CONSENT_GATE'].includes(key)) errors.push(`${key} chua hop le`);
  // Firebase Storage is not imported by CLA CP89; a missing bucket must not block Hosting.
  // Still refuse explicit QA/demo/placeholder bucket values to avoid a mixed Firebase project.
  if (env.VITE_FIREBASE_STORAGE_BUCKET && !isReal(env.VITE_FIREBASE_STORAGE_BUCKET)) {
    errors.push('VITE_FIREBASE_STORAGE_BUCKET dang la gia tri QA/demo/placeholder; xoa dong neu khong su dung Cloud Storage, hoac nhap bucket thuc te tu Firebase Console.');
  } else if (!env.VITE_FIREBASE_STORAGE_BUCKET) {
    console.log('INFO: CLA CP89 khong dung Firebase Cloud Storage SDK; storageBucket co the bo trong (Hosting/Auth/Firestore van co the hoat dong).');
  }
  if (env.VITE_FIREBASE_PROJECT_ID !== PROJECT) errors.push(`Project ID phai la ${PROJECT}, khong phai demo`);
  if (env.VITE_FIREBASE_AUTH_DOMAIN !== `${PROJECT}.firebaseapp.com`) errors.push('Auth domain can khop Firebase Web App goc; kiem tra Firebase Console.');
  if (env.VITE_USE_FIREBASE_EMULATORS !== 'false') errors.push('Phai tat Emulator trong build Firebase Hosting.');
  if (env.VITE_CLA_STUDENT_CONSENT_GATE !== 'true') errors.push('Consent Gate phai bat. Can review Rules production truoc khi deploy.');
  if (!/^[0-9]+:[0-9]+:web:[A-Za-z0-9]+/.test(env.VITE_FIREBASE_APP_ID || '')) errors.push('VITE_FIREBASE_APP_ID khong co dinh dang Firebase Web App.');
  const local = parseFile(path.join(ROOT, '.env.live.local'));
  if (local.GEMINI_API_KEY || local.VITE_GEMINI_API_KEY || env.VITE_GEMINI_API_KEY) errors.push('Khong dat GEMINI_API_KEY trong .env.live.local / VITE_* frontend. Key phai nam tai backend.');
  for (const key of [...REQUIRED, 'VITE_API_BASE_URL']) {
    if (Object.prototype.hasOwnProperty.call(process.env, key) && local[key] !== undefined && process.env[key] !== local[key]) {
      errors.push(`${key} bi process environment ghi de gia tri .env.live.local`);
    }
  }
  const firebaserc = readJson('.firebaserc');
  if (firebaserc.projects?.default !== PROJECT) errors.push('Firebase project alias khong dung du an goc.');
  const hosting = readJson('firebase.json').hosting;
  if (!hosting || Array.isArray(hosting) || hosting.public !== 'dist') errors.push('Hosting public phai la dist va chi mot site duoc khai bao.');
  if (!Array.isArray(hosting?.rewrites) || !hosting.rewrites.some(v=>v.source==='**'&&v.destination==='/index.html')) errors.push('Thieu SPA rewrite cua Firebase Hosting.');
  if (hosting?.target || hosting?.site) errors.push('Hosting co site/target tuy bien; kiem tra dung domain truoc khi deploy.');
  const base = String(env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '');
  if (!FRONTEND_ONLY) {
    if (!/^https:\/\/[^/?#]+$/i.test(base) || ORIGINS.includes(base)) errors.push('VITE_API_BASE_URL phai la HTTPS backend Gemini rieng (vi du Vercel); khong duoc de trong hay tro vao Firebase Hosting SPA.');
  } else if (!base) {
    console.log('INFO: Che do frontend-only; cac tinh nang Gemini may chu chua duoc xac nhan.');
  }
  return { env, base };
}

async function probeApi(base) {
  if (FRONTEND_ONLY || API_CHECK_DISABLED || errors.length) return;
  try {
    const get = await fetch(`${base}/api/gemini-chat`, { method:'GET', redirect:'manual', signal:AbortSignal.timeout(8000) });
    const getType = get.headers.get('content-type') || '';
    if (!getType.includes('json') || ![400,401,403,405].includes(get.status)) {
      errors.push(`Backend Gemini chua nhan dien duoc (${get.status}, can phan hoi JSON tu /api/gemini-chat).`);
    }
    for (const origin of ORIGINS) {
      const res = await fetch(`${base}/api/gemini-chat`, {
        method: 'OPTIONS',
        headers: { Origin:origin, 'Access-Control-Request-Method':'POST', 'Access-Control-Request-Headers':'authorization,content-type' },
        redirect:'manual', signal:AbortSignal.timeout(8000),
      });
      if (res.status !== 204 || res.headers.get('access-control-allow-origin') !== origin) {
        errors.push(`Gemini backend chua cho phep CORS tu ${origin} (HTTP ${res.status}). Cai CORS_ALLOWED_ORIGINS tren Vercel.`);
      }
    }
    if (!errors.length) console.log('API ROUTING + CORS CHECK PASS (khong kiem tra Gemini API key hoac dang nhap that).');
  } catch (e) {
    errors.push(`Khong ket noi duoc Gemini backend: ${e?.name === 'TimeoutError' ? 'timeout' : 'network / endpoint error'}`);
  }
}

(async () => {
  const {base} = checkConfig();
  await probeApi(base);
  console.log(`PROJECT: ${PROJECT}`);
  console.log(`TARGET HOSTING: ${ORIGINS.join(' | ')}`);
  console.log(`BACKEND: ${FRONTEND_ONLY ? 'FRONTEND_ONLY' : base ? 'EXTERNAL_HTTPS_SET' : 'MISSING'}`);
  if (errors.length) {
    errors.forEach(error=>console.error(`BLOCKED: ${error}`));
    console.error('DEPLOY BLOCKED. Khong xoa tai khoan, khong thay doi Firestore Rules de ep PASS.');
    process.exitCode = 2;
  } else {
    console.log('HOSTING PREFLIGHT PASS. CHUA xac minh domain custom dang serve hay redirect, Firestore Rules production, login 2 tai khoan, hoac Gemini API key.');
  }
})().catch(()=>{ console.error('DEPLOY BLOCKED: Loi he thong gate.'); process.exitCode=2; });
