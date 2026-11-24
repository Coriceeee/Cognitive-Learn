/** Session-local dependency ledger. Not a Firestore security boundary or research evidence. */
export const DECISION_SNAPSHOT_VERSION = 'cla-decision-snapshot-v1' as const;
export type DecisionInput = 'profile'|'transcript'|'goal'|'sources'|'projection';
export type DecisionModule = 'Seed'|'Lumen'|'Atlas'|'Orion'|'Pulse';
export const decisionDependencies: Readonly<Record<DecisionModule,readonly DecisionInput[]>> = {
  Seed:['profile','transcript'], Lumen:['profile','transcript','projection'],
  Atlas:['profile','transcript','projection','goal','sources'], Orion:['profile','transcript','projection','goal','sources'], Pulse:[],
};
export type DecisionSnapshot = {version:typeof DECISION_SNAPSHOT_VERSION; owner:string; module:DecisionModule; revisions:Partial<Record<DecisionInput,number>>};
const keys: DecisionInput[] = ['profile','transcript','goal','sources','projection'];
export function createDecisionLedger() {
  let owner = '', serial = 0;
  const values = new Map<DecisionInput,{value:string|null;revision:number;lastConfirmed:string|null}>();
  function clear() { owner=''; values.clear(); ++serial; }
  function observe(uid:string,key:DecisionInput,value:string|null) {
    if (!uid || !keys.includes(key) || (value!==null && (typeof value!=='string'||!value.trim()))) return false;
    if (owner!==uid) { clear(); owner=uid; }
    const old=values.get(key);
    if(old?.value===value)return true;
    // Temporary loss of server confirmation blocks use but does not invent a content change.
    const revision=old&&(value===null||old.lastConfirmed===value)?old.revision:++serial;
    values.set(key,{value,revision,lastConfirmed:value??old?.lastConfirmed??null}); return true;
  }
  function capture(uid:string,module:DecisionModule, dependencies=decisionDependencies[module]):DecisionSnapshot|null {
    if(!uid||uid!==owner||!dependencies||!dependencies.every(k=>keys.includes(k))) return null;
    const revisions:DecisionSnapshot['revisions']={};
    for(const key of dependencies){const entry=values.get(key); if(!entry||entry.value===null)return null;revisions[key]=entry.revision;}
    return {version:DECISION_SNAPSHOT_VERSION,owner:uid,module,revisions};
  }
  function check(uid:string,snapshot:DecisionSnapshot|null, required?:readonly DecisionInput[]): 'CURRENT'|'STALE'|'UNAVAILABLE'|'INVALID' {
    if(!snapshot||snapshot.version!==DECISION_SNAPSHOT_VERSION||!uid||uid!==owner||snapshot.owner!==uid||!Object.prototype.hasOwnProperty.call(decisionDependencies,snapshot.module)||!snapshot.revisions||typeof snapshot.revisions!=='object')return 'INVALID';
    const deps=required??decisionDependencies[snapshot.module];
    if(Object.keys(snapshot.revisions).length!==deps.length||!deps.every(k=>keys.includes(k)&&Number.isSafeInteger(snapshot.revisions[k])&&(snapshot.revisions[k]??0)>0))return 'INVALID';
    if(deps.some(k=>!values.get(k)||values.get(k)?.value===null))return 'UNAVAILABLE';
    return deps.every(k=>values.get(k)?.revision===snapshot.revisions[k])?'CURRENT':'STALE';
  }
  return {clear,observe,capture,check};
}
export const studentDecisionLedger = createDecisionLedger();
export function affectedDecisionModules(changes:readonly DecisionInput[]):DecisionModule[]{
  return (Object.keys(decisionDependencies) as DecisionModule[]).filter(m=>decisionDependencies[m].some(k=>changes.includes(k)));
}

// Transport guards are explicit: no implicit persistence or transfer of scores.
const handoffs = new Map<'projection'|'goal',DecisionSnapshot>();
const handoffDeps = {projection:['profile','transcript','projection'],goal:['profile','transcript','goal','sources']} as const;
export function pinDecisionHandoff(uid:string,kind:'projection'|'goal'):boolean {
  handoffs.delete(kind);
  const snapshot=studentDecisionLedger.capture(uid,kind==='projection'?'Lumen':'Atlas',handoffDeps[kind]);
  if(!snapshot)return false; handoffs.set(kind,snapshot); return true;
}
export function checkDecisionHandoff(uid:string,kind:'projection'|'goal') {
  return studentDecisionLedger.check(uid,handoffs.get(kind)??null,handoffDeps[kind]);
}
export function clearDecisionHandoff(kind:'projection'|'goal') {handoffs.delete(kind);}
