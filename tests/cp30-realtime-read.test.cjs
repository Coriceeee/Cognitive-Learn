'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');

function loadPolicy() {
  const source = fs.readFileSync(path.join(root,'src/page/seed/services/realtimeReadPolicy.ts'),'utf8');
  const output = ts.transpileModule(source, {compilerOptions:{module: ts.ModuleKind.CommonJS, target:ts.ScriptTarget.ES2022}}).outputText;
  const module = {exports:{}};
  new Function('module','exports', output)(module,module.exports);
  return module.exports;
}
const policy = loadPolicy();
const confirmed = {fromCache:false,hasPendingWrites:false};
const cache = {fromCache:true,hasPendingWrites:false};
const pending = {fromCache:false,hasPendingWrites:true};
const uidA = 'Student_A_001', uidB = 'Student_B_002';

test('CP30-R01 only server-confirmed, committed snapshots pass', () => {
  assert.equal(policy.isServerConfirmedSnapshot(confirmed),true);
  for (const v of [null,undefined,{},cache,pending,{fromCache:'false',hasPendingWrites:false}]) {
    assert.equal(policy.isServerConfirmedSnapshot(v),false);
  }
});
test('CP30-R02 cross-owner and malformed documents fail closed', () => {
  assert.equal(policy.isMatchingAccountRecord({userId:uidA,dataScope:'student'},uidA),true);
  assert.equal(policy.isMatchingAccountRecord({userId:uidB},uidA),false);
  assert.equal(policy.isMatchingAccountRecord({dataScope:'production'},uidA),false);
  assert.equal(policy.isMatchingAccountRecord(null,uidA),false);
});
test('CP30-R03 verified legacy docs with no userId remain readable in own UID-scoped path', () => {
  assert.equal(policy.isMatchingAccountRecord({transcript:{}},uidA),true);
  assert.equal(policy.isMatchingAccountRecord({userId:uidA,dataScope:'demo'},uidA),true);
});
test('CP30-R04 account inspections reject old generation and account switches', () => {
  assert.equal(policy.isCurrentAccountInspection(uidA,uidA,3,3),true);
  assert.equal(policy.isCurrentAccountInspection(uidA,uidA,3,4),false);
  assert.equal(policy.isCurrentAccountInspection(uidA,uidB,3,3),false);
  assert.equal(policy.isCurrentAccountInspection(uidA,null,3,3),false);
});

function harness() {
  let authChanged;
  let cleanup;
  let index=0;
  const values=[];
  const watchers=[];
  const auth={currentUser:null};
  const useState=v=>{
    const i=index++;
    values[i]=v;
    return [v,n=>{values[i]=typeof n==='function'?n(values[i]):n;}];
  };
  const mocks={
    '../../../lib/studentDecisionSnapshot': {studentDecisionLedger:{observe:()=>true}},
    react:{useState,useEffect:fn=>{cleanup=fn();}},
    'firebase/auth':{onAuthStateChanged:(_auth,callback)=>{
      authChanged=u=>{auth.currentUser=u;callback(u);};return ()=>{};
    }},
    'firebase/firestore':{
      doc:(_db,col,uid)=>`${col}:${uid}`,
      onSnapshot:(ref,options,callback,error)=>{
        const watcher={ref,options,callback,error,unsubscribed:false};
        watchers.push(watcher);
        return ()=>{watcher.unsubscribed=true;};
      },
    },
    '../../../lib/firebase':{auth,db:{}},
    '../services/transcriptData':{buildTranscriptView:raw=>({terms:[{subjects:[{provisional:raw.score??null}]}],marker:raw.marker})},
    '../services/realtimeReadPolicy':policy,
    '../services/legacyTranscriptPolicy':{assessLegacyTranscript:()=>({readable:true})},
  };
  const filename = path.join(root,'src/page/seed/hooks/useStudentTranscript.ts');
  const output=ts.transpileModule(fs.readFileSync(filename,'utf8'),{fileName:filename,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const module={exports:{}};
  new Function('module','exports','require',output)(module,module.exports,name=>{
    if (name in mocks) return mocks[name];
    throw Error('unexpected dependency '+name);
  });
  module.exports.useStudentTranscript();
  return {
    values, watchers, authChanged:uid=>authChanged(uid?{uid}:null),
    latest:ref=>watchers.filter(w=>w.ref===ref).at(-1),
    emit:(w,raw,metadata=confirmed)=>w.callback({metadata,exists:()=>raw!==null,data:()=>raw}),
    cleanup:()=>cleanup(),
  };
}
test('CP30-R05 cache-only and pending writes never render as verified transcript',()=>{
  const h=harness();h.authChanged(uidA);
  const w=h.latest('student_transcripts:'+uidA);
  assert.equal(w.options.includeMetadataChanges,true);
  h.emit(w,{userId:uidA,marker:'cached',score:9},cache);
  assert.equal(h.values[0],null);assert.equal(h.values[1],'syncing');
  h.emit(w,{userId:uidA,marker:'pending',score:10},pending);
  assert.equal(h.values[0],null);
  h.emit(w,{userId:uidA,marker:'server',score:8});
  assert.equal(h.values[0].marker,'server');assert.equal(h.values[1],'ready');
  h.emit(w,{userId:uidA,marker:'offline',score:7},cache);
  assert.equal(h.values[0],null);assert.equal(h.values[1],'syncing');
  h.cleanup();
});
test('CP30-R06 A to B to A cannot resurrect callback from first A session',()=>{
  const h=harness();h.authChanged(uidA);
  const oldA=h.latest('student_transcripts:'+uidA);
  h.authChanged(uidB);
  const b=h.latest('student_transcripts:'+uidB);
  h.authChanged(uidA);
  const newA=h.latest('student_transcripts:'+uidA);
  h.emit(newA,{userId:uidA,marker:'A-new',score:9});
  h.emit(oldA,{userId:uidA,marker:'A-old',score:1});
  h.emit(b,{userId:uidB,marker:'B-old',score:1});
  assert.equal(h.values[0].marker,'A-new');
  assert.equal(h.values[4],uidA);
  h.cleanup();
});
test('CP30-R07 legacy fallback is server-confirmed and cannot overwrite a newer primary transcript',()=>{
  const h=harness();h.authChanged(uidA);
  const primary=h.latest('student_transcripts:'+uidA);
  h.emit(primary,null);
  const legacy=h.latest('learning_profiles:'+uidA);
  assert.ok(legacy);
  h.emit(legacy,{userId:uidA,transcript:{},marker:'legacy-cache',score:5},cache);
  assert.equal(h.values[0],null);
  h.emit(legacy,{userId:uidA,transcript:{},marker:'legacy-server',score:6});
  assert.equal(h.values[0].marker,'legacy-server');
  h.emit(primary,{userId:uidA,marker:'new-primary',score:10});
  h.emit(legacy,{userId:uidA,transcript:{},marker:'late-legacy',score:2});
  assert.equal(h.values[0].marker,'new-primary');
  h.cleanup();
});
test('CP30-R08 conflicting document UID clears data and reports error',()=>{
  const h=harness();h.authChanged(uidA);
  const w=h.latest('student_transcripts:'+uidA);
  h.emit(w,{userId:uidA,marker:'good',score:9});
  h.emit(w,{userId:uidB,marker:'cross-account',score:2});
  assert.equal(h.values[0],null);assert.equal(h.values[1],'error');
  assert.match(h.values[2],/không khớp tài khoản/);
  h.cleanup();
});
test('CP30-R09 signed out session clears verified results immediately',()=>{
  const h=harness();h.authChanged(uidA);
  h.emit(h.latest('student_transcripts:'+uidA),{userId:uidA,marker:'A',score:9});
  h.authChanged(null);
  assert.equal(h.values[0],null);assert.equal(h.values[1],'signed-out');
  assert.equal(h.values[4],null);h.cleanup();
});
test('CP30-R10 storage status guard resets rows and rejects stale async results',()=>{
  const ui=fs.readFileSync(path.join(root,'src/page/seed/StudentStorageStatusPage.tsx'),'utf8');
  assert.match(ui,/\+\+generation\.current/);
  assert.match(ui,/setRows\(sources\.map\(/);
  assert.match(ui,/isCurrentAccountInspection/);
  assert.match(ui,/if \(!isCurrent\(\)\) return;/);
  assert.match(ui,/auth\.currentUser\?\.uid/);
});
