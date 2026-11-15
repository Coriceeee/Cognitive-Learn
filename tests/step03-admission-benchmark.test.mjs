import test from 'node:test';
import assert from 'node:assert/strict';
import { validateAdmissionProgram, getRiskLabel } from '../src/lib/admissionRules.ts';
import { readFileSync } from 'node:fs';

const thptScore = {
  combinationOptions: [
    {
      combinationCode: 'A00', combinationLabel: 'A00', subjects: ['math', 'physics', 'chemistry'],
      rawScore: 28, convertedScore: 28, normalizedScore: 93.33,
      missingSubjects: [], warnings: [],
    },
  ],
  externalOptions: [],
  bestOption: { label: 'A00', method: 'COMBINATION', score: 28, normalizedScore: 93.33 },
  warnings: [],
};
const program = (overrides = {}) => ({
  id: 'school-major-2026', universityName: 'Trường nguồn thử nghiệm', majorName: 'Kỹ thuật',
  majorCode: '000', combinations: ['A00'], methods: ['THPT'],
  sourceYear: 2026, verified: true,
  ...overrides,
});

test('STEP03-01: high student score without cutoff never becomes SAFE / TARGET / REACH', () => {
  const result = validateAdmissionProgram({ program: program(), scoreReport: thptScore });
  assert.equal(result.valid, false);
  assert.equal(result.riskLevel, 'INVALID');
  assert.ok(result.missingRequirements.some(message => message.includes('Chưa có điểm chuẩn')));
  assert.match(result.explanation, /Chưa thể phân nhóm nguyện vọng/);
  assert.equal(getRiskLabel(result.riskLevel), 'Chưa hợp lệ');
});

test('STEP03-02: unverified program with cutoff still cannot be ranked', () => {
  const result = validateAdmissionProgram({ program: program({ verified: false, benchmarkScore: 25, benchmarkVerified: true, benchmarkYear: 2026, benchmarkMethod: 'THPT' }), scoreReport: thptScore });
  assert.equal(result.valid, false);
  assert.equal(result.riskLevel, 'INVALID');
  assert.ok(result.missingRequirements.some(message => message.includes('chưa được xác minh')));
});

test('STEP03-03: invalid benchmark values cannot silently authorize ranking', () => {
  for (const benchmarkScore of [-1, 31, NaN, Infinity]) {
    const result = validateAdmissionProgram({ program: program({ benchmarkScore, benchmarkVerified: true, benchmarkYear: 2026, benchmarkMethod: 'THPT' }), scoreReport: thptScore });
    assert.equal(result.valid, false, String(benchmarkScore));
    assert.equal(result.riskLevel, 'INVALID');
  }
});

test('STEP03-04: verified in-scale THPT benchmark can be compared descriptively', () => {
  const result = validateAdmissionProgram({ program: program({ benchmarkScore: 25, benchmarkVerified: true, benchmarkYear: 2026, benchmarkMethod: 'THPT' }), scoreReport: thptScore });
  assert.equal(result.valid, true);
  assert.equal(result.riskLevel, 'SAFE');
  assert.match(result.explanation, /không phải bảo đảm trúng tuyển/);
});

test('STEP03-05: external exam score cannot be compared to THPT benchmark without method conversion', () => {
  const externalOnly = {
    ...thptScore,
    combinationOptions: [],
    externalOptions: [{ method: 'SAT', methodLabel: 'SAT', rawScore: 1450, maxScore: 1600,
      normalizedScore: 90.625, convertedScore: null, verified: true, warnings: [] }],
  };
  const result = validateAdmissionProgram({ program: program({
    combinations: [], methods: ['SAT'], benchmarkScore: 25, benchmarkVerified: true, benchmarkYear: 2026, benchmarkMethod: 'THPT',
  }), scoreReport: externalOnly });
  assert.equal(result.valid, false);
  assert.equal(result.riskLevel, 'INVALID');
  assert.ok(result.missingRequirements.some(message => message.includes('quy đổi chính thức')));
});

test('STEP03-06: a numeric cutoff with no source approval, wrong year or wrong method is insufficient', () => {
  const cases = [
    { benchmarkVerified: false, benchmarkYear: 2026, benchmarkMethod: 'THPT' },
    { benchmarkVerified: true, benchmarkYear: 2025, benchmarkMethod: 'THPT' },
    { benchmarkVerified: true, benchmarkYear: 2026, benchmarkMethod: 'HSA' },
  ];
  for (const override of cases) {
    const result = validateAdmissionProgram({ program: program({ benchmarkScore: 25, ...override }), scoreReport: thptScore });
    assert.equal(result.valid, false);
    assert.equal(result.riskLevel, 'INVALID');
    assert.ok(result.missingRequirements.some(message => message.includes('nguồn, phương thức')));
  }
});

test('STEP03-07: UI does not invent an unverified cutoff and documents its evidence dependency', () => {
  const panel = readFileSync(new URL('../src/page/atlas/components/AtlasAdmissionEnginePanel.tsx', import.meta.url), 'utf8');
  const rules = readFileSync(new URL('../src/lib/admissionRules.ts', import.meta.url), 'utf8');
  assert.ok(panel.includes('mapAtlasProgramsToAdmissionRules('));
  assert.ok(!panel.includes('benchmarkScore:\n          undefined'));
  assert.ok(!panel.includes('"Sẵn sàng chạy"'));
  assert.ok(panel.includes('Chưa có điểm chuẩn đủ căn cứ'));
  assert.ok(panel.includes('không tự xếp nhóm'));
  assert.ok(!rules.includes('normalizedScore >= 82'));
  assert.ok(!rules.includes('normalizedScore >= 68'));
});
