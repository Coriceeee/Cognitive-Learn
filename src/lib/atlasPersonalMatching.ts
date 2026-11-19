import { admissionCombinations } from './examMethodRules.ts';
import { discoverNationalPrograms, type DiscoveryQuery } from './nationalProgramDiscovery.ts';
import { cutoffKey, normalizeNational } from './nationalAdmissionRegistry.ts';
import type { SubjectScoreMap, SubjectCode } from './admissionTypes.ts';
import {pathwayKindLabel} from './nationalAdmissionPathways2026.ts';
export const ATLAS_MATCHING_VERSION = 'atlas-personal-matching-v2';
export const interestDomains = [
 {id:'technology',label:'Lập trình, dữ liệu và công nghệ số',keywords:['công nghệ thông tin','khoa học máy tính','trí tuệ nhân tạo','khoa học dữ liệu','an toàn thông tin','kỹ thuật phần mềm','hệ thống thông tin','mạng máy tính','tin học']},
 {id:'engineering',label:'Thiết kế, chế tạo và hệ thống kỹ thuật',keywords:['kỹ thuật','cơ khí','tự động hóa','điện tử','điện -','xây dựng','robot','cơ điện tử']},
 {id:'health',label:'Chăm sóc sức khỏe và khoa học sự sống',keywords:['y khoa','dược học','điều dưỡng','răng hàm mặt','y học','hộ sinh','kỹ thuật xét nghiệm','công nghệ sinh học','dinh dưỡng']},
 {id:'business',label:'Kinh doanh, quản lý và tài chính',keywords:['kinh tế','quản trị','kinh doanh','marketing','tài chính','kế toán','kiểm toán','logistics','thương mại']},
 {id:'humanities',label:'Ngôn ngữ, xã hội và truyền thông',keywords:['ngôn ngữ','văn học','báo chí','truyền thông','xã hội học','tâm lý học','quan hệ quốc tế','đông phương','việt nam học','nhân học']},
 {id:'education',label:'Dạy học và phát triển giáo dục',keywords:['sư phạm','giáo dục','quản lý giáo dục']},
 {id:'science',label:'Khám phá và nghiên cứu khoa học',keywords:['toán học','vật lý học','hóa học','sinh học','khoa học môi trường','khoa học vật liệu','địa chất','khí tượng','hải dương']},
 {id:'law',label:'Pháp luật và chính sách',keywords:['luật','chính sách công','quản lý nhà nước']},
 {id:'creative',label:'Thiết kế và sáng tạo nội dung',keywords:['thiết kế','mỹ thuật','đa phương tiện','nghệ thuật','kiến trúc']},
] as const;
export type InterestDomainId = typeof interestDomains[number]['id'];
export type SchoolEvidence = {termId:string;termLabel:string;scores:SubjectScoreMap;source:'student_transcripts'|'legacy'};
export function observedCombinations(evidence: SchoolEvidence | null) {
 if (!evidence || !evidence.termId.trim() || !evidence.termLabel.trim()) return [];
 return admissionCombinations.flatMap(c=>{
  const values=c.subjects.map(subject=>evidence.scores[subject]);
  if(!values.every((v):v is number=>typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=10)) return [];
  const subjects=c.subjects.map((subject,i)=>({subject,score:values[i]})) as {subject:SubjectCode;score:number}[];
  return [{code:c.code,label:c.label,subjects,total:Math.round(values.reduce((a,b)=>a+b,0)*100)/100}];
 }).sort((a,b)=>b.total-a.total||a.code.localeCompare(b.code));
}
/** Lexical interest discovery plus same-term subject evidence. No career psychometrics or admission forecast. */
export function matchNationalPrograms(query:DiscoveryQuery, domains:readonly InterestDomainId[], evidence:SchoolEvidence|null, requireObservedListed=false) {
 const selected=interestDomains.filter(d=>domains.includes(d.id));
 const observed=observedCombinations(evidence);
 const result=discoverNationalPrograms(query).flatMap(p=>{
  const name=normalizeNational(p.major);
  const reasons=selected.flatMap(d=>d.keywords.filter(k=>name.includes(normalizeNational(k))).map(keyword=>({domain:d.id,keyword})));
  if(selected.length&&!reasons.length)return [];
  const supported=p.records.flatMap(r=>observed.filter(c=>r.combinations?.includes(c.code)&&(!query.combination.trim()||query.combination.trim().toUpperCase()===c.code)).map(c=>({combination:c.code,subjectScores:c.subjects,schoolTotal:c.total,recordKey:cutoffKey(r),source:r.source,method:r.label})));
  // 2026 scheme evidence is distinct from cutoff records. Never attach its
  // combinations to a different method/scale or use old years as evidence.
  if(evidence&&evidence.termId.trim()&&evidence.termLabel.trim())for(const e of p.publishedEvidence){
   if(!e.subjects||e.subjects.some(s=>s==='technologyIndustry'||s==='technologyAgriculture')||(query.combination.trim()&&query.combination.trim().toUpperCase()!==e.code))continue;
   if(supported.some(s=>s.combination===e.code&&s.source===e.source))continue;
   const subjects=e.subjects as readonly SubjectCode[];const values=subjects.map(s=>evidence.scores[s]);
   if(!values.every((v):v is number=>typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=10))continue;
   supported.push({combination:e.code,subjectScores:subjects.map((subject,i)=>({subject,score:values[i]})),schoolTotal:Math.round(values.reduce((sum,v)=>sum+v,0)*100)/100,recordKey:`scheme|${p.universityId}|${p.campus}|${p.code}|${e.code}|${e.kind}`,source:e.source,method:pathwayKindLabel(e.kind)});
  }
  if(requireObservedListed&&!supported.length)return [];
  return [{...p,interestMatches:reasons,academicEvidence:supported,academicStatus:!evidence?'NO_SCHOOL_EVIDENCE' as const:supported.length?'LISTED_WITH_OBSERVED_SUBJECTS' as const:'NOT_CONFIRMED' as const,termId:evidence?.termId??null,modelVersion:ATLAS_MATCHING_VERSION,careerFitScore:null,probability:null}];
 });
 return result.sort((a,b)=>Number(b.academicEvidence.length>0)-Number(a.academicEvidence.length>0));
}
