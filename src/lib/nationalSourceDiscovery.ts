import { parsePublicQuery, parsePublicCandidates, safePublicUrl, type PublicCandidate, type PublicQuery } from './publicSourceSearch.ts';
import { officialUniversities } from '../data/officialAdmissionSources.ts';
import { exactDiscoveryInstitution } from './institutionDiscovery.ts';

export const NATIONAL_SOURCE_DISCOVERY_VERSION='cla-national-source-discovery-v1';
export const MOET_ADMISSIONS_PORTAL='https://tuyensinh.moet.gov.vn/ts/';
export const MOET_INSTITUTION_DIRECTORY='https://tuyensinh.moet.gov.vn/ts/thong-tin';
export type NationalSourceQuery={version:2;topic:'admission';subject:string;endYear:number;confirmedPublic:true};
export type NationalYearStatus='UNVERIFIED_CANDIDATES'|'NO_RESULTS'|'PROVIDER_NOT_CONFIGURED'|'PROVIDER_UNAVAILABLE';
export type NationalYearResult={year:number;status:NationalYearStatus;results:PublicCandidate[]};
export const yearWindow=(endYear:number)=>[endYear,endYear-1,endYear-2];
export function parseNationalSourceQuery(value:unknown):NationalSourceQuery|null {
 const p=value&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:null;
 if(!p||Object.keys(p).some(k=>!['version','topic','subject','endYear','confirmedPublic'].includes(k))||p.version!==2||p.topic!=='admission'||typeof p.endYear!=='number'||!Number.isInteger(p.endYear)||p.endYear<2022)return null;
 const q=parsePublicQuery({version:1,topic:p.topic,subject:p.subject,year:p.endYear,confirmedPublic:p.confirmedPublic});
 return q?{version:2,topic:'admission',subject:q.subject,endYear:p.endYear,confirmedPublic:true}:null;
}
export function nationalYearQueries(q:NationalSourceQuery):PublicQuery[]{return yearWindow(q.endYear).map(year=>({version:1,topic:'admission',subject:q.subject,year,confirmedPublic:true}));}
const fold=(s:string)=>s.toLocaleLowerCase('vi').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').trim().replace(/\s+/g,' ');
export function localNationalSources(q:NationalSourceQuery,year:number){
 // No inference from field tags. Match institution names, registry IDs or explicit acronyms.
 const subject=fold(q.subject);const exact=exactDiscoveryInstitution(q.subject);return officialUniversities.filter(u=>exact?u.id===exact.registryId:fold(u.id)===subject||(u.admissionCode&&fold(u.admissionCode)===subject)||fold(u.name).includes(subject)).flatMap(u=>{const record=u.years.find(y=>y.year===year);return record?[{title:u.name+' · '+record.schemeLabel,url:record.schemeUrl},...(record.cutoffUrl?[{title:u.name+' · Điểm trúng tuyển '+year,url:record.cutoffUrl}]:[])]:[];}).filter(s=>safePublicUrl(s.url));
}
export function nationalSearchLinks(q:NationalSourceQuery,year:number){
 const base=`${q.subject} ${year}`;return [
 {label:'Đề án · ngành · tổ hợp · phương thức',query:`${base} thông tin tuyển sinh đại học chính quy đề án ngành tổ hợp phương thức site:edu.vn`},
 {label:'Điểm trúng tuyển · thang điểm · quy đổi',query:`${base} điểm trúng tuyển đại học chính quy quy đổi site:edu.vn`},
 {label:'Học phí · chỉ tiêu · điều kiện',query:`${base} học phí chỉ tiêu điều kiện tuyển sinh site:edu.vn`},
 {label:'Mở rộng nguồn ngoài .edu.vn',query:`${base} tuyển sinh đại học chính thức đề án điểm chuẩn`},
 ].map(({label,query})=>({label,url:`https://www.google.com/search?q=${encodeURIComponent(query)}`}));
}
export function emptyNationalYears(q:NationalSourceQuery,status:'PROVIDER_NOT_CONFIGURED'|'PROVIDER_UNAVAILABLE'):NationalYearResult[]{return yearWindow(q.endYear).map(year=>({year,status,results:[]}));}
/** Strictly bind response slots to requested years. A candidate never becomes a verified admission record. */
export function parseNationalYearResults(raw:unknown,q:NationalSourceQuery):NationalYearResult[]{
 const p=raw&&typeof raw==='object'?raw as Record<string,unknown>:null;
 if(p?.version!==NATIONAL_SOURCE_DISCOVERY_VERSION||!Array.isArray(p.years))return emptyNationalYears(q,'PROVIDER_UNAVAILABLE');
 const rows=p.years as unknown[];
 return yearWindow(q.endYear).map(year=>{
 const hits=rows.filter(r=>r&&typeof r==='object'&&(r as Record<string,unknown>).year===year);
 if(hits.length!==1)return {year,status:'PROVIDER_UNAVAILABLE',results:[]};
 const row=hits[0] as Record<string,unknown>;
 if(row.status==='PROVIDER_NOT_CONFIGURED'||row.status==='PROVIDER_UNAVAILABLE'||row.status==='NO_RESULTS')return {year,status:row.status,results:[]};
 if(row.status!=='UNVERIFIED_CANDIDATES')return {year,status:'PROVIDER_UNAVAILABLE',results:[]};
 const results=parsePublicCandidates(row);return {year,status:results.length?'UNVERIFIED_CANDIDATES':'NO_RESULTS',results};
 });
}
