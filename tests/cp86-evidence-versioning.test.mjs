/**
 * CP86 version separation for historical CP31 evidence and the active CP85/CP86
 * Firestore Rules candidate. This NEVER certifies a live production deployment.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createRequire } from 'node:module';
import { auditRulesGateEvidence } from '../src/lib/nexusEvidenceAudits.ts';
import { cp31RulesCandidateSha256, cp31ReleaseSourceSha256 } from '../src/lib/nexusEvidenceBaseline.ts';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=rel=>readFileSync(path.join(root,rel),'utf8');
const sha=rel=>createHash('sha256').update(readFileSync(path.join(root,rel))).digest('hex');
const manifest=JSON.parse(read('CP86_SOURCE_MANIFEST.json'));
const digestFor=rel=>manifest.files.find(x=>x.path===rel)?.sha256;
const require=createRequire(import.meta.url);

test('CP86 archives CP31 evidence checksum without rebasing it to the active rules',()=>{
 const old=JSON.parse(read('CP81_SOURCE_MANIFEST.json'));
 assert.match(cp31ReleaseSourceSha256,/^[a-f0-9]{64}$/);
 assert.equal(old.files.find(x=>x.path==='firestore.rules.CANDIDATE_CP21')?.sha256,cp31RulesCandidateSha256);
 assert.equal(sha('firestore.rules.CANDIDATE'),cp31RulesCandidateSha256);
 assert.notEqual(sha('firestore.rules.CANDIDATE_CP21'),cp31RulesCandidateSha256);
});

test('CP86 active candidate is pinned by current immutable source manifest',()=>{
 const active=sha('firestore.rules.CANDIDATE_CP21');
 assert.match(active,/^[a-f0-9]{64}$/);
 assert.equal(active,digestFor('firestore.rules.CANDIDATE_CP21'));
 // CP86/CP87 frozen manifests remain historical; CP89 independently pins the active source.
 assert.equal(require('../tools/verify-cp89-snapshot.cjs').verifyRelease(root).ok,true);
});

test('CP86 refuses to re-label current candidate gate as historical CP31 gate',()=>{
 const gate={gateVersion:'cla-firestore-security-gate-v1',at:'2026-11-22T08:47:00.000Z',projectId:'demo-cla-cp21-security',
   rulesFile:'firestore.rules.CANDIDATE_CP21',rulesSha256:sha('firestore.rules.CANDIDATE_CP21'),
   preflight:'PASS',staticTests:'PASS',emulatorAuthorizationTests:'PASS',overall:'PASS',
   productionRulesVerified:false,productionDeploymentPerformed:false};
 const checks=auditRulesGateEvidence(gate,cp31RulesCandidateSha256);
 assert.equal(checks.find(x=>x.name==='SHA-256 Rules candidate')?.status,'FAIL');
 assert.equal(checks.find(x=>x.name==='Báo cáo Firestore Emulator')?.status,'FAIL');
});

test('CP86 preserves CP85 positive and negative emulator tests and deployment guard',()=>{
 const suite=read('tests/firestore.rules.cp21.test.mjs');
 for (const label of ['J21 adaptive lineage accepted only with current reviewed source and remains immutable',
   'J22 adaptive lineage denies unknown source, forged references, and stale prior after another review',
   'J23 adaptive lineage fails after revocation']) assert.ok(suite.includes(label),label);
 const candidate=read('firestore.rules.CANDIDATE_CP21');
 assert.match(candidate,/validDecisionTrace\(uid, data, data\.decisionTrace\)/);
 assert.match(candidate,/allow create: if validJourneyRecord\(uid, cycleId\)/);
 const deployment=JSON.parse(read('firebase.json'));
 assert.notEqual(deployment.firestore?.rules,'firestore.rules.CANDIDATE_CP21');
});

test('CP86 never edits the CP31 baseline module or frozen historical manifests',()=>{
 for (const rel of ['src/lib/nexusEvidenceBaseline.ts','CP81_SOURCE_MANIFEST.json','CP85_SOURCE_MANIFEST.json']) {
   assert.equal(sha(rel),digestFor(rel),rel+' changed outside CP86 manifest');
 }
});
