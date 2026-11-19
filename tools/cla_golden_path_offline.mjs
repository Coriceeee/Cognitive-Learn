#!/usr/bin/env node
/**
 * CP31 B8: deterministic synthetic-only replay over the real closed-loop + shadow engines.
 * Produces no student records, Firestore writes, research outcomes or production attestation.
 * SHA-256 checks transport integrity only, not provenance, identity or authenticity.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { createJourneyCycle, appendJourneyCheckIn, reassessJourneyCycle, analyzeJourney, buildJourneyEvidence, auditJourneyT0Snapshot } from '../src/lib/closedLoopJourney.ts';
import { evaluateShadowPolicies, replayShadowEvidence } from '../src/lib/journeyShadowPolicy.ts';
import { compareJourneyT0T1, replayJourneyT0T1Comparison } from '../src/lib/journeyT0T1Comparison.ts';
import { cp31ReleaseSourceSha256 } from '../src/lib/nexusEvidenceBaseline.ts';
const { fingerprint } = createRequire(import.meta.url)('./cp31_release_fingerprint.cjs');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const FIXTURE = path.join(root, 'research/golden_path/fixture_SYNTHETIC.v1.json');
export const OUTPUT = path.join(root, 'reports/evidence/cla_golden_path_SYNTHETIC.json');
export const sha = data => crypto.createHash('sha256').update(data).digest('hex');
const json = value => JSON.stringify(value);
const assertion = (ok, msg) => { if (!ok) throw new Error(msg); };
const plain = x => x !== null && typeof x === 'object' && !Array.isArray(x);
const date = s => typeof s === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(s) && Number.isFinite(Date.parse(s)) && new Date(s).toISOString() === s;
const keys = (obj, expected) => plain(obj) && Object.keys(obj).sort().join('|') === [...expected].sort().join('|');

export function validateSyntheticFixture(f) {
  assertion(keys(f, ['schema','dataScope','researchConsent','cycle','checkIns','reassessment']), 'Unexpected fixture fields');
  assertion(f.schema === 'cla.golden-path.synthetic-fixture.v1' && f.dataScope === 'SYNTHETIC_ONLY' &&
    f.researchConsent === 'NOT_APPLICABLE_SYNTHETIC', 'Only synthetic demo fixtures accepted');
  assertion(keys(f.cycle, ['id','scenarioId','scenarioTitle','targetMajor','subjects','plannedWeeklyHours','weeksLeft','startedAt']) &&
    typeof f.cycle.id === 'string' && f.cycle.id.startsWith('synthetic_') && f.cycle.targetMajor === '' &&
    typeof f.cycle.scenarioTitle === 'string' && f.cycle.scenarioTitle.includes('dữ liệu tổng hợp') &&
    Array.isArray(f.cycle.subjects) && f.cycle.subjects.every(s =>
      keys(s, ['key','label','baseline','target']) && typeof s.label === 'string' && s.label.includes('giả lập')),
    'Synthetic-only participant and subject labels required; unexpected PII fields denied');
  assertion(date(f.cycle.startedAt), 'Start timestamp invalid');
  assertion(Array.isArray(f.checkIns) && f.checkIns.length > 0 && f.checkIns.length <= 12 && plain(f.reassessment) &&
    Array.isArray(f.reassessment.observations) && f.reassessment.observations.length > 0, 'Missing action/measurement');
  let prev = Date.parse(f.cycle.startedAt);
  for (const c of f.checkIns) {
    assertion(keys(c, ['id','week','actualHours','completedActions','plannedActions','note','recordedAt']) && date(c.recordedAt), 'Malformed check-in');
    const current = Date.parse(c.recordedAt);
    assertion(current >= prev && current >= Date.parse(f.cycle.startedAt) && c.note === '' && c.id.startsWith('synthetic_'),
      'Check-in ordering, provenance or fixture privacy invalid');
    prev = current;
  }
  assertion(keys(f.reassessment, ['observations','note','recordedAt']) && date(f.reassessment.recordedAt) &&
    f.reassessment.observations.every(o => keys(o,['key','score'])) &&
    Date.parse(f.reassessment.recordedAt) >= prev && f.reassessment.note === '', 'Reassessment precedes check-in or contains free text');
  // Bounds, dedup and zero semantics are checked again by the DOMAIN engines.
  return true;
}

export function runSyntheticGoldenPath(fixture) {
  validateSyntheticFixture(fixture);
  let cycle = createJourneyCycle(fixture.cycle);
  const frozenT0 = structuredClone(cycle.t0Snapshot);
  assertion(auditJourneyT0Snapshot(cycle) === 'FROZEN_CONSISTENT' &&
    frozenT0.forecastStatus === 'NOT_ESTIMATED' && frozenT0.predictedOutcome === null,
    'T0 must be frozen before the first action and have no predicted outcome');
  const before = analyzeJourney(cycle);
  const afterChecks = [];
  for (const check of fixture.checkIns) {
    cycle = appendJourneyCheckIn(cycle, check);
    afterChecks.push(analyzeJourney(cycle));
  }
  const afterCheckIn = analyzeJourney(cycle);
  assertion(afterCheckIn.observedAverageDelta === null && before.observedAverageDelta === null, 'An invented early outcome was produced');
  cycle = reassessJourneyCycle(cycle, fixture.reassessment);
  assertion(auditJourneyT0Snapshot(cycle) === 'FROZEN_CONSISTENT' &&
    json(cycle.t0Snapshot) === json(frozenT0), 'T0 changed after observations: possible outcome leakage');
  const assessment = analyzeJourney(cycle);
  const evidence = buildJourneyEvidence(cycle);
  const shadow = evaluateShadowPolicies(cycle);
  const comparison = compareJourneyT0T1(cycle);
  assertion(comparison.status === 'DESCRIPTIVE_ONLY' && replayJourneyT0T1Comparison(cycle, comparison) &&
    comparison.forecastError === null && comparison.causalEffect === null &&
    comparison.summary.observedAverageDelta === assessment.observedAverageDelta,
    'T0/T1 must replay only descriptive observations without prediction/effect claims');
  assertion(replayShadowEvidence(shadow), 'Policy snapshot not internally replayable');
  assertion(evidence.output.probability === null && evidence.uncertainty.type === 'not_estimated' &&
    evidence.codeCommitHash === 'not_recorded', 'Unexpected scientific certainty');
  const stages = [
    { id: 'seed-input', name: 'synthetic_seed', source: 'fixture_SYNTHETIC', facts: { subjects: cycle.subjects.map(s=>s.key), containsObservedStudentData: false, t0Status: auditJourneyT0Snapshot(cycle) } },
    { id: 'orion-plan', name: 'plan', source: 'createJourneyCycle', facts: { scenarioId: cycle.scenarioId, hours: cycle.plannedWeeklyHours, t0Gap: frozenT0.planGapPoints, t0ForecastEstimated: false } },
    { id: 'pulse-checkin', name: 'check_ins', source: 'appendJourneyCheckIn', facts: { count: cycle.checkIns.length, observations: afterChecks.map(a => a.completionRate), isRealObservation: false } },
    { id: 'pulse-reassess', name: 'reassessment', source: 'reassessJourneyCycle', facts: { status: cycle.status, isRealObservation: false } },
    { id: 'pulse-metrics', name: 'outcome_analysis', source: 'analyzeJourney', facts: { stage: assessment.stage, observedAverageDelta: assessment.observedAverageDelta, comparisonStatus: comparison.status, missingT1Subjects: comparison.summary.missingT1SubjectCount, forecastError: null, causalEffect: null, synthetic: true } },
    { id: 'evidence-record', name: 'evidence', source: 'buildJourneyEvidence', facts: { resultType: evidence.resultType, probability: null, uncertainty: 'not_estimated' } },
    { id: 'orion-shadow', name: 'adaptation', source: 'evaluateShadowPolicies', facts: { staticDecision: shadow.staticDecision, adaptiveDecision: shadow.adaptiveDecision, trigger: shadow.trigger, assignedTreatment: false } },
  ];
  return { schema: 'cla.golden-path.synthetic-replay.v1', dataScope: 'SYNTHETIC_ONLY',
    empiricalClaimEligible: false, treatmentEffectEstimated: false, independentlyVerified: false,
    productionDeploymentVerified: false, evaluationStatus: 'TECHNICAL_REPLAY_ONLY',
    note: 'Synthetic fixture: no real student, no calibrated prediction, no causal or longitudinal effectiveness claim.',
    fixture, frozenT0, stages, before, afterCheckIn, assessment, comparison, shadow, evidence };
}

export function createEnvelope(rawFixture, sourceFingerprint = cp31ReleaseSourceSha256) {
  const fixture = JSON.parse(rawFixture);
  const replay = runSyntheticGoldenPath(fixture);
  const payload = { fixtureSha256: sha(rawFixture), sourceFingerprint, replay };
  return { envelopeSchema: 'cla.golden-path.local-integrity.v1', payloadSha256: sha(json(payload)), payload };
}

export function verifyEnvelope(envelope, expectedFixture, expectedSource = cp31ReleaseSourceSha256) {
  if (!keys(envelope, ['envelopeSchema','payloadSha256','payload']) ||
      envelope.envelopeSchema !== 'cla.golden-path.local-integrity.v1' ||
      typeof envelope.payloadSha256 !== 'string' || !plain(envelope.payload)) return false;
  const fresh = createEnvelope(expectedFixture, expectedSource);
  // Byte-for-byte equality of canonical JSON prevents irrelevant/misleading additional fields.
  return json(envelope) === json(fresh);
}

function main() {
  const args = process.argv.slice(2);
  const mode = args[0];
  if (!['--generate','--verify'].includes(mode) || args.length > 2) {
    console.error('Usage: node --experimental-strip-types tools/cla_golden_path_offline.mjs --generate|--verify [report.json]');
    process.exitCode = 2;
    return;
  }
  const expectedSource = cp31ReleaseSourceSha256;
  assertion(fingerprint(root).sha256 === expectedSource, 'Tracked source fingerprint drift; do not generate misleading evidence');
  const source = fs.readFileSync(FIXTURE, 'utf8');
  const out = args[1] ? path.resolve(args[1]) : OUTPUT;
  if (mode === '--generate') {
    // No real-student import path. Generated report is local technical evidence only.
    const envelope = createEnvelope(source, expectedSource);
    fs.mkdirSync(path.dirname(out), {recursive:true});
    fs.writeFileSync(out, JSON.stringify(envelope,null,2)+'\n', {flag:'w',mode:0o600});
    console.log(`GOLDEN_PATH_SYNTHETIC_GENERATED: ${out}; ${envelope.payload.replay.stages.length} domain stages; NO real outcomes`);
  } else {
    const report = JSON.parse(fs.readFileSync(out,'utf8'));
    assertion(verifyEnvelope(report,source,expectedSource), 'Golden Path mismatch/tampering or different source baseline');
    console.log('GOLDEN_PATH_SYNTHETIC_VERIFY_PASS: local deterministic replay only; no production or empirical claim');
  }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(); } catch (error) { console.error(`GOLDEN_PATH_FAIL: ${error instanceof Error?error.message:'unexpected error'}`); process.exitCode=1; }
}
