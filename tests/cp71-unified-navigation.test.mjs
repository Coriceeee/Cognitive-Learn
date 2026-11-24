import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getStudentSubmodules } from '../src/data/moduleSubmodules.ts';
import { planGuidedNavigation } from '../src/lib/moduleWayfinding.ts';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const nav = read('src/components/common/ModuleSectionNav.tsx');
const css = read('src/styles/48-cla-unified-navigation.css');
const styles = read('src/styles.css');
const abroad = read('src/page/study-abroad/StudyAbroadPage.tsx');
const homes = {seed:'/student',lumen:'/lumen',atlas:'/atlas',orion:'/orion',pulse:'/pulse',haven:'/haven'};

test('CP71: all six student workspaces use the same navigation component and bar class', () => {
  assert.match(nav, /cla-guided-workspace cla-unified-bar/);
  assert.match(nav, /getStudentSubmodules\(moduleKey\)/);
  assert.doesNotMatch(nav, /moduleOrder\.map/);
  assert.match(nav, /aria-current=/);
  for (const [mod,home] of Object.entries(homes)) {
    assert.match(nav, new RegExp(`${mod}: \\{ name:`));
    const guide = planGuidedNavigation(getStudentSubmodules(mod),home,home);
    assert.ok(guide.available.length>0);
    assert.ok(guide.available.every(x=>x.href && !x.href.startsWith('/admin')));
  }
});

test('CP71: former stacked heading / pager / start panels are absent in rendered module navigation', () => {
  assert.doesNotMatch(nav,/cla-guided-topline|cla-guided-heading|cla-guided-pager|cla-guided-start|cla-module-subnav-head/);
  assert.match(nav, /cla-unified-identity/);
  assert.match(nav, /cla-unified-tabs/);
  assert.match(nav, /cla-unified-actions/);
});

test('CP71: every implemented tab is reachable through quick links or More', () => {
  for(const [mod,home] of Object.entries(homes)) {
    const all = getStudentSubmodules(mod).filter(item=>item.href&&item.href!==home&&item.status!=='planned');
    for(const current of [home, ...all.map(x=>x.href)]) {
      const guide = planGuidedNavigation(getStudentSubmodules(mod),home,current);
      assert.deepEqual(new Set([...guide.featured,...guide.more].map(i=>i.href)),new Set(all.map(i=>i.href)));
    }
  }
});

test('CP71: study abroad uses the same bar and keeps country on nested route links', () => {
  assert.match(nav,/studyAbroadSections\(\)/);
  for(const route of ['programs','requirements','sources']) assert.match(nav,new RegExp(`/atlas/study-abroad/${route}`));
  assert.match(nav,/encodeURIComponent\(country\)/);
  assert.match(nav,/currentPath === item\.href\?\.split\("\?"\)\[0\]/);
  assert.doesNotMatch(abroad,/<nav className="cla-study-actions"/);
  assert.match(abroad,/<ModuleSectionNav moduleKey="atlas"/);
});

test('CP71: unified navigation CSS loads after legacy tabs, before newer scoped enhancements', () => {
  // CP87-CP90 legitimately append new scoped CSS layers after CP74.
  // Keep the important contract: shared navigation styles precede newer scoped modules.
  const imports = [...styles.matchAll(/^@import "\.\/styles\/([^"]+)";/gm)].map(match => match[1]);
  const layers = ['48-cla-unified-navigation.css', '49-cla-product-polish.css',
    '50-cp87-circuit-primary.css', '51-cp89-lumen-clarity.css', '52-cp90-lumen-hero.css'];
  const positions = layers.map(layer => imports.indexOf(layer));
  assert.ok(positions.every(position => position >= 0), 'all five CSS layers must be imported');
  assert.ok(positions.every((position, index) => index === 0 || position > positions[index - 1]),
    'navigation base/polish must precede CP87-CP90 component overrides');
  assert.equal(new Set(imports).size, imports.length, 'CSS import must not duplicate a layer');
  for (const layer of layers.slice(2)) {
    assert.doesNotMatch(read(`src/styles/${layer}`), /\.cla-unified-(?:bar|tabs)\b/,
      `later scoped CSS must not globally override unified navigation: ${layer}`);
  }
  assert.match(css,/\.cla-module-subnav\.cla-focus-nav\.cla-guided-workspace\.cla-unified-bar/);
  assert.match(css,/\.cla-module-subnav-links\.cla-guided-primary\.cla-unified-tabs/);
  assert.match(css,/\.cla-workflow-tabs/);
  assert.match(css,/\.profile-grade-tabs/);
  assert.match(css,/\.profile-semester-tabs/);
  assert.match(css,/--unav-ink:/);
  assert.match(css,/--unav-surface:/);
  assert.match(css,/\[aria-current="page"\]/);
  assert.match(css,/:focus-visible/);
  assert.match(css,/@media \(max-width: 900px\)/);
  assert.match(css,/@media \(prefers-reduced-motion: reduce\)/);
});

test('CP71: map contrast repair is included and pairs colors with surfaces',()=>{
  const repair=read('src/styles/47-cla-contrast-repair.css');
  assert.match(styles,/47-cla-contrast-repair\.css/);
  for(const token of ['--map-ink','--map-surface','--map-secondary','--map-muted']) assert.ok(repair.includes(token));
  assert.match(repair,/\.module-path-empty/);
  assert.match(repair,/\.module-path-status\.is-available/);
});
