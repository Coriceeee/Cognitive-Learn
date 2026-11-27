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
  let allowNavigation = () => true;
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
    if(name==='./draftNavigationGuard')return {canNavigate:(from,to)=>allowNavigation(from,to)};
    throw new Error(name);
  };
  new Function('module','exports','require','window','document','Element','URL',js)(m,m.exports,requireMock,fakeWindow,fakeDocument,FakeElement,URL);
  const click = (href,opts={})=>{
    const link = {href:new URL(href,address).href,target:opts.target??'',rel:opts.rel??'',dataset:opts.dataset??{},hasAttribute:name=>opts.download === true && name==='download'};
    const event={target:new FakeElement(link),button:opts.button??0,defaultPrevented:false,metaKey:!!opts.metaKey,ctrlKey:!!opts.ctrlKey,shiftKey:!!opts.shiftKey,altKey:!!opts.altKey,
      preventDefault(){this.defaultPrevented=true;}};
    documentEvents.click(event);return event;
  };
  return {nav:m.exports, click, warms,pushes,windowEvents,documentEvents,
    setGuard(fn){allowNavigation=fn;},setLocation(href){address=new URL(href,address);},get hardReloads(){return hardReloads;}, get path(){return address.pathname+address.search+address.hash;}, link(href){return {target:new FakeElement({href:new URL(href,address).href,target:'',rel:'',dataset:{},hasAttribute:()=>false})};}};
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
  assert.match(app,/startRouteTransition\(\(\) => setRouteSnapshot\(\{/);
  assert.doesNotMatch(app,/useSyncExternalStore\(/);
  assert.match(app,/routePending && <div className="cla-route-progress"/);
  assert.match(app,/path === "\/student\/consent" \|\| path\.startsWith\("\/admin"\)/);
  assert.match(provider,/Context\.Provider value=\{\{\.\.\.verified, transcript\}\}/);
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

// CP56: draft exit protection is enforced before SPA routing and for Back.
test('CP56: a declined guard blocks a link without unmounting current page',()=>{
  const h=createNavigationHarness();let seen=0;
  h.nav.subscribeNavigation(()=>seen++);
  h.setGuard((_from,to)=>to!=='/atlas');
  const e=h.click('/atlas');
  assert.equal(e.defaultPrevented,true);
  assert.equal(h.path,'/student');
  assert.equal(h.pushes.length,0);
  assert.equal(seen,0);
  h.click('/lumen');
  assert.equal(h.path,'/lumen');assert.equal(seen,1);
});

test('CP56: browser Back rejected by guard restores URL without notifying React',()=>{
  const h=createNavigationHarness();let seen=0;
  h.nav.subscribeNavigation(()=>seen++);
  h.click('/orion');
  assert.equal(seen,1);
  h.setGuard((_from,to)=>to!=='/student');
  h.setLocation('/student');
  h.windowEvents.popstate();
  assert.equal(h.path,'/orion');
  assert.equal(seen,1);
  assert.equal(h.hardReloads,0);
});

test('CP56: imperative navigation obeys dirty guard, and same route is a no-op',()=>{
  const h=createNavigationHarness();let seen=0;
  h.nav.subscribeNavigation(()=>seen++);
  h.setGuard(()=>false);
  h.nav.navigateTo('/pulse');
  assert.equal(h.path,'/student');assert.equal(seen,0);
  h.nav.navigateTo('/student');
  assert.equal(seen,0);
});

test('CP58: same-path query navigation notifies React, preserves SPA and supports Back query',()=>{
  const h=createNavigationHarness();const urls=[];
  h.setLocation('/admin?cluster=nexus-core');
  h.nav.subscribeNavigation(()=>urls.push(h.nav.getNavigationSnapshot()));
  h.nav.navigateTo('/admin?cluster=atlas-admission');
  assert.equal(h.path,'/admin?cluster=atlas-admission');
  assert.equal(h.hardReloads,0);
  h.setLocation('/admin?cluster=nexus-core');
  h.windowEvents.popstate();
  assert.deepEqual(urls,['/admin?cluster=atlas-admission','/admin?cluster=nexus-core']);
  assert.equal(h.nav.getLastNavigationKind(),'pop');
});


test('CP45 regression: route changes preserve the authenticated shell and shared student provider',()=>{
  const app=read('src/App.tsx');
  const boundary=read('src/components/common/RouteErrorBoundary.tsx');
  assert.match(app,/<RouteErrorBoundary route=\{path\}>/);
  assert.doesNotMatch(app,/<RouteErrorBoundary key=\{path\}/);
  assert.match(app,/const routeView = <div ref=\{routeViewRef\} className="cla-route-view"/);
  assert.match(app,/previousPath && previousPath !== path/);
  assert.match(app,/view\.animate\(/);
  assert.match(app,/prefers-reduced-motion/);
  assert.match(boundary,/static getDerivedStateFromProps/);
  assert.match(boundary,/props\.route !== state\.route/);
  assert.match(app,/<StudentProfileProvider>/);
});


test('CP45 regression: lazy route chunks cannot remount AccessGate or the shared student provider',()=>{
  const app=read('src/App.tsx');
  const gateStart=app.indexOf('<AccessGate path={path}>');
  const gateEnd=app.indexOf('</AccessGate>',gateStart);
  assert.ok(gateStart>0 && gateEnd>gateStart,'AccessGate remains mounted in the route shell');
  const shellBeforeGate=app.slice(app.indexOf('<RouteErrorBoundary route={path}>'),gateStart);
  const suspenseOpens=shellBeforeGate.split('<Suspense').length-1;
  const suspenseCloses=shellBeforeGate.split('</Suspense>').length-1;
  assert.equal(suspenseOpens,suspenseCloses,'no app-wide Suspense boundary may contain the authorization gate');
  const gate=app.slice(gateStart,gateEnd);
  const provider=gate.indexOf('<StudentProfileProvider>');
  assert.ok(provider>0,'shared provider remains inside the persistent AccessGate');
  const providerBoundary=gate.lastIndexOf('<Suspense fallback={<AppLoading />}>',provider);
  assert.ok(providerBoundary>=0 && providerBoundary<provider,'provider first-load boundary is inside AccessGate');
  const providerEnd=gate.indexOf('</StudentProfileProvider>',provider);
  const routeBoundary=gate.indexOf('<Suspense fallback={null}>',provider);
  const routeBoundaryEnd=gate.indexOf('</Suspense>',routeBoundary);
  assert.ok(providerEnd>provider && routeBoundary>provider && routeBoundaryEnd>routeBoundary && routeBoundaryEnd<providerEnd,
    'lazy route content has a nested boundary inside the persistent provider');
  assert.match(app,/routePending && <div className="cla-route-progress"/);
});


test('CP45 regression: student route changes keep authorization verification scoped to the student session',()=>{
  const gate=read('src/components/common/AccessGate.tsx');
  assert.ok(gate.includes('const accessScope = path === "/student/consent" ? "consent" : path.startsWith("/admin") ? "admin" : "student";'));
  assert.ok(gate.includes("}, [accessScope]);"));
});
