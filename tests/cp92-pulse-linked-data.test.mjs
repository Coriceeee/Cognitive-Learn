import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { derivePulseLinkedSignals } from '../src/lib/pulseLinkedSourceModel.ts';

const pick = (signals,key) => signals.find(item => item.key === key);
const sampleOrion = {weeksLeft:'12',targetMajor:'Khoa học dữ liệu',scores:{math:'7.5',literature:''},targets:{math:'8',literature:'9'}};

test('CP92 – exactly eight sourced fields, no fabricated zeros for missing sources', () => {
  const rows=derivePulseLinkedSignals({});
  assert.equal(rows.length,8);
  assert.equal(new Set(rows.map(row=>row.key)).size,8);
  assert.ok(rows.every(row=>row.value === null));
  assert.deepEqual([...new Set(rows.map(row=>row.source))].sort(),['ATLAS','LUMEN','ORION','SEED']);
});
test('CP92 – valid zero is an observed value, not missing',()=>{
  const rows=derivePulseLinkedSignals({seedRecord:{behavior:{studyHoursPerWeek:0,planCompletionRate:0}}});
  assert.equal(pick(rows,'seed-hours').value,0);
  assert.equal(pick(rows,'seed-plan').value,0);
});
test('CP92 – do not treat absent fields or placeholder values as observations',()=>{
  const rows=derivePulseLinkedSignals({seedRecord:{profile:{studyHoursPerWeek:0}},lumenScore:NaN,lumenCri:-5,history:[]});
  assert.equal(pick(rows,'seed-hours').value,null);
  assert.equal(pick(rows,'lumen-current').value,null);
  assert.equal(pick(rows,'lumen-cri').value,null);
  assert.equal(pick(rows,'lumen-previous').value,null);
});
test('CP92 – previous LUMEN requires two real dated observations',()=>{
  const first={overallScore:70,scoreAvailable:true,createdAt:'2026-11-21T00:00:00Z'};
  const second={overallScore:67,scoreAvailable:true,createdAt:'2026-11-20T00:00:00Z'};
  assert.equal(pick(derivePulseLinkedSignals({history:[first]}),'lumen-previous').value,null);
  assert.equal(pick(derivePulseLinkedSignals({history:[first,second]}),'lumen-previous').value,67);
  assert.equal(pick(derivePulseLinkedSignals({history:[{...first,createdAt:''},second]}),'lumen-previous').value,null);
  assert.equal(pick(derivePulseLinkedSignals({history:[{...first,scoreAvailable:false},second]}),'lumen-previous').value,null);
});
test('CP92 – Orion strategy comes from saved subject pairs, never defaults to 0',()=>{
  assert.equal(pick(derivePulseLinkedSignals({orionDraft:{weeksLeft:'12',scores:{math:''},targets:{math:''}}}),'orion-readiness').value,null);
  const score=pick(derivePulseLinkedSignals({orionDraft:sampleOrion}),'orion-readiness').value;
  assert.ok(typeof score==='number' && score>=0 && score<=100);
  assert.equal(pick(derivePulseLinkedSignals({orionDraft:{...sampleOrion,weeksLeft:'x'}}),'orion-readiness').value,null);
});
test('CP92 – ATLAS counts only come from explicit confirmed input, not assumed zero',()=>{
  const signals=derivePulseLinkedSignals({atlasProgramCount:4,atlasSourceCount:2});
  assert.equal(pick(signals,'atlas-programs').value,4);
  assert.equal(pick(signals,'atlas-sources').value,2);
  assert.equal(pick(derivePulseLinkedSignals({}),'atlas-programs').value,null);
});
test('CP92 – student PULSE shows direct verified sources, simulation limited to admin',()=>{
  const page=readFileSync(new URL('../src/page/pulse/PulsePage.tsx',import.meta.url),'utf8');
  const hook=readFileSync(new URL('../src/page/pulse/hooks/usePulseLinkedSources.ts',import.meta.url),'utf8');
  assert.match(page,/usePulseLinkedSources\(/);
  assert.match(page,/canSimulate=\{linked.ready > 0\} mode="linked"/);
  assert.match(page,/view === "\/pulse\/inputs" && isAdmin && <>/);
  assert.match(page,/view === "\/pulse\/progress" && <PulseLinkedPanel/);
  assert.match(hook,/isServerConfirmedSnapshot\(snap.metadata\)/);
  assert.match(hook,/isMatchingAccountRecord\(raw,owner\)/);
  assert.match(hook,/orion.uid===uid/);
  assert.match(hook,/history.owner===uid/);
  assert.doesNotMatch(hook,/setDoc\(|addDoc\(|runTransaction\(/);
});
