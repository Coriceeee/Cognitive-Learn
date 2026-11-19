'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const dir=path.resolve(__dirname,'..');
const confirmed={fromCache:false,hasPendingWrites:false};
const cache={fromCache:true,hasPendingWrites:false};
const pending={fromCache:false,hasPendingWrites:true};
function harness(){
  let authCallback, stopEffect;
  const watchers=[];let state={};const auth={currentUser:null};
  const mocks={
    react:{useState:initial=>{state=initial;return [initial,next=>{state=next;}];},useEffect:fn=>{stopEffect=fn();}},
    'firebase/auth':{onAuthStateChanged:(_auth,fn)=>{authCallback=fn;return ()=>{};}},
    'firebase/firestore':{
      doc:(_db,collection,uid)=>`${collection}:${uid}`,
      onSnapshot:(ref,options,receive,fail)=>{
        const watcher={ref,options,receive,fail,closed:false};watchers.push(watcher);
        return ()=>{watcher.closed=true;};
      },
    },
    '../../../lib/firebase':{auth,db:{}},
    '../services/realtimeReadPolicy':{isServerConfirmedSnapshot:metadata=>!metadata.fromCache&&!metadata.hasPendingWrites},
    '../services/academicGpaIntegrity':{
      auditAcademicGpa:(uid,profile,transcript)=>{
        const status=!profile||!transcript?'INCOMPLETE':
          profile.userId!==uid||transcript.userId!==uid?'MISMATCH':'VERIFIED';
        return {status,reason:'fixture',derived:null};
      },
    },
  };
  const filename=path.join(dir,'src/page/seed/hooks/useAcademicGpaIntegrity.ts');
  const output=ts.transpileModule(fs.readFileSync(filename,'utf8'),{fileName:filename,
    compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
  const mod={exports:{}};
  new Function('module','exports','require',output)(mod,mod.exports,name=>{
    if(name in mocks)return mocks[name];throw Error(`Unexpected module ${name}`);
  });
  mod.exports.useAcademicGpaIntegrity();
  return {
    change:uid=>{auth.currentUser=uid?{uid}:null;authCallback(auth.currentUser);},
    watcher:(kind,uid)=>watchers.filter(w=>w.ref===`${kind}:${uid}`).at(-1),
    emit:(w,value,metadata=confirmed)=>w.receive({metadata,exists:()=>value!==null,data:()=>value}),
    fail:w=>w.fail({code:'permission-denied'}),
    current:()=>state,watchers,close:()=>stopEffect(),
  };
}
const p=(uid)=>({userId:uid,dataScope:'student'});
test('GPAR01 never verifies GPA from just one document',()=>{
  const h=harness();h.change('A');h.emit(h.watcher('learning_profiles','A'),p('A'));
  assert.equal(h.current().status,'loading');h.close();
});
test('GPAR02 verifies only when both server-confirmed snapshots arrive',()=>{
  const h=harness();h.change('A');h.emit(h.watcher('learning_profiles','A'),p('A'));
  h.emit(h.watcher('student_transcripts','A'),p('A'));
  assert.equal(h.current().status,'VERIFIED');h.close();
});
test('GPAR03 cache snapshot removes previously verified evidence immediately',()=>{
  const h=harness();h.change('A');const a=h.watcher('learning_profiles','A'),b=h.watcher('student_transcripts','A');
  h.emit(a,p('A'));h.emit(b,p('A'));assert.equal(h.current().status,'VERIFIED');
  h.emit(a,p('A'),cache);assert.equal(h.current().status,'syncing');assert.equal(h.current().result,null);h.close();
});
test('GPAR04 pending write snapshot cannot be claimed as verified',()=>{
  const h=harness();h.change('A');const a=h.watcher('learning_profiles','A'),b=h.watcher('student_transcripts','A');
  h.emit(a,p('A'));h.emit(b,p('A'),pending);assert.equal(h.current().status,'syncing');h.close();
});
test('GPAR05 stale A watcher cannot affect A→B→A account switch',()=>{
  const h=harness();h.change('A');const oldA=h.watcher('learning_profiles','A');
  h.change('B');const oldB=h.watcher('student_transcripts','B');
  h.change('A');h.emit(h.watcher('learning_profiles','A'),p('A'));
  h.emit(h.watcher('student_transcripts','A'),p('A'));
  h.emit(oldA,p('B'));h.emit(oldB,p('B'));
  assert.equal(oldA.closed,true);assert.equal(oldB.closed,true);
  assert.equal(h.current().status,'VERIFIED');h.close();
});
test('GPAR06 wrong-owner record is rejected by the GPA auditor',()=>{
  const h=harness();h.change('A');h.emit(h.watcher('learning_profiles','A'),p('A'));
  h.emit(h.watcher('student_transcripts','A'),p('B'));
  assert.equal(h.current().status,'MISMATCH');h.close();
});
test('GPAR07 Firestore permissions failure clears verified summary',()=>{
  const h=harness();h.change('A');h.emit(h.watcher('learning_profiles','A'),p('A'));
  const b=h.watcher('student_transcripts','A');h.emit(b,p('A'));
  h.fail(b);assert.equal(h.current().status,'error');assert.equal(h.current().result,null);h.close();
});
test('GPAR08 missing transcript yields INCOMPLETE rather than zero GPA',()=>{
  const h=harness();h.change('A');h.emit(h.watcher('learning_profiles','A'),p('A'));
  h.emit(h.watcher('student_transcripts','A'),null);
  assert.equal(h.current().status,'INCOMPLETE');h.close();
});
test('GPAR09 logout closes watchers and clears verified values',()=>{
  const h=harness();h.change('A');const a=h.watcher('learning_profiles','A'),b=h.watcher('student_transcripts','A');
  h.emit(a,p('A'));h.emit(b,p('A'));h.change(null);
  assert.equal(a.closed,true);assert.equal(b.closed,true);
  assert.equal(h.current().status,'signed-out');assert.equal(h.current().result,null);h.close();
});
test('GPAR10 recovered cache requires both fresh server payloads again',()=>{
  const h=harness();h.change('A');const a=h.watcher('learning_profiles','A'),b=h.watcher('student_transcripts','A');
  h.emit(a,p('A'));h.emit(b,p('A'));h.emit(b,p('A'),cache);
  h.emit(b,p('A'));assert.equal(h.current().status,'syncing');
  h.emit(a,p('A'));assert.equal(h.current().status,'VERIFIED');h.close();
});
