/** CLA CP81: fail-closed local production build configuration gate.
 * Reads only public VITE_* config fields. Never deploys or prints credentials.
 * Does not prove hosted Vercel/Firebase environment correctness.
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.resolve(__dirname, '..');
const KEYS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_APP_ID',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_USE_FIREBASE_EMULATORS',
  'VITE_CLA_STUDENT_CONSENT_GATE',
];
function parseEnv(raw) {
  const result = {};
  for (const line of raw.split(/\r?\n/)) {
    if (/^\s*(?:#|$)/.test(line)) continue;
    const match = /^\s*(?:export\s+)?([A-Z][A-Z0-9_]*)\s*=\s*(.*)$/.exec(line);
    if (!match) continue;
    const key = match[1];
    if (!KEYS.includes(key)) continue;
    const value = match[2].trim();
    result[key] = /^(['"]).*\1$/.test(value) ? value.slice(1, -1) : value;
  }
  return result;
}
function effectiveConfig(root, inherited = process.env) {
  // Vite production priority: process env > .env.production.local > .env.local
  // > .env.production > .env. Sources are listed low to high precedence.
  const config = {};
  const provenance = {};
  for (const file of ['.env', '.env.production', '.env.local', '.env.production.local']) {
    const fullPath = path.join(root, file);
    if (!fs.existsSync(fullPath)) continue;
    for (const [key, value] of Object.entries(parseEnv(fs.readFileSync(fullPath, 'utf8')))) {
      config[key] = value;
      provenance[key] = file;
    }
  }
  for (const key of KEYS) {
    if (Object.prototype.hasOwnProperty.call(inherited, key)) {
      config[key] = inherited[key];
      provenance[key] = 'process environment';
    }
  }
  return { config, provenance };
}
function assess(config) {
  const issues = [];
  if (String(config.VITE_USE_FIREBASE_EMULATORS ?? '').toLowerCase() !== 'false') {
    issues.push('VITE_USE_FIREBASE_EMULATORS must be explicitly false for production builds.');
  }
  if (config.VITE_FIREBASE_PROJECT_ID !== 'cognitive-learn-ai') {
    issues.push('VITE_FIREBASE_PROJECT_ID must match the approved production Firebase project cognitive-learn-ai.');
  }
  if (config.VITE_CLA_STUDENT_CONSENT_GATE !== 'true') {
    issues.push('VITE_CLA_STUDENT_CONSENT_GATE must be explicitly true for the reviewed student consent flow.');
  }
  for (const key of ['VITE_FIREBASE_API_KEY','VITE_FIREBASE_APP_ID','VITE_FIREBASE_AUTH_DOMAIN']) {
    if (!config[key] || /^(fake|placeholder|your[-_]|demo[-_])/i.test(config[key])) {
      issues.push(`${key} is absent or a demo/placeholder value.`);
    }
  }
  return issues;
}
if (require.main === module) {
  const { config, provenance } = effectiveConfig(ROOT);
  const issues = assess(config);
  console.log('CLA CP81 production environment gate — local build only; no deployment.');
  for (const key of KEYS) {
    console.log(`${key}: ${key === 'VITE_FIREBASE_PROJECT_ID' || key === 'VITE_USE_FIREBASE_EMULATORS' || key === 'VITE_CLA_STUDENT_CONSENT_GATE' ? JSON.stringify(config[key] || 'MISSING') : config[key] ? 'SET' : 'MISSING'} [${provenance[key] || 'not defined'}]`);
  }
  if (issues.length) {
    for (const issue of issues) console.error(`BLOCKED: ${issue}`);
    console.error('DO NOT DEPLOY. Verify hosted build environment separately.');
    process.exitCode = 2;
  } else {
    console.log('LOCAL ENVIRONMENT CHECK PASS. Hosted environment, backend and production safety NOT verified.');
  }
}
module.exports = {parseEnv,effectiveConfig,assess};
