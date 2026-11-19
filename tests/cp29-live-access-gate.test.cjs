/** CP29 / B2: Exercise the real TSX AccessGate through deterministic Firebase/React mocks.
 * This test does not connect to Firebase production or certify browser behavior. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'src/components/common/AccessGate.tsx'), 'utf8');
const verificationSource = fs.readFileSync(path.join(root, 'src/lib/accountVerification.ts'), 'utf8');
function transpile(code, filename) {
  return ts.transpileModule(code, {fileName: filename, compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX,
  }}).outputText;
}
function loadModule(code, filename, imports) {
  const module = {exports: {}};
  new Function('module','exports','require',transpile(code,filename))(module,module.exports,name => {
    if (Object.hasOwn(imports,name)) return imports[name];
    throw new Error(`Unexpected module ${name}`);
  });
  return module.exports;
}
const verify = loadModule(verificationSource,'accountVerification.ts',{});
const element = (type,props) => ({type, props:props||{}});
const tick = async () => { await Promise.resolve(); await Promise.resolve(); await new Promise(resolve=>setImmediate(resolve)); };
function harness({role='student', path='/student', consentGate=false} = {}) {
  let cursor=0, effectInstalled=false, cleanup=()=>{}, authCallback, authError;
  const auth={currentUser:null};
  const state=[]; const subscriptions=[];
  const readOverrides=new Map();
  let authReads=0;
  const watchers={};
  const react={
    useState(initial) {const index=cursor++;if(!(index in state))state[index]=initial;
      return [state[index],next=>{state[index]=typeof next==='function'?next(state[index]):next;}];},
    useEffect(effect) {if (!effectInstalled) {effectInstalled=true;cleanup=effect();}},
  };
  const firestore={
    doc(_db,collection,uid) {return `${collection}/${uid}`;},
    async getDocFromServer(ref) {
      authReads++;
      return readOverrides.has(ref) ? readOverrides.get(ref) : snap(ref.startsWith('users/')
        ? {role,active:true} : consentRecord(auth.currentUser.uid),false);
    },
    onSnapshot(ref,opts,next,error){
      assert.equal(opts.includeMetadataChanges,true);
      const entry={next,error,closed:false};
      subscriptions.push([ref,entry]);watchers[ref]=entry;
      return ()=>{entry.closed=true;};
    },
  };
  const gate = loadModule(source,'AccessGate.tsx',{
    react,
    'react/jsx-runtime':{jsx:element,jsxs:element,Fragment:'fragment'},
    'firebase/auth':{onAuthStateChanged(_auth,listener,onError){authCallback=listener;authError=onError;return ()=>{authCallback=null;};}},
    'firebase/firestore':firestore,
    '../../lib/firebase':{auth,db:{}},
    '../../lib/accountVerification':verify,
    '../../lib/studentConsentPolicy':{readProductConsent(value,uid){return value?.userId===uid && value.productAccepted===true ? 'accepted':'withdrawn';}},
    '../../lib/studentConsentConfig':{STUDENT_CONSENT_GATE_ENABLED:consentGate},
  }).default;
  const original = globalThis.window;
  globalThis.window={location:{href:'http://localhost'+path},history:{replaceState(){}}};
  function snap(data,fromCache=false,hasPendingWrites=false) {return {
    exists:()=>data!=null,data:()=>data,
    metadata:{fromCache,hasPendingWrites},
  };}
  function consentRecord(uid) {return {userId:uid,productAccepted:true};}
  return {
    render() {cursor=0;return gate({path,children:'CLA_PRIVATE'});},
    status() {const out=this.render(); return out.type==='fragment' ? 'ready' : String(out.props.children?.props?.children?.[1]?.props?.children ?? JSON.stringify(out)).slice(0,200);},
    containsPrivate() {return JSON.stringify(this.render()).includes('CLA_PRIVATE');},
    login(uid='u-123456') {auth.currentUser={uid};return authCallback(auth.currentUser);},
    logout() {auth.currentUser=null;return authCallback(null);},
    authFail(){authError(Object.assign(new Error("auth failure"),{code:"unavailable"}));},
    emit(ref,data,{fromCache=false,hasPendingWrites=false}={}) {const w=watchers[ref];assert.ok(w,`Watcher registered: ${ref}`);w.next(snap(data,fromCache,hasPendingWrites));},
    fail(ref) {const w=watchers[ref];assert.ok(w);w.error(Object.assign(new Error('firestore unavailable'),{code:'unavailable'}));},
    close() {cleanup();globalThis.window=original;},
    get watchers(){return watchers;},
    get reads(){return authReads;},
    get subscriptions(){return subscriptions;},
  };
}
test('CP29-B2-01 starts fail-closed until server-backed role listener confirms',async()=>{
  const h=harness();try{
    h.render();await h.login();await tick();assert.equal(h.containsPrivate(),false);
    h.emit('users/u-123456',{role:'student',active:true});assert.equal(h.containsPrivate(),true);
    assert.ok(h.reads>=1);
  }finally{h.close();}
});
test('CP29-B2-02 role revoked during open session unmounts private children',async()=>{
  const h=harness();try{
    h.render();await h.login();await tick();
    h.emit('users/u-123456',{role:'student',active:true});assert.equal(h.containsPrivate(),true);
    h.emit('users/u-123456',{role:'student',active:false});assert.equal(h.containsPrivate(),false);
  }finally{h.close();}
});
test('CP29-B2-03 role changed to Admin does not silently escalate session',async()=>{
  const h=harness();try{
    h.render();await h.login();await tick();h.emit('users/u-123456',{role:'student',active:true});
    h.emit('users/u-123456',{role:'admin',active:true});assert.equal(h.containsPrivate(),false);
  }finally{h.close();}
});
test('CP29-B2-04 cached or pending-write account snapshots never authorize',async()=>{
  const h=harness();try{
    h.render();await h.login();await tick();
    h.emit('users/u-123456',{role:'student',active:true},{fromCache:true});assert.equal(h.containsPrivate(),false);
    h.emit('users/u-123456',{role:'student',active:true});assert.equal(h.containsPrivate(),true);
    h.emit('users/u-123456',{role:'student',active:true},{hasPendingWrites:true});assert.equal(h.containsPrivate(),false);
  }finally{h.close();}
});
test('CP29-B2-05 live consent withdrawal immediately unmounts student pages',async()=>{
  const h=harness({consentGate:true});try{
    h.render();await h.login();await tick();
    h.emit('users/u-123456',{role:'student',active:true});assert.equal(h.containsPrivate(),false);
    h.emit('student_consents/u-123456',{userId:'u-123456',productAccepted:true});assert.equal(h.containsPrivate(),true);
    h.emit('student_consents/u-123456',{userId:'u-123456',productAccepted:false});assert.equal(h.containsPrivate(),false);
  }finally{h.close();}
});
test('CP29-B2-06 cached consent state cannot re-grant access',async()=>{
  const h=harness({consentGate:true});try{
    h.render();await h.login();await tick();h.emit('users/u-123456',{role:'student',active:true});
    h.emit('student_consents/u-123456',{userId:'u-123456',productAccepted:true});assert.equal(h.containsPrivate(),true);
    h.emit('student_consents/u-123456',{userId:'u-123456',productAccepted:true},{fromCache:true});assert.equal(h.containsPrivate(),false);
  }finally{h.close();}
});
test('CP29-B2-07 listener failure fails closed and logout disposes old listeners',async()=>{
  const h=harness();try{
    h.render();await h.login();await tick();h.emit('users/u-123456',{role:'student',active:true});assert.equal(h.containsPrivate(),true);
    h.fail('users/u-123456');assert.equal(h.containsPrivate(),false);
    h.logout();assert.equal(h.containsPrivate(),false);
    assert.equal(h.watchers['users/u-123456'].closed,true);
  }finally{h.close();}
});
test('CP29-B2-08 switching accounts disposes old listeners before new verification',async()=>{
  const h=harness();try{
    h.render();await h.login();await tick();h.emit('users/u-123456',{role:'student',active:true});assert.equal(h.containsPrivate(),true);
    await h.login('u-234567');await tick();assert.equal(h.containsPrivate(),false);
    assert.equal(h.watchers['users/u-123456'].closed,true);
    h.emit('users/u-234567',{role:'student',active:true});assert.equal(h.containsPrivate(),true);
  }finally{h.close();}
});
test('CP29-B2-09 consent management route stays usable to re-consent',async()=>{
  const h=harness({consentGate:true,path:'/student/consent'});try{
    h.render();await h.login();await tick();assert.equal(h.watchers['student_consents/u-123456'],undefined);
    h.emit('users/u-123456',{role:'student',active:true});assert.equal(h.containsPrivate(),true);
  }finally{h.close();}
});

test('CP29-B2-10 auth stream error revokes existing access and unsubscribes listeners',async()=>{
  const h=harness();try{
    h.render();await h.login();await tick();h.emit('users/u-123456',{role:'student',active:true});assert.equal(h.containsPrivate(),true);
    h.authFail();assert.equal(h.containsPrivate(),false);
    assert.equal(h.watchers['users/u-123456'].closed,true);
  }finally{h.close();}
});
