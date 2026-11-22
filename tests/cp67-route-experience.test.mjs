import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getRouteDisplayTitle, getSafeFragment, planRouteExperience } from '../src/lib/routeExperience.ts';

const source = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const app = source('src/App.tsx');
const css = source('src/styles/46-cla-route-accessibility.css');
const globalCSS = source('src/styles.css');
const nav = source('src/lib/clientNavigation.ts');
const x = (from, to, kind='push') => planRouteExperience(from,to,kind);

describe('CP67: SPA route focus, scroll and announcements', () => {
  it('does not shift focus or scroll on first render', () => {
    assert.deepEqual(x(null,'/student'), {scroll:'preserve',anchor:null,focusContent:false});
  });
  it('a real student route change scrolls to top and focuses the new workspace', () => {
    assert.deepEqual(x('/student','/orion/inputs'), {scroll:'top',anchor:null,focusContent:true});
    assert.deepEqual(x('/atlas/compare','/lumen/history','replace'), {scroll:'top',anchor:null,focusContent:true});
  });
  it('country and admission query filters preserve viewport and input focus', () => {
    assert.deepEqual(x('/atlas/study-abroad?country=vn','/atlas/study-abroad?country=jp'), {scroll:'preserve',anchor:null,focusContent:false});
    assert.deepEqual(x('/atlas/sources?q=toan','/atlas/sources?q=ly'), {scroll:'preserve',anchor:null,focusContent:false});
    assert.deepEqual(x('/admin/diagnostics?view=source','/admin/diagnostics?view=ml'), {scroll:'preserve',anchor:null,focusContent:false});
  });
  it('hash target within the same route is scrolled into view without stealing focus', () => {
    assert.deepEqual(x('/student#exam-top','/student#exam-bottom'), {scroll:'anchor',anchor:'exam-bottom',focusContent:false});
  });
  it('real route change can land at an existing anchor', () => {
    assert.deepEqual(x('/student','/lumen#section-1'), {scroll:'anchor',anchor:'section-1',focusContent:true});
  });
  it('Back/Forward restores scroll but focuses the new content when the page changes', () => {
    assert.deepEqual(x('/orion/inputs','/student','pop'), {scroll:'preserve',anchor:null,focusContent:true});
    assert.deepEqual(x('/atlas/study-abroad?country=fr','/atlas/study-abroad?country=jp','pop'), {scroll:'preserve',anchor:null,focusContent:false});
    assert.deepEqual(x('/haven','/lumen#overview','pop'), {scroll:'anchor',anchor:'overview',focusContent:true});
  });
  it('malformed hash escape cannot crash app or hijack scroll restoration', () => {
    assert.equal(getSafeFragment('#bad%FZ'),null);
    assert.equal(getSafeFragment(''),null);
    assert.deepEqual(x('/student','/lumen#bad%FZ'), {scroll:'top',anchor:null,focusContent:true});
  });
  it('fragment target supports encoded Vietnamese and common IDs', () => {
    assert.equal(getSafeFragment('#m%E1%BB%A5c-1'),'mục-1');
    assert.equal(getSafeFragment('#cla-page-content'),'cla-page-content');
  });
  it('naming pages does not mislabel simulated scores or admissions predictions',()=>{
    for(const path of ['/student','/lumen','/atlas','/orion','/pulse','/haven']) {
      assert.match(getRouteDisplayTitle(path), /Seed|Lumen|Atlas|Orion|Pulse|Haven/);
      assert.doesNotMatch(getRouteDisplayTitle(path), /%|xác suất trúng tuyển/i);
    }
  });
  it('student exam, school choices and scholarship pages receive distinct titles',()=>{
    assert.match(getRouteDisplayTitle('/student/exams'),/Lịch thi/);
    assert.match(getRouteDisplayTitle('/atlas/compare'),/So sánh/);
    assert.match(getRouteDisplayTitle('/haven/scholarships'),/Học bổng/);
    assert.match(getRouteDisplayTitle('/atlas/study-abroad/japan'),/Du học quốc tế/);
  });
  it('admin pages are not advertised as student modules',()=>{
    assert.match(getRouteDisplayTitle('/admin'),/Nexus/);
    assert.match(getRouteDisplayTitle('/admin/audit'),/Nexus/);
  });
  it('app keeps progress transition while announcing a meaningful route title',()=>{
    assert.match(app,/getRouteDisplayTitle\(path\)/);
    assert.match(app,/document\.title\s*=/);
    assert.match(app,/role="status" aria-live="polite" aria-atomic="true"/);
    assert.match(app,/routePending &&/);
    assert.match(app,/startRouteTransition/);
  });
  it('skip link targets an existing focusable content anchor, not nested main',()=>{
    assert.match(app,/href="#cla-page-content"/);
    assert.match(app,/id="cla-page-content" tabIndex=\{-1\}/);
    assert.match(app,/getElementById\('cla-page-content'\)\?\.focus\(\{preventScroll: true\}\)/);
    assert.doesNotMatch(app,/role="main"/);
  });
  it('route-scroll plan drives the side effect, query changes do not force scroll-to-top',()=>{
    assert.match(app,/planRouteExperience\(previous, routeSnapshot\.href, routeSnapshot\.kind\)/);
    assert.match(app,/experience\.scroll === 'top'/);
    assert.match(app,/experience\.anchor/);
    assert.doesNotMatch(app,/if \(getLastNavigationKind\(\) === 'pop'\) return;/);
  });
  it('navigation kind is captured with route state (not read after async commit)',()=>{
    assert.match(app,/href: getNavigationSnapshot\(\), kind: getLastNavigationKind\(\)/);
  });
  it('CSS has accessible visual skip, dark-independent contrast, reduced-motion and print',()=>{
    assert.match(globalCSS,/46-cla-route-accessibility\.css/);
    for(const pattern of [/:focus-visible/,/#cla-page-content:focus-visible/,/@media \(prefers-reduced-motion: reduce\)/,/@media print/]) assert.match(css,pattern);
    assert.doesNotMatch(css,/display:\s*none\s*;[^}]*\.cla-skip-to-content/);
  });
  it('works with the existing unsaved-draft navigation guard and native hash handling',()=>{
    assert.match(nav,/canNavigate\(currentLocation\(\), destination\)/);
    assert.match(nav,/Preserve native in-page anchors/);
    assert.match(app,/subscribeNavigation/);
  });
});
