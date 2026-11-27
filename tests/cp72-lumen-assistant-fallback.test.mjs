import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildLumenMeasuredGuide } from '../src/engines/lumen/lumenMeasuredGuide.ts';
import { analyzeCognitiveProfile, buildLumenDecision } from '../src/engines/lumen/lumenIntelligenceEngine.ts';
import { analyzeStudentContext } from '../src/engines/ai/reasoningEngine.ts';

const codes = ['SCI', 'MAS', 'CSL', 'GVI', 'BDI', 'FRI', 'CRI'];
function cognitive(values = {}, opts = {}) {
  const scores = Object.fromEntries(codes.map(code => [code, values[code] ?? 0]));
  const available = opts.available ?? Object.keys(values);
  return {
    ...scores,
    overallScore: 0,
    confidenceScore: 0,
    scoreAvailable: opts.scoreAvailable ?? true,
    missingDimensions: opts.missingDimensions ?? [],
    dimensions: codes.map(code => ({ code, name: code, value: scores[code], available: available.includes(code) })),
  };
}
function context(c) {
  return { profile: { fullName: 'Học sinh', className: '', targetMajor: '', targetUniversity: '' }, cognitive: c };
}

test('01 Missing technical zeros are never categorized as risks', () => {
  assert.deepEqual(analyzeCognitiveProfile(cognitive({ SCI: 85 } )).map(x => x.dimension), ['SCI']);
});
test('02 Metadata fields are not cognitive measurements', () => {
  const c = cognitive({ SCI: 82 }); c.overallScore = 99; c.confidenceScore = 1;
  assert.deepEqual(analyzeCognitiveProfile(c).map(x => x.dimension), ['SCI']);
});
test('03 Risk indicators do not invert into strengths', () => {
  const found = analyzeCognitiveProfile(cognitive({ FRI: 90, GVI: 85, BDI: 75 }));
  assert.equal(found.length, 3);
  assert.ok(found.every(x => x.level === 'RISK'));
});
test('04 Low risk-direction scores are not called strengths', () => {
  const found = analyzeCognitiveProfile(cognitive({ FRI: 10, GVI: 20, BDI: 0 }));
  assert.ok(found.every(x => x.level === 'BALANCED'));
});
test('05 Regular high scores are positive proxy signals only', () => {
  const found = analyzeCognitiveProfile(cognitive({ SCI: 85, MAS: 84 }));
  assert.ok(found.every(x => x.level === 'STRENGTH' && x.description.includes('proxy')));
});
test('06 Missing dimensions override stale availability flags', () => {
  const c = cognitive({ SCI: 80, CRI: 80 }, { missingDimensions: ['CRI'] });
  assert.deepEqual(analyzeCognitiveProfile(c).map(x => x.dimension), ['SCI']);
});
test('07 Invalid numeric values are excluded', () => {
  const c = cognitive({ SCI: Number.NaN, CRI: 110, MAS: -1, CSL: 55 });
  assert.deepEqual(analyzeCognitiveProfile(c).map(x => x.dimension), ['CSL']);
});
test('08 Incomplete score availability prevents conclusions', () => {
  const c = cognitive({ SCI: 85 }, { scoreAvailable: false });
  assert.deepEqual(analyzeCognitiveProfile(c), []);
  assert.equal(buildLumenMeasuredGuide(c).available, false);
});
test('09 No-data decision mentions absence, not low competence', () => {
  const result = buildLumenDecision([]);
  assert.match(result.summary, /không suy luận từ số 0/);
  assert.equal(result.risks.length, 0);
});
test('10 Offline guide uses measured inputs and provenance', () => {
  const guide = buildLumenMeasuredGuide(cognitive({ SCI: 45, FRI: 73 }));
  assert.equal(guide.source, 'CLA_MEASURED_RULES_V1');
  assert.deepEqual(guide.observations.map(x => x.split(':')[0]), ['SCI', 'FRI']);
  assert.ok(guide.nextActions.some(x => x.includes('khung') || x.includes('chia mục tiêu')));
});
test('11 Offline guide does not claim ML validation or probabilities', () => {
  const guide = buildLumenMeasuredGuide(cognitive({ CRI: 80 }));
  assert.ok(guide.limitations.some(x => x.includes('ML')));
  assert.ok(guide.limitations.some(x => x.includes('thử nghiệm')));
});
test('12 Offline guide does not invent measured values when missing', () => {
  const c = cognitive({ SCI: 100, CRI: 0 }, { available: [] });
  assert.equal(buildLumenMeasuredGuide(c).observations.length, 0);
});
test('13 Missing and measured zero remain distinct', () => {
  const guide = buildLumenMeasuredGuide(cognitive({ SCI: 0 }));
  assert.equal(guide.available, true);
  assert.equal(guide.observations.length, 1);
});
test('14 Offline guide returns deterministic output for same input', () => {
  const c = cognitive({ SCI: 20, CSL: 33, FRI: 88 });
  assert.deepEqual(buildLumenMeasuredGuide(c), buildLumenMeasuredGuide(c));
});
test('15 Reasoning engine rejects an unmeasured technical high score', () => {
  const c = cognitive({ SCI: 90, CRI: 95 }, { available: [] });
  const result = analyzeStudentContext(context(c));
  assert.ok(result.insights.every(x => x.type !== 'STRENGTH'));
});
test('16 Reasoning engine recognizes only verified measured signal', () => {
  const result = analyzeStudentContext(context(cognitive({ SCI: 90, CRI: 95 })));
  assert.equal(result.insights.filter(x => x.type === 'STRENGTH').length, 2);
});
test('17 Gemini endpoint is configured and not hardcoded to an unrelated deployment', () => {
  const source = fs.readFileSync('src/lib/geminiLumenClient.ts', 'utf8');
  assert.match(source, /const API_BASE_URL = getGeminiApiBaseUrl\\(\\)/);
  assert.doesNotMatch(source, /https:\/\/cognitive-learn\.vercel\.app/);
  assert.match(source, /auth\.currentUser\?\.uid !== user\.uid/);
  assert.match(source, /signal\?\.aborted/);
});
test('18 Assistant UI provides deterministic local guide independent of Gemini success', () => {
  const ui = fs.readFileSync('src/page/lumen/LumenPage.tsx', 'utf8');
  assert.match(ui, /Hướng dẫn CLA nội bộ · không cần Gemini/);
  assert.ok(ui.indexOf('intelligence.localGuide.summary') < ui.indexOf('intelligence.gemini.status === "FALLBACK"'));
});

test('19 GPA scenario is hidden until all risk-direction dimensions are measured', () => {
  const ui = fs.readFileSync('src/page/lumen/LumenPage.tsx', 'utf8');
  assert.match(ui, /predictionRequiredDimensions = \["GVI", "BDI", "FRI"\]/);
  assert.match(ui, /missingPredictionDimensions\.length === 0/);
  assert.match(ui, /hasCompletePredictionSignals/);
  assert.match(ui, /BDI cần ít nhất hai lần ghi nhận hợp lệ/);
  assert.match(ui, /không nhập 0 thay thế/);
  assert.match(ui, /không phải dự báo điểm thi THPT đã kiểm định/);
});
