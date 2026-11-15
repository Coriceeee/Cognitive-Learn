/**
 * Atlas 2026 preference WORKSHEET, not a Ministry of Education submission.
 * Learners own the ordering: heuristics never sort or silently delete choices.
 * There is no network write, persistence, cutoff prediction, or eligibility claim.
 */
import { ADMISSION_POLICY_2026 } from './aspirationPlanner';

export type AspirationDraftOrigin = 'ptit_bvh_source_2026' | 'student_entered';
export type AspirationDraftChoice = {
  id: string;
  universityName: string;
  majorName: string;
  majorCode: string;
  year: 2026;
  teacherTraining: boolean;
  origin: AspirationDraftOrigin;
  sourceUrl: string | null;
  combinations: string[];
};
export type DraftChange = {items: AspirationDraftChoice[]; error: string | null};
export type DraftReview = {blocking: string[]; cautions: string[]};

const text = (value: unknown, limit=120) => typeof value === 'string' ? value.trim().slice(0, limit) : '';
const keyText = (value:string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/gi,'d').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const safeHttpSource = (value:string|null):string|null => {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || url.hostname !== 'tuyensinh.ptit.edu.vn') return null;
    if (!url.pathname.includes('/de-an-tuyen-sinh/') || !url.pathname.includes('2026')) return null;
    return url.toString();
  } catch {return null;}
};
/** This flags risk, never silently reorders or removes an entry. */
export function looksLikeTeacherTraining(majorCode:string, majorName:string):boolean {
  const code=majorCode.replace(/[.\s-]/g,'');
  return /^71402\d{2}$/.test(code) || code==='51140201' || /^(?:sư phạm|su pham)(?:\s|$)/i.test(majorName.trim());
}
export function createManualDraftChoice(universityName:string, majorName:string, majorCode:string, teacherTraining=false):AspirationDraftChoice | null {
  const university=text(universityName);
  const major=text(majorName);
  const code=text(majorCode,30);
  if (!university || !major || !code) return null;
  return {
    id: `manual-${keyText(university)}-${keyText(code)}`,
    universityName:university, majorName:major, majorCode:code, year:2026,
    teacherTraining:teacherTraining || looksLikeTeacherTraining(code,major), origin:'student_entered',
    sourceUrl:null, combinations:[],
  };
}
/** Bound to the PTIT BVH published matcher; do not accept arbitrary unverified URLs. */
export function createPtitDraftChoice(input:{programId:string;universityName:string;majorName:string;majorCode:string;year:number;campus:string;officialSource:string;combinations:readonly {code:string}[]}):AspirationDraftChoice|null {
  const source = safeHttpSource(input.officialSource);
  if (input.year!==2026 || input.campus!=='BVH' || !source || !input.programId.startsWith('ptit-bvh-2026-')) return null;
  const major=text(input.majorName), code=text(input.majorCode,30);
  if (!major || !code || input.programId!==`ptit-bvh-2026-${code}`) return null;
  return {
    id:input.programId, universityName:'Học viện Công nghệ Bưu chính Viễn thông · BVH',
    majorName:major, majorCode:code, year:2026, origin:'ptit_bvh_source_2026',
    teacherTraining:looksLikeTeacherTraining(code,major), sourceUrl:source,
    combinations:Array.from(new Set(input.combinations.map(x=>text(x.code,8)).filter(Boolean))),
  };
}
export function addDraftChoice(items:readonly AspirationDraftChoice[], choice:AspirationDraftChoice|null):DraftChange {
  if (!choice) return {items:[...items],error:'Cần nhập tên trường, ngành và mã ngành hợp lệ.'};
  if (items.some(item=>item.id===choice.id || (
    keyText(item.universityName)===keyText(choice.universityName) && keyText(item.majorCode)===keyText(choice.majorCode)
  ))) return {items:[...items],error:'Chương trình này đã có trong danh sách.'};
  if (items.length>=ADMISSION_POLICY_2026.maxAspirations) return {items:[...items],error:'Danh sách nháp 2026 tối đa 15 nguyện vọng.'};
  return {items:[...items,choice],error:null};
}
export function removeDraftChoice(items:readonly AspirationDraftChoice[], id:string):AspirationDraftChoice[] {
  return items.filter(item=>item.id!==id);
}
export function moveDraftChoice(items:readonly AspirationDraftChoice[], id:string, direction:-1|1):AspirationDraftChoice[] {
  const result=[...items], index=result.findIndex(item=>item.id===id), next=index+direction;
  if (index<0 || next<0 || next>=result.length) return result;
  [result[index],result[next]]=[result[next],result[index]];
  return result;
}
export function reviewAspirationDraft(items:readonly AspirationDraftChoice[]):DraftReview {
  const blocking:string[] = [], cautions:string[]=[];
  if (items.length>ADMISSION_POLICY_2026.maxAspirations) blocking.push('Vượt 15 nguyện vọng theo quy tắc dự thảo 2026.');
  if (!items.length) cautions.push('Danh sách đang trống; hãy thêm chương trình bạn thực sự quan tâm.');
  items.forEach((item,index)=>{
    if(item.teacherTraining && index>=ADMISSION_POLICY_2026.teacherTrainingLastPriority)
      blocking.push(`NV${index+1}: ${item.majorName} thuộc nhóm đào tạo giáo viên; chính sách 2026 chỉ cho phép NV1–NV5.`);
    if(item.origin==='student_entered')
      cautions.push(`NV${index+1}: thông tin do học sinh tự nhập, chưa đối chiếu đề án trường và mã ngành.`);
  });
  cautions.push('Thứ tự chỉ phản ánh ưu tiên của học sinh; chưa kiểm chứng đủ điều kiện hoặc điểm chuẩn và không phải đăng ký chính thức.');
  return {blocking,cautions};
}
/** Intentionally excludes scores, email, UID, and any other student identifiers. */
export function makeAspirationDraftExport(items:readonly AspirationDraftChoice[]) {
  return {schema:'cla-atlas-aspiration-draft-v1',year:2026,officialSubmission:false,
    policyReference:ADMISSION_POLICY_2026.document,
    entries:items.map((item,index)=>({order:index+1, universityName:item.universityName,
      majorName:item.majorName,majorCode:item.majorCode,teacherTraining:item.teacherTraining,
      origin:item.origin,sourceUrl:item.sourceUrl,combinations:item.combinations})),
    review:reviewAspirationDraft(items)};
}

/** Import only explicit worksheet JSON. Imported claims lose their verified status.
 * A local file is NOT an authoritative university admissions source. */
export function importAspirationDraftExport(payload:unknown):DraftChange {
  if (!payload || typeof payload!=='object') return {items:[],error:'Tệp không đúng định dạng bản nháp CLA.'};
  const doc=payload as Record<string,unknown>;
  if (doc.schema!=='cla-atlas-aspiration-draft-v1' || doc.year!==2026 || !Array.isArray(doc.entries) || doc.entries.length>15)
    return {items:[],error:'Bản nháp không thuộc phiên bản CLA 2026 hoặc vượt 15 nguyện vọng.'};
  let items:AspirationDraftChoice[]=[];
  for (const raw of doc.entries) {
    if (!raw || typeof raw!=='object') return {items:[],error:'Có nguyện vọng không hợp lệ trong tệp.'};
    const entry=raw as Record<string,unknown>;
    if(typeof entry.universityName!=='string' || typeof entry.majorName!=='string' || typeof entry.majorCode!=='string')
      return {items:[],error:'Thiếu tên trường/ngành/mã ngành trong tệp.'};
    const choice=createManualDraftChoice(entry.universityName,entry.majorName,entry.majorCode,entry.teacherTraining===true);
    const next=addDraftChoice(items,choice);
    if(next.error) return {items:[],error:`Bản nháp có nội dung trùng lặp hoặc không hợp lệ: ${next.error}`};
    items=next.items;
  }
  return {items,error:null};
}
