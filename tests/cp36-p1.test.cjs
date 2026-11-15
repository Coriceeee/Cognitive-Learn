const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');

test('CP36: Student Cognitive Path is task-first, no duplicate six-module selector', () => {
  const dashboard = read('src/page/seed/StudentPage.tsx');
  const finder = read('src/page/seed/StudentModulesPage.tsx');
  assert.match(dashboard, /coreModules\.map/);
  assert.match(dashboard, /Tìm nhanh chức năng cần dùng/);
  assert.match(finder, /Tìm theo công việc/);
  assert.match(finder, /studentSubmoduleDirectory/);
  assert.match(finder, /Định hướng tương lai/);
  assert.doesNotMatch(finder, /ModuleClusterGrid|Chọn phân hệ|6 phân hệ/);
});

test('CP36: Haven separates sourced opportunities from heuristic score', () => {
  const haven = read('src/page/haven/HavenPage.tsx');
  const explorer = read('src/page/haven/HavenScholarshipExplorer.tsx');
  assert.match(haven, /<HavenScholarshipExplorer \/>/);
  assert.match(explorer, /searchScholarships/);
  assert.match(explorer, /không phải kết quả xét đủ điều kiện hoặc xác suất/);
  assert.match(explorer, /Căn cứ nguồn/);
  assert.match(explorer, /item\.documentChecks\.map/);
  assert.match(explorer, /item\.intakeNote/);
});

test('CP36: seven scholarships have official URLs and no default guaranteed eligibility or deadlines', () => {
  const source = read('src/data/officialScholarships.ts');
  const ids = [...source.matchAll(/id: "(nus-asean|nus-international|nus-st|ntu-nanyang|mext-ug-2027|gks-ug-2026|melbourne-undergraduate)"/g)].map(m => m[1]);
  assert.equal(ids.length, 7);
  assert.equal(new Set(ids).size, 7);
  for (const host of ['www.nus.edu.sg', 'nus.edu.sg', 'www.ntu.edu.sg', 'www.studyinjapan.go.jp', 'www.studyinkorea.go.kr', 'study.unimelb.edu.au']) {
    assert.ok(source.includes(`https://${host}/`), `missing host ${host}`);
  }
  assert.match(source, /availability: "archive-cycle"/);
  assert.match(source, /availability: "check-cycle"/);
  assert.doesNotMatch(source, /acceptanceProbability|guaranteed|scholarshipProbability/);
});

test('CP36: Atlas has three added official 2026 sources, no synthetic prior-year entries', () => {
  const source = read('src/data/officialAdmissionSources.ts');
  for (const id of ['uet', 'uel', 'ueh']) assert.ok(source.includes(`id: "${id}"`));
  assert.ok(source.includes('https://tuyensinh.uet.vnu.edu.vn/'));
  assert.ok(source.includes('https://tuyensinh.uel.edu.vn/'));
  assert.ok(source.includes('https://tuyensinh.ueh.edu.vn/'));
  assert.match(source, /"official_archive_only"/);
  assert.match(source, /chưa được CLA chuẩn hóa/);
});

test('CP36: final CSS layer is loaded and high-contrast inputs remain visible', () => {
  const css = read('src/styles/25-p1-task-scholarship.css');
  const entry = read('src/styles.css');
  assert.ok(entry.includes('25-p1-task-scholarship.css'));
  assert.match(css, /cla-task-results/);
  assert.match(css, /cla-scholarship-explorer/);
  assert.match(css, /focus-visible/);
  assert.match(css, /@media\(max-width: 690px\)/);
});
