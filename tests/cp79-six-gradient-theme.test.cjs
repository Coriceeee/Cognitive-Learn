const test = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const {resolve} = require('node:path');
const root = resolve(__dirname,'..');
const read = path => readFileSync(resolve(root,path),'utf8');
const palette = {
  seed:['#0FAF9A','#35D6C2','#E9FBF8','#A9E9E0','#09685F'],
  lumen:['#C9922E','#F2BE5C','#FFF7E8','#E8C98F','#78500E'],
  atlas:['#3977FF','#67A5FF','#EDF4FF','#BBD4FF','#1C4F9D'],
  orion:['#8B6DFF','#B39DFF','#F4F0FF','#D8CCFF','#57369C'],
  pulse:['#E94B7B','#FF7FA5','#FFF0F5','#F7BED0','#91314F'],
  haven:['#14A3C7','#4CCAE6','#EAF9FD','#AEE4F1','#06656D'],
};
function luminance(hex) {
  const channels=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255)
    .map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);
  return channels[0]*.2126+channels[1]*.7152+channels[2]*.0722;
}
function contrast(a,b){ const [hi,lo]=[luminance(a),luminance(b)].sort((x,y)=>y-x);return(hi+.05)/(lo+.05); }
function mix(a,b,p=.78){return '#'+[1,3,5].map(i=>Math.round(parseInt(a.slice(i,i+2),16)*p+parseInt(b.slice(i,i+2),16)*(1-p)).toString(16).padStart(2,'0')).join('');}

test('CP79.01 authoritative palette matches all 6 user-approved original colors',()=>{
  const css=read('src/styles/37-cla-orbital-theme.css');
  const keys=['500','300','050','200','700'];
  for(const [name,colors] of Object.entries(palette)){
    keys.forEach((suffix,index)=>assert.ok(css.includes(`--${name}-${suffix}: ${colors[index]};`),`${name}-${suffix}`));
    assert.ok(css.includes(`--${name}-gradient: linear-gradient(135deg, var(--${name}-500), var(--${name}-300));`));
  }
});
test('CP79.02 all module label names, routes and menu topology remain unchanged',()=>{
  const nav=read('src/components/common/ModuleSectionNav.tsx');
  const map=read('src/page/seed/components/LearningCircuit.tsx');
  for(const [key,name] of Object.entries({seed:'Bản sắc học tập',lumen:'Dấu vân tay trí tuệ',atlas:'Bản đồ tương lai',orion:'Kiến trúc tương lai',pulse:'Đường cong tiến hóa',haven:'Hành trang thế giới'})){
    assert.ok(nav.includes(name)&&map.includes(name),key);
    assert.ok(nav.includes(`data-module={moduleKey}`));
  }
  for(const url of ['/student','/lumen','/atlas','/orion','/pulse','/haven']) assert.ok(map.includes(`href:"${url}"`)||url==='/student');
  assert.ok(read('src/styles.css').includes('@import "./styles/49-cla-product-polish.css"'));
  assert.ok(!read('src/styles.css').includes('cp79'));
});
test('CP79.03 selected navigation keeps sufficient readable contrast and unique theme',()=>{
  const css=read('src/styles/48-cla-unified-navigation.css');
  for(const [key,[primary,secondary,soft,border,dark]] of Object.entries(palette)){
    const match=css.match(new RegExp(`\\.cla-unified-bar\\[data-module="${key}"\\]\\s*\\{([^}]+)\\}`));
    assert.ok(match,key);
    assert.ok(match[1].includes(`var(--${key}-500)`),key);
    assert.ok(match[1].includes(`var(--${key}-300)`),key);
    assert.ok(match[1].includes(`var(--${key}-050)`),key);
    assert.ok(match[1].includes(`var(--${key}-200)`),key);
    assert.ok(contrast(dark,soft)>=4.5,`${key} text ${contrast(dark,soft)}`);
    const gradientEnd=mix(dark,primary);
    assert.ok(contrast('#FFFFFF',gradientEnd)>=4.5,`${key} CTA ${contrast('#FFFFFF',gradientEnd)}`);
  }
  assert.ok(css.includes('--unav-badge-gradient: #274664;'),'dark mode badge safeguard');
  assert.ok(css.includes('--unav-gradient: #234669;'),'dark mode active tab safeguard');
});
test('CP79.04 circuit nodes, focus panel and mobile links share the matching per-module palette',()=>{
  const map=read('src/page/seed/components/LearningCircuit.tsx');
  const css=read('src/styles/40-cla-exam-horizon-learning-circuit.css');
  assert.match(map,/data-module=\{item\.code\.toLowerCase\(\)\}/);
  assert.match(map,/data-module=\{chosen\.code\.toLowerCase\(\)\}/);
  assert.ok(map.includes('stopColor="#74B8FF"')&&map.includes('stopColor="#67D3E8"')&&map.includes('stopColor="#A998FF"'));
  for(const name of Object.keys(palette)) assert.ok(css.includes(`data-module="${name}"]`),name);
  assert.match(css,/cla-circuit-detail-links > a[\s\S]*?linear-gradient/);
});
test('CP79.05 page accents, charts and public cards remain scoped; no duplicate UX or new layout layer',()=>{
  const css=read('src/styles/49-cla-product-polish.css');
  const about=read('src/page/main/AboutPage.tsx');
  const chooser=read('src/components/common/ModuleClusterGrid.tsx');
  for(const key of Object.keys(palette)) assert.ok(css.includes(`data-module="${key}"`),key);
  for(const token of ['--cla-theme-primary','--cla-theme-secondary','--cla-theme-soft','--cla-theme-border','--cla-theme-ink']) assert.ok(css.includes(token));
  for(const cls of ['lumen-meter','pulse-bar','atlas-national-track','cla-viz-observed','module-path-detail-hero']) assert.ok(css.includes(cls),cls);
  assert.ok(about.includes('data-module={module.name.toLowerCase()}'));
  assert.ok(chooser.includes('data-module={module.key}')&&chooser.includes('data-module={activeModule.key}'));
  assert.ok(css.includes(':root:not([data-theme="dark"])'));
  assert.match(css,/\.cla-public-module\[data-module\]::before/);
});
