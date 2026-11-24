import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { routeName, shouldReturnStatus } from '../functions-gemini/src/router.mjs';
const read=p=>readFileSync(new URL(`../${p}`,import.meta.url),'utf8');
const hosting=JSON.parse(read('firebase.json'));
const geminiDeploy=JSON.parse(read('firebase.gemini.json'));
test('CP93: default Firebase config is Hosting-only; privileged functions are isolated',()=>{
  assert.ok(!('functions' in hosting), 'default firebase.json must not deploy Functions');
  assert.deepEqual(Object.keys(geminiDeploy), ['functions']);
  assert.deepEqual(geminiDeploy.functions.map(f=>({source:f.source,codebase:f.codebase})),
    [{source:'functions-gemini',codebase:'cla-gemini'}]);
  assert.doesNotMatch(JSON.stringify(geminiDeploy),/functions-admin|functions-privacy|companion-push/);
  const cli=read('DEPLOY_CLA_CP93_FIREBASE_GEMINI.cmd');
  const ps=read('DEPLOY_CLA_CP93_FIREBASE_GEMINI.ps1');
  assert.match(cli,/--config firebase\.gemini\.json/);
  assert.match(ps,/--config','firebase\.gemini\.json/);
  assert.match(cli,/--only hosting/);
  assert.match(ps,/'hosting'/);
});
test('CP93: each real Gemini API route is rewritten before index.html',()=>{
  const rewrites=hosting.hosting.rewrites;
  const spa=rewrites.findIndex(r=>r.source==='**'&&r.destination==='/index.html');
  assert.ok(spa>0);
  for(const route of ['/api/gemini-chat','/api/gemini-lumen','/api/gemini-admission-reader','/api/cla-gemini-status']){
    const hits=rewrites.filter(r=>r.source===route);
    assert.equal(hits.length,1);
    assert.equal(hits[0].function?.functionId,'claGeminiApi');
    assert.equal(hits[0].function?.region,'asia-southeast1');
    assert.ok(rewrites.indexOf(hits[0])<spa);
  }
});
test('CP93: strict route matching, no catch-all forwarded to Gemini',()=>{
  assert.equal(routeName('/api/gemini-chat'),'chat');
  assert.equal(routeName('/api/gemini-lumen?x=1'),'lumen');
  assert.equal(routeName('/api/gemini-admission-reader'),'admission');
  assert.equal(routeName('/api/other'),null);
  assert.equal(routeName('/api/gemini-chat-malicious'),null);
  assert.equal(shouldReturnStatus('/api/cla-gemini-status'),true);
});
test('CP93: Gemini key is stored as server secret and never VITE_',()=>{
  const server=read('functions-gemini/index.mjs');
  assert.match(server,/defineSecret\('GEMINI_API_KEY'\)/);
  assert.match(server,/defineSecret\('FIREBASE_WEB_API_KEY'\)/);
  assert.match(server,/if \(!handler\) return reply\(res,404/);
  assert.doesNotMatch(server,/VITE_GEMINI_API_KEY/);
});
test('CP93: frontend targets same-origin on the three verified Hosting domains',()=>{
  for(const p of ['src/lib/geminiLumenClient.ts','src/lib/geminiAdmissionClient.ts','src/components/common/FloatingAdvisorChat.tsx']){
    const src=read(p);
    assert.match(src,/cognitivelearn\.ai\.vn/);
    assert.match(src,/cognitive-learn-ai\.web\.app/);
    assert.match(src,/return ""/);
    assert.match(src,/Cloud Functions Gemini|Firebase Functions Gemini/);
  }
});
