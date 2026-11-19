/**
 * CP38-AUTH: deterministic tests for account verification and login routing.
 * No production Firebase is called; real Firebase deployment remains unverified.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');

function loadTs(relativePath, stubs = {}) {
  const filename = path.resolve(root, relativePath);
  const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    fileName: filename,
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
    },
  });
  const output = { exports: {} };
  function localRequire(name) {
    if (Object.hasOwn(stubs, name)) return stubs[name];
    if (name.startsWith('.')) {
      const resolved = path.resolve(path.dirname(filename), name);
      const candidate = `${resolved}.ts`;
      if (fs.existsSync(candidate)) return loadTs(path.relative(root, candidate), stubs);
    }
    return require(name);
  }
  new Function('module', 'exports', 'require', compiled.outputText)(output, output.exports, localRequire);
  return output.exports;
}
const verification = loadTs('src/lib/accountVerification.ts');
const { checkAccountDocument, readAccountDocumentWithRetry, firebaseErrorCode, isTemporaryFirestoreFailure } = verification;
const issue = code => Object.assign(new Error(code), {code});

test('AUTH-01: explicit active Admin role is accepted', () => {
  assert.deepEqual(checkAccountDocument(true,{role:'admin',active:true}), {status:'ready', role:'admin'});
});
test('AUTH-02: only student non-Admin role is accepted', () => {
  assert.deepEqual(checkAccountDocument(true,{role:'student',active:true}), {status:'ready',role:'student'});
  for(const role of ['teacher','parent']) assert.deepEqual(checkAccountDocument(true,{role,active:true}),{status:'invalid-role'});
});
test('AUTH-03: absent profile or null data does not grant access', () => {
  assert.deepEqual(checkAccountDocument(false,{role:'admin',active:true}), {status:'no-profile'});
  assert.deepEqual(checkAccountDocument(true,null), {status:'no-profile'});
});
test('AUTH-04: missing, false, and string active flags are denied', () => {
  for (const active of [undefined,false,'true',1]) {
    assert.deepEqual(checkAccountDocument(true,{role:'admin',active}), {status:'inactive'});
  }
});
test('AUTH-05: malformed roles and email-based spoofing do not grant Admin', () => {
  for (const role of ['administrator','Admin',null,undefined,0]) {
    assert.deepEqual(checkAccountDocument(true,{role,active:true,email:'admin@example.invalid'}), {status:'invalid-role'});
  }
});
test('AUTH-06: transient Firestore unavailable retries and returns server profile', async () => {
  let attempts=0; const waits=[];
  const value=await readAccountDocumentWithRetry(async()=>{attempts++; if(attempts<3) throw issue('unavailable'); return {role:'admin'};},
    {pause:async ms=>waits.push(ms)});
  assert.deepEqual(value,{role:'admin'});
  assert.equal(attempts,3); assert.deepEqual(waits,[350,800]);
});
test('AUTH-07: stop after three transient failures and preserve the error', async () => {
  let attempts=0;
  await assert.rejects(readAccountDocumentWithRetry(async()=>{attempts++;throw issue('firestore/unavailable');},
    {pause:async()=>{}}),error=>error.code==='firestore/unavailable');
  assert.equal(attempts,3);
});
test('AUTH-08: permission-denied is never retried or bypassed', async () => {
  let attempts=0;
  await assert.rejects(readAccountDocumentWithRetry(async()=>{attempts++; throw issue('permission-denied');},
    {pause:async()=>{}}),error=>error.code==='permission-denied');
  assert.equal(attempts,1);
});
test('AUTH-09: error classifier handles Firestore-prefixed errors, not arbitrary failures', () => {
  assert.equal(firebaseErrorCode(issue('firestore/unavailable')), 'unavailable');
  assert.equal(isTemporaryFirestoreFailure(issue('deadline-exceeded')),true);
  assert.equal(isTemporaryFirestoreFailure(issue('auth/invalid-credential')),false);
  assert.equal(isTemporaryFirestoreFailure(issue('permission-denied')),false);
});

test('AUTH-10: both login and route guard verify the latest server role, not cache', () => {
  const login=fs.readFileSync(path.join(root,'src/page/auth/LoginPage.tsx'),'utf8');
  const gate=fs.readFileSync(path.join(root,'src/components/common/AccessGate.tsx'),'utf8');
  for(const code of [login,gate]) {
    assert.match(code,/getDocFromServer/);
    assert.match(code,/readAccountDocumentWithRetry/);
    assert.match(code,/checkAccountDocument/);
    assert.doesNotMatch(code,/getDocFromCache/);
  }
  assert.match(login,/hasAuthenticatedSession/);
  assert.match(login,/handleResumeVerification/);
  assert.match(login,/role === "admin" \? "\/admin"/);
  assert.doesNotMatch(login,/email\s*===\s*['"]admin@/);
});

// Render the real TSX module through a tiny deterministic React/Firebase harness.
// These tests exercise its actual submit handler, not just strings in the source.
function mockLogin({profile, failReads=0, firebaseCode='unavailable'}={}) {
  let cursor=0, onAuthChange=null, reads=0;
  const state=[];
  const auth={currentUser:null};
  const hooks={
    useState(value){const key=cursor++;if(!(key in state)) state[key]=value;
      return [state[key],next=>{state[key]=typeof next==='function'?next(state[key]):next;}];},
    useEffect(effect){effect();},
  };
  const element=(type,props)=>({type,props:props||{}});
  const firestore={
    doc(_db,collection,uid){return `${collection}/${uid}`;},
    async getDocFromServer(ref){
      assert.equal(ref,'users/test-uid');
      reads++;
      if(reads<=failReads) throw issue(firebaseCode);
      return {exists:()=>profile!=null,data:()=>profile};
    },
    async setDoc(){},
  };
  const firebaseAuth={
    async signInWithEmailAndPassword(){auth.currentUser={uid:'test-uid'};onAuthChange?.(auth.currentUser);return {user:auth.currentUser};},
    async createUserWithEmailAndPassword(){throw Error('not needed');},
    async signInWithPopup(){throw Error('not needed');},
    GoogleAuthProvider: class {},
    onAuthStateChanged(_auth,listener){onAuthChange=listener;listener(auth.currentUser);return ()=>{};},
  };
  const component=loadTs('src/page/auth/LoginPage.tsx',{
    react:hooks,
    'react/jsx-runtime':{jsx:element,jsxs:element,Fragment:'fragment'},
    'firebase/auth':firebaseAuth,
    'firebase/firestore':firestore,
    '../../lib/firebase':{auth,db:{}},
    '../../assets/logo cla.png':'image-placeholder',
    '../../styles.css':{},
  }).default;
  const render=()=>{cursor=0;return component();};
  const find=(node,predicate)=>{
    if(!node||typeof node!=='object')return undefined;
    if(predicate(node))return node;
    const children=node.props?.children;
    for(const child of Array.isArray(children)?children:[children]){
      const found=find(child,predicate);if(found)return found;
    }
  };
  return {render,find,auth,get reads(){return reads;}};
}
async function submitLogin(harness){
  const tree=harness.render();
  const form=harness.find(tree,node=>node.type==='form');
  assert.ok(form,'form found');
  await form.props.onSubmit({preventDefault(){}});
}

test('AUTH-11: existing admin redirects to /admin after server verification',async()=>{
  const originalWindow=globalThis.window;
  globalThis.window={location:{href:'/login'}};
  try{
    const h=mockLogin({profile:{role:'admin',active:true}});
    await submitLogin(h);
    assert.equal(globalThis.window.location.href,'/admin');
    assert.equal(h.reads,1);
  }finally{globalThis.window=originalWindow;}
});
test('AUTH-12: non-admin cannot be redirected to /admin by using the same login form',async()=>{
  const originalWindow=globalThis.window;
  globalThis.window={location:{href:'/login'}};
  try{
    const h=mockLogin({profile:{role:'student',active:true}});
    await submitLogin(h);
    assert.equal(globalThis.window.location.href,'/student');
  }finally{globalThis.window=originalWindow;}
});
test('AUTH-13: blocked or missing Admin profile cannot navigate despite valid Firebase Auth',async()=>{
  const originalWindow=globalThis.window;
  globalThis.window={location:{href:'/login'}};
  try{
    for(const profile of [{role:'admin',active:false},null,{role:'admin'}]){
      const h=mockLogin({profile});
      await submitLogin(h);
      assert.equal(globalThis.window.location.href,'/login');
    }
  }finally{globalThis.window=originalWindow;}
});
test('AUTH-14: transient failure recovers during login without bypassing verification',async()=>{
  const originalWindow=globalThis.window;
  globalThis.window={location:{href:'/login'}};
  try{
    const h=mockLogin({profile:{role:'admin',active:true},failReads:2});
    await submitLogin(h);
    assert.equal(h.reads,3);
    assert.equal(globalThis.window.location.href,'/admin');
  }finally{globalThis.window=originalWindow;}
});
test('AUTH-15: a failed role read retains the Auth session and exposes a retry button',async()=>{
  const originalWindow=globalThis.window;
  const originalError=console.error;
  console.error=()=>{}; // This case intentionally triggers and handles a Firebase failure.
  globalThis.window={location:{href:'/login'}};
  try{
    const h=mockLogin({profile:{role:'admin',active:true},failReads:999});
    await submitLogin(h);
    assert.equal(globalThis.window.location.href,'/login');
    assert.equal(h.auth.currentUser.uid,'test-uid');
    const tree=h.render();
    const retry=h.find(tree,node=>node.type==='button'&&String(node.props?.children).includes('Thử lại xác minh quyền'));
    assert.ok(retry,'retry without password rendered');
    assert.equal(retry.props.disabled,false);
  }finally{globalThis.window=originalWindow;console.error=originalError;}
});

test('AUTH-16: LoginPage role is strictly narrowed to ready before redirect', () => {
  const loginPath = path.join(root, 'src/page/auth/LoginPage.tsx');
  const source = ts.createSourceFile(loginPath, fs.readFileSync(loginPath, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let verifyFunction;
  const visit = node => {
    if (ts.isFunctionDeclaration(node) && node.name?.text === 'verifyAndRedirect') verifyFunction = node;
    ts.forEachChild(node, visit);
  };
  visit(source);
  assert.ok(verifyFunction, 'Actual verifyAndRedirect declaration must exist');

  // Use an actual temporary file so TypeScript's compiler host handles Windows
  // path normalization (e.g. C:\\Gạo\\...) and Unicode consistently.
  // This also avoids deprecated moduleResolution=node10 on TypeScript 6+.
  const tempName = `__cla_login_typecheck_${process.pid}_${require('node:crypto').randomBytes(6).toString('hex')}.ts`;
  const tempFile = path.join(root, 'tests', tempName);
  const typecheckSource = `
import { checkAccountDocument, type AccountRole } from "../src/lib/accountVerification";
declare const db: unknown;
declare function doc(...args: unknown[]): unknown;
declare function getDocFromServer(ref: unknown): Promise<{ exists(): boolean; data(): unknown }>;
declare function readAccountDocumentWithRetry<T>(read: () => Promise<T>): Promise<T>;
declare function setMessage(value: string): void;
declare function redirectByRole(role: AccountRole): void;
${verifyFunction.getText(source)}
`;
  const options = {
    strict: true, noEmit: true, skipLibCheck: true, types: [],
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    lib: ['lib.es2022.d.ts', 'lib.dom.d.ts'],
  };
  try {
    fs.writeFileSync(tempFile, typecheckSource, 'utf8');
    const program = ts.createProgram([tempFile], options);
    const diagnostics = ts.getPreEmitDiagnostics(program);
    assert.deepEqual(
      diagnostics.map(d => ts.flattenDiagnosticMessageText(d.messageText, '\n')),
      [],
      'LoginPage role verification must pass TypeScript strict checking, not transpile-only',
    );
  } finally {
    fs.rmSync(tempFile, { force: true });
  }
});
