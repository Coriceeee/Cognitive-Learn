import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildSupportMailto, SUPPORT_EMAIL } from '../src/lib/supportMailto.ts';
import { getStudentSubmodules } from '../src/data/moduleSubmodules.ts';
import { planGuidedNavigation } from '../src/lib/moduleWayfinding.ts';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const nav = read('src/components/common/ModuleSectionNav.tsx');
const shell = read('src/styles.css');
const navigationCss = read('src/styles/48-cla-unified-navigation.css');
const polishCss = read('src/styles/49-cla-product-polish.css');
const about = read('src/page/main/AboutPage.tsx');
const contact = read('src/page/main/ContactPage.tsx');
const profile = read('src/page/seed/StudentProfilePage.tsx');
const transcript = read('src/page/seed/StudentTranscriptPage.tsx');

const homes = {seed:'/student',lumen:'/lumen',atlas:'/atlas',orion:'/orion',pulse:'/pulse',haven:'/haven'};

test('CP74 removes the redundant cross-module dropdown and preserves More',()=>{
  assert.doesNotMatch(nav, /cla-guided-journey|moduleOrder\.map|Chuyển đến phân hệ khác/);
  assert.match(nav, /cla-guided-more/);
  assert.match(nav, /aria-current=/);
  assert.match(nav, /cla-unified-tabs/);
});

test('CP74 six module navigation still reaches all implemented destinations',()=>{
  for (const [module, home] of Object.entries(homes)) {
    const all = getStudentSubmodules(module).filter(x=>x.href && x.href!==home && x.status!=='planned');
    for (const dest of [home,...all.map(x=>x.href)]) {
      const route=planGuidedNavigation(getStudentSubmodules(module),home,dest);
      assert.deepEqual(new Set([...route.featured,...route.more].map(x=>x.href)),new Set(all.map(x=>x.href)));
    }
  }
});

test('CP74 navigation is one low-noise bar, responsive and readable in dark mode',()=>{
  assert.match(navigationCss, /--unav-surface:\s*#fff/);
  assert.match(navigationCss, /--unav-muted:\s*#546b83/);
  assert.match(navigationCss, /\[aria-current="page"\]::after/);
  assert.match(navigationCss, /@media \(max-width: 900px\)/);
  assert.match(navigationCss, /:root\[data-theme="dark"\]/);
  assert.doesNotMatch(navigationCss, /\.cla-guided-journey-grid/);
  assert.match(shell, /48-cla-unified-navigation\.css/);
  const imports = [...shell.matchAll(/^@import "\.\/styles\/([^"]+)";/gm)].map(match => match[1]);
  const base = imports.indexOf('48-cla-unified-navigation.css');
  const polish = imports.indexOf('49-cla-product-polish.css');
  assert.ok(base >= 0 && polish > base, 'shared polish layer must follow navigation CSS');
  for (const layer of ['50-cp87-circuit-primary.css', '51-cp89-lumen-clarity.css', '52-cp90-lumen-hero.css']) {
    assert.ok(imports.indexOf(layer) > polish, `${layer} must follow the CP74 base polish`);
  }
});

test('CP74 retry actions explicitly use the shared visible button design',()=>{
  assert.match(profile, /className="cla-action-button cla-action-button--outline"/);
  assert.match(profile, /Thử tải lại hồ sơ/);
  assert.match(transcript, /className="cla-action-button cla-action-button--outline"[^>]*>Thử đồng bộ lại/);
  assert.match(polishCss, /\.profile-page \.profile-message\[role="alert"\] \+ \.cla-action-button/);
  assert.match(polishCss, /\.app-root main button:not\(\[class\]\)/);
  assert.match(polishCss, /:focus-visible/);
});

test('CP74 about page is honest about data maturity and covers six student modules',()=>{
  for(const module of Object.keys(homes)) assert.match(about,new RegExp(`name: "${module[0].toUpperCase()+module.slice(1)}"`));
  assert.match(about,/không tự tạo điểm số/);
  assert.match(about,/kiểm định/);
  assert.doesNotMatch(about,/Nexus Core|admin@gmail\.com|Admin có thể kiểm thử/);
  assert.match(about,/aria-labelledby="cla-about-title"/);
  assert.match(about,/cla-public-module-grid/);
});

test('CP74 contact page has usable issue selection and a real mail-client handoff',()=>{
  assert.match(contact, /onClick=\{\(\) => setTopic\(item\.id\)\}/);
  assert.match(contact, /onSubmit=\{openEmail\}/);
  assert.match(contact, /window\.location\.href = buildSupportMailto/);
  assert.match(contact, /type="submit"/);
  assert.match(contact, /required minLength=\{10\}/);
  assert.match(contact, /Nhấn nút không đồng nghĩa email đã được gửi/);
  assert.doesNotMatch(contact, /Chọn kênh<\/button>|type="button">Gửi liên hệ/);
});

test('CP74 mailto encodes Unicode and message without pretending to submit',()=>{
  const uri=buildSupportMailto('Hồ sơ & bảng điểm','Tôi cần xem lại GPA và điểm Toán.','  Minh  ');
  assert.ok(uri.startsWith(`mailto:${SUPPORT_EMAIL}?subject=`));
  const params=new URLSearchParams(uri.split('?')[1]);
  assert.equal(params.get('subject'),'[Cognitive Learn AI] Hồ sơ & bảng điểm');
  assert.match(params.get('body'),/Tên gọi: Minh/);
  assert.match(params.get('body'),/Tôi cần xem lại GPA và điểm Toán/);
  assert.match(params.get('body'),/không gửi mật khẩu/);
  assert.match(new URLSearchParams(buildSupportMailto('Lỗi','Mô tả',' ').split('?')[1]).get('body'),/Không cung cấp/);
});

test('CP74 public information pages use one design system and no duplicate nav menu',()=>{
  for(const file of [about,contact]) {
    assert.match(file,/className="cla-public-page/);
    assert.match(file,/className="cla-public-header"/);
    assert.match(file,/<UserMenu \/>/);
    assert.doesNotMatch(file,/info-floating-header|premium-info-page|cla-public-header-nav/);
  }
  assert.match(polishCss,/\.cla-public-module-grid/);
  assert.match(polishCss,/\.cla-contact-topic-grid/);
  assert.match(polishCss,/\.cla-contact-form/);
  assert.match(polishCss,/@media \(max-width: 440px\)/);
});
