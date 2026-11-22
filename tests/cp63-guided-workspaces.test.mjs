import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getStudentSubmodules } from '../src/data/moduleSubmodules.ts';
import { planGuidedNavigation } from '../src/lib/moduleWayfinding.ts';

const nav = readFileSync(new URL('../src/components/common/ModuleSectionNav.tsx',import.meta.url),'utf8');
const css = readFileSync(new URL('../src/styles/42-cla-guided-workspaces.css',import.meta.url),'utf8');
const entry = readFileSync(new URL('../src/styles.css',import.meta.url),'utf8');
const app = readFileSync(new URL('../src/App.tsx',import.meta.url),'utf8');
const homes = {seed:'/student',lumen:'/lumen',atlas:'/atlas',orion:'/orion',pulse:'/pulse',haven:'/haven'};

for (const [key, home] of Object.entries(homes)) {
  describe(`CP63 student navigation ${key}`, () => {
    const items = getStudentSubmodules(key);
    const supported = items.filter(i=>i.href && i.href!==home && i.status!=='planned');
    it('keeps all implemented student pages reachable without duplication', () => {
      const overview = planGuidedNavigation(items,home,home);
      assert.equal(overview.onHome,true);
      assert.equal(overview.next?.href,supported[0]?.href);
      const reachable = [home,...overview.featured.map(i=>i.href),...overview.more.map(i=>i.href)];
      assert.equal(new Set(reachable).size,reachable.length);
      assert.deepEqual(new Set(reachable),new Set([home,...supported.map(i=>i.href)]));
      assert.ok(overview.featured.length <= 3);
      assert.ok(reachable.every(href=>!href.startsWith('/admin')));
    });
    it('pins selected pages, including those originally behind disclosure', () => {
      for (let i=0;i<supported.length;i++) {
        const current = planGuidedNavigation(items,home,supported[i].href);
        assert.equal(current.active?.id,supported[i].id);
        assert.ok(current.featured.includes(supported[i]));
        assert.equal(current.step,i+2);
        assert.equal(current.total,supported.length+1);
        assert.equal(current.previous?.id,i>0?supported[i-1].id:undefined);
        assert.equal(current.next?.id,supported[i+1]?.id);
        const merged=[...current.featured,...current.more];
        assert.equal(merged.length,supported.length);
        assert.equal(new Set(merged.map(x=>x.id)).size,supported.length);
      }
    });
  });
}

describe('CP63 cross-module and accessibility contracts',()=>{
  it('handles nested study abroad country routes as the Atlas study-abroad tab',()=>{
    const p=planGuidedNavigation(getStudentSubmodules('atlas'),'/atlas','/atlas/study-abroad/japan');
    assert.equal(p.active?.href,'/atlas/study-abroad');
    assert.ok(p.featured.includes(p.active));
  });
  it('never exposes planned-only or missing destinations',()=>{
    const data=[{id:'planned',title:'P',description:'',group:'G',href:'/test/p',status:'planned'},
      {id:'missing',title:'M',description:'',group:'G',status:'partial'},
      {id:'live',title:'L',description:'',group:'G',href:'/test/live',status:'available'}];
    const p=planGuidedNavigation(data,'/test','/test/p');
    assert.deepEqual(p.available.map(i=>i.id),['live']);
    assert.equal(p.active,undefined);
  });
  it('caps quick links to a small scan-friendly set and preserves order',()=>{
    const items=Array.from({length:10},(_,n)=>({id:`i${n}`,title:`T${n}`,description:'',group:'G',href:`/r/${n}`,status:'partial'}));
    const p=planGuidedNavigation(items,'/r','/r/9');
    assert.deepEqual(p.featured.map(i=>i.id),['i0','i1','i9']);
    assert.equal(p.more.length,7);
    assert.equal(p.step,11);
  });
  it('uses semantic links, native disclosure, current-page labels and no invented completion gauge',()=>{
    assert.match(nav,/cla-module-subnav-links/);
    assert.match(nav,/item\.status === "partial"/);
    assert.match(nav,/aria-current=/);
    assert.match(nav,/<details className="cla-guided-more"/);
    assert.doesNotMatch(nav,/<details className="cla-guided-journey"/);
    assert.match(nav,/the student dashboard owns that journey/);
    assert.doesNotMatch(nav,/cla-guided-journey-grid/);
    assert.doesNotMatch(nav,/<progress|role="progressbar"|onClick=.*window\.location/);
  });
  it('includes accessible focus, dark/light and mobile CSS with reduced motion',()=>{
    assert.match(entry,/42-cla-guided-workspaces\.css/);
    assert.match(css,/:root\[data-theme="dark"\]/);
    assert.match(css,/@media\(max-width: 640px\)/);
    assert.match(css,/@media\(prefers-reduced-motion: reduce\)/);
    assert.match(css,/:focus-visible/);
  });
  it('keeps SPA routing and unsaved-draft navigation guards in charge of links',()=>{
    assert.match(app,/subscribeNavigation/);
    assert.match(app,/startRouteTransition/);
    assert.doesNotMatch(nav,/window\.location\s*=|location\.assign|window\.open/);
  });
});
