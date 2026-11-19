const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = (file) => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

test('CP32-01: Lumen signal radar only plots dimensions explicitly marked available', () => {
  const source = read('src/page/lumen/components/LumenSignalAtlas.tsx');
  assert.match(source, /item\?\.available === true/);
  assert.match(source, /coreValues\.length >= 3/);
  assert.match(source, /không được thay bằng 0/i);
  assert.match(source, /mappingVersion/);
});

test('CP32-02: longitudinal delta chart abstains without two comparable snapshots', () => {
  const source = read('src/page/lumen/components/LumenSignalAtlas.tsx');
  assert.match(source, /growth\.overall\.previous !== null/);
  assert.match(source, /Đang chờ lần đo tiếp theo/);
  assert.match(source, /không chứng minh tác động của CLA/i);
});

test('CP32-03: Orion trade-off plot is sourced from strategy scenarios and disclaims heuristic values', () => {
  const source = read('src/page/orion/OrionScenarioTradeoff.tsx');
  assert.match(source, /scenarios\.map/);
  assert.match(source, /scenario\.feasibility/);
  assert.match(source, /scenario\.expectedGain/);
  assert.match(source, /không phải xác suất đỗ/i);
});

test('CP32-04: Atlas historical field uses exact school/campus/code and distinct year-method scales', () => {
  const source = read('src/page/atlas/components/AtlasCutoffField.tsx');
  assert.match(source,/nationalCutoffs/);
  assert.match(source,/nationalProgramHistory/);
  assert.match(source,/r.universityId,r.campus,r.code/);
  assert.match(source,/row.scale===null/);
  assert.match(source,/Không nối các năm thành đường xu hướng/);
  assert.match(source,/Chưa có bản ghi năm này/);
});

test('CP32-05: scientific visualization layer is imported and responsive', () => {
  const styles = read('src/styles.css');
  const visualCss = read('src/styles/23-scientific-visuals.css');
  const lumen = read('src/page/lumen/LumenPage.tsx');
  const orion = read('src/page/orion/OrionPage.tsx');
  const atlas = read('src/page/atlas/AtlasPage.tsx');
  assert.match(styles, /23-scientific-visuals\.css/);
  assert.match(visualCss, /@media \(max-width: 760px\)/);
  assert.match(lumen, /<LumenSignalAtlas/);
  assert.match(orion, /<OrionScenarioTradeoff/);
  assert.match(atlas, /<AtlasCutoffField/);
});


test('CP32-06: synthetic demo preset is Admin-only, preview-before-save and scoped as demo', () => {
  const source = read('src/page/seed/StudentProfilePage.tsx');
  assert.match(source, /if \(!isAdminDemo \|\| !profileReady\) return/);
  assert.match(source, /window\.confirm/);
  assert.match(source, /Nạp dữ liệu mẫu chỉ điền vào biểu mẫu/);
  assert.match(source, /dataScope: isAdminDemo \? "demo" : "student"/);
  assert.match(source, /Nạp hồ sơ demo 3 năm/);
});


test('CP32-07: transcript trajectory and heatmap read saved term/subject records', () => {
  const source = read('src/page/seed/components/TranscriptResearchView.tsx');
  const page = read('src/page/seed/StudentTranscriptPage.tsx');
  assert.match(source, /data\.terms/);
  assert.match(source, /term\.summary\.gpa \?\? term\.summary\.provisionalAverage/);
  assert.match(source, /term\.subjects\.find/);
  assert.match(source, /is-provisional/);
  assert.match(page, /<TranscriptResearchView data=\{data\}/);
});

test('CP33-01: Haven pressure topology plots only the four entered support signals and labels their self-reported scope', () => {
  const component = read('src/page/haven/HavenPressureTopology.tsx');
  const page = read('src/page/haven/HavenPage.tsx');
  assert.match(component, /tuitionPressure/);
  assert.match(component, /studyPressure/);
  assert.match(component, /admissionRisk/);
  assert.match(component, /financialNeed/);
  assert.match(component, /SELF-REPORTED INPUT/);
  assert.match(component, /chưa được kiểm định tâm trắc/i);
  assert.match(page, /<HavenPressureTopology/);
  assert.match(page, /values=\{\{/);
});

test('CP33-02: Pulse orbit derives all six progress rings from Pulse engine metrics', () => {
  const component = read('src/page/pulse/PulseMetricOrbit.tsx');
  const page = read('src/page/pulse/PulsePage.tsx');
  assert.match(component, /metric\.score/);
  assert.match(component, /metric\.value/);
  assert.match(component, /metric\.target/);
  assert.match(component, /metrics\.slice\(0, radii\.length\)/);
  assert.match(component, /overallScore/);
  assert.match(component, /không phải outcome nghiên cứu/i);
  assert.match(page, /<PulseMetricOrbit metrics=\{report\.metrics\}/);
});

test('CP33-03: Admin evidence circuit visualizes actual stage statuses and explicitly disclaims end-to-end completion', () => {
  const component = read('src/page/pulse/PulseEvidenceCircuit.tsx');
  const page = read('src/page/pulse/PulsePage.tsx');
  assert.match(component, /evidence\.stages/);
  assert.match(component, /PRESENT/);
  assert.match(component, /LIMITED/);
  assert.match(component, /MISSING/);
  assert.match(component, /INVALID/);
  assert.match(component, /NOT END-TO-END/);
  assert.match(component, /evidence\.history\.reason/);
  assert.match(page, /<PulseEvidenceCircuit evidence=\{pipelineEvidence\.result\}/);
});

test('CP33-04: Haven and Pulse scientific visuals have responsive and reduced-motion styling', () => {
  const css = read('src/styles/23-scientific-visuals.css');
  assert.match(css, /\.haven-pressure-topology/);
  assert.match(css, /\.pulse-metric-orbit/);
  assert.match(css, /\.pulse-evidence-circuit/);
  assert.match(css, /@media \(max-width: 820px\)/);
  assert.match(css, /@media \(max-width: 560px\)/);
  assert.match(css, /prefers-reduced-motion: reduce/);
});


test('CP34-01: Admin synthetic preset only fills local form state and cannot write Firestore', () => {
  const source = read('src/page/seed/StudentProfilePage.tsx');
  const handler = source.match(/function handleLoadDemoPreset\(\) \{([\s\S]*?)\n  \}\n\n  async function handleSubmit/);
  assert.ok(handler, 'Admin demo handler exists');
  assert.match(handler[1], /if \(!isAdminDemo \|\| !profileReady\) return/);
  assert.match(handler[1], /lockedElectives !== null/);
  assert.match(handler[1], /window\.confirm/);
  assert.match(handler[1], /setTranscriptScores\(createSyntheticDemoTranscript/);
  assert.doesNotMatch(handler[1], /writeBatch|batch\.set|setDoc|updateDoc|saveDraft/);
  assert.match(source, /dataScope: isAdminDemo \? "demo" : "student"/);
  assert.match(source, /Nạp dữ liệu mẫu chỉ điền vào biểu mẫu/);
});

test('CP34-02: Haven labels scholarship cards as rule archetypes, not verified opportunities', () => {
  const page = read('src/page/haven/HavenPage.tsx');
  assert.match(page, /SUPPORT POLICY ARCHETYPES/);
  assert.match(page, /không phải danh mục học bổng cụ thể đã xác minh/i);
  assert.match(page, /URL chính thức/);
});
