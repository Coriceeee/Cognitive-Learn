import { nationalCutoffs, normalizeNational, cutoffKey, type NationalCutoff } from './nationalAdmissionRegistry.ts';
import { officialUniversities } from '../data/officialAdmissionSources.ts';
import {buildNationalPathwayCatalogue} from './nationalAdmissionPathways2026.ts';
const pathways2026=new Map(buildNationalPathwayCatalogue().map(p=>[JSON.stringify([p.universityId,p.campus,p.majorCode]),p]));
export type DiscoveryQuery = { year: number; interest: string; region: 'ALL'|'Bắc'|'Trung'|'Nam'; combination: string; universityId?: string };
const aliases: Record<string,string> = { cntt:'cong nghe thong tin', ai:'tri tue nhan tao', qtkd:'quan tri kinh doanh' };
const schoolMap = new Map(officialUniversities.map(s=>[s.id,s]));
/** Discovery only: a lexical interest match and observed combination are not admission eligibility. */
export function discoverNationalPrograms(query: DiscoveryQuery) {
 const needle=normalizeNational(query.interest);
 const term=Object.prototype.hasOwnProperty.call(aliases,needle)?aliases[needle]:needle;
 const combination=query.combination.trim().toUpperCase();
 if(![2024,2025,2026].includes(query.year)||term.length>100||(combination&&!/^[A-Z][A-Z0-9]{2}$/.test(combination)))return [];
 const groups=new Map<string,{universityId:string;university:string;campus:string;code:string;major:string;records:NationalCutoff[]}>();
 for(const row of nationalCutoffs) {
  if(row.year!==query.year||(query.universityId&&query.universityId!==row.universityId))continue;
  if(query.region!=='ALL'&&schoolMap.get(row.universityId)?.region!==query.region)continue;
  if(term&&!normalizeNational(`${row.major} ${row.code}`).includes(term))continue;
  const id=`${row.universityId}|${row.campus}|${row.code}`;
  const previous=groups.get(id);
  if(previous)previous.records.push(row);else groups.set(id,{universityId:row.universityId,university:row.university,campus:row.campus,code:row.code,major:row.major,records:[row]});
 }
 if(query.year===2026)for(const p of pathways2026.values()){
  if(query.universityId&&p.universityId!==query.universityId)continue;
  if(query.region!=='ALL'&&schoolMap.get(p.universityId)?.region!==query.region)continue;
  if(term&&!normalizeNational(`${p.majorName} ${p.majorCode}`).includes(term))continue;
  const id=`${p.universityId}|${p.campus}|${p.majorCode}`;
  if(!groups.has(id))groups.set(id,{universityId:p.universityId,university:p.universityName,campus:p.campus,code:p.majorCode,major:p.majorName,records:[]});
 }
 return [...groups.values()].map(group=>{
  // A listed match is descriptive only. A missing or different combination is never proof of ineligibility.
  const matchingKeys=combination?group.records.filter(r=>r.combinations?.includes(combination)).map(cutoffKey):[];
  const publishedEvidence=query.year===2026?(pathways2026.get(JSON.stringify([group.universityId,group.campus,group.code]))?.evidence??[]):[];
  const combinationStatus=!combination?'NOT_REQUESTED' as const:matchingKeys.length||publishedEvidence.some(e=>e.code===combination)?'LISTED' as const:'NOT_CONFIRMED' as const;
  return {...group,publishedEvidence,matchingKeys,combinationStatus,eligibility:'NOT_EVALUATED' as const,probability:null};
 }).sort((a,b)=>Number(b.combinationStatus==='LISTED')-Number(a.combinationStatus==='LISTED')||a.universityId.localeCompare(b.universityId)||a.code.localeCompare(b.code));
}
