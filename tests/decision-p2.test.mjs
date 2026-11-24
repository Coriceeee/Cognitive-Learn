import {test} from 'node:test';
import assert from 'node:assert/strict';
import {optimizeGoalGap} from '../src/lib/goalGapOptimizer.ts';
import {createDecisionLedger,affectedDecisionModules,studentDecisionLedger,pinDecisionHandoff,checkDecisionHandoff,clearDecisionHandoff} from '../src/lib/studentDecisionSnapshot.ts';
const subjects=(...scores)=>scores.map((score,i)=>({subject:['math','english','physics'][i]||'other',score}));
for(const [name,s,t,status] of [
 ['balanced',subjects(6,7,8),24,'READY'],['zero',subjects(0,0,0),3,'READY'],['cap',subjects(10,8,8),29,'READY'],['all max',subjects(10,10,10),30,'ALREADY_MET'],['already',subjects(8,8,8),22,'ALREADY_MET'],['above max',subjects(9,9,9),31,'INFEASIBLE'],['missing',subjects(6,7),24,'INVALID'],['nan',subjects(6,NaN,7),24,'INVALID'],['duplicate',[{subject:'a',score:8},{subject:'a',score:8},{subject:'b',score:8}],24,'INVALID'],['negative',subjects(6,-1,7),24,'INVALID']]){
 test(`goal gap: ${name}`,()=>{const r=optimizeGoalGap(s,t);assert.equal(r.status,status);if(status==='READY'||status==='ALREADY_MET'){assert.ok(Object.values(r.targets).reduce((a,b)=>a+b,0)>=t-1e-8);for(const item of s){assert.ok(r.targets[item.subject]>=item.score-1e-8);assert.ok(r.targets[item.subject]<=10);}}else assert.deepEqual(r.targets,{});});
}
function ledger(){const l=createDecisionLedger();for(const key of ['profile','transcript','goal','sources','projection'])l.observe('A',key,'v1');return l;}
test('complete snapshot current',()=>{const l=ledger();assert.equal(l.check('A',l.capture('A','Atlas')),'CURRENT');});
for(const key of ['profile','transcript','goal','sources','projection'])test(`${key} changes invalidate Atlas`,()=>{const l=ledger();const s=l.capture('A','Atlas');l.observe('A',key,'v2');assert.equal(l.check('A',s),'STALE');});
test('unchanged input preserves revision',()=>{const l=ledger();const s=l.capture('A','Atlas');l.observe('A','profile','v1');assert.equal(l.check('A',s),'CURRENT');});
test('ABA cannot revive old snapshot',()=>{const l=ledger();const s=l.capture('A','Atlas');l.observe('A','profile','v2');l.observe('A','profile','v1');assert.equal(l.check('A',s),'STALE');});
test('missing cannot capture',()=>{const l=createDecisionLedger();l.observe('A','profile','v1');assert.equal(l.capture('A','Atlas'),null);});
test('unconfirmed revision unavailable',()=>{const l=ledger();const s=l.capture('A','Atlas');l.observe('A','profile',null);assert.equal(l.check('A',s),'UNAVAILABLE');});
test('foreign owner invalid',()=>{const l=ledger();assert.equal(l.check('B',l.capture('A','Atlas')),'INVALID');});
test('switch then switch back invalidates revisions',()=>{const l=ledger();const s=l.capture('A','Atlas');l.observe('B','profile','v1');l.observe('A','profile','v1');assert.notEqual(l.check('A',s),'CURRENT');});
test('wrong schema rejected',()=>{const l=ledger();assert.equal(l.check('A',{...l.capture('A','Atlas'),version:'bogus'}),'INVALID');});
test('missing revision rejected',()=>{const l=ledger();assert.equal(l.check('A',{...l.capture('A','Atlas'),revisions:{}}),'INVALID');});
test('source/goal change does not invalidate Lumen or history',()=>{assert.deepEqual(affectedDecisionModules(['goal','sources']),['Atlas','Orion']);});
test('profile change invalidates dependent modules but not Pulse history',()=>{assert.deepEqual(affectedDecisionModules(['profile']),['Seed','Lumen','Atlas','Orion']);});
test('handoff pinned, checked, cleared',()=>{studentDecisionLedger.clear();studentDecisionLedger.observe('A','profile','p1');studentDecisionLedger.observe('A','projection','x');studentDecisionLedger.observe('A','transcript','t1');assert.ok(pinDecisionHandoff('A','projection'));assert.equal(checkDecisionHandoff('A','projection'),'CURRENT');studentDecisionLedger.observe('A','profile','p2');assert.equal(checkDecisionHandoff('A','projection'),'STALE');clearDecisionHandoff('projection');assert.equal(checkDecisionHandoff('A','projection'),'INVALID');});

test('temporary unconfirmed state must block then restore same revision',()=>{const l=ledger();const s=l.capture('A','Atlas');l.observe('A','profile',null);assert.equal(l.check('A',s),'UNAVAILABLE');l.observe('A','profile','v1');assert.equal(l.check('A',s),'CURRENT');});
test('fractional target is never underallocated',()=>{const r=optimizeGoalGap(subjects(8,8,8),24.00001);assert.equal(r.status,'READY');assert.ok(Object.values(r.targets).reduce((a,b)=>a+b,0)>=24.00001);});
