import { institutionDiscoveryCrosswalk, institutionDiscoveryNames, institutionDiscoverySource } from '../data/institutionDiscovery2026.ts';
import { officialUniversities, type OfficialUniversity } from '../data/officialAdmissionSources.ts';
export type DiscoveryInstitution = {id:string;name:string;registryId:string|null;admissionCode:string|null;aliases:string[];directoryRow:number|null;portal:string|null;source:string;status:'REGISTRY_SOURCE'|'DISCOVERY_ONLY'};
export function foldInstitution(s:string){return s.normalize('NFD').toLocaleLowerCase('vi').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/[^a-z0-9]+/g,' ').trim();}
export function buildInstitutionDiscovery(registry:readonly OfficialUniversity[]=officialUniversities,names:readonly string[]=institutionDiscoveryNames,crosswalk:Readonly<Record<number,string>>=institutionDiscoveryCrosswalk):DiscoveryInstitution[]{
 const map=new Map(registry.map(r=>[r.id,r]));if(map.size!==registry.length)throw Error('Duplicate registry id');
 const seen=new Set<string>(),linked=new Set<string>();
 for(const [row,id] of Object.entries(crosswalk)){if(!/^\d+$/.test(row)||Number(row)<1||Number(row)>names.length||!map.has(id)||linked.has(id))throw Error('Invalid institution crosswalk');linked.add(id);}
 const rows=names.map((name,i):DiscoveryInstitution=>{
   const key=foldInstitution(name); if(!key||seen.has(key)||name.length>120)throw Error('Invalid/duplicate directory name');seen.add(key);
   const n=i+1,school=map.get(crosswalk[n]);
   return {id:`${institutionDiscoverySource.id}:${n}`,name,registryId:school?.id??null,admissionCode:school?.admissionCode??null,aliases:school?[school.name,school.id]:[],directoryRow:n,portal:school?.portalUrl??null,source:institutionDiscoverySource.url,status:school?'REGISTRY_SOURCE':'DISCOVERY_ONLY'};
 });
 for(const s of registry)if(!linked.has(s.id))rows.push({id:`registry:${s.id}`,name:s.name,registryId:s.id,admissionCode:s.admissionCode??null,aliases:[s.id],directoryRow:null,portal:s.portalUrl,source:s.portalUrl,status:'REGISTRY_SOURCE'});
 return rows;
}
export const institutionDiscovery=buildInstitutionDiscovery();
export function searchInstitutions(query:string,scope:'ALL'|'REGISTRY_SOURCE'|'DISCOVERY_ONLY'='ALL',rows:readonly DiscoveryInstitution[]=institutionDiscovery){
 const q=foldInstitution(query);const filtered=rows.filter(r=>scope==='ALL'||r.status===scope);
 if(!q)return [...filtered].sort((a,b)=>a.name.localeCompare(b.name,'vi'));
 const rank=(r:DiscoveryInstitution)=>{const fields=[r.name,...r.aliases,...(r.admissionCode?[r.admissionCode]:[])].map(foldInstitution);if(fields.includes(q))return 3;if(fields.some(a=>a.startsWith(q)))return 2;return fields.some(a=>q.split(' ').every(t=>a.includes(t)))?1:0;};
 return filtered.map(row=>({row,rank:rank(row)})).filter(x=>x.rank>0).sort((a,b)=>b.rank-a.rank||a.row.name.localeCompare(b.row.name,'vi')).map(x=>x.row);
}
/** Exact full-name match only; never expand a parent university to a different child. */
export function exactDiscoveryInstitution(query:string){const q=foldInstitution(query);const hits=institutionDiscovery.filter(r=>foldInstitution(r.name)===q);return q&&hits.length===1?hits[0]:null;}
export function institutionDiscoverySummary(rows:readonly DiscoveryInstitution[]=institutionDiscovery){return {scope:'PARTIAL_DISCOVERY_INDEX' as const,nationalDenominator:null,entries:rows.length,surveyEntries:rows.filter(r=>r.directoryRow!==null).length,registryEntries:rows.filter(r=>r.status==='REGISTRY_SOURCE').length,discoveryOnly:rows.filter(r=>r.status==='DISCOVERY_ONLY').length,explicitlyLinked:rows.filter(r=>r.directoryRow!==null&&r.registryId!==null).length};}
/** Safe public query text; preserve school identity, avoid punctuation outside the query contract. */
export const institutionQueryText=(row:DiscoveryInstitution)=>row.name.replace(/[–—]/g,'-');
