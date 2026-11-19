/** CP31 Batch 16 — bounded, owner-scoped, read-only history pagination audit.
 * A paginated Firestore query is NOT an atomic all-history snapshot. Rows here
 * are deliberately never admitted to measurement-equivalence or causal analyses.
 */
import {isJourneyCycle, type JourneyCycle} from './closedLoopJourney.ts';

export const HISTORY_PAGE_SIZE=8;
export const HISTORY_MAX_DISPLAY=80;
export type HistoryArchiveDocument={id:string;data:unknown};
export type HistoryPageAudit={
  state:'APPEND_UNVERIFIED'|'BLOCKED';
  reason:'NONE'|'INVALID_OWNER'|'INVALID_KNOWN'|'INVALID_DOCUMENT'|'DUPLICATE'|'ORDER_OR_CURSOR'|'UNTRUSTED_SOURCE'|'TOO_MANY';
  older:JourneyCycle[];hasMore:boolean;
};
const cycleOwner=(c:JourneyCycle)=>(c as JourneyCycle & {userId?:unknown}).userId;
const blocked=(reason:HistoryPageAudit['reason']):HistoryPageAudit=>({state:'BLOCKED',reason,older:[],hasMore:true});
/** Requires server response to a `startAfter(lastLoadedDoc), limit(8)` query.
 * A full page may have more data; fetch again until a short or empty page.
 * Never exceed the deployed Firestore Rules query limit of eight.
 */
export function auditJourneyArchivePage(
  owner:string, known:JourneyCycle[], docs:HistoryArchiveDocument[], fromServer:boolean,
):HistoryPageAudit {
  if(!fromServer)return blocked('UNTRUSTED_SOURCE');
  if(typeof owner!=='string'||!owner.length||owner.length>128)return blocked('INVALID_OWNER');
  if(!Array.isArray(known)||!known.length||known.length>=HISTORY_MAX_DISPLAY ||
    known.some(c=>!isJourneyCycle(c)||cycleOwner(c)!==owner)||
    new Set(known.map(c=>c.id)).size!==known.length)return blocked('INVALID_KNOWN');
  if(!Array.isArray(docs)||docs.length>HISTORY_PAGE_SIZE)return blocked('TOO_MANY');
  const ids=new Set(known.map(c=>c.id));
  const last=known[known.length-1];
  if(typeof last.startedAt!=='string')return blocked('INVALID_KNOWN');
  let previous=last.startedAt;
  for(const document of docs){
    if(!document||typeof document.id!=='string'||!isJourneyCycle(document.data)||
      cycleOwner(document.data)!==owner||document.data.id!==document.id)return blocked('INVALID_DOCUMENT');
    if(ids.has(document.id))return blocked('DUPLICATE');
    ids.add(document.id);
    if(typeof document.data.startedAt!=='string'||document.data.startedAt>=previous)
      return blocked('ORDER_OR_CURSOR');
    previous=document.data.startedAt;
  }
  const capacity=HISTORY_MAX_DISPLAY-known.length;
  const older=docs.slice(0,Math.min(HISTORY_PAGE_SIZE,capacity)).map(d=>d.data as JourneyCycle);
  return {state:'APPEND_UNVERIFIED',reason:'NONE',older,
    hasMore:docs.length===HISTORY_PAGE_SIZE||docs.length>older.length};
}
