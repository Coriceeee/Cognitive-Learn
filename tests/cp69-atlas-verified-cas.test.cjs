'use strict';
// CP69: deterministic callback/transaction replay. No Firebase Emulator claims.
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const ROOT = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT,rel),'utf8');
const transpile = (rel,mocks) => {
  const out = ts.transpileModule(read(rel), {fileName:rel,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const mod={exports:{}};
  new Function('module','exports','require','window',out)(mod,mod.exports,name=>{
    if (!Object.prototype.hasOwnProperty.call(mocks,name)) throw Error(`Missing mock: ${name}`);
    return mocks[name];
  }, mocks.window??{});
  return mod.exports;
};
const draft = transpile('src/lib/draftRevision.ts', {});
const atlas = transpile('src/lib/atlasWorkspaceRevision.ts', {'./draftRevision':draft});
const confirmed = {fromCache:false,hasPendingWrites:false};
const cache = {fromCache:true,hasPendingWrites:false};
const pending = {fromCache:false,hasPendingWrites:true};
const uidA='student_cp69_a',uidB='student_cp69_b';
const payload = {universities:[],sources:[],programs:[]};

function harness(legacyRecord=null) {
  let hookIndex = 0;
  const hooks = [];
  const effects = [];
  const auth = {currentUser:null};
  const watchers=[];
  const dbState=new Map();
  let authCallback;
  const win={localStorage:{getItem:()=>legacyRecord ? JSON.stringify(legacyRecord) : null}};
  const useState=initial=>{const i=hookIndex++;if(!(i in hooks))hooks[i]=initial;
    return [hooks[i],value=>{hooks[i]=typeof value==='function'?value(hooks[i]):value;}];};
  const useRef=initial=>{const i=hookIndex++; if(!(i in hooks))hooks[i]={current:initial};return hooks[i];};
  const useMemo=fn=>{hookIndex++;return fn();};
  const useEffect=fn=>{const i=hookIndex++;if(!(i in hooks)){hooks[i]=true;effects.push(fn());}};
  const firestore = {
    doc:(_db,col,owner)=>`${col}:${owner}`,
    onSnapshot:(ref,options,onData,onError)=>{const w={ref,options,onData,onError,closed:false};watchers.push(w);
      return ()=>{w.closed=true;};},
    serverTimestamp:()=>({seconds:1,nanoseconds:1}),
    runTransaction:async (_db, callback)=>{
      const staged=[];
      const transaction={get:async ref=>({exists:()=>dbState.has(ref),data:()=>dbState.get(ref)}),
        set:(ref,value)=>staged.push([ref,value])};
      const result=await callback(transaction);
      for(const [ref,value] of staged)dbState.set(ref,value);
      return result;
    },
  };
  const mocks = {
    window:win,
    react:{useState,useRef,useMemo,useEffect},
    'firebase/auth':{onAuthStateChanged:(_auth,callback)=>{authCallback=callback;return()=>{};}},
    'firebase/firestore':firestore,
    '../../../lib/firebase':{auth,db:{}},
    '../../../lib/geminiAdmissionClient':{},
    '../../../lib/atlasKnowledgeBase':{getAtlasStats:()=>({})},
    '../../seed/services/realtimeReadPolicy':{
      isMatchingAccountRecord:(raw,owner)=>raw && (!raw.userId || raw.userId===owner),
      isServerConfirmedSnapshot:m=>m?.fromCache===false && m?.hasPendingWrites===false,
    },
    '../../../lib/atlasWorkspaceRevision':atlas,
    '../../../lib/draftRevision':draft,
  };
  const hook=transpile('src/page/atlas/hooks/useAtlasKnowledge.ts',mocks).useAtlasKnowledge;
  const render=()=>{hookIndex=0;return hook();};
  const authAs=uid=>{auth.currentUser=uid?{uid}:null;authCallback(auth.currentUser);};
  const emit=(watcher,raw,metadata=confirmed)=>{
    if(raw===null)dbState.delete(watcher.ref); else dbState.set(watcher.ref,raw);
    watcher.onData({exists:()=>raw!==null,data:()=>raw,metadata});
  };
  const latest=uid=>watchers.filter(w=>w.ref===`atlas_workspaces:${uid}`).at(-1);
  return {render,authAs,emit,latest,watchers,dbState,auth,effects};
}

test('CP69.1: Atlas workspace canonical signature ignores object key order',()=>{
  const a={userId:uidA,revision:3,universities:[{id:'u',a:1,b:2}],sources:[],programs:[],updatedAt:{seconds:1,nanoseconds:1}};
  const b={...a,universities:[{b:2,a:1,id:'u'}],updatedAt:{seconds:2,nanoseconds:2}};
  assert.doesNotThrow(()=>draft.assertDraftUnchanged(atlas.atlasWorkspaceVersion(a),atlas.atlasWorkspaceVersion(b)));
});
test('CP69.2: newer revision or same revision modified payload prevents overwrite',()=>{
  const a={userId:uidA,revision:3,...payload};
  const expected=atlas.atlasWorkspaceVersion(a);
  assert.throws(()=>draft.assertDraftUnchanged(expected,atlas.atlasWorkspaceVersion({...a,revision:4})),draft.DraftConflictError);
  assert.throws(()=>draft.assertDraftUnchanged(expected,atlas.atlasWorkspaceVersion({...a,universities:[{id:'other'}]})),draft.DraftConflictError);
});
test('CP69.3: legacy version-less Atlas can migrate exactly once',()=>{
  const old={userId:uidA,...payload,updatedAt:{seconds:2,nanoseconds:0}};
  assert.equal(atlas.atlasWorkspaceVersion(old).revision,0);
  assert.doesNotThrow(()=>draft.assertDraftUnchanged(atlas.atlasWorkspaceVersion(old),atlas.atlasWorkspaceVersion({...old})));
  assert.throws(()=>draft.assertDraftUnchanged(atlas.atlasWorkspaceVersion(old),atlas.atlasWorkspaceVersion({...old,universities:[{id:'remote'}]})),draft.DraftConflictError);
});
test('CP69.4: cached Atlas snapshot does not become ready or create trusted baseline',()=>{
  const h=harness();h.render();h.authAs(uidA);const w=h.latest(uidA);
  h.emit(w,{userId:uidA,revision:3,...payload},cache);
  assert.equal(h.render().storageStatus,'syncing');
  h.emit(w,{userId:uidA,revision:3,...payload},confirmed);
  assert.equal(h.render().storageStatus,'ready');
  h.emit(w,{userId:uidA,revision:4,...payload},pending);
  assert.equal(h.render().storageStatus,'syncing');
  h.effects.forEach(x=>x?.());
});
test('CP69.5: wrong-owner document fails closed; stale callback after account change ignored',()=>{
  const h=harness();h.render();h.authAs(uidA);const old=h.latest(uidA);
  h.emit(old,{userId:uidB,revision:1,...payload});
  assert.equal(h.render().storageStatus,'error');
  h.authAs(uidB);assert.equal(old.closed,true);
  h.emit(old,{userId:uidA,revision:7,...payload});
  assert.equal(h.render().storageStatus,'loading');
  h.effects.forEach(x=>x?.());
});
test('CP69.6: first write uses transaction and revision=1, remote update causes conflict',async()=>{
  const h=harness();h.render();h.authAs(uidA);const w=h.latest(uidA);h.emit(w,null);
  assert.equal(h.render().storageStatus,'ready');
  await h.render().clearAtlasData();
  assert.equal(h.dbState.get(`atlas_workspaces:${uidA}`).revision,1);
  h.emit(w,{userId:uidA,revision:1,...payload});
  h.dbState.set(`atlas_workspaces:${uidA}`,{userId:uidA,revision:2,...payload});
  await assert.rejects(h.render().clearAtlasData(),draft.DraftConflictError);
  h.effects.forEach(x=>x?.());
});
test('CP69.7: unscoped or another-user browser storage cannot be imported',()=>{
  for(const record of [{...payload},{userId:uidB,...payload}]){
    const h=harness({...record,universities:[{id:'u'}]});h.render();h.authAs(uidA);
    assert.equal(h.render().legacyAvailable,false);
    h.effects.forEach(x=>x?.());
  }
});
test('CP69.7b: explicitly owned browser storage is available only to that UID',()=>{
  const h=harness({userId:uidA,...payload,universities:[{id:'owned'}]});
  h.render();h.authAs(uidA);
  assert.equal(h.render().legacyAvailable,true);
  h.authAs(uidB);
  assert.equal(h.render().legacyAvailable,false);
  h.effects.forEach(x=>x?.());
});
test('CP69.8: Atlas Rules in both candidate versions require monotonic revision and owner',()=>{
  for(const f of ['firestore.rules.CANDIDATE','firestore.rules.CANDIDATE_CP21']){
    const rules=read(f);
    assert.match(rules,/function validAtlasWorkspace\(\)/);
    assert.match(rules,/data\.revision is int && data\.revision >= 1/);
    assert.match(rules,/match \/atlas_workspaces\/\{uid\} \{[\s\S]*allow get: if selfAcademicOwner\(uid\)/);
    assert.match(rules,/allow create: if ownerRecord\(uid\) && validAtlasWorkspace\(\)/);
    assert.match(rules,/request\.resource\.data\.revision == resource\.data\.get\('revision', 0\) \+ 1/);
  }
});
test('CP69.9 + CP73: production remains unchanged; emulator connects only after QA safety gate',()=>{
  const s=read('src/lib/firebase.ts');
  const guard=read('src/lib/localFirebaseEmulators.ts');
  assert.match(s,/resolveLocalFirebaseEmulators\(/);
  assert.ok(s.indexOf('resolveLocalFirebaseEmulators(') < s.indexOf('initializeApp('));
  assert.match(s,/if \(emulator\) \{[\s\S]*connectAuthEmulator\(auth,[\s\S]*connectFirestoreEmulator\(db,/);
  assert.match(guard,/input\.mode !== 'development'/);
  assert.match(guard,/input\.protocol !== 'http:'/);
  assert.match(guard,/QA_PROJECT = 'demo-cla-mvp'/);
  assert.match(guard,/QA_KEY = 'fake-api-key'/);
});
