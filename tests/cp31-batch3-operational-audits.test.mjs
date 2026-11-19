import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { auditSeedMigration, auditAdmissionCoverage, auditScholarshipSources } from '../src/lib/nexusOperationalAudits.ts';
import { officialUniversities } from '../src/data/officialAdmissionSources.ts';
import { officialScholarships } from '../src/data/officialScholarships.ts';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const cv = { selectedElectives: ['vat-ly', 'hoa-hoc', 'sinh-hoc', 'tin-hoc'], foreignLanguage: 'tieng-anh' };
const a = { userId: 'admin-fixture', schemaVersion: 1, dataScope: 'demo', curriculum: cv };
const b = { ...a, curriculum: { ...cv, selectedElectives: [...cv.selectedElectives].reverse() } };
const check = (items,name) => items.find(x => x.name === name);
test('CP31-B3-01 valid demo docs pass read-only identity/schema checks', () => {
  const x = auditSeedMigration(a,b,'admin-fixture');
  assert.equal(check(x,'Cặp tài liệu Seed').status,'PASS');
  assert.equal(check(x,'Tổ hợp môn giữa hai tài liệu').status,'PASS');
  assert.equal(check(x,'Migration và rollback').status,'NOT TESTED');
});
test('CP31-B3-02 cross-owner or dataScope != demo are rejected without leaking UID', () => {
  const x = auditSeedMigration(a,{...b,userId:'other-uid',dataScope:'student'},'admin-fixture');
  assert.equal(check(x,'Quyền sở hữu').status,'FAIL');
  assert.equal(check(x,'Phạm vi Admin Demo').status,'FAIL');
  assert.ok(!JSON.stringify(x).includes('other-uid'));
  assert.ok(!JSON.stringify(x).includes('admin-fixture'));
});
test('CP31-B3-03 no docs or legacy never claims migration complete', () => {
  const empty = auditSeedMigration(null,null,'admin-fixture');
  assert.equal(empty[0].status,'WARN');
  assert.equal(empty.at(-1).status,'NOT TESTED');
  const legacy = auditSeedMigration({...a, schemaVersion:undefined, transcript:{foo:1}},null,'admin-fixture');
  assert.equal(check(legacy,'Cặp tài liệu Seed').status,'WARN');
  assert.equal(check(legacy,'Schema v1').status,'WARN');
});
test('CP31-B3-04 inconsistent electives/foreign language block automated migrations', () => {
  const x = auditSeedMigration(a,{...b,curriculum:{...cv,selectedElectives:['vat-ly','hoa-hoc','sinh-hoc','dia-ly']}},'admin-fixture');
  assert.equal(check(x,'Tổ hợp môn giữa hai tài liệu').status,'FAIL');
  const y = auditSeedMigration(a,{...b,curriculum:{...cv,foreignLanguage:'tieng-phap'}},'admin-fixture');
  assert.equal(check(y,'Tổ hợp môn giữa hai tài liệu').status,'FAIL');
});
test('CP31-B3-05 UID blank and missing ownership fail closed', () => {
  assert.throws(() => auditSeedMigration(a,b,' '),/UID/);
  assert.equal(check(auditSeedMigration({...a,userId:undefined},b,'admin-fixture'),'Quyền sở hữu').status,'WARN');
});
test('CP31-B3-06 current admission registry evaluated without fabricated freshness', () => {
  const x = auditAdmissionCoverage(officialUniversities);
  assert.ok(x.length >= officialUniversities.length + 2);
  assert.equal(x.at(-1).status,'NOT TESTED');
  assert.ok(x.some(item=>item.name.startsWith('Độ phủ phương thức') && item.status === 'WARN'));
});
test('CP31-B3-07 admission missing 2024 or duplicate year is visible', () => {
  const x = auditAdmissionCoverage([{id:'a',years:[{year:2026,schemeUrl:'https://example.org',methods:['THPT'],detailsStatus:'institution_method_verified'}]}]);
  assert.equal(check(x,'Trường a · 2024–2026').status,'WARN');
  const duplicate = auditAdmissionCoverage([{id:'b', years:[2024,2025,2026,2026].map(year=>({year,schemeUrl:'https://example.org',methods:['THPT'],detailsStatus:'institution_method_verified'}))}]);
  assert.equal(check(duplicate,'Trường b · 2024–2026').status,'WARN');
});
test('CP31-B3-08 bad HTTP, javascript and embedded credentials cannot be trusted', () => {
  for(const u of ['http://example.org','javascript:alert(1)','https://user:password@example.org']) {
    const x = auditAdmissionCoverage([{id:'x',years:[2024,2025,2026].map(year=>({year,schemeUrl:u,methods:['THPT'],detailsStatus:'institution_method_verified'}))}]);
    assert.equal(check(x,'Trường x · 2024–2026').status,'WARN');
  }
});
test('CP31-B3-09 scholarship register is assessed with NOT TESTED deadlines', () => {
  const x = auditScholarshipSources(officialScholarships,'2026-11-15');
  assert.equal(x.length,officialScholarships.length+2);
  assert.equal(x.at(-1).status,'NOT TESTED');
  assert.ok(x.some(v=>v.detail.includes('KHÔNG xác nhận đang mở')));
});
test('CP31-B3-10 scholarship URL and date validity includes future/invalid date', () => {
  const seed = officialScholarships[0];
  const mk = mod => auditScholarshipSources([{...seed,...mod}],'2026-11-15')[1];
  assert.equal(mk({sourceUrl:'http://example.com'}).status,'FAIL');
  assert.equal(mk({sourceUrl:'https://u:p@example.com'}).status,'FAIL');
  assert.equal(mk({reviewedDate:'2026-02-30'}).status,'FAIL');
  assert.equal(mk({reviewedDate:'2027-01-01'}).status,'FAIL');
  assert.equal(mk({reviewedDate:'2026-01-01'}).status,'WARN');
});
test('CP31-B3-11 duplicate scholarship, missing conditions/credentials are rejected', () => {
  const seed = officialScholarships[0];
  const x = auditScholarshipSources([seed,{...seed}],'2026-11-15');
  assert.equal(x[2].status,'FAIL');
  assert.equal(auditScholarshipSources([{...seed,conditions:[]}],'2026-11-15')[1].status,'FAIL');
  assert.equal(auditScholarshipSources([{...seed,credentialNote:''}],'2026-11-15')[1].status,'FAIL');
});
test('CP31-B3-12 changes registered as safe local diagnostics, not production approval',()=>{
  const catalog = read('src/data/adminConsoleDirectory.ts');
  const policy = read('src/lib/nexusAuditPolicy.ts');
  const diag = read('src/page/nexus/AdminDiagnosticsPage.tsx');
  const app = read('src/App.tsx');
  for(const id of ['seed-migration','atlas-fresh','haven-sources']) {
    assert.match(catalog,new RegExp(`id: "${id}"[^\\n]+href: "/admin/diagnostics\\?view=${id}", status: "limited"`));
    assert.ok(policy.includes(`"${id}"`));
    assert.ok(diag.includes(`"${id}"`));
  }
  assert.match(diag,/account\?\.role !== "admin" \|\| account\.active !== true/);
  assert.match(app,/<AccessGate path=\{path\}>/);
  assert.doesNotMatch(diag,/setCustomUserClaims|deleteDoc\(|updateDoc\(|setDoc\(/);
});
test('CP31-B3-13 E2E manifest updated without weakening auth/preflight',()=>{
  const manifest=JSON.parse(read('tests/e2e/cp31_nexus_manifest.json'));
  const tasks=manifest.groups.flatMap(x=>x.tasks);
  assert.equal(tasks.length,22);
  assert.equal(tasks.filter(t=>t.status==='limited').length,22);
  assert.equal(tasks.filter(t=>t.status==='planned').length,0);
  const browser=read('tools/cp31_browser_e2e.py');
  assert.match(browser,/CLA_E2E_QA_ACK/);
  assert.match(browser,/sign_in\(/);
  assert.match(browser,/CP31-E2E-OP-/);
  assert.match(browser,/trigger\.click\(\)/);
  assert.doesNotMatch(browser,/page\.route\(/);
});
