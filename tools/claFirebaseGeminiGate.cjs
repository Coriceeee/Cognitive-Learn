/* Local gate for CP93 same-origin Firebase Gemini architecture. No network, no secrets printed. */
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const config=JSON.parse(fs.readFileSync(path.join(root,'firebase.json'),'utf8'));
if (Object.prototype.hasOwnProperty.call(config,'functions')) throw Error('Default firebase.json must remain Hosting-only (CS11)');
const geminiConfig=JSON.parse(fs.readFileSync(path.join(root,'firebase.gemini.json'),'utf8'));
if (Object.keys(geminiConfig).some(k=>k!=='functions')) throw Error('Gemini config must contain Functions only');
const functions=(Array.isArray(geminiConfig.functions)?geminiConfig.functions:[geminiConfig.functions]).filter(Boolean);
if (functions.length!==1 || functions[0].source!=='functions-gemini' || functions[0].codebase!=='cla-gemini') throw Error('Only cla-gemini isolated function codebase may deploy');
const rewrites=config.hosting?.rewrites||[];
for (const source of ['/api/gemini-chat','/api/gemini-lumen','/api/gemini-admission-reader','/api/cla-gemini-status']) {
  if (!rewrites.some(r=>r.source===source&&r.function?.functionId==='claGeminiApi'&&r.function?.region==='asia-southeast1')) throw Error('Missing Firebase Hosting rewrite '+source);
}
const catchAll=rewrites.findIndex(r=>r.source==='**'&&r.destination==='/index.html');
if (catchAll<4) throw Error('SPA rewrite must come AFTER API rewrites');
const env=fs.readFileSync(path.join(root,'.env.live.local'),'utf8');
if (!/VITE_FIREBASE_PROJECT_ID\s*=\s*cognitive-learn-ai/.test(env)) throw Error('Live Firebase project not verified');
if (!/VITE_USE_FIREBASE_EMULATORS\s*=\s*false/.test(env)) throw Error('Emulator enabled in LIVE environment');
if (!/VITE_CLA_STUDENT_CONSENT_GATE\s*=\s*true/.test(env)) throw Error('Consent gate disabled; verify production Firestore Rules');
if (/^\s*(?:VITE_)?GEMINI_API_KEY\s*=/m.test(env)) throw Error('Gemini secret is in frontend env');
console.log('CLA CP93 Firebase Gemini routing gate PASS (CONFIG ONLY, NOT A LIVE API TEST).');
