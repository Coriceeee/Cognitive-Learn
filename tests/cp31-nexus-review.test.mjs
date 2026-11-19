import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildNexusAudit, nexusAcceptance, summarizeNexusAudit } from '../src/lib/nexusAuditPolicy.ts';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = p => fs.readFileSync(path.join(root,p),'utf8');
const catalog = read('src/data/adminConsoleDirectory.ts');
const groups = ['nexus','seed','lumen','atlas','orion','pulse','haven'];
const mockGroups = groups.map(key => {
  const section = catalog.match(new RegExp(String.raw`^  ${key}: \{([\s\S]*?)(?=^  (?:${groups.filter(x=>x!==key).join('|')}): \{|^};)`, 'm'));
  assert.ok(section, `Missing ${key}`);
  const tasks = [...section[1].matchAll(/\{ id: "([^"]+)", title: "([^"]+)", description: "([^"]+)", group: "([^"]+)", (?:href: "([^"]+)", )?status: "([^"]+)" \}/g)].map(v=>({id:v[1],title:v[2],description:v[3],group:v[4],href:v[5],status:v[6]}));
  return {key, title:key, tasks};
});
const items = buildNexusAudit(mockGroups);
test('CP31-01 complete 22 task inventory across seven distinct modules',()=>{
  assert.equal(items.length,22);
  assert.equal(mockGroups.length,7);
  assert.equal(new Set(items.map(x=>x.id)).size,22);
  assert.deepEqual(new Set(items.map(x=>x.id)),new Set(Object.keys(nexusAcceptance)));
});
test('CP31-02 twenty-two scoped diagnostics, zero undeployed tasks',()=>{
  assert.deepEqual(summarizeNexusAudit(items),{total:22,diagnosticPages:22,notImplemented:0,accepted:0});
  for(const item of items) assert.equal(item.diagnosticPath===null, item.status==='planned');
});
test('CP31-03 all 22 contain acceptance criteria and evidence requirements',()=>{
  for(const task of items) {
    assert.ok(task.acceptance.length>35,task.id);
    assert.ok(task.evidence.length>20,task.id);
  }
});
test('CP31-04 fail closed on duplicate, unknown or incomplete tasks',()=>{
  assert.throws(()=>buildNexusAudit([...mockGroups,mockGroups[0]]),/repeated/);
  assert.throws(()=>buildNexusAudit([{key:'x',title:'x',tasks:[{id:'unknown',title:'x',description:'x',group:'x',status:'planned'}]}]),/Invalid/);
  assert.throws(()=>buildNexusAudit(mockGroups.slice(1)),/Incomplete/);
});
test('CP31-05 unsafe external links or falsely available tools cannot become diagnostics',()=>{
  const altered=structuredClone(mockGroups);
  altered[0].tasks[0].href='https://evil.test';
  assert.throws(()=>buildNexusAudit(altered),/Unsafe/);
  const altered2=structuredClone(mockGroups);
  altered2[4].tasks[1].href=undefined;
  assert.throws(()=>buildNexusAudit(altered2),/claims diagnostic/);
});
test('CP31-06 read-only audit route is protected and works through Vercel SPA',()=>{
  const app=read('src/App.tsx');
  assert.match(app,/path === "\/admin\/audit"/);
  assert.match(app,/<AccessGate path=\{path\}>/);
  const rewrites=JSON.parse(read('vercel.json')).rewrites;
  assert.equal(rewrites.filter(r=>r.source==='/admin/audit'&&r.destination==='/index.html').length,1);
  assert.doesNotMatch(app,/path === "\/admin\/audit"[\s\S]*?currentPage = <TrangHocSinh/);
});
test('CP31-07 all 22 cards have a status-truthful acceptance link',()=>{
  const admin=read('src/page/nexus/AdminPage.tsx');
  const audit=read('src/page/nexus/AdminAuditPage.tsx');
  assert.match(admin,/admin\/audit\?task=\$\{encodeURIComponent\(task.id\)\}/);
  assert.match(admin,/Chưa triển khai/);
  assert.match(audit,/NOT TESTED/);
  assert.match(audit,/item.diagnosticPath/);
  assert.match(audit,/counts.accepted/);
  assert.doesNotMatch(audit,/localStorage|setDoc|updateDoc|writeBatch/);
});
test('CP31-08 stale Admin diagnostic results are invalidated on auth switch',()=>{
  const diag=read('src/page/nexus/AdminDiagnosticsPage.tsx');
  assert.match(diag,/requestSeq.current \+= 1/);
  assert.match(diag,/setResult\(null\)/);
  assert.match(diag,/auth.currentUser\?\.uid === user.uid/);
  assert.match(diag,/if \(stillCurrent\(\)\) setResult/);
});
test('CP31-09 no invented production test pass or admin role escalation in audit',()=>{
  const policy=read('src/lib/nexusAuditPolicy.ts');
  const ui=read('src/page/nexus/AdminAuditPage.tsx');
  assert.match(policy,/accepted: 0/);
  assert.match(ui,/không mở rộng quyền qua query string/);
  assert.doesNotMatch(ui,/auth\.signIn|setCustomUserClaims|addDoc/);
});
