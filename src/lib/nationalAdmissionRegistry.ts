import { externalCutoffs, type ExternalCutoff } from '../data/nationalAdmissionCutoffs.ts';
import { verifiedPrograms, ptit2026MethodScales } from '../data/verifiedAdmissionPrograms.ts';
export type NationalCutoff = Omit<ExternalCutoff, 'scale'> & { scale: number | null };
export const nationalCutoffs: NationalCutoff[] = [
 ...verifiedPrograms.flatMap(p => [
  ...Object.entries(ptit2026MethodScales).map(([method,m]) => ({universityId:'ptit',university:'PTIT',campus:p.campus,code:p.code,major:p.major,year:2026 as const,method,label:m.label,scale:m.scale,cutoff:p.cutoffs2026.values[method as keyof typeof ptit2026MethodScales],source:p.cutoffs2026.source,note:p.cutoffs2026.tieBreak ?? 'Kiểm tra tiêu chí phụ ở nguồn.',reviewedAt:p.cutoffs2026.reviewedAt})),
  ...p.historicalCutoffs.map(h=>({universityId:'ptit',university:'PTIT',campus:p.campus,code:p.code,major:p.major,year:h.year,method:h.admissionTrack,label:h.admissionTrack==='THPT'?'Thi THPT':'Điểm chuẩn chung công bố',scale:h.admissionTrack==='THPT'?30:null,cutoff:h.cutoff,source:h.source,note:h.tieBreak,reviewedAt:'2026-11-08'})),
 ]), ...externalCutoffs,
];
export const cutoffKey = (r:NationalCutoff) => `${r.universityId}|${r.campus}|${r.code}|${r.year}|${r.method}`;
export const getCutoff = (key:string) => nationalCutoffs.find(r=>cutoffKey(r)===key);
export function compareNationalCutoff(key:string, raw:string) {
 const r=getCutoff(key); if(!r || r.scale===null || !/^\d+(?:[.,]\d{1,2})?$/.test(raw.trim()))return null;
 const score=Number(raw.replace(',','.')); if(!Number.isFinite(score)||score<0||score>r.scale)return null;
 return {...r,score,gap:Math.round((score-r.cutoff)*100)/100,probability:null,eligibility:'NOT_EVALUATED' as const};
}
export const normalizeNational=(s:string)=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').trim().replace(/\s+/g,' ');
export const externalMethodAliases: Readonly<Record<string,string>> = {
 DTHU_THPT:'THPT', DTHU_HB:'học bạ', DTHU_VSAT:'V-SAT', DTHU_DGNL:'ĐGNL',
 HCMUS_2025_THPT_A00:'THPT A00', HCMUS_2025_DGNL:'ĐGNL', HCMUS_2025_CERT_THPT:'chứng chỉ + học bạ',
 UIT_2024_THPT:'THPT', UIT_2024_DGNL:'ĐGNL', UIT_2025_THPT:'THPT', UIT_2025_DGNL:'ĐGNL',
 UIT_2026_COMPOSITE:'tổng hợp',
 AGU_COMPOSITE:'tổng hợp', CTU_COMMON:'chung', CTU_THPT_2024:'THPT', NEU_COMMON:'chung', HUST_THPT_A00:'THPT A00', HUST_TSA_A00:'TSA A00',
 VNU_COMMON:'chung', TNUE_BASE:'tổ hợp gốc', USSH_THPT_D01:'THPT D01', USSH_THPT_C00:'THPT C00', USSH_HSA_Q21:'HSA Q21', UEB_JOINT_THPT:'liên kết THPT', UEB_JOINT_HB:'liên kết học bạ', UEB_JOINT_HSA:'liên kết HSA',
};
import { officialUniversities } from '../data/officialAdmissionSources.ts';
const universityAliases: [string,string][] = [
 ...officialUniversities.flatMap(u=>[[normalizeNational(u.id),u.id],[normalizeNational(u.name),u.id],...(u.admissionCode?[[normalizeNational(u.admissionCode),u.id]]:[])] as [string,string][]),
 ['dai hoc kinh te quoc dan','neu'],['dai hoc an giang','agu'],['dai hoc can tho','ctu'],['bach khoa ha noi','hust'],['qhx','usshhn'],['qhi','uet'],['qht','hus'],['qhf','ulis'],['qhy','vnuump'],['qhe','ueb'],['qhs','vnuued'],['qhl','vnulaw'],['qhq','vnuis'],
];
export function answerNationalCutoff(question:string){
 if(question.length>160)return null;
 const m=/^diem chuan (.+?) (2024|2025|2026) (.+?)\??$/.exec(normalizeNational(question));
 if(!m)return null;
 const school=universityAliases.filter(([alias])=>m[1].startsWith(alias+' ')).sort((a,b)=>b[0].length-a[0].length)[0];
 if(!school)return null;
 const [alias,id]=school;const raw=m[1].slice(alias.length+1);const needle=raw==='cntt'?'cong nghe thong tin':raw;
 const method=normalizeNational(m[3]);
 const rows=externalCutoffs.filter(r=>r.universityId===id&&r.year===Number(m[2])&&externalMethodAliases[r.method]&&normalizeNational(externalMethodAliases[r.method])===method&&(normalizeNational(r.code)===needle||normalizeNational(r.major)===needle));
 if(rows.length!==1)return null;
 const r=rows[0];return {source:r.source,answer:`${r.university} · ${r.major} (${r.code}) · ${r.year} · ${r.label}: ${r.cutoff.toFixed(2)}/${r.scale} điểm công bố. ${r.note} Đây là dữ liệu lịch sử, không phải dự báo đỗ.`};
}

/** Same school, campus and admission code only. A year slot is never imputed. */
export function nationalProgramHistory(key: string) {
 const selected=getCutoff(key);
 if(!selected)return [];
 return ([2024,2025,2026] as const).map(year=>({year, records:nationalCutoffs.filter(r=>r.universityId===selected.universityId&&r.campus===selected.campus&&r.code===selected.code&&r.year===year)}));
}
