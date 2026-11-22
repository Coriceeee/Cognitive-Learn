import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { auditReleaseEvidence, auditRulesGateEvidence, auditModelEvidence } from '../src/lib/nexusEvidenceAudits.ts';
import { cp31ReleaseSourceSha256, cp31RulesCandidateSha256 } from '../src/lib/nexusEvidenceBaseline.ts';
const require = createRequire(import.meta.url);
const { fingerprint } = require('../tools/cp31_release_fingerprint.cjs');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = p => fs.readFileSync(path.join(root,p),'utf8');
const get = (checks,name) => { const c=checks.find(x=>x.name===name); assert.ok(c, name); return c.status; };
const hex = 'a'.repeat(64);
const time = '2026-11-15T12:00:00.000Z';
const release = {schema:'cla.nexus.release-evidence.v1',sourceTreeSha256:cp31ReleaseSourceSha256,
 ci:{status:'PASS',exitCode:0,commitSha:'a'.repeat(40),runUrl:'https://github.com/example/example/actions/runs/123',finishedAt:time,artifactSha256:hex},
 deployment:{status:'DEPLOYED',url:'https://qa.example.org',deployedAt:time,artifactSha256:hex},
 backup:{status:'PASS',verifiedAt:time,runUrl:'https://github.com/example/example/actions/runs/234'},
 rollback:{status:'PASS',verifiedAt:time,runUrl:'https://github.com/example/example/actions/runs/345'}};
const gate = {gateVersion:'cla-firestore-security-gate-v1',at:time,projectId:'demo-cla-cp21-security',
 rulesFile:'firestore.rules.CANDIDATE_CP21',rulesSha256:cp31RulesCandidateSha256,
 preflight:'PASS',staticTests:'PASS',emulatorAuthorizationTests:'PASS',overall:'PASS',
 productionRulesVerified:false,productionDeploymentPerformed:false};
const model = {schema_version:'cla.oulad.public-evidence.v1',dataset:'Open University Learning Analytics Dataset (OULAD)',
 audit_status:'PASS',audit_timestamp_utc:time,test_count:5445,split_counts:{train:18101,val:2600,test:5445},cutoff_day:30,
 cohort:'UK online university courses; not Vietnamese high-school students',outcome:'Pass or Distinction vs Fail or Withdrawn (end of course)',
 models:{academic_only:{roc_auc:.6869,brier:.2345,log_loss:.649,'accuracy_at_0.5':.61},
 academic_plus_behavior:{roc_auc:.7163,brier:.225375,log_loss:.613,'accuracy_at_0.5':.65}},
 comparison:{brier_improvement:.009125,learner_cluster_bootstrap_ci95:[.00669,.011249]},
 provenance:{archive_sha256:hex,features_sha256:'b'.repeat(64)}};

test('CP31-B4-01 historical fingerprint remains frozen; current release cannot impersonate CP31', () => {
 const current = fingerprint(root).sha256;
 assert.match(current, /^[0-9a-f]{64}$/, 'Current tree fingerprint must be a SHA-256 digest');
 assert.notEqual(current, cp31ReleaseSourceSha256, 'New checkpoint must not claim the CP31 source hash');
 assert.equal(fingerprint(root).sha256, current, 'Current source fingerprint is deterministic');
 // Historical CP31 evidence must point to the archived, untouched baseline,
 // not to a newer CP85/CP86 authorization candidate with a different checksum.
 // The active candidate is checked separately against the CP86 immutable manifest.
 const archivedRules = fs.readFileSync(path.join(root,'firestore.rules.CANDIDATE'));
 assert.equal(require('node:crypto').createHash('sha256').update(archivedRules).digest('hex'), cp31RulesCandidateSha256);
 const historical = JSON.parse(read('CP81_SOURCE_MANIFEST.json'));
 assert.equal(historical.files.find(x => x.path === 'firestore.rules.CANDIDATE_CP21')?.sha256, cp31RulesCandidateSha256,
   'Frozen CP31 baseline must match archived historical manifest');
});
test('CP31-B4-02 release no evidence: no invented CI/deploy PASS', () => {
 const rows = auditReleaseEvidence(null,cp31ReleaseSourceSha256);
 assert.ok(rows.every(x=>x.status==='NOT TESTED'));
});
test('CP31-B4-03 release structural source matches, but self-declared production remains unverified', () => {
 const rows=auditReleaseEvidence(release,cp31ReleaseSourceSha256);
 assert.equal(get(rows,'Fingerprint source'),'PASS');
 for (const name of ['Bằng chứng CI','Đối chiếu deploy artifact','Khôi phục backup','Thử rollback']) assert.equal(get(rows,name),'WARN');
 assert.equal(get(rows,'Nghiệm thu phát hành production'),'NOT TESTED');
});
test('CP31-B4-04 source fingerprint mismatch fails closed',()=>{
 assert.equal(get(auditReleaseEvidence({...release,sourceTreeSha256:'f'.repeat(64)},cp31ReleaseSourceSha256),'Fingerprint source'),'FAIL');
});
test('CP31-B4-05 release invalid CI HTTPS/credentials/commit/exit rejected',()=>{
 for (const ci of [{...release.ci,runUrl:'http://evil.org'}, {...release.ci,runUrl:'https://a:b@evil.org'},
   {...release.ci,commitSha:'demo'}, {...release.ci,exitCode:1}]) {
  assert.equal(get(auditReleaseEvidence({...release,ci},cp31ReleaseSourceSha256),'Bằng chứng CI'),'FAIL');
 }
});
test('CP31-B4-06 mismatched deploy artifact always FAIL',()=>{
 const rows=auditReleaseEvidence({...release,deployment:{...release.deployment,artifactSha256:'b'.repeat(64)}},cp31ReleaseSourceSha256);
 assert.equal(get(rows,'Đối chiếu deploy artifact'),'FAIL');
});
test('CP31-B4-07 no backup/rollback produce NOT TESTED not PASS',()=>{
 const rows=auditReleaseEvidence({...release,backup:null,rollback:null},cp31ReleaseSourceSha256);
 assert.equal(get(rows,'Khôi phục backup'),'NOT TESTED');
 assert.equal(get(rows,'Thử rollback'),'NOT TESTED');
});
test('CP31-B4-08 unknown release JSON schema fails',()=>{
 assert.equal(auditReleaseEvidence({...release,schema:'x'},cp31ReleaseSourceSha256)[0].status,'FAIL');
});
test('CP31-B4-09 no Emulator report never passes role authorization',()=>{
 assert.ok(auditRulesGateEvidence(null,cp31RulesCandidateSha256).every(x=>x.status==='NOT TESTED'));
});
test('CP31-B4-10 known gate schema and sha accepted only as local evidence',()=>{
 const rows=auditRulesGateEvidence(gate,cp31RulesCandidateSha256);
 assert.equal(get(rows,'SHA-256 Rules candidate'),'PASS');
 assert.equal(get(rows,'Báo cáo Firestore Emulator'),'WARN');
 assert.equal(get(rows,'86 ca allow/deny và ma trận quyền'),'NOT TESTED');
 assert.equal(get(rows,'Rules đã triển khai production'),'NOT TESTED');
});
test('CP31-B4-11 tampered Rules candidate checksum is FAIL even with PASS fields',()=>{
 const rows=auditRulesGateEvidence({...gate,rulesSha256:'c'.repeat(64)},cp31RulesCandidateSha256);
 assert.equal(get(rows,'SHA-256 Rules candidate'),'FAIL');
 assert.equal(get(rows,'Báo cáo Firestore Emulator'),'FAIL');
});
test('CP31-B4-12 preflight-only or failed emulator cannot be called successful',()=>{
 for (const patch of [{emulatorAuthorizationTests:'BLOCKED',overall:'BLOCKED'}, {staticTests:'FAIL',overall:'FAIL'},
   {productionRulesVerified:true}, {productionDeploymentPerformed:true}]) {
  assert.equal(get(auditRulesGateEvidence({...gate,...patch},cp31RulesCandidateSha256),'Báo cáo Firestore Emulator'),'FAIL');
 }
});
test('CP31-B4-13 wrong project/gate or future time rejected',()=>{
 assert.equal(auditRulesGateEvidence({...gate,projectId:'production'},cp31RulesCandidateSha256)[0].status,'FAIL');
 assert.equal(get(auditRulesGateEvidence({...gate,at:'2050-01-01T00:00:00Z'},cp31RulesCandidateSha256),'Báo cáo Firestore Emulator'),'FAIL');
});
test('CP31-B4-14 no OULAD result means no ML score claims',()=>{
 assert.ok(auditModelEvidence(null).every(x=>x.status==='NOT TESTED'));
});
test('CP31-B4-15 correctly structured aggregate OULAD report does not imply Vietnamese validation',()=>{
 const rows=auditModelEvidence(model);
 assert.equal(get(rows,'Tập holdout và provenance'),'PASS');
 assert.equal(get(rows,'ROC-AUC, Brier và bootstrap CI'),'PASS');
 assert.equal(get(rows,'Bằng chứng fit/evaluation độc lập'),'NOT TESTED');
 assert.equal(get(rows,'Đường calibration và bias theo nhóm'),'NOT TESTED');
 assert.equal(get(rows,'Bias và external validation THPT Việt Nam'),'NOT TESTED');
});
test('CP31-B4-16 synthetic one-row VNHSGE fixture cannot pass as OULAD',()=>{
 const fixture=JSON.parse(read('research/huggingface/vnhsge_benchmark/sample/eval/metrics.json'));
 assert.equal(auditModelEvidence(fixture)[0].status,'FAIL');
});
test('CP31-B4-17 OULAD tiny holdout, wrong cutoff and impossible splits fail',()=>{
 for (const data of [{...model,test_count:1,split_counts:{...model.split_counts,test:1}},
  {...model,cutoff_day:300}, {...model,split_counts:{...model.split_counts,test:-1}}]) {
   assert.equal(get(auditModelEvidence(data),'Tập holdout và provenance'),'FAIL');
 }
});
test('CP31-B4-18 impossible Brier, delta and bootstrap confidence interval rejected',()=>{
 for (const data of [{...model,models:{...model.models,academic_only:{...model.models.academic_only,brier:Infinity}}},
  {...model,comparison:{...model.comparison,brier_improvement:.4}},
  {...model,comparison:{...model.comparison,learner_cluster_bootstrap_ci95:[.3,.1]}}]) {
  assert.equal(get(auditModelEvidence(data),'ROC-AUC, Brier và bootstrap CI'),'FAIL');
 }
});
test('CP31-B4-19 invalid source/cohort and synthetic label cannot be presented as real result',()=>{
 assert.equal(auditModelEvidence({...model,audit_status:'SYNTHETIC'})[0].status,'FAIL');
 assert.equal(get(auditModelEvidence({...model,cohort:'Vietnamese school students'}),'Tập holdout và provenance'),'FAIL');
});
test('CP31-B4-20 Admin UI only imports in memory; route/catalog/run guard is explicit',()=>{
 const ui=read('src/page/nexus/AdminDiagnosticsPage.tsx');
 const catalog=read('src/data/adminConsoleDirectory.ts');
 const runner=read('tools/cp31_browser_e2e.py');
 const runnerCases=read('tools/cp31_browser_gate.py');
 for(const id of ['release','seed-rules','model-eval']) {
  assert.match(catalog,new RegExp(`id: "${id}"[^\\n]+href: "/admin/diagnostics\\?view=${id}", status: "limited"`));
  assert.ok(ui.includes(`view === "${id}"`));
  assert.ok(runnerCases.includes("'"+id+"'"));
 }
 assert.match(runner,/OPERATIONAL_VIEWS/);
 assert.match(ui,/account\?\.role !== "admin" \|\| account\.active !== true/);
 assert.match(ui,/evidenceFile\.size > 256 \* 1024/);
 assert.match(ui,/evidenceFile\.text\(\)/);
 assert.match(ui,/if \(!stillCurrent\(\)\) return/);
 assert.doesNotMatch(ui,/setDoc\(|updateDoc\(|uploadBytes\(|deleteDoc\(/);
});
