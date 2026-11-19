'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const uidA = 'Student_A_001', uidB = 'Student_B_002';
const confirmed = {fromCache:false,hasPendingWrites:false};
const cache = {fromCache:true,hasPendingWrites:false};
const pending = {fromCache:false,hasPendingWrites:true};
const policyFile=path.join(root,'src/page/seed/services/realtimeReadPolicy.ts');
const policyOutput=ts.transpileModule(fs.readFileSync(policyFile,'utf8'),{
  fileName:policyFile,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}
}).outputText;
const policyModule={exports:{}};
new Function('module','exports',policyOutput)(policyModule,policyModule.exports);
const policy=policyModule.exports;

function loadPure(rel, dependencies={}) {
  const filename=path.join(root,rel);
  const output=ts.transpileModule(fs.readFileSync(filename,'utf8'),{fileName:filename,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const mod={exports:{}};
  new Function('module','exports','require',output)(mod,mod.exports,name=>{if(name in dependencies)return dependencies[name];throw Error(`Unexpected pure dependency: ${name}`);});
  return mod.exports;
}
const dynamic=loadPure('src/lib/dynamicStudentState.ts');
const temporal=loadPure('src/lib/temporalStudentIntelligence.ts',{'./dynamicStudentState.ts':dynamic});
function harness() {
  let idx = 0, authCallback, cleanup;
  const values = [], watchers = [], requests = [];
  const auth = {currentUser:null};
  const useState = initial => {
    const current = idx++;
    values[current] = initial;
    return [initial, next => { values[current] = typeof next === 'function' ? next(values[current]) : next; }];
  };
  const mocks = {
    react:{useState, useEffect:fn=>{cleanup=fn();}},
    'firebase/auth':{onAuthStateChanged:(_auth, cb)=>{authCallback=cb; return ()=>{};}},
    'firebase/firestore':{
      doc:(_db,col,uid)=>`${col}:${uid}`,
      onSnapshot:(ref,options,onData,onError)=>{
        const entry={ref,options,onData,onError,closed:false};
        watchers.push(entry);
        return ()=>{entry.closed=true;};
      },
    },
    '../../../lib/firebase':{auth,db:{}},
    '../../../engines/cognitive/cognitiveEngine':{
      calculateCognitive:profile=>({overallScore:profile.gpa10,scoreAvailable:false,dimensions:[],nextActions:[]}),
    },
    '../../../engines/history/cognitiveHistoryRepository':{
      getVerifiedCognitiveHistory:uid=>new Promise((resolve,reject)=>requests.push({uid,resolve,reject})),
    },
    '../../../engines/history/cognitiveHistoryEngine':{createSnapshotFromResult:(_a,p)=>({from:p.fullName})},
    '../../../engines/history/cognitiveGrowthAnalytics':{
      analyzeCognitiveGrowth:(current,previous)=>({current,previous}),
    },
    '../services/realtimeReadPolicy':policy,
    '../../../lib/dynamicStudentState':dynamic,
    '../../../lib/temporalStudentIntelligence':temporal,
    '../types':{
      defaultStudentProfile:{fullName:'Chưa có dữ liệu',className:'--',targetMajor:'--',targetUniversity:'--',gpa10:0,gpa11:0,gpa12:0,gpaOverall:0,studyHoursPerWeek:0,practiceTestsPerWeek:0,planCompletionRate:0,motivationLevel:0},
      defaultCognitiveResult:{scoreAvailable:false,dimensions:[],overallScore:0,nextActions:[]},
    },
  };
  const oldWindow = global.window;
  global.window = {location:{search:''}};
  const filename=path.join(root,'src/page/seed/hooks/useStudentProfile.ts');
  const output=ts.transpileModule(fs.readFileSync(filename,'utf8'),{fileName:filename,
    compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const mod={exports:{}};
  new Function('module','exports','require',output)(mod,mod.exports,name=>{
    if (name in mocks) return mocks[name];
    throw Error(`Unexpected dependency: ${name}`);
  });
  mod.exports.useStudentProfile();
  return {
    authChanged:uid=>{auth.currentUser=uid?{uid}:null;authCallback(auth.currentUser);},
    latest:uid=>watchers.filter(w=>w.ref===`learning_profiles:${uid}`).at(-1),
    watchers,requests,values,
    emit:(w,data,meta=confirmed)=>w.onData({metadata:meta,exists:()=>data!==null,data:()=>data}),
    fail:(w,code='permission-denied')=>w.onError({code}),
    close:()=>{cleanup();global.window=oldWindow;},
  };
}
const flush=()=>new Promise(resolve=>setImmediate(resolve));
const profile=(uid,name,score=8)=>({userId:uid,dataScope:'student',profile:{fullName:name},gpaSummary:{gpa10:score},
  cognitiveMeasurement:{mappingVersion:'cla-cognitive-proxy-v2',dimensions:[],scoreAvailable:true,overallScore:score}});

// Hook state: [profile, cognitive, growthAnalytics, loading, hasProfile, error, syncing, historyLoading].
test('CP30-P01 profile opens a realtime subscription with metadata events',()=>{
  const h=harness();h.authChanged(uidA);const w=h.latest(uidA);
  assert.ok(w);assert.equal(w.options.includeMetadataChanges,true);
  assert.equal(h.values[3],true);h.close();
});
test('CP30-P02 cache and pending writes cannot become verified student data',()=>{
  const h=harness();h.authChanged(uidA);const w=h.latest(uidA);
  h.emit(w,profile(uidA,'Offline'),cache);
  assert.equal(h.values[4],false);assert.equal(h.values[6],true);assert.equal(h.requests.length,0);
  h.emit(w,profile(uidA,'Pending'),pending);
  assert.equal(h.values[4],false);assert.equal(h.requests.length,0);h.close();
});
test('CP30-P03 verified profile is rendered, but Growth waits for server history',async()=>{
  const h=harness();h.authChanged(uidA);h.emit(h.latest(uidA),profile(uidA,'First'));
  assert.equal(h.values[0].fullName,'First');assert.equal(h.values[4],true);
  assert.equal(h.values[7],true);assert.equal(h.values[2],null);
  assert.equal(h.requests[0].uid,uidA);
  h.requests[0].resolve([{scoreAvailable:true,id:'new'},{scoreAvailable:true,id:'old'}]);await flush();
  assert.equal(h.values[2].current.id,'new');assert.equal(h.values[2].previous.id,'old');
  assert.equal(h.values[7],false);h.close();
});
test('CP30-P04 revised same-user profile cannot be overwritten by stale history',async()=>{
  const h=harness();h.authChanged(uidA);const w=h.latest(uidA);
  h.emit(w,profile(uidA,'old',5));h.emit(w,profile(uidA,'new',9));
  assert.equal(h.requests.length,2);
  h.requests[1].resolve([{scoreAvailable:true,id:'current'}]);await flush();
  h.requests[0].resolve([{scoreAvailable:true,id:'stale'}]);await flush();
  assert.equal(h.values[0].fullName,'new');assert.equal(h.values[2].current.id,'current');h.close();
});
test('CP30-P05 A to B to A blocks stale profile callbacks from original A session',()=>{
  const h=harness();h.authChanged(uidA);const a1=h.latest(uidA);
  h.authChanged(uidB);const b=h.latest(uidB);
  h.authChanged(uidA);const a2=h.latest(uidA);
  h.emit(a2,profile(uidA,'A-new'));
  h.emit(a1,profile(uidA,'A-old'));h.emit(b,profile(uidB,'B-old'));
  assert.equal(a1.closed,true);assert.equal(b.closed,true);
  assert.equal(h.values[0].fullName,'A-new');h.close();
});
test('CP30-P06 previously verified profile is hidden immediately when snapshot becomes cached',()=>{
  const h=harness();h.authChanged(uidA);const w=h.latest(uidA);
  h.emit(w,profile(uidA,'Verified'));
  h.emit(w,profile(uidA,'Cached'),cache);
  assert.equal(h.values[0].fullName,'Chưa có dữ liệu');assert.equal(h.values[4],false);
  assert.equal(h.values[6],true);assert.equal(h.values[2],null);h.close();
});
test('CP30-P07 cross-owner profile fails closed and clears previous values',()=>{
  const h=harness();h.authChanged(uidA);const w=h.latest(uidA);
  h.emit(w,profile(uidA,'Owned'));h.emit(w,profile(uidB,'Foreign'));
  assert.equal(h.values[4],false);assert.match(h.values[5],/không khớp tài khoản/);
  h.emit(w,{...profile(uidA,'Wrong scope'),dataScope:'production'});
  assert.equal(h.values[4],false);assert.equal(h.values[0].fullName,'Chưa có dữ liệu');
  h.close();
});
test('CP30-P08 signed out resets history/profile and invalidates pending results',async()=>{
  const h=harness();h.authChanged(uidA);h.emit(h.latest(uidA),profile(uidA,'Owned'));
  const request=h.requests[0];h.authChanged(null);
  request.resolve([{scoreAvailable:true,id:'late'}]);await flush();
  assert.equal(h.values[4],false);assert.equal(h.values[0].fullName,'Chưa có dữ liệu');
  assert.equal(h.values[2],null);assert.equal(h.values[7],false);h.close();
});
test('CP30-P09 server history unavailable preserves verified profile but discloses limitation',async()=>{
  const h=harness();h.authChanged(uidA);h.emit(h.latest(uidA),profile(uidA,'Verified'));
  h.requests[0].reject(new Error('offline'));await flush();
  assert.equal(h.values[0].fullName,'Verified');assert.equal(h.values[4],true);
  assert.match(h.values[5],/lịch sử Cognitive/);assert.equal(h.values[7],false);h.close();
});
test('CP30-P10 absent verified profile is empty but cache-only absence is not',()=>{
  const h=harness();h.authChanged(uidA);const w=h.latest(uidA);
  h.emit(w,null,cache);assert.equal(h.values[6],true);
  h.emit(w,null,confirmed);assert.equal(h.values[6],false);
  assert.equal(h.values[4],false);assert.equal(h.values[3],false);h.close();
});
test('CP30-P11 Firestore permission errors remove all personally identifiable display values',()=>{
  const h=harness();h.authChanged(uidA);const w=h.latest(uidA);
  h.emit(w,profile(uidA,'Private'));h.fail(w);
  assert.equal(h.values[4],false);assert.equal(h.values[2],null);
  assert.match(h.values[5],/Không có quyền/);h.close();
});
test('CP30-P12 server history uses getDocsFromServer rather than an offline cache',()=>{
  const repo=fs.readFileSync(path.join(root,'src/engines/history/cognitiveHistoryRepository.ts'),'utf8');
  assert.match(repo,/export async function getVerifiedCognitiveHistory/);
  assert.match(repo,/getDocsFromServer\(historyQuery\)/);
  const dash=fs.readFileSync(path.join(root,'src/page/seed/StudentPage.tsx'),'utf8');
  const lumen=fs.readFileSync(path.join(root,'src/page/lumen/LumenPage.tsx'),'utf8');
  assert.match(dash,/if \(syncing\)/);assert.match(lumen,/if \(syncing\)/);
  assert.match(dash,/!syncing && !hasProfile/);
  assert.match(lumen,/historyLoading &&/);
  assert.match(dash,/hasProfile\s*\? \{kind:"info"/);
});

test('CP37 server read renders observed dynamic state, clears both new states on cache or signout',async()=>{
 const h=harness();h.authChanged(uidA);const w=h.latest(uidA);
 const raw={...profile(uidA,'Owned'),schemaVersion:1,updatedAt:{seconds:1794960000,nanoseconds:0},behavior:{studyHoursPerWeek:0},finance:{educationBudget:null}};
 h.emit(w,raw);assert.equal(h.values[8].behavior.hours,0);assert.equal(h.values[8].finance.budget,null);
 h.requests[0].resolve([]);await flush();assert.equal(h.values[9].status,'NO_HISTORY');
 h.emit(w,raw,cache);assert.equal(h.values[8],null);assert.equal(h.values[9],null);h.close();
});
test('CP38 stale same-owner history cannot populate a newer state',async()=>{
 const h=harness();h.authChanged(uidA);const w=h.latest(uidA);
 const raw={...profile(uidA,'Owned'),schemaVersion:1,updatedAt:{seconds:1794960000,nanoseconds:0}};
 h.emit(w,raw);h.emit(w,{...raw,updatedAt:{seconds:1794960001,nanoseconds:0}});
 h.requests[1].resolve([]);await flush();assert.equal(h.values[9].status,'NO_HISTORY');
 h.requests[0].resolve([{id:'bad'}]);await flush();assert.equal(h.values[9].status,'NO_HISTORY');h.authChanged(null);assert.equal(h.values[8],null);assert.equal(h.values[9],null);h.close();
});
