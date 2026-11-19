#!/usr/bin/env node
/** CP31 Batch 4 local, read-only evidence preflight. Does not connect to Firebase or deploy.
 * --write-local writes only a synthetic-release metadata record for Admin upload.
 * User supplied CI/gate/OULAD reports are validated structurally, never treated as trusted proof.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { auditReleaseEvidence, auditRulesGateEvidence, auditModelEvidence } from '../src/lib/nexusEvidenceAudits.ts';
import { cp31ReleaseSourceSha256, cp31RulesCandidateSha256 } from '../src/lib/nexusEvidenceBaseline.ts';
const require = createRequire(import.meta.url);
const { fingerprint } = require('./cp31_release_fingerprint.cjs');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
function load(file) {
  const stat = fs.statSync(file);
  if (!stat.isFile() || stat.size === 0 || stat.size > 256 * 1024 || !file.endsWith('.json')) throw new Error('Only <=256 KiB JSON evidence files allowed');
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}
function main(args) {
  const current = fingerprint(ROOT);
  if (current.sha256 !== cp31ReleaseSourceSha256) {
    console.error('FAIL: source fingerprint mismatch; rebuild baseline or restore reviewed source.');
    return 2;
  }
  const release = args.indexOf('--release');
  const rules = args.indexOf('--rules');
  const model = args.indexOf('--model');
  const known = new Set(['--release', '--rules', '--model', '--write-local']);
  for (let i = 0; i < args.length; i++) {
    if (!known.has(args[i])) return 2;
    if (args[i] !== '--write-local') { if (!args[i + 1] || args[i + 1].startsWith('--')) return 2; i++; }
  }
  let releaseDoc = null;
  if (args.includes('--write-local')) {
    const output = path.join(ROOT, 'reports/nexus/cp31_release_local_preflight.json');
    fs.mkdirSync(path.dirname(output), { recursive: true });
    const payload = { schema: 'cla.nexus.release-evidence.v1', sourceTreeSha256: current.sha256,
      sourceFileCount: current.fileCount, sourceScope: 'src/tests/tools/tests_cp31 + package + Rules candidate (excluding baseline)',
      ci: null, deployment: null, backup: null, rollback: null, reviewerAccepted: false };
    fs.writeFileSync(output, JSON.stringify(payload, null, 2) + '\n');
    console.log('Wrote LOCAL source-only metadata (NOT a CI/deploy report): ' + output);
    releaseDoc = payload;
  }
  if (release !== -1) releaseDoc = load(args[release + 1]);
  const sections = [
    ['Release', auditReleaseEvidence(releaseDoc, cp31ReleaseSourceSha256)],
    ['Rules', auditRulesGateEvidence(rules === -1 ? null : load(args[rules + 1]), cp31RulesCandidateSha256)],
    ['Model', auditModelEvidence(model === -1 ? null : load(args[model + 1]))],
  ];
  let failures = 0;
  for (const [title, rows] of sections) {
    console.log(`--- ${title} (evidence content only) ---`);
    for (const row of rows) {
      console.log(`${row.status}: ${row.name} — ${row.detail}`);
      if (row.status === 'FAIL') failures++;
    }
  }
  console.log(`SOURCE FINGERPRINT MATCH: ${current.fileCount} tracked files; zero production deployments.`);
  return failures ? 1 : 0;
}
try { process.exitCode = main(process.argv.slice(2)); }
catch (e) { console.error('Evidence preflight blocked: ' + e.message); process.exitCode = 2; }
