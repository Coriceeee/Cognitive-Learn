const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname,'..');
const read = p => fs.readFileSync(path.join(root,p),'utf8');

function createNavigationHarness() {
  const scripts = {};
  const windowEvents = {};
  const documentEvents = {};
  let address = new URL('https://cla.example/student');
  let hardReloads = 0;
  const pushes = [], warms = [];
  const location = {
    get href(){return address.href;}, get origin(){return address.origin;},
    get pathname(){return address.pathname;},get search(){return address.search;},get hash(){return address.hash;},
    assign(href){hardReloads++;address=new URL(href,address);},
  };
  const fakeWindow = {
    location,
    history:{
      state:null,
      pushState(_state,_title,url){pushes.push(url); address = new URL(url,address);},
      replaceState(_state,_title,url){address = new URL(url,address);},
    },
    addEventListener(name,handler){windowEvents[name] = handler;},
    removeEventListener(name){delete windowEvents[name];},
  };
  const fakeDocument = {
    addEventListener(name,handler){documentEvents[name]=handler;},
    removeEventListener(name){delete documentEvents[name];},
  };
  class FakeElement {
    constructor(link){this.link = link;}
    closest(selector){ assert.equal(selector,'a[href]');return this.link; }
  }
  const source = read('src/lib/clientNavigation.ts');
  const js = ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const m={exports:{}};
  const requireMock = name=>{
    if(name==='./focusedModuleRoute')return {resolveFocusedPath:(p,h)=> p==='/lumen' && h==='#lumen-indices' ? '/lumen/indices':p};
    if(name==='./routeModules')return {prefetchRoute:p=>warms.push(p)};
    throw new Error(name);
  };
  new Function('module','exports','require','window','document','Element','URL',js)(m,m.exports,requireMock,fakeWindow,fakeDocument,FakeElement,URL);
  const click = (href,opts={})=>{
    const link = {href:new URL(href,address).href,target:opts.target??'',rel:opts.rel??'',dataset:opts.dataset??{},hasAttribute:name=>opts.download === true && name==='download'};
    const event={target:new FakeElement(link),button:opts.button??0,defaultPrevented:false,metaKey:!!opts.metaKey,ctrlKey:!!opts.ctrlKey,shiftKey:!!opts.shiftKey,altKey:!!opts.altKey,
      preventDefault(){this.defaultPrevented=true;}};
    documentEvents.click(event);return event;
  };
  return {nav:m.exports, click, warms,pushes,windowEvents,documentEvents,get hardReloads(){return hardReloads;}, get path(){return address.pathname+address.search+address.hash;}, link(href){return {target:new FakeElement({href:new URL(href,address).href,target:'',rel:'',dataset:{},hasAttribute:()=>false})};}};
}

test('CP45 navigation: internal links use pushState without document reload',()=>{
  const h=createNavigationHarness();
  const seen=[];
  const unsubscribe=h.nav.subscribeNavigation(()=>seen.push(h.nav.getNavigationSnapshot()));
  const e=h.click('/lumen');
  assert.equal(e.defaultPrevented,true);
  assert.equal(h.hardReloads,0);
  assert.equal(h.path,'/lumen');
  assert.deepEqual(h.pushes,['/lumen']);
  assert.deepEqual(seen,['/lumen']);
  unsubscribe();
  assert.equal(h.documentEvents.click,undefined);
});

test('CP45 navigation: browser Back/Forward notifies React without reload',()=>{
  const h=createNavigationHarness();const seen=[];
  h.nav.subscribeNavigation(()=>seen.push(h.path));
  h.click('/atlas');
  h.windowEvents.popstate();
  assert.equal(h.nav.getLastNavigationKind(),'pop');
  assert.equal(h.hardReloads,0);assert.deepEqual(seen,['/atlas','/atlas']);
});

test('CP45 navigation: native same-page anchors and external links remain native',()=>{
  const h=createNavigationHarness();h.nav.subscribeNavigation(()=>{});
  for(const href of ['#student-top','https://example.org/public']) {
    const e=h.click(href);
    assert.equal(e.defaultPrevented,false);
  }
  assert.equal(h.pushes.length,0);
});

test('CP45 navigation: modified clicks, new-tab links and downloads are never hijacked',()=>{
  const h=createNavigationHarness();h.nav.subscribeNavigation(()=>{});
  for(const opts of [{ctrlKey:true},{metaKey:true},{shiftKey:true},{altKey:true},{button:1},{target:'_blank'},{download:true},{dataset:{fullReload:'true'}}]) {
    assert.equal(h.click('/atlas',opts).defaultPrevented,false);
  }
  assert.equal(h.pushes.length,0);
});

test('CP45 navigation: pointer and keyboard intent only prefetch the route code',()=>{
  const h=createNavigationHarness();h.nav.subscribeNavigation(()=>{});
  h.documentEvents.pointerover(h.link('/orion/scenarios'));
  h.documentEvents.focusin(h.link('/pulse'));
  assert.deepEqual(h.warms,['/orion/scenarios','/pulse']);
  assert.equal(h.hardReloads,0);assert.equal(h.path,'/student');
});

test('CP45 navigation: legacy hash bookmarks are converted to canonical module path',()=>{
  const h=createNavigationHarness();h.nav.subscribeNavigation(()=>{});
  h.click('/lumen#lumen-indices');
  assert.equal(h.path,'/lumen/indices');assert.equal(h.hardReloads,0);
});

test('CP45: transition keeps revealed content during lazy import, profile watcher is shared and consent gated',()=>{
  const app=read('src/App.tsx');
  const provider=read('src/page/seed/hooks/StudentProfileProvider.tsx');
  const seed=read('src/page/seed/StudentPage.tsx');
  const lumen=read('src/page/lumen/LumenPage.tsx');
  assert.match(app,/startRouteTransition\(\(\) => setPath\(currentFocusedPath\(\)\)\)/);
  assert.doesNotMatch(app,/useSyncExternalStore\(/);
  assert.match(app,/routePending && <div className="cla-route-progress"/);
  assert.match(app,/path === "\/student\/consent" \|\| path\.startsWith\("\/admin"\)/);
  assert.match(provider,/Context\.Provider value=\{verified\}/);
  assert.match(seed,/useVerifiedStudentProfile\(\)/);
  assert.match(lumen,/useVerifiedStudentProfile\(\)/);
  assert.match(read('src/page/seed/hooks/useStudentProfile.ts'),/isServerConfirmedSnapshot\(snapshot\.metadata\)/);
});

test('CP45: lazy routes have a single shared import table, without eager imports',()=>{
  const app=read('src/App.tsx'),m=read('src/lib/routeModules.ts');
  for(const [name,component] of [['student','TrangHocSinh'],['atlas','AtlasPage'],['lumen','LumenPage'],['pulse','PulsePage'],['haven','HavenPage'],['orion','OrionPage']]){
    assert.ok(app.includes(`const ${component} = lazy(routeModules.${name})`),name);
  }
  assert.match(m,/const requested = new Map/);
  assert.match(m,/Prefetch loads CODE only/);
});
