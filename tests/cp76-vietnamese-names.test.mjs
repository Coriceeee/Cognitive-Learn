import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { studentSubmoduleDirectory, getStudentSubmodules } from '../src/data/moduleSubmodules.ts';
import { planGuidedNavigation } from '../src/lib/moduleWayfinding.ts';

const originalPaths = {
  seed: ['/student','/student/profile','/student/transcript','/student/exams','/student/storage'],
  lumen: ['/lumen/indices','/lumen/state','/lumen/history','/lumen/insights','/lumen/advanced','/lumen/roadmap','/lumen/evidence','/lumen/assistant'],
  atlas: ['/atlas/vietnam','/atlas/study-abroad','/atlas/joint','/atlas/recommendations','/atlas/subjects','/atlas/compare','/atlas/sources'],
  orion: ['/orion/inputs','/orion/scenarios','/orion/roadmap','/pulse/checkin'],
  pulse: ['/pulse/progress','/pulse/inputs','/pulse/checkin','/pulse/reports','/pulse/actions'],
  haven: ['/haven/scholarships','/haven/finance','/haven/plan'],
};
const homes = { seed:'/student',lumen:'/lumen',atlas:'/atlas',orion:'/orion',pulse:'/pulse',haven:'/haven' };
const homeNames = {
  seed:'Góc nhìn của tôi',lumen:'Toàn cảnh tư duy',atlas:'Bản đồ của tôi',
  orion:'Bàn thiết kế',pulse:'Dòng thời gian',haven:'Toàn cảnh cơ hội'
};
const brandNames = {
  seed:'Bản sắc học tập',lumen:'Dấu vân tay trí tuệ',atlas:'Bản đồ tương lai',
  orion:'Kiến trúc tương lai',pulse:'Đường cong tiến hóa',haven:'Hành trang thế giới'
};

for (const [key, paths] of Object.entries(originalPaths)) {
  test(`CP76 ${key}: only tab copy changes; existing destinations and availability stay intact`, () => {
    const directory = studentSubmoduleDirectory[key];
    assert.ok(directory.title.includes(brandNames[key]));
    const actual = directory.submodules.filter(x=>x.href).map(x=>x.href);
    assert.deepEqual(actual,paths);
    assert.ok(directory.submodules.every(x=>x.description && x.description.length > 12));
    assert.equal(new Set(directory.submodules.map(x=>x.title)).size,directory.submodules.length);
    assert.ok(directory.submodules.every(x=>x.title.length <= 29));
    assert.ok(directory.submodules.every(x=>!x.href || !x.href.startsWith('/admin')));
    const navigation = planGuidedNavigation(getStudentSubmodules(key),homes[key],homes[key]);
    assert.deepEqual(new Set([...navigation.featured,...navigation.more].map(i=>i.href)),new Set(paths.filter(path=>path!==homes[key])));
  });
}

test('CP76: six clear Vietnamese names appear in shared navigation without changing internal keys',()=>{
  const nav=readFileSync(new URL('../src/components/common/ModuleSectionNav.tsx',import.meta.url),'utf8');
  for(const name of Object.values(brandNames)) assert.ok(nav.includes(`name: "${name}"`),name);
  for(const name of Object.values(homeNames)) assert.ok(nav.includes(`"${name}"`),name);
  assert.match(nav,/homeTabLabels\[moduleKey\]/);
  assert.match(nav,/getStudentSubmodules\(moduleKey\)/);
  assert.doesNotMatch(nav, /moduleOrder\.map/);
});

test('CP76: Atlas study-abroad four tasks remain in unified bar and preserve country query',()=>{
  const nav=readFileSync(new URL('../src/components/common/ModuleSectionNav.tsx',import.meta.url),'utf8');
  for(const title of ['Chọn điểm đến','Trường & chương trình','Hành trang đầu vào','Đường đến hồ sơ']) assert.ok(nav.includes(`title: "${title}"`));
  for(const route of ['/atlas/study-abroad','/atlas/study-abroad/programs','/atlas/study-abroad/requirements','/atlas/study-abroad/sources']) assert.ok(nav.includes(route));
  assert.ok(nav.includes('encodeURIComponent(country)'));
});

test('CP76: student-facing map, module catalog, About and guide share the same brand names',()=>{
  const files = [
    'src/components/common/ModuleClusterGrid.tsx',
    'src/page/seed/components/LearningCircuit.tsx',
    'src/page/main/AboutPage.tsx',
    'src/page/seed/StudentGuidePage.tsx',
  ];
  for (const file of files) {
    const content=readFileSync(new URL(`../${file}`,import.meta.url),'utf8');
    for(const name of Object.values(brandNames)) assert.ok(content.includes(name), `${file} missing ${name}`);
  }
});
