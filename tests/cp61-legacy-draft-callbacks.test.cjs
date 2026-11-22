'use strict';
/** CP61: behavioral Firestore callback replay, not an Emulator or browser E2E. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const confirmed = { fromCache: false, hasPendingWrites: false };
const cached = { fromCache: true, hasPendingWrites: false };
const uid = 'student_cp61_a';
const primary = `orion_drafts:${uid}`;
const legacy = `module_drafts:${uid}`;

function harness(moduleName = 'orion') {
  const watchers = [];
  const state = [];
  const cleanups = [];
  const auth = {currentUser: null};
  let authChanged, stateCursor = 0;
  const mock = {
    react: {
      useState(initial) { const slot = stateCursor++; state[slot] = initial;
        return [initial, value => { state[slot] = typeof value === 'function' ? value(state[slot]) : value; }]; },
      useRef(initial) { return {current: initial}; },
      useEffect(fn) { cleanups.push(fn()); },
    },
    'firebase/auth': {onAuthStateChanged:(_auth, callback) => {
      authChanged = user => { auth.currentUser = user; callback(user); };
      return () => {};
    }},
    'firebase/firestore': {
      doc:(_db, collection, owner) => `${collection}:${owner}`,
      onSnapshot(ref, options, cb, onError) {const watcher={ref, options, cb, onError, closed:false};
        watchers.push(watcher);return ()=>{watcher.closed=true;}; },
      getDocFromServer() {throw new Error('Not used');},
      runTransaction() {throw new Error('Not used');},serverTimestamp() {return null;},
    },
    './firebase': {auth, db:{}},
    '../page/seed/services/realtimeReadPolicy': {
      isServerConfirmedSnapshot:m=>m?.fromCache === false && m?.hasPendingWrites === false,
      isMatchingAccountRecord:(value, owner)=>value && (value.userId === undefined || value.userId === owner),
    },
    './serializedDraftWrites': {createDraftWriteQueue:()=>({enqueue:fn=>fn()})},
    './draftNavigationGuard': {registerNavigationGuard:()=>()=>{}, isLeavingDraftWorkspace:()=>true},
    './draftAsyncGuards': {assertDraftRefreshUninterrupted:()=>{},
      currentDraftListener:(owner, expectedEpoch, actualOwner, actualEpoch, mounted)=>
        !!owner && owner===actualOwner && expectedEpoch===actualEpoch && mounted},
    './draftRevision': {draftVersion:d=>({exists:!!d, revision:d?.revision??0, signature:JSON.stringify(d??'')}),
      draftPayloadSignature:d=>JSON.stringify(d),assertDraftUnchanged:()=>{},
      DraftConflictError:class DraftConflictError extends Error {}},
  };
  const source = fs.readFileSync(path.join(root, 'src/lib/useModuleDraft.ts'), 'utf8');
  const js = ts.transpileModule(source, {fileName:'useModuleDraft.ts',
    compilerOptions:{module:ts.ModuleKind.CommonJS, target:ts.ScriptTarget.ES2022}}).outputText;
  const mod={exports:{}};
  const fakeWindow={addEventListener:()=>{},removeEventListener:()=>{},confirm:()=>true};
  new Function('module','exports','require','window',js)(mod,mod.exports,name=>{
    if (!(name in mock)) throw new Error(`Unexpected dependency: ${name}`);
    return mock[name];
  },fakeWindow);
  mod.exports.useModuleDraft(moduleName);
  return {state,watchers,
    auth:nextUid=>authChanged(nextUid?{uid:nextUid}:null),
    latest:ref=>watchers.filter(w=>w.ref===ref).at(-1),
    count:ref=>watchers.filter(w=>w.ref===ref).length,
    emit:(w,data,metadata=confirmed)=>w.cb({metadata,exists:()=>data!==null,data:()=>data}),
    error:(w,code='unavailable')=>w.onError({code}),
    close:()=>cleanups.forEach(fn=>fn?.()),
  };
}
const legacyValue = marker => ({userId:uid, orion:{marker}});
const primaryValue = marker => ({userId:uid, revision:1, data:{marker}});

test('CP61.1 confirmed canonical update wins against queued legacy snapshot', () => {
  const h=harness();h.auth(uid);const p=h.latest(primary);
  h.emit(p,null);const l=h.latest(legacy);h.emit(l,legacyValue('first'));
  assert.equal(h.state[0].marker,'first');
  h.emit(p,primaryValue('canonical'));
  assert.equal(l.closed,true);
  h.emit(l,legacyValue('stale'));
  assert.equal(h.state[0].marker,'canonical');
  assert.equal(h.state[1],'ready');h.close();
});
test('CP61.2 late legacy error cannot obscure server-confirmed canonical record',()=>{
  const h=harness();h.auth(uid);const p=h.latest(primary);
  h.emit(p,null);const l=h.latest(legacy);
  h.emit(p,primaryValue('fresh'));h.error(l,'permission-denied');
  assert.equal(h.state[0].marker,'fresh');
  assert.equal(h.state[1],'ready');assert.equal(h.state[2],'');h.close();
});
test('CP61.3 cached primary invalidates legacy, new verified fallback is the only accepted source',()=>{
  const h=harness();h.auth(uid);const p=h.latest(primary);
  h.emit(p,null);const old=h.latest(legacy);
  h.emit(old,legacyValue('before'));
  h.emit(p,null,cached);
  assert.equal(old.closed,true);assert.equal(h.state[1],'syncing');assert.equal(h.state[0],null);
  h.emit(old,legacyValue('late'));h.error(old);
  assert.equal(h.state[1],'syncing');assert.equal(h.state[0],null);
  h.emit(p,null);const current=h.latest(legacy);
  assert.notEqual(old,current);h.emit(current,legacyValue('verified'));
  assert.equal(h.state[0].marker,'verified');assert.equal(h.state[1],'ready');h.close();
});
test('CP61.4 repeated confirmed missing primary retains legacy listener and verified draft',()=>{
  const h=harness();h.auth(uid);const p=h.latest(primary);
  h.emit(p,null);const l=h.latest(legacy);h.emit(l,legacyValue('first'));
  h.emit(p,null);h.emit(p,null);
  assert.equal(h.count(legacy),1);assert.equal(l.closed,false);
  assert.equal(h.state[0].marker,'first');assert.equal(h.state[1],'ready');h.close();
});
test('CP61.5 account change and cleanup reject queued legacy callbacks and errors',()=>{
  const h=harness();h.auth(uid);const p=h.latest(primary);
  h.emit(p,null);const l=h.latest(legacy);
  h.auth('student_cp61_b');assert.equal(l.closed,true);
  h.emit(l,legacyValue('old-user'));h.error(l);
  assert.equal(h.state[0],null);assert.equal(h.state[1],'loading');
  h.close();h.emit(h.latest('orion_drafts:student_cp61_b'),primaryValue('late-after-close'));
  assert.equal(h.state[0],null);
});
test('CP61.6 same listener protection is shared across Orion, Pulse and Haven',()=>{
  for (const module of ['orion','pulse','haven']) {
    const h=harness(module);h.auth(uid);const p=h.latest(`${module}_drafts:${uid}`);
    h.emit(p,null);const l=h.latest(legacy);
    h.emit(p,{userId:uid,revision:2,data:{marker:module}});
    h.emit(l,{userId:uid,[module]:{marker:'stale'}});
    assert.equal(h.state[0].marker,module);assert.equal(h.state[1],'ready');h.close();
  }
});
