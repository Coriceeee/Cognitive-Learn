'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const confirmed = {fromCache:false,hasPendingWrites:false};
const cached = {fromCache:true,hasPendingWrites:false};

function harness() {
  let authChanged, cleanup;
  let hookIndex = 0;
  const state = [];
  const watchers = [];
  const auth = {currentUser:null};
  const policy = {isServerConfirmedSnapshot:m => m?.fromCache === false && m?.hasPendingWrites === false,
    isMatchingAccountRecord:(v,uid)=>v && (v.userId === undefined || v.userId === uid)};
  const mocks = {
    '../../../lib/studentDecisionSnapshot': {studentDecisionLedger:{observe:()=>true}},
    react:{useState:initial=>{const i=hookIndex++;state[i]=initial;return [initial,next=>{state[i]=typeof next==='function'?next(state[i]):next;}];},useEffect:fn=>{cleanup=fn();}},
    'firebase/auth':{onAuthStateChanged:(_auth,cb)=>{authChanged=user=>{auth.currentUser=user;cb(user);};return ()=>{};}},
    'firebase/firestore':{doc:(_db,c,uid)=>`${c}:${uid}`,
      onSnapshot:(ref,options,cb,error)=>{const w={ref,options,cb,error,closed:false};watchers.push(w);return ()=>{w.closed=true;};}},
    '../../../lib/firebase':{auth,db:{}},
    '../services/transcriptData':{buildTranscriptView:raw=>({terms:[{subjects:[{provisional:raw.score??null}]}],marker:raw.marker})},
    '../services/realtimeReadPolicy':policy,
    '../services/legacyTranscriptPolicy':{
      assessLegacyTranscript:()=>({readable:true}),
      assessCanonicalTranscript:()=>({readable:true}),
    },
  };
  const filename=path.join(root,'src/page/seed/hooks/useStudentTranscript.ts');
  const js=ts.transpileModule(fs.readFileSync(filename,'utf8'),{fileName:filename,
    compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const mod={exports:{}};
  new Function('module','exports','require',js)(mod,mod.exports,name=>{
    if (!(name in mocks)) throw new Error(`Unknown import ${name}`);return mocks[name];
  });
  mod.exports.useStudentTranscript();
  return {state,watchers,
    auth:uid=>authChanged(uid?{uid}:null),
    latest:ref=>watchers.filter(w=>w.ref===ref).at(-1),
    count:ref=>watchers.filter(w=>w.ref===ref).length,
    emit:(watcher,record,metadata=confirmed)=>watcher.cb({metadata,exists:()=>record!==null,data:()=>record}),
    close:()=>cleanup()};
}
const uid='Student_A_001';
const primary=`student_transcripts:${uid}`;
const legacy=`learning_profiles:${uid}`;
const record=(marker,score)=>({userId:uid,transcript:{},marker,score});

test('CP60.1 repeated confirmed missing primary does not reopen legacy listener',()=>{
  const h=harness();h.auth(uid);const p=h.latest(primary);
  h.emit(p,null);const l=h.latest(legacy);
  assert.ok(l);h.emit(p,null);h.emit(p,null);
  assert.equal(h.count(legacy),1);assert.equal(l.closed,false);h.close();
});
test('CP60.2 verified fallback remains visible across primary metadata changes',()=>{
  const h=harness();h.auth(uid);const p=h.latest(primary);
  h.emit(p,null);const l=h.latest(legacy);h.emit(l,record('legacy',8));
  assert.equal(h.state[0].marker,'legacy');assert.equal(h.state[1],'ready');
  h.emit(p,null);assert.equal(h.state[0].marker,'legacy');assert.equal(h.state[1],'ready');h.close();
});
test('CP60.3 canonical document supersedes legacy and rejects late fallback callbacks',()=>{
  const h=harness();h.auth(uid);const p=h.latest(primary);
  h.emit(p,null);const l=h.latest(legacy);h.emit(l,record('legacy',7));
  h.emit(p,{userId:uid,marker:'canonical',score:9});
  assert.equal(l.closed,true);h.emit(l,record('late',5));
  assert.equal(h.state[0].marker,'canonical');assert.equal(h.state[1],'ready');h.close();
});
test('CP60.4 unverified primary invalidates fallback; next verified absence starts fresh listener',()=>{
  const h=harness();h.auth(uid);const p=h.latest(primary);
  h.emit(p,null);const l=h.latest(legacy);h.emit(l,record('before',8));
  h.emit(p,null,cached);assert.equal(l.closed,true);
  assert.equal(h.state[0],null);assert.equal(h.state[1],'syncing');
  h.emit(p,null);const l2=h.latest(legacy);assert.notEqual(l,l2);
  h.emit(l,record('stale',4));assert.equal(h.state[0],null);
  h.emit(l2,record('fresh',9));assert.equal(h.state[0].marker,'fresh');h.close();
});
