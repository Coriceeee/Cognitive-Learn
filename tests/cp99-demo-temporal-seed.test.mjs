import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildDemoTemporalSnapshots, DEMO_TEMPORAL_FIXTURE_VERSION } from '../src/lib/demoTemporalSeed.ts';
import { analyzeStudentTemporal } from '../src/lib/temporalStudentIntelligence.ts';

const uid = 'admin_demo_uid';
const asOf = '2026-11-27T10:30:00.000Z';

test('builds three clearly labelled historical DEMO observations, never future-dated', () => {
  const rows = buildDemoTemporalSnapshots(uid, asOf);
  assert.equal(rows.length, 3);
  assert.deepEqual(rows.map(row => row.id), [
    `${DEMO_TEMPORAL_FIXTURE_VERSION}-9d`,
    `${DEMO_TEMPORAL_FIXTURE_VERSION}-5d`,
    `${DEMO_TEMPORAL_FIXTURE_VERSION}-1d`,
  ]);
  assert.ok(rows.every(row => row.studentId === uid && row.dataScope === 'demo'));
  assert.ok(rows.every(row => row.recordType === 'SYNTHETIC_DEMO' && row.synthetic === true));
  assert.ok(rows.every(row => row.demoFixtureVersion === DEMO_TEMPORAL_FIXTURE_VERSION));
  assert.ok(rows.every(row => Date.parse(row.createdAt) < Date.parse(asOf)));
  assert.ok(rows.every(row => row.scoreAvailable === false));
  assert.ok(rows.every(row => row.missingDimensions.includes('GVI')));
  assert.equal(new Set(rows.map(row => row.createdAt.slice(0, 10))).size, 3);
  assert.ok(!JSON.stringify(rows).match(/fullName|email|targetUniversity|targetMajor/i));
});

test('three DEMO observations unlock only descriptive temporal charts and are counted as synthetic', () => {
  const rows = buildDemoTemporalSnapshots(uid, asOf);
  const report = analyzeStudentTemporal(rows, uid, 'demo', true, asOf);
  assert.equal(report.status, 'DESCRIPTIVE');
  assert.equal(report.rows, 3);
  assert.equal(report.distinctDays, 3);
  assert.equal(report.syntheticRows, 3);
  for (const metric of ['planCompletionRate', 'studyHoursPerWeek', 'motivationLevel']) {
    const series = report.series.find(item => item.metric === metric);
    assert.equal(series?.status, 'DESCRIPTIVE');
    assert.equal(series?.points.length, 3);
    assert.ok(series.spanDays >= 7);
  }
  assert.equal(report.series.find(item => item.metric === 'SCI')?.status, 'DESCRIPTIVE');
});

test('rejects invalid UID or non-canonical observation timestamp', () => {
  assert.throws(() => buildDemoTemporalSnapshots('', asOf));
  assert.throws(() => buildDemoTemporalSnapshots(uid, '2026-11-27'));
});


test('UI seeder is visible only in DEMO preview and verifies the current admin-owned profile before writing', () => {
  const canvas = readFileSync(new URL('../src/page/seed/components/StudentDecisionCanvas.tsx', import.meta.url), 'utf8');
  assert.match(canvas, /!observed && demo && temporal && temporal\.status !== 'BLOCKED'/);
  assert.match(canvas, /account\.role !== 'admin'/);
  assert.match(canvas, /profile\.dataScope !== 'demo'/);
  assert.match(canvas, /profile\.userId !== user\.uid/);
  assert.match(canvas, /getDocsFromServer\(historyRef\)/);
  assert.match(canvas, /batch\.set\(doc\(historyRef, id\)/);
  assert.match(canvas, /scoreAvailable: false/);
});
