import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateSeedNumericInput } from '../src/page/seed/services/profileInputValidation.ts';

const good = () => ({
  studyHoursPerWeek: '14',
  practiceTestsPerWeek: '3',
  planCompletionRate: '72',
  goalSwitchFrequency: '2',
  taskAbandonmentRate: '18',
  contextSwitchRate: '32',
  learningStrategy: '68',
  motivationLevel: '75',
  educationBudget: '150000000',
  maxTuition: '60000000',
});

test('Seed: normal values accept, including missing optional financial fields', () => {
  assert.equal(validateSeedNumericInput(good()), null);
  assert.equal(validateSeedNumericInput({ ...good(), educationBudget: '', maxTuition: '' }), null);
});
test('Seed: all self-reported measures may remain missing without being converted to zero', () => {
  const input = good();
  for (const key of ['studyHoursPerWeek','practiceTestsPerWeek','planCompletionRate','goalSwitchFrequency',
    'taskAbandonmentRate','contextSwitchRate','learningStrategy','motivationLevel']) input[key] = '';
  assert.equal(validateSeedNumericInput(input), null);
});
test('Seed: zero is observed zero, not missing', () => {
  const input = Object.fromEntries(Object.keys(good()).map(key => [key, '0']));
  assert.equal(validateSeedNumericInput(input), null);
});
test('Seed: percentages over 100 or negative are rejected', () => {
  for (const key of ['planCompletionRate', 'taskAbandonmentRate', 'contextSwitchRate', 'learningStrategy', 'motivationLevel']) {
    assert.match(validateSeedNumericInput({ ...good(), [key]: '101' }), /100/);
    assert.match(validateSeedNumericInput({ ...good(), [key]: '-1' }), /không âm/);
  }
});
test('Seed: hours cannot exceed the length of one week', () => {
  assert.match(validateSeedNumericInput({ ...good(), studyHoursPerWeek: '169' }), /168/);
  assert.equal(validateSeedNumericInput({ ...good(), studyHoursPerWeek: '2,5' }), null);
});
test('Seed: counts require whole numbers', () => {
  for (const key of ['practiceTestsPerWeek', 'goalSwitchFrequency']) {
    assert.match(validateSeedNumericInput({ ...good(), [key]: '2.5' }), /nguyên/);
  }
});
test('Seed: negative or malformed finances are rejected', () => {
  assert.match(validateSeedNumericInput({ ...good(), educationBudget: '-42' }), /không âm/);
  assert.match(validateSeedNumericInput({ ...good(), maxTuition: 'Infinity' }), /không âm/);
});
test('Seed: missing self-reported values stay optional; explicit invalid values still fail', () => {
  for (const key of ['studyHoursPerWeek','practiceTestsPerWeek','planCompletionRate','goalSwitchFrequency',
    'taskAbandonmentRate','contextSwitchRate','learningStrategy','motivationLevel']) {
    assert.equal(validateSeedNumericInput({ ...good(), [key]: '' }), null, key);
  }
  assert.match(validateSeedNumericInput({ ...good(), motivationLevel: '101' }), /100/);
});
test('Seed: not silently converting scientific notation to amount', () => {
  assert.match(validateSeedNumericInput({ ...good(), educationBudget: '1e100' }), /hợp lệ/);
});
test('Seed: validator is called before atomic Firestore transaction', () => {
  const src = readFileSync(new URL('../src/page/seed/StudentProfilePage.tsx', import.meta.url), 'utf8');
  const start = src.indexOf('async function handleSubmit(');
  const validation = src.indexOf('validateSeedNumericInput(profile)', start);
  const commit = src.indexOf('await runTransaction(db,', start);
  assert.ok(start >= 0 && validation > start && commit > validation);
});

test('Seed: guided section navigation and self-report copy are present without changing persistence gates', () => {
  const src = readFileSync(new URL('../src/page/seed/StudentProfilePage.tsx', import.meta.url), 'utf8');
  const behaviorStart = src.indexOf('id="cla-seed-section-behavior"');
  const financeStart = src.indexOf('id="cla-seed-section-finance"');
  const behavior = src.slice(behaviorStart, financeStart);
  assert.ok(behaviorStart >= 0 && financeStart > behaviorStart);
  assert.match(src, /href="#cla-seed-section-goals"/);
  assert.match(src, /href="#cla-seed-section-curriculum"/);
  assert.match(src, /href="#cla-seed-section-transcript"/);
  assert.match(src, /href="#cla-seed-section-behavior"/);
  assert.match(src, /href="#cla-seed-section-finance"/);
  assert.match(behavior, /Dữ liệu tự đánh giá/);
  assert.match(behavior, /không tự đổi thành 0/);
  assert.doesNotMatch(behavior, /\brequired\b/);
  assert.match(src, /profileReadFailed \|\| !profileReady \|\| !seedBaseline/);
  assert.match(src, /await runTransaction\(db,/);
});
