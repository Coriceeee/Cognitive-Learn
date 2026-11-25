import {DTHU_SCHEME_2026,DTHU_METHOD_LABELS,dthuSchemeRows2026} from '../data/dthuScheme2026.ts';
/** National, evidence-bounded programme catalogue; no eligibility or probability inference. */
import {nationalCutoffs, normalizeNational} from './nationalAdmissionRegistry.ts';
import {officialUniversities} from '../data/officialAdmissionSources.ts';
import {verifiedPrograms} from '../data/verifiedAdmissionPrograms.ts';
import {ctuCombinations2026,aguCombinations2026,uitCombinations2026,CTU_SCHEME_2026,AGU_SCHEME_2026,AGU_CNTT_2026,UIT_SCHEME_2026} from '../data/publishedAdmissionCombinations2026.ts';
import {HCMUS_SCHEME_2026,hcmusCombinations2026} from '../data/hcmusCombinations2026.ts';
import {officialSchemeRows2026,qnuSubjects} from '../data/officialSchemePrograms2026.ts';
import type {AtlasProgram,AtlasAdmissionSource,AtlasUniversity} from './atlasKnowledgeBase';
import type {SubjectCode,SubjectScoreMap} from './admissionTypes';
import type {ExamElective2026} from './examChoiceEngine';

type ExamSubject=SubjectCode|ExamElective2026;
// CTU 2026 appendix, common A/B/C/D codes; no generic technology-score mapping.
// Legacy GDCD variants (C14/C19/C20/D66) are not silently equated with GDKT&PL.
const STANDARD:Readonly<Record<string,readonly ExamSubject[]>>={
 A00:['math','physics','chemistry'], A01:['math','physics','english'], A02:['math','physics','biology'],
 A03:['math','physics','history'], A04:['math','physics','geography'], A05:['math','chemistry','history'], A06:['math','chemistry','geography'], A07:['math','history','geography'],
 B00:['math','chemistry','biology'],B01:['math','biology','history'],B02:['math','biology','geography'],B03:['math','biology','literature'],B04:['math','biology','civicEducation'],B08:['math','biology','english'],
 C00:['literature','history','geography'],C01:['literature','math','physics'],C02:['literature','math','chemistry'],C03:['literature','math','history'],C04:['literature','math','geography'],
 D01:['literature','math','english'],D07:['math','chemistry','english'],D08:['math','biology','english'],D09:['math','history','english'],D10:['math','geography','english'],D11:['literature','physics','english'],D14:['literature','history','english'],D15:['literature','geography','english'],
};
const CTU_X:Readonly<Record<string,readonly ExamSubject[]>>={X01:['math','literature','civicEducation'],X02:['math','literature','informatics'],X06:['math','physics','informatics'],X07:['math','physics','technologyIndustry'],X10:['math','chemistry','informatics'],X11:['math','chemistry','technologyIndustry'],X12:['math','chemistry','technologyAgriculture'],X16:['math','biology','technologyAgriculture'],X25:['math','civicEducation','english'],X26:['math','informatics','english'],X27:['math','technologyIndustry','english'],X28:['math','technologyAgriculture','english'],X70:['literature','history','civicEducation'],X74:['literature','geography','civicEducation'],X78:['literature','civicEducation','english']};
const AGU_X:Readonly<Record<string,readonly ExamSubject[]>>=Object.fromEntries(['X01','X06','X10','X25','X26','X27','X28'].map(k=>[k,CTU_X[k]]).concat([['X08',['math','technologyAgriculture','physics']]]));
// B04 (legacy GDCD) is not applied to GDKT&PL without an explicit source.
const HTU_X:Readonly<Record<string,readonly ExamSubject[]>>={X01:CTU_X.X01,X02:CTU_X.X02,X06:CTU_X.X06,X10:CTU_X.X10,X14:['math','biology','informatics'],X21:['math','geography','civicEducation'],X26:CTU_X.X26,X78:CTU_X.X78};
const UIT_X:Readonly<Record<string,readonly ExamSubject[]>>={X02:CTU_X.X02,X06:CTU_X.X06,X14:HTU_X.X14,X26:CTU_X.X26};
const HCMUS_X:Readonly<Record<string,readonly ExamSubject[]>>={X06:CTU_X.X06,X10:CTU_X.X10,X11:CTU_X.X11,X12:CTU_X.X12,X14:HTU_X.X14,X15:['math','technologyIndustry','biology'],X16:['math','biology','technologyAgriculture'],X26:CTU_X.X26};
const DTHU_X:Readonly<Record<string,readonly ExamSubject[]>>={...Object.fromEntries(['X01','X02','X06','X07','X10','X11','X16','X26','X27','X28','X70','X74','X78'].map(k=>[k,CTU_X[k]])),X03:['math','literature','technologyIndustry'],X04:['math','literature','technologyAgriculture'],X08:['math','physics','technologyAgriculture'],X14:['math','biology','informatics'],D13:['literature','biology','english']};
export type PathwayEvidenceKind='THPT_PUBLISHED'|'COMPOSITE_PUBLISHED'|'BASE_COMBINATION'|'ATLAS_REVIEWED'|'THPT_WITH_APTITUDE';
export type PathwayEvidence={code:string;kind:PathwayEvidenceKind;source:string;subjects:readonly ExamSubject[]|null;reviewedAt:string};
export type PathwayProgram={id:string;universityId:string;universityName:string;campus:string;majorCode:string;majorName:string;year:2026;sourceUrl:string;sourceKind:'scheme'|'cutoff'|'reviewed';methods:readonly string[];evidence:PathwayEvidence[];publishedQuota?:number;publishedMethodCodes?:readonly string[];otherExamRoutes?:readonly string[];schemeNote?:string;combinationFormat?:'named_subjects'|'codes'};
export type PathwayMatch=PathwayEvidence&{observedScore:number|null};
export type PathwayEntry=PathwayProgram&{status:'MATCH'|'UNCONFIRMED'|'NO_OBSERVED_MATCH'|'NO_PAIR';matches:PathwayMatch[];matchesTarget:boolean};
export const officialPathwaySchools=officialUniversities.map(u=>({id:u.id,name:u.name,source:u.years.find(y=>y.year===2026)?.schemeUrl??u.portalUrl}));
const officialSchoolMap=new Map(officialUniversities.map(u=>[u.id,u]));
const programId=(school:string,campus:string,code:string)=>JSON.stringify([school,campus,code,2026]);
export function safePathwayUrl(raw:string):string|null {try{const url=new URL(raw);return url.protocol==='https:'&&!url.username&&!url.password?url.href:null;}catch{return null;}}
function subjectsFor(code:string,school:string):readonly ExamSubject[]|null {
 if(code==='B04')return null;
 return STANDARD[code]??(school==='hcmus'?HCMUS_X[code]:school==='uit'?UIT_X[code]:school==='ctu'?CTU_X[code]:school==='agu'?AGU_X[code]:school==='htu'?HTU_X[code]:school==='dthu'?DTHU_X[code]:school==='ptit'&&['X06','X26'].includes(code)?CTU_X[code]:undefined)??null;
}
function makeEvidence(codes:readonly string[],kind:PathwayEvidenceKind,source:string,school:string,reviewedAt:string):PathwayEvidence[]{return [...new Set(codes)].filter(c=>/^[A-Z][A-Z0-9]{2}$/.test(c)).map(code=>({code,kind,source,subjects:subjectsFor(code,school),reviewedAt}));}
const baseCatalogue=(()=>{
 const groups=new Map<string,PathwayProgram>();
 for(const row of nationalCutoffs){if(row.year!==2026)continue;const source=safePathwayUrl(row.source);if(!source)continue;
  const id=programId(row.universityId,row.campus,row.code);let p=groups.get(id);
  if(!p){p={id,universityId:row.universityId,universityName:officialSchoolMap.get(row.universityId)?.name??row.university,campus:row.campus,majorCode:row.code,majorName:row.major,year:2026,sourceUrl:source,sourceKind:'cutoff',methods:[],evidence:[]};groups.set(id,p);}
  p.methods=[...new Set([...p.methods,row.label])];
  const kind:PathwayEvidenceKind|null=row.method==='TNUE_BASE'||row.method==='HUST_THPT_A00'?'BASE_COMBINATION':row.method.startsWith('USSH_THPT_')?'THPT_PUBLISHED':null;
  if(kind)p.evidence.push(...makeEvidence(row.combinations??(row.method==='HUST_THPT_A00'?['A00']:[]),kind,source,row.universityId,row.reviewedAt));
 }
 const dthuByCode=new Map(dthuSchemeRows2026.map(row=>[row.code,row]));
 const matchedDthu=new Set<string>();
 for(const p of groups.values()){
  const isCTU=p.universityId==='ctu',isAGU=p.universityId==='agu';
  const codes=isCTU?ctuCombinations2026[p.majorCode]:isAGU?aguCombinations2026[p.majorCode]:undefined;
  if(codes){const source=isCTU?CTU_SCHEME_2026:p.majorCode==='7480201'?AGU_CNTT_2026:AGU_SCHEME_2026;
   p.sourceUrl=source;p.sourceKind='scheme';p.evidence.push(...makeEvidence(codes,isCTU?'THPT_PUBLISHED':'COMPOSITE_PUBLISHED',source,p.universityId,'2026-11-18'));
   p.methods=[...new Set([...p.methods,isCTU?'THPT · theo danh mục 2026':'Tổng hợp · tổ hợp ngành 2026'])];}
  if(p.universityId==='dthu'){
   const row=dthuByCode.get(p.majorCode);
   if(row){
    if(matchedDthu.has(row.code))throw Error('Ambiguous DTHU campus mapping: '+row.code);matchedDthu.add(row.code);
    p.sourceUrl=DTHU_SCHEME_2026;p.sourceKind='scheme';p.publishedQuota=row.quota;p.publishedMethodCodes=row.methodCodes;p.otherExamRoutes=row.combinationCodes.includes('NL1')?['NL1 · ĐGNL ĐHQG-HCM (không phải tổ hợp ba môn)']:[];
    p.methods=[...new Set([...row.methodCodes.map(m=>`PT ${m} · ${DTHU_METHOD_LABELS[m]} (đề án)`),...p.methods])];
    p.schemeNote='Đề án dự kiến 2026, mục 4.1–4.2; chỉ tiêu và điều kiện có thể đã thay đổi. '+(row.requiresAptitudeReview?'Cần đối chiếu điều kiện thi năng khiếu; không tự xác nhận khớp ba môn. ':'')+'Phương thức liệt kê theo ngành, không áp dụng mặc định cho mọi tổ hợp.';
    const codes=row.combinationCodes.filter(c=>c!=='NL1');
    p.evidence.push(...makeEvidence(codes,row.requiresAptitudeReview?'THPT_WITH_APTITUDE':'THPT_PUBLISHED',DTHU_SCHEME_2026,'dthu','2026-11-18').map(e=>row.requiresAptitudeReview?{...e,subjects:null}:e));
    // Independent programme page corroborates the six CNTT subject codes; retain separate source link outside deduplicated evidence.
    if(p.majorCode==='7480201')p.schemeNote+=' Trang ngành CNTT cũng công bố sáu mã tổ hợp.';
   }else p.schemeNote='Có điểm chuẩn công bố nhưng mã không có trong bảng đề án 2026 đã nhập; cần đối chiếu nguồn cập nhật.';
  }
  if(p.universityId==='uit') {
   const codes=uitCombinations2026[p.majorCode];
   if(codes) {
    p.sourceUrl=UIT_SCHEME_2026;p.sourceKind='scheme';
    p.evidence.push(...makeEvidence(codes,'COMPOSITE_PUBLISHED',UIT_SCHEME_2026,'uit','2026-11-25'));
    p.methods=[...new Set([...p.methods,'Xét tuyển tổng hợp · THPT/ĐGNL kết hợp học bạ'])];
    p.schemeNote='Đề án tuyển sinh UIT 2026 công bố tổ hợp theo từng chương trình cho phương thức xét tuyển tổng hợp. Điểm chuẩn năm 2026 được công bố riêng trên thang 100; không so trực tiếp với thang THPT 30 hoặc ĐGNL 1.200 của các năm trước.';
   }
  }
  if(p.universityId==='hcmus') {
   const codes=hcmusCombinations2026[p.majorCode];
   if(codes) {
    p.sourceUrl=HCMUS_SCHEME_2026;p.sourceKind='scheme';
    p.evidence.push(...makeEvidence(codes,'COMPOSITE_PUBLISHED',HCMUS_SCHEME_2026,'hcmus','2026-11-25'));
    p.methods=[...new Set([...p.methods,'Xét tuyển tổng hợp · THPT/ĐGNL kết hợp học bạ 03 năm'])];
    p.schemeNote='Đề án HCMUS 2026 công bố tổ hợp theo ngành/nhóm ngành cho phương thức xét tuyển tổng hợp. Điểm chuẩn cùng năm được công bố theo phương thức tổng hợp (THPT hoặc ĐGNL kết hợp học bạ), không phải điểm THPT thô và không được dùng làm kết luận đủ điều kiện.';
   }
  }
  if(p.universityId==='ptit') {const v=verifiedPrograms.find(x=>x.campus===p.campus&&x.code===p.majorCode&&x.availableYears.includes(2026));if(v&&safePathwayUrl(v.source2026)){
   p.sourceUrl=v.source2026;p.sourceKind='scheme';p.evidence.push(...makeEvidence(v.combinations2026,'THPT_PUBLISHED',v.source2026,'ptit','2026-11-08'));}}
 }
 const hcmusCount=[...groups.values()].filter(p=>p.universityId==='hcmus'&&p.evidence.some(e=>e.kind==='COMPOSITE_PUBLISHED')).length;
 if(hcmusCount!==Object.keys(hcmusCombinations2026).length)throw Error('HCMUS 2026 programme/combinations inventory mismatch');
 if(matchedDthu.size!==dthuSchemeRows2026.length)throw Error('DTHU scheme contains unmatched programme codes: review before joining');
 // Scheme-only programmes do not depend on the existence of a published cutoff.
 for(const row of officialSchemeRows2026){
  const school=officialSchoolMap.get(row.school);const source=safePathwayUrl(row.source);
  if(!school||!source||!school.years.some(y=>y.year===2026&&y.schemeUrl===row.source))throw Error('Scheme source mismatch');
  const campus='Chưa phân tách cơ sở';const id=programId(row.school,campus,row.code);
  if([...groups.values()].some(p=>p.universityId===row.school&&p.majorCode===row.code))throw Error('Scheme/cutoff collision requires explicit campus reconciliation: '+row.code);
  const methodLabels:Record<string,string>=row.school==='htu'?{'1':'THPT','2':'Học bạ','3':'ĐGNL/TSA','4':'THPT nước ngoài','5':'Tuyển thẳng/ưu tiên'}:{'1':'THPT','2':'Học bạ','3':'ĐGNL ĐHQG-HCM','4':'ĐGNL ĐHSP Hà Nội','5':'THPT + năng khiếu'};
  const aptitude=row.school==='qnu'?row.methodNumbers.includes('5'):row.code==='7140201';
  const kind:PathwayEvidenceKind=aptitude?'THPT_WITH_APTITUDE':'THPT_PUBLISHED';
  const evidence:PathwayEvidence[]=row.school==='htu'?makeEvidence(row.combinations,kind,source,row.school,'2026-11-18'):row.combinations.map(raw=>{
   const parts=[...raw].map(c=>qnuSubjects[c]);if(parts.length!==3||parts.some(p=>!p)||new Set(raw).size!==3)throw Error('Invalid named combination '+raw);
   return {code:parts.map(p=>p.name).join(' + '),kind,source,reviewedAt:'2026-11-18',subjects:parts.every(p=>p.subject!==null)?parts.map(p=>p.subject as ExamSubject):null};
  });
  groups.set(id,{id,universityId:row.school,universityName:school.name,campus,majorCode:row.code,majorName:row.major,year:2026,sourceUrl:source,sourceKind:'scheme',methods:[...row.methodNumbers.map(m=>methodLabels[m]),...(row.school==='qnu'?['Tuyển thẳng theo quy chế']:[])],evidence,publishedQuota:row.quota,combinationFormat:row.school==='qnu'?'named_subjects':'codes'});
 }
 return [...groups.values()];
})();
// Admin-reviewed programme sources are accepted only for the same school/year,
// official source type, verified school, and a host corroborated by the school's
// website or existing official registry. Unknown campuses remain explicit.
export function buildNationalPathwayCatalogue(programs:readonly AtlasProgram[]=[],sources:readonly AtlasAdmissionSource[]=[],universities:Readonly<Record<string,AtlasUniversity>>={}):PathwayProgram[]{
 const result=[...baseCatalogue];const existing=new Set(result.map(p=>JSON.stringify([p.universityId,p.majorCode])));
 const bySource=new Map(sources.map(s=>[s.id,s]));const added=new Set<string>();
 for(const p of programs){const uni=universities[p.universityId];if(p.status!=='verified'||p.sourceYear!==2026||!uni?.verified||!p.majorCode.trim()||!p.majorName.trim())continue;
  // No campus in Firestore schema: don't merge or duplicate an already catalogued code.
  if(existing.has(JSON.stringify([p.universityId,p.majorCode])))continue;
  const official=officialSchoolMap.get(p.universityId);const hosts=new Set([uni.website,official?.portalUrl,...(official?.years.flatMap(y=>[y.schemeUrl,y.cutoffUrl])??[])].flatMap(url=>{const safe=url&&safePathwayUrl(url);return safe?[new URL(safe).hostname]:[]}));
  const source=p.sourceIds.map(id=>bySource.get(id)).find(s=>s&&s.universityId===p.universityId&&s.sourceYear===2026&&s.status==='verified'&&s.sourceType!=='manual'&&safePathwayUrl(s.sourceUrl)&&hosts.has(new URL(s.sourceUrl).hostname));
  if(!source)continue;const campus='Chưa rõ cơ sở';const id=programId(p.universityId,campus,p.majorCode);if(added.has(id))continue;added.add(id);
  result.push({id,universityId:p.universityId,universityName:uni.name,campus,majorCode:p.majorCode,majorName:p.majorName,year:2026,sourceUrl:source.sourceUrl,sourceKind:'reviewed',methods:p.methods,evidence:p.methods.includes('THPT')?makeEvidence(p.combinations,'ATLAS_REVIEWED',source.sourceUrl,p.universityId,source.updatedAt):[]});
 }
 return result.sort((a,b)=>a.universityName.localeCompare(b.universityName,'vi')||a.majorName.localeCompare(b.majorName,'vi')||a.id.localeCompare(b.id));
}
const validElectives=new Set<ExamElective2026>(['english','physics','chemistry','biology','history','geography','civicEducation','informatics','technologyIndustry','technologyAgriculture']);
const observed=(x:unknown):x is number=>typeof x==='number'&&Number.isFinite(x)&&x>=0&&x<=10;
export function matchNationalPathways2026(catalogue:readonly PathwayProgram[],electives:readonly ExamElective2026[]=[],scores:SubjectScoreMap={},targetMajor=''){
 const pair=electives.length===2&&new Set(electives).size===2&&electives.every(e=>validElectives.has(e));
 const available=new Set<ExamSubject>(['math','literature',...electives]);const target=normalizeNational(targetMajor);
 const needle=target==='cntt'?'cong nghe thong tin':target==='ai'?'tri tue nhan tao':target==='qtkd'?'quan tri kinh doanh':target;
 const entries:PathwayEntry[]=catalogue.map(p=>{
  const matches:PathwayMatch[]=pair?p.evidence.filter(e=>e.subjects&&e.subjects.every(s=>available.has(s))).map(e=>{const ss=e.subjects!;const values=ss.map(s=>s==='technologyIndustry'||s==='technologyAgriculture'?undefined:scores[s]);const observedScore=values.every(observed)?Math.round((values as number[]).reduce((a,b)=>a+b,0)*100)/100:null;return {...e,observedScore};}):[];
  const status:PathwayEntry['status']=!pair?'NO_PAIR':matches.length?'MATCH':p.evidence.some(e=>e.subjects)?'NO_OBSERVED_MATCH':'UNCONFIRMED';
  return {...p,status,matches,matchesTarget:Boolean(needle)&&normalizeNational(`${p.majorName} ${p.majorCode}`).includes(needle)};
 });
 entries.sort((a,b)=>Number(b.status==='MATCH')-Number(a.status==='MATCH')||Number(b.matchesTarget)-Number(a.matchesTarget)||a.universityName.localeCompare(b.universityName,'vi')||a.majorName.localeCompare(b.majorName,'vi'));
 const matches=entries.filter(p=>p.status==='MATCH');
 const counts=new Map<string,{id:string;name:string;matched:number;total:number}>();for(const p of entries){const s=counts.get(p.universityId)??{id:p.universityId,name:p.universityName,matched:0,total:0};s.total++;if(p.status==='MATCH')s.matched++;counts.set(s.id,s);}
 return {pair,entries,matches,targetMatches:matches.filter(p=>p.matchesTarget).length,schools:[...counts.values()].sort((a,b)=>b.matched-a.matched||a.name.localeCompare(b.name,'vi')),publishedProgramCount:entries.filter(p=>p.evidence.length).length,unconfirmedCount:entries.filter(p=>p.status==='UNCONFIRMED').length};
}
export function filterNationalPathways(entries:readonly PathwayEntry[],query:string,school:string,onlyMatched:boolean){const term=normalizeNational(query);const needle=term==='cntt'?'cong nghe thong tin':term==='ai'?'tri tue nhan tao':term;return entries.filter(p=>(!school||p.universityId===school)&&(!onlyMatched||p.status==='MATCH')&&(!needle||normalizeNational(`${p.universityName} ${p.universityId} ${officialSchoolMap.get(p.universityId)?.admissionCode??''} ${p.campus} ${p.majorName} ${p.majorCode}`).includes(needle)));}
export const pathwayStatusLabel=(s:PathwayEntry['status'])=>s==='MATCH'?'Khớp tổ hợp có nguồn':s==='UNCONFIRMED'?'Chưa đủ dữ liệu tổ hợp':s==='NO_OBSERVED_MATCH'?'Chưa thấy tổ hợp khớp trong nguồn đã nhập':'Chưa chọn cặp môn';
export const pathwayKindLabel=(kind:PathwayEvidenceKind)=>kind==='THPT_PUBLISHED'?'THPT công bố':kind==='COMPOSITE_PUBLISHED'?'Tổ hợp phương thức tổng hợp':kind==='BASE_COMBINATION'?'Tổ hợp gốc công bố':kind==='THPT_WITH_APTITUDE'?'THPT kết hợp năng khiếu': 'Nguồn Atlas đã duyệt';
