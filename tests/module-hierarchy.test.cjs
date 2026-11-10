/** Contract: exactly seven major modules, their submodules own stable destinations. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const catalog = read('src/data/moduleSubmodules.ts');
const moduleCatalog = read('src/data/moduleClusters.ts');
const grid = read('src/components/common/ModuleClusterGrid.tsx');
const admin = read('src/page/nexus/AdminPage.tsx');
const nav = read('src/components/common/ModuleSectionNav.tsx');
for(const name of ['nexus','seed','lumen','atlas','orion','pulse','haven']) {
  assert.match(catalog, new RegExp(`^  ${name}: \\{`, 'm'), `${name} submodules missing`);
  assert.match(moduleCatalog, new RegExp(`key: "${name}"`));
}
assert.equal((moduleCatalog.match(/    key: "(nexus|seed|lumen|atlas|orion|pulse|haven)",/g) || []).length,7);
assert.match(grid,/moduleSubmoduleDirectory/);
assert.match(admin,/adminConsoleDirectory/);
assert.doesNotMatch(admin,/moduleSubmoduleDirectory/);
assert.doesNotMatch(admin,/nexus-legacy-tests/);
assert.match(admin,/CHỨC NĂNG QUẢN TRỊ/);
assert.match(nav,/items\.slice\(0, 3\)/);
assert.match(nav,/item\.status === "partial"/);
const ownedAtlas = catalog.slice(catalog.indexOf('  atlas: {'),catalog.indexOf('  orion: {'));
const ownedHaven = catalog.slice(catalog.indexOf('  haven: {'),catalog.indexOf('\n};', catalog.indexOf('  haven: {')));
assert.match(ownedAtlas,/href: "\/atlas\/study-abroad"/);
assert.match(ownedAtlas,/href: "\/atlas#atlas-joint-programs"/);
assert.doesNotMatch(ownedHaven,/href: "\/atlas\/study-abroad"/);
assert.match(ownedHaven,/href: "\/haven#haven-scholarships"/);
assert.match(ownedHaven,/href: "\/haven#haven-financial"/);
const routes = {
 'src/page/atlas/AtlasPage.tsx': ['atlas-joint-programs','atlas-gemini-reader','atlas-programs','atlas-engine'],
 'src/page/lumen/LumenPage.tsx': ['lumen-indices','lumen-growth','lumen-insights','lumen-gemini'],
 'src/page/orion/OrionPage.tsx': ['orion-input','orion-scenarios','orion-roadmap'],
 'src/page/pulse/PulsePage.tsx': ['pulse-pipeline','pulse-risk','pulse-report','pulse-actions'],
 'src/page/haven/HavenPage.tsx': ['haven-scholarships','haven-financial','haven-support-roles','haven-support-plan'],
 'src/page/nexus/AdminPage.tsx':['nexus-role-preview']
};
for(const [page, ids] of Object.entries(routes)) {
  const source = read(page);
  for(const id of ids) assert.ok(source.includes(`id="${id}"`), `${page}: #${id} missing`);
}
for(const module of ['atlas','lumen','orion','pulse','haven']) {
 assert.match(read(`src/page/${module}/${module === 'atlas' ? 'AtlasPage' : module === 'lumen' ? 'LumenPage' : module === 'orion' ? 'OrionPage' : module === 'pulse' ? 'PulsePage' : 'HavenPage'}.tsx`), new RegExp(`moduleKey="${module}"`));
}
console.log('MODULE HIERARCHY CONTRACT: seven main modules, catalog, ownership and nested anchors PASS');

const student = read('src/page/seed/StudentModulesPage.tsx');
const study = read('src/page/study-abroad/StudyAbroadPage.tsx');
assert.match(student,/Cognitive Path cá nhân/);
assert.match(grid,/chức năng/);
assert.match(nav,/Các module của học sinh/);
assert.match(study,/Các module của học sinh/);
console.log('STUDENT EXPERIENCE: six major modules, student-only children and correctly named return links PASS');
