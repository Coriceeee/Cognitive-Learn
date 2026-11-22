import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { studentSubmoduleDirectory } from '../src/data/moduleSubmodules.ts';
import { planGuidedNavigation } from '../src/lib/moduleWayfinding.ts';
const read=(path)=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
const modules={
  seed:['Bản sắc học tập','/student'],lumen:['Dấu vân tay trí tuệ','/lumen'],
  atlas:['Bản đồ tương lai','/atlas'],orion:['Kiến trúc tương lai','/orion'],
  pulse:['Đường cong tiến hóa','/pulse'],haven:['Hành trang thế giới','/haven'],
};
function rgb(hex){return [1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4);}
function lum(hex){const a=rgb(hex);return .2126*a[0]+.7152*a[1]+.0722*a[2];}
function contrast(a,b){const l=[lum(a),lum(b)].sort((x,y)=>y-x);return(l[0]+.05)/(l[1]+.05);}
test('CP78.01 six agreed Vietnamese labels are visible in the map, bar, public About and guide',()=>{
  const targets=['src/components/common/ModuleSectionNav.tsx','src/page/seed/components/LearningCircuit.tsx',
    'src/page/main/AboutPage.tsx','src/page/seed/StudentGuidePage.tsx'];
  for(const [key,[name,home]] of Object.entries(modules)){
    assert.ok(studentSubmoduleDirectory[key].title.includes(name));
    for(const file of targets)assert.ok(read(file).includes(name), `${file}: ${name}`);
    const navigation=planGuidedNavigation(studentSubmoduleDirectory[key].submodules,home,home);
    assert.equal(new Set(navigation.available.map(s=>s.href)).size,navigation.available.length);
    assert.ok(navigation.available.every(s=>s.href!==home));
  }
  const map=read('src/page/seed/components/LearningCircuit.tsx');
  assert.match(map, /className="cla-circuit-node-name">\{item.title\}/);
});
test('CP78.02 no second six-destination strip appears on Seed dashboard',()=>{
  const bridge=read('src/page/seed/components/StudentJourneyBridge.tsx');
  const dash=read('src/page/seed/StudentPage.tsx');
  assert.doesNotMatch(bridge,/nodes\.map|cla-journey-handoff__route/);
  assert.match(bridge,/handoff\.primaryHref/);
  assert.equal((dash.match(/<LearningCircuit /g)||[]).length,1);
  assert.doesNotMatch(dash,/Bảng điểm THPT <span aria-hidden/);
});
test('CP78.03 no quick action duplicates the same two Atlas subnav destinations',()=>{
  const atlas=read('src/page/atlas/AtlasPage.tsx');
  assert.doesNotMatch(atlas,/<a className="cla-study-jump" href="\/atlas\/(vietnam|subjects)"/);
  assert.match(atlas,/<ModuleSectionNav moduleKey="atlas"/);
  assert.match(atlas,/<AtlasEvidenceJourney \/>/);
});
test('CP78.04 Haven uses curated scholarships as primary and web search only on demand',()=>{
  const haven=read('src/page/haven/HavenPage.tsx');
  assert.equal((haven.match(/<HavenScholarshipExplorer \/>/g)||[]).length,1);
  assert.equal((haven.match(/<PublicSourceSearchPanel topic="scholarship" \/>/g)||[]).length,1);
  assert.match(haven,/<details className="cla-focus-disclosure">[\s\S]*?<summary>Tìm thêm học bổng ngoài thư viện \(nâng cao\)<\/summary>[\s\S]*?<PublicSourceSearchPanel topic="scholarship" \/>/);
});
test('CP78.05 Lumen error and empty notice do not repeat identical headings',()=>{
  const lumen=read('src/page/lumen/LumenPage.tsx');
  assert.match(lumen,/<h1>Không thể tải dữ liệu<\/h1>[\s\S]*?label="Cần kiểm tra kết nối"/);
  assert.match(lumen,/<h1>Chưa có hồ sơ học sinh<\/h1>[\s\S]*?label="Bắt đầu từ Seed"/);
});
test('CP78.06 saturation uses only the existing theme files; no extra override layer or page rearrangement',()=>{
  const imports=read('src/styles.css');
  assert.doesNotMatch(imports,/50-cla-|cp78.*css/);
  const nav=read('src/components/common/ModuleSectionNav.tsx');
  assert.match(nav,/data-module=\{moduleKey\}/);
  const css=read('src/styles/48-cla-unified-navigation.css');
  for(const key of Object.keys(modules)){
    const found=css.match(new RegExp(`\\.cla-unified-bar\\[data-module="${key}"\\]\\s*\\{([^}]+)\\}`));
    assert.ok(found,`missing ${key} palette`);
    const sel=(found[1].match(/--unav-selected-ink:\s*(#[0-9a-f]{6})/i)||[])[1];
    const bg=(found[1].match(/--unav-hover:\s*(#[0-9a-f]{6})/i)||[])[1];
    assert.ok(contrast(sel,bg)>=4.5, `${key}: selected text contrast ${contrast(sel,bg).toFixed(2)}`);
  }
  assert.match(read('src/styles/37-cla-orbital-theme.css'),/--m-pulse: #b13d60/);
  assert.match(read('src/styles/38-cla-daylight-studio.css'),/--cla-bg-page: #f5f8ff/);
});
test('CP78.07 interaction contracts remain and true duplicate finder does not remove needed work',()=>{
  const orion=read('src/page/orion/OrionPage.tsx');
  const pulse=read('src/page/pulse/PulsePage.tsx');
  const atlas=read('src/page/atlas/AtlasPage.tsx');
  const haven=read('src/page/haven/HavenPage.tsx');
  assert.match(orion,/scenarioStep === "optimize"/);
  assert.match(pulse,/view === "\/pulse\/checkin"/);
  assert.match(atlas,/view === "\/atlas\/sources"/);
  assert.match(haven,/view === "\/haven\/finance"/);
  assert.match(haven,/view === "\/haven\/scholarships"/);
});
