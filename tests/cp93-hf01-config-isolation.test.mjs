import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = p => readFileSync(new URL(`../${p}`,import.meta.url),'utf8');
const hosting = JSON.parse(read('firebase.json'));
const gemini = JSON.parse(read('firebase.gemini.json'));
test('HF01: default deploy is Hosting-only (CS11 security boundary)',()=>{
 assert.deepEqual(Object.keys(hosting),['hosting']);
 assert.equal(hosting.hosting.public,'dist');
});
test('HF01: only Gemini Functions can be deployed using explicit config',()=>{
 assert.deepEqual(Object.keys(gemini),['functions']);
 assert.deepEqual(gemini.functions.map(f=>[f.source,f.codebase]),[['functions-gemini','cla-gemini']]);
 assert.equal(gemini.functions[0].predeploy?.length,1);
});
test('HF01: both deployment scripts explicitly select Gemini config for Functions',()=>{
 const cmd=read('DEPLOY_CLA_CP93_FIREBASE_GEMINI.cmd');
 const ps1=read('DEPLOY_CLA_CP93_FIREBASE_GEMINI.ps1');
 assert.match(cmd,/firebase deploy --only functions:cla-gemini --config firebase\.gemini\.json/);
 assert.match(ps1,/'functions:cla-gemini','--config','firebase\.gemini\.json'/);
 assert.match(cmd,/firebase deploy --only hosting --project cognitive-learn-ai/);
 assert.match(ps1,/'hosting','--project','cognitive-learn-ai'/);
});
test('HF01: exact Gemini rewrites are ahead of SPA fallback',()=>{
 const rewrites=hosting.hosting.rewrites;
 const spa=rewrites.findIndex(x=>x.source==='**'&&x.destination==='/index.html');
 assert.equal(spa,4);
 assert.deepEqual(rewrites.slice(0,4).map(x=>x.source),[
  '/api/gemini-chat','/api/gemini-lumen','/api/gemini-admission-reader','/api/cla-gemini-status']);
 assert.ok(rewrites.slice(0,4).every(x=>x.function?.functionId==='claGeminiApi'));
});

// HF02 prevents CMD.EXE parsing errors caused by echo parentheses inside IF blocks.
test('HF02: deploy batch is Windows CMD-safe and gates two deployments',()=>{
 const cli=read('DEPLOY_CLA_CP93_FIREBASE_GEMINI.cmd');
 assert.match(cli,/cd \/d "%~dp0"/);
 assert.doesNotMatch(cli,/if\s+not\s+exist[^\n]*\(\s*\r?\n/mi);
 assert.match(cli,/Type DEPLOY-GEMINI-CP93/);
 assert.match(cli,/Type HOSTING-CP93/);
 assert.match(cli,/if errorlevel 1 goto :functions_failed/);
 assert.match(cli,/if errorlevel 1 goto :hosting_failed/);
 assert.match(cli,/call firebase deploy --only functions:cla-gemini --config firebase\.gemini\.json/);
 assert.match(cli,/call firebase deploy --only hosting --project cognitive-learn-ai/);
});
