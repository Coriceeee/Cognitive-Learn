import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const get = rel => readFileSync(new URL('../' + rel, import.meta.url),'utf8');

test('Vite serves the three existing Gemini APIs on localhost only',()=>{
  const vite=get('vite.config.ts');
  const src=get('tools/claGeminiDevApi.ts');
  assert.match(vite,/claGeminiDevApi\(\)/);
  for (const api of ['gemini-chat','gemini-lumen','gemini-admission-reader']) {
    assert.match(src,new RegExp(`/api/${api}`));
    assert.match(src,new RegExp(`'/api/${api}\\.ts'`));
  }
  assert.match(src,/apply: 'serve'/);
  assert.match(src,/localApiAddressAllowed\(req\.socket\.remoteAddress/);
  assert.match(src,/serverEnv\['GEMINI_API_KEY'\]|'GEMINI_API_KEY'/);
  assert.doesNotMatch(src,/VITE_GEMINI_API_KEY/);
});

test('all three Gemini clients share a resolver that keeps loopback development same-origin',()=>{
  const helper=get('src/lib/claApiBase.ts');
  for (const rel of ['src/components/common/FloatingAdvisorChat.tsx','src/components/common/PublicSourceSearchPanel.tsx','src/components/common/NationalSourceDiscoveryPanel.tsx','src/lib/geminiLumenClient.ts','src/lib/geminiAdmissionClient.ts']) {
    const src=get(rel);
    assert.match(src,/getClaApiBaseUrl\(\)/);
    assert.doesNotMatch(src,/import\.meta\.env\.DEV && typeof window/);
  }
  assert.match(helper,/input\.isDev && input\.protocol === "http:" && isLoopback\(hostname\)/);
  assert.match(helper,/hostname === "127\.0\.0\.1"/);
  assert.match(helper,/hostname === "localhost"/);
  assert.match(helper,/return "";/);
});

test('local Gemini configuration does not become public in frontend and is ignored by git',()=>{
  assert.match(get('.gitignore'),/^\.env\.\*/m);
  assert.match(get('tools/claGeminiDevApi.ts'),/loadEnv\('gemini', root, ''\)/);
  assert.match(get('docs/CP90_LUMEN_GEMINI_SETUP.md'),/\.env\.gemini\.local/);
});
