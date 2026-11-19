import type {ExternalCutoff} from '../data/nationalAdmissionCutoffs.ts';
/** Offline reviewed factual tables only. This validates structure, not source authenticity. */
export type ReviewedColumn={method:string;label:string;scale:number};
export type ReviewedBatch={universityId:string;university:string;campus:string;source:string;officialHost:string;year:ExternalCutoff['year'];reviewedAt:string;note:string;columns:readonly ReviewedColumn[];names:Readonly<Record<string,string>>;table:string};
export function parseReviewedCutoffBatch(b:ReviewedBatch):ExternalCutoff[]{
 const url=new URL(b.source);
 if(url.protocol!=='https:'||url.hostname!==b.officialHost||url.username||url.password||url.port||![2024,2025,2026].includes(b.year)||!/^\d{4}-\d{2}-\d{2}$/.test(b.reviewedAt)||!b.universityId||!b.university||!b.campus||!b.note||!b.columns.length||new Set(b.columns.map(c=>c.method)).size!==b.columns.length||b.columns.some(c=>!c.method||!c.label||!Number.isFinite(c.scale)||c.scale<=0))throw Error('Invalid reviewed batch metadata');
 const seen=new Set<string>();const rows:ExternalCutoff[]=[];
 for(const line of b.table.trim().split('\n')){
  const [code,...values]=line.trim().split(/\s+/);const major=Object.prototype.hasOwnProperty.call(b.names,code)?b.names[code]:null;
  if(!/^[A-Z0-9]{2,20}$/.test(code)||!major||seen.has(code)||values.length!==b.columns.length||values.every(v=>v==='-'))throw Error('Invalid or duplicate reviewed row '+code);
  seen.add(code);
  values.forEach((raw,i)=>{if(raw==='-')return;const c=b.columns[i];if(!/^\d+(?:\.\d{1,2})?$/.test(raw)||Number(raw)>c.scale)throw Error('Invalid score '+code+' '+c.method);rows.push({universityId:b.universityId,university:b.university,campus:b.campus,source:b.source,year:b.year,reviewedAt:b.reviewedAt,note:b.note,code,major,method:c.method,label:c.label,scale:c.scale,cutoff:Number(raw)});});
 }
 return rows;
}
