import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runClosedLoopReplayDemo } from '../src/closed_loop_replay_demo.mjs';

test('synthetic replay traverses all eight stages in order', () => {
  const trace = runClosedLoopReplayDemo();
  assert.deepEqual(trace.stages.map(s => s.name), [
    'snapshot', 'assessment', 'recommendation', 'intervention_plan',
    'check_in', 'outcome', 'reassessment', 'adaptation',
  ]);
});

test('synthetic replay never claims an observed outcome or completion', () => {
  const trace = runClosedLoopReplayDemo();
  assert.equal(trace.dataScope, 'synthetic');
  assert.equal(trace.evidenceClass, 'S');
  assert.equal(trace.empiricalClaimEligible, false);
  assert.equal(trace.complete, false);
  assert.equal(trace.stages[5].status, 'SIMULATED_NOT_OBSERVED');
  assert.equal(trace.stages[5].payload.isRealObservation, false);
});

test('low synthetic adherence triggers a deterministic adaptation', () => {
  const trace = runClosedLoopReplayDemo();
  const checkIn = trace.stages.find(s => s.name === 'check_in').payload;
  const adaptation = trace.stages.find(s => s.name === 'adaptation').payload;
  assert.equal(checkIn.adherenceRate, 0.75);
  assert.equal(adaptation.triggered, true);
  assert.equal(adaptation.selectedScenarioId, 'balanced');
  assert.equal(adaptation.thresholdIsDemoOnly, true);
});

test('all trace references point to known stage IDs', () => {
  const trace = runClosedLoopReplayDemo();
  const ids = new Set(trace.stages.map(s => s.id));
  assert.ok(trace.stages.every(s => s.dependsOn.every(id => ids.has(id))));
});
