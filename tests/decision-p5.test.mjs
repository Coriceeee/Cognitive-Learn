import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { groupPulseMissingActions } from '../src/lib/pulseMissingActions.ts';
import { derivePulseLinkedSignals } from '../src/lib/pulseLinkedSourceModel.ts';
import { getStudentSubmodules } from '../src/data/moduleSubmodules.ts';
import { planGuidedNavigation } from '../src/lib/moduleWayfinding.ts';
const read=p=>readFileSync(new URL(`../${p}`,import.meta.url),'utf8');
test('groups missing signals by identical destination, preserving all reasons',()=>{
 const signals=derivePulseLinkedSignals({}); const before=JSON.stringify(signals);
 const groups=groupPulseMissingActions(signals,false,[]);
 assert.equal(groups.length,6); assert.equal(groups.find(g=>g.href==='/student/profile').items.length,2);
 assert.equal(groups.find(g=>g.href==='/lumen').items.length,2);
 assert.deepEqual(groups.flatMap(g=>g.items.map(i=>i.key)).sort(),signals.map(i=>i.key).sort());
 assert.equal(JSON.stringify(signals),before);
});
test('does not collapse different routes belonging to the same module',()=>{
 const g=groupPulseMissingActions(derivePulseLinkedSignals({}),false,[]);
 assert.ok(g.some(x=>x.href==='/lumen/history'));assert.ok(g.some(x=>x.href==='/atlas/sources'));
});
test('observed zero is not missing; ready inputs do not produce action',()=>{
 const rows=derivePulseLinkedSignals({seedRecord:{studyHoursPerWeek:0,planCompletionRate:0},lumenScore:0});
 const missing=groupPulseMissingActions(rows,false,[]).flatMap(g=>g.items);
 assert.ok(!missing.some(i=>['seed-hours','seed-plan','lumen-current'].includes(i.key)));
 assert.deepEqual(groupPulseMissingActions(rows.map(r=>({...r,value:0})),false,[]),[]);
});
test('pending or failed sync never generates missing-input recommendations',()=>{
 const rows=derivePulseLinkedSignals({});assert.deepEqual(groupPulseMissingActions(rows,true,[]),[]);
 assert.deepEqual(groupPulseMissingActions(rows,false,['permission-denied']),[]);
 assert.deepEqual(groupPulseMissingActions(rows,true,['offline']),[]);
});
test('Atlas keeps its four-step journey, without two redundant start buttons',()=>{
 const atlas=read('src/page/atlas/AtlasPage.tsx'),journey=read('src/page/atlas/components/AtlasEvidenceJourney.tsx');
 assert.doesNotMatch(atlas,/<a className="cla-study-jump" href="\/atlas\/subjects"/);
 assert.doesNotMatch(journey,/<a href="\/atlas\/subjects" className="cla-ux-heading-action"/);
 assert.match(journey,/name: "Chọn tổ hợp".*href: "\/atlas\/subjects"/);
 assert.match(atlas,/view === "\/atlas\/recommendations" && <AtlasProgramDiscoveryPanel/);
 assert.match(atlas,/view === "\/atlas\/recommendations" && <p.*href="\/orion\/scenarios"/);
 assert.match(atlas,/view === "\/atlas\/library" && isAdmin && <>/);
});
test('Pulse actions display verified missing groups and distinguish loading, errors, success',()=>{
 const s=read('src/page/pulse/PulsePage.tsx');
 assert.match(s,/groupPulseMissingActions\(linked.signals, linked.loading, linked.errors\)/);
 assert.match(s,/linked.loading && <p role="status">Đang xác minh/);
 assert.match(s,/linked.errors.length > 0 && <div role="alert">/);
 assert.match(s,/!linked.loading && linked.errors.length === 0 && linked.ready===linked.signals.length/);
 assert.match(s,/group.items.map\(item=>/);
 assert.match(s,/view === "\/pulse\/checkin" && <ClosedLoopPanel/);
});
test('navigation remains bounded, accessible, and every implemented path is preserved',()=>{
 const homes={seed:'/student',lumen:'/lumen',atlas:'/atlas',orion:'/orion',pulse:'/pulse',haven:'/haven'};
 for(const [key,home] of Object.entries(homes)){
  const sections=getStudentSubmodules(key);const paths=sections.filter(x=>x.href&&x.href!==home&&x.status!=='planned').map(x=>x.href);
  const limit=['pulse','haven'].includes(key)?2:3;
  for(const current of [home,...paths]){
   const plan=planGuidedNavigation(sections,home,current,limit);assert.ok(plan.featured.length<=limit);
   assert.deepEqual([...plan.featured,...plan.more].map(x=>x.href).sort(),paths.slice().sort());
   if(current!==home)assert.ok(plan.featured.some(x=>x.href===current));
  }
 }
 const s=read('src/components/common/ModuleSectionNav.tsx');assert.match(s,/<details className="cla-guided-more" key=\{currentPath\}>/);assert.match(s,/aria-current=/);
});
