import test from 'node:test';
import assert from 'node:assert/strict';
import { authorizeAdminOperator, parseAdminOperation, performAdminAccountOperation }
  from '../functions-admin/src/accountPolicy.mjs';

const now = 1794740400;
const operator = 'operator_101';
const target = 'student_201';
const validClaims = () => ({uid:operator,claOperator:true,auth_time:now-20,
  firebase:{sign_in_second_factor:'phone',sign_in_provider:'password'}});
const validOperation = () => ({action:'set-active',targetUid:target,requestId:'request_123456',ticket:'ISSUE-2026-42',active:false});
const actor = {role:'admin',active:true};
function dbFixture(overrides={}) {
  const records = new Map([
    [`users/${operator}`, actor],
    [`users/${target}`, {role:'student',active:true,fullName:'Do-not-expose',email:'private@example.invalid'}],
    ...Object.entries(overrides),
  ]);
  const counters = {updated:0,created:0};
  const db = {
    doc(path) {return {path};},
    async runTransaction(fn) {
      const changes=[];
      const tx={
        async get(ref) {return {exists:records.has(ref.path),data(){return records.get(ref.path);}};},
        update(ref, patch) {changes.push(['update',ref.path,patch]);},
        create(ref, data) {changes.push(['create',ref.path,data]);},
      };
      const outcome=await fn(tx);
      for (const [kind,path,data] of changes) {
        if (kind==='create' && records.has(path)) throw Error('duplicate');
        if (kind==='update') {if(!records.has(path))throw Error('not found');records.set(path,{...records.get(path),...data});counters.updated++;}
        else {records.set(path,data);counters.created++;}
      }
      return outcome;
    },
  };
  return {db,records,counters};
}
const run = async (f, changes={}) => performAdminAccountOperation({db:f.db, claims:validClaims(),
  input:validOperation(), enabled:'true', allowlist:[operator],nowSeconds:now,timestamp:'server_timestamp',...changes});
const denied = (promise, code) => assert.rejects(promise, error => error?.code===code);

test('CP29-K15-01 rejects empty, primitive, unknown and extra input keys',()=>{
  for(const bad of [null,[],{},'x',{...validOperation(),role:'admin'}, {...validOperation(),arbitrary:true}]) {
    assert.throws(()=>parseAdminOperation(bad),{code:'INVALID_REQUEST'});
  }
});
test('CP29-K15-02 rejects invalid UID/ticket/requestId without arbitrary document paths',()=>{
  for(const patch of [{targetUid:'../users/admin'},{targetUid:'a/b'},{targetUid:'short'},{ticket:'email@example.com'},
    {ticket:''},{requestId:'bad/id'},{requestId:'x'}]) {
    const value={...validOperation(),...patch};
    assert.throws(()=>parseAdminOperation(value));
  }
});
test('CP29-K15-03 denies admin role grant and invalid active state',()=>{
  for(const value of [{...validOperation(),action:'set-role',role:'admin',active:undefined},
    {...validOperation(),active:'true'}, {...validOperation(),active:null}]) assert.throws(()=>parseAdminOperation(value));
});
test('CP29-K15-04 allow only bounded non-Admin role targets',()=>{
  const op={action:'set-role',targetUid:target,requestId:'request_67890',ticket:'ISSUE-2026-42'};
  assert.equal(parseAdminOperation({...op,role:'student'}).role,'student');
  for(const role of ['teacher','parent','admin']) assert.throws(()=>parseAdminOperation({...op,role}),{code:'INVALID_ROLE'});
});
test('CP29-K15-05 feature flag defaults fail-closed',async()=>{
  const f=dbFixture(); await denied(run(f,{enabled:'false'}),'FEATURE_DISABLED_OR_NOT_ALLOWLISTED');
  assert.equal(f.counters.updated,0); assert.equal(f.counters.created,0);
});
test('CP29-K15-06 empty operator allowlist is denied',async()=>{
  const f=dbFixture(); await denied(run(f,{allowlist:[]}), 'FEATURE_DISABLED_OR_NOT_ALLOWLISTED');
});
test('CP29-K15-07 custom role claim cannot replace operator claim',async()=>{
  const f=dbFixture(); await denied(run(f,{claims:{...validClaims(),claOperator:false,role:'admin'}}),'OPERATOR_CLAIM_REQUIRED');
});
test('CP29-K15-08 a valid email or UI role never provides operator authority',async()=>{
  const f=dbFixture(); await denied(run(f,{claims:{...validClaims(),claOperator:undefined,email:'admin@example.invalid'}}),'OPERATOR_CLAIM_REQUIRED');
});
test('CP29-K15-09 recent primary login with no second factor is denied',async()=>{
  const f=dbFixture();await denied(run(f,{claims:{...validClaims(),firebase:{sign_in_provider:'password'}}}),'MFA_REQUIRED');
});
test('CP29-K15-10 stale or future sessions fail closed',async()=>{
  for(const auth_time of [now-301,now+100,0,'now']) {
    const f=dbFixture();await denied(run(f,{claims:{...validClaims(),auth_time}}),'RECENT_AUTH_REQUIRED');
  }
});
test('CP29-K15-11 blocked or demoted operator cannot manage accounts',async()=>{
  for(const profile of [{role:'admin',active:false},{role:'teacher',active:true}]) {
    const f=dbFixture({[`users/${operator}`]:profile});await denied(run(f),'ADMIN_PROFILE_REQUIRED');
  }
});
test('CP29-K15-12 never allows self-management',async()=>{
  const f=dbFixture();await denied(run(f,{input:{...validOperation(),targetUid:operator}}),'SELF_CHANGE_DENIED');
});
test('CP29-K15-13 never manages another Admin, even if operator',async()=>{
  const f=dbFixture({[`users/${target}`]:{role:'admin',active:true}});
  await denied(run(f),'TARGET_NOT_MANAGEABLE');
});
test('CP29-K15-14 rejects missing target or malformed legacy profile',async()=>{
  for(const profile of [undefined,{role:'student'},{role:'ghost',active:true}]) {
    const f=dbFixture({[`users/${target}`]:profile});
    if (profile===undefined) f.records.delete(`users/${target}`);
    await denied(run(f),profile===undefined?'TARGET_NOT_FOUND':'TARGET_NOT_MANAGEABLE');
  }
});
test('CP29-K15-15 set-active updates only active and records atomic audit without email',async()=>{
  const f=dbFixture(); const result=await run(f);
  assert.deepEqual(result,{status:'updated',requestId:'request_123456',targetUid:target,role:'student',active:false});
  assert.deepEqual(f.records.get(`users/${target}`),{role:'student',active:false,fullName:'Do-not-expose',email:'private@example.invalid'});
  const audit=f.records.get('admin_account_audit/request_123456');
  assert.equal(audit.actorUid,operator);assert.equal(audit.ticket,'ISSUE-2026-42');
  assert.deepEqual(audit.before,{role:'student',active:true});
  assert.deepEqual(audit.after,{role:'student',active:false});
  assert.equal(audit.at,'server_timestamp');
  assert.doesNotMatch(JSON.stringify(audit),/private|email|fullName/i);
  assert.equal(f.counters.created,1);assert.equal(f.counters.updated,1);
});
test('CP29-K15-16 replay same mutation does not write a second audit',async()=>{
  const f=dbFixture();await run(f); const result=await run(f);
  assert.equal(result.status,'already-applied');assert.equal(f.counters.created,1);assert.equal(f.counters.updated,1);
});
test('CP29-K15-17 reusing requestId for a different request is rejected',async()=>{
  const f=dbFixture();await run(f);
  await denied(run(f,{input:{...validOperation(),active:true}}),'REQUEST_ID_CONFLICT');
  await denied(run(f,{input:{...validOperation(),ticket:'DIFFERENT-99'}}),'REQUEST_ID_CONFLICT');
});
test('CP29-K15-18 inspect uses exact UID, returns minimal profile and creates audit',async()=>{
  const f=dbFixture();const result=await run(f,{input:{action:'inspect',targetUid:target,requestId:'read_req_123',ticket:'READ-2026-43'}});
  assert.deepEqual(result,{status:'inspected',requestId:'read_req_123',targetUid:target,role:'student',active:true});
  assert.equal(f.counters.created,1);assert.equal(f.counters.updated,0);
});
test('CP29-K15-19 no-op mutation is not a successful operation',async()=>{
  const f=dbFixture();await denied(run(f,{input:{...validOperation(),active:true}}),'NO_CHANGE');
  assert.equal(f.counters.created,0);
});
test('CP29-K15-20 explicit legacy-to-student migration is audited',async()=>{
  const f=dbFixture({[`users/${target}`]:{role:'teacher',active:true}});const result=await run(f,{input:{action:'set-role',targetUid:target,requestId:'change_12345',ticket:'CHANGE-2026-42',role:'student'}});
  assert.equal(result.role,'student');assert.equal(result.active,true);
  assert.equal(f.records.get(`users/${target}`).role,'student');
  assert.equal(f.records.get('admin_account_audit/change_12345').before.role,'teacher');
});
test('CP29-K15-21 an existing audit entry for other operator is not trusted',async()=>{
  const f=dbFixture({'admin_account_audit/request_123456':{actorUid:'other123',targetUid:target,action:'set-active',ticket:'ISSUE-2026-42',after:{active:false}}});
  await denied(run(f),'REQUEST_ID_CONFLICT');
});
test('CP29-K15-22 owner mismatch between token and actor UID fails closed',()=>{
  assert.throws(()=>authorizeAdminOperator({actorUid:operator,claims:{...validClaims(),uid:'someoneelse'},actor,
    enabled:'true',allowlist:[operator],nowSeconds:now}),{code:'OPERATOR_CLAIM_REQUIRED'});
});
test('CP29-K15-23 no unsafe Admin bootstrap or client role elevation in source',async()=>{
  const {readFileSync}=await import('node:fs');
  const {resolve}=await import('node:path');
  const root=resolve(import.meta.dirname,'..');
  const code=readFileSync(resolve(root,'functions-admin/index.mjs'),'utf8');
  const firebase=readFileSync(resolve(root,'firebase.json'),'utf8');
  const rules=readFileSync(resolve(root,'firestore.rules.CANDIDATE_CP21'),'utf8');
  assert.match(code,/verifyIdToken\(raw\.slice\('Bearer '\.length\), true\)/);
  assert.match(code,/CLA_ADMIN_ACCOUNTS_ENABLED/);
  assert.doesNotMatch(firebase,/functions-admin|admin_account_audit/);
  assert.match(rules,/allow update, delete: if false;/);
  assert.doesNotMatch(code,/setCustomUserClaims|createUser\(/);
});

test('retired account cannot be reactivated without explicit conversion',async()=>{const f=dbFixture({[`users/${target}`]:{role:'parent',active:false}});await denied(run(f,{input:{...validOperation(),active:true}}),'LEGACY_ROLE_RETIRED');assert.equal(f.counters.updated,0);});
