import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { inspectModuleInputs } from '../src/lib/moduleInputReadiness.ts';

const component = readFileSync(new URL('../src/components/common/ModuleInputObservatory.tsx',import.meta.url),'utf8');
const css = readFileSync(new URL('../src/styles/43-cla-input-observatory.css',import.meta.url),'utf8');
const entry = readFileSync(new URL('../src/styles.css',import.meta.url),'utf8');
const pages = Object.fromEntries(['orion','pulse','haven'].map(module=>[module,readFileSync(new URL(`../src/page/${module}/${module[0].toUpperCase()+module.slice(1)}Page.tsx`,import.meta.url),'utf8')]));
const field = (key,value,min=0,max=100,integer=false) => ({key,label:key,value,min,max,integer});

const check = groups => inspectModuleInputs(groups);

describe('CP64 real field-coverage semantics',()=>{
  it('does not count blank values as observed zero',()=>{
    const r=check([{key:'g',title:'G',fields:[field('empty',''),field('whitespace','   '),field('zero','0')]}]);
    assert.deepEqual([r.ready,r.missing,r.invalid],[1,2,0]);
    assert.deepEqual(r.groups[0].fields.map(x=>x.state),['missing','missing','ready']);
  });
  it('does not count invalid text, NaN, Infinity, or out-of-range values',()=>{
    const r=check([{key:'g',title:'G',fields:[field('n','NaN'),field('i','Infinity'),field('x','1000'),field('t','hello')]}]);
    assert.equal(r.ready,0); assert.equal(r.invalid,4);
  });
  it('accepts explicit boundaries, decimal comma, and valid negative if permitted',()=>{
    const r=check([{key:'g',title:'G',fields:[field('min','0',0,10),field('max','10',0,10),field('comma','8,5',0,10),field('negative','-1',-2,2)]}]);
    assert.equal(r.ready,4);
  });
  it('enforces integer-only weeks and counts when configured',()=>{
    const r=check([{key:'g',title:'G',fields:[field('weeks','2.5',1,104,true),field('count','4',0,10000,true)]}]);
    assert.deepEqual([r.ready,r.invalid],[1,1]);
  });
  it('tracks text fields without inventing a numeric score',()=>{
    const r=check([{key:'g',title:'G',fields:[{key:'major',label:'Major',value:'Khoa học dữ liệu'},{key:'empty',label:'Empty',value:''}]}]);
    assert.equal(r.ready,1);assert.equal(r.missing,1);
  });
  it('sums independent groups without losing missing or invalid information',()=>{
    const r=check([{key:'a',title:'A',fields:[field('ok','9',0,10),field('missing','')]},
      {key:'b',title:'B',fields:[field('invalid','-4'),field('ready','7')]}]);
    assert.deepEqual([r.total,r.ready,r.missing,r.invalid],[4,2,1,1]);
    assert.deepEqual(r.groups.map(x=>[x.ready,x.missing,x.invalid]),[[1,1,0],[1,0,1]]);
  });
  it('reports zero fields as zero rather than NaN or percentages',()=>{
    const r=check([]); assert.deepEqual([r.total,r.ready,r.missing,r.invalid],[0,0,0,0]);
  });
  it('rejects duplicate field identifiers to prevent double counting',()=>{
    assert.throws(()=>check([{key:'a',title:'A',fields:[field('same','4')]},{key:'b',title:'B',fields:[field('same','7')]}]),/Duplicate field key/);
  });
});

describe('CP64 three-module integration and accessibility',()=>{
  for(const module of ['orion','pulse','haven']) {
    it(`shows the data graph on ${module} overview, not admin or all routes`,()=>{
      const page=pages[module];
      assert.match(page,/import ModuleInputObservatory from/);
      assert.match(page,new RegExp(`view === "/${module}" && <ModuleInputObservatory`));
      // CP92 supersedes manual PULSE inputs with Firestore-linked evidence.
    assert.match(page,module==='pulse' ? /canSimulate=\{linked.ready > 0\} mode="linked"/ : /canSimulate=\{hasInputs\}/);
    });
  }
  it('does not claim academic readiness or probability from form completeness',()=>{
    assert.match(component,/không đo năng lực/);
    assert.match(component,/không phải kết quả của AI/);
    assert.match(component,/role="meter"/);
    assert.match(component,/aria-valuenow=\{data.ready\}/);
    assert.doesNotMatch(component,/readinessScore|overallScore|probability|riskLevel/);
  });
  it('shows missing versus invalid as two different states and does not leak field values',()=>{
    assert.match(component,/field.state === "invalid"/);
    assert.match(component,/field.state === "ready"/);
    assert.match(component,/className=\{`is-\$\{field.state\}`\}/);
    assert.doesNotMatch(component,/\{field.value\}/);
    assert.match(component,/role="status"/);
  });
  it('keeps user navigation inside SPA and respects unsaved draft guards',()=>{
    assert.match(component,/<a className="cla-input-observatory-primary" href=\{editHref\}/);
    assert.match(component,/<a href=\{resultHref\}>/);
    assert.doesNotMatch(component,/window\.location|navigate\(|location\.assign/);
  });
  it('configures proper input ranges for Orion, Pulse and Haven',()=>{
    assert.match(pages.orion,/min: 1, max: 104, integer: true/);
    assert.match(pages.orion,/Điểm hiện tại \(0–10\)/);
    const linked = readFileSync(new URL('../src/lib/pulseLinkedSourceModel.ts',import.meta.url),'utf8');
    assert.match(pages.pulse,/usePulseLinkedSources\(/);
    assert.match(linked,/atlasProgramCount/);
    assert.match(linked,/studyHoursPerWeek',168/);
    assert.match(linked,/planCompletionRate',100/);
    assert.match(pages.haven,/Điểm tiếng Anh.*max: 10/);
    assert.match(pages.haven,/max: 100/);
  });
  it('supports dark mode, mobile, print, reduced motion and accessible focus',()=>{
    assert.match(entry,/43-cla-input-observatory\.css/);
    assert.match(css,/:root\[data-theme="dark"\]/);
    assert.match(css,/@media\(max-width: 640px\)/);
    assert.match(css,/@media\(prefers-reduced-motion: reduce\)/);
    assert.match(css,/@media print/);
    assert.match(css, /:focus-visible/);
  });
});


describe('CP64 release evidence covers visual artifacts',()=>{
  it('fingerprints styles entrypoint and the new visual style, without duplicates',()=>{
    const require=createRequire(import.meta.url);
    const {trackedFiles}=require('../tools/cp31_release_fingerprint.cjs');
    const files=trackedFiles();
    assert.ok(files.includes('src/styles.css'));
    assert.ok(files.includes('src/styles/43-cla-input-observatory.css'));
    assert.ok(files.includes('src/styles/42-cla-guided-workspaces.css'));
    assert.equal(new Set(files).size,files.length);
  });
});
